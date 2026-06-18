import { json, preflight } from "../_shared/cors.ts";
import { admin, validarUsuario, verificarBolaoAberto } from "../_shared/supabase.ts";

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
    const nome = String(body.nome ?? "").trim();
    const pin = body.pin ? String(body.pin) : null;
    const canal = String(body.canal ?? "geral").trim();
    const mensagem = String(body.mensagem ?? "").trim();
    const respondendo_a_id = body.respondendo_a_id ? String(body.respondendo_a_id) : null;

    if (!mensagem) {
      return json({ error: "A mensagem não pode ser vazia" }, 400);
    }

    if (mensagem.length > 500) {
      return json({ error: "A mensagem pode ter no máximo 500 caracteres" }, 400);
    }

    // Validar identidade
    const v = await validarUsuario(supabase, nome, pin);
    if (!v.ok) return json({ error: v.error }, 401);

    // Verificar se o bolão está aberto
    const statusBolao = await verificarBolaoAberto(supabase);
    if (!statusBolao.aberto) {
      return json({ error: statusBolao.error }, 400);
    }

    // Salvar mensagem de chat
    const { data: msgData, error } = await supabase
      .from("bolao_chat_mensagens")
      .insert({
        usuario_id: v.id,
        canal,
        mensagem,
        respondendo_a_id
      })
      .select("id, criado_em")
      .single();

    if (error) throw error;

    log("INFO", `Mensagem de chat enviada por ${nome} no canal ${canal}`, { msg_id: msgData.id });

    return json({ ok: true, messageId: msgData.id });
  } catch (e) {
    log("ERROR", "Erro no chat-mensagens", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
