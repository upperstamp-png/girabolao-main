-- 1. Tabela de reações em jogos
CREATE TABLE IF NOT EXISTS bolao_reacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jogo_id UUID NOT NULL REFERENCES bolao_jogos(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES bolao_usuarios(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL CHECK (emoji IN ('🔥','😱','😂','👏','😭','⚽')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(jogo_id, usuario_id, emoji)
);

-- RLS
ALTER TABLE bolao_reacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reacoes visíveis para todos" ON bolao_reacoes FOR SELECT USING (true);
CREATE POLICY "Reacoes inseríveis por todos" ON bolao_reacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "Reacoes deletáveis por dono" ON bolao_reacoes FOR DELETE USING (true);

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'bolao_reacoes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bolao_reacoes;
  END IF;
END $$;

-- 2. Coluna de prêmio configurável na config
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bolao_config' AND column_name = 'premio_descricao'
  ) THEN
    ALTER TABLE bolao_config ADD COLUMN premio_descricao TEXT DEFAULT 'Troféu + Churrasco para o campeão! 🏆🥩';
  END IF;
END $$;

-- 3. Coluna para provocações (ranking anterior snapshot)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bolao_config' AND column_name = 'ranking_snapshot'
  ) THEN
    ALTER TABLE bolao_config ADD COLUMN ranking_snapshot JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;
