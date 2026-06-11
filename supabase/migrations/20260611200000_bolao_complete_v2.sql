-- ================================================================
-- MIGRATION 002: Bolão Copa 2026 — Implementação Completa
-- Idempotente: pode rodar múltiplas vezes sem corromper dados
-- ================================================================

-- ========== CONFIG GERAL ==========
CREATE TABLE IF NOT EXISTS public.bolao_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  exclusividade_placar boolean NOT NULL DEFAULT true,
  admin_pin text NOT NULL DEFAULT '123456',
  sorteio_realizado boolean NOT NULL DEFAULT false,
  ultima_sync_api timestamptz,
  total_jogos_api integer NOT NULL DEFAULT 0,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bolao_config (id)
  VALUES (1)
  ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.bolao_config TO anon, authenticated;
GRANT ALL ON public.bolao_config TO service_role;
ALTER TABLE public.bolao_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura config geral" ON public.bolao_config;
CREATE POLICY "leitura config geral" ON public.bolao_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "update config geral" ON public.bolao_config;
CREATE POLICY "update config geral" ON public.bolao_config FOR UPDATE USING (true) WITH CHECK (true);

-- ========== GRUPOS ==========
CREATE TABLE IF NOT EXISTS public.bolao_grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,  -- ex: 'A', 'B', ...
  nome text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_grupos TO anon, authenticated;
GRANT ALL ON public.bolao_grupos TO service_role;
ALTER TABLE public.bolao_grupos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura publica grupos" ON public.bolao_grupos;
CREATE POLICY "leitura publica grupos" ON public.bolao_grupos FOR SELECT USING (true);

-- ========== SELEÇÕES ==========
CREATE TABLE IF NOT EXISTS public.bolao_selecoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  codigo_iso text,  -- ex: 'BRA', 'ARG'
  grupo_id uuid REFERENCES public.bolao_grupos(id) ON DELETE SET NULL,
  bandeira_emoji text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_selecoes TO anon, authenticated;
GRANT ALL ON public.bolao_selecoes TO service_role;
ALTER TABLE public.bolao_selecoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura publica selecoes" ON public.bolao_selecoes;
CREATE POLICY "leitura publica selecoes" ON public.bolao_selecoes FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS bolao_selecoes_grupo_idx ON public.bolao_selecoes(grupo_id);

-- ========== RODADAS ==========
CREATE TABLE IF NOT EXISTS public.bolao_rodadas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  fase text NOT NULL,  -- grupos | oitavas | quartas | semis | terceiro | final
  numero integer,
  grupo_id uuid REFERENCES public.bolao_grupos(id) ON DELETE SET NULL,
  criado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(nome, fase)
);
GRANT SELECT ON public.bolao_rodadas TO anon, authenticated;
GRANT ALL ON public.bolao_rodadas TO service_role;
ALTER TABLE public.bolao_rodadas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura publica rodadas" ON public.bolao_rodadas;
CREATE POLICY "leitura publica rodadas" ON public.bolao_rodadas FOR SELECT USING (true);

-- ========== CHAVEAMENTOS (mata-mata) ==========
CREATE TABLE IF NOT EXISTS public.bolao_chaveamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fase text NOT NULL,  -- oitavas | quartas | semis | terceiro | final
  posicao integer,     -- posição no bracket (1-16)
  time1 text,
  time2 text,
  placar_time1 integer,
  placar_time2 integer,
  vencedor text,
  jogo_id uuid REFERENCES public.bolao_jogos(id) ON DELETE SET NULL,
  data_hora timestamptz,
  estadio text,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_chaveamentos TO anon, authenticated;
GRANT ALL ON public.bolao_chaveamentos TO service_role;
ALTER TABLE public.bolao_chaveamentos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura publica chaveamentos" ON public.bolao_chaveamentos;
CREATE POLICY "leitura publica chaveamentos" ON public.bolao_chaveamentos FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS bolao_chaveamentos_fase_idx ON public.bolao_chaveamentos(fase);

