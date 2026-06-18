// @ts-nocheck
import { describe, test, expect, mock } from "bun:test";
import {
  normalizeTeamName,
  mapStatus,
  mapFase,
  extractGrupoLetter,
} from "../../supabase/functions/_shared/fetch.ts";

// 1. Test of API Sync Mapping functions
describe("Bolão Copa 2026 — API Sync Mappings", () => {
  test("normalizeTeamName maps team names correctly", () => {
    expect(normalizeTeamName("United States")).toBe("USA");
    expect(normalizeTeamName("United States of America")).toBe("USA");
    expect(normalizeTeamName("Brasil")).toBe("Brazil");
    expect(normalizeTeamName("South Korea")).toBe("South Korea");
    expect(normalizeTeamName("Korea Republic")).toBe("South Korea");
    expect(normalizeTeamName("France")).toBe("France");
  });

  test("mapStatus maps match status strings correctly", () => {
    expect(mapStatus("FINISHED")).toBe("encerrado");
    expect(mapStatus("FT")).toBe("encerrado");
    expect(mapStatus("AET")).toBe("encerrado");
    expect(mapStatus("PEN")).toBe("encerrado");

    expect(mapStatus("LIVE")).toBe("ao_vivo");
    expect(mapStatus("IN_PLAY")).toBe("ao_vivo");
    expect(mapStatus("HT")).toBe("ao_vivo");
    expect(mapStatus("2H")).toBe("ao_vivo");

    expect(mapStatus("SCHEDULED")).toBe("pendente");
    expect(mapStatus("TIMED")).toBe("pendente");
  });

  test("mapFase maps tournament rounds correctly", () => {
    expect(mapFase("Group Stage - Matchday 1")).toBe("grupos");
    expect(mapFase("Grupo A")).toBe("grupos");
    expect(mapFase("Round of 16")).toBe("oitavas");
    expect(mapFase("Quarter-finals")).toBe("quartas");
    expect(mapFase("Semi-finals")).toBe("semis");
    expect(mapFase("Third place play-off")).toBe("terceiro");
    expect(mapFase("Final")).toBe("final");
  });

  test("extractGrupoLetter extracts group letter correctly", () => {
    expect(extractGrupoLetter("GROUP_A")).toBe("A");
    expect(extractGrupoLetter("Grupo B")).toBe("B");
    expect(extractGrupoLetter("C")).toBe("C");
    expect(extractGrupoLetter("Round of 16")).toBeNull();
  });
});

// Mock user list and DB simulation
interface SimUsuario {
  id: string;
  nome: string;
  pin_hash?: string;
  e_participante_padrao: boolean;
  excluido_manualmente: boolean;
}

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

function simularInitDefaults(db: SimUsuario[]): { criados: string[]; ignorados: string[] } {
  const criados: string[] = [];
  const ignorados: string[] = [];

  for (const nome of PARTICIPANTES_PADRAO) {
    const existente = db.find((u) => u.nome === nome);
    if (existente) {
      if (existente.excluido_manualmente) {
        ignorados.push(nome);
      } else {
        existente.e_participante_padrao = true;
        existente.pin_hash = "hashed_1234";
        ignorados.push(nome);
      }
    } else {
      const novo: SimUsuario = {
        id: `u-${nome.toLowerCase()}`,
        nome,
        pin_hash: "hashed_1234",
        e_participante_padrao: true,
        excluido_manualmente: false,
      };
      db.push(novo);
      criados.push(nome);
    }
  }

  return { criados, ignorados };
}

function simularCriarUsuario(
  db: SimUsuario[],
  nome: string,
): { ok: boolean; error?: string; usuario?: SimUsuario } {
  const nomeTrim = nome.trim();
  if (!nomeTrim || nomeTrim.length < 2 || nomeTrim.length > 40) {
    return { ok: false, error: "Nome inválido (2-40 caracteres)" };
  }

  const existente = db.find((u) => u.nome === nomeTrim);
  if (existente && !existente.excluido_manualmente) {
    return { ok: false, error: "Nome já cadastrado" };
  }

  if (existente && existente.excluido_manualmente) {
    existente.excluido_manualmente = false;
    existente.e_participante_padrao = false;
    existente.pin_hash = "hashed_1234";
    return { ok: true, usuario: existente };
  }

  const novo: SimUsuario = {
    id: `u-${Math.random().toString(36).substr(2, 9)}`,
    nome: nomeTrim,
    pin_hash: "hashed_1234",
    e_participante_padrao: false,
    excluido_manualmente: false,
  };
  db.push(novo);
  return { ok: true, usuario: novo };
}

