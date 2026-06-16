-- Create push tokens table linked to users
CREATE TABLE IF NOT EXISTS public.bolao_push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.bolao_usuarios(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index unique on endpoint when active (1 user active on 1 endpoint/device at any time)
CREATE UNIQUE INDEX IF NOT EXISTS bolao_push_tokens_endpoint_active_idx ON public.bolao_push_tokens(endpoint) WHERE (is_active = true);

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bolao_push_tokens TO anon, authenticated;
GRANT ALL ON public.bolao_push_tokens TO service_role;

-- Enable RLS
ALTER TABLE public.bolao_push_tokens ENABLE ROW LEVEL SECURITY;

-- Allow anonymous RLS operations since authentication check is handled by Edge Functions (using PIN/nome)
CREATE POLICY "allow_all_push_tokens" ON public.bolao_push_tokens FOR ALL USING (true);
