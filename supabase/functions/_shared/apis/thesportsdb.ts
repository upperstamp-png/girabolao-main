import { fetchWithTimeout, log, normalizeTeamName } from "../fetch.ts";

const BASE = "https://www.thesportsdb.com/api/v1/json/3";

export type TeamMedia = {
  nome: string;
  thesportsdb_id: string;
  escudo_url: string | null;
  estadio: string | null;
  pais: string | null;
  jogadores: {
    nome: string;
    posicao: string | null;
    foto_url: string | null;
    numero: number | null;
  }[];
};

const TEAM_ALIASES: Record<string, string> = {
  USA: "United States",
  Brazil: "Brazil",
  "South Korea": "South Korea",
  England: "England",
};

export async function searchTeam(nome: string): Promise<TeamMedia | null> {
  const query = TEAM_ALIASES[nome] || nome;
  const url = `${BASE}/searchteams.php?t=${encodeURIComponent(query)}`;
  const r = await fetchWithTimeout(url, {}, 15000);
  if (!r.ok) return null;
  const data = await r.json();
  const team = data.teams?.[0];
  if (!team) return null;

  const teamId = String(team.idTeam ?? "");
  const jogadores: TeamMedia["jogadores"] = [];

  if (teamId) {
    try {
      const pr = await fetchWithTimeout(`${BASE}/lookup_all_players.php?id=${teamId}`, {}, 15000);
      if (pr.ok) {
        const pd = await pr.json();
        for (const p of pd.player || []) {
          jogadores.push({
            nome: String(p.strPlayer ?? ""),
            posicao: p.strPosition ? String(p.strPosition) : null,
            foto_url: p.strCutout || p.strThumb ? String(p.strCutout || p.strThumb) : null,
            numero: p.strNumber ? Number(p.strNumber) : null,
          });
        }
      }
    } catch {
      /* ignore */
    }
  }

  return {
    nome: normalizeTeamName(nome),
    thesportsdb_id: teamId,
    escudo_url: team.strTeamBadge
      ? String(team.strTeamBadge)
      : team.strBadge
        ? String(team.strBadge)
        : null,
    estadio: team.strStadium ? String(team.strStadium) : null,
    pais: team.strCountry ? String(team.strCountry) : null,
    jogadores,
  };
}

/** Enriquece ate N selecoes por sync (evita flood). */
export async function enrichTeams(
  nomes: string[],
  maxPerSync = 8,
): Promise<{ teams: TeamMedia[]; errors: string[] }> {
  const teams: TeamMedia[] = [];
  const errors: string[] = [];
  const slice = nomes.slice(0, maxPerSync);
  log("INFO", "TheSportsDB: enriquecendo selecoes", { total: slice.length });
  for (const nome of slice) {
    try {
      await new Promise((r) => setTimeout(r, 300));
      const t = await searchTeam(nome);
      if (t) teams.push(t);
    } catch (e) {
      errors.push(`${nome}: ${(e as Error).message}`);
    }
  }
  return { teams, errors };
}
