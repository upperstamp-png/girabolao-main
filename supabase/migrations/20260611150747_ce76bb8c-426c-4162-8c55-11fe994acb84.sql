
-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.bolao_set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.atualizado_em = now(); RETURN NEW; END;
$$;

-- ========== USUARIOS ==========
CREATE TABLE public.bolao_usuarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  pin_hash text,
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_usuarios TO anon, authenticated;
GRANT ALL ON public.bolao_usuarios TO service_role;
ALTER TABLE public.bolao_usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura publica usuarios" ON public.bolao_usuarios FOR SELECT USING (true);

-- limite de 10 usuários
CREATE OR REPLACE FUNCTION public.bolao_limite_usuarios()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF (SELECT count(*) FROM public.bolao_usuarios) >= 10 THEN
    RAISE EXCEPTION 'Limite de 10 participantes atingido';
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER bolao_usuarios_limite BEFORE INSERT ON public.bolao_usuarios
FOR EACH ROW EXECUTE FUNCTION public.bolao_limite_usuarios();

-- ========== JOGOS ==========
CREATE TABLE public.bolao_jogos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_jogo_id integer NOT NULL UNIQUE,
  time_casa text NOT NULL,
  time_fora text NOT NULL,
  placar_casa integer,
  placar_fora integer,
  e_brasil boolean NOT NULL DEFAULT false,
  fase text NOT NULL,
  valor_entrada numeric(6,2) NOT NULL DEFAULT 5.00,
  status text NOT NULL DEFAULT 'pendente', -- pendente | ao_vivo | encerrado | apurado
  data_hora timestamptz NOT NULL,
  estadio text,
  acumulado numeric(10,2) NOT NULL DEFAULT 0.00,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_jogos TO anon, authenticated;
GRANT ALL ON public.bolao_jogos TO service_role;
ALTER TABLE public.bolao_jogos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura publica jogos" ON public.bolao_jogos FOR SELECT USING (true);
CREATE TRIGGER bolao_jogos_updated BEFORE UPDATE ON public.bolao_jogos
FOR EACH ROW EXECUTE FUNCTION public.bolao_set_updated_at();
CREATE INDEX bolao_jogos_data_idx ON public.bolao_jogos(data_hora);
CREATE INDEX bolao_jogos_fase_idx ON public.bolao_jogos(fase);

-- ========== PALPITES (placar) ==========
CREATE TABLE public.bolao_palpites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  jogo_id uuid NOT NULL REFERENCES public.bolao_jogos(id) ON DELETE CASCADE,
  gols_casa integer NOT NULL CHECK (gols_casa >= 0),
  gols_fora integer NOT NULL CHECK (gols_fora >= 0),
  acertou boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE(usuario_id, jogo_id)
);
-- Sem SELECT direto para anon — usa a view publica
GRANT ALL ON public.bolao_palpites TO service_role;
ALTER TABLE public.bolao_palpites ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER bolao_palpites_updated BEFORE UPDATE ON public.bolao_palpites
FOR EACH ROW EXECUTE FUNCTION public.bolao_set_updated_at();

-- View pública: só revela gols após início do jogo; antes, mostra apenas que palpitou
CREATE VIEW public.bolao_palpites_publica
WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.usuario_id,
  p.jogo_id,
  CASE WHEN j.data_hora <= now() THEN p.gols_casa ELSE NULL END AS gols_casa,
  CASE WHEN j.data_hora <= now() THEN p.gols_fora ELSE NULL END AS gols_fora,
  (j.data_hora <= now()) AS revelado,
  p.acertou,
  p.criado_em
FROM public.bolao_palpites p
JOIN public.bolao_jogos j ON j.id = p.jogo_id;
GRANT SELECT ON public.bolao_palpites_publica TO anon, authenticated;
-- Permitir que a view leia palpites mesmo com RLS (security_invoker reusa permissão do chamador)
CREATE POLICY "leitura palpites via view" ON public.bolao_palpites FOR SELECT USING (true);

-- ========== ARTILHEIRO ==========
CREATE TABLE public.bolao_apostas_artilheiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  jogador_apostado text NOT NULL,
  acertou boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bolao_apostas_artilheiro TO service_role;
