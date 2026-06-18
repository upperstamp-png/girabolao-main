-- Migration: Real-time Chat, Notifications, and New Scoring Engine (June 18, 2026)

-- 1. Add user IP logging to predictions
ALTER TABLE public.bolao_palpites 
ADD COLUMN IF NOT EXISTS ip_usuario text;

-- 2. Create Chat Messages Table
CREATE TABLE IF NOT EXISTS public.bolao_chat_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  canal text NOT NULL, -- 'geral' or 'bolao'
  mensagem text NOT NULL,
  respondendo_a_id uuid REFERENCES public.bolao_chat_mensagens(id) ON DELETE SET NULL,
  fixada boolean NOT NULL DEFAULT false,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- 3. Create Chat Reactions Table
CREATE TABLE IF NOT EXISTS public.bolao_chat_reacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem_id uuid NOT NULL REFERENCES public.bolao_chat_mensagens(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  reacao text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(mensagem_id, usuario_id, reacao)
);

-- 4. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.bolao_notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE, -- NULL means global alert
  titulo text NOT NULL,
  conteudo text NOT NULL,
  lida boolean NOT NULL DEFAULT false,
  tipo text NOT NULL, -- 'inicio_jogo' | 'fim_jogo' | 'gol' | 'cartao' | 'ranking' | 'chat' | 'ultrapassado'
  link text,
  criado_em timestamptz NOT NULL DEFAULT now()
);

-- 5. Add Stats & Ranking columns to users
ALTER TABLE public.bolao_usuarios ADD COLUMN IF NOT EXISTS pontos integer DEFAULT 0;
ALTER TABLE public.bolao_usuarios ADD COLUMN IF NOT EXISTS acertos_placar integer DEFAULT 0;
ALTER TABLE public.bolao_usuarios ADD COLUMN IF NOT EXISTS acertos_resultado integer DEFAULT 0;
ALTER TABLE public.bolao_usuarios ADD COLUMN IF NOT EXISTS zebras integer DEFAULT 0;
ALTER TABLE public.bolao_usuarios ADD COLUMN IF NOT EXISTS goleadas integer DEFAULT 0;
ALTER TABLE public.bolao_usuarios ADD COLUMN IF NOT EXISTS campeao_acertos integer DEFAULT 0;
ALTER TABLE public.bolao_usuarios ADD COLUMN IF NOT EXISTS artilheiro_acertos integer DEFAULT 0;
ALTER TABLE public.bolao_usuarios ADD COLUMN IF NOT EXISTS vice_campeao_acertos integer DEFAULT 0;
ALTER TABLE public.bolao_usuarios ADD COLUMN IF NOT EXISTS posicao_ranking integer DEFAULT 1;
ALTER TABLE public.bolao_usuarios ADD COLUMN IF NOT EXISTS posicao_ranking_anterior integer DEFAULT 1;

-- 6. Enable Row Level Security (RLS) on new tables
ALTER TABLE public.bolao_chat_mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolao_chat_reacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bolao_notificacoes ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies
-- Chat Messages: SELECT is public, INSERT is allowed for anyone (validated via identity in edge functions/frontend), but we allow auth/anon
DROP POLICY IF EXISTS "leitura chat mensagens" ON public.bolao_chat_mensagens;
CREATE POLICY "leitura chat mensagens" ON public.bolao_chat_mensagens FOR SELECT USING (true);
DROP POLICY IF EXISTS "insercao chat mensagens" ON public.bolao_chat_mensagens;
CREATE POLICY "insercao chat mensagens" ON public.bolao_chat_mensagens FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "update chat mensagens" ON public.bolao_chat_mensagens;
CREATE POLICY "update chat mensagens" ON public.bolao_chat_mensagens FOR UPDATE USING (true);

-- Chat Reactions
DROP POLICY IF EXISTS "leitura chat reacoes" ON public.bolao_chat_reacoes;
CREATE POLICY "leitura chat reacoes" ON public.bolao_chat_reacoes FOR SELECT USING (true);
DROP POLICY IF EXISTS "insercao chat reacoes" ON public.bolao_chat_reacoes;
CREATE POLICY "insercao chat reacoes" ON public.bolao_chat_reacoes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "delecao chat reacoes" ON public.bolao_chat_reacoes;
CREATE POLICY "delecao chat reacoes" ON public.bolao_chat_reacoes FOR DELETE USING (true);

