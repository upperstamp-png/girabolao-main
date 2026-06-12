import { json, preflight } from "../_shared/cors.ts";
import { admin, validarUsuario, verificarBolaoAberto } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  const supabase = admin();
  try {
    const body = await req.json();
    const nome = String(body.nome ?? "").trim();
    const pin = body.pin ? String(body.pin) : null;
    const time = String(body.time ?? "").trim();
    if (!time) return json({ error: "Time inválido" }, 400);

    const { data: cfg } = await supabase.from("bolao_config_campeao").select("status, prazo_fim").eq("id", 1).single();
    if (cfg?.status !== "aberta") return json({ error: "Apostas fechadas" }, 400);
    if (cfg.prazo_fim && new Date(cfg.prazo_fim) <= new Date()) return json({ error: "Prazo encerrado" }, 400);

    const v = await validarUsuario(supabase, nome, pin);
    if (!v.ok) return json({ error: v.error }, 401);

    // Verificar se o bolão está fechado
    const statusBolao = await verificarBolaoAberto(supabase);
    if (!statusBolao.aberto) {
      return json({ error: statusBolao.error }, 400);
    }

    const { error } = await supabase.from("bolao_apostas_campeao").upsert(
      { usuario_id: v.id, time_campeao: time },
      { onConflict: "usuario_id" }
    );
    if (error) throw error;
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

