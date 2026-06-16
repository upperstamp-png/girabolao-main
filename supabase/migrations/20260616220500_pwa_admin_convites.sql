-- ================================================================
-- MIGRATION 019: PWA, Admin manual lock, Convites, Broadcasts e Analytics
-- Idempotente: pode rodar múltiplas vezes sem corromper dados
-- ================================================================

-- 1. Adicionar coluna bloqueado_manual na tabela de jogos
ALTER TABLE public.bolao_jogos
  ADD COLUMN IF NOT EXISTS bloqueado_manual boolean NOT NULL DEFAULT false;

-- 2. Tabela de convites (bolao_convites)
CREATE TABLE IF NOT EXISTS public.bolao_convites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  limite_vagas integer,
  vagas_usadas integer NOT NULL DEFAULT 0,
  expira_em timestamptz,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bolao_convites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura publica convites" ON public.bolao_convites;
CREATE POLICY "leitura publica convites" ON public.bolao_convites
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "insert convites admin" ON public.bolao_convites;
CREATE POLICY "insert convites admin" ON public.bolao_convites
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "update convites anon" ON public.bolao_convites;
CREATE POLICY "update convites anon" ON public.bolao_convites
  FOR UPDATE USING (true) WITH CHECK (true);

GRANT SELECT, UPDATE ON public.bolao_convites TO anon, authenticated;
GRANT ALL ON public.bolao_convites TO service_role;

-- 3. Tabela de auditoria de alteração de jogos (bolao_auditoria_jogos)
CREATE TABLE IF NOT EXISTS public.bolao_auditoria_jogos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id uuid REFERENCES public.bolao_jogos(id) ON DELETE CASCADE,
  placar_casa_antigo integer,
  placar_fora_antigo integer,
  placar_casa_novo integer,
  placar_fora_novo integer,
  status_antigo text,
  status_novo text,
  responsavel text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bolao_auditoria_jogos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura auditoria admin" ON public.bolao_auditoria_jogos;
CREATE POLICY "leitura auditoria admin" ON public.bolao_auditoria_jogos
  FOR SELECT USING (true); -- leitura liberada para histórico de auditoria transparente

DROP POLICY IF EXISTS "all auditoria service_role" ON public.bolao_auditoria_jogos;
CREATE POLICY "all auditoria service_role" ON public.bolao_auditoria_jogos
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.bolao_auditoria_jogos TO anon, authenticated;
GRANT ALL ON public.bolao_auditoria_jogos TO service_role;

-- 4. Tabela de broadcasts (bolao_broadcasts)
CREATE TABLE IF NOT EXISTS public.bolao_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mensagem text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bolao_broadcasts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leitura publica broadcasts" ON public.bolao_broadcasts;
CREATE POLICY "leitura publica broadcasts" ON public.bolao_broadcasts
  FOR SELECT USING (ativo = true);

DROP POLICY IF EXISTS "all broadcasts service_role" ON public.bolao_broadcasts;
CREATE POLICY "all broadcasts service_role" ON public.bolao_broadcasts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON public.bolao_broadcasts TO anon, authenticated;
GRANT ALL ON public.bolao_broadcasts TO service_role;

-- 5. Tabela de telemetria/analytics (bolao_analytics)
CREATE TABLE IF NOT EXISTS public.bolao_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid REFERENCES public.bolao_usuarios(id) ON DELETE SET NULL,
  tela text NOT NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bolao_analytics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert anonimo analytics" ON public.bolao_analytics;
CREATE POLICY "insert anonimo analytics" ON public.bolao_analytics
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "leitura analytics admin" ON public.bolao_analytics;
CREATE POLICY "leitura analytics admin" ON public.bolao_analytics
  FOR SELECT USING (true); -- livre consulta para painel administrativo

GRANT INSERT ON public.bolao_analytics TO anon, authenticated;
GRANT SELECT ON public.bolao_analytics TO anon, authenticated;
GRANT ALL ON public.bolao_analytics TO service_role;
