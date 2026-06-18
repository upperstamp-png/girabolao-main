import { json, preflight } from "../_shared/cors.ts";
import { admin, validarUsuario, verificarBolaoAberto } from "../_shared/supabase.ts";
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
    const nome = String(body.nome ?? "").trim();
    const pin = body.pin ? String(body.pin) : null;
    const jogo_id = String(body.jogo_id ?? "");
    const gols_casa = Number(body.gols_casa);
    const gols_fora = Number(body.gols_fora);
    const ip_usuario = req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "unknown";

    // Validações básicas
    if (!jogo_id) return json({ error: "Jogo obrigatório" }, 400);
    if (
      !Number.isInteger(gols_casa) ||
      !Number.isInteger(gols_fora) ||
      gols_casa < 0 ||
      gols_fora < 0 ||
      gols_casa > 30 ||
      gols_fora > 30
    ) {
      return json({ error: "Placar inválido (0-30 por time)" }, 400);
    }

    // Validar identidade
    const v = await validarUsuario(supabase, nome, pin);
    if (!v.ok) return json({ error: v.error }, 401);

    // Verificar se o bolão está fechado
    const statusBolao = await verificarBolaoAberto(supabase);
    if (!statusBolao.aberto) {
      return json({ error: statusBolao.error }, 400);
    }

    const { data: jogo } = await supabase
      .from("bolao_jogos")
      .select("id, data_hora, status, time_casa, time_fora, minuto_jogo, bloqueado_manual")
      .eq("id", jogo_id)
      .single();
    if (!jogo) return json({ error: "Jogo não encontrado" }, 404);

    // Bloquear alteração se jogo estiver bloqueado manualmente
    if (jogo.bloqueado_manual) {
      return json(
        { error: "Palpites encerrados para este jogo (bloqueado manualmente pelo administrador)." },
        400,
      );
    }

    // Bloquear alteração após resultado confirmado (encerrado ou apurado)
    if (jogo.status === "encerrado" || jogo.status === "apurado") {
      return json(
        {
          error: "O resultado deste jogo já foi confirmado. Palpites não podem mais ser alterados.",
        },
        400,
      );
    }

    // Bloquear se já existe palpite (bloqueio definitivo após aposta)
    const { data: palpiteAntigo } = await supabase
      .from("bolao_palpites")
      .select("gols_casa, gols_fora, confirmado_em")
      .eq("usuario_id", v.id)
      .eq("jogo_id", jogo_id)
      .maybeSingle();

    if (palpiteAntigo) {
      return json(
        { error: "Você já confirmou seu palpite para este jogo e não pode alterá-lo." },
        400,
      );
    }

    // Regra de travamento: 15 minutos após o horário oficial do jogo
    const dataInicio = new Date(jogo.data_hora);
    const limiteAposta = new Date(dataInicio.getTime() + 15 * 60 * 1000);
    if (new Date() > limiteAposta) {
      return json(
        { error: "Palpites encerrados — limite de 15 minutos após o início da partida expirado." },
        400,
      );
    }

    // Salvar palpite (usando insert, pois não permitimos edição se já existir)
    const { error } = await supabase
      .from("bolao_palpites")
      .insert({
        usuario_id: v.id,
        jogo_id,
        gols_casa,
        gols_fora,
        confirmado_em: new Date().toISOString(),
        ip_usuario
      });
    if (error) throw error;

    // Registrar no histórico de alterações
    const { error: histErr } = await supabase.from("bolao_historico_alteracoes").insert({
      usuario_id: v.id,
      jogo_id,
      acao: "criar",
      gols_casa_antigo: null,
      gols_fora_antigo: null,
      gols_casa_novo: gols_casa,
      gols_fora_novo: gols_fora,
    });
    if (histErr) {
      log("WARN", `Falha ao registrar historico para ${nome}: ${histErr.message}`);
    }

    log(
      "INFO",
      `Palpite registrado: ${nome} → ${jogo.time_casa} ${gols_casa}x${gols_fora} ${jogo.time_fora}`,
      { jogo_id },
    );

    // Disparar push de notificação
    const actionVerb = "registrou um";
    await notifyAllUsers(null, {
      title: "⚽ Novo Palpite Registrado!",
      body: `${nome} ${actionVerb} palpite para ${jogo.time_casa} x ${jogo.time_fora}: ${gols_casa} x ${gols_fora}`,
      url: `/jogos/${jogo_id}`,
      tag: `palpite_${v.id}_${jogo_id}`,
    }).catch((err) => log("WARN", "Erro ao disparar push notification", err.message));

    return json({ ok: true });
  } catch (e) {
    log("ERROR", "Erro no palpite-placar", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
