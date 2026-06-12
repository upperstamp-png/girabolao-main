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
