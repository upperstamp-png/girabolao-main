
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.bolao_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

-- ========== USUARIOS ==========
CREATE TABLE public.bolao_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  pin_hash text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_usuarios TO anon, authenticated;
GRANT ALL ON public.bolao_usuarios TO service_role;
ALTER TABLE public.bolao_usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura publica usuarios" ON public.bolao_usuarios FOR SELECT USING (true);

-- limite de 10 usuários
CREATE OR REPLACE FUNCTION public.bolao_limite_usuarios()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.bolao_usuarios) >= 10 THEN
    RAISE EXCEPTION 'Limite de 10 participantes atingido';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER bolao_usuarios_limite BEFORE INSERT ON public.bolao_usuarios
FOR EACH ROW EXECUTE FUNCTION public.bolao_limite_usuarios();

-- ========== JOGOS ==========
CREATE TABLE public.bolao_jogos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_jogo_id integer NOT NULL UNIQUE,
  time_casa text NOT NULL,
  time_fora text NOT NULL,
  placar_casa integer,
  placar_fora integer,
  e_brasil boolean NOT NULL DEFAULT false,
  fase text NOT NULL,
  valor_entrada numeric(6,2) NOT NULL DEFAULT 5.00,
  status text NOT NULL DEFAULT 'pendente', -- pendente | ao_vivo | encerrado | apurado
  data_hora timestamptz NOT NULL,
  estadio text,
  acumulado numeric(10,2) NOT NULL DEFAULT 0.00,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_jogos TO anon, authenticated;
GRANT ALL ON public.bolao_jogos TO service_role;
ALTER TABLE public.bolao_jogos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura publica jogos" ON public.bolao_jogos FOR SELECT USING (true);
CREATE TRIGGER bolao_jogos_updated BEFORE UPDATE ON public.bolao_jogos
FOR EACH ROW EXECUTE FUNCTION public.bolao_set_updated_at();
CREATE INDEX bolao_jogos_data_idx ON public.bolao_jogos(data_hora);
CREATE INDEX bolao_jogos_fase_idx ON public.bolao_jogos(fase);

-- ========== PALPITES (placar) ==========
CREATE TABLE public.bolao_palpites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  jogo_id uuid NOT NULL REFERENCES public.bolao_jogos(id) ON DELETE CASCADE,
  gols_casa integer NOT NULL CHECK (gols_casa >= 0),
  gols_fora integer NOT NULL CHECK (gols_fora >= 0),
  acertou boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, jogo_id)
);
-- Sem SELECT direto para anon — usa a view publica
GRANT ALL ON public.bolao_palpites TO service_role;
ALTER TABLE public.bolao_palpites ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER bolao_palpites_updated BEFORE UPDATE ON public.bolao_palpites
FOR EACH ROW EXECUTE FUNCTION public.bolao_set_updated_at();

-- View pública: só revela gols após início do jogo; antes, mostra apenas que palpitou
CREATE VIEW public.bolao_palpites_publica
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.usuario_id,
  p.jogo_id,
  CASE WHEN j.data_hora <= now() THEN p.gols_casa ELSE NULL END AS gols_casa,
  CASE WHEN j.data_hora <= now() THEN p.gols_fora ELSE NULL END AS gols_fora,
  (j.data_hora <= now()) AS revelado,
  p.acertou,
  p.criado_em
FROM public.bolao_palpites p
JOIN public.bolao_jogos j ON j.id = p.jogo_id;
GRANT SELECT ON public.bolao_palpites_publica TO anon, authenticated;
-- Permitir que a view leia palpites mesmo com RLS (security_invoker reusa permissão do chamador)
CREATE POLICY "leitura palpites via view" ON public.bolao_palpites FOR SELECT USING (true);

-- ========== ARTILHEIRO ==========
CREATE TABLE public.bolao_apostas_artilheiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  jogador_apostado text NOT NULL,
  acertou boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bolao_apostas_artilheiro TO service_role;
ALTER TABLE public.bolao_apostas_artilheiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura artilheiro via view" ON public.bolao_apostas_artilheiro FOR SELECT USING (true);
CREATE TRIGGER bolao_artilheiro_updated BEFORE UPDATE ON public.bolao_apostas_artilheiro
FOR EACH ROW EXECUTE FUNCTION public.bolao_set_updated_at();

CREATE TABLE public.bolao_config_artilheiro (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status text NOT NULL DEFAULT 'aberta', -- aberta | fechada | apurada
  artilheiro_real text,
  total_arrecadado numeric(10,2) NOT NULL DEFAULT 0.00,
  acumulado_anterior numeric(10,2) NOT NULL DEFAULT 0.00,
  prazo_fim timestamptz NOT NULL DEFAULT '2026-06-11 19:00:00+00',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bolao_config_artilheiro (id) VALUES (1);
GRANT SELECT ON public.bolao_config_artilheiro TO anon, authenticated;
GRANT ALL ON public.bolao_config_artilheiro TO service_role;
ALTER TABLE public.bolao_config_artilheiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura config artilheiro" ON public.bolao_config_artilheiro FOR SELECT USING (true);

CREATE VIEW public.bolao_apostas_artilheiro_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' THEN a.jogador_apostado ELSE NULL END AS jogador_apostado,
  (c.status = 'apurada') AS revelado,
  a.acertou, a.criado_em
FROM public.bolao_apostas_artilheiro a
CROSS JOIN public.bolao_config_artilheiro c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_artilheiro_publica TO anon, authenticated;

-- ========== FINALISTAS ==========
CREATE TABLE public.bolao_apostas_finalistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  time1 text NOT NULL,
  time2 text NOT NULL,
  acertou_os_dois boolean,
  acertou_um boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bolao_apostas_finalistas TO service_role;
ALTER TABLE public.bolao_apostas_finalistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura finalistas via view" ON public.bolao_apostas_finalistas FOR SELECT USING (true);
CREATE TRIGGER bolao_finalistas_updated BEFORE UPDATE ON public.bolao_apostas_finalistas
FOR EACH ROW EXECUTE FUNCTION public.bolao_set_updated_at();

CREATE TABLE public.bolao_config_finalistas (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status text NOT NULL DEFAULT 'fechada', -- fechada | aberta | apurada
  finalista1_real text,
  finalista2_real text,
  total_arrecadado numeric(10,2) NOT NULL DEFAULT 0.00,
  acumulado_anterior numeric(10,2) NOT NULL DEFAULT 0.00,
  prazo_fim timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bolao_config_finalistas (id) VALUES (1);
GRANT SELECT ON public.bolao_config_finalistas TO anon, authenticated;
GRANT ALL ON public.bolao_config_finalistas TO service_role;
ALTER TABLE public.bolao_config_finalistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura config finalistas" ON public.bolao_config_finalistas FOR SELECT USING (true);

CREATE VIEW public.bolao_apostas_finalistas_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' THEN a.time1 ELSE NULL END AS time1,
  CASE WHEN c.status = 'apurada' THEN a.time2 ELSE NULL END AS time2,
  (c.status = 'apurada') AS revelado,
  a.acertou_os_dois, a.acertou_um, a.criado_em
FROM public.bolao_apostas_finalistas a
CROSS JOIN public.bolao_config_finalistas c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_finalistas_publica TO anon, authenticated;

-- ========== PREMIOS ==========
CREATE TABLE public.bolao_premios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modalidade text NOT NULL, -- placar | artilheiro | finalistas
  referencia_id uuid, -- jogo_id no caso placar
  usuario_id uuid REFERENCES public.bolao_usuarios(id) ON DELETE SET NULL,
  valor numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pendente', -- pendente | pago | acumulado
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_premios TO anon, authenticated;
GRANT ALL ON public.bolao_premios TO service_role;
ALTER TABLE public.bolao_premios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura premios" ON public.bolao_premios FOR SELECT USING (true);
CREATE INDEX bolao_premios_usuario_idx ON public.bolao_premios(usuario_id);
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
-- Cron de producao para manter jogos/resultados atualizados.
-- A chave anon abaixo e publica por natureza; a function esta com verify_jwt = false.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE UNIQUE INDEX IF NOT EXISTS bolao_chaveamentos_jogo_id_unique
  ON public.bolao_chaveamentos(jogo_id)
  WHERE jogo_id IS NOT NULL;

DO $$
BEGIN
  PERFORM cron.unschedule('bolao-sync-copa');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

DO $$
DECLARE
  project_url text := 'https://ahcpszcxmqqiofacjasz.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoY3BzemN4bXFxaW9mYWNqYXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTQxNDUsImV4cCI6MjA5MDEzMDE0NX0.Wq4fChb6tX-fDAe3sgAySv0GxOCpJsrKEFF8End_hA0';
BEGIN
  PERFORM cron.schedule(
    'bolao-sync-copa',
    '*/5 * * * *',
    format(
      $sql$
        SELECT net.http_post(
          url := '%s/functions/v1/sync-copa',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', '%s',
            'Authorization', 'Bearer %s'
          ),
          body := jsonb_build_object('origem', 'pg_cron')
        );
      $sql$,
      project_url,
      anon_key,
      anon_key
    )
  );
END;
$$;
-- PIN inicial para todos os participantes que ainda nao tinham PIN.
-- PIN padrao: 1234. O usuario pode trocar dentro da plataforma.

ALTER TABLE public.bolao_usuarios
  ALTER COLUMN pin_hash SET DEFAULT 'c26ec9ab946a8d14304fc6cac6d9619a37539ca12b88b2e1d6d734fa013374ba';

UPDATE public.bolao_usuarios
SET pin_hash = 'c26ec9ab946a8d14304fc6cac6d9619a37539ca12b88b2e1d6d734fa013374ba'
WHERE pin_hash IS NULL
  AND excluido_manualmente = false;
-- Sorteio de ordem por jogo: cada partida tem sua própria ordem de palpites.

ALTER TABLE public.bolao_jogos
  ADD COLUMN IF NOT EXISTS sorteio_realizado boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.bolao_sorteio_jogo_ordem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id uuid NOT NULL REFERENCES public.bolao_jogos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  posicao integer NOT NULL CHECK (posicao > 0),
  sorteado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (jogo_id, usuario_id),
  UNIQUE (jogo_id, posicao)
);

