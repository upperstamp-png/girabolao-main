import {
  extractGrupoLetter, fetchWithTimeout, JogoSync, log,
  mapStageToRound, mapStatus, normalizeTeamName,
} from "../fetch.ts";

const BASE = "https://api.football-data.org/v4";
const TOKEN = Deno.env.get("FOOTBALL_DATA_API_TOKEN") || "";

export type StandingRow = {
  grupo: string;
  time: string;
  posicao: number;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  gols_pro: number;
  gols_contra: number;
  saldo: number;
  pontos: number;
};

export type ElencoJogador = {
  time: string;
  nome: string;
  posicao: string | null;
  numero: number | null;
  nacionalidade: string | null;
  data_nascimento: string | null;
};

function headers() {
  return { "X-Auth-Token": TOKEN, Accept: "application/json" };
}

export async function fetchMatches(): Promise<JogoSync[]> {
  const url = `${BASE}/competitions/WC/matches`;
  log("INFO", "Football-Data.org: buscando jogos", { url });
  const r = await fetchWithTimeout(url, { headers: headers() });
  if (!r.ok) throw new Error(`Football-Data matches HTTP ${r.status}`);
  const data = await r.json();
  const arr: unknown[] = data.matches || [];
  if (!arr.length) throw new Error("Football-Data retornou 0 jogos");

  return arr.map((g: Record<string, unknown>): JogoSync | null => {
    const home = g.homeTeam as Record<string, unknown> | undefined;
    const away = g.awayTeam as Record<string, unknown> | undefined;
    const score = g.score as Record<string, unknown> | undefined;
    const ft = score?.fullTime as Record<string, unknown> | undefined;
    const ht = score?.halfTime as Record<string, unknown> | undefined;
    const id = Number(g.id ?? 0);
    const casa = normalizeTeamName(String(home?.name ?? home?.shortName ?? "").trim());
    const fora = normalizeTeamName(String(away?.name ?? away?.shortName ?? "").trim());
    const dataHora = String(g.utcDate ?? "");
    const stage = String(g.stage ?? "").trim();
    const matchday = Number(g.matchday ?? 1);
    if (!id || !casa || !fora || !dataHora) return null;
    return {
      api_jogo_id: id,
      time_casa: casa,
      time_fora: fora,
      placar_casa: ft?.home != null ? Number(ft.home) : null,
      placar_fora: ft?.away != null ? Number(ft.away) : null,
      placar_casa_ht: ht?.home != null ? Number(ht.home) : null,
      placar_fora_ht: ht?.away != null ? Number(ht.away) : null,
      status_raw: String(g.status ?? ""),
      data_hora: dataHora,
      round: mapStageToRound(stage, matchday),
      stadium: g.venue ? String(g.venue) : null,
      grupo: extractGrupoLetter(String(g.group ?? "")),
      fonte: "football-data",
    };
  }).filter((j): j is JogoSync => j !== null);
}

export async function fetchStandings(): Promise<StandingRow[]> {
  const url = `${BASE}/competitions/WC/standings`;
  log("INFO", "Football-Data.org: buscando classificacao");
  const r = await fetchWithTimeout(url, { headers: headers() });
  if (!r.ok) throw new Error(`Football-Data standings HTTP ${r.status}`);
  const data = await r.json();
  const out: StandingRow[] = [];
  for (const block of data.standings || []) {
    const grupo = extractGrupoLetter(String(block.group ?? block.stage ?? ""));
    if (!grupo) continue;
    for (const row of block.table || []) {
      const team = row.team as Record<string, unknown> | undefined;
      out.push({
        grupo,
        time: normalizeTeamName(String(team?.name ?? team?.shortName ?? "")),
        posicao: Number(row.position ?? 0),
        jogos: Number(row.playedGames ?? 0),
        vitorias: Number(row.won ?? 0),
        empates: Number(row.draw ?? 0),
        derrotas: Number(row.lost ?? 0),
        gols_pro: Number(row.goalsFor ?? 0),
        gols_contra: Number(row.goalsAgainst ?? 0),
        saldo: Number(row.goalDifference ?? 0),
        pontos: Number(row.points ?? 0),
      });
    }
  }
  return out;
}

export async function fetchSquads(): Promise<ElencoJogador[]> {
  const url = `${BASE}/competitions/WC/teams`;
  log("INFO", "Football-Data.org: buscando elencos");
  const r = await fetchWithTimeout(url, { headers: headers() });
  if (!r.ok) throw new Error(`Football-Data teams HTTP ${r.status}`);
  const data = await r.json();
  const out: ElencoJogador[] = [];
  for (const t of data.teams || []) {
    const time = normalizeTeamName(String(t.name ?? t.shortName ?? ""));
    for (const s of t.squad || []) {
      out.push({
        time,
        nome: String(s.name ?? ""),
        posicao: s.position ? String(s.position) : null,
        numero: s.shirtNumber != null ? Number(s.shirtNumber) : null,
        nacionalidade: s.nationality ? String(s.nationality) : null,
        data_nascimento: s.dateOfBirth ? String(s.dateOfBirth).slice(0, 10) : null,
      });
    }
  }
  return out;
}
