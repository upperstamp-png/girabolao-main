import { json, preflight } from "../_shared/cors.ts";
import { admin, validarUsuario, verificarBolaoAberto } from "../_shared/supabase.ts";

function log(level: "INFO"|"WARN"|"ERROR", msg: string, data?: unknown) {
  console.log(JSON.stringify({ level, ts: new Date().toISOString(), msg, ...(data ? {data} : {}) }));
}

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  const supabase = admin();

  try {
    const body = await req.json();
    const nome = String(body.nome ?? "").trim();
    const pin = body.pin ? String(body.pin) : null;
    const jogo_id = String(body.jogo_id ?? "");
    const gols_casa = Number(body.gols_casa);
    const gols_fora = Number(body.gols_fora);

    // Validações básicas
    if (!jogo_id) return json({ error: "Jogo obrigatório" }, 400);
    if (!Number.isInteger(gols_casa) || !Number.isInteger(gols_fora)
      || gols_casa < 0 || gols_fora < 0
      || gols_casa > 30 || gols_fora > 30) {
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
      .select("id, data_hora, status, time_casa, time_fora")
      .eq("id", jogo_id)
      .single();
    if (!jogo) return json({ error: "Jogo não encontrado" }, 404);

    // Bloquear alteração após resultado confirmado (encerrado ou apurado)
    if (jogo.status === "encerrado" || jogo.status === "apurado") {
      return json({ error: "O resultado deste jogo já foi confirmado. Palpites não podem mais ser alterados." }, 400);
    }

    const dataHoraJogo = new Date(jogo.data_hora);
    const dataHoraLimite = new Date(dataHoraJogo.getTime() - 60 * 60 * 1000); // 1h antes
    if (dataHoraLimite <= new Date()) {
      return json({ error: "Prazo de palpite encerrado — o limite é de até 1 hora antes da partida" }, 400);
    }

    // Buscar palpite antigo antes do upsert para registrar auditoria
    const { data: palpiteAntigo } = await supabase
      .from("bolao_palpites")
      .select("gols_casa, gols_fora")
      .eq("usuario_id", v.id)
      .eq("jogo_id", jogo_id)
      .maybeSingle();

    // Salvar palpite (upsert — permite alterar antes do jogo)
    const { error } = await supabase
      .from("bolao_palpites")
      .upsert(
        { usuario_id: v.id, jogo_id, gols_casa, gols_fora },
        { onConflict: "usuario_id,jogo_id" }
      );
    if (error) throw error;

    // Registrar no histórico de alterações
    const acao = palpiteAntigo ? "alterar" : "criar";
    const { error: histErr } = await supabase
      .from("bolao_historico_alteracoes")
      .insert({
        usuario_id: v.id,
        jogo_id,
        acao,
        gols_casa_antigo: palpiteAntigo ? palpiteAntigo.gols_casa : null,
        gols_fora_antigo: palpiteAntigo ? palpiteAntigo.gols_fora : null,
        gols_casa_novo: gols_casa,
        gols_fora_novo: gols_fora,
      });
    if (histErr) {
      log("WARN", `Falha ao registrar historico para ${nome}: ${histErr.message}`);
    }

    log("INFO", `Palpite registrado: ${nome} → ${jogo.time_casa} ${gols_casa}x${gols_fora} ${jogo.time_fora}`, { jogo_id });
    return json({ ok: true });
  } catch (e) {
    log("ERROR", "Erro no palpite-placar", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