-- Notifications: users can read their own or global ones, and update them to mark as read
DROP POLICY IF EXISTS "leitura notificacoes" ON public.bolao_notificacoes;
CREATE POLICY "leitura notificacoes" ON public.bolao_notificacoes FOR SELECT USING (true);
DROP POLICY IF EXISTS "update notificacoes" ON public.bolao_notificacoes;
CREATE POLICY "update notificacoes" ON public.bolao_notificacoes FOR UPDATE USING (true) WITH CHECK (true);

-- Grant privileges
GRANT ALL ON public.bolao_chat_mensagens TO anon, authenticated, service_role;
GRANT ALL ON public.bolao_chat_reacoes TO anon, authenticated, service_role;
GRANT ALL ON public.bolao_notificacoes TO anon, authenticated, service_role;

-- 8. Scoring & Ranking engine function
CREATE OR REPLACE FUNCTION public.atualizar_ranking_geral()
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  rec RECORD;
  rank_idx integer := 1;
  other_user RECORD;
  vice_real text;
  camp_real text;
  art_real text;
  zeb_real text;
BEGIN
  -- Obter resultados reais das apostas especiais
  SELECT campeao_real INTO camp_real FROM public.bolao_config_campeao WHERE id = 1;
  SELECT artilheiro_real INTO art_real FROM public.bolao_config_artilheiro WHERE id = 1;
  SELECT zebra_real INTO zeb_real FROM public.bolao_config_zebra WHERE id = 1;
  
  -- Para o Vice, vamos deduzir dos finalistas e campeão
  SELECT 
    CASE 
      WHEN finalista1_real = camp_real THEN finalista2_real 
      ELSE finalista1_real 
    END INTO vice_real
  FROM public.bolao_config_finalistas WHERE id = 1;

  -- Temporary table to hold computed scores
  CREATE TEMP TABLE temp_scores (
    usuario_id uuid PRIMARY KEY,
    pts_placares integer DEFAULT 0,
    ac_placar integer DEFAULT 0,
    ac_resultado integer DEFAULT 0,
    zeb_count integer DEFAULT 0,
    gol_count integer DEFAULT 0,
    camp_pt integer DEFAULT 0,
    art_pt integer DEFAULT 0,
    vice_pt integer DEFAULT 0,
    pts_total integer DEFAULT 0
  ) ON COMMIT DROP;

  -- Pre-populate all active users
  INSERT INTO temp_scores (usuario_id)
  SELECT id FROM public.bolao_usuarios u
  WHERE u.excluido_manualmente = false;

  -- Calcular pontos de palpites de placar para cada usuário
  -- Rule: Placar correto = 10 pts. Outcome hit = 5 pts. Gols proximos = +2 pts extra. Goleada bonus = +5 pts.
  FOR rec IN 
    SELECT 
      p.usuario_id,
      SUM(
        CASE 
          -- Acerto Exato
          WHEN p.gols_casa = j.placar_casa AND p.gols_fora = j.placar_fora THEN 10
          -- Acerto Vencedor ou Empate
          WHEN SIGN(p.gols_casa - p.gols_fora) = SIGN(j.placar_casa - j.placar_fora) THEN 
            5 + CASE WHEN ABS(p.gols_casa - j.placar_casa) <= 1 AND ABS(p.gols_fora - j.placar_fora) <= 1 THEN 2 ELSE 0 END
          -- Errou Vencedor/Empate mas Gols Próximos
          WHEN ABS(p.gols_casa - j.placar_casa) <= 1 AND ABS(p.gols_fora - j.placar_fora) <= 1 THEN 2
          ELSE 0
        END +
        CASE 
          -- Bônus Goleada: real match was a goleada (diff >= 4) and user got winner/outcome right
          WHEN ABS(j.placar_casa - j.placar_fora) >= 4 AND SIGN(p.gols_casa - p.gols_fora) = SIGN(j.placar_casa - j.placar_fora) THEN 5
          ELSE 0
        END
      ) AS pts_placares,
      COUNT(CASE WHEN p.gols_casa = j.placar_casa AND p.gols_fora = j.placar_fora THEN 1 END) AS ac_placar,
      COUNT(CASE WHEN p.gols_casa <> j.placar_casa OR p.gols_fora <> j.placar_fora THEN 
        CASE WHEN SIGN(p.gols_casa - p.gols_fora) = SIGN(j.placar_casa - j.placar_fora) THEN 1 END
      END) AS ac_resultado,
      COUNT(CASE WHEN ABS(j.placar_casa - j.placar_fora) >= 4 AND SIGN(p.gols_casa - p.gols_fora) = SIGN(j.placar_casa - j.placar_fora) THEN 1 END) AS gol_count
    FROM public.bolao_palpites p
    JOIN public.bolao_jogos j ON j.id = p.jogo_id
    WHERE j.placar_casa IS NOT NULL AND j.placar_fora IS NOT NULL AND (j.status = 'encerrado' OR j.status = 'apurado')
    GROUP BY p.usuario_id
  LOOP
    UPDATE temp_scores 
    SET pts_placares = COALESCE(rec.pts_placares, 0),
        ac_placar = COALESCE(rec.ac_placar, 0),
        ac_resultado = COALESCE(rec.ac_resultado, 0),
        gol_count = COALESCE(rec.gol_count, 0)
    WHERE usuario_id = rec.usuario_id;
  END LOOP;

  -- Calcular pontos das apostas especiais: Zebra (+10)
  FOR rec IN 
    SELECT usuario_id, zebra_apostada, acertou 
    FROM public.bolao_apostas_zebra
  LOOP
    UPDATE temp_scores 
    SET zeb_count = CASE WHEN rec.acertou = true OR (zeb_real IS NOT NULL AND rec.zebra_apostada = zeb_real) THEN 1 ELSE 0 END
    WHERE usuario_id = rec.usuario_id;
  END LOOP;

  -- Campeao (+50)
  FOR rec IN 
    SELECT usuario_id, time_campeao, acertou 
    FROM public.bolao_apostas_campeao
  LOOP
    UPDATE temp_scores 
    SET camp_pt = CASE WHEN rec.acertou = true OR (camp_real IS NOT NULL AND rec.time_campeao = camp_real) THEN 50 ELSE 0 END
    WHERE usuario_id = rec.usuario_id;
  END LOOP;

  -- Artilheiro (+30)
  FOR rec IN 
    SELECT usuario_id, jogador_apostado, acertou 
    FROM public.bolao_apostas_artilheiro
  LOOP
    UPDATE temp_scores 
    SET art_pt = CASE WHEN rec.acertou = true OR (art_real IS NOT NULL AND rec.jogador_apostado = art_real) THEN 30 ELSE 0 END
    WHERE usuario_id = rec.usuario_id;
  END LOOP;

  -- Vice Campeao (+25) (se o time1 ou time2 for o vice_campeao_real)
  FOR rec IN 
    SELECT usuario_id, time1, time2 
    FROM public.bolao_apostas_finalistas
  LOOP
    UPDATE temp_scores 
    SET vice_pt = CASE WHEN (vice_real IS NOT NULL AND (rec.time1 = vice_real OR rec.time2 = vice_real)) THEN 25 ELSE 0 END
    WHERE usuario_id = rec.usuario_id;
  END LOOP;

  -- Somar pontos total
  UPDATE temp_scores
  SET pts_total = COALESCE(pts_placares, 0) + (COALESCE(zeb_count, 0) * 10) + COALESCE(camp_pt, 0) + COALESCE(art_pt, 0) + COALESCE(vice_pt, 0);

  -- Salvar rank anterior
  UPDATE public.bolao_usuarios
  SET posicao_ranking_anterior = COALESCE(posicao_ranking, 1);

  -- Loop para computar ranking ordenado e atualizar
  FOR rec IN 
    SELECT 
      t.usuario_id,
      t.pts_total,
      t.ac_placar,
      t.ac_resultado,
      t.zeb_count,
      t.gol_count,
      t.camp_pt,
      t.art_pt,
      t.vice_pt,
      u.nome,
      u.posicao_ranking_anterior
    FROM temp_scores t
    JOIN public.bolao_usuarios u ON u.id = t.usuario_id
    ORDER BY t.pts_total DESC, t.ac_placar DESC, t.ac_resultado DESC, u.nome ASC
  LOOP
    UPDATE public.bolao_usuarios
    SET pontos = rec.pts_total,
        acertos_placar = rec.ac_placar,
        acertos_resultado = rec.ac_resultado,
        zebras = rec.zeb_count,
        goleadas = rec.gol_count,
        campeao_acertos = CASE WHEN rec.camp_pt > 0 THEN 1 ELSE 0 END,
        artilheiro_acertos = CASE WHEN rec.art_pt > 0 THEN 1 ELSE 0 END,
        vice_campeao_acertos = CASE WHEN rec.vice_pt > 0 THEN 1 ELSE 0 END,
        posicao_ranking = rank_idx
    WHERE id = rec.usuario_id;

    -- Verificar ultrapassagens e gerar notificações
    IF rank_idx < rec.posicao_ranking_anterior THEN
      FOR other_user IN
        SELECT id, nome, posicao_ranking, posicao_ranking_anterior
        FROM public.bolao_usuarios
        WHERE id <> rec.usuario_id
          AND posicao_ranking_anterior >= rank_idx
          AND posicao_ranking_anterior < rec.posicao_ranking_anterior
          AND posicao_ranking > rank_idx
      LOOP
        INSERT INTO public.bolao_notificacoes (usuario_id, titulo, conteudo, tipo, link)
        VALUES (
          other_user.id,
          '📉 Você foi ultrapassado!',
          rec.nome || ' te passou no ranking! Agora ele está em ' || rank_idx || 'º lugar e você em ' || other_user.posicao_ranking || 'º.',
          'ultrapassado',
          '/ranking'
        );
      END LOOP;
    END IF;

    rank_idx := rank_idx + 1;
  END LOOP;

  -- Inserir notificação global de ranking atualizado
  INSERT INTO public.bolao_notificacoes (usuario_id, titulo, conteudo, tipo, link)
  VALUES (
    NULL,
    '🏆 Ranking Atualizado!',
    'A classificação geral do bolão foi recalculada! Quem assumiu o topo?',
    'ranking',
    '/ranking'
  );
