-- ============================================================================
-- 20260618130000_critical_patches.sql
-- Patches críticos identificados em auditoria 18/06/2026:
--   1. Corrigir trigger_notificacoes_evento (referenciava colunas inexistentes
--      e tipos errados — bloqueava sync de eventos).
--   2. Ampliar publication realtime para chat / notificações / reações / eventos.
--   3. Restaurar cron de fechamento de apostas especiais quando prazo vence.
--   4. Defesa em profundidade: trigger BEFORE UPDATE em bolao_palpites
--      impedindo alteração de palpite após confirmação (mesmo via service_role).
--   5. Corrigir agregações em atualizar_ranking_geral (zeb_count, camp_pt,
--      art_pt, vice_pt sobrescreviam em vez de somar).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Corrigir trigger de notificações de evento.
--    Schema real de bolao_jogo_eventos: id, jogo_id, minuto, periodo, tipo,
--    time, jogador, detalhe (jsonb), fonte, criado_em.
--    sync-copa grava tipo como 'Goal' / 'Card' / 'subst' / 'Other'.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trigger_notificacoes_evento()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  j RECORD;
  is_red boolean := false;
BEGIN
  SELECT time_casa, time_fora, placar_casa, placar_fora
    INTO j FROM public.bolao_jogos WHERE id = NEW.jogo_id;

  IF NEW.tipo = 'Goal' OR NEW.tipo = 'GOAL' THEN
    INSERT INTO public.bolao_notificacoes (usuario_id, titulo, conteudo, tipo, link)
    VALUES (
      NULL,
      '⚽ GOOOOL!',
      COALESCE(NEW.minuto::text, '?') || ''': ' ||
      COALESCE(NEW.jogador, 'Gol') ||
      CASE WHEN NEW.time IS NOT NULL THEN ' (' || NEW.time || ')' ELSE '' END ||
      ' — ' || COALESCE(j.time_casa,'?') || ' ' ||
      COALESCE(j.placar_casa::text,'0') || ' x ' ||
      COALESCE(j.placar_fora::text,'0') || ' ' ||
      COALESCE(j.time_fora,'?'),
      'gol',
      '/jogos/' || NEW.jogo_id
    );
  ELSIF NEW.tipo = 'Card' OR NEW.tipo = 'RED_CARD' THEN
    -- Apenas cartão vermelho gera notificação. Para 'Card' precisamos olhar detalhe.
    IF NEW.tipo = 'RED_CARD' THEN
      is_red := true;
    ELSIF NEW.detalhe IS NOT NULL THEN
      is_red := (
        (NEW.detalhe->>'card') ILIKE '%red%'
        OR (NEW.detalhe->>'tipo') ILIKE '%red%'
        OR (NEW.detalhe->>'detail') ILIKE '%red%'
        OR (NEW.detalhe->>'cartao') ILIKE '%vermelho%'
      );
    END IF;

    IF is_red THEN
      INSERT INTO public.bolao_notificacoes (usuario_id, titulo, conteudo, tipo, link)
      VALUES (
        NULL,
        '🟥 Cartão Vermelho!',
        COALESCE(NEW.minuto::text, '?') || ''': ' ||
        COALESCE(NEW.jogador, 'Jogador') ||
        CASE WHEN NEW.time IS NOT NULL THEN ' (' || NEW.time || ')' ELSE '' END ||
        ' em ' || COALESCE(j.time_casa,'?') || ' x ' || COALESCE(j.time_fora,'?'),
        'cartao',
        '/jogos/' || NEW.jogo_id
      );
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Nunca quebra o sync por causa de notificação
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Ampliar publication realtime.
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  -- bolao_chat_mensagens
  BEGIN
    EXECUTE 'ALTER TABLE public.bolao_chat_mensagens REPLICA IDENTITY FULL';
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bolao_chat_mensagens';
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL;
  END;

  -- bolao_chat_reacoes
  BEGIN
    EXECUTE 'ALTER TABLE public.bolao_chat_reacoes REPLICA IDENTITY FULL';
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bolao_chat_reacoes';
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL;
  END;

  -- bolao_notificacoes
  BEGIN
    EXECUTE 'ALTER TABLE public.bolao_notificacoes REPLICA IDENTITY FULL';
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bolao_notificacoes';
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL;
  END;

  -- bolao_jogo_eventos
  BEGIN
    EXECUTE 'ALTER TABLE public.bolao_jogo_eventos REPLICA IDENTITY FULL';
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bolao_jogo_eventos';
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL;
  END;

  -- bolao_usuarios (para ranking ao vivo)
  BEGIN
    EXECUTE 'ALTER TABLE public.bolao_usuarios REPLICA IDENTITY FULL';
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.bolao_usuarios';
  EXCEPTION WHEN duplicate_object THEN NULL; WHEN undefined_table THEN NULL;
  END;
