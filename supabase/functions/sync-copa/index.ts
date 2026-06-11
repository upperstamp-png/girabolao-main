import { json, preflight } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";

// ====== CONSTANTES ======
const PRIMARY_URL = "https://api.football-data.org/v4/competitions/WC/matches";
const FALLBACK_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const TIMEOUT_MS = 30000;

const API_TOKEN = Deno.env.get("FOOTBALL_DATA_API_TOKEN") || "1e1c9809ca0f483980e91aac5cd134a3";

// Dados estáticos de emergência — grupos e seleções confirmados para Copa 2026
const STATIC_GRUPOS: Record<string, string[]> = {
  A: ["USA","Panama","Canada","Honduras"],
  B: ["Mexico","Jamaica","Uruguay","Bolivia"],
  C: ["Brazil","Argentina","Paraguay","Peru"],
  D: ["England","Nigeria","Serbia","France"],
  E: ["Germany","Netherlands","Spain","Portugal"],
  F: ["Colombia","Ecuador","Japan","Australia"],
  G: ["Morocco","Senegal","South Korea","Belgium"],
  H: ["Turkey","Croatia","Switzerland","Denmark"],
  I: ["Italy","Norway","Poland","New Zealand"],
  J: ["Iran","Saudi Arabia","South Africa","Egypt"],
  K: ["Algeria","Tunisia","Cameroon","Ghana"],
  L: ["Venezuela","Chile","Iraq","Qatar"],
};

// ====== TYPES ======
type Jogo = {
  api_jogo_id: number;
  time_casa: string;
  time_fora: string;
  placar_casa: number | null;
  placar_fora: number | null;
  status_raw: string;
  data_hora: string;
  round: string;
  stadium: string | null;
  grupo: string | null;
};

// ====== HELPERS ======
function log(level: "INFO" | "WARN" | "ERROR", msg: string, data?: unknown) {
  console.log(JSON.stringify({ level, ts: new Date().toISOString(), msg, ...(data ? { data } : {}) }));
}

function normalizeTeamName(name: string): string {
  const n = (name || "").trim();
  if (n === "United States") return "USA";
  if (n === "Brasil") return "Brazil";
  return n;
}

function mapStatus(s: string): string {
  const x = (s || "").toUpperCase();
  if (x === "FINISHED") return "encerrado";
  if (x === "LIVE" || x === "IN_PLAY" || x === "PAUSED") return "ao_vivo";
  return "pendente";
}

function mapStageToRound(stage: string, matchday: number): string {
  const s = (stage || "").toUpperCase();
  if (s === "GROUP_STAGE") return `Group Stage - Matchday ${matchday}`;
  if (s === "LAST_16" || s === "ROUND_OF_16") return "Round of 16";
  if (s === "QUARTER_FINALS") return "Quarter-finals";
  if (s === "SEMI_FINALS") return "Semi-finals";
  if (s === "THIRD_PLACE") return "Third place play-off";
  if (s === "FINAL") return "Final";
  return `Matchday ${matchday}`;
}

function mapFase(round: string): string {
  const r = (round || "").toLowerCase();
  if (r.includes("group") || r.includes("grupo") || r.includes("matchday") || r.includes("jornada")) return "grupos";
  if (r.includes("round of 16") || r.includes("oitava") || r.includes("16") || r.includes("last 16")) return "oitavas";
  if (r.includes("quarter") || r.includes("quarta") || r.includes("8")) return "quartas";
  if (r.includes("semi")) return "semis";
  if (r.includes("third") || r.includes("terceiro") || r.includes("3rd")) return "terceiro";
  if (r.includes("final")) return "final";
  return "grupos";
}

function extractGrupoLetter(groupStr: string | null | undefined): string | null {
  if (!groupStr) return null;
  const m = groupStr.match(/GROUP_([A-L])/i) || groupStr.match(/grupo\s*([A-L])/i);
  return m ? m[1].toUpperCase() : null;
}

