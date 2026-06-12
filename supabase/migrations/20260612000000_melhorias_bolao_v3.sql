-- ========== CAMPEÃO ==========
CREATE TABLE IF NOT EXISTS public.bolao_config_campeao (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status text NOT NULL DEFAULT 'aberta', -- aberta | fechada | apurada
  campeao_real text,
  total_arrecadado numeric(10,2) NOT NULL DEFAULT 0.00,
  acumulado_anterior numeric(10,2) NOT NULL DEFAULT 0.00,
  prazo_fim timestamptz NOT NULL DEFAULT '2026-06-11 19:00:00+00',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bolao_config_campeao (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.bolao_config_campeao TO anon, authenticated;
GRANT ALL ON public.bolao_config_campeao TO service_role;
ALTER TABLE public.bolao_config_campeao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura config campeao" ON public.bolao_config_campeao;
CREATE POLICY "leitura config campeao" ON public.bolao_config_campeao FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.bolao_apostas_campeao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  time_campeao text NOT NULL,
  acertou boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bolao_apostas_campeao TO service_role;
ALTER TABLE public.bolao_apostas_campeao ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura campeao via view" ON public.bolao_apostas_campeao;
CREATE POLICY "leitura campeao via view" ON public.bolao_apostas_campeao FOR SELECT USING (true);

CREATE OR REPLACE VIEW public.bolao_apostas_campeao_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' THEN a.time_campeao ELSE NULL END AS time_campeao,
  (c.status = 'apurada') AS revelado,
  a.acertou, a.criado_em
FROM public.bolao_apostas_campeao a
CROSS JOIN public.bolao_config_campeao c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_campeao_publica TO anon, authenticated;


-- ========== ZEBRA ==========
CREATE TABLE IF NOT EXISTS public.bolao_config_zebra (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status text NOT NULL DEFAULT 'aberta', -- aberta | fechada | apurada
  zebra_real text,
  total_arrecadado numeric(10,2) NOT NULL DEFAULT 0.00,
  acumulado_anterior numeric(10,2) NOT NULL DEFAULT 0.00,
  prazo_fim timestamptz NOT NULL DEFAULT '2026-06-11 19:00:00+00',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bolao_config_zebra (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.bolao_config_zebra TO anon, authenticated;
GRANT ALL ON public.bolao_config_zebra TO service_role;
ALTER TABLE public.bolao_config_zebra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura config zebra" ON public.bolao_config_zebra;
CREATE POLICY "leitura config zebra" ON public.bolao_config_zebra FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.bolao_apostas_zebra (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  zebra_apostada text NOT NULL,
  acertou boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bolao_apostas_zebra TO service_role;
ALTER TABLE public.bolao_apostas_zebra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura zebra via view" ON public.bolao_apostas_zebra;
CREATE POLICY "leitura zebra via view" ON public.bolao_apostas_zebra FOR SELECT USING (true);

CREATE OR REPLACE VIEW public.bolao_apostas_zebra_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' THEN a.zebra_apostada ELSE NULL END AS zebra_apostada,
  (c.status = 'apurada') AS revelado,
  a.acertou, a.criado_em
FROM public.bolao_apostas_zebra a
CROSS JOIN public.bolao_config_zebra c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_zebra_publica TO anon, authenticated;


-- ========== MAIOR GOLEADA ==========
CREATE TABLE IF NOT EXISTS public.bolao_config_goleada (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status text NOT NULL DEFAULT 'aberta', -- aberta | fechada | apurada
  goleada_time_casa_real text,
  goleada_time_fora_real text,
  goleada_gols_casa_real integer,
  goleada_gols_fora_real integer,
  total_arrecadado numeric(10,2) NOT NULL DEFAULT 0.00,
  acumulado_anterior numeric(10,2) NOT NULL DEFAULT 0.00,
  prazo_fim timestamptz NOT NULL DEFAULT '2026-06-11 19:00:00+00',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bolao_config_goleada (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
GRANT SELECT ON public.bolao_config_goleada TO anon, authenticated;
GRANT ALL ON public.bolao_config_goleada TO service_role;
ALTER TABLE public.bolao_config_goleada ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura config goleada" ON public.bolao_config_goleada;
CREATE POLICY "leitura config goleada" ON public.bolao_config_goleada FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.bolao_apostas_goleada (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  time_casa text NOT NULL,
  time_fora text NOT NULL,
  gols_casa integer NOT NULL CHECK (gols_casa >= 0),
  gols_fora integer NOT NULL CHECK (gols_fora >= 0),
  acertou boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bolao_apostas_goleada TO service_role;
ALTER TABLE public.bolao_apostas_goleada ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura goleada via view" ON public.bolao_apostas_goleada;
CREATE POLICY "leitura goleada via view" ON public.bolao_apostas_goleada FOR SELECT USING (true);

CREATE OR REPLACE VIEW public.bolao_apostas_goleada_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' THEN a.time_casa ELSE NULL END AS time_casa,
  CASE WHEN c.status = 'apurada' THEN a.time_fora ELSE NULL END AS time_fora,
  CASE WHEN c.status = 'apurada' THEN a.gols_casa ELSE NULL END AS gols_casa,
  CASE WHEN c.status = 'apurada' THEN a.gols_fora ELSE NULL END AS gols_fora,
  (c.status = 'apurada') AS revelado,
  a.acertou, a.criado_em
FROM public.bolao_apostas_goleada a
CROSS JOIN public.bolao_config_goleada c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_goleada_publica TO anon, authenticated;


-- ========== HISTÓRICO DE ALTERAÇÕES (AUDIT LOG) ==========
CREATE TABLE IF NOT EXISTS public.bolao_historico_alteracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  jogo_id uuid NOT NULL REFERENCES public.bolao_jogos(id) ON DELETE CASCADE,
  acao text NOT NULL CHECK (acao IN ('criar', 'alterar')),
  gols_casa_antigo integer,
  gols_fora_antigo integer,
  gols_casa_novo integer NOT NULL,
  gols_fora_novo integer NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_historico_alteracoes TO anon, authenticated;
GRANT ALL ON public.bolao_historico_alteracoes TO service_role;
ALTER TABLE public.bolao_historico_alteracoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura publica historico" ON public.bolao_historico_alteracoes;
CREATE POLICY "leitura publica historico" ON public.bolao_historico_alteracoes FOR SELECT USING (true);
