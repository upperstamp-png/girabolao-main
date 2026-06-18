// @ts-nocheck
import { describe, test, expect } from "bun:test";

// Simulação da lógica de Sorteio (Fisher-Yates) e exclusividade de palpites
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Simulação da verificação de exclusividade de palpites (Regra Crítica)
interface Palpite {
  usuario_id: string;
  jogo_id: string;
  gols_casa: number;
  gols_fora: number;
}

function validarPalpiteExclusivo(
  novoPalpite: Palpite,
  palpitesExistentes: Palpite[],
  exclusividadeAtiva: boolean,
): { valido: boolean; erro?: string } {
  if (!exclusividadeAtiva) return { valido: true };

  const duplicado = palpitesExistentes.find(
    (p) =>
      p.jogo_id === novoPalpite.jogo_id &&
      p.gols_casa === novoPalpite.gols_casa &&
      p.gols_fora === novoPalpite.gols_fora &&
      p.usuario_id !== novoPalpite.usuario_id,
  );

  if (duplicado) {
    return {
      valido: false,
      erro: `Placar ${novoPalpite.gols_casa}x${novoPalpite.gols_fora} já foi escolhido por outro participante.`,
    };
  }

  return { valido: true };
}

describe("Bolão Copa 2026 — Sorteio de Ordem Logic", () => {
  test("shuffle returns an array with the same elements but shuffled", () => {
    const participantes = ["Igor", "Natan", "Alison", "Pedro", "Zé", "Paulo", "Vitinho", "Kelvin"];
    const shuffled = shuffle(participantes);

    expect(shuffled.length).toBe(participantes.length);
    expect(shuffled.sort()).toEqual([...participantes].sort());
  });

  test("shuffle is random enough", () => {
    const arr = Array.from({ length: 50 }, (_, i) => i);
    const shuffled = shuffle(arr);
    // It should not be in the exact same order
    expect(shuffled).not.toEqual(arr);
  });
});

function verificarVezNaSequencia(
  ordem: { posicao: number; usuario_id: string; nome?: string }[],
  usuario_id: string,
  usuariosComPalpite: Set<string>,
): { ok: boolean; error?: string } {
  if (ordem.length === 0) return { ok: false, error: "Sorteio não realizado" };
  if (usuariosComPalpite.has(usuario_id)) return { ok: true };
  for (const item of ordem) {
    if (!usuariosComPalpite.has(item.usuario_id)) {
      if (item.usuario_id === usuario_id) return { ok: true };
      return { ok: false, error: `Aguarde ${item.nome}` };
    }
  }
  return { ok: true };
}

describe("Bolão Copa 2026 — Sequência do Sorteio por Jogo", () => {
  const ordem = [
    { posicao: 1, usuario_id: "u1", nome: "Igor" },
    { posicao: 2, usuario_id: "u2", nome: "Natan" },
    { posicao: 3, usuario_id: "u3", nome: "Alison" },
  ];

  test("primeiro da ordem pode apostar quando ninguém apostou", () => {
    const res = verificarVezNaSequencia(ordem, "u1", new Set());
    expect(res.ok).toBe(true);
  });

  test("segundo da ordem não pode apostar antes do primeiro", () => {
    const res = verificarVezNaSequencia(ordem, "u2", new Set());
    expect(res.ok).toBe(false);
    expect(res.error).toContain("Igor");
  });

  test("segundo pode apostar após o primeiro", () => {
    const res = verificarVezNaSequencia(ordem, "u2", new Set(["u1"]));
    expect(res.ok).toBe(true);
  });

  test("quem já apostou pode alterar palpite", () => {
    const res = verificarVezNaSequencia(ordem, "u1", new Set(["u1"]));
    expect(res.ok).toBe(true);
  });
});

describe("Bolão Copa 2026 — Exclusividade de Placar (Regra 4)", () => {
  const palpitesExistentes: Palpite[] = [
    { usuario_id: "user-1", jogo_id: "jogo-A", gols_casa: 2, gols_fora: 1 },
    { usuario_id: "user-2", jogo_id: "jogo-A", gols_casa: 1, gols_fora: 1 },
  ];

  test("permite placar inédito quando exclusividade está ativa", () => {
    const novo = { usuario_id: "user-3", jogo_id: "jogo-A", gols_casa: 3, gols_fora: 0 };
    const res = validarPalpiteExclusivo(novo, palpitesExistentes, true);
    expect(res.valido).toBe(true);
  });

  test("permite alterar o próprio palpite para um placar já registrado por si mesmo", () => {
    const proprio = { usuario_id: "user-1", jogo_id: "jogo-A", gols_casa: 2, gols_fora: 1 };
    const res = validarPalpiteExclusivo(proprio, palpitesExistentes, true);
    expect(res.valido).toBe(true);
  });

  test("bloqueia placar duplicado por outro participante quando exclusividade está ativa", () => {
    const novo = { usuario_id: "user-3", jogo_id: "jogo-A", gols_casa: 2, gols_fora: 1 };
    const res = validarPalpiteExclusivo(novo, palpitesExistentes, true);
    expect(res.valido).toBe(false);
    expect(res.erro).toContain("já foi escolhido por outro participante");
  });

  test("permite placar duplicado quando exclusividade está desativada", () => {
    const novo = { usuario_id: "user-3", jogo_id: "jogo-A", gols_casa: 2, gols_fora: 1 };
    const res = validarPalpiteExclusivo(novo, palpitesExistentes, false);
    expect(res.valido).toBe(true);
  });
});
