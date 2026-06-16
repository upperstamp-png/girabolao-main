-- Habilitar Supabase Realtime na tabela bolao_jogos
-- Permite que o frontend receba updates em tempo real via WebSocket
-- quando o admin atualiza placares de jogos ao vivo.

DO $$
BEGIN
  -- Adiciona bolao_jogos à publicação do Realtime (se ainda não estiver)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'bolao_jogos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bolao_jogos;
  END IF;
END
$$;

-- Garante que a tabela tem REPLICA IDENTITY FULL
-- (necessário para o Realtime enviar o row completo no payload)
ALTER TABLE bolao_jogos REPLICA IDENTITY FULL;
