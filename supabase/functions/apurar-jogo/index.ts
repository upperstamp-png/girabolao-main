// Percorre jogos encerrados ainda não apurados, marca acertou e gera prêmios.
import { json, preflight } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import { notifyAllUsers } from "../_shared/push.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const supabase = admin();
  try {
    const { data: jogos } = await supabase
      .from("bolao_jogos")
      .select("*")
      .eq("status", "encerrado")
      .not("placar_casa", "is", null)
      .not("placar_fora", "is", null);

    let apurados = 0;
    for (const j of jogos ?? []) {
      // Verifica se já apurado
      const { data: existing } = await supabase
        .from("bolao_premios")
        .select("id")
        .eq("referencia_id", j.id)
        .eq("modalidade", "placar")
        .limit(1);
      if (existing && existing.length > 0) continue;

      const { data: palpites } = await supabase
        .from("bolao_palpites")
        .select("id, usuario_id, gols_casa, gols_fora")
        .eq("jogo_id", j.id);

      const participantes = palpites?.length ?? 0;
      const totalArrecadado = participantes * Number(j.valor_entrada);
      const acumuladoAnterior = Number(j.acumulado || 0);
      const pool = totalArrecadado + acumuladoAnterior;

      const acertadores = (palpites ?? []).filter(
        (p) => p.gols_casa === j.placar_casa && p.gols_fora === j.placar_fora,
      );

      // marca acertou
      for (const p of palpites ?? []) {
        const ac = p.gols_casa === j.placar_casa && p.gols_fora === j.placar_fora;
        await supabase.from("bolao_palpites").update({ acertou: ac }).eq("id", p.id);
      }

      if (acertadores.length === 0) {
        // Acumula para o próximo jogo cronológico
        const { data: prox } = await supabase
          .from("bolao_jogos")
          .select("id, acumulado")
          .gt("data_hora", j.data_hora)
          .eq("status", "pendente")
          .order("data_hora")
          .limit(1)
          .maybeSingle();
        if (prox) {
          await supabase
            .from("bolao_jogos")
            .update({ acumulado: Number(prox.acumulado || 0) + pool })
            .eq("id", prox.id);
        }
        await supabase.from("bolao_premios").insert({
          modalidade: "placar",
          referencia_id: j.id,
          usuario_id: null,
          valor: pool,
          status: "acumulado",
        });
      } else {
        const valorIndividual = +(pool / acertadores.length).toFixed(2);
        for (const a of acertadores) {
          await supabase.from("bolao_premios").insert({
            modalidade: "placar",
            referencia_id: j.id,
            usuario_id: a.usuario_id,
            valor: valorIndividual,
            status: "pendente",
          });
        }
      }
      await supabase.from("bolao_jogos").update({ status: "apurado" }).eq("id", j.id);

      // Disparar push noticiando o resultado final
      await notifyAllUsers(null, {
        title: "🏁 Resultado Final Apurado!",
        body: `Jogo finalizado: ${j.time_casa} ${j.placar_casa} x ${j.placar_fora} ${j.time_fora}. Os pontos do bolão foram atualizados!`,
        url: `/jogos/${j.id}`,
        tag: `apurado_${j.id}`,
      }).catch((err) => console.error("Erro ao disparar push notification", err));

      apurados++;
    }
    return json({ ok: true, apurados });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