// 2. Test of Participant Management
describe("Bolão Copa 2026 — Participant Logic", () => {
  test("simularInitDefaults creates 8 standard participants", () => {
    const db: SimUsuario[] = [];
    const res = simularInitDefaults(db);
    expect(res.criados.length).toBe(8);
    expect(db.length).toBe(8);
    expect(db.every((u) => u.e_participante_padrao)).toBe(true);
  });

  test("simularInitDefaults is idempotent (does not duplicate)", () => {
    const db: SimUsuario[] = [];
    simularInitDefaults(db);
    const res2 = simularInitDefaults(db);
    expect(res2.criados.length).toBe(0);
    expect(res2.ignorados.length).toBe(8);
    expect(db.length).toBe(8);
  });

  test("simularInitDefaults respects excluido_manualmente flag", () => {
    const db: SimUsuario[] = [];
    simularInitDefaults(db);
    // User Zé gets manually deleted
    const ze = db.find((u) => u.nome === "Zé");
    if (ze) ze.excluido_manualmente = true;

    // Run sync again
    const res2 = simularInitDefaults(db);
    expect(res2.criados).not.toContain("Zé");
    expect(db.find((u) => u.nome === "Zé")?.excluido_manualmente).toBe(true);
  });

  test("simularCriarUsuario prevents duplicates and allows reactivation", () => {
    const db: SimUsuario[] = [];
    simularInitDefaults(db);

    // Try to create existing name
    const res1 = simularCriarUsuario(db, "Igor");
    expect(res1.ok).toBe(false);
    expect(res1.error).toBe("Nome já cadastrado");

    // Delete "Igor" manually
    const igor = db.find((u) => u.nome === "Igor");
    if (igor) igor.excluido_manualmente = true;

    // Create again - should reactivate
    const res2 = simularCriarUsuario(db, "Igor");
    expect(res2.ok).toBe(true);
    expect(res2.usuario?.excluido_manualmente).toBe(false);
    expect(res2.usuario?.e_participante_padrao).toBe(false); // standard user loses standard flag when added manually as guest
  });
});

// 3. Test of Game/Bracket Persistence payload generation
interface GamePersistPayload {
  api_jogo_id: number;
  time_casa: string;
  time_fora: string;
  e_brasil: boolean;
  fase: string;
  valor_entrada: number;
}

interface BracketPersistPayload {
  fase: string;
  time1: string;
  time2: string;
  placar_time1: number | null;
  placar_time2: number | null;
  vencedor: string | null;
}

function processGameForPersistence(j: {
  api_jogo_id: number;
  time_casa: string;
  time_fora: string;
  status_raw: string;
  round: string;
  placar_casa: number | null;
  placar_fora: number | null;
}): { game: GamePersistPayload; bracket?: BracketPersistPayload } {
  const e_brasil = j.time_casa === "Brazil" || j.time_fora === "Brazil";
  const fase = mapFase(j.round);
  const game: GamePersistPayload = {
    api_jogo_id: j.api_jogo_id,
    time_casa: j.time_casa,
    time_fora: j.time_fora,
    e_brasil,
    fase,
    valor_entrada: e_brasil ? 10 : 5,
  };

  if (fase !== "grupos") {
    const vencedor =
      j.placar_casa != null && j.placar_fora != null
        ? j.placar_casa > j.placar_fora
          ? j.time_casa
          : j.time_fora
        : null;
    const bracket: BracketPersistPayload = {
      fase,
      time1: j.time_casa,
      time2: j.time_fora,
      placar_time1: j.placar_casa,
      placar_time2: j.placar_fora,
      vencedor,
    };
    return { game, bracket };
  }

  return { game };
}

describe("Bolão Copa 2026 — Game and Knockout Persistence", () => {
  test("detects Brazil game, increases entrance fee to 10 BRL", () => {
    const match = {
      api_jogo_id: 201,
      time_casa: "Brazil",
      time_fora: "Argentina",
      status_raw: "SCHEDULED",
      round: "Group Stage",
      placar_casa: null,
      placar_fora: null,
    };
    const res = processGameForPersistence(match);
    expect(res.game.e_brasil).toBe(true);
    expect(res.game.valor_entrada).toBe(10);
    expect(res.bracket).toBeUndefined();
  });

  test("regular games have entrance fee of 5 BRL", () => {
    const match = {
      api_jogo_id: 202,
      time_casa: "Germany",
      time_fora: "France",
      status_raw: "SCHEDULED",
      round: "Group Stage",
      placar_casa: null,
      placar_fora: null,
    };
    const res = processGameForPersistence(match);
    expect(res.game.e_brasil).toBe(false);
    expect(res.game.valor_entrada).toBe(5);
  });

  test("knockout stage games generate bracket records with winner", () => {
    const match = {
      api_jogo_id: 301,
      time_casa: "Brazil",
      time_fora: "France",
      status_raw: "FINISHED",
      round: "Round of 16",
      placar_casa: 2,
      placar_fora: 1,
    };
    const res = processGameForPersistence(match);
    expect(res.game.fase).toBe("oitavas");
    expect(res.bracket).toBeDefined();
    expect(res.bracket?.fase).toBe("oitavas");
    expect(res.bracket?.time1).toBe("Brazil");
    expect(res.bracket?.vencedor).toBe("Brazil");
  });
});

