import { json, preflight } from "../_shared/cors.ts";
import { admin, validarAdmin } from "../_shared/supabase.ts";
import {
  buscarOrdemJogo,
  realizarSorteioJogo,
  shuffle,
} from "../_shared/sorteio.ts";

function log(level: "INFO"|"WARN"|"ERROR", msg: string, data?: unknown) {
  console.log(JSON.stringify({ level, ts: new Date().toISOString(), msg, ...(data ? {data} : {}) }));
}

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  const supabase = admin();

  try {
    const url = new URL(req.url);
    const jogoIdQuery = url.searchParams.get("jogo_id")?.trim() || null;

    // ===== GET: visualizar ordem do sorteio (global legado ou por jogo) =====
    if (req.method === "GET") {
      if (jogoIdQuery) {
        const { data: jogo } = await supabase
          .from("bolao_jogos")
          .select("id, sorteio_realizado, time_casa, time_fora, data_hora")
          .eq("id", jogoIdQuery)
          .single();
        if (!jogo) return json({ error: "Jogo não encontrado" }, 404);

        const ordem = await buscarOrdemJogo(supabase, jogoIdQuery);
        log("INFO", `GET sorteio jogo ${jogoIdQuery}: ${ordem.length} posições`);
        return json({
          jogo_id: jogoIdQuery,
          realizado: jogo.sorteio_realizado ?? false,
          jogo: { time_casa: jogo.time_casa, time_fora: jogo.time_fora, data_hora: jogo.data_hora },
          ordem: ordem.map(o => ({
            posicao: o.posicao,
            usuario_id: o.usuario_id,
            nome: o.nome ?? "—",
          })),
        });
      }

      // Sorteio global legado (bolão inteiro)
      const { data: ordem, error } = await supabase
        .from("bolao_sorteio_ordem")
        .select("posicao, usuario_id, sorteado_em, bolao_usuarios(nome)")
        .order("posicao");
      if (error) throw error;

      const { data: cfg } = await supabase
        .from("bolao_config")
        .select("sorteio_realizado")
        .eq("id", 1)
        .single();

      log("INFO", `GET sorteio global: ${ordem?.length ?? 0} posições`);
      return json({
        realizado: cfg?.sorteio_realizado ?? false,
        ordem: (ordem ?? []).map((o: { posicao: number; usuario_id: string; sorteado_em: string; bolao_usuarios?: { nome?: string } }) => ({
          posicao: o.posicao,
          usuario_id: o.usuario_id,
          nome: o.bolao_usuarios?.nome ?? "—",
          sorteado_em: o.sorteado_em,
        })),
      });
    }

    const body = await req.json();
    const action = String(body.action ?? "realizar");
    const jogo_id = String(body.jogo_id ?? jogoIdQuery ?? "").trim();

    // ===== REALIZAR SORTEIO PARA TODOS OS JOGOS (admin) =====
    if (action === "realizar_todos") {
      const adminPin = String(body.admin_pin ?? "");
      const isAdmin = await validarAdmin(supabase, adminPin);
      if (!isAdmin) return json({ error: "PIN de administrador inválido" }, 401);

      // 1. Obter todos os participantes
      const { data: usuarios, error: uErr } = await supabase
        .from("bolao_usuarios")
        .select("id, nome")
        .eq("excluido_manualmente", false)
        .order("criado_em");
      if (uErr) throw uErr;
      if (!usuarios?.length) {
        return json({ error: "Nenhum participante cadastrado para sortear" }, 400);
      }

      // 2. Sortear ordem
      const ordemSorteada = shuffle(usuarios);

      // 3. Atualizar bolao_sorteio_ordem
      const { error: delGlobalErr } = await supabase.from("bolao_sorteio_ordem").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (delGlobalErr) throw delGlobalErr;

      const rowsGlobal = ordemSorteada.map((u, idx) => ({
        usuario_id: u.id,
        posicao: idx + 1,
      }));
      const { error: insGlobalErr } = await supabase.from("bolao_sorteio_ordem").insert(rowsGlobal);
      if (insGlobalErr) throw insGlobalErr;

      // Atualizar no usuario
      for (const row of rowsGlobal) {
        await supabase.from("bolao_usuarios")
          .update({ ordem_sorteio: row.posicao })
          .eq("id", row.usuario_id);
      }

      await supabase.from("bolao_config").update({ sorteio_realizado: true }).eq("id", 1);

      // 4. Obter todos os jogos
      const { data: jogos, error: jErr } = await supabase
        .from("bolao_jogos")
        .select("id");
      if (jErr) throw jErr;

      // 5. Para cada jogo, atualizar a fila com a mesma ordem sorteada
      // Limpa as filas existentes primeiro
      const { error: delErr } = await supabase
        .from("bolao_sorteio_jogo_ordem")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      if (delErr) throw delErr;

      const rowsJogos: any[] = [];
      for (const jogo of (jogos ?? [])) {
        const ordemJogoSorteada = shuffle(usuarios);
        ordemJogoSorteada.forEach((u, idx) => {
          rowsJogos.push({
            jogo_id: jogo.id,
            usuario_id: u.id,
            posicao: idx + 1,
          });
        });
      }

      // Bulk insert
      const { error: insErr } = await supabase
        .from("bolao_sorteio_jogo_ordem")
        .insert(rowsJogos);
      if (insErr) throw insErr;

      // Marcar sorteio_realizado = true em todos os jogos
      await supabase
        .from("bolao_jogos")
        .update({ sorteio_realizado: true })
        .neq("id", "00000000-0000-0000-0000-000000000000");

      log("INFO", "Sorteio em massa realizado para todos os jogos", { participantes: usuarios.length, jogos: jogos?.length });
      return json({
        ok: true,
        realizado: true,
        ordem: ordemSorteada.map((u, idx) => ({ posicao: idx + 1, nome: u.nome, usuario_id: u.id })),
        message: `Fila gerada para ${jogos?.length ?? 0} jogos.`,
      });
    }

    // ===== REALIZAR SORTEIO POR JOGO =====
    if (action === "realizar" && jogo_id) {
      const resultado = await realizarSorteioJogo(supabase, jogo_id);
      if (resultado.jaExistia) {
        log("INFO", `Sorteio jogo ${jogo_id} já existia`);
        return json({
          ok: true,
          jogo_id,
          realizado: true,
          ordem: resultado.ordem,
          message: "Sorteio deste jogo já havia sido realizado.",
        });
      }
      log("INFO", "Sorteio por jogo realizado", { jogo_id, ordem: resultado.ordem.map(o => o.nome) });
      return json({ ok: true, jogo_id, realizado: true, ordem: resultado.ordem });
    }

    // ===== REALIZAR SORTEIO GLOBAL (legado) =====
    if (action === "realizar" && !jogo_id) {
      const { data: cfg } = await supabase
        .from("bolao_config")
        .select("sorteio_realizado")
        .eq("id", 1)
        .single();

      if (cfg?.sorteio_realizado) {
        return json({ error: "Sorteio global já foi realizado. Apenas um administrador pode redefinir." }, 409);
      }

      const { data: usuarios, error: uErr } = await supabase
        .from("bolao_usuarios")
        .select("id, nome")
        .eq("excluido_manualmente", false)
        .order("criado_em");
      if (uErr) throw uErr;
      if (!usuarios?.length) {
        return json({ error: "Nenhum participante cadastrado para sortear" }, 400);
      }

      const ordemSorteada = shuffle(usuarios);
      await supabase.from("bolao_sorteio_ordem").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const rows = ordemSorteada.map((u, idx) => ({
        usuario_id: u.id,
        posicao: idx + 1,
      }));
      const { error: insErr } = await supabase.from("bolao_sorteio_ordem").insert(rows);
      if (insErr) throw insErr;

      for (const row of rows) {
        await supabase.from("bolao_usuarios")
          .update({ ordem_sorteio: row.posicao })
          .eq("id", row.usuario_id);
      }

      await supabase.from("bolao_config").update({ sorteio_realizado: true }).eq("id", 1);

      log("INFO", "Sorteio global realizado", { participantes: usuarios.length });
      return json({
        ok: true,
        ordem: ordemSorteada.map((u, idx) => ({ posicao: idx + 1, nome: u.nome, usuario_id: u.id })),
      });
    }

    // ===== RESETAR SORTEIO POR JOGO (admin) =====
    if (action === "resetar" && jogo_id) {
      const adminPin = String(body.admin_pin ?? "");
      const isAdmin = await validarAdmin(supabase, adminPin);
      if (!isAdmin) return json({ error: "PIN de administrador inválido" }, 401);

      await supabase.from("bolao_sorteio_jogo_ordem").delete().eq("jogo_id", jogo_id);
      await supabase.from("bolao_jogos").update({ sorteio_realizado: false }).eq("id", jogo_id);

      log("INFO", "Sorteio do jogo redefinido", { jogo_id });
      return json({ ok: true, message: "Sorteio do jogo redefinido." });
    }

    // ===== RESETAR SORTEIO GLOBAL (admin) =====
    if (action === "resetar" && !jogo_id) {
      const adminPin = String(body.admin_pin ?? "");
      const isAdmin = await validarAdmin(supabase, adminPin);
      if (!isAdmin) return json({ error: "PIN de administrador inválido" }, 401);

      await supabase.from("bolao_sorteio_ordem").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("bolao_usuarios").update({ ordem_sorteio: null }).neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("bolao_config").update({ sorteio_realizado: false }).eq("id", 1);

      log("INFO", "Sorteio global redefinido pelo administrador");
      return json({ ok: true, message: "Sorteio redefinido. Um novo sorteio pode ser realizado." });
    }

    return json({ error: "Ação desconhecida. Use: realizar | resetar (com jogo_id opcional)" }, 400);
  } catch (e) {
    log("ERROR", "Erro no sorteio", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
