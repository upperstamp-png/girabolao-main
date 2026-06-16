import { json, preflight } from "../_shared/cors.ts";
import { admin, validarUsuario } from "../_shared/supabase.ts";

function log(level: "INFO" | "WARN" | "ERROR", msg: string, data?: unknown) {
  console.log(JSON.stringify({ level, ts: new Date().toISOString(), msg, ...(data ? {data} : {}) }));
}

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  const supabase = admin();

  try {
    // ===== GET: Devolve VAPID_PUBLIC_KEY =====
    if (req.method === "GET") {
      const pubKey = Deno.env.get("VAPID_PUBLIC_KEY");
      if (!pubKey) {
        log("ERROR", "VAPID_PUBLIC_KEY não está configurada nos secrets do Supabase");
        return json({ error: "Chave pública não configurada" }, 500);
      }
      return json({ publicKey: pubKey });
    }

    const body = await req.json();
    const action = String(body.action ?? "").trim();
    
    // ===== REGISTER: Registrar ou renovar token de push =====
    if (action === "register") {
      const nome = String(body.nome ?? "").trim();
      const pin = body.pin ? String(body.pin).trim() : null;
      const subscription = body.subscription; // { endpoint, keys: { p256dh, auth } }
      const userAgent = String(body.user_agent ?? "").slice(0, 500);

      if (!nome) return json({ error: "Nome obrigatório" }, 400);
      if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
        return json({ error: "Inscrição de push inválida" }, 400);
      }

      // Validar identidade do usuário
      const v = await validarUsuario(supabase, nome, pin);
      if (!v.ok) return json({ error: v.error }, 401);

      // Regra: 1 dispositivo/endpoint = 1 usuário ativo por vez
      // Desativamos qualquer registro anterior para o mesmo endpoint
      await supabase
        .from("bolao_push_tokens")
        .update({ is_active: false })
        .eq("endpoint", subscription.endpoint);

      // Salvar/reativar o token associado ao usuário validado
      const { error } = await supabase
        .from("bolao_push_tokens")
        .upsert(
          {
            usuario_id: v.id,
            endpoint: subscription.endpoint,
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            user_agent: userAgent,
            is_active: true,
          },
          { onConflict: "endpoint" }
        );

      if (error) throw error;
      log("INFO", `Token registrado com sucesso para o usuário ${nome}`, { endpoint: subscription.endpoint });
      return json({ ok: true });
    }

    // ===== UNREGISTER: Desativar token de push no logout =====
    if (action === "unregister") {
      const nome = String(body.nome ?? "").trim();
      const pin = body.pin ? String(body.pin).trim() : null;
      const endpoint = String(body.endpoint ?? "").trim();

      if (!nome) return json({ error: "Nome obrigatório" }, 400);
      if (!endpoint) return json({ error: "Endpoint obrigatório" }, 400);

      const v = await validarUsuario(supabase, nome, pin);
      if (!v.ok) return json({ error: v.error }, 401);

      const { error } = await supabase
        .from("bolao_push_tokens")
        .update({ is_active: false })
        .eq("endpoint", endpoint)
        .eq("usuario_id", v.id);

      if (error) throw error;
      log("INFO", `Token desregistrado para o usuário ${nome}`, { endpoint });
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e) {
    log("ERROR", "Erro em web-push", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