// 4. Test of Exclusividade Placar check
interface SimPalpite {
  id: string;
  usuario_id: string;
  jogo_id: string;
  gols_casa: number;
  gols_fora: number;
}

function simularSalvarPalpite(
  palpites: SimPalpite[],
  config: { exclusividade_placar: boolean },
  novo: SimPalpite,
  usuarioNomeMap: Record<string, string>,
): { ok: boolean; error?: string } {
  // A exclusividade foi completamente desativada/removida, permitindo apostas duplicadas incondicionalmente
  const idx = palpites.findIndex(
    (p) => p.jogo_id === novo.jogo_id && p.usuario_id === novo.usuario_id,
  );
  if (idx >= 0) {
    palpites[idx] = novo;
  } else {
    palpites.push(novo);
  }
  return { ok: true };
}

// Lógica de bloqueio após confirmação inicial do palpite
function simularSalvarPalpiteComBloqueioConfirmacao(
  palpites: SimPalpite[],
  novo: SimPalpite,
): { ok: boolean; error?: string } {
  const jaExiste = palpites.some(
    (p) => p.jogo_id === novo.jogo_id && p.usuario_id === novo.usuario_id,
  );
  if (jaExiste) {
    return {
      ok: false,
      error: "Você já confirmou seu palpite para este jogo e não pode alterá-lo.",
    };
  }
  palpites.push(novo);
  return { ok: true };
}

describe("Bolão Copa 2026 — Prediction Exclusividade & Lock", () => {
  const users: Record<string, string> = {
    "u-igor": "Igor",
    "u-natan": "Natan",
    "u-alison": "Alison",
  };

  test("allows duplicate score for same game even if exclusividade is active", () => {
    const palpites: SimPalpite[] = [
      { id: "p1", usuario_id: "u-igor", jogo_id: "g-1", gols_casa: 2, gols_fora: 1 },
    ];
    const config = { exclusividade_placar: true };

    const novo = { id: "p2", usuario_id: "u-natan", jogo_id: "g-1", gols_casa: 2, gols_fora: 1 };
    const res = simularSalvarPalpite(palpites, config, novo, users);

    expect(res.ok).toBe(true);
    expect(palpites.length).toBe(2);
  });

  test("allows same score for different games", () => {
    const palpites: SimPalpite[] = [
      { id: "p1", usuario_id: "u-igor", jogo_id: "g-1", gols_casa: 2, gols_fora: 1 },
    ];
    const config = { exclusividade_placar: true };

    const novo = { id: "p2", usuario_id: "u-natan", jogo_id: "g-2", gols_casa: 2, gols_fora: 1 };
    const res = simularSalvarPalpite(palpites, config, novo, users);

    expect(res.ok).toBe(true);
    expect(palpites.length).toBe(2);
  });

  test("allows user to update score in simulation before confirmation block is applied", () => {
    const palpites: SimPalpite[] = [
      { id: "p1", usuario_id: "u-igor", jogo_id: "g-1", gols_casa: 2, gols_fora: 1 },
    ];
    const config = { exclusividade_placar: true };

    const novo = { id: "p1", usuario_id: "u-igor", jogo_id: "g-1", gols_casa: 2, gols_fora: 1 };
    const res = simularSalvarPalpite(palpites, config, novo, users);

    expect(res.ok).toBe(true);
  });

  test("allows initial bet placement in locking system", () => {
    const palpites: SimPalpite[] = [];
    const novo = { id: "p1", usuario_id: "u-igor", jogo_id: "g-1", gols_casa: 2, gols_fora: 1 };
    const res = simularSalvarPalpiteComBloqueioConfirmacao(palpites, novo);
    expect(res.ok).toBe(true);
    expect(palpites.length).toBe(1);
  });

  test("rejects subsequent updates/edits to the confirmed bet", () => {
    const palpites: SimPalpite[] = [
      { id: "p1", usuario_id: "u-igor", jogo_id: "g-1", gols_casa: 2, gols_fora: 1 },
    ];
    const novo = { id: "p1", usuario_id: "u-igor", jogo_id: "g-1", gols_casa: 3, gols_fora: 2 };
    const res = simularSalvarPalpiteComBloqueioConfirmacao(palpites, novo);
    expect(res.ok).toBe(false);
    expect(res.error).toBe("Você já confirmou seu palpite para este jogo e não pode alterá-lo.");
  });
});

