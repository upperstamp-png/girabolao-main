-- Remove sorteio-related tables and columns
DROP TABLE IF EXISTS public.bolao_sorteio_jogo_ordem CASCADE;
DROP TABLE IF EXISTS public.bolao_sorteio_ordem CASCADE;

ALTER TABLE public.bolao_jogos DROP COLUMN IF EXISTS sorteio_realizado CASCADE;
ALTER TABLE public.bolao_config DROP COLUMN IF EXISTS sorteio_realizado CASCADE;
ALTER TABLE public.bolao_usuarios DROP COLUMN IF EXISTS ordem_sorteio CASCADE;