CREATE INDEX IF NOT EXISTS bolao_sorteio_jogo_jogo_idx ON public.bolao_sorteio_jogo_ordem(jogo_id);
CREATE INDEX IF NOT EXISTS bolao_sorteio_jogo_posicao_idx ON public.bolao_sorteio_jogo_ordem(jogo_id, posicao);

GRANT SELECT ON public.bolao_sorteio_jogo_ordem TO anon, authenticated;
GRANT ALL ON public.bolao_sorteio_jogo_ordem TO service_role;

ALTER TABLE public.bolao_sorteio_jogo_ordem ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura publica sorteio jogo" ON public.bolao_sorteio_jogo_ordem;
CREATE POLICY "leitura publica sorteio jogo" ON public.bolao_sorteio_jogo_ordem FOR SELECT USING (true);

-- Garantir participantes padrão com PIN 1234 (idempotente).
INSERT INTO public.bolao_usuarios (nome, pin_hash, e_participante_padrao)
SELECT v.nome, 'c26ec9ab946a8d14304fc6cac6d9619a37539ca12b88b2e1d6d734fa013374ba', true
FROM (VALUES
  ('Igor'), ('Natan'), ('Alison'), ('Pedro'), ('Zé'), ('Paulo'), ('Vitinho'), ('Kelvin')
) AS v(nome)
WHERE NOT EXISTS (
  SELECT 1 FROM public.bolao_usuarios u WHERE u.nome = v.nome
);

UPDATE public.bolao_usuarios
SET pin_hash = 'c26ec9ab946a8d14304fc6cac6d9619a37539ca12b88b2e1d6d734fa013374ba',
    e_participante_padrao = true
WHERE nome IN ('Igor','Natan','Alison','Pedro','Zé','Paulo','Vitinho','Kelvin')
  AND excluido_manualmente = false
  AND (pin_hash IS NULL OR e_participante_padrao IS NOT TRUE);
-- Dados enriquecidos de multiplas APIs + sync a cada 10 minutos.

-- Extensoes em selecoes
ALTER TABLE public.bolao_selecoes
  ADD COLUMN IF NOT EXISTS escudo_url text,
  ADD COLUMN IF NOT EXISTS thesportsdb_id text,
  ADD COLUMN IF NOT EXISTS api_football_id integer,
  ADD COLUMN IF NOT EXISTS pais text,
  ADD COLUMN IF NOT EXISTS estadio text,
  ADD COLUMN IF NOT EXISTS tecnico text,
  ADD COLUMN IF NOT EXISTS atualizado_em timestamptz NOT NULL DEFAULT now();

-- Stats ao vivo por jogo (API-Football)
ALTER TABLE public.bolao_jogos
  ADD COLUMN IF NOT EXISTS placar_casa_ht integer,
  ADD COLUMN IF NOT EXISTS placar_fora_ht integer,
  ADD COLUMN IF NOT EXISTS minuto_jogo integer,
  ADD COLUMN IF NOT EXISTS api_football_id integer,
  ADD COLUMN IF NOT EXISTS fonte_sync text;

CREATE TABLE IF NOT EXISTS public.bolao_jogo_estatisticas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id uuid NOT NULL UNIQUE REFERENCES public.bolao_jogos(id) ON DELETE CASCADE,
  posse_casa numeric(5,2),
  posse_fora numeric(5,2),
  chutes_casa integer DEFAULT 0,
  chutes_fora integer DEFAULT 0,
  chutes_gol_casa integer DEFAULT 0,
  chutes_gol_fora integer DEFAULT 0,
  escanteios_casa integer DEFAULT 0,
  escanteios_fora integer DEFAULT 0,
  faltas_casa integer DEFAULT 0,
  faltas_fora integer DEFAULT 0,
  cartoes_amarelos_casa integer DEFAULT 0,
  cartoes_amarelos_fora integer DEFAULT 0,
  cartoes_vermelhos_casa integer DEFAULT 0,
  cartoes_vermelhos_fora integer DEFAULT 0,
  dados_brutos jsonb,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_jogo_estatisticas TO anon, authenticated;
GRANT ALL ON public.bolao_jogo_estatisticas TO service_role;
ALTER TABLE public.bolao_jogo_estatisticas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura stats jogo" ON public.bolao_jogo_estatisticas;
CREATE POLICY "leitura stats jogo" ON public.bolao_jogo_estatisticas FOR SELECT USING (true);

-- Eventos taticos (StatsBomb / API-Football)
CREATE TABLE IF NOT EXISTS public.bolao_jogo_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id uuid NOT NULL REFERENCES public.bolao_jogos(id) ON DELETE CASCADE,
  minuto integer,
  periodo text,
  tipo text NOT NULL,
  time text,
  jogador text,
  detalhe jsonb,
  fonte text NOT NULL DEFAULT 'statsbomb',
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bolao_jogo_eventos_jogo_idx ON public.bolao_jogo_eventos(jogo_id, minuto);
GRANT SELECT ON public.bolao_jogo_eventos TO anon, authenticated;
GRANT ALL ON public.bolao_jogo_eventos TO service_role;
ALTER TABLE public.bolao_jogo_eventos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura eventos jogo" ON public.bolao_jogo_eventos;
CREATE POLICY "leitura eventos jogo" ON public.bolao_jogo_eventos FOR SELECT USING (true);

