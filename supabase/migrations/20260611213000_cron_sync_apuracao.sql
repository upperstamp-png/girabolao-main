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
