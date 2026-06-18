import { json, preflight } from "../_shared/cors.ts";
import { admin, validarUsuario, verificarBolaoAberto } from "../_shared/supabase.ts";
import { notifyAllUsers } from "../_shared/push.ts";
import { validateAndSubmitBet } from "../_shared/bets/index.ts";
import { BetType } from "../_shared/bets/types.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  const supabase = admin();
  try {
    const body = await req.json();
    const nome = String(body.nome ?? "").trim();
    const pin = body.pin ? String(body.pin) : null;
    const time = String(body.time ?? "").trim();
    if (!time) return json({ error: "Time inválido" }, 400);

    const { data: cfg } = await supabase
      .from("bolao_config_campeao")
      .select("status")
      .eq("id", 1)
      .single();
    if (cfg?.status === "apurada")
      return json({ error: "Campeão já apurado — apostas encerradas." }, 400);

    const v = await validarUsuario(supabase, nome, pin);
    if (!v.ok) return json({ error: v.error }, 401);

    // Verificar se o bolão está fechado
    const statusBolao = await verificarBolaoAberto(supabase);
    if (!statusBolao.aberto) {
      return json({ error: statusBolao.error }, 400);
    }

    // ✅ NOVA LÓGICA: Usar validateAndSubmitBet centralizado
    const result = await validateAndSubmitBet(
      supabase,
      "campeao" as BetType,
      { team_id: time },
      v.id
    );

    if (!result.success) {
      return json({ error: result.message }, result.error === "UNAUTHORIZED" ? 401 : 400);
    }
    // Disparar push de notificação
    const { data: existing } = await supabase
      .from("bolao_apostas_campeao")
      .select("id, bloqueado_em")
      .eq("usuario_id", v.id)
      .maybeSingle();

    const verb = existing && existing.bloqueado_em
      ? "alterou sua"
      : existing
      ? "atualizou sua"
      : "definiu uma nova";
    await notifyAllUsers(null, {
      title: "🥇 Aposta em Campeã da Copa!",
      body: `${nome} ${verb} aposta para Campeã da Copa em: ${time}`,
      url: "/apostas-especiais",
      tag: `campeao_${v.id}`,
    }).catch((err) => console.error("Erro ao disparar push notification", err));

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