-- Classificacao dos grupos (Football-Data.org)
CREATE TABLE IF NOT EXISTS public.bolao_classificacao_grupos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  grupo_id uuid NOT NULL REFERENCES public.bolao_grupos(id) ON DELETE CASCADE,
  selecao_id uuid NOT NULL REFERENCES public.bolao_selecoes(id) ON DELETE CASCADE,
  posicao integer NOT NULL,
  jogos integer NOT NULL DEFAULT 0,
  vitorias integer NOT NULL DEFAULT 0,
  empates integer NOT NULL DEFAULT 0,
  derrotas integer NOT NULL DEFAULT 0,
  gols_pro integer NOT NULL DEFAULT 0,
  gols_contra integer NOT NULL DEFAULT 0,
  saldo integer NOT NULL DEFAULT 0,
  pontos integer NOT NULL DEFAULT 0,
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(grupo_id, selecao_id)
);
GRANT SELECT ON public.bolao_classificacao_grupos TO anon, authenticated;
GRANT ALL ON public.bolao_classificacao_grupos TO service_role;
ALTER TABLE public.bolao_classificacao_grupos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura classificacao" ON public.bolao_classificacao_grupos;
CREATE POLICY "leitura classificacao" ON public.bolao_classificacao_grupos FOR SELECT USING (true);

-- Elencos (Football-Data + TheSportsDB)
CREATE TABLE IF NOT EXISTS public.bolao_elenco (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  selecao_id uuid NOT NULL REFERENCES public.bolao_selecoes(id) ON DELETE CASCADE,
  jogador_nome text NOT NULL,
  posicao text,
  numero_camisa integer,
  foto_url text,
  nacionalidade text,
  data_nascimento date,
  fonte text NOT NULL DEFAULT 'football-data',
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(selecao_id, jogador_nome)
);
GRANT SELECT ON public.bolao_elenco TO anon, authenticated;
GRANT ALL ON public.bolao_elenco TO service_role;
ALTER TABLE public.bolao_elenco ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura elenco" ON public.bolao_elenco;
CREATE POLICY "leitura elenco" ON public.bolao_elenco FOR SELECT USING (true);

-- Log de sincronizacao
CREATE TABLE IF NOT EXISTS public.bolao_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fonte text NOT NULL,
  status text NOT NULL,
  registros integer NOT NULL DEFAULT 0,
  detalhes jsonb,
  duracao_ms integer,
  criado_em timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bolao_sync_log_criado_idx ON public.bolao_sync_log(criado_em DESC);
GRANT SELECT ON public.bolao_sync_log TO anon, authenticated;
GRANT ALL ON public.bolao_sync_log TO service_role;
ALTER TABLE public.bolao_sync_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura sync log" ON public.bolao_sync_log;
CREATE POLICY "leitura sync log" ON public.bolao_sync_log FOR SELECT USING (true);

-- Controle de rate-limit API-Football (100/dia)
ALTER TABLE public.bolao_config
  ADD COLUMN IF NOT EXISTS api_football_chamadas_hoje integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS api_football_data date,
  ADD COLUMN IF NOT EXISTS ultima_sync_api_football timestamptz,
  ADD COLUMN IF NOT EXISTS ultima_sync_thesportsdb timestamptz,
  ADD COLUMN IF NOT EXISTS ultima_sync_statsbomb timestamptz;

-- Cron: a cada 10 minutos
DO $$
BEGIN
  PERFORM cron.unschedule('bolao-sync-copa');
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

DO $$
DECLARE
  project_url text := 'https://ahcpszcxmqqiofacjasz.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoY3BzemN4bXFxaW9mYWNqYXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTQxNDUsImV4cCI6MjA5MDEzMDE0NX0.Wq4fChb6tX-fDAe3sgAySv0GxOCpJsrKEFF8End_hA0';
BEGIN
  PERFORM cron.schedule(
    'bolao-sync-copa',
    '*/10 * * * *',
    format(
      $sql$
        SELECT net.http_post(
          url := '%s/functions/v1/sync-copa',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', '%s',
            'Authorization', 'Bearer %s'
          ),
          body := jsonb_build_object('origem', 'pg_cron')
        );
      $sql$,
      project_url,
      anon_key,
      anon_key
    )
  );
