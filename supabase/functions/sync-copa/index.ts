import { json, preflight } from "../_shared/cors.ts";
import { admin } from "../_shared/supabase.ts";
import {
  extractGrupoLetter, fetchWithTimeout, JogoSync, log,
  mapFase, mapStatus, normalizeTeamName,
} from "../_shared/fetch.ts";
import * as FootballData from "../_shared/apis/football-data.ts";
import * as ApiFootball from "../_shared/apis/api-football.ts";
import * as TheSportsDB from "../_shared/apis/thesportsdb.ts";
import * as StatsBomb from "../_shared/apis/statsbomb.ts";

const FALLBACK_URL = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

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

type Supa = ReturnType<typeof admin>;

async function logSync(
  supabase: Supa,
  fonte: string,
  status: string,
  registros: number,
  detalhes: unknown,
  duracao_ms: number,
) {
  await supabase.from("bolao_sync_log").insert({
    fonte, status, registros, detalhes, duracao_ms,
  });
}

async function fetchFallback(): Promise<JogoSync[]> {
  log("WARN", "Fallback GitHub worldcup.json");
  const r = await fetchWithTimeout(FALLBACK_URL, {}, 20000);
  if (!r.ok) throw new Error(`Fallback HTTP ${r.status}`);
  const data = await r.json();
  const out: JogoSync[] = [];
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
        fonte: "github-fallback",
      });
    }
  }
  return out;
}

async function upsertGruposEstaticos(supabase: Supa) {
  for (const [codigo, selecoes] of Object.entries(STATIC_GRUPOS)) {
    const { data: grp } = await supabase
      .from("bolao_grupos")
      .upsert({ codigo, nome: `Grupo ${codigo}` }, { onConflict: "codigo" })
      .select("id").single();
    if (!grp) continue;
    for (const nome of selecoes) {
      await supabase.from("bolao_selecoes")
        .upsert({ nome, grupo_id: grp.id }, { onConflict: "nome" });
    }
  }
}

async function upsertRodada(supabase: Supa, nome: string, fase: string, grupoId: string | null) {
  const { data } = await supabase
    .from("bolao_rodadas")
    .upsert({ nome, fase, grupo_id: grupoId }, { onConflict: "nome,fase" })
    .select("id").single();
  return data?.id ?? null;
}

async function persistJogos(supabase: Supa, jogos: JogoSync[]) {
  const grupoCache = new Map<string, string>();
  const rodadaCache = new Map<string, string>();
  const { data: grupos } = await supabase.from("bolao_grupos").select("id, codigo");
  for (const g of grupos ?? []) grupoCache.set(g.codigo, g.id);

  let upserts = 0;
  let errors = 0;

  for (const j of jogos) {
    try {
      const e_brasil = j.time_casa === "Brazil" || j.time_fora === "Brazil";
      const status = mapStatus(j.status_raw);
      const fase = mapFase(j.round);

      let grupoId: string | null = null;
      if (j.grupo) {
        if (!grupoCache.has(j.grupo)) {
          const { data: grp } = await supabase
            .from("bolao_grupos")
            .upsert({ codigo: j.grupo, nome: `Grupo ${j.grupo}` }, { onConflict: "codigo" })
            .select("id").single();
          if (grp) grupoCache.set(j.grupo, grp.id);
        }
        grupoId = grupoCache.get(j.grupo) ?? null;
      }

      for (const nome of [j.time_casa, j.time_fora]) {
        const payload: Record<string, unknown> = { nome };
        if (grupoId) payload.grupo_id = grupoId;
        await supabase.from("bolao_selecoes").upsert(payload, { onConflict: "nome" });
      }

      const rodadaKey = `${j.round}::${fase}`;
      if (!rodadaCache.has(rodadaKey)) {
        const rid = await upsertRodada(supabase, j.round, fase, grupoId);
        if (rid) rodadaCache.set(rodadaKey, rid);
      }

      let dataHora = j.data_hora;
      if (!dataHora.includes("T") && /^\d{4}-\d{2}-\d{2}$/.test(dataHora)) dataHora += "T18:00:00Z";

      const { error } = await supabase.from("bolao_jogos").upsert({
        api_jogo_id: j.api_jogo_id,
        api_football_id: j.api_football_id ?? null,
        time_casa: j.time_casa,
        time_fora: j.time_fora,
        placar_casa: j.placar_casa,
        placar_fora: j.placar_fora,
        placar_casa_ht: j.placar_casa_ht ?? null,
        placar_fora_ht: j.placar_fora_ht ?? null,
        minuto_jogo: j.minuto_jogo ?? null,
        e_brasil,
        fase,
        valor_entrada: e_brasil ? 10 : 5,
        status,
        data_hora: dataHora,
        estadio: j.stadium,
        grupo_id: grupoId,
        rodada_id: rodadaCache.get(rodadaKey) ?? null,
        fonte_sync: j.fonte,
      }, { onConflict: "api_jogo_id" });

      if (error) { errors++; continue; }
      upserts++;

      if (fase !== "grupos") {
        const { data: jogoDb } = await supabase.from("bolao_jogos").select("id")
          .eq("api_jogo_id", j.api_jogo_id).single();
        if (jogoDb) {
          const vencedor = j.placar_casa != null && j.placar_fora != null
            ? (j.placar_casa > j.placar_fora ? j.time_casa : j.time_fora) : null;
          await supabase.from("bolao_chaveamentos").upsert({
            fase, time1: j.time_casa, time2: j.time_fora,
            placar_time1: j.placar_casa, placar_time2: j.placar_fora,
            vencedor, jogo_id: jogoDb.id, data_hora: dataHora, estadio: j.stadium,
          }, { onConflict: "jogo_id" });
        }
      }
    } catch {
      errors++;
    }
  }
  return { upserts, errors };
}

