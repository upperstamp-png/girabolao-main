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
