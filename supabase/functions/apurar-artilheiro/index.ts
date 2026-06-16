import { json, preflight } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import { notifyAllUsers } from "../_shared/push.ts";

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  const supabase = admin();
  try {
    const body = await req.json();
    const artilheiro = String(body.artilheiro ?? "").trim();
    if (!artilheiro) return json({ error: "Informe o artilheiro real" }, 400);

    const { data: cfg } = await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).single();
    const { data: apostas } = await supabase.from("bolao_apostas_artilheiro").select("id, usuario_id, jogador_apostado");

    const participantes = apostas?.length ?? 0;
    const arrecadado = participantes * 10;
    const pool = arrecadado + Number(cfg?.acumulado_anterior || 0);

    const acertadores = (apostas ?? []).filter(a => a.jogador_apostado.toLowerCase() === artilheiro.toLowerCase());
    for (const a of apostas ?? []) {
      const ac = a.jogador_apostado.toLowerCase() === artilheiro.toLowerCase();
      await supabase.from("bolao_apostas_artilheiro").update({ acertou: ac }).eq("id", a.id);
    }

    if (acertadores.length === 0) {
      await supabase.from("bolao_premios").insert({
        modalidade: "artilheiro", usuario_id: null, valor: pool, status: "acumulado",
      });
    } else {
      const valor = +(pool / acertadores.length).toFixed(2);
      for (const a of acertadores) {
        await supabase.from("bolao_premios").insert({
          modalidade: "artilheiro", usuario_id: a.usuario_id, valor, status: "pendente",
        });
      }
    }

    await supabase.from("bolao_config_artilheiro").update({
      status: "apurada", artilheiro_real: artilheiro, total_arrecadado: arrecadado,
    }).eq("id", 1);

    // Disparar push de notificação do resultado
    await notifyAllUsers(null, {
      title: "🏆 Artilheiro da Copa Apurado!",
      body: `O Artilheiro oficial foi definido: ${artilheiro}! ${acertadores.length} participante(s) acertaram e dividiram o prêmio de R$ ${pool.toFixed(2)}.`,
      url: "/apostas-especiais",
      tag: "apurar_artilheiro",
    }).catch(err => console.error("Erro ao disparar push notification", err));

    return json({ ok: true, pool, acertadores: acertadores.length });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
