import { json, preflight } from "../_shared/cors.ts";
import { admin, validarUsuario, verificarBolaoAberto } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  const supabase = admin();
  try {
    const body = await req.json();
    const nome = String(body.nome ?? "").trim();
    const pin = body.pin ? String(body.pin) : null;
    const time_casa = String(body.time_casa ?? "").trim();
    const time_fora = String(body.time_fora ?? "").trim();
    const gols_casa = Number(body.gols_casa);
    const gols_fora = Number(body.gols_fora);

    if (!time_casa || !time_fora) return json({ error: "Selecione os dois times" }, 400);
    if (time_casa === time_fora) return json({ error: "Os times devem ser diferentes" }, 400);
    if (!Number.isInteger(gols_casa) || !Number.isInteger(gols_fora) || gols_casa < 0 || gols_fora < 0) {
      return json({ error: "Placar de gols inválido" }, 400);
    }

    const { data: cfg } = await supabase.from("bolao_config_goleada").select("status, prazo_fim").eq("id", 1).single();
    if (cfg?.status !== "aberta") return json({ error: "Apostas fechadas" }, 400);
    if (cfg.prazo_fim && new Date(cfg.prazo_fim) <= new Date()) return json({ error: "Prazo encerrado" }, 400);

    const v = await validarUsuario(supabase, nome, pin);
    if (!v.ok) return json({ error: v.error }, 401);

    // Verificar se o bolão está fechado
    const statusBolao = await verificarBolaoAberto(supabase);
    if (!statusBolao.aberto) {
      return json({ error: statusBolao.error }, 400);
    }

    const { data: existing } = await supabase.from("bolao_apostas_goleada").select("id, bloqueado_em").eq("usuario_id", v.id).maybeSingle();
    if (existing && existing.bloqueado_em) {
      return json({ error: "Aposta de goleada já bloqueada para este usuário" }, 400);
    }

    if (existing) {
      const { error } = await supabase.from("bolao_apostas_goleada").update({ time_casa, time_fora, gols_casa, gols_fora }).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("bolao_apostas_goleada").insert({ usuario_id: v.id, time_casa, time_fora, gols_casa, gols_fora });
      if (error) throw error;
    }
    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

