import { fetchWithTimeout, JogoSync, log, mapStatus, normalizeTeamName } from "../fetch.ts";

const BASE = "https://v3.football.api-sports.io";
const KEY = Deno.env.get("API_FOOTBALL_KEY") || "";
const WC_LEAGUE = 1;
const WC_SEASON = 2026;
const DAILY_LIMIT = 95;

export type LiveStats = {
  api_football_id: number;
  api_jogo_id?: number;
  time_casa: string;
  time_fora: string;
  placar_casa: number | null;
  placar_fora: number | null;
  placar_casa_ht: number | null;
  placar_fora_ht: number | null;
  minuto_jogo: number | null;
  status_raw: string;
  estatisticas: {
    posse_casa: number | null;
    posse_fora: number | null;
    chutes_casa: number;
    chutes_fora: number;
    chutes_gol_casa: number;
    chutes_gol_fora: number;
    escanteios_casa: number;
    escanteios_fora: number;
    faltas_casa: number;
    faltas_fora: number;
    cartoes_amarelos_casa: number;
    cartoes_amarelos_fora: number;
    cartoes_vermelhos_casa: number;
    cartoes_vermelhos_fora: number;
    dados_brutos: unknown;
  } | null;
  eventos: {
    minuto: number | null;
    tipo: string;
    time: string;
    jogador: string;
    detalhe: unknown;
  }[];
};

function headers() {
  return { "x-apisports-key": KEY, Accept: "application/json" };
}

export function isConfigured(): boolean {
  return KEY.length > 10;
}

export function canCall(chamadasHoje: number, dataRef: string | null): boolean {
  const hoje = new Date().toISOString().slice(0, 10);
  if (dataRef !== hoje) return true;
  return chamadasHoje < DAILY_LIMIT;
}

function statVal(stats: unknown[], type: string): number {
  const row = (stats as { type?: string; value?: number | string }[]).find((s) => s.type === type);
  if (!row?.value) return 0;
  const v = String(row.value).replace("%", "");
  return Number(v) || 0;
}

export async function fetchFixturesSeason(): Promise<JogoSync[]> {
  if (!isConfigured()) return [];
  const url = `${BASE}/fixtures?league=${WC_LEAGUE}&season=${WC_SEASON}`;
  log("INFO", "API-Football: fixtures temporada");
  const r = await fetchWithTimeout(url, { headers: headers() });
  if (!r.ok) throw new Error(`API-Football fixtures HTTP ${r.status}`);
  const data = await r.json();
  const arr = data.response || [];
  return arr
    .map((item: Record<string, unknown>): JogoSync | null => {
      const fix = item.fixture as Record<string, unknown>;
      const teams = item.teams as Record<string, Record<string, unknown>>;
      const goals = item.goals as Record<string, unknown>;
      const score = item.score as Record<string, Record<string, unknown>>;
      const league = item.league as Record<string, unknown>;
      const id = Number(fix?.id ?? 0);
      const casa = normalizeTeamName(String(teams?.home?.name ?? ""));
      const fora = normalizeTeamName(String(teams?.away?.name ?? ""));
      if (!id || !casa || !fora) return null;
      const status = fix?.status as Record<string, unknown> | undefined;
      return {
        api_jogo_id: id + 900000,
        api_football_id: id,
        time_casa: casa,
        time_fora: fora,
        placar_casa: goals?.home != null ? Number(goals.home) : null,
        placar_fora: goals?.away != null ? Number(goals.away) : null,
        placar_casa_ht: score?.halftime?.home != null ? Number(score.halftime.home) : null,
        placar_fora_ht: score?.halftime?.away != null ? Number(score.halftime.away) : null,
        minuto_jogo: status?.elapsed != null ? Number(status.elapsed) : null,
        status_raw: String(status?.short ?? status?.long ?? ""),
        data_hora: String(fix?.date ?? ""),
        round: String(league?.round ?? "Group"),
        stadium: (fix?.venue as Record<string, unknown>)?.name
          ? String((fix!.venue as Record<string, unknown>).name)
          : null,
        grupo: null,
        fonte: "api-football",
      };
    })
    .filter((j): j is JogoSync => j !== null);
}