END$$;

-- ---------------------------------------------------------------------------
-- 3. Restaurar cron de fechamento de apostas especiais.
--    A função bolao_cron_block_specials foi DROPPADA em 20260615170000.
--    Recriamos exatamente como antes (não toca em prazos atuais — admin é
--    quem define prazo_fim em cada bolao_config_*).
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bolao_cron_block_specials()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  prazo timestamptz;
  affected int;
BEGIN
  -- FINALISTAS
  SELECT prazo_fim INTO prazo FROM public.bolao_config_finalistas WHERE id = 1;
  IF prazo IS NOT NULL AND now() >= prazo THEN
    UPDATE public.bolao_config_finalistas SET status = 'fechada' WHERE id = 1 AND status = 'aberta';
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected > 0 THEN
      UPDATE public.bolao_apostas_finalistas SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
      INSERT INTO public.bolao_automacoes_log (acao, status, detalhes) VALUES (
        'bloqueio_finalistas', 'ok', jsonb_build_object('prazo_fim', prazo)
      );
    END IF;
  END IF;

  -- CAMPEAO
  SELECT prazo_fim INTO prazo FROM public.bolao_config_campeao WHERE id = 1;
  IF prazo IS NOT NULL AND now() >= prazo THEN
    UPDATE public.bolao_config_campeao SET status = 'fechada' WHERE id = 1 AND status = 'aberta';
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected > 0 THEN
      UPDATE public.bolao_apostas_campeao SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
      INSERT INTO public.bolao_automacoes_log (acao, status, detalhes) VALUES (
        'bloqueio_campeao', 'ok', jsonb_build_object('prazo_fim', prazo)
      );
    END IF;
  END IF;

  -- ZEBRA
  SELECT prazo_fim INTO prazo FROM public.bolao_config_zebra WHERE id = 1;
  IF prazo IS NOT NULL AND now() >= prazo THEN
    UPDATE public.bolao_config_zebra SET status = 'fechada' WHERE id = 1 AND status = 'aberta';
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected > 0 THEN
      UPDATE public.bolao_apostas_zebra SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
      INSERT INTO public.bolao_automacoes_log (acao, status, detalhes) VALUES (
        'bloqueio_zebra', 'ok', jsonb_build_object('prazo_fim', prazo)
      );
    END IF;
  END IF;

  -- GOLEADA
  SELECT prazo_fim INTO prazo FROM public.bolao_config_goleada WHERE id = 1;
  IF prazo IS NOT NULL AND now() >= prazo THEN
    UPDATE public.bolao_config_goleada SET status = 'fechada' WHERE id = 1 AND status = 'aberta';
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected > 0 THEN
      UPDATE public.bolao_apostas_goleada SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
      INSERT INTO public.bolao_automacoes_log (acao, status, detalhes) VALUES (
        'bloqueio_goleada', 'ok', jsonb_build_object('prazo_fim', prazo)
      );
    END IF;
  END IF;

  -- ARTILHEIRO
  SELECT prazo_fim INTO prazo FROM public.bolao_config_artilheiro WHERE id = 1;
  IF prazo IS NOT NULL AND now() >= prazo THEN
    UPDATE public.bolao_config_artilheiro SET status = 'fechada' WHERE id = 1 AND status = 'aberta';
    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected > 0 THEN
      UPDATE public.bolao_apostas_artilheiro SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
      INSERT INTO public.bolao_automacoes_log (acao, status, detalhes) VALUES (
        'bloqueio_artilheiro', 'ok', jsonb_build_object('prazo_fim', prazo)
      );
    END IF;
  END IF;
