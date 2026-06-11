import { fetchWithTimeout, log, normalizeTeamName } from "../fetch.ts";

const COMPETITIONS_URL = "https://raw.githubusercontent.com/statsbomb/open-data/master/data/competitions.json";
const MATCHES_BASE = "https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches";
const EVENTS_BASE = "https://raw.githubusercontent.com/statsbomb/open-data/master/data/events";

export type StatsBombEvent = {
  match_id: number;
  minuto: number | null;
  periodo: string | null;
  tipo: string;
  time: string;
  jogador: string;
  detalhe: unknown;
};

export type StatsBombMatch = {
  match_id: number;
  time_casa: string;
  time_fora: string;
  data: string;
  competition: string;
};

let cachedCompetitions: unknown[] | null = null;

async function getCompetitions(): Promise<unknown[]> {
  if (cachedCompetitions) return cachedCompetitions;
  const r = await fetchWithTimeout(COMPETITIONS_URL, {}, 20000);
  if (!r.ok) throw new Error(`StatsBomb competitions HTTP ${r.status}`);
  cachedCompetitions = await r.json();
  return cachedCompetitions!;
}

/** Busca competicoes de Copa do Mundo disponiveis no open data. */
export async function findWorldCupCompetitions(): Promise<{ competition_id: number; season_id: number; name: string }[]> {
  const comps = await getCompetitions() as Record<string, unknown>[];
  return comps
    .filter(c => String(c.competition_name ?? "").toLowerCase().includes("world cup"))
    .map(c => ({
      competition_id: Number(c.competition_id),
      season_id: Number(c.season_id),
      name: String(c.competition_name ?? ""),
    }));
}

export async function fetchMatches(competitionId: number, seasonId: number): Promise<StatsBombMatch[]> {
  const url = `${MATCHES_BASE}/${competitionId}/${seasonId}.json`;
  log("INFO", "StatsBomb: buscando partidas", { url });
  const r = await fetchWithTimeout(url, {}, 25000);
  if (!r.ok) throw new Error(`StatsBomb matches HTTP ${r.status}`);
  const arr = await r.json();
  return (arr as Record<string, unknown>[]).map(m => ({
    match_id: Number(m.match_id ?? 0),
    time_casa: normalizeTeamName(String((m.home_team as Record<string, unknown>)?.home_team_name ?? "")),
    time_fora: normalizeTeamName(String((m.away_team as Record<string, unknown>)?.away_team_name ?? "")),
    data: String(m.match_date ?? ""),
    competition: String(m.competition?.competition_name ?? "World Cup"),
  }));
}

export async function fetchEvents(matchId: number): Promise<StatsBombEvent[]> {
  const url = `${EVENTS_BASE}/${matchId}.json`;
  const r = await fetchWithTimeout(url, {}, 30000);
  if (!r.ok) return [];
  const arr = await r.json();
  return (arr as Record<string, unknown>[]).slice(0, 500).map(ev => ({
    match_id: matchId,
    minuto: ev.minute != null ? Number(ev.minute) : null,
    periodo: ev.period != null ? String(ev.period) : null,
    tipo: String(ev.type?.name ?? ev.type ?? "event"),
    time: normalizeTeamName(String((ev.team as Record<string, unknown>)?.name ?? "")),
    jogador: String((ev.player as Record<string, unknown>)?.name ?? ""),
    detalhe: ev,
  }));
}

/** Sincroniza eventos taticos para jogos que casam por nomes dos times. */
export async function syncEventsForTeams(
  jogosDb: { id: string; time_casa: string; time_fora: string }[],
  maxMatches = 3,
): Promise<{ eventos: (StatsBombEvent & { jogo_id: string })[]; matchesFound: number }> {
  const eventos: (StatsBombEvent & { jogo_id: string })[] = [];
  let matchesFound = 0;

  try {
    const wcs = await findWorldCupCompetitions();
    if (!wcs.length) return { eventos, matchesFound: 0 };

    const latest = wcs[wcs.length - 1];
    const matches = await fetchMatches(latest.competition_id, latest.season_id);

    for (const jogo of jogosDb.slice(0, maxMatches)) {
      const match = matches.find(m =>
        (m.time_casa === jogo.time_casa && m.time_fora === jogo.time_fora) ||
        (m.time_casa === jogo.time_fora && m.time_fora === jogo.time_casa)
      );
      if (!match?.match_id) continue;
      matchesFound++;
      const evs = await fetchEvents(match.match_id);
      for (const ev of evs) {
        eventos.push({ ...ev, jogo_id: jogo.id });
      }
    }
  } catch (e) {
    log("WARN", "StatsBomb sync parcial", (e as Error).message);
  }

  return { eventos, matchesFound };
}
