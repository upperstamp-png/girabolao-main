import { json, preflight } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  const supabase = admin();
  try {
    const body = await req.json();
    const f1 = String(body.finalista1 ?? "").trim();
    const f2 = String(body.finalista2 ?? "").trim();
    if (!f1 || !f2) return json({ error: "Informe os dois finalistas" }, 400);
    const finais = [f1.toLowerCase(), f2.toLowerCase()];

    const { data: cfg } = await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).single();
    const { data: apostas } = await supabase.from("bolao_apostas_finalistas").select("id, usuario_id, time1, time2");

    const participantes = apostas?.length ?? 0;
    const arrecadado = participantes * 10;
    const pool = arrecadado + Number(cfg?.acumulado_anterior || 0);

    const acertaDois = (a: { time1: string; time2: string }) => {
      const set = new Set([a.time1.toLowerCase(), a.time2.toLowerCase()]);
      return set.has(finais[0]) && set.has(finais[1]);
    };
    const acertaUm = (a: { time1: string; time2: string }) => {
      const set = new Set([a.time1.toLowerCase(), a.time2.toLowerCase()]);
      return set.has(finais[0]) || set.has(finais[1]);
    };

    const acertadores = (apostas ?? []).filter(acertaDois);
    for (const a of apostas ?? []) {
      await supabase.from("bolao_apostas_finalistas").update({
        acertou_os_dois: acertaDois(a), acertou_um: acertaUm(a),
      }).eq("id", a.id);
    }

    if (acertadores.length === 0) {
      await supabase.from("bolao_premios").insert({
        modalidade: "finalistas", usuario_id: null, valor: pool, status: "acumulado",
      });
    } else {
      const valor = +(pool / acertadores.length).toFixed(2);
      for (const a of acertadores) {
        await supabase.from("bolao_premios").insert({
          modalidade: "finalistas", usuario_id: a.usuario_id, valor, status: "pendente",
        });
      }
    }

    await supabase.from("bolao_config_finalistas").update({
      status: "apurada", finalista1_real: f1, finalista2_real: f2, total_arrecadado: arrecadado,
    }).eq("id", 1);
    return json({ ok: true, pool, acertadores: acertadores.length });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
