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
