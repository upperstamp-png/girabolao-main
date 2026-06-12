import { json, preflight } from "../_shared/cors.ts";
import { admin, validarUsuario, verificarBolaoAberto } from "../_shared/supabase.ts";
import { buscarOrdemJogo, verificarVezNaSequencia } from "../_shared/sorteio.ts";

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

    const dataHoraJogo = new Date(jogo.data_hora);
    const dataHoraLimite = new Date(dataHoraJogo.getTime() - 60 * 60 * 1000); // 1h antes
    if (dataHoraLimite <= new Date()) {
      return json({ error: "Prazo de palpite encerrado — o limite é de até 1 hora antes da partida" }, 400);
    }

    // Sorteio por jogo: respeitar sequência de palpites
    const ordem = await buscarOrdemJogo(supabase, jogo_id);
    if (ordem.length === 0) {
      return json({ error: "Sorteio deste jogo ainda não foi realizado. Abra o jogo para iniciar o sorteio." }, 400);
    }

    const { data: palpitesJogo } = await supabase
      .from("bolao_palpites")
      .select("usuario_id")
      .eq("jogo_id", jogo_id);
    const comPalpite = new Set((palpitesJogo ?? []).map((p: { usuario_id: string }) => p.usuario_id));

    const vez = verificarVezNaSequencia(ordem, v.id, comPalpite);
    if (!vez.ok) {
      log("WARN", `Fora da vez: ${nome} no jogo ${jogo_id}`, { aguardando: vez.aguardando });
      return json({ error: vez.error }, 409);
    }

    // Verificar exclusividade de placar (se configurado)
    const { data: cfg } = await supabase
      .from("bolao_config")
      .select("exclusividade_placar")
      .eq("id", 1)
      .single();

    if (cfg?.exclusividade_placar) {
      const { data: duplicado } = await supabase
        .from("bolao_palpites")
        .select("usuario_id")
        .eq("jogo_id", jogo_id)
        .eq("gols_casa", gols_casa)
        .eq("gols_fora", gols_fora)
        .neq("usuario_id", v.id)
        .maybeSingle();

      if (duplicado) {
        // Buscar nome do participante que já escolheu esse placar
        const { data: outro } = await supabase
          .from("bolao_usuarios")
          .select("nome")
          .eq("id", duplicado.usuario_id)
          .single();
        const nomeOutro = outro?.nome ?? "outro participante";
        log("WARN", `Placar duplicado bloqueado: ${gols_casa}x${gols_fora} para jogo ${jogo_id}`, { por: nomeOutro, tentativa: nome });
        return json({
          error: `Placar ${gols_casa}×${gols_fora} já foi escolhido por ${nomeOutro}. Escolha um resultado diferente.`,
        }, 409);
      }
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
