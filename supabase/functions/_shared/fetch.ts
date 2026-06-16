export const TIMEOUT_MS = 30000;

export function log(level: "INFO" | "WARN" | "ERROR", msg: string, data?: unknown) {
  console.log(
    JSON.stringify({ level, ts: new Date().toISOString(), msg, ...(data ? { data } : {}) }),
  );
}

export async function fetchWithTimeout(
  url: string,
  opts: RequestInit = {},
  ms = TIMEOUT_MS,
): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function normalizeTeamName(name: string): string {
  const n = (name || "").trim();
  if (n === "United States" || n === "United States of America") return "USA";
  if (n === "Brasil") return "Brazil";
  if (n === "Korea Republic" || n === "South Korea") return "South Korea";
  return n;
}

export function mapStatus(s: string): string {
  const x = (s || "").toUpperCase();
  if (x === "FINISHED" || x === "FT" || x === "AET" || x === "PEN") return "encerrado";
  if (
    x === "LIVE" ||
    x === "IN_PLAY" ||
    x === "PAUSED" ||
    x === "1H" ||
    x === "2H" ||
    x === "HT" ||
    x === "ET"
  )
    return "ao_vivo";
  return "pendente";
}

export function mapFase(round: string): string {
  const r = (round || "").toLowerCase();
  if (r.includes("group") || r.includes("grupo") || r.includes("matchday") || r.includes("jornada"))
    return "grupos";
  if (r.includes("round of 16") || r.includes("oitava") || r.includes("last 16")) return "oitavas";
  if (r.includes("quarter") || r.includes("quarta")) return "quartas";
  if (r.includes("semi")) return "semis";
  if (r.includes("third") || r.includes("terceiro") || r.includes("3rd")) return "terceiro";
  if (r.includes("final")) return "final";
  return "grupos";
}

export function mapStageToRound(stage: string, matchday: number): string {
  const s = (stage || "").toUpperCase();
  if (s === "GROUP_STAGE") return `Group Stage - Matchday ${matchday}`;
  if (s === "LAST_16" || s === "ROUND_OF_16") return "Round of 16";
  if (s === "QUARTER_FINALS") return "Quarter-finals";
  if (s === "SEMI_FINALS") return "Semi-finals";
  if (s === "THIRD_PLACE") return "Third place play-off";
  if (s === "FINAL") return "Final";
  return `Matchday ${matchday}`;
}

export function extractGrupoLetter(groupStr: string | null | undefined): string | null {
  if (!groupStr) return null;
  const m =
    groupStr.match(/GROUP_([A-L])/i) ||
    groupStr.match(/grupo\s*([A-L])/i) ||
    groupStr.match(/^([A-L])$/i);
  return m ? m[1].toUpperCase() : null;
}

export type JogoSync = {
  api_jogo_id: number;
  api_football_id?: number | null;
  time_casa: string;
  time_fora: string;
  placar_casa: number | null;
  placar_fora: number | null;
  placar_casa_ht?: number | null;
  placar_fora_ht?: number | null;
  minuto_jogo?: number | null;
  status_raw: string;
  data_hora: string;
  round: string;
  stadium: string | null;
  grupo: string | null;
  fonte: string;
};