async function persistStandings(supabase: Supa, rows: FootballData.StandingRow[]) {
  let n = 0;
  for (const row of rows) {
    const { data: grp } = await supabase.from("bolao_grupos").select("id").eq("codigo", row.grupo).single();
    const { data: sel } = await supabase.from("bolao_selecoes").select("id").eq("nome", row.time).single();
    if (!grp || !sel) continue;
    await supabase.from("bolao_classificacao_grupos").upsert({
      grupo_id: grp.id, selecao_id: sel.id,
      posicao: row.posicao, jogos: row.jogos, vitorias: row.vitorias,
      empates: row.empates, derrotas: row.derrotas,
      gols_pro: row.gols_pro, gols_contra: row.gols_contra,
      saldo: row.saldo, pontos: row.pontos,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "grupo_id,selecao_id" });
    n++;
  }
  return n;
}

async function persistSquads(supabase: Supa, players: FootballData.ElencoJogador[]) {
  let n = 0;
  for (const p of players) {
    if (!p.nome) continue;
    const { data: sel } = await supabase.from("bolao_selecoes").select("id").eq("nome", p.time).single();
    if (!sel) continue;
    await supabase.from("bolao_elenco").upsert({
      selecao_id: sel.id, jogador_nome: p.nome, posicao: p.posicao,
      numero_camisa: p.numero, nacionalidade: p.nacionalidade,
      data_nascimento: p.data_nascimento, fonte: "football-data",
      atualizado_em: new Date().toISOString(),
    }, { onConflict: "selecao_id,jogador_nome" });
    n++;
  }
  return n;
}

async function persistTheSportsDB(supabase: Supa, teams: TheSportsDB.TeamMedia[]) {
  let n = 0;
  for (const t of teams) {
    const { data: sel } = await supabase.from("bolao_selecoes").select("id").eq("nome", t.nome).single();
    if (!sel) continue;
    await supabase.from("bolao_selecoes").update({
      escudo_url: t.escudo_url, thesportsdb_id: t.thesportsdb_id,
      estadio: t.estadio, pais: t.pais, atualizado_em: new Date().toISOString(),
    }).eq("id", sel.id);

    for (const j of t.jogadores) {
      if (!j.nome) continue;
      await supabase.from("bolao_elenco").upsert({
        selecao_id: sel.id, jogador_nome: j.nome, posicao: j.posicao,
        numero_camisa: j.numero, foto_url: j.foto_url, fonte: "thesportsdb",
        atualizado_em: new Date().toISOString(),
      }, { onConflict: "selecao_id,jogador_nome" });
    }
    n++;
  }
  return n;
}