ALTER TABLE public.bolao_apostas_artilheiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura artilheiro via view" ON public.bolao_apostas_artilheiro FOR SELECT USING (true);
CREATE TRIGGER bolao_artilheiro_updated BEFORE UPDATE ON public.bolao_apostas_artilheiro
FOR EACH ROW EXECUTE FUNCTION public.bolao_set_updated_at();

CREATE TABLE public.bolao_config_artilheiro (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status text NOT NULL DEFAULT 'aberta', -- aberta | fechada | apurada
  artilheiro_real text,
  total_arrecadado numeric(10,2) NOT NULL DEFAULT 0.00,
  acumulado_anterior numeric(10,2) NOT NULL DEFAULT 0.00,
  prazo_fim timestamptz NOT NULL DEFAULT '2026-06-11 19:00:00+00',
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bolao_config_artilheiro (id) VALUES (1);
GRANT SELECT ON public.bolao_config_artilheiro TO anon, authenticated;
GRANT ALL ON public.bolao_config_artilheiro TO service_role;
ALTER TABLE public.bolao_config_artilheiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura config artilheiro" ON public.bolao_config_artilheiro FOR SELECT USING (true);

CREATE VIEW public.bolao_apostas_artilheiro_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' THEN a.jogador_apostado ELSE NULL END AS jogador_apostado,
  (c.status = 'apurada') AS revelado,
  a.acertou, a.criado_em
FROM public.bolao_apostas_artilheiro a
CROSS JOIN public.bolao_config_artilheiro c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_artilheiro_publica TO anon, authenticated;

-- ========== FINALISTAS ==========
CREATE TABLE public.bolao_apostas_finalistas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  time1 text NOT NULL,
  time2 text NOT NULL,
  acertou_os_dois boolean,
  acertou_um boolean,
  criado_em timestamptz NOT NULL DEFAULT now(),
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.bolao_apostas_finalistas TO service_role;
ALTER TABLE public.bolao_apostas_finalistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura finalistas via view" ON public.bolao_apostas_finalistas FOR SELECT USING (true);
CREATE TRIGGER bolao_finalistas_updated BEFORE UPDATE ON public.bolao_apostas_finalistas
FOR EACH ROW EXECUTE FUNCTION public.bolao_set_updated_at();

CREATE TABLE public.bolao_config_finalistas (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  status text NOT NULL DEFAULT 'fechada', -- fechada | aberta | apurada
  finalista1_real text,
  finalista2_real text,
  total_arrecadado numeric(10,2) NOT NULL DEFAULT 0.00,
  acumulado_anterior numeric(10,2) NOT NULL DEFAULT 0.00,
  prazo_fim timestamptz,
  atualizado_em timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.bolao_config_finalistas (id) VALUES (1);
GRANT SELECT ON public.bolao_config_finalistas TO anon, authenticated;
GRANT ALL ON public.bolao_config_finalistas TO service_role;
ALTER TABLE public.bolao_config_finalistas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura config finalistas" ON public.bolao_config_finalistas FOR SELECT USING (true);

CREATE VIEW public.bolao_apostas_finalistas_publica
WITH (security_invoker = true) AS
SELECT
  a.id, a.usuario_id,
  CASE WHEN c.status = 'apurada' THEN a.time1 ELSE NULL END AS time1,
  CASE WHEN c.status = 'apurada' THEN a.time2 ELSE NULL END AS time2,
  (c.status = 'apurada') AS revelado,
  a.acertou_os_dois, a.acertou_um, a.criado_em
FROM public.bolao_apostas_finalistas a
CROSS JOIN public.bolao_config_finalistas c WHERE c.id = 1;
GRANT SELECT ON public.bolao_apostas_finalistas_publica TO anon, authenticated;

-- ========== PREMIOS ==========
CREATE TABLE public.bolao_premios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modalidade text NOT NULL, -- placar | artilheiro | finalistas
  referencia_id uuid, -- jogo_id no caso placar
  usuario_id uuid REFERENCES public.bolao_usuarios(id) ON DELETE SET NULL,
  valor numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pendente', -- pendente | pago | acumulado
  criado_em timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.bolao_premios TO anon, authenticated;
GRANT ALL ON public.bolao_premios TO service_role;
ALTER TABLE public.bolao_premios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leitura premios" ON public.bolao_premios FOR SELECT USING (true);
CREATE INDEX bolao_premios_usuario_idx ON public.bolao_premios(usuario_id);
