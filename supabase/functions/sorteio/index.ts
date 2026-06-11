import { json, preflight } from "../_shared/cors.ts";
import { admin, validarAdmin } from "../_shared/supabase.ts";

function log(level: "INFO"|"WARN"|"ERROR", msg: string, data?: unknown) {
  console.log(JSON.stringify({ level, ts: new Date().toISOString(), msg, ...(data ? {data} : {}) }));
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

Deno.serve(async (req) => {
  const pre = preflight(req); if (pre) return pre;
  const supabase = admin();

  try {
    // ===== GET: visualizar ordem atual do sorteio =====
    if (req.method === "GET") {
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

      log("INFO", `GET sorteio: ${ordem?.length ?? 0} posições`);
      return json({
        realizado: cfg?.sorteio_realizado ?? false,
        ordem: (ordem ?? []).map((o: any) => ({
          posicao: o.posicao,
          usuario_id: o.usuario_id,
          nome: o.bolao_usuarios?.nome ?? "—",
          sorteado_em: o.sorteado_em,
        })),
      });
    }

    const body = await req.json();
    const action = String(body.action ?? "realizar");

    // ===== REALIZAR SORTEIO =====
    if (action === "realizar") {
      // Verificar se já foi realizado
      const { data: cfg } = await supabase
        .from("bolao_config")
        .select("sorteio_realizado")
        .eq("id", 1)
        .single();

      if (cfg?.sorteio_realizado) {
        return json({ error: "Sorteio já foi realizado. Apenas um administrador pode redefinir." }, 409);
      }

      // Buscar participantes ativos
      const { data: usuarios, error: uErr } = await supabase
        .from("bolao_usuarios")
        .select("id, nome")
        .eq("excluido_manualmente", false)
        .order("criado_em");
      if (uErr) throw uErr;
      if (!usuarios || usuarios.length === 0) {
        return json({ error: "Nenhum participante cadastrado para sortear" }, 400);
      }

      // Sortear ordem aleatória
      const ordemSorteada = shuffle(usuarios);

      // Persistir sorteio (deletar anteriores e recriar)
      await supabase.from("bolao_sorteio_ordem").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      const rows = ordemSorteada.map((u, idx) => ({
        usuario_id: u.id,
        posicao: idx + 1,
      }));
      const { error: insErr } = await supabase.from("bolao_sorteio_ordem").insert(rows);
      if (insErr) throw insErr;

      // Atualizar ordem_sorteio em bolao_usuarios
      for (const row of rows) {
        await supabase.from("bolao_usuarios")
          .update({ ordem_sorteio: row.posicao })
          .eq("id", row.usuario_id);
      }

      // Marcar sorteio como realizado
      await supabase.from("bolao_config").update({ sorteio_realizado: true }).eq("id", 1);

      log("INFO", "Sorteio realizado", { participantes: usuarios.length, ordem: ordemSorteada.map(u => u.nome) });
      return json({
        ok: true,
        ordem: ordemSorteada.map((u, idx) => ({ posicao: idx + 1, nome: u.nome, usuario_id: u.id })),
      });
    }

    // ===== RESETAR SORTEIO (admin only) =====
    if (action === "resetar") {
      const adminPin = String(body.admin_pin ?? "");
      const isAdmin = await validarAdmin(supabase, adminPin);
      if (!isAdmin) return json({ error: "PIN de administrador inválido" }, 401);

      // Limpar sorteio
      await supabase.from("bolao_sorteio_ordem").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("bolao_usuarios").update({ ordem_sorteio: null }).neq("id", "00000000-0000-0000-0000-000000000000");
      await supabase.from("bolao_config").update({ sorteio_realizado: false }).eq("id", 1);

      log("INFO", "Sorteio redefinido pelo administrador");
      return json({ ok: true, message: "Sorteio redefinido. Um novo sorteio pode ser realizado." });
    }

    return json({ error: "Ação desconhecida. Use: realizar | resetar" }, 400);
  } catch (e) {
    log("ERROR", "Erro no sorteio", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
