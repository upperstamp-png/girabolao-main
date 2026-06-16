import { admin } from "./supabase.ts";
import webpush from "https://esm.sh/web-push@3.6.7";

// Configure keys from environment
const pubKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const privKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const subject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:contato@crescieperdi.com.br";

if (pubKey && privKey) {
  webpush.setVapidDetails(subject, pubKey, privKey);
}

function log(level: "INFO" | "WARN" | "ERROR", msg: string, data?: unknown) {
  console.log(
    JSON.stringify({ level, ts: new Date().toISOString(), msg, ...(data ? { data } : {}) }),
  );
}

/**
 * Envia uma notificação push para todos os tokens ativos de um usuário
 */
export async function sendPushNotification(
  usuarioId: string,
  payload: { title: string; body: string; url?: string; tag?: string },
): Promise<{ success: boolean; sentCount: number }> {
  const supabase = admin();

  if (!pubKey || !privKey) {
    log("WARN", "Chaves VAPID não configuradas. Pulando push.");
    return { success: false, sentCount: 0 };
  }

  // Buscar tokens ativos do usuário
  const { data: tokens, error } = await supabase
    .from("bolao_push_tokens")
    .select("id, endpoint, p256dh, auth")
    .eq("usuario_id", usuarioId)
    .eq("is_active", true);

  if (error) {
    log("ERROR", `Erro ao buscar tokens para o usuário ${usuarioId}`, error.message);
    return { success: false, sentCount: 0 };
  }

  if (!tokens || tokens.length === 0) {
    return { success: true, sentCount: 0 };
  }

  let sentCount = 0;
  const jsonPayload = JSON.stringify(payload);

  for (const token of tokens) {
    try {
      const subscription = {
        endpoint: token.endpoint,
        keys: {
          p256dh: token.p256dh,
          auth: token.auth,
        },
      };

      await webpush.sendNotification(subscription, jsonPayload, {
        TTL: 86400, // 24h
        urgency: "high",
      });

      sentCount++;
    } catch (err: any) {
      log("WARN", `Falha ao enviar push para token ${token.id}`, err.message);
      // Se der 404 (Not Found) ou 410 (Gone), a inscrição expirou no browser, então desativamos
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase.from("bolao_push_tokens").update({ is_active: false }).eq("id", token.id);
        log("INFO", `Token ${token.id} desativado (404/410)`);
      }
    }
  }

  return { success: true, sentCount };
}

/**
 * Notifica todos os participantes (opcionalmente excluindo quem disparou a ação)
 */
export async function notifyAllUsers(
  excluirUsuarioId: string | null,
  payload: { title: string; body: string; url?: string; tag?: string },
): Promise<{ success: boolean; sentCount: number }> {
  const supabase = admin();

  if (!pubKey || !privKey) {
    log("WARN", "Chaves VAPID não configuradas. Pulando push geral.");
    return { success: false, sentCount: 0 };
  }

  // Buscar todos os tokens ativos
  let query = supabase
    .from("bolao_push_tokens")
    .select("id, usuario_id, endpoint, p256dh, auth")
    .eq("is_active", true);

  if (excluirUsuarioId) {
    query = query.neq("usuario_id", excluirUsuarioId);
  }

  const { data: tokens, error } = await query;

  if (error) {
    log("ERROR", "Erro ao buscar todos os tokens ativos", error.message);
    return { success: false, sentCount: 0 };
  }

  if (!tokens || tokens.length === 0) {
    return { success: true, sentCount: 0 };
  }

  let sentCount = 0;
  const jsonPayload = JSON.stringify(payload);

  for (const token of tokens) {
    try {
      const subscription = {
        endpoint: token.endpoint,
        keys: {
          p256dh: token.p256dh,
          auth: token.auth,
        },
      };

      await webpush.sendNotification(subscription, jsonPayload, {
        TTL: 86400,
        urgency: "high",
      });

      sentCount++;
    } catch (err: any) {
      log("WARN", `Falha ao enviar push para token ${token.id}`, err.message);
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase.from("bolao_push_tokens").update({ is_active: false }).eq("id", token.id);
        log("INFO", `Token ${token.id} desativado (404/410)`);
      }
    }
  }

  return { success: true, sentCount };
}