END;
$$;
-- ========== CAMPEÃO ==========
CREATE TABLE IF NOT EXISTS public.bolao_config_campeao (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status text NOT NULL DEFAULT 'aberta', -- aberta | fechada | apurada
  campeao_real text,
  total_arrecadado numeric(10,2) NOT NULL DEFAULT 0.00,
  acumulado_anterior numeric(10,2) NOT NULL DEFAULT 0.00,
  prazo_fim timestamptz NOT NULL DEFAULT '2026-06-11 19:00:00+00',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bolao_config_campeao (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.bolao_config_campeao TO anon, authenticated;
GRANT ALL ON public.bolao_config_campeao TO service_role;
ALTER TABLE public.bolao_config_campeao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura config campeao" ON public.bolao_config_campeao;
CREATE POLICY "leitura config campeao" ON public.bolao_config_campeao FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.bolao_apostas_campeao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  time_campeao text NOT NULL,
  acertou boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bolao_apostas_campeao TO service_role;
ALTER TABLE public.bolao_apostas_campeao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura campeao via view" ON public.bolao_apostas_campeao;
CREATE POLICY "leitura campeao via view" ON public.bolao_apostas_campeao FOR SELECT USING (true);

CREATE OR REPLACE VIEW public.bolao_apostas_campeao_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' THEN a.time_campeao ELSE NULL END AS time_campeao,
  (c.status = 'apurada') AS revelado,
  a.acertou, a.criado_em
FROM public.bolao_apostas_campeao a
CROSS JOIN public.bolao_config_campeao c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_campeao_publica TO anon, authenticated;


-- ========== ZEBRA ==========
CREATE TABLE IF NOT EXISTS public.bolao_config_zebra (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status text NOT NULL DEFAULT 'aberta', -- aberta | fechada | apurada
  zebra_real text,
  total_arrecadado numeric(10,2) NOT NULL DEFAULT 0.00,
  acumulado_anterior numeric(10,2) NOT NULL DEFAULT 0.00,
  prazo_fim timestamptz NOT NULL DEFAULT '2026-06-11 19:00:00+00',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bolao_config_zebra (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.bolao_config_zebra TO anon, authenticated;
GRANT ALL ON public.bolao_config_zebra TO service_role;
ALTER TABLE public.bolao_config_zebra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura config zebra" ON public.bolao_config_zebra;
CREATE POLICY "leitura config zebra" ON public.bolao_config_zebra FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.bolao_apostas_zebra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  zebra_apostada text NOT NULL,
  acertou boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bolao_apostas_zebra TO service_role;
ALTER TABLE public.bolao_apostas_zebra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura zebra via view" ON public.bolao_apostas_zebra;
CREATE POLICY "leitura zebra via view" ON public.bolao_apostas_zebra FOR SELECT USING (true);

CREATE OR REPLACE VIEW public.bolao_apostas_zebra_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' THEN a.zebra_apostada ELSE NULL END AS zebra_apostada,
  (c.status = 'apurada') AS revelado,
  a.acertou, a.criado_em
FROM public.bolao_apostas_zebra a
CROSS JOIN public.bolao_config_zebra c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_zebra_publica TO anon, authenticated;


-- ========== MAIOR GOLEADA ==========
CREATE TABLE IF NOT EXISTS public.bolao_config_goleada (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status text NOT NULL DEFAULT 'aberta', -- aberta | fechada | apurada
  goleada_time_casa_real text,
  goleada_time_fora_real text,
  goleada_gols_casa_real integer,
  goleada_gols_fora_real integer,
  total_arrecadado numeric(10,2) NOT NULL DEFAULT 0.00,
  acumulado_anterior numeric(10,2) NOT NULL DEFAULT 0.00,
  prazo_fim timestamptz NOT NULL DEFAULT '2026-06-11 19:00:00+00',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bolao_config_goleada (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.bolao_config_goleada TO anon, authenticated;
GRANT ALL ON public.bolao_config_goleada TO service_role;
ALTER TABLE public.bolao_config_goleada ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura config goleada" ON public.bolao_config_goleada;
CREATE POLICY "leitura config goleada" ON public.bolao_config_goleada FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.bolao_apostas_goleada (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  time_casa text NOT NULL,
  time_fora text NOT NULL,
  gols_casa integer NOT NULL CHECK (gols_casa >= 0),
  gols_fora integer NOT NULL CHECK (gols_fora >= 0),
  acertou boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bolao_apostas_goleada TO service_role;
ALTER TABLE public.bolao_apostas_goleada ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura goleada via view" ON public.bolao_apostas_goleada;
CREATE POLICY "leitura goleada via view" ON public.bolao_apostas_goleada FOR SELECT USING (true);

CREATE OR REPLACE VIEW public.bolao_apostas_goleada_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' THEN a.time_casa ELSE NULL END AS time_casa,
  CASE WHEN c.status = 'apurada' THEN a.time_fora ELSE NULL END AS time_fora,
  CASE WHEN c.status = 'apurada' THEN a.gols_casa ELSE NULL END AS gols_casa,
  CASE WHEN c.status = 'apurada' THEN a.gols_fora ELSE NULL END AS gols_fora,
  (c.status = 'apurada') AS revelado,
  a.acertou, a.criado_em
FROM public.bolao_apostas_goleada a
CROSS JOIN public.bolao_config_goleada c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_goleada_publica TO anon, authenticated;


-- ========== HISTÓRICO DE ALTERAÇÕES (AUDIT LOG) ==========
CREATE TABLE IF NOT EXISTS public.bolao_historico_alteracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  jogo_id uuid NOT NULL REFERENCES public.bolao_jogos(id) ON DELETE CASCADE,
  acao text NOT NULL CHECK (acao IN ('criar', 'alterar')),
  gols_casa_antigo integer,
  gols_fora_antigo integer,
  gols_casa_novo integer NOT NULL,
  gols_fora_novo integer NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_historico_alteracoes TO anon, authenticated;
GRANT ALL ON public.bolao_historico_alteracoes TO service_role;
ALTER TABLE public.bolao_historico_alteracoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura publica historico" ON public.bolao_historico_alteracoes;
CREATE POLICY "leitura publica historico" ON public.bolao_historico_alteracoes FOR SELECT USING (true);
-- Migration: Copa News and Closing Rules
-- Path: supabase/migrations/20260612010000_copa_news_and_closing_rules.sql

-- 1. Table for Copa News
CREATE TABLE IF NOT EXISTS public.bolao_noticias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  resumo text,
  link text NOT NULL UNIQUE,
  imagem_url text,
  publicado_em timestamptz NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_noticias TO anon, authenticated;
GRANT ALL ON public.bolao_noticias TO service_role;
ALTER TABLE public.bolao_noticias ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura publica noticias" ON public.bolao_noticias;
CREATE POLICY "leitura publica noticias" ON public.bolao_noticias FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS bolao_noticias_publicado_idx ON public.bolao_noticias(publicado_em DESC);

-- 2. Add columns to bolao_config
ALTER TABLE public.bolao_config
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'FECHADO', 'FINALIZADO')),
  ADD COLUMN IF NOT EXISTS palpites_liberados boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ultima_sync_noticias timestamptz;

-- 3. Modify bolao_apostas_artilheiro to reference bolao_elenco
ALTER TABLE public.bolao_apostas_artilheiro
  ADD COLUMN IF NOT EXISTS jogador_id uuid REFERENCES public.bolao_elenco(id) ON DELETE SET NULL;

-- 4. Table for Automation Logs
CREATE TABLE IF NOT EXISTS public.bolao_automacoes_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  acao text NOT NULL,
  status text NOT NULL,
  detalhes jsonb,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_automacoes_log TO anon, authenticated;
GRANT ALL ON public.bolao_automacoes_log TO service_role;
ALTER TABLE public.bolao_automacoes_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura publica automacoes_log" ON public.bolao_automacoes_log;
CREATE POLICY "leitura publica automacoes_log" ON public.bolao_automacoes_log FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS bolao_automacoes_log_criado_idx ON public.bolao_automacoes_log(criado_em DESC);

-- 5. Update Views to disclose results when closed or palpites_liberados is true
DROP VIEW IF EXISTS public.bolao_palpites_publica CASCADE;
DROP VIEW IF EXISTS public.bolao_apostas_artilheiro_publica CASCADE;
DROP VIEW IF EXISTS public.bolao_apostas_campeao_publica CASCADE;
DROP VIEW IF EXISTS public.bolao_apostas_zebra_publica CASCADE;
DROP VIEW IF EXISTS public.bolao_apostas_goleada_publica CASCADE;
DROP VIEW IF EXISTS public.bolao_apostas_finalistas_publica CASCADE;

-- View: bolao_palpites_publica
CREATE OR REPLACE VIEW public.bolao_palpites_publica
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.usuario_id,
  p.jogo_id,
  CASE 
    WHEN (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) OR j.data_hora <= now() THEN p.gols_casa 
    ELSE NULL 
  END AS gols_casa,
  CASE 
    WHEN (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) OR j.data_hora <= now() THEN p.gols_fora 
    ELSE NULL 
  END AS gols_fora,
  ((SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) OR j.data_hora <= now()) AS revelado,
  p.acertou,
  p.criado_em
FROM public.bolao_palpites p
JOIN public.bolao_jogos j ON j.id = p.jogo_id;
GRANT SELECT ON public.bolao_palpites_publica TO anon, authenticated;

-- View: bolao_apostas_artilheiro_publica
CREATE OR REPLACE VIEW public.bolao_apostas_artilheiro_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id, a.jogador_id,
  CASE WHEN c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) THEN a.jogador_apostado ELSE NULL END AS jogador_apostado,
  (c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1)) AS revelado,
  a.acertou, a.criado_em, a.confirmado_em, a.bloqueado_em
FROM public.bolao_apostas_artilheiro a
CROSS JOIN public.bolao_config_artilheiro c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_artilheiro_publica TO anon, authenticated;

-- View: bolao_apostas_campeao_publica
CREATE OR REPLACE VIEW public.bolao_apostas_campeao_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) THEN a.time_campeao ELSE NULL END AS time_campeao,
  (c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1)) AS revelado,
  a.acertou, a.criado_em
FROM public.bolao_apostas_campeao a
CROSS JOIN public.bolao_config_campeao c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_campeao_publica TO anon, authenticated;

-- View: bolao_apostas_zebra_publica
CREATE OR REPLACE VIEW public.bolao_apostas_zebra_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) THEN a.zebra_apostada ELSE NULL END AS zebra_apostada,
  (c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1)) AS revelado,
  a.acertou, a.criado_em
FROM public.bolao_apostas_zebra a
CROSS JOIN public.bolao_config_zebra c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_zebra_publica TO anon, authenticated;

-- View: bolao_apostas_goleada_publica
CREATE OR REPLACE VIEW public.bolao_apostas_goleada_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) THEN a.time_casa ELSE NULL END AS time_casa,
  CASE WHEN c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) THEN a.time_fora ELSE NULL END AS time_fora,
  CASE WHEN c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) THEN a.gols_casa ELSE NULL END AS gols_casa,
  CASE WHEN c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) THEN a.gols_fora ELSE NULL END AS gols_fora,
  (c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1)) AS revelado,
  a.acertou, a.criado_em
FROM public.bolao_apostas_goleada a
CROSS JOIN public.bolao_config_goleada c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_goleada_publica TO anon, authenticated;

-- View: bolao_apostas_finalistas_publica
CREATE OR REPLACE VIEW public.bolao_apostas_finalistas_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) THEN a.time1 ELSE NULL END AS time1,
  CASE WHEN c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1) THEN a.time2 ELSE NULL END AS time2,
  (c.status = 'apurada' OR (SELECT status FROM public.bolao_config WHERE id = 1) IN ('FECHADO', 'FINALIZADO') OR (SELECT palpites_liberados FROM public.bolao_config WHERE id = 1)) AS revelado,
  a.acertou_os_dois, a.acertou_um, a.criado_em, a.confirmado_em, a.bloqueado_em