/** 1 chamada: todos os jogos ao vivo + stats (economiza quota de 100/dia). */
export async function fetchLiveWithStats(): Promise<{ live: LiveStats[]; callsUsed: number }> {
  if (!isConfigured()) return { live: [], callsUsed: 0 };

  const url = `${BASE}/fixtures?live=all`;
  const r = await fetchWithTimeout(url, { headers: headers() });
  let callsUsed = 1;
  if (!r.ok) throw new Error(`API-Football live HTTP ${r.status}`);
  const data = await r.json();
  const fixtures = (data.response || []) as Record<string, unknown>[];

  const wcLive = fixtures.filter((item) => {
    const league = item.league as Record<string, unknown> | undefined;
    return (
      Number(league?.id) === WC_LEAGUE ||
      String(league?.name ?? "")
        .toLowerCase()
        .includes("world cup")
    );
  });

  const live: LiveStats[] = [];
  for (const item of wcLive) {
    const fix = item.fixture as Record<string, unknown>;
    const teams = item.teams as Record<string, Record<string, unknown>>;
    const goals = item.goals as Record<string, unknown>;
    const score = item.score as Record<string, Record<string, unknown>>;
    const status = fix?.status as Record<string, unknown> | undefined;
    const fixtureId = Number(fix?.id ?? 0);
    const casa = normalizeTeamName(String(teams?.home?.name ?? ""));
    const fora = normalizeTeamName(String(teams?.away?.name ?? ""));

    let estatisticas: LiveStats["estatisticas"] = null;
    const events: LiveStats["eventos"] = [];

    if (fixtureId && callsUsed < 4) {
      try {
        const statsUrl = `${BASE}/fixtures/statistics?fixture=${fixtureId}`;
        const sr = await fetchWithTimeout(statsUrl, { headers: headers() });
        callsUsed++;
        if (sr.ok) {
          const sd = await sr.json();
          const teamsStats = (sd.response || []) as Record<string, unknown>[];
          const homeStats = (teamsStats[0]?.statistics || []) as unknown[];
          const awayStats = (teamsStats[1]?.statistics || []) as unknown[];
          estatisticas = {
            posse_casa: statVal(homeStats, "Ball Possession"),
            posse_fora: statVal(awayStats, "Ball Possession"),
            chutes_casa: statVal(homeStats, "Total Shots"),
            chutes_fora: statVal(awayStats, "Total Shots"),
            chutes_gol_casa: statVal(homeStats, "Shots on Goal"),
            chutes_gol_fora: statVal(awayStats, "Shots on Goal"),
            escanteios_casa: statVal(homeStats, "Corner Kicks"),
            escanteios_fora: statVal(awayStats, "Corner Kicks"),
            faltas_casa: statVal(homeStats, "Fouls"),
            faltas_fora: statVal(awayStats, "Fouls"),
            cartoes_amarelos_casa: statVal(homeStats, "Yellow Cards"),
            cartoes_amarelos_fora: statVal(awayStats, "Yellow Cards"),
            cartoes_vermelhos_casa: statVal(homeStats, "Red Cards"),
            cartoes_vermelhos_fora: statVal(awayStats, "Red Cards"),
            dados_brutos: teamsStats,
          };
        }
      } catch (e) {
        log("WARN", "API-Football stats falhou", (e as Error).message);
      }
    }

    const evUrl = `${BASE}/fixtures/events?fixture=${fixtureId}`;
    if (fixtureId && callsUsed < 6) {
      try {
        const er = await fetchWithTimeout(evUrl, { headers: headers() });
        callsUsed++;
        if (er.ok) {
          const ed = await er.json();
          for (const ev of ed.response || []) {
            events.push({
              minuto: ev.time?.elapsed != null ? Number(ev.time.elapsed) : null,
              tipo: String(ev.type ?? "Event"),
              time: normalizeTeamName(String(ev.team?.name ?? "")),
              jogador: String(ev.player?.name ?? ev.assist?.name ?? ""),
              detalhe: ev,
            });
          }
        }
      } catch {
        /* ignore */
      }
    }

    live.push({
      api_football_id: fixtureId,
      time_casa: casa,
      time_fora: fora,
      placar_casa: goals?.home != null ? Number(goals.home) : null,
      placar_fora: goals?.away != null ? Number(goals.away) : null,
      placar_casa_ht: score?.halftime?.home != null ? Number(score.halftime.home) : null,
      placar_fora_ht: score?.halftime?.away != null ? Number(score.halftime.away) : null,
      minuto_jogo: status?.elapsed != null ? Number(status.elapsed) : null,
      status_raw: String(status?.short ?? "LIVE"),
      estatisticas,
      eventos: events,
    });
  }

  return { live, callsUsed };
}

export function mergeLiveIntoJogos(jogos: JogoSync[], live: LiveStats[]): JogoSync[] {
  if (!live.length) return jogos;
  const byTeams = new Map(live.map((l) => [`${l.time_casa}::${l.time_fora}`, l]));
  return jogos.map((j) => {
    const key = `${j.time_casa}::${j.time_fora}`;
    const lv = byTeams.get(key);
    if (!lv) return j;
    return {
      ...j,
      placar_casa: lv.placar_casa ?? j.placar_casa,
      placar_fora: lv.placar_fora ?? j.placar_fora,
      placar_casa_ht: lv.placar_casa_ht ?? j.placar_casa_ht,
      placar_fora_ht: lv.placar_fora_ht ?? j.placar_fora_ht,
      minuto_jogo: lv.minuto_jogo ?? j.minuto_jogo,
      api_football_id: lv.api_football_id,
      status_raw: lv.status_raw || j.status_raw,
      fonte: j.fonte + "+api-football-live",
    };
  });
}
