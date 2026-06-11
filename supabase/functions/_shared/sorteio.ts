import type { admin } from "./supabase.ts";

type Supabase = ReturnType<typeof admin>;

export interface OrdemSorteio {
  posicao: number;
  usuario_id: string;
  nome?: string;
}

/** Fisher-Yates shuffle */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function buscarOrdemJogo(
  supabase: Supabase,
  jogo_id: string,
): Promise<OrdemSorteio[]> {
  const { data, error } = await supabase
    .from("bolao_sorteio_jogo_ordem")
    .select("posicao, usuario_id, bolao_usuarios(nome)")
    .eq("jogo_id", jogo_id)
    .order("posicao");
  if (error) throw error;
  return (data ?? []).map((o: { posicao: number; usuario_id: string; bolao_usuarios?: { nome?: string } }) => ({
    posicao: o.posicao,
    usuario_id: o.usuario_id,
    nome: o.bolao_usuarios?.nome,
  }));
}

/** Verifica se é a vez do participante palpitar (sequência do sorteio). */
export function verificarVezNaSequencia(
  ordem: OrdemSorteio[],
  usuario_id: string,
  usuariosComPalpite: Set<string>,
): { ok: true } | { ok: false; error: string; aguardando?: string; posicao?: number } {
  if (ordem.length === 0) {
    return { ok: false, error: "Sorteio deste jogo ainda não foi realizado." };
  }

  // Quem já palpitou pode alterar o próprio palpite a qualquer momento.
  if (usuariosComPalpite.has(usuario_id)) return { ok: true };

  for (const item of ordem) {
    if (!usuariosComPalpite.has(item.usuario_id)) {
      if (item.usuario_id === usuario_id) return { ok: true };
      const nome = item.nome ?? "outro participante";
      return {
        ok: false,
        error: `Aguarde a vez de ${nome} (${item.posicao}º no sorteio).`,
        aguardando: nome,
        posicao: item.posicao,
      };
    }
  }

  return { ok: true };
}

export async function realizarSorteioJogo(
  supabase: Supabase,
  jogo_id: string,
): Promise<{ ordem: OrdemSorteio[]; jaExistia: boolean }> {
  const { data: jogo } = await supabase
    .from("bolao_jogos")
    .select("id, sorteio_realizado, time_casa, time_fora")
    .eq("id", jogo_id)
    .single();
  if (!jogo) throw new Error("Jogo não encontrado");

  if (jogo.sorteio_realizado) {
    const ordem = await buscarOrdemJogo(supabase, jogo_id);
    return { ordem, jaExistia: true };
  }

  const { data: usuarios, error: uErr } = await supabase
    .from("bolao_usuarios")
    .select("id, nome")
    .eq("excluido_manualmente", false)
    .order("criado_em");
  if (uErr) throw uErr;
  if (!usuarios?.length) throw new Error("Nenhum participante cadastrado para sortear");

  const ordemSorteada = shuffle(usuarios);
  await supabase.from("bolao_sorteio_jogo_ordem").delete().eq("jogo_id", jogo_id);

  const rows = ordemSorteada.map((u, idx) => ({
    jogo_id,
    usuario_id: u.id,
    posicao: idx + 1,
  }));
  const { error: insErr } = await supabase.from("bolao_sorteio_jogo_ordem").insert(rows);
  if (insErr) throw insErr;

  await supabase.from("bolao_jogos").update({ sorteio_realizado: true }).eq("id", jogo_id);

  return {
    ordem: ordemSorteada.map((u, idx) => ({
      posicao: idx + 1,
      usuario_id: u.id,
      nome: u.nome,
    })),
    jaExistia: false,
  };
}