-- ========== AJUSTAR bolao_jogos (colunas adicionais) ==========
ALTER TABLE public.bolao_jogos
  ADD COLUMN IF NOT EXISTS grupo_id uuid REFERENCES public.bolao_grupos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rodada_id uuid REFERENCES public.bolao_rodadas(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS time_casa_id uuid REFERENCES public.bolao_selecoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS time_fora_id uuid REFERENCES public.bolao_selecoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS numero_rodada integer;

CREATE INDEX IF NOT EXISTS bolao_jogos_grupo_idx ON public.bolao_jogos(grupo_id);
CREATE INDEX IF NOT EXISTS bolao_jogos_status_idx ON public.bolao_jogos(status);

-- ========== AJUSTAR bolao_usuarios ==========
-- Adicionar colunas de controle
ALTER TABLE public.bolao_usuarios
  ADD COLUMN IF NOT EXISTS excluido_manualmente boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS e_participante_padrao boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ordem_sorteio integer;

-- Corrigir limite: 10 → permitir até 8 padrão + quantos admin quiser (max 20)
CREATE OR REPLACE FUNCTION public.bolao_limite_usuarios()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.bolao_usuarios WHERE excluido_manualmente = false) >= 20 THEN
    RAISE EXCEPTION 'Limite de 20 participantes atingido';
  END IF;
  RETURN NEW;
END;
$$;

-- ========== SORTEIO DE ORDEM ==========
CREATE TABLE IF NOT EXISTS public.bolao_sorteio_ordem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  posicao integer NOT NULL,
  sorteado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_sorteio_ordem TO anon, authenticated;
GRANT ALL ON public.bolao_sorteio_ordem TO service_role;
ALTER TABLE public.bolao_sorteio_ordem ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura publica sorteio" ON public.bolao_sorteio_ordem;
CREATE POLICY "leitura publica sorteio" ON public.bolao_sorteio_ordem FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS bolao_sorteio_posicao_idx ON public.bolao_sorteio_ordem(posicao);

-- ========== CORRIGIR RLS bolao_palpites ==========
-- Permitir INSERT pelo service_role (edge functions usam service role)
DROP POLICY IF EXISTS "leitura palpites via view" ON public.bolao_palpites;
CREATE POLICY "leitura palpites via view" ON public.bolao_palpites
  FOR SELECT USING (true);

-- Garantir que service_role pode INSERT/UPDATE/DELETE (já tem GRANT ALL)
-- Para anon conseguir via edge function (service_role key), não precisa de policy de insert para anon

-- ========== EXCLUSIVIDADE DE PALPITES (índice condicional) ==========
-- Cria índice único de placar por jogo quando exclusividade está ativada
-- Implementado via constraint na edge function; o índice único pode ser
-- criado/removido pelo admin via edge function de config

-- ========== POLÍTICA DE INTEGRIDADE ADICIONAL ==========
-- Garantir que bolao_palpites não permite gols negativos (já tem CHECK, garantir)
-- Já existe: CHECK (gols_casa >= 0) e CHECK (gols_fora >= 0)

-- ========== SEED: 8 PARTICIPANTES PADRÃO ==========
-- Função idempotente para criar participantes padrão
CREATE OR REPLACE FUNCTION public.bolao_init_participantes_padrao()
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  nomes text[] := ARRAY['Igor','Natan','Alison','Pedro','Zé','Paulo','Vitinho','Kelvin'];
  n text;
BEGIN
  FOREACH n IN ARRAY nomes LOOP
    -- Só insere se não existe e não foi excluído manualmente
    INSERT INTO public.bolao_usuarios (nome, e_participante_padrao)
      VALUES (n, true)
      ON CONFLICT (nome) DO UPDATE
        SET e_participante_padrao = true
        WHERE bolao_usuarios.excluido_manualmente = false;
  END LOOP;
END;
$$;

-- Executar seed inicial
SELECT public.bolao_init_participantes_padrao();

-- ========== pg_cron: sincronização automática a cada 5 min ==========
-- Nota: pg_cron precisa estar habilitado no projeto Supabase
-- Esta instrução pode falhar se pg_net não estiver disponível — ignorar erro
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'bolao-sync-copa',
      '*/5 * * * *',
      format(
        $sql$SELECT net.http_post(
          url := '%s/functions/v1/sync-copa',
          headers := '{"Content-Type":"application/json","apikey":"%s"}'::jsonb,
          body := '{}'::jsonb
        )$sql$,
        current_setting('app.supabase_url', true),
        current_setting('app.supabase_anon_key', true)
      )
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'pg_cron job nao configurado: %', SQLERRM;
END;
$$;

-- ========== ÍNDICES EXTRAS PARA PERFORMANCE ==========
CREATE INDEX IF NOT EXISTS bolao_palpites_jogo_placar_idx
  ON public.bolao_palpites(jogo_id, gols_casa, gols_fora);
CREATE INDEX IF NOT EXISTS bolao_usuarios_ativo_idx
  ON public.bolao_usuarios(excluido_manualmente, e_participante_padrao);
