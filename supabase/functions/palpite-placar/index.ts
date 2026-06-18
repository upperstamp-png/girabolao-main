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
    const forwarded = req.headers.get("x-forwarded-for");
    const ip_usuario =
  forwarded?.split(",")[0]?.trim() ||
  req.headers.get("cf-connecting-ip") ||
  req.headers.get("x-real-ip") ||
  "unknown";

const user_agent =
  req.headers.get("user-agent") || "unknown";
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

    // Regra de travamento: 15 minutos após o horário oficial do jogo
    const now = new Date();
    const dataInicio = new Date(jogo.data_hora);
    const limiteAposta = new Date(dataInicio.getTime() + 15 * 60 * 1000);
    if (now > limiteAposta) {
      return json(
        { error: "Palpites encerrados — limite de 15 minutos após o início da partida expirado." },
        400,
      );
    }

    // Verificar se já existe palpite
    const { data: palpiteAntigo } = await supabase
      .from("bolao_palpites")
      .select("gols_casa, gols_fora, confirmado_em")
      .eq("usuario_id", v.id)
      .eq("jogo_id", jogo_id)
      .maybeSingle();

    let error;
    let acaoHistorico: "criar" | "alterar";
    let golsCasaAntigo: number | null = null;
    let golsForaAntigo: number | null = null;

    if (palpiteAntigo) {
      // Se já existe palpite, verificar se é diferente
      if (palpiteAntigo.gols_casa === gols_casa && palpiteAntigo.gols_fora === gols_fora) {
        return json({ ok: true, unchanged: true });
      }

      // Atualizar palpite existente (dentro da janela de 15 min)
      golsCasaAntigo = palpiteAntigo.gols_casa;
      golsForaAntigo = palpiteAntigo.gols_fora;
      acaoHistorico = "alterar";

      const result = await supabase
        .from("bolao_palpites")
        .update({
          gols_casa,
          gols_fora,
          confirmado_em: now.toISOString(),
          ip_usuario
        })
        .eq("usuario_id", v.id)
        .eq("jogo_id", jogo_id);
      error = result.error;
    } else {
      // Criar novo palpite
      acaoHistorico = "criar";

      const result = await supabase
        .from("bolao_palpites")
        .insert({
          usuario_id: v.id,
          jogo_id,
          gols_casa,
          gols_fora,
          confirmado_em: now.toISOString(),
          ip_usuario
        });
      error = result.error;
    }

    if (error) throw error;

    // Registrar no histórico de alterações
    const { error: histErr } = await supabase.from("bolao_historico_alteracoes").insert({
      usuario_id: v.id,
      jogo_id,
      acao: acaoHistorico,
      gols_casa_antigo: golsCasaAntigo,
      gols_fora_antigo: golsForaAntigo,
      gols_casa_novo: gols_casa,
      gols_fora_novo: gols_fora,
    });
    if (histErr) {
      log("WARN", `Falha ao registrar historico para ${nome}: ${histErr.message}`);
    }

    log(
      "INFO",
      `Palpite ${acaoHistorico === "criar" ? "registrado" : "alterado"}: ${nome} → ${jogo.time_casa} ${gols_casa}x${gols_fora} ${jogo.time_fora}`,
      { jogo_id },
    );

    // Disparar push de notificação
    const actionVerb = acaoHistorico === "criar" ? "registrou um" : "alterou seu";
    await notifyAllUsers(null, {
      title: acaoHistorico === "criar" ? "⚽ Novo Palpite Registrado!" : "✏️ Palpite Alterado!",
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