async function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = TIMEOUT_MS): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// ====== PARSERS ======
async function fetchPrimary(): Promise<Jogo[]> {
  log("INFO", "Tentando API primária football-data.org", { url: PRIMARY_URL });
  const r = await fetchWithTimeout(PRIMARY_URL, {
    headers: {
      "X-Auth-Token": API_TOKEN,
      "Accept": "application/json"
    },
  });
  if (!r.ok) {
    const errText = await r.text().catch(() => "");
    throw new Error(`Primary HTTP ${r.status}: ${errText}`);
  }
  const data = await r.json();
  const arr: any[] = data.matches || [];
  if (!arr.length) throw new Error("Primary retornou array de jogos vazio");

  const jogos = arr.map((g: any): Jogo | null => {
    const id = Number(g.id ?? 0);
    const casa = normalizeTeamName(String(g.homeTeam?.name ?? g.homeTeam?.shortName ?? "").trim());
    const fora = normalizeTeamName(String(g.awayTeam?.name ?? g.awayTeam?.shortName ?? "").trim());
    const dataHora = g.utcDate;
    const stage = String(g.stage ?? "").trim();
    const matchday = Number(g.matchday ?? 1);
    
    if (!id || !casa || !fora || !dataHora) return null;
    
    const round = mapStageToRound(stage, matchday);
    
    return {
      api_jogo_id: id,
      time_casa: casa,
      time_fora: fora,
      placar_casa: g.score?.fullTime?.home ?? null,
      placar_fora: g.score?.fullTime?.away ?? null,
      status_raw: String(g.status ?? ""),
      data_hora: dataHora,
      round,
      stadium: g.venue ?? null,
      grupo: extractGrupoLetter(g.group),
    };
  }).filter((g): g is Jogo => g !== null);

  log("INFO", `API primária: ${jogos.length} jogos extraídos`);
  return jogos;
}

async function fetchFallback(): Promise<Jogo[]> {
  log("WARN", "Usando fallback GitHub", { url: FALLBACK_URL });
  const r = await fetchWithTimeout(FALLBACK_URL, {}, 20000);
  if (!r.ok) throw new Error(`Fallback HTTP ${r.status}`);
  const data = await r.json();
  const out: Jogo[] = [];
  let counter = 1000;
  for (const round of data.rounds || []) {
    for (const m of round.matches || []) {
      const casa = normalizeTeamName(m.team1?.name ?? m.team1 ?? "");
      const fora = normalizeTeamName(m.team2?.name ?? m.team2 ?? "");
      if (!casa || !fora) continue;
      out.push({
        api_jogo_id: m.num ?? counter++,
        time_casa: casa,
        time_fora: fora,
        placar_casa: m.score?.ft?.[0] ?? null,
        placar_fora: m.score?.ft?.[1] ?? null,
        status_raw: m.score?.ft ? "FINISHED" : "SCHEDULED",
        data_hora: `${m.date}T${m.time || "18:00"}:00Z`,
        round: round.name || "Group",
        stadium: m.stadium?.name ?? m.stadium ?? null,
        grupo: extractGrupoLetter(round.name || ""),
      });
    }
  }
  log("INFO", `Fallback: ${out.length} jogos extraídos`);
  return out;
}

// ====== PERSISTÊNCIA ======
async function upsertGruposESelecoes(supabase: ReturnType<typeof import("../_shared/supabase.ts").admin>) {
  log("INFO", "Sincronizando grupos e seleções estáticas");
  for (const [codigo, selecoes] of Object.entries(STATIC_GRUPOS)) {
    // Upsert grupo
    const { data: grp, error: grpErr } = await supabase
      .from("bolao_grupos")
      .upsert({ codigo, nome: `Grupo ${codigo}` }, { onConflict: "codigo" })
      .select("id")
      .single();
    if (grpErr) { log("ERROR", `Erro ao upsert grupo ${codigo}`, grpErr); continue; }

    // Upsert seleções do grupo
    for (const nome of selecoes) {
      const { error: selErr } = await supabase
        .from("bolao_selecoes")
        .upsert({ nome, grupo_id: grp!.id }, { onConflict: "nome" });
      if (selErr) log("WARN", `Erro ao upsert seleção ${nome}`, selErr);
    }
  }
  log("INFO", "Grupos e seleções sincronizados");
}