FROM public.bolao_apostas_finalistas a
CROSS JOIN public.bolao_config_finalistas c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_finalistas_publica TO anon, authenticated;

-- 6. Schedule news sync and closing checks via pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('bolao-sync-noticias');
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END;
$$;

DO $$
DECLARE
  project_url text := 'https://ahcpszcxmqqiofacjasz.supabase.co';
  anon_key text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoY3BzemN4bXFxaW9mYWNqYXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTQxNDUsImV4cCI6MjA5MDEzMDE0NX0.Wq4fChb6tX-fDAe3sgAySv0GxOCpJsrKEFF8End_hA0';
BEGIN
  PERFORM cron.schedule(
    'bolao-sync-noticias',
    '*/15 * * * *',
    format(
      $sql$
        SELECT net.http_post(
          url := '%s/functions/v1/sync-noticias',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'apikey', '%s',
            'Authorization', 'Bearer %s'
          ),
          body := jsonb_build_object('origem', 'pg_cron')
        );
      $sql$,
      project_url,
      anon_key,
      anon_key
    )
  );
END;
$$;

-- Migration: Special Bets Locking and Audit
-- Adds confirmation/lock timestamps, prevents forbidden updates and records locks when configs close

-- 1. Add columns for confirmation and lock timestamps to special bets
ALTER TABLE public.bolao_apostas_artilheiro
  ADD COLUMN IF NOT EXISTS confirmado_em timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS bloqueado_em timestamptz;

ALTER TABLE public.bolao_apostas_finalistas
  ADD COLUMN IF NOT EXISTS confirmado_em timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS bloqueado_em timestamptz;

ALTER TABLE public.bolao_apostas_campeao
  ADD COLUMN IF NOT EXISTS confirmado_em timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS bloqueado_em timestamptz;

ALTER TABLE public.bolao_apostas_zebra
  ADD COLUMN IF NOT EXISTS confirmado_em timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS bloqueado_em timestamptz;

ALTER TABLE public.bolao_apostas_goleada
  ADD COLUMN IF NOT EXISTS confirmado_em timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS bloqueado_em timestamptz;

-- 2. Function: prevent updates to artilheiro (choice immutable)
CREATE OR REPLACE FUNCTION public.bolao_prevent_artilheiro_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Alteração proibida: a escolha do artilheiro não pode ser alterada.';
  RETURN NEW;
END;
$$;

-- Drop existing update trigger if present and install blocking trigger
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'bolao_artilheiro_updated') THEN
    PERFORM pg_trigger_drop('bolao_artilheiro_updated'::name);
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END$$;

CREATE TRIGGER bolao_artilheiro_block_update
  BEFORE UPDATE ON public.bolao_apostas_artilheiro
  FOR EACH ROW EXECUTE FUNCTION public.bolao_prevent_artilheiro_update();

-- 3. Functions: prevent updates on other special bets after closure/prazo
CREATE OR REPLACE FUNCTION public.bolao_prevent_update_finalistas()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cfg RECORD;
BEGIN
  SELECT * INTO cfg FROM public.bolao_config_finalistas WHERE id = 1;
  IF cfg IS NULL THEN
    RAISE EXCEPTION 'Configuração de finalistas não encontrada';
  END IF;
  IF cfg.status <> 'aberta' OR (cfg.prazo_fim IS NOT NULL AND now() >= cfg.prazo_fim) THEN
    RAISE EXCEPTION 'Apostas de finalistas encerradas';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bolao_prevent_update_campeao()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cfg RECORD;
BEGIN
  SELECT * INTO cfg FROM public.bolao_config_campeao WHERE id = 1;
  IF cfg IS NULL THEN
    RAISE EXCEPTION 'Configuração de campeão não encontrada';
  END IF;
  IF cfg.status <> 'aberta' OR (cfg.prazo_fim IS NOT NULL AND now() >= cfg.prazo_fim) THEN
    RAISE EXCEPTION 'Apostas de campeão encerradas';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bolao_prevent_update_zebra()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cfg RECORD;
BEGIN
  SELECT * INTO cfg FROM public.bolao_config_zebra WHERE id = 1;
  IF cfg IS NULL THEN
    RAISE EXCEPTION 'Configuração de zebra não encontrada';
  END IF;
  IF cfg.status <> 'aberta' OR (cfg.prazo_fim IS NOT NULL AND now() >= cfg.prazo_fim) THEN
    RAISE EXCEPTION 'Apostas de zebra encerradas';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.bolao_prevent_update_goleada()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cfg RECORD;
BEGIN
  SELECT * INTO cfg FROM public.bolao_config_goleada WHERE id = 1;
  IF cfg IS NULL THEN
    RAISE EXCEPTION 'Configuração de goleada não encontrada';
  END IF;
  IF cfg.status <> 'aberta' OR (cfg.prazo_fim IS NOT NULL AND now() >= cfg.prazo_fim) THEN
    RAISE EXCEPTION 'Apostas de goleada encerradas';
  END IF;
  RETURN NEW;
END;
$$;

-- Install triggers for other bets
CREATE TRIGGER bolao_finalistas_prevent_update
  BEFORE UPDATE ON public.bolao_apostas_finalistas
  FOR EACH ROW EXECUTE FUNCTION public.bolao_prevent_update_finalistas();

CREATE TRIGGER bolao_campeao_prevent_update
  BEFORE UPDATE ON public.bolao_apostas_campeao
  FOR EACH ROW EXECUTE FUNCTION public.bolao_prevent_update_campeao();

CREATE TRIGGER bolao_zebra_prevent_update
  BEFORE UPDATE ON public.bolao_apostas_zebra
  FOR EACH ROW EXECUTE FUNCTION public.bolao_prevent_update_zebra();

CREATE TRIGGER bolao_goleada_prevent_update
  BEFORE UPDATE ON public.bolao_apostas_goleada
  FOR EACH ROW EXECUTE FUNCTION public.bolao_prevent_update_goleada();

-- 4. When config is closed/fechada or prazo_fim reached, stamp bloqueado_em for existing bets
CREATE OR REPLACE FUNCTION public.bolao_stamp_bets_on_config_close()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'bolao_config_finalistas' THEN
    IF NEW.status <> OLD.status AND NEW.status IN ('fechada','apurada') THEN
      UPDATE public.bolao_apostas_finalistas SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    ELSIF OLD.prazo_fim IS NOT NULL AND NEW.prazo_fim IS NOT NULL AND NEW.prazo_fim <> OLD.prazo_fim AND now() >= NEW.prazo_fim THEN
      UPDATE public.bolao_apostas_finalistas SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    END IF;
  ELSIF TG_TABLE_NAME = 'bolao_config_campeao' THEN
    IF NEW.status <> OLD.status AND NEW.status IN ('fechada','apurada') THEN
      UPDATE public.bolao_apostas_campeao SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    ELSIF OLD.prazo_fim IS NOT NULL AND NEW.prazo_fim IS NOT NULL AND NEW.prazo_fim <> OLD.prazo_fim AND now() >= NEW.prazo_fim THEN
      UPDATE public.bolao_apostas_campeao SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    END IF;
  ELSIF TG_TABLE_NAME = 'bolao_config_zebra' THEN
    IF NEW.status <> OLD.status AND NEW.status IN ('fechada','apurada') THEN
      UPDATE public.bolao_apostas_zebra SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    ELSIF OLD.prazo_fim IS NOT NULL AND NEW.prazo_fim IS NOT NULL AND NEW.prazo_fim <> OLD.prazo_fim AND now() >= NEW.prazo_fim THEN
      UPDATE public.bolao_apostas_zebra SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    END IF;
  ELSIF TG_TABLE_NAME = 'bolao_config_goleada' THEN
    IF NEW.status <> OLD.status AND NEW.status IN ('fechada','apurada') THEN
      UPDATE public.bolao_apostas_goleada SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    ELSIF OLD.prazo_fim IS NOT NULL AND NEW.prazo_fim IS NOT NULL AND NEW.prazo_fim <> OLD.prazo_fim AND now() >= NEW.prazo_fim THEN
      UPDATE public.bolao_apostas_goleada SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Attach the trigger function to each config table
