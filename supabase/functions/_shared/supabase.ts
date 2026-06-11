import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

export async function hashPin(pin: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(pin + "::bolao2026")
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function validarUsuario(
  supabase: ReturnType<typeof admin>,
  nome: string,
  pin: string | null
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!nome) return { ok: false, error: "Nome obrigatório" };
  const { data: u } = await supabase
    .from("bolao_usuarios")
    .select("id, pin_hash, excluido_manualmente")
    .eq("nome", nome)
    .maybeSingle();
  if (!u) return { ok: false, error: "Participante não encontrado" };
  if (u.excluido_manualmente) return { ok: false, error: "Participante não encontrado" };
  if (u.pin_hash) {
    if (!pin) return { ok: false, error: "PIN obrigatório para este participante" };
    const h = await hashPin(pin);
    if (h !== u.pin_hash) return { ok: false, error: "PIN incorreto" };
  }
  return { ok: true, id: u.id as string };
}

export async function validarAdmin(
  supabase: ReturnType<typeof admin>,
  adminPin: string
): Promise<boolean> {
  if (!adminPin) return false;
  const { data: cfg } = await supabase
    .from("bolao_config")
    .select("admin_pin")
    .eq("id", 1)
    .single();
  return cfg?.admin_pin === adminPin;
}