async function persistLiveStats(supabase: Supa, live: ApiFootball.LiveStats[]) {
  let n = 0;
  for (const lv of live) {
    let jogoId: string | null = null;
    const { data: j1 } = await supabase.from("bolao_jogos").select("id")
      .eq("time_casa", lv.time_casa).eq("time_fora", lv.time_fora).maybeSingle();
    if (j1) jogoId = j1.id;
    else {
      const { data: j2 } = await supabase.from("bolao_jogos").select("id")
        .eq("time_casa", lv.time_fora).eq("time_fora", lv.time_casa).maybeSingle();
      if (j2) jogoId = j2.id;
    }
    if (!jogoId) continue;
    const jogo = { id: jogoId };

    await supabase.from("bolao_jogos").update({
      placar_casa: lv.placar_casa, placar_fora: lv.placar_fora,
      placar_casa_ht: lv.placar_casa_ht, placar_fora_ht: lv.placar_fora_ht,
      minuto_jogo: lv.minuto_jogo, api_football_id: lv.api_football_id,
      status: mapStatus(lv.status_raw),
    }).eq("id", jogo.id);

    if (lv.estatisticas) {
      const s = lv.estatisticas;
      await supabase.from("bolao_jogo_estatisticas").upsert({
        jogo_id: jogo.id,
        posse_casa: s.posse_casa, posse_fora: s.posse_fora,
        chutes_casa: s.chutes_casa, chutes_fora: s.chutes_fora,
        chutes_gol_casa: s.chutes_gol_casa, chutes_gol_fora: s.chutes_gol_fora,
        escanteios_casa: s.escanteios_casa, escanteios_fora: s.escanteios_fora,
        faltas_casa: s.faltas_casa, faltas_fora: s.faltas_fora,
        cartoes_amarelos_casa: s.cartoes_amarelos_casa, cartoes_amarelos_fora: s.cartoes_amarelos_fora,
        cartoes_vermelhos_casa: s.cartoes_vermelhos_casa, cartoes_vermelhos_fora: s.cartoes_vermelhos_fora,
        dados_brutos: s.dados_brutos, atualizado_em: new Date().toISOString(),
      }, { onConflict: "jogo_id" });
    }

    for (const ev of lv.eventos) {
      await supabase.from("bolao_jogo_eventos").insert({
        jogo_id: jogo.id, minuto: ev.minuto, tipo: ev.tipo,
        time: ev.time, jogador: ev.jogador, detalhe: ev.detalhe, fonte: "api-football",
      });
    }
    n++;
  }
  return n;
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;
  const supabase = admin();
  const t0 = Date.now();
  const report: Record<string, unknown> = {};

  try {
    log("INFO", "=== Sync multi-API Copa 2026 ===");
    await upsertGruposEstaticos(supabase);

    // ---- 1. Football-Data.org (primario: jogos, tabelas, elencos) ----
    let jogos: JogoSync[] = [];
    let fonteJogos = "football-data";
    try {
      const t1 = Date.now();
      jogos = await FootballData.fetchMatches();
      await logSync(supabase, "football-data", "ok", jogos.length, { tipo: "matches" }, Date.now() - t1);
    } catch (e) {
      log("WARN", "Football-Data falhou", (e as Error).message);
      fonteJogos = "fallback";
      jogos = await fetchFallback();
    }

    // ---- 2. API-Football (complemento + ao vivo) ----
    let apiFootballCalls = 0;
    const { data: cfg } = await supabase.from("bolao_config").select("*").eq("id", 1).single();
    const hoje = new Date().toISOString().slice(0, 10);
    let chamadasHoje = cfg?.api_football_data === hoje ? (cfg?.api_football_chamadas_hoje ?? 0) : 0;

    if (ApiFootball.isConfigured() && ApiFootball.canCall(chamadasHoje, cfg?.api_football_data)) {
      try {
        const hasLive = jogos.some(j => mapStatus(j.status_raw) === "ao_vivo");
        if (hasLive) {
          const { live, callsUsed } = await ApiFootball.fetchLiveWithStats();
          apiFootballCalls += callsUsed;
          await persistLiveStats(supabase, live);
          jogos = ApiFootball.mergeLiveIntoJogos(jogos, live);
          report.api_football_live = live.length;
        }
      } catch (e) {
        log("WARN", "API-Football live", (e as Error).message);
      }
    }

    const { upserts, errors } = await persistJogos(supabase, jogos);
    report.jogos = { total: jogos.length, upserts, errors, fonte: fonteJogos };

    // ---- 3. Classificacao e elencos (Football-Data) ----
    try {
      const standings = await FootballData.fetchStandings();
      const nStand = await persistStandings(supabase, standings);
      report.standings = nStand;
      await logSync(supabase, "football-data", "ok", nStand, { tipo: "standings" }, 0);
    } catch (e) {
      log("WARN", "Standings", (e as Error).message);
    }

    try {
      const squads = await FootballData.fetchSquads();
      const nSq = await persistSquads(supabase, squads);
      report.squads = nSq;
      await logSync(supabase, "football-data", "ok", nSq, { tipo: "squads" }, 0);
    } catch (e) {
      log("WARN", "Squads", (e as Error).message);
    }

    // ---- 4. TheSportsDB (midia — a cada 6h ou se nunca sincronizou) ----
    const tsdbAge = cfg?.ultima_sync_thesportsdb
      ? Date.now() - new Date(cfg.ultima_sync_thesportsdb).getTime() : Infinity;
    if (tsdbAge > 6 * 3600000) {
      try {
        const { data: selecoes } = await supabase.from("bolao_selecoes").select("nome, escudo_url");
        const pendentes = (selecoes ?? [])
          .filter(s => !s.escudo_url)
          .map(s => s.nome);
        const todos = (selecoes ?? []).map(s => s.nome);
        const alvo = pendentes.length ? pendentes : todos;
        const { teams, errors: tsdbErr } = await TheSportsDB.enrichTeams(alvo, 8);
        const nTsdb = await persistTheSportsDB(supabase, teams);
        report.thesportsdb = { teams: nTsdb, errors: tsdbErr };
        await supabase.from("bolao_config").update({ ultima_sync_thesportsdb: new Date().toISOString() }).eq("id", 1);
      } catch (e) {
        log("WARN", "TheSportsDB", (e as Error).message);
      }
    }

    // ---- 5. StatsBomb (eventos taticos — a cada 12h) ----
    const sbAge = cfg?.ultima_sync_statsbomb
      ? Date.now() - new Date(cfg.ultima_sync_statsbomb).getTime() : Infinity;
    if (sbAge > 12 * 3600000) {
      try {
        const { data: jogosDb } = await supabase.from("bolao_jogos")
          .select("id, time_casa, time_fora").in("status", ["encerrado", "ao_vivo"]).limit(5);
        const { eventos, matchesFound } = await StatsBomb.syncEventsForTeams(jogosDb ?? [], 2);
        for (const ev of eventos.slice(0, 200)) {
          await supabase.from("bolao_jogo_eventos").insert({
            jogo_id: ev.jogo_id, minuto: ev.minuto, periodo: ev.periodo,
            tipo: ev.tipo, time: ev.time, jogador: ev.jogador,
            detalhe: ev.detalhe, fonte: "statsbomb",
          });
        }
        report.statsbomb = { matches: matchesFound, eventos: eventos.length };
        await supabase.from("bolao_config").update({ ultima_sync_statsbomb: new Date().toISOString() }).eq("id", 1);
      } catch (e) {
        log("WARN", "StatsBomb", (e as Error).message);
      }
    }

    // ---- Abertura finalistas ----
    const { data: oitavas } = await supabase.from("bolao_jogos").select("id").eq("fase", "oitavas").limit(1);
    if (oitavas?.length) {
      const { data: cfgFin } = await supabase.from("bolao_config_finalistas").select("status").eq("id", 1).single();
      if (cfgFin?.status === "fechada") {
        const { data: prox } = await supabase.from("bolao_jogos").select("data_hora")
          .eq("fase", "oitavas").order("data_hora").limit(1).single();
        await supabase.from("bolao_config_finalistas").update({
          status: "aberta", prazo_fim: prox?.data_hora,
        }).eq("id", 1);
      }
    }

    // ---- Atualizar config ----
    chamadasHoje += apiFootballCalls;
    await supabase.from("bolao_config").update({
      ultima_sync_api: new Date().toISOString(),
      total_jogos_api: jogos.length,
      api_football_chamadas_hoje: chamadasHoje,
      api_football_data: hoje,
      ultima_sync_api_football: apiFootballCalls ? new Date().toISOString() : cfg?.ultima_sync_api_football,
      atualizado_em: new Date().toISOString(),
    }).eq("id", 1);

    await logSync(supabase, "sync-copa", "ok", upserts, report, Date.now() - t0);

    // ---- Apuracao encadeada ----
    let apuracao: unknown = null;
    try {
      const baseUrl = Deno.env.get("SUPABASE_URL");
      if (baseUrl) {
        const res = await fetch(`${baseUrl}/functions/v1/apurar-jogo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ origem: "sync-copa" }),
        });
        apuracao = await res.json().catch(() => null);
      }
    } catch (e) {
      log("WARN", "Apuracao", (e as Error).message);
    }

    log("INFO", "Sync concluida", { ...report, duracao_ms: Date.now() - t0 });
    return json({ ok: true, ...report, apuracao, duracao_ms: Date.now() - t0 });
  } catch (e) {
    await logSync(supabase, "sync-copa", "error", 0, { error: (e as Error).message }, Date.now() - t0);
    log("ERROR", "Sync fatal", (e as Error).message);
    return json({ error: (e as Error).message }, 500);
  }
});
