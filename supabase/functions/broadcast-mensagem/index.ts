import { json, preflight } from "../_shared/cors.ts";
import { admin, validarAdmin } from "../_shared/supabase.ts";
import { notifyAllUsers } from "../_shared/push.ts";

function log(level: "INFO" | "WARN" | "ERROR", msg: string, data?: unknown) {
  console.log(
    JSON.stringify({ level, ts: new Date().toISOString(), msg, ...(data ? { data } : {}) }),
  );
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const supabase = admin();

  try {
    const body = await req.json();
    const adminPin = String(body.admin_pin ?? "");
    const mensagem = String(body.mensagem ?? "").trim();

    if (!mensagem) {
      return json({ error: "Mensagem obrigatória" }, 400);
    }

    // Validar se é administrador
    const authed = await validarAdmin(supabase, adminPin);
    if (!authed) {
      return json({ error: "PIN de administrador incorreto ou não fornecido" }, 401);
    }

    // 1. Inserir aviso no mural do aplicativo (bolao_broadcasts)
    const { data: broadcast, error: dbErr } = await supabase
      .from("bolao_broadcasts")
      .insert({ mensagem, ativo: true })
      .select()
      .single();

    if (dbErr) {
      log("ERROR", "Falha ao salvar broadcast no banco", dbErr.message);
      throw dbErr;
    }

    log("INFO", `Broadcast salvo no mural: ${mensagem}`);

    // 2. Disparar notificações push para todos os participantes inscritos
    let totalPushes = 0;
    try {
      await notifyAllUsers(null, {
        title: "📢 Comunicado Oficial",
        body: mensagem,
        url: "/",
        tag: `broadcast_${broadcast.id}`,
      });
      totalPushes = 1; // Disparado com sucesso
    } catch (pushErr: any) {
      log("WARN", "Erro parcial ao disparar push do broadcast", pushErr.message);
    }

    return json({ ok: true, id: broadcast.id, pushes: totalPushes });
  } catch (e) {
    log("ERROR", "Erro fatal no broadcast-mensagem", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
