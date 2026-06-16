import { json, preflight } from "../_shared/cors.ts";
import { admin, hashPin, validarUsuario } from "../_shared/supabase.ts";

const PARTICIPANTES_PADRAO = [
  "Igor",
  "Natan",
  "Alison",
  "Pedro",
  "Zé",
  "Paulo",
  "Vitinho",
  "Kelvin",
];
const PIN_PADRAO = "1234";

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
    // ===== GET: listar usuários =====
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("bolao_usuarios")
        .select("id, nome, criado_em, pin_hash, e_participante_padrao, excluido_manualmente")
        .eq("excluido_manualmente", false)
        .order("criado_em");
      if (error) throw error;
      log("INFO", `Listando usuários: ${data?.length ?? 0}`);
      return json(
        data?.map((u) => ({
          ...u,
          tem_pin: !!u.pin_hash,
          pin_hash: undefined,
        })) ?? [],
      );
    }

    const body = await req.json();
    const action = String(body.action ?? "create");

    // ===== LOGIN: validar entrada por nome + PIN =====
    if (action === "login") {
      const nome = String(body.nome ?? "").trim();
      const pin = body.pin ? String(body.pin).trim() : null;
      if (!nome) return json({ error: "Nome obrigatório" }, 400);
      if (!pin || !/^\d{4}$/.test(pin)) return json({ error: "PIN deve ter 4 dígitos" }, 400);

      const v = await validarUsuario(supabase, nome, pin);
      if (!v.ok) return json({ error: v.error }, 401);

      const { data: usuario, error } = await supabase
        .from("bolao_usuarios")
        .select("id, nome, e_participante_padrao")
        .eq("id", v.id)
        .single();
      if (error) throw error;
      return json({ ok: true, usuario: { ...usuario, tem_pin: true } });
    }

    // ===== INIT: criar 8 participantes padrão =====
    if (action === "init_defaults") {
      log("INFO", "Inicializando participantes padrão");
      const criados: string[] = [];
      const ignorados: string[] = [];

      for (const nome of PARTICIPANTES_PADRAO) {
        // Verifica se já existe (incluindo excluídos)
        const { data: existente } = await supabase
          .from("bolao_usuarios")
          .select("id, excluido_manualmente")
          .eq("nome", nome)
          .maybeSingle();

        if (existente) {
          if (existente.excluido_manualmente) {
            // Excluído manualmente — não recriar
            log("WARN", `Participante ${nome} excluído manualmente — ignorando`);
            ignorados.push(nome);
          } else {
            // Já existe e ativo — garantir e_participante_padrao = true
            await supabase
              .from("bolao_usuarios")
              .update({ e_participante_padrao: true })
              .eq("id", existente.id);
            await supabase
              .from("bolao_usuarios")
              .update({ pin_hash: await hashPin(PIN_PADRAO) })
              .eq("id", existente.id)
              .is("pin_hash", null);
            ignorados.push(nome);
          }
        } else {
          // Criar novo
          const { error } = await supabase.from("bolao_usuarios").insert({
            nome,
            pin_hash: await hashPin(PIN_PADRAO),
            e_participante_padrao: true,
          });
          if (error) {
            log("WARN", `Erro ao criar ${nome}`, error);
          } else {
            criados.push(nome);
          }
        }
      }

      log("INFO", "Init participantes concluído", { criados, ignorados });
      return json({ ok: true, criados, ignorados });
    }

    // ===== CREATE: adicionar participante =====
    if (action === "create") {
      const nome = String(body.nome ?? "").trim();
      const pin = body.pin ? String(body.pin).trim() : null;
      if (!nome || nome.length < 2 || nome.length > 40)
        return json({ error: "Nome inválido (2-40 caracteres)" }, 400);
      if (pin && !/^\d{4}$/.test(pin))
        return json({ error: "PIN deve ter exatamente 4 dígitos" }, 400);

      // Checar se já existe (mesmo excluído)
      const { data: existe } = await supabase
        .from("bolao_usuarios")
        .select("id, excluido_manualmente")
        .eq("nome", nome)
        .maybeSingle();

      if (existe && !existe.excluido_manualmente) {
        return json({ error: "Nome já cadastrado" }, 400);
      }

      const pin_hash = await hashPin(pin || PIN_PADRAO);

      if (existe && existe.excluido_manualmente) {
        // Reativar excluído manualmente (admin está adicionando explicitamente)
        const { data, error } = await supabase
          .from("bolao_usuarios")
          .update({ pin_hash, excluido_manualmente: false, e_participante_padrao: false })
          .eq("id", existe.id)
          .select("id, nome, criado_em")
          .single();
        if (error) throw error;
        log("INFO", `Participante reativado: ${nome}`);
        return json(data);
      }

      const { data, error } = await supabase
        .from("bolao_usuarios")
        .insert({ nome, pin_hash, e_participante_padrao: false })
        .select("id, nome, criado_em")
        .single();

      if (error) {
        if (error.message?.includes("Limite"))
          return json({ error: "Limite de participantes atingido" }, 400);
        if (error.code === "23505") return json({ error: "Nome já cadastrado" }, 400);
        throw error;
      }
      log("INFO", `Participante criado: ${nome}`);
      return json(data);
    }

    // ===== UPDATE_SELF: participante altera o próprio nome e PIN =====
    if (action === "update_self") {
      const nomeAtual = String(body.nome_atual ?? "").trim();
      const pinAtual = body.pin_atual ? String(body.pin_atual).trim() : null;
      const novoNome = String(body.novo_nome ?? "").trim();
      const novoPin = body.novo_pin ? String(body.novo_pin).trim() : null;

      if (!novoNome || novoNome.length < 2 || novoNome.length > 40) {
        return json({ error: "Nome inválido (2-40 caracteres)" }, 400);
      }
      if (!pinAtual || !/^\d{4}$/.test(pinAtual)) {
        return json({ error: "PIN atual deve ter 4 dígitos" }, 400);
      }
      if (!novoPin || !/^\d{4}$/.test(novoPin)) {
        return json({ error: "Novo PIN deve ter 4 dígitos" }, 400);
      }

      const v = await validarUsuario(supabase, nomeAtual, pinAtual);
      if (!v.ok) return json({ error: v.error }, 401);

      const { data: duplicado } = await supabase
        .from("bolao_usuarios")
        .select("id")
        .eq("nome", novoNome)
        .eq("excluido_manualmente", false)
        .neq("id", v.id)
        .maybeSingle();
      if (duplicado) return json({ error: "Já existe outro participante com esse nome" }, 409);

      const { data, error } = await supabase
        .from("bolao_usuarios")
        .update({ nome: novoNome, pin_hash: await hashPin(novoPin) })
        .eq("id", v.id)
        .select("id, nome, e_participante_padrao")
        .single();
      if (error) throw error;

      log("INFO", `Participante atualizou cadastro: ${nomeAtual} -> ${novoNome}`);
      return json({ ok: true, usuario: { ...data, tem_pin: true } });
    }

    // ===== DELETE: remover participante (soft delete) =====
    if (action === "delete") {
      const id = String(body.id ?? "");
      if (!id) return json({ error: "ID obrigatório" }, 400);

      const { error } = await supabase
        .from("bolao_usuarios")
        .update({ excluido_manualmente: true })
        .eq("id", id);
      if (error) throw error;

      // Remover do sorteio se existir
      await supabase.from("bolao_sorteio_ordem").delete().eq("usuario_id", id);
      await supabase.from("bolao_sorteio_jogo_ordem").delete().eq("usuario_id", id);

      log("INFO", `Participante marcado como excluído: ${id}`);
      return json({ ok: true });
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e) {
    log("ERROR", "Erro no endpoint usuarios", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