END;
$$;

DO $$
BEGIN
  PERFORM cron.unschedule('bolao-block-specials');
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

DO $$
BEGIN
  PERFORM cron.schedule('bolao-block-specials', '*/5 * * * *',
    $cron$SELECT public.bolao_cron_block_specials();$cron$);
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

-- ---------------------------------------------------------------------------
-- 4. Defesa em profundidade: imutabilidade de palpites confirmados.
--    A edge function palpite-placar já bloqueia, mas se alguém usar a
--    service_role key direto, hoje passa. Trigger fecha o buraco.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bolao_palpite_imutavel()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- Só bloqueia se já estava confirmado e alguém tentou alterar/excluir
  IF TG_OP = 'UPDATE' THEN
    IF OLD.gols_casa IS DISTINCT FROM NEW.gols_casa
       OR OLD.gols_fora IS DISTINCT FROM NEW.gols_fora
       OR OLD.usuario_id IS DISTINCT FROM NEW.usuario_id
       OR OLD.jogo_id IS DISTINCT FROM NEW.jogo_id THEN
      RAISE EXCEPTION 'Palpite confirmado é imutável (id=%, usuario=%, jogo=%)',
        OLD.id, OLD.usuario_id, OLD.jogo_id
        USING ERRCODE = '23514';
    END IF;
    -- Permite atualização de campos não-críticos (ex: ip_usuario fix-up)
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Palpite confirmado não pode ser excluído (id=%)', OLD.id
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bolao_palpite_imutavel_trg ON public.bolao_palpites;
CREATE TRIGGER bolao_palpite_imutavel_trg
BEFORE UPDATE OR DELETE ON public.bolao_palpites
FOR EACH ROW EXECUTE FUNCTION public.bolao_palpite_imutavel();

-- ---------------------------------------------------------------------------
-- 5. Corrigir atualizar_ranking_geral():
--    - zeb_count / camp_pt / art_pt / vice_pt eram setados via loop com
--      SET (sobrescreve em vez de somar). Substituímos por agregados.
--    - vice_real é deduzido tomando o time dos finalistas que NÃO é o
--      campeao_real; a versão original era equivalente, mas a deixamos
--      mais robusta.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.atualizar_ranking_geral()
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  camp_real text;
  art_real text;
  zeb_real text;
  vice_real text;
  rec RECORD;
  pos int := 0;
  prev_rank int;
  curr_id uuid;
  ultrapassado_cur RECORD;
