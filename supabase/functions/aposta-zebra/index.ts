import { json, preflight } from "../_shared/cors.ts";
import { admin, validarUsuario, verificarBolaoAberto } from "../_shared/supabase.ts";
import { notifyAllUsers } from "../_shared/push.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const supabase = admin();
  try {
    const body = await req.json();
    const nome = String(body.nome ?? "").trim();
    const pin = body.pin ? String(body.pin) : null;
    const zebra = String(body.zebra ?? "").trim();
    if (!zebra) return json({ error: "Time zebra inválido" }, 400);

    const { data: cfg } = await supabase
      .from("bolao_config_zebra")
      .select("status")
      .eq("id", 1)
      .single();
    if (cfg?.status === "apurada")
      return json({ error: "Zebra já apurada — apostas encerradas." }, 400);

    const v = await validarUsuario(supabase, nome, pin);
    if (!v.ok) return json({ error: v.error }, 401);

    // Verificar se o bolão está fechado
    const statusBolao = await verificarBolaoAberto(supabase);
    if (!statusBolao.aberto) {
      return json({ error: statusBolao.error }, 400);
    }

    const { data: existing } = await supabase
      .from("bolao_apostas_zebra")
      .select("id, zebra_apostada, bloqueado_em")
      .eq("usuario_id", v.id)
      .maybeSingle();
    if (existing && existing.bloqueado_em) {
      return json({ error: "Aposta de zebra já bloqueada para este usuário" }, 400);
    }

    if (existing) {
      const { error } = await supabase
        .from("bolao_apostas_zebra")
        .update({ zebra_apostada: zebra })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("bolao_apostas_zebra")
        .insert({ usuario_id: v.id, zebra_apostada: zebra });
      if (error) throw error;
    }

    // Disparar push de notificação
    const verb = existing ? "alterou sua" : "definiu uma nova";
    await notifyAllUsers(null, {
      title: "🦓 Aposta em Zebra da Copa!",
      body: `${nome} ${verb} aposta para Zebra da Copa em: ${zebra}`,
      url: "/apostas-especiais",
      tag: `zebra_${v.id}`,
    }).catch((err) => console.error("Erro ao disparar push notification", err));

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