CREATE TRIGGER bolao_finalistas_config_after_update
  AFTER UPDATE ON public.bolao_config_finalistas
  FOR EACH ROW EXECUTE FUNCTION public.bolao_stamp_bets_on_config_close();

CREATE TRIGGER bolao_campeao_config_after_update
  AFTER UPDATE ON public.bolao_config_campeao
  FOR EACH ROW EXECUTE FUNCTION public.bolao_stamp_bets_on_config_close();

CREATE TRIGGER bolao_zebra_config_after_update
  AFTER UPDATE ON public.bolao_config_zebra
  FOR EACH ROW EXECUTE FUNCTION public.bolao_stamp_bets_on_config_close();

CREATE TRIGGER bolao_goleada_config_after_update
  AFTER UPDATE ON public.bolao_config_goleada
  FOR EACH ROW EXECUTE FUNCTION public.bolao_stamp_bets_on_config_close();

-- 5. Ensure inserts record confirmado_em (default handles this), but add trigger to set if missing
CREATE OR REPLACE FUNCTION public.bolao_set_confirmado_on_insert()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.confirmado_em IS NULL THEN
    NEW.confirmado_em = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bolao_confirmado_artilheiro_insert
  BEFORE INSERT ON public.bolao_apostas_artilheiro
  FOR EACH ROW EXECUTE FUNCTION public.bolao_set_confirmado_on_insert();

CREATE TRIGGER bolao_confirmado_finalistas_insert
  BEFORE INSERT ON public.bolao_apostas_finalistas
  FOR EACH ROW EXECUTE FUNCTION public.bolao_set_confirmado_on_insert();

CREATE TRIGGER bolao_confirmado_campeao_insert
  BEFORE INSERT ON public.bolao_apostas_campeao
  FOR EACH ROW EXECUTE FUNCTION public.bolao_set_confirmado_on_insert();

CREATE TRIGGER bolao_confirmado_zebra_insert
  BEFORE INSERT ON public.bolao_apostas_zebra
  FOR EACH ROW EXECUTE FUNCTION public.bolao_set_confirmado_on_insert();

CREATE TRIGGER bolao_confirmado_goleada_insert
  BEFORE INSERT ON public.bolao_apostas_goleada
  FOR EACH ROW EXECUTE FUNCTION public.bolao_set_confirmado_on_insert();

-- Done
-- Migration: Block special bets when prazo_fim is reached and log the action

-- Function: block special bets modules when their prazo_fim <= now()
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

END;
$$;

-- Install pg_cron job to run every 5 minutes (unschedule first if exists)
DO $$
BEGIN
  PERFORM cron.unschedule('bolao-block-specials');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

SELECT cron.schedule('bolao-block-specials', '*/5 * * * *', $$SELECT public.bolao_cron_block_specials();$$);
-- Remove sorteio-related tables and columns
DROP TABLE IF EXISTS public.bolao_sorteio_jogo_ordem CASCADE;
DROP TABLE IF EXISTS public.bolao_sorteio_ordem CASCADE;

ALTER TABLE public.bolao_jogos DROP COLUMN IF EXISTS sorteio_realizado CASCADE;
ALTER TABLE public.bolao_config DROP COLUMN IF EXISTS sorteio_realizado CASCADE;
ALTER TABLE public.bolao_usuarios DROP COLUMN IF EXISTS ordem_sorteio CASCADE;
-- 1. Drop trigger function that blocks special bets after deadline and the artilheiro immutability trigger
DROP FUNCTION IF EXISTS public.bolao_trg_aposta_especial_bloqueada CASCADE;
DROP FUNCTION IF EXISTS public.bolao_trg_artilheiro_imutavel CASCADE;

-- 2. Rename columns from confirmada_em/bloqueada_em to confirmado_em/bloqueado_em
ALTER TABLE public.bolao_apostas_artilheiro RENAME COLUMN confirmada_em TO confirmado_em;
ALTER TABLE public.bolao_apostas_artilheiro RENAME COLUMN bloqueada_em TO bloqueado_em;

ALTER TABLE public.bolao_apostas_campeao RENAME COLUMN confirmada_em TO confirmado_em;
ALTER TABLE public.bolao_apostas_campeao RENAME COLUMN bloqueada_em TO bloqueado_em;

ALTER TABLE public.bolao_apostas_finalistas RENAME COLUMN confirmada_em TO confirmado_em;
ALTER TABLE public.bolao_apostas_finalistas RENAME COLUMN bloqueada_em TO bloqueado_em;

ALTER TABLE public.bolao_apostas_zebra RENAME COLUMN confirmada_em TO confirmado_em;
ALTER TABLE public.bolao_apostas_zebra RENAME COLUMN bloqueada_em TO bloqueado_em;

ALTER TABLE public.bolao_apostas_goleada RENAME COLUMN confirmada_em TO confirmado_em;
ALTER TABLE public.bolao_apostas_goleada RENAME COLUMN bloqueada_em TO bloqueado_em;
-- 1. Unschedule and drop the automatic specials blocking cron job
DO $$
BEGIN
  PERFORM cron.unschedule('bolao-block-specials');
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

DROP FUNCTION IF EXISTS public.bolao_cron_block_specials() CASCADE;

-- 2. Open all configuration statuses and set deadlines to far-future (so both games and special bets remain open)
UPDATE public.bolao_config SET status = 'ABERTO';

UPDATE public.bolao_config_campeao SET status = 'aberta', prazo_fim = '2099-12-31 23:59:59+00';
UPDATE public.bolao_config_finalistas SET status = 'aberta', prazo_fim = '2099-12-31 23:59:59+00';
UPDATE public.bolao_config_zebra SET status = 'aberta', prazo_fim = '2099-12-31 23:59:59+00';
UPDATE public.bolao_config_goleada SET status = 'aberta', prazo_fim = '2099-12-31 23:59:59+00';
UPDATE public.bolao_config_artilheiro SET status = 'aberta', prazo_fim = '2099-12-31 23:59:59+00';

-- 3. Clear the block timestamp for all participants' existing bets
UPDATE public.bolao_apostas_campeao SET bloqueado_em = NULL;
UPDATE public.bolao_apostas_finalistas SET bloqueado_em = NULL;
UPDATE public.bolao_apostas_zebra SET bloqueado_em = NULL;
UPDATE public.bolao_apostas_goleada SET bloqueado_em = NULL;
UPDATE public.bolao_apostas_artilheiro SET bloqueado_em = NULL;
-- Create push tokens table linked to users
CREATE TABLE IF NOT EXISTS public.bolao_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index unique on endpoint when active (1 user active on 1 endpoint/device at any time)
CREATE UNIQUE INDEX IF NOT EXISTS bolao_push_tokens_endpoint_active_idx ON public.bolao_push_tokens(endpoint) WHERE (is_active = true);

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bolao_push_tokens TO anon, authenticated;
GRANT ALL ON public.bolao_push_tokens TO service_role;

-- Enable RLS
ALTER TABLE public.bolao_push_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anonymous RLS operations since authentication check is handled by Edge Functions (using PIN/nome)
CREATE POLICY "allow_all_push_tokens" ON public.bolao_push_tokens FOR ALL USING (true);
-- Remove absolute blocking trigger and function on artilheiro update
DROP TRIGGER IF EXISTS bolao_artilheiro_block_update ON public.bolao_apostas_artilheiro CASCADE;
DROP FUNCTION IF EXISTS public.bolao_prevent_artilheiro_update() CASCADE;

