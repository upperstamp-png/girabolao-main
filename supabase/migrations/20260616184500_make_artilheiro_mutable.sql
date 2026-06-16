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
