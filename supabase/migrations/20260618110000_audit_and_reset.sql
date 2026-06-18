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