BEGIN
  -- Carrega configurações reais (apuradas)
  SELECT campeao_real INTO camp_real FROM public.bolao_config_campeao WHERE id = 1 AND status = 'apurada';
  SELECT artilheiro_real INTO art_real FROM public.bolao_config_artilheiro WHERE id = 1 AND status = 'apurada';
  SELECT zebra_real INTO zeb_real FROM public.bolao_config_zebra WHERE id = 1 AND status = 'apurada';

  -- Vice = finalista que NÃO é o campeão real
  SELECT CASE
           WHEN time1 = camp_real THEN time2
           WHEN time2 = camp_real THEN time1
           ELSE NULL
         END
    INTO vice_real
  FROM public.bolao_config_finalistas
  WHERE id = 1 AND status = 'apurada';

  -- Tabela temporária
  CREATE TEMP TABLE IF NOT EXISTS temp_scores (
    usuario_id uuid PRIMARY KEY,
    pts_placares int DEFAULT 0,
    ac_placar int DEFAULT 0,
    ac_resultado int DEFAULT 0,
    zeb_count int DEFAULT 0,
    gol_count int DEFAULT 0,
    camp_pt int DEFAULT 0,
    art_pt int DEFAULT 0,
    vice_pt int DEFAULT 0,
    pts_total int DEFAULT 0
  ) ON COMMIT DROP;
  TRUNCATE temp_scores;

  INSERT INTO temp_scores (usuario_id)
  SELECT id FROM public.bolao_usuarios WHERE excluido_manualmente = false;

  -- Pontos de placar (jogos encerrados/apurados)
  FOR rec IN
    SELECT
      p.usuario_id,
      SUM(
        CASE
          WHEN p.gols_casa = j.placar_casa AND p.gols_fora = j.placar_fora THEN 10
          WHEN SIGN(p.gols_casa - p.gols_fora) = SIGN(j.placar_casa - j.placar_fora) THEN
            5 + CASE WHEN ABS(p.gols_casa - j.placar_casa) <= 1 AND ABS(p.gols_fora - j.placar_fora) <= 1 THEN 2 ELSE 0 END
          WHEN ABS(p.gols_casa - j.placar_casa) <= 1 AND ABS(p.gols_fora - j.placar_fora) <= 1 THEN 2
          ELSE 0
        END +
        CASE
          WHEN ABS(j.placar_casa - j.placar_fora) >= 4 AND SIGN(p.gols_casa - p.gols_fora) = SIGN(j.placar_casa - j.placar_fora) THEN 5
          ELSE 0
        END
      ) AS pts_placares,
      COUNT(*) FILTER (WHERE p.gols_casa = j.placar_casa AND p.gols_fora = j.placar_fora) AS ac_placar,
      COUNT(*) FILTER (
        WHERE (p.gols_casa <> j.placar_casa OR p.gols_fora <> j.placar_fora)
          AND SIGN(p.gols_casa - p.gols_fora) = SIGN(j.placar_casa - j.placar_fora)
      ) AS ac_resultado,
      COUNT(*) FILTER (
        WHERE ABS(j.placar_casa - j.placar_fora) >= 4
          AND SIGN(p.gols_casa - p.gols_fora) = SIGN(j.placar_casa - j.placar_fora)
      ) AS gol_count
    FROM public.bolao_palpites p
    JOIN public.bolao_jogos j ON j.id = p.jogo_id
    WHERE j.placar_casa IS NOT NULL AND j.placar_fora IS NOT NULL
      AND (j.status = 'encerrado' OR j.status = 'apurado')
    GROUP BY p.usuario_id
  LOOP
    UPDATE temp_scores
    SET pts_placares = COALESCE(rec.pts_placares, 0),
        ac_placar    = COALESCE(rec.ac_placar, 0),
        ac_resultado = COALESCE(rec.ac_resultado, 0),
        gol_count    = COALESCE(rec.gol_count, 0)
    WHERE usuario_id = rec.usuario_id;
  END LOOP;

  -- Apostas especiais agregadas (somam corretamente caso haja múltiplas)
  UPDATE temp_scores ts
  SET zeb_count = sub.cnt
  FROM (
    SELECT usuario_id,
           COUNT(*) FILTER (
             WHERE acertou = true OR (zeb_real IS NOT NULL AND zebra_apostada = zeb_real)
           ) AS cnt
    FROM public.bolao_apostas_zebra
    GROUP BY usuario_id
  ) sub
  WHERE ts.usuario_id = sub.usuario_id;

  UPDATE temp_scores ts
  SET camp_pt = sub.pt
  FROM (
    SELECT usuario_id,
           CASE WHEN bool_or(acertou = true OR (camp_real IS NOT NULL AND time_campeao = camp_real))
                THEN 50 ELSE 0 END AS pt
    FROM public.bolao_apostas_campeao
    GROUP BY usuario_id
  ) sub
  WHERE ts.usuario_id = sub.usuario_id;

  UPDATE temp_scores ts
  SET art_pt = sub.pt
  FROM (
    SELECT usuario_id,
           CASE WHEN bool_or(acertou = true OR (art_real IS NOT NULL AND jogador_apostado = art_real))
                THEN 30 ELSE 0 END AS pt
    FROM public.bolao_apostas_artilheiro
    GROUP BY usuario_id
  ) sub
  WHERE ts.usuario_id = sub.usuario_id;

  UPDATE temp_scores ts
  SET vice_pt = sub.pt
  FROM (
    SELECT usuario_id,
           CASE WHEN bool_or(vice_real IS NOT NULL AND (time1 = vice_real OR time2 = vice_real))
                THEN 25 ELSE 0 END AS pt
    FROM public.bolao_apostas_finalistas
    GROUP BY usuario_id
  ) sub
  WHERE ts.usuario_id = sub.usuario_id;

  -- Total
  UPDATE temp_scores
  SET pts_total = COALESCE(pts_placares,0)
                + (COALESCE(zeb_count,0) * 10)
                + COALESCE(camp_pt,0)
                + COALESCE(art_pt,0)
                + COALESCE(vice_pt,0);

  -- Salva rank anterior
  UPDATE public.bolao_usuarios
  SET posicao_ranking_anterior = COALESCE(posicao_ranking, 1);

  -- Recalcula ranking ordenado
  pos := 0;
  FOR rec IN
    SELECT ts.usuario_id, ts.pts_total, ts.ac_placar, ts.ac_resultado,
           ts.zeb_count, ts.gol_count, ts.camp_pt, ts.art_pt, ts.vice_pt,
           u.nome
    FROM temp_scores ts
    JOIN public.bolao_usuarios u ON u.id = ts.usuario_id
    WHERE u.excluido_manualmente = false
    ORDER BY ts.pts_total DESC, ts.ac_placar DESC, ts.ac_resultado DESC, u.nome ASC
  LOOP
    pos := pos + 1;
    SELECT posicao_ranking INTO prev_rank FROM public.bolao_usuarios WHERE id = rec.usuario_id;

    UPDATE public.bolao_usuarios
    SET pontos                  = rec.pts_total,
        acertos_placar          = rec.ac_placar,
        acertos_resultado       = rec.ac_resultado,
        zebras                  = rec.zeb_count,
        goleadas                = rec.gol_count,
        campeao_acertos         = CASE WHEN rec.camp_pt > 0 THEN 1 ELSE 0 END,
        artilheiro_acertos      = CASE WHEN rec.art_pt > 0 THEN 1 ELSE 0 END,
        vice_campeao_acertos    = CASE WHEN rec.vice_pt > 0 THEN 1 ELSE 0 END,
        posicao_ranking         = pos
    WHERE id = rec.usuario_id;

    -- Notificação de ultrapassagem (quem foi ultrapassado por este usuário)
    IF prev_rank IS NOT NULL AND prev_rank > pos THEN
      FOR ultrapassado_cur IN
        SELECT id, nome FROM public.bolao_usuarios
        WHERE posicao_ranking_anterior >= pos
          AND posicao_ranking_anterior < prev_rank
          AND id <> rec.usuario_id
          AND excluido_manualmente = false
      LOOP
        INSERT INTO public.bolao_notificacoes (usuario_id, titulo, conteudo, tipo, link)
        VALUES (
          ultrapassado_cur.id,
          '📈 Você foi ultrapassado!',
          rec.nome || ' passou à sua frente no ranking.',
          'ultrapassado',
          '/ranking'
        );
      END LOOP;
    END IF;
  END LOOP;

  -- Notificação global de ranking atualizado
  INSERT INTO public.bolao_notificacoes (usuario_id, titulo, conteudo, tipo, link)
  VALUES (NULL, '🏆 Ranking atualizado',
          'O ranking foi recalculado.', 'ranking', '/ranking');
END;
$$;

-- Recalcula uma vez para refletir os fixes
SELECT public.atualizar_ranking_geral();
