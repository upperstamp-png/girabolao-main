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
