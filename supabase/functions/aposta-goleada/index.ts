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
    const time_casa = String(body.time_casa ?? "").trim();
    const time_fora = String(body.time_fora ?? "").trim();
    const gols_casa = Number(body.gols_casa);
    const gols_fora = Number(body.gols_fora);

    if (!time_casa || !time_fora) return json({ error: "Selecione os dois times" }, 400);
    if (time_casa === time_fora) return json({ error: "Os times devem ser diferentes" }, 400);
    if (
      !Number.isInteger(gols_casa) ||
      !Number.isInteger(gols_fora) ||
      gols_casa < 0 ||
      gols_fora < 0
    ) {
      return json({ error: "Placar de gols inválido" }, 400);
    }

    const { data: cfg } = await supabase
      .from("bolao_config_goleada")
      .select("status")
      .eq("id", 1)
      .single();
    if (cfg?.status === "apurada")
      return json({ error: "Goleada já apurada — apostas encerradas." }, 400);

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
      "goleada" as BetType,
      {
        home_team_id: time_casa,
        away_team_id: time_fora,
        home_goals: gols_casa,
        away_goals: gols_fora
      },
      v.id
    );

    if (!result.success) {
      return json({ error: result.message }, result.error === "UNAUTHORIZED" ? 401 : 400);
    }

    // Disparar push de notificação
    const { data: existing } = await supabase
      .from("bolao_apostas_goleada")
      .select("id, bloqueado_em")
      .eq("usuario_id", v.id)
      .maybeSingle();

    const verb = existing && existing.bloqueado_em
      ? "alterou sua"
      : existing
      ? "atualizou sua"
      : "registrou uma nova";

    await notifyAllUsers(null, {
      title: "🔥 Aposta em Goleada da Copa!",
      body: `${nome} ${verb} aposta de Goleada no jogo ${time_casa} x ${time_fora}: ${gols_casa} x ${gols_fora}`,
      url: "/apostas-especiais",
      tag: `goleada_${v.id}`,
    }).catch((err) => console.error("Erro ao disparar push notification", err));

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