-- Create dynamic update prevention trigger for artilheiro (like finalistas, zebra, etc.)
CREATE OR REPLACE FUNCTION public.bolao_prevent_update_artilheiro()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE cfg RECORD;
BEGIN
  SELECT * INTO cfg FROM public.bolao_config_artilheiro WHERE id = 1;
  IF cfg IS NULL THEN
    RAISE EXCEPTION 'Configuração de artilheiro não encontrada';
  END IF;
  IF cfg.status <> 'aberta' OR (cfg.prazo_fim IS NOT NULL AND now() >= cfg.prazo_fim) THEN
    RAISE EXCEPTION 'Apostas de artilheiro encerradas';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER bolao_artilheiro_prevent_update
  BEFORE UPDATE ON public.bolao_apostas_artilheiro
  FOR EACH ROW EXECUTE FUNCTION public.bolao_prevent_update_artilheiro();

-- Update stamp bloqueado_em on config close trigger to support bolao_config_artilheiro
CREATE OR REPLACE FUNCTION public.bolao_stamp_bets_on_config_close()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_TABLE_NAME = 'bolao_config_finalistas' THEN
    IF NEW.status <> OLD.status AND NEW.status IN ('fechada','apurada') THEN
      UPDATE public.bolao_apostas_finalistas SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    ELSIF OLD.prazo_fim IS NOT NULL AND NEW.prazo_fim IS NOT NULL AND NEW.prazo_fim <> OLD.prazo_fim AND now() >= NEW.prazo_fim THEN
      UPDATE public.bolao_apostas_finalistas SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    END IF;
  ELSIF TG_TABLE_NAME = 'bolao_config_campeao' THEN
    IF NEW.status <> OLD.status AND NEW.status IN ('fechada','apurada') THEN
      UPDATE public.bolao_apostas_campeao SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    ELSIF OLD.prazo_fim IS NOT NULL AND NEW.prazo_fim IS NOT NULL AND NEW.prazo_fim <> OLD.prazo_fim AND now() >= NEW.prazo_fim THEN
      UPDATE public.bolao_apostas_campeao SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    END IF;
  ELSIF TG_TABLE_NAME = 'bolao_config_zebra' THEN
    IF NEW.status <> OLD.status AND NEW.status IN ('fechada','apurada') THEN
      UPDATE public.bolao_apostas_zebra SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    ELSIF OLD.prazo_fim IS NOT NULL AND NEW.prazo_fim IS NOT NULL AND NEW.prazo_fim <> OLD.prazo_fim AND now() >= NEW.prazo_fim THEN
      UPDATE public.bolao_apostas_zebra SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    END IF;
  ELSIF TG_TABLE_NAME = 'bolao_config_goleada' THEN
    IF NEW.status <> OLD.status AND NEW.status IN ('fechada','apurada') THEN
      UPDATE public.bolao_apostas_goleada SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    ELSIF OLD.prazo_fim IS NOT NULL AND NEW.prazo_fim IS NOT NULL AND NEW.prazo_fim <> OLD.prazo_fim AND now() >= NEW.prazo_fim THEN
      UPDATE public.bolao_apostas_goleada SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    END IF;
  ELSIF TG_TABLE_NAME = 'bolao_config_artilheiro' THEN
    IF NEW.status <> OLD.status AND NEW.status IN ('fechada','apurada') THEN
      UPDATE public.bolao_apostas_artilheiro SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    ELSIF OLD.prazo_fim IS NOT NULL AND NEW.prazo_fim IS NOT NULL AND NEW.prazo_fim <> OLD.prazo_fim AND now() >= NEW.prazo_fim THEN
      UPDATE public.bolao_apostas_artilheiro SET bloqueado_em = now() WHERE bloqueado_em IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bolao_artilheiro_config_after_update ON public.bolao_config_artilheiro;
CREATE TRIGGER bolao_artilheiro_config_after_update
  AFTER UPDATE ON public.bolao_config_artilheiro
  FOR EACH ROW EXECUTE FUNCTION public.bolao_stamp_bets_on_config_close();
-- Recreate public views to reveal all user bets and palpites unconditionally to everyone

-- 1. View: bolao_palpites_publica
DROP VIEW IF EXISTS public.bolao_palpites_publica CASCADE;
CREATE OR REPLACE VIEW public.bolao_palpites_publica
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.usuario_id,
  p.jogo_id,
  p.gols_casa,
  p.gols_fora,
  true AS revelado,
  p.acertou,
  p.criado_em
FROM public.bolao_palpites p;
GRANT SELECT ON public.bolao_palpites_publica TO anon, authenticated;

-- 2. View: bolao_apostas_artilheiro_publica
DROP VIEW IF EXISTS public.bolao_apostas_artilheiro_publica CASCADE;
CREATE OR REPLACE VIEW public.bolao_apostas_artilheiro_publica
WITH (security_invoker = true) AS
SELECT
  a.id,
  a.usuario_id,
  a.jogador_id,
  a.jogador_apostado,
  true AS revelado,
  a.acertou,
  a.criado_em,
  a.confirmado_em,
  a.bloqueado_em
FROM public.bolao_apostas_artilheiro a;
GRANT SELECT ON public.bolao_apostas_artilheiro_publica TO anon, authenticated;

-- 3. View: bolao_apostas_campeao_publica
DROP VIEW IF EXISTS public.bolao_apostas_campeao_publica CASCADE;
CREATE OR REPLACE VIEW public.bolao_apostas_campeao_publica
WITH (security_invoker = true) AS
SELECT
  a.id,
  a.usuario_id,
  a.time_campeao,
  true AS revelado,
  a.acertou,
  a.criado_em
FROM public.bolao_apostas_campeao a;
GRANT SELECT ON public.bolao_apostas_campeao_publica TO anon, authenticated;

-- 4. View: bolao_apostas_zebra_publica
DROP VIEW IF EXISTS public.bolao_apostas_zebra_publica CASCADE;
CREATE OR REPLACE VIEW public.bolao_apostas_zebra_publica
WITH (security_invoker = true) AS
SELECT
  a.id,
  a.usuario_id,
  a.zebra_apostada,
  true AS revelado,
  a.acertou,
  a.criado_em
FROM public.bolao_apostas_zebra a;
GRANT SELECT ON public.bolao_apostas_zebra_publica TO anon, authenticated;

-- 5. View: bolao_apostas_goleada_publica
DROP VIEW IF EXISTS public.bolao_apostas_goleada_publica CASCADE;
CREATE OR REPLACE VIEW public.bolao_apostas_goleada_publica
WITH (security_invoker = true) AS
SELECT
  a.id,
  a.usuario_id,
  a.time_casa,
  a.time_fora,
  a.gols_casa,
  a.gols_fora,
  true AS revelado,
  a.acertou,
  a.criado_em
FROM public.bolao_apostas_goleada a;
GRANT SELECT ON public.bolao_apostas_goleada_publica TO anon, authenticated;

-- 6. View: bolao_apostas_finalistas_publica
DROP VIEW IF EXISTS public.bolao_apostas_finalistas_publica CASCADE;
CREATE OR REPLACE VIEW public.bolao_apostas_finalistas_publica
WITH (security_invoker = true) AS
SELECT
  a.id,
  a.usuario_id,
  a.time1,
  a.time2,
  true AS revelado,
  a.acertou_os_dois,
  a.acertou_um,
  a.criado_em,
  a.confirmado_em,
  a.bloqueado_em
FROM public.bolao_apostas_finalistas a;
GRANT SELECT ON public.bolao_apostas_finalistas_publica TO anon, authenticated;
-- Habilitar Supabase Realtime na tabela bolao_jogos
-- Permite que o frontend receba updates em tempo real via WebSocket
-- quando o admin atualiza placares de jogos ao vivo.

DO $$
BEGIN
  -- Adiciona bolao_jogos à publicação do Realtime (se ainda não estiver)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'bolao_jogos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bolao_jogos;
  END IF;
END
$$;

-- Garante que a tabela tem REPLICA IDENTITY FULL
-- (necessário para o Realtime enviar o row completo no payload)
ALTER TABLE bolao_jogos REPLICA IDENTITY FULL;
-- 1. Tabela de reações em jogos
CREATE TABLE IF NOT EXISTS bolao_reacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id UUID NOT NULL REFERENCES bolao_jogos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES bolao_usuarios(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('🔥','😱','😂','👏','😭','⚽')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(jogo_id, usuario_id, emoji)
);

