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
