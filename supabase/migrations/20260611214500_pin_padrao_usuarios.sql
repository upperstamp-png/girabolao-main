-- PIN inicial para todos os participantes que ainda nao tinham PIN.
-- PIN padrao: 1234. O usuario pode trocar dentro da plataforma.

ALTER TABLE public.bolao_usuarios
  ALTER COLUMN pin_hash SET DEFAULT 'c26ec9ab946a8d14304fc6cac6d9619a37539ca12b88b2e1d6d734fa013374ba';

UPDATE public.bolao_usuarios
SET pin_hash = 'c26ec9ab946a8d14304fc6cac6d9619a37539ca12b88b2e1d6d734fa013374ba'
WHERE pin_hash IS NULL
  AND excluido_manualmente = false;