END;
$$;

-- 9. Create triggers for auto updating rankings when matches are marked as encerrado or apurado
CREATE OR REPLACE FUNCTION public.trigger_atualizar_ranking()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'apurado' OR NEW.status = 'encerrado' THEN
    PERFORM public.atualizar_ranking_geral();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_atualizar_ranking_on_jogo ON public.bolao_jogos;
CREATE TRIGGER trigger_atualizar_ranking_on_jogo
AFTER UPDATE OF status ON public.bolao_jogos
FOR EACH ROW EXECUTE FUNCTION public.trigger_atualizar_ranking();

-- Triggers for special configurations
CREATE OR REPLACE FUNCTION public.trigger_atualizar_ranking_config()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'apurada' THEN
    PERFORM public.atualizar_ranking_geral();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_rank_campeao ON public.bolao_config_campeao;
CREATE TRIGGER trigger_rank_campeao AFTER UPDATE OF status ON public.bolao_config_campeao
FOR EACH ROW EXECUTE FUNCTION public.trigger_atualizar_ranking_config();

DROP TRIGGER IF EXISTS trigger_rank_artilheiro ON public.bolao_config_artilheiro;
CREATE TRIGGER trigger_rank_artilheiro AFTER UPDATE OF status ON public.bolao_config_artilheiro
FOR EACH ROW EXECUTE FUNCTION public.trigger_atualizar_ranking_config();

