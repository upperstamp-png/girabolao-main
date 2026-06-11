-- Sorteio de ordem por jogo: cada partida tem sua própria ordem de palpites.

ALTER TABLE public.bolao_jogos
  ADD COLUMN IF NOT EXISTS sorteio_realizado boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.bolao_sorteio_jogo_ordem (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id uuid NOT NULL REFERENCES public.bolao_jogos(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  posicao integer NOT NULL CHECK (posicao > 0),
  sorteado_em timestamptz NOT NULL DEFAULT now(),
  UNIQUE (jogo_id, usuario_id),
  UNIQUE (jogo_id, posicao)
);

CREATE INDEX IF NOT EXISTS bolao_sorteio_jogo_jogo_idx ON public.bolao_sorteio_jogo_ordem(jogo_id);
CREATE INDEX IF NOT EXISTS bolao_sorteio_jogo_posicao_idx ON public.bolao_sorteio_jogo_ordem(jogo_id, posicao);

GRANT SELECT ON public.bolao_sorteio_jogo_ordem TO anon, authenticated;
GRANT ALL ON public.bolao_sorteio_jogo_ordem TO service_role;

ALTER TABLE public.bolao_sorteio_jogo_ordem ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leitura publica sorteio jogo" ON public.bolao_sorteio_jogo_ordem;
CREATE POLICY "leitura publica sorteio jogo" ON public.bolao_sorteio_jogo_ordem FOR SELECT USING (true);

-- Garantir participantes padrão com PIN 1234 (idempotente).
INSERT INTO public.bolao_usuarios (nome, pin_hash, e_participante_padrao)
SELECT v.nome, 'c26ec9ab946a8d14304fc6cac6d9619a37539ca12b88b2e1d6d734fa013374ba', true
FROM (VALUES
  ('Igor'), ('Natan'), ('Alison'), ('Pedro'), ('Zé'), ('Paulo'), ('Vitinho'), ('Kelvin')
) AS v(nome)
WHERE NOT EXISTS (
  SELECT 1 FROM public.bolao_usuarios u WHERE u.nome = v.nome
);

UPDATE public.bolao_usuarios
SET pin_hash = 'c26ec9ab946a8d14304fc6cac6d9619a37539ca12b88b2e1d6d734fa013374ba',
    e_participante_padrao = true
WHERE nome IN ('Igor','Natan','Alison','Pedro','Zé','Paulo','Vitinho','Kelvin')
  AND excluido_manualmente = false
  AND (pin_hash IS NULL OR e_participante_padrao IS NOT TRUE);