// 5. Test of Manual Game Locking
interface SimJogo {
  id: string;
  bloqueado_manual: boolean;
  status: string;
}

function simularSalvarPalpiteComBloqueio(
  palpites: SimPalpite[],
  jogo: SimJogo,
  novo: SimPalpite,
): { ok: boolean; error?: string } {
  if (jogo.bloqueado_manual) {
    return {
      ok: false,
      error: "Palpites encerrados para este jogo (bloqueado manualmente pelo administrador).",
    };
  }
  if (jogo.status === "encerrado" || jogo.status === "apurado") {
    return {
      ok: false,
      error: "O resultado deste jogo já foi confirmado. Palpites não podem mais ser alterados.",
    };
  }
  palpites.push(novo);
  return { ok: true };
}

describe("Bolão Copa 2026 — Game Locking Logic", () => {
  test("blocks predictions when game is manually locked", () => {
    const game: SimJogo = { id: "g-1", status: "pendente", bloqueado_manual: true };
    const palpites: SimPalpite[] = [];
    const novo = { id: "p1", usuario_id: "u-igor", jogo_id: "g-1", gols_casa: 2, gols_fora: 1 };

    const res = simularSalvarPalpiteComBloqueio(palpites, game, novo);
    expect(res.ok).toBe(false);
    expect(res.error).toBe(
      "Palpites encerrados para este jogo (bloqueado manualmente pelo administrador).",
    );
  });

  test("allows predictions when game is not manually locked and pending", () => {
    const game: SimJogo = { id: "g-1", status: "pendente", bloqueado_manual: false };
    const palpites: SimPalpite[] = [];
    const novo = { id: "p1", usuario_id: "u-igor", jogo_id: "g-1", gols_casa: 2, gols_fora: 1 };

    const res = simularSalvarPalpiteComBloqueio(palpites, game, novo);
    expect(res.ok).toBe(true);
  });
});

// 6. Test of Invitation Link Validation
interface SimConvite {
  id: string;
  codigo: string;
  limite_vagas: number | null;
  vagas_usadas: number;
  expira_em: string | null;
}

function simularValidarConvite(
  convite: SimConvite | null,
  dataAtual: Date,
): { ok: boolean; error?: string } {
  if (!convite) {
    return { ok: false, error: "Código de convite inválido ou ausente." };
  }
  const isExpired = convite.expira_em && new Date(convite.expira_em) < dataAtual;
  if (isExpired) {
    return { ok: false, error: "Este link de convite expirou." };
  }
  const isFull = convite.limite_vagas != null && convite.vagas_usadas >= convite.limite_vagas;
  if (isFull) {
    return { ok: false, error: "O limite de vagas para este convite foi atingido." };
  }
  return { ok: true };
}

describe("Bolão Copa 2026 — Invitation Links", () => {
  test("accepts a valid active invite", () => {
    const convite: SimConvite = {
      id: "c-1",
      codigo: "VALID1",
      limite_vagas: 10,
      vagas_usadas: 2,
      expira_em: new Date(Date.now() + 3600000).toISOString(),
    };
    const res = simularValidarConvite(convite, new Date());
    expect(res.ok).toBe(true);
  });

  test("rejects expired invite", () => {
    const convite: SimConvite = {
      id: "c-1",
      codigo: "EXPIRED1",
      limite_vagas: 10,
      vagas_usadas: 2,
      expira_em: new Date(Date.now() - 3600000).toISOString(),
    };
    const res = simularValidarConvite(convite, new Date());
    expect(res.ok).toBe(false);
    expect(res.error).toBe("Este link de convite expirou.");
  });

  test("rejects when slots are exhausted", () => {
    const convite: SimConvite = {
      id: "c-1",
      codigo: "FULL1",
      limite_vagas: 5,
      vagas_usadas: 5,
      expira_em: null,
    };
    const res = simularValidarConvite(convite, new Date());
    expect(res.ok).toBe(false);
    expect(res.error).toBe("O limite de vagas para este convite foi atingido.");
  });
});