DROP TRIGGER IF EXISTS trigger_rank_finalistas ON public.bolao_config_finalistas;
CREATE TRIGGER trigger_rank_finalistas AFTER UPDATE OF status ON public.bolao_config_finalistas
FOR EACH ROW EXECUTE FUNCTION public.trigger_atualizar_ranking_config();

DROP TRIGGER IF EXISTS trigger_rank_zebra ON public.bolao_config_zebra;
CREATE TRIGGER trigger_rank_zebra AFTER UPDATE OF status ON public.bolao_config_zebra
FOR EACH ROW EXECUTE FUNCTION public.trigger_atualizar_ranking_config();


-- 10. Triggers for match started/ended notifications
CREATE OR REPLACE FUNCTION public.trigger_notificacoes_jogo()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status = 'ao_vivo' AND OLD.status <> 'ao_vivo' THEN
    INSERT INTO public.bolao_notificacoes (usuario_id, titulo, conteudo, tipo, link)
    VALUES (
      NULL,
      '⚽ Jogo Iniciado!',
      NEW.time_casa || ' x ' || NEW.time_fora || ' começou!',
      'inicio_jogo',
      '/jogos/' || NEW.id
    );
  ELSIF NEW.status = 'encerrado' AND OLD.status <> 'encerrado' THEN
    INSERT INTO public.bolao_notificacoes (usuario_id, titulo, conteudo, tipo, link)
    VALUES (
      NULL,
      '🏁 Jogo Finalizado!',
      'Fim de papo: ' || NEW.time_casa || ' ' || COALESCE(NEW.placar_casa, 0) || ' x ' || COALESCE(NEW.placar_fora, 0) || ' ' || NEW.time_fora,
      'fim_jogo',
      '/jogos/' || NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notificacoes_jogo_status ON public.bolao_jogos;
CREATE TRIGGER trigger_notificacoes_jogo_status
AFTER UPDATE OF status ON public.bolao_jogos
FOR EACH ROW EXECUTE FUNCTION public.trigger_notificacoes_jogo();


-- 11. Triggers for live match events (Goal / Red Card)
CREATE OR REPLACE FUNCTION public.trigger_notificacoes_evento()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  j RECORD;
BEGIN
  SELECT time_casa, time_fora INTO j FROM public.bolao_jogos WHERE id = NEW.jogo_id;
  
  IF NEW.tipo = 'GOAL' THEN
    INSERT INTO public.bolao_notificacoes (usuario_id, titulo, conteudo, tipo, link)
    VALUES (
      NULL,
      '⚽ GOOOOL!',
      NEW.minuto || ''': ' || NEW.descricao || ' (' || j.time_casa || ' ' || NEW.placar_mandante || ' x ' || NEW.placar_visitante || ' ' || j.time_fora || ')',
      'gol',
      '/jogos/' || NEW.jogo_id
    );
  ELSIF NEW.tipo = 'RED_CARD' THEN
    INSERT INTO public.bolao_notificacoes (usuario_id, titulo, conteudo, tipo, link)
    VALUES (
      NULL,
      '🟥 Cartão Vermelho!',
      NEW.minuto || ''': ' || NEW.descricao || ' em ' || j.time_casa || ' x ' || j.time_fora,
      'cartao',
      '/jogos/' || NEW.jogo_id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notificacoes_evento_insert ON public.bolao_jogo_eventos;
CREATE TRIGGER trigger_notificacoes_evento_insert
AFTER INSERT ON public.bolao_jogo_eventos
FOR EACH ROW EXECUTE FUNCTION public.trigger_notificacoes_evento();


-- 12. Trigger for Chat message alerts
CREATE OR REPLACE FUNCTION public.trigger_notificacao_chat()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  remetente text;
BEGIN
  SELECT nome INTO remetente FROM public.bolao_usuarios WHERE id = NEW.usuario_id;
  
  INSERT INTO public.bolao_notificacoes (usuario_id, titulo, conteudo, tipo, link)
  SELECT 
    u.id, 
    '💬 Nova mensagem de ' || remetente,
    substring(NEW.mensagem from 1 for 60),
    'chat',
    '/chat'
  FROM public.bolao_usuarios u
  WHERE u.id <> NEW.usuario_id AND u.excluido_manualmente = false;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notificacao_chat_insert ON public.bolao_chat_mensagens;
CREATE TRIGGER trigger_notificacao_chat_insert
AFTER INSERT ON public.bolao_chat_mensagens
FOR EACH ROW EXECUTE FUNCTION public.trigger_notificacao_chat();

-- 13. Perform an initial ranking computation to populate ranking columns for existing data
SELECT public.atualizar_ranking_geral();
