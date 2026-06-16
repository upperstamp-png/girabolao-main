import { json, preflight } from "../_shared/cors.ts";
import { admin, validarUsuario, verificarBolaoAberto } from "../_shared/supabase.ts";
import { notifyAllUsers } from "../_shared/push.ts";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const supabase = admin();
  try {
    const body = await req.json();
    const nome = String(body.nome ?? "").trim();
    const pin = body.pin ? String(body.pin) : null;
    const jogador_id = body.jogador_id ? String(body.jogador_id).trim() : null;

    if (!jogador_id) {
      return json({ error: "Selecione um jogador convocado" }, 400);
    }

    const { data: jogadorElenco } = await supabase
      .from("bolao_elenco")
      .select("jogador_nome")
      .eq("id", jogador_id)
      .maybeSingle();

    if (!jogadorElenco) {
      return json({ error: "Jogador convocado não encontrado" }, 404);
    }

    const jogadorNome = jogadorElenco.jogador_nome;

    const { data: cfg } = await supabase
      .from("bolao_config_artilheiro")
      .select("status")
      .eq("id", 1)
      .single();
    if (cfg?.status === "apurada")
      return json({ error: "Artilheiro já apurado — apostas encerradas." }, 400);

    const v = await validarUsuario(supabase, nome, pin);
    if (!v.ok) return json({ error: v.error }, 401);

    // Verificar se o bolão está fechado
    const statusBolao = await verificarBolaoAberto(supabase);
    if (!statusBolao.aberto) {
      return json({ error: statusBolao.error }, 400);
    }

    // Artilheiro: permitir alteração se não estiver bloqueado
    const { data: existing } = await supabase
      .from("bolao_apostas_artilheiro")
      .select("id, jogador_apostado, bloqueado_em")
      .eq("usuario_id", v.id)
      .maybeSingle();
    if (existing && existing.bloqueado_em) {
      return json({ error: "Aposta de artilheiro já bloqueada para este usuário" }, 400);
    }

    if (existing) {
      const { error } = await supabase
        .from("bolao_apostas_artilheiro")
        .update({ jogador_apostado: jogadorNome, jogador_id: jogador_id })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("bolao_apostas_artilheiro")
        .insert({ usuario_id: v.id, jogador_apostado: jogadorNome, jogador_id: jogador_id });
      if (error) throw error;
    }

    // Disparar push de notificação
    const actionVerb = existing ? "alterou sua aposta para" : "apostou em";
    await notifyAllUsers(null, {
      title: "🏆 Aposta em Artilheiro da Copa!",
      body: `${nome} ${actionVerb} ${jogadorNome} para Artilheiro da Copa`,
      url: "/apostas-especiais",
      tag: `artilheiro_${v.id}`,
    }).catch((err) => console.error("Erro ao disparar push notification", err));

    return json({ ok: true });
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});
