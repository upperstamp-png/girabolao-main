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
