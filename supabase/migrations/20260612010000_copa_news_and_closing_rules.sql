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