ALTER TABLE bolao_reacoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reacoes visíveis para todos" ON bolao_reacoes;
CREATE POLICY "Reacoes visíveis para todos" ON bolao_reacoes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Reacoes inseríveis por todos" ON bolao_reacoes;
CREATE POLICY "Reacoes inseríveis por todos" ON bolao_reacoes FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Reacoes deletáveis por dono" ON bolao_reacoes;
CREATE POLICY "Reacoes deletáveis por dono" ON bolao_reacoes FOR DELETE USING (true);

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bolao_reacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bolao_reacoes;
  END IF;
END $$;

-- 2. Coluna de prêmio configurável na config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bolao_config' AND column_name = 'premio_descricao'
  ) THEN
    ALTER TABLE bolao_config ADD COLUMN premio_descricao TEXT DEFAULT 'Troféu + Churrasco para o campeão! 🏆🥩';
  END IF;
END $$;

-- 3. Coluna para provocações (ranking anterior snapshot)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bolao_config' AND column_name = 'ranking_snapshot'
  ) THEN
    ALTER TABLE bolao_config ADD COLUMN ranking_snapshot JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
-- ================================================================
-- MIGRATION 019: PWA, Admin manual lock, Convites, Broadcasts e Analytics
-- Idempotente: pode rodar múltiplas vezes sem corromper dados
-- ================================================================

-- 1. Adicionar coluna bloqueado_manual na tabela de jogos
ALTER TABLE public.bolao_jogos
  ADD COLUMN IF NOT EXISTS bloqueado_manual boolean NOT NULL DEFAULT false;

-- 2. Tabela de convites (bolao_convites)
CREATE TABLE IF NOT EXISTS public.bolao_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  limite_vagas integer,
  vagas_usadas integer NOT NULL DEFAULT 0,
  expira_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bolao_convites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura publica convites" ON public.bolao_convites;
CREATE POLICY "leitura publica convites" ON public.bolao_convites
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "insert convites admin" ON public.bolao_convites;
CREATE POLICY "insert convites admin" ON public.bolao_convites
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "update convites anon" ON public.bolao_convites;
CREATE POLICY "update convites anon" ON public.bolao_convites
  FOR UPDATE USING (true) WITH CHECK (true);

GRANT SELECT, UPDATE ON public.bolao_convites TO anon, authenticated;
GRANT ALL ON public.bolao_convites TO service_role;

-- 3. Tabela de auditoria de alteração de jogos (bolao_auditoria_jogos)
CREATE TABLE IF NOT EXISTS public.bolao_auditoria_jogos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id uuid REFERENCES public.bolao_jogos(id) ON DELETE CASCADE,
  placar_casa_antigo integer,
  placar_fora_antigo integer,
  placar_casa_novo integer,
  placar_fora_novo integer,
  status_antigo text,
  status_novo text,
  responsavel text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bolao_auditoria_jogos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura auditoria admin" ON public.bolao_auditoria_jogos;
CREATE POLICY "leitura auditoria admin" ON public.bolao_auditoria_jogos
  FOR SELECT USING (true); -- leitura liberada para histórico de auditoria transparente

DROP POLICY IF EXISTS "all auditoria service_role" ON public.bolao_auditoria_jogos;
CREATE POLICY "all auditoria service_role" ON public.bolao_auditoria_jogos
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.bolao_auditoria_jogos TO anon, authenticated;
GRANT ALL ON public.bolao_auditoria_jogos TO service_role;

-- 4. Tabela de broadcasts (bolao_broadcasts)
CREATE TABLE IF NOT EXISTS public.bolao_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bolao_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura publica broadcasts" ON public.bolao_broadcasts;
CREATE POLICY "leitura publica broadcasts" ON public.bolao_broadcasts
  FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "all broadcasts service_role" ON public.bolao_broadcasts;
CREATE POLICY "all broadcasts service_role" ON public.bolao_broadcasts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.bolao_broadcasts TO anon, authenticated;
GRANT ALL ON public.bolao_broadcasts TO service_role;

-- 5. Tabela de telemetria/analytics (bolao_analytics)
CREATE TABLE IF NOT EXISTS public.bolao_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES public.bolao_usuarios(id) ON DELETE SET NULL,
  tela text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bolao_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert anonimo analytics" ON public.bolao_analytics;
CREATE POLICY "insert anonimo analytics" ON public.bolao_analytics
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "leitura analytics admin" ON public.bolao_analytics;
CREATE POLICY "leitura analytics admin" ON public.bolao_analytics
  FOR SELECT USING (true); -- livre consulta para painel administrativo

GRANT INSERT ON public.bolao_analytics TO anon, authenticated;
GRANT SELECT ON public.bolao_analytics TO anon, authenticated;
GRANT ALL ON public.bolao_analytics TO service_role;
-- Migration: Audit, Reset, and Business Rules Readequation (June 18, 2026)

-- 1. Reset all match results, processed standings, score calculations, prizes, and events before 18/06/2026
DELETE FROM public.bolao_premios 
WHERE referencia_id IN (
    SELECT id FROM public.bolao_jogos WHERE data_hora < '2026-06-18 00:00:00-03'
);

DELETE FROM public.bolao_jogo_eventos 
WHERE jogo_id IN (
    SELECT id FROM public.bolao_jogos WHERE data_hora < '2026-06-18 00:00:00-03'
);

DELETE FROM public.bolao_historico_alteracoes 
WHERE jogo_id IN (
    SELECT id FROM public.bolao_jogos WHERE data_hora < '2026-06-18 00:00:00-03'
);

DELETE FROM public.bolao_palpites 
WHERE jogo_id IN (
    SELECT id FROM public.bolao_jogos WHERE data_hora < '2026-06-18 00:00:00-03'
);

UPDATE public.bolao_jogos 
SET placar_casa = NULL, 
    placar_fora = NULL, 
    minuto_jogo = NULL, 
    status = 'pendente', 
    acumulado = 0 
WHERE data_hora < '2026-06-18 00:00:00-03';

-- Reset contingency tables
DELETE FROM public.eventos 
WHERE partida_id IN (
    SELECT id FROM public.partidas WHERE data_jogo < '2026-06-18 00:00:00-03'
);

UPDATE public.partidas 
SET status = 'SCHEDULED' 
WHERE data_jogo < '2026-06-18 00:00:00-03';

-- 2. Turn off score exclusivity by default in bolao_config
UPDATE public.bolao_config 
SET exclusividade_placar = false 
WHERE id = 1;

-- 3. Add confirmado_em to bolao_palpites
ALTER TABLE public.bolao_palpites 
ADD COLUMN IF NOT EXISTS confirmado_em timestamptz DEFAULT now();

-- 4. Recreate the public view bolao_palpites_publica to hide bets until 15 minutes after kickoff
DROP VIEW IF EXISTS public.bolao_palpites_publica CASCADE;

CREATE OR REPLACE VIEW public.bolao_palpites_publica
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.usuario_id,
  p.jogo_id,
  CASE WHEN (j.data_hora + interval '15 minutes' <= now()) THEN p.gols_casa ELSE NULL END AS gols_casa,
  CASE WHEN (j.data_hora + interval '15 minutes' <= now()) THEN p.gols_fora ELSE NULL END AS gols_fora,
  (j.data_hora + interval '15 minutes' <= now()) AS revelado,
  p.acertou,
  p.criado_em,
  p.confirmado_em
FROM public.bolao_palpites p
JOIN public.bolao_jogos j ON j.id = p.jogo_id;

GRANT SELECT ON public.bolao_palpites_publica TO anon, authenticated;
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

  -- Vice = finalista que NÃO é o campeão real (usa colunas *_real)
  SELECT CASE
           WHEN finalista1_real = camp_real THEN finalista2_real
           WHEN finalista2_real = camp_real THEN finalista1_real
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