async function upsertRodada(
  supabase: ReturnType<typeof import("../_shared/supabase.ts").admin>,
  nome: string,
  fase: string,
  grupoId: string | null
): Promise<string | null> {
  const { data, error } = await supabase
    .from("bolao_rodadas")
    .upsert({ nome, fase, grupo_id: grupoId }, { onConflict: "nome,fase" })
    .select("id")
    .single();
  if (error) { log("WARN", `Erro ao upsert rodada ${nome}`, error); return null; }
  return data?.id ?? null;
}

// ====== HANDLER PRINCIPAL ======
Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const supabase = admin();

  try {
    log("INFO", "Iniciando sincronização da Copa 2026");

    // 1. Sincronizar grupos e seleções iniciais
    await upsertGruposESelecoes(supabase);

    // 2. Buscar jogos da API
    let jogos: Jogo[] = [];
    let fonte = "primary";
    try {
      jogos = await fetchPrimary();
    } catch (e) {
      log("WARN", "Falha na API primária, tentando fallback", { error: (e as Error).message });
      fonte = "fallback";
      try {
        jogos = await fetchFallback();
      } catch (e2) {
        log("ERROR", "Fallback também falhou", { error: (e2 as Error).message });
        // Retornar status sem crash — app continua funcionando com dados do banco
        return json({ ok: false, error: "APIs indisponíveis", fonte: "none", total: 0, upserts: 0 }, 503);
      }
    }

    // 3. Upsert jogos + rodadas + chaveamentos
    let upserts = 0;
    let errors = 0;
    const rodadaCache: Map<string, string> = new Map();
    const grupoCache: Map<string, string> = new Map();
    const upsertedTeams = new Set<string>();

    // Carregar grupos no cache
    const { data: grupos } = await supabase.from("bolao_grupos").select("id, codigo");
    for (const g of grupos ?? []) grupoCache.set(g.codigo, g.id);

    for (const j of jogos) {
      try {
        const e_brasil = j.time_casa === "Brazil" || j.time_fora === "Brazil" ||
          j.time_casa === "Brasil" || j.time_fora === "Brasil";
        const valor_entrada = e_brasil ? 10.00 : 5.00;
        const status = mapStatus(j.status_raw);
        const fase = mapFase(j.round);

        // Resolver grupo_id
        let grupoId: string | null = null;
        if (j.grupo) {
          if (!grupoCache.has(j.grupo)) {
            const { data: grp, error: grpErr } = await supabase
              .from("bolao_grupos")
              .upsert({ codigo: j.grupo, nome: `Grupo ${j.grupo}` }, { onConflict: "codigo" })
              .select("id")
              .single();
            if (!grpErr && grp) grupoCache.set(j.grupo, grp.id);
          }
          grupoId = grupoCache.get(j.grupo) ?? null;
        }

        // Sincronizar seleções dinamicamente do jogo
        if (j.time_casa && !upsertedTeams.has(`${j.time_casa}::${grupoId}`)) {
          const payload: any = { nome: j.time_casa };
          if (grupoId) payload.grupo_id = grupoId;
          await supabase.from("bolao_selecoes").upsert(payload, { onConflict: "nome" });
          upsertedTeams.add(`${j.time_casa}::${grupoId}`);
        }
        if (j.time_fora && !upsertedTeams.has(`${j.time_fora}::${grupoId}`)) {
          const payload: any = { nome: j.time_fora };
          if (grupoId) payload.grupo_id = grupoId;
          await supabase.from("bolao_selecoes").upsert(payload, { onConflict: "nome" });
          upsertedTeams.add(`${j.time_fora}::${grupoId}`);
        }

        // Resolver rodada_id
        const rodadaKey = `${j.round}::${fase}`;
        if (!rodadaCache.has(rodadaKey)) {
          const rid = await upsertRodada(supabase, j.round, fase, grupoId);
          if (rid) rodadaCache.set(rodadaKey, rid);
        }
        const rodadaId = rodadaCache.get(rodadaKey) ?? null;

        // Normalizar data_hora
        let dataHora = j.data_hora;
        if (!dataHora.includes("T") && dataHora.match(/^\d{4}-\d{2}-\d{2}$/)) {
          dataHora += "T18:00:00Z";
        }

        const row = {
          api_jogo_id: j.api_jogo_id,
          time_casa: j.time_casa,
          time_fora: j.time_fora,
          placar_casa: j.placar_casa,
          placar_fora: j.placar_fora,
          e_brasil,
          fase,
          valor_entrada,
          status,
          data_hora: dataHora,
          estadio: j.stadium ?? null,
          grupo_id: grupoId,
          rodada_id: rodadaId,
        };

        const { error } = await supabase
          .from("bolao_jogos")
          .upsert(row, { onConflict: "api_jogo_id" });

        if (error) {
          log("ERROR", `Erro ao upsert jogo ${j.api_jogo_id}`, error);
          errors++;
        } else {
          upserts++;

          // Upsert chaveamento para mata-mata
          if (fase !== "grupos") {
            const { data: jogoDb } = await supabase
              .from("bolao_jogos")
              .select("id")
              .eq("api_jogo_id", j.api_jogo_id)
              .single();

            if (jogoDb) {
              const vencedor = j.placar_casa != null && j.placar_fora != null
                ? (j.placar_casa > j.placar_fora ? j.time_casa : j.time_fora)
                : null;

              await supabase.from("bolao_chaveamentos").upsert({
                fase,
                time1: j.time_casa,
                time2: j.time_fora,
                placar_time1: j.placar_casa,
                placar_time2: j.placar_fora,
                vencedor,
                jogo_id: jogoDb.id,
                data_hora: dataHora,
                estadio: j.stadium ?? null,
              }, { onConflict: "jogo_id" });
            }
          }
        }
      } catch (err) {
        log("ERROR", `Exceção no jogo ${j.api_jogo_id}`, (err as Error).message);
        errors++;
      }
    }

    // 4. Abertura automática apostas finalistas quando há oitavas
    try {
      const { data: oitavas } = await supabase
        .from("bolao_jogos")
        .select("id")
        .eq("fase", "oitavas")
        .limit(1);
      if (oitavas && oitavas.length > 0) {
        const { data: cfg } = await supabase
          .from("bolao_config_finalistas")
          .select("status")
          .eq("id", 1)
          .single();
        if (cfg?.status === "fechada") {
          const { data: prox } = await supabase
            .from("bolao_jogos")
            .select("data_hora")
            .eq("fase", "oitavas")
            .order("data_hora")
            .limit(1)
            .single();
          await supabase.from("bolao_config_finalistas").update({
            status: "aberta",
            prazo_fim: prox?.data_hora,
          }).eq("id", 1);
          log("INFO", "Apostas de finalistas abertas automaticamente");
        }
      }
    } catch (e) {
      log("WARN", "Erro ao verificar oitavas", (e as Error).message);
    }

    // 5. Atualizar config com timestamp da última sync
    await supabase.from("bolao_config").update({
      ultima_sync_api: new Date().toISOString(),
      total_jogos_api: jogos.length,
    }).eq("id", 1);

    log("INFO", "Sincronização concluída", { total: jogos.length, upserts, errors, fonte });
    // O cron chama apenas esta function; por isso a apuracao fica encadeada aqui.
    let apuracao: unknown = null;
    try {
      const baseUrl = Deno.env.get("SUPABASE_URL");
      if (!baseUrl) throw new Error("SUPABASE_URL nao configurada");

      const res = await fetch(`${baseUrl}/functions/v1/apurar-jogo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origem: "sync-copa" }),
      });
      apuracao = await res.json().catch(() => null);
      if (!res.ok) {
        log("WARN", "Apuracao automatica retornou erro", { status: res.status, apuracao });
      } else {
        log("INFO", "Apuracao automatica concluida", apuracao);
      }
    } catch (e) {
      log("WARN", "Nao foi possivel executar apuracao automatica", (e as Error).message);
    }

    return json({ ok: true, total: jogos.length, upserts, errors, fonte, apuracao });
  } catch (e) {
    log("ERROR", "Erro fatal na sincronização", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
