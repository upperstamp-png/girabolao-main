import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { supabase, flag, FASES_LABEL, getIdentidade, calcularPontosPalpite } from "@/lib/bolao";
import { POLL } from "@/lib/realtime";
import { EnableWebPushBanner } from "@/components/notifications/EnableWebPushBanner";
import { GoalToastContainer } from "@/components/GoalToast";
import {
  detectGoals,
  markInitialLoadDone,
  playGoalSound,
  vibrateOnGoal,
  type GoalEvent,
} from "@/lib/goalEvents";
import {
  ExternalLink,
  ChevronRight,
  Pencil,
  CheckCircle2,
  Zap,
  ListChecks,
  Newspaper,
  Timer,
  Users,
  BarChart2,
  Star,
  Trophy,
  Megaphone,
  Play,
  Tv2,
} from "lucide-react";
import { SkeletonCard } from "@/components/SkeletonCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bolão Copa do Mundo 2026" },
      { name: "description", content: "Painel principal do bolão da Copa 2026." },
    ],
  }),
  component: Index,
});

// ─────────────────────────────────────────────────────────────────────────────
// YouTube Live Player
// Incorpora o player diretamente na página para reprodução in-app.
// ─────────────────────────────────────────────────────────────────────────────
const YT_CHANNEL_HANDLE = "CazeTV";
const YT_LIVE_URL = `https://www.youtube.com/@${YT_CHANNEL_HANDLE}/live`;

function YouTubePlayer({
  liveGame,
  homeFlash,
  awayFlash,
}: {
  liveGame: any;
  homeFlash: boolean;
  awayFlash: boolean;
}) {
  if (!liveGame) return null;

  return (
    <a
      href={YT_LIVE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block w-full overflow-hidden cursor-pointer group bg-zinc-950 border border-zinc-800 rounded-2xl hover:border-red-500/50 hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] transition-all duration-300"
      aria-label={`Assistir ao vivo: ${liveGame.time_casa} vs ${liveGame.time_fora}`}
    >
      {/* Stadium Pitch styling/glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />
      <div className="absolute -inset-px bg-gradient-to-r from-red-500/0 via-red-500/10 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Main Grid content */}
      <div className="relative z-10 flex flex-col items-center justify-between p-5 sm:p-7 min-h-[170px] sm:min-h-[200px]">
        {/* Top: live indicator and minute */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-1.5 bg-red-600/10 px-2.5 py-1 rounded-full border border-red-500/30">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-500 text-[10px] font-bold uppercase tracking-widest">TRANSMISSÃO AO VIVO</span>
          </div>
          {liveGame.minuto_jogo != null && (
            <div className="flex items-center gap-1 bg-zinc-900/80 px-2.5 py-1 rounded-full border border-zinc-800 font-mono text-[11px] text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-ping" />
              <span>{liveGame.minuto_jogo}'</span>
            </div>
          )}
        </div>

        {/* Central Match scoreboard info */}
        <div className="flex w-full items-center justify-around my-3 gap-2">
          {/* Team A */}
          <div className="flex flex-col items-center gap-2 flex-1 text-center max-w-[38%]">
            <span className="text-4xl sm:text-5xl transition-transform duration-300 group-hover:scale-110 drop-shadow-md select-none">
              {flag(liveGame.time_casa)}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate w-full">
              {liveGame.time_casa}
            </span>
          </div>

          {/* Central Scoreboard with Play icon */}
          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="flex items-center gap-3 bg-zinc-900/70 border border-zinc-800/80 px-4.5 py-2 rounded-xl backdrop-blur-md shadow-inner">
              <span className={`font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${homeFlash ? "score-goal-flash inline-block" : "inline-block"}`}>
                {liveGame.placar_casa ?? 0}
              </span>
              <span className="text-zinc-500 text-base font-semibold select-none">:</span>
              <span className={`font-mono text-2xl sm:text-3xl font-extrabold text-white tracking-tight tabular-nums drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] ${awayFlash ? "score-goal-flash inline-block" : "inline-block"}`}>
                {liveGame.placar_fora ?? 0}
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-zinc-400 group-hover:text-red-500 transition-colors duration-300">
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-red-600 group-hover:border-red-500 transition-all duration-300 shadow-md">
                <Play className="h-3 w-3 text-zinc-300 fill-zinc-300 group-hover:text-white group-hover:fill-white ml-0.5 transition-colors" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider">ASSISTIR JOGO</span>
            </div>
          </div>

          {/* Team B */}
          <div className="flex flex-col items-center gap-2 flex-1 text-center max-w-[38%]">
            <span className="text-4xl sm:text-5xl transition-transform duration-300 group-hover:scale-110 drop-shadow-md select-none">
              {flag(liveGame.time_fora)}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white tracking-wide truncate w-full">
              {liveGame.time_fora}
            </span>
          </div>
        </div>

        {/* Bottom: channel info & watch trigger */}
        <div className="text-[10px] text-zinc-500 flex items-center justify-between w-full border-t border-zinc-900/60 pt-2.5">
          <span className="truncate max-w-[180px]">{liveGame.estadio ?? "Estádio a confirmar"}</span>
          <span className="font-semibold text-zinc-400 group-hover:text-white transition-colors flex items-center gap-1">
            CazéTV ao vivo <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown Timer — 3 blocos h:m:s
// ─────────────────────────────────────────────────────────────────────────────
function CountdownTimer({ date }: { date: string }) {
  const [t, setT] = useState<{ h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const target = new Date(date).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      if (diff === 0) {
        setT(null);
        return;
      }
      setT({
        h: Math.floor(diff / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [date]);

  if (!t)
    return (
      <span className="font-mono text-xs text-primary font-bold uppercase tracking-wide">
        Em andamento
      </span>
    );

  const pad = (n: number) => String(n).padStart(2, "0");
  const blocks = [
    { val: t.h, label: "h" },
    { val: t.m, label: "min" },
    { val: t.s, label: "seg" },
  ];

  return (
    <div className="flex items-end gap-0.5">
      {blocks.map(({ val, label }, i) => (
        <div key={label} className="flex items-end gap-0.5">
          {i > 0 && <span className="text-muted-foreground text-sm font-mono mb-3 mx-0.5">:</span>}
          <div className="flex flex-col items-center">
            <div className="font-mono text-lg font-bold text-foreground bg-secondary/40 border border-border rounded-md px-2 py-0.5 min-w-[34px] text-center tabular-nums">
              {pad(val)}
            </div>
            <span className="text-[9px] text-muted-foreground uppercase mt-0.5">{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section heading
// ─────────────────────────────────────────────────────────────────────────────
function SectionHeading({
  icon,
  label,
  to,
}: {
  icon: React.ReactNode;
  label: string;
  to?: string;
}) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-display text-[15px] uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </h2>
      {to && (
        <Link
          to={to}
          className="flex items-center gap-0.5 text-xs text-primary hover:underline font-semibold"
        >
          Ver tudo <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Index Component
// ─────────────────────────────────────────────────────────────────────────────
function Index() {
  const identidade = getIdentidade();
  const queryClient = useQueryClient();

  // ── Goal Events State ────────────────────────────────────────────────────
  const [goalEvents, setGoalEvents] = useState<GoalEvent[]>([]);
  const [homeFlash, setHomeFlash] = useState(false);
  const [awayFlash, setAwayFlash] = useState(false);
  const initialLoadRef = useRef(false);

  const dismissGoal = useCallback((ts: number) => {
    setGoalEvents((prev) => prev.filter((e) => e.timestamp !== ts));
  }, []);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: aoVivo } = useQuery({
    queryKey: ["jogos-ao-vivo"],
    queryFn: async () =>
      (await supabase.from("bolao_jogos").select("*").eq("status", "ao_vivo").order("data_hora"))
        .data ?? [],
    refetchInterval: POLL.LIVE,
  });

  const { data: proximos } = useQuery({
    queryKey: ["proximos"],
    queryFn: async () =>
      (
        await supabase
          .from("bolao_jogos")
          .select("*")
          .gte("data_hora", new Date().toISOString())
          .order("data_hora")
          .limit(1)
      ).data ?? [],
    refetchInterval: POLL.NORMAL,
  });

  const { data: usuarios } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () =>
      (
        await supabase
          .from("bolao_usuarios")
          .select("id, nome")
          .eq("excluido_manualmente", false)
          .order("nome")
      ).data ?? [],
  });

  const { data: jogos } = useQuery({
    queryKey: ["jogos-all-ranking"],
    queryFn: async () =>
      (await supabase.from("bolao_jogos").select("id, placar_casa, placar_fora")).data ?? [],
    refetchInterval: POLL.NORMAL,
  });

  const { data: palpites } = useQuery({
    queryKey: ["palpites-publicos-all"],
    queryFn: async () => (await supabase.from("bolao_palpites_publica").select("*")).data ?? [],
    refetchInterval: 30000,
  });

  const { data: apostasArt } = useQuery({
    queryKey: ["art-publicos-all"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_artilheiro_publica").select("usuario_id, acertou"))
        .data ?? [],
  });
  const { data: apostasCam } = useQuery({
    queryKey: ["cam-publicos-all"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_campeao_publica").select("usuario_id, acertou")).data ??
      [],
  });
  const { data: apostasFin } = useQuery({
    queryKey: ["fin-publicos-all"],
    queryFn: async () =>
      (
        await supabase
          .from("bolao_apostas_finalistas_publica")
          .select("usuario_id, acertou_os_dois, acertou_um")
      ).data ?? [],
  });
  const { data: apostasZeb } = useQuery({
    queryKey: ["zeb-publicos-all"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_zebra_publica").select("usuario_id, acertou")).data ?? [],
  });
  const { data: apostasGol } = useQuery({
    queryKey: ["gol-publicos-all"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_goleada_publica").select("usuario_id, acertou")).data ??
      [],
  });

  const { data: noticias } = useQuery({
    queryKey: ["noticias"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bolao_noticias")
        .select("id, titulo, resumo, imagem_url, link, publicado_em, fonte")
        .order("publicado_em", { ascending: false });
      return data ?? [];
    },
    staleTime: 60000,
  });

  const { data: broadcasts } = useQuery({
    queryKey: ["broadcasts"],
    queryFn: async () =>
      (
        await supabase
          .from("bolao_broadcasts")
          .select("*")
          .eq("ativo", true)
          .order("criado_em", { ascending: false })
      ).data ?? [],
    refetchInterval: 30000,
  });

  // ── Computed ranking ──────────────────────────────────────────────────────
  const rankingData = useMemo(() => {
    if (!usuarios) return [];
    const gamesMap = new Map((jogos ?? []).map((g) => [g.id, g]));
    return usuarios
      .map((u) => {
        let pontos = 0;
        const uPalpites = (palpites ?? []).filter((p) => p.usuario_id === u.id);
        for (const p of uPalpites) {
          const g = gamesMap.get(p.jogo_id);
          if (g && g.placar_casa != null && g.placar_fora != null) {
            const rC: number = g.placar_casa;
            const rF: number = g.placar_fora;
            pontos += calcularPontosPalpite(p.gols_casa, p.gols_fora, rC, rF).pontos;
          }
        }
        if (!!(apostasArt ?? []).find((a) => a.usuario_id === u.id)?.acertou) pontos += 10;
        const fin = (apostasFin ?? []).find((a) => a.usuario_id === u.id);
        if (fin) {
          if (fin.acertou_os_dois) pontos += 10;
          else if (fin.acertou_um) pontos += 5;
        }
        if (!!(apostasCam ?? []).find((c) => c.usuario_id === u.id)?.acertou) pontos += 10;
        if (!!(apostasZeb ?? []).find((z) => z.usuario_id === u.id)?.acertou) pontos += 10;
        if (!!(apostasGol ?? []).find((g) => g.usuario_id === u.id)?.acertou) pontos += 10;
        return { ...u, pontos };
      })
      .sort((a, b) => b.pontos - a.pontos || a.nome.localeCompare(b.nome));
  }, [usuarios, palpites, jogos, apostasArt, apostasFin, apostasCam, apostasZeb, apostasGol]);

  const myRankIdx = useMemo(
    () => (identidade?.id ? rankingData.findIndex((r) => r.id === identidade.id) : -1),
    [rankingData, identidade],
  );
  const myScore = myRankIdx >= 0 ? rankingData[myRankIdx].pontos : 0;
  const myRank = myRankIdx >= 0 ? myRankIdx + 1 : null;

  // Next game
  const nextGame = proximos?.[0] ?? null;

  // User palpite for next game
  const userPalpiteNext = useMemo(() => {
    if (!nextGame || !identidade?.id || !palpites) return null;
    return (
      palpites.find((p) => p.jogo_id === nextGame.id && p.usuario_id === identidade.id) ?? null
    );
  }, [nextGame, identidade, palpites]);

  // Live game
  const liveGame = (aoVivo?.length ?? 0) > 0 ? aoVivo![0] : null;

  // ── Supabase Realtime subscription for live games ──────────────────────
  useEffect(() => {
    // Mark initial load after first data fetch completes
    if (jogos && aoVivo && !initialLoadRef.current) {
      // Seed the score cache with current scores for all games without triggering toasts
      for (const g of jogos) {
        detectGoals({
          id: g.id,
          placar_casa: g.placar_casa,
          placar_fora: g.placar_fora,
          time_casa: "",
          time_fora: "",
          minuto_jogo: null,
        });
      }
      // Also seed live games just in case (to have team names / details)
      for (const g of aoVivo) {
        detectGoals(g);
      }
      markInitialLoadDone();
      initialLoadRef.current = true;
    }
  }, [jogos, aoVivo]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const channel = supabase
      .channel("live-scores-home")
      .on(
        "postgres_changes" as any,
        {
          event: "UPDATE",
          schema: "public",
          table: "bolao_jogos",
        },
        (payload: any) => {
          const row = payload.new;
          if (!row) return;

          // Invalidate query cache so UI re-renders with fresh data
          queryClient.invalidateQueries({ queryKey: ["jogos-ao-vivo"] });
          queryClient.invalidateQueries({ queryKey: ["jogos-all-ranking"] });

          // Detect goals
          if (row.status === "ao_vivo" && initialLoadRef.current) {
            const goals = detectGoals({
              id: row.id,
              placar_casa: row.placar_casa,
              placar_fora: row.placar_fora,
              time_casa: row.time_casa,
              time_fora: row.time_fora,
              minuto_jogo: row.minuto_jogo,
            });

            if (goals.length > 0) {
              // Sound + vibration
              playGoalSound();
              vibrateOnGoal();

              // Flash score animation
              for (const g of goals) {
                if (g.side === "home") {
                  setHomeFlash(true);
                  setTimeout(() => setHomeFlash(false), 1000);
                } else {
                  setAwayFlash(true);
                  setTimeout(() => setAwayFlash(false), 1000);
                }
              }

              // Add to toast queue
              setGoalEvents((prev) => [...prev, ...goals]);
            }
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // ── Also detect goals from polling fallback ──────────────────────────────
  const prevAoVivoRef = useRef<string>("");
  useEffect(() => {
    if (!aoVivo || !initialLoadRef.current) return;
    const key = JSON.stringify(
      aoVivo.map((g: any) => ({ id: g.id, h: g.placar_casa, a: g.placar_fora })),
    );
    if (key === prevAoVivoRef.current) return;
    prevAoVivoRef.current = key;

    for (const g of aoVivo) {
      const goals = detectGoals(g);
      if (goals.length > 0) {
        playGoalSound();
        vibrateOnGoal();
        for (const gl of goals) {
          if (gl.side === "home") {
            setHomeFlash(true);
            setTimeout(() => setHomeFlash(false), 1000);
          } else {
            setAwayFlash(true);
            setTimeout(() => setAwayFlash(false), 1000);
          }
        }
        setGoalEvents((prev) => [...prev, ...goals]);
      }
    }
  }, [aoVivo]);

  // ── Alerta de jogo prestes a começar (15 min) ────────────────────────────
  useEffect(() => {
    if (!proximos || !identidade?.id || !palpites) return;
    const now = Date.now();
    const alertedRaw = sessionStorage.getItem("bolao_alerted_games");
    const alerted: string[] = alertedRaw ? JSON.parse(alertedRaw) : [];
    const newAlerted = [...alerted];

    for (const game of proximos) {
      const start = new Date(game.data_hora).getTime();
      const diffMin = (start - now) / 60000;
      if (diffMin > 0 && diffMin <= 15 && !alerted.includes(game.id)) {
        const hasPalpite = palpites.some(
          (p) => p.jogo_id === game.id && p.usuario_id === identidade.id,
        );
        if (!hasPalpite) {
          const mins = Math.ceil(diffMin);
          toast.warning(
            `⚠️ ${game.time_casa} vs ${game.time_fora} começa em ${mins} min! Você ainda não palpitou.`,
            { duration: 10000 },
          );
          newAlerted.push(game.id);
        }
      }
    }

    if (newAlerted.length !== alerted.length) {
      sessionStorage.setItem("bolao_alerted_games", JSON.stringify(newAlerted));
    }
  }, [proximos, identidade?.id, palpites]);

  // Top 4 for mini ranking (with "..." separator if user is outside top 4)
  const top4Display = useMemo(() => {
    if (rankingData.length === 0) return [];
    if (myRankIdx < 4 || myRankIdx === -1) return rankingData.slice(0, 4);
    return [
      ...rankingData.slice(0, 3),
      { __sep: true, id: "__sep" } as any,
      rankingData[myRankIdx],
    ];
  }, [rankingData, myRankIdx]);

  // ── Provocações automáticas ──────────────────────────────────────────────
  const provocacoes = useMemo(() => {
    if (rankingData.length < 2) return [];
    const msgs: string[] = [];

    // Current positions map
    const currentPos = new Map(rankingData.map((r, i) => [r.id, i + 1]));

    // Load previous ranking from localStorage (supports old array and new record formats)
    let prevPosObj: Record<string, number> = {};
    try {
      const raw = localStorage.getItem("bolao_ranking_prev");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          if (Array.isArray(parsed)) {
            parsed.forEach((r, i) => {
              if (r && r.id) prevPosObj[r.id] = i + 1;
            });
          } else {
            prevPosObj = parsed;
          }
        }
      }
    } catch {}

    const prevPos = new Map<string, number>(Object.entries(prevPosObj));

    // Leader message
    if (rankingData[0]) {
      msgs.push(`${rankingData[0].nome} está mandando no ranking! 🔥`);
    }

    // Overtakes
    if (prevPos.size > 0) {
      for (const r of rankingData) {
        const cur = currentPos.get(r.id);
        const prev = prevPos.get(r.id);
        if (cur && prev && cur < prev) {
          // Find who they overtook
          for (const other of rankingData) {
            const otherCur = currentPos.get(other.id);
            const otherPrev = prevPos.get(other.id);
            if (
              otherCur &&
              otherPrev &&
              otherCur > otherPrev &&
              otherPrev < prev &&
              otherCur >= cur
            ) {
              msgs.push(`${r.nome} ultrapassou ${other.nome}! 👀`);
              break;
            }
          }
        }
      }

      // User dropped message
      if (identidade?.id) {
        const myCur = currentPos.get(identidade.id);
        const myPrev = prevPos.get(identidade.id);
        if (myCur && myPrev && myCur > myPrev) {
          msgs.push(`Atenção! Você caiu para ${myCur}º lugar 😬`);
        }
      }
    }

    // Deduplicate and limit to 5
    return [...new Set(msgs)].slice(0, 5);
  }, [rankingData, identidade?.id]);

  const loadingInitial = !usuarios || !proximos || !noticias;

  if (loadingInitial) {
    return (
      <div className="space-y-6 pb-10 max-w-2xl mx-auto animate-pulse">
        <SkeletonCard className="h-10 w-full rounded-xl" lines={1} />
        <div className="space-y-2">
          <SkeletonCard className="h-4 w-32" lines={1} />
          <SkeletonCard className="h-44 w-full rounded-2xl" lines={4} />
        </div>
        <div className="space-y-2">
          <SkeletonCard className="h-4 w-24" lines={1} />
          <SkeletonCard className="h-32 w-full rounded-2xl" lines={3} />
        </div>
        <div className="space-y-2">
          <SkeletonCard className="h-4 w-24" lines={1} />
          <div className="grid grid-cols-2 gap-4">
            <SkeletonCard className="h-40 rounded-xl" lines={3} />
            <SkeletonCard className="h-40 rounded-xl" lines={3} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10 animate-in max-w-2xl mx-auto">
      {/* Goal Toast Portal */}
      <GoalToastContainer events={goalEvents} onDismiss={dismissGoal} />

      <EnableWebPushBanner />

      {/* Mural de Avisos (Broadcasts) */}
      {broadcasts && broadcasts.length > 0 && (
        <div className="space-y-2">
          {broadcasts.map((b: any) => (
            <div
              key={b.id}
              className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-start gap-3 text-xs sm:text-sm text-foreground/90 font-medium animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <Megaphone className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="flex-1 leading-normal">{b.mensagem}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── 1 · Jogo ao Vivo ───────────────────────────────────────────────── */}
      {liveGame && (
        <section>
          <YouTubePlayer
            liveGame={liveGame}
            homeFlash={homeFlash}
            awayFlash={awayFlash}
          />
        </section>
      )}

      {/* ── 2 · Minha Posição ──────────────────────────────────────────────── */}
      {identidade?.nome && (
        <section>
          <Link to="/ranking">
            <div
              className="flex items-center justify-between px-4 py-3 rounded-2xl border transition-all hover:border-primary/60 active:scale-[0.99]"
              style={{
                borderColor: myRank && myRank <= 3 ? "#3FB950" : "#30363D",
                background:
                  myRank && myRank <= 3
                    ? "linear-gradient(90deg, #1A3A2A 0%, #161B22 100%)"
                    : "#161B22",
              }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 shrink-0"
                  style={{ borderColor: "#3FB950", background: "#1A3A2A" }}
                >
                  <span className="font-display font-bold text-primary text-sm leading-none">
                    {identidade.nome.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground leading-tight">
                    {identidade.nome}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {myRank ? (
                      <>
                        <span className="font-bold" style={{ color: "#D29922" }}>
                          {myRank}º
                        </span>{" "}
                        lugar no ranking
                      </>
                    ) : (
                      "Calculando posição..."
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono text-2xl font-bold text-primary tabular-nums">
                  {myScore}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  pontos
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── 3 · Próximo Jogo + Countdown ──────────────────────────────────── */}
      {nextGame && (
        <section>
          <SectionHeading icon={<Timer className="h-4 w-4 text-primary" />} label="Próximo Jogo" />
          <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              {/* Game info */}
              <div className="min-w-0">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1.5">
                  {FASES_LABEL[nextGame.fase as keyof typeof FASES_LABEL] ?? nextGame.fase}
                  {" · "}
                  {new Date(nextGame.data_hora).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                  {" · "}
                  {new Date(nextGame.data_hora).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-display text-xl font-bold leading-tight">
                  <span className="mr-1">{flag(nextGame.time_casa)}</span>
                  {nextGame.time_casa}
                  <span className="text-muted-foreground text-sm font-normal mx-2">vs</span>
                  {nextGame.time_fora}
                  <span className="ml-1">{flag(nextGame.time_fora)}</span>
                </div>
                {nextGame.estadio && (
                  <div className="text-[11px] text-muted-foreground mt-1 truncate">
                    {nextGame.estadio}
                  </div>
                )}
              </div>
              {/* Countdown */}
              <div className="shrink-0 pt-0.5">
                <CountdownTimer date={nextGame.data_hora} />
              </div>
            </div>

            {/* CTA */}
            <Link to="/jogos/$id" params={{ id: nextGame.id }}>
              {userPalpiteNext ? (
                <div
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-sm font-bold transition-all active:scale-[0.97]"
                  style={{ borderColor: "#3FB950", background: "#1A3A2A", color: "#3FB950" }}
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Palpite feito: {userPalpiteNext.gols_casa} × {userPalpiteNext.gols_fora} — editar
                </div>
              ) : (
                <div
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-sm font-bold transition-all active:scale-[0.97]"
                  style={{ background: "#238636" }}
                >
                  <Pencil className="h-4 w-4 shrink-0" />
                  Fazer meu palpite
                </div>
              )}
            </Link>
          </div>
        </section>
      )}

      {/* ── 4 · Mini Ranking ───────────────────────────────────────────────── */}
      {rankingData.length > 0 && (
        <section>
          <SectionHeading
            icon={<BarChart2 className="h-4 w-4 text-primary" />}
            label="Ranking"
            to="/ranking"
          />
          <div className="space-y-1.5">
            {top4Display.map((item: any) => {
              if (item.__sep) {
                return (
                  <div key="sep" className="text-center py-0.5">
                    <span className="text-muted-foreground text-xs tracking-widest">· · ·</span>
                  </div>
                );
              }
              const rank = rankingData.findIndex((r) => r.id === item.id) + 1;
              const isMe = item.id === identidade?.id;
              const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
              const ptsColor = rank === 1 ? "#D29922" : isMe ? "#3FB950" : "#8B949E";

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all"
                  style={{
                    borderColor: isMe ? "#3FB950" : "#30363D",
                    background: isMe
                      ? "linear-gradient(90deg, #1A3A2A 0%, #161B22 100%)"
                      : "#161B22",
                  }}
                >
                  {/* Rank badge */}
                  <div className="w-6 text-center shrink-0">
                    {medal ? (
                      <span className="text-lg leading-none">{medal}</span>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground">{rank}</span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <span
                      className={`text-sm font-semibold truncate ${isMe ? "text-primary" : "text-foreground"}`}
                    >
                      {item.nome}
                    </span>
                    {isMe && (
                      <span
                        className="text-[9px] font-bold shrink-0 px-1 py-0.5 rounded"
                        style={{ color: "#3FB950", border: "0.5px solid #3FB950" }}
                      >
                        você
                      </span>
                    )}
                  </div>

                  {/* Points */}
                  <div
                    className="font-mono text-sm font-bold shrink-0 tabular-nums"
                    style={{ color: ptsColor }}
                  >
                    {item.pontos} pts
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── 5 · Notícias ───────────────────────────────────────────────────── */}
      {(noticias?.length ?? 0) > 0 && (
        <section>
          <SectionHeading
            icon={<Newspaper className="h-4 w-4 text-primary" />}
            label="Notícias"
            to="/noticias"
          />
          <div className="grid grid-cols-2 gap-2">
            {noticias!.slice(0, 2).map((n: any) => (
              <a
                key={n.id}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl overflow-hidden border transition-all hover:border-primary/40 active:scale-[0.98]"
                style={{ background: "#161B22", borderColor: "#30363D" }}
              >
                {/* Image 16:9 */}
                {n.imagem_url ? (
                  <div className="w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
                    <img
                      src={n.imagem_url}
                      alt={n.titulo}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div
                    className="w-full bg-secondary/20 flex items-center justify-center"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <Newspaper className="h-5 w-5 text-muted-foreground/30" />
                  </div>
                )}

                {/* Content */}
                <div className="p-2.5 space-y-1">
                  <span
                    className="text-[9px] font-bold uppercase tracking-[0.06em]"
                    style={{ color: "#3FB950" }}
                  >
                    {n.fonte ?? "Copa 2026"}
                  </span>
                  <p
                    className="text-xs font-semibold leading-snug line-clamp-3"
                    style={{ color: "#E6EDF3" }}
                  >
                    {n.titulo}
                  </p>
                  <p className="text-[10px]" style={{ color: "#484F58" }}>
                    {new Date(n.publicado_em).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ── 6 · Provocações ─────────────────────────────────────────────── */}
      {provocacoes.length > 0 && (
        <section>
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="text-display text-[15px] uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              🔥 Provocações
            </h3>
            <ul className="space-y-2">
              {provocacoes.map((msg, i) => (
                <li key={i} className="text-sm text-foreground leading-snug">
                  {msg}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ── 7 · Acesso Rápido ──────────────────────────────────────────────── */}
      <section>
        <SectionHeading icon={<Zap className="h-4 w-4 text-primary" />} label="Acesso Rápido" />
        <div className="grid grid-cols-2 gap-2">
          {[
            {
              icon: <ListChecks className="h-6 w-6" style={{ color: "#3FB950" }} />,
              label: "Meus palpites",
              sub: "Ver e editar palpites",
              to: "/palpites-participantes",
            },
            {
              icon: <Star className="h-6 w-6" style={{ color: "#D29922" }} />,
              label: "Apostas especiais",
              sub: "Artilheiro · Campeão",
              to: "/apostas-especiais",
            },
            {
              icon: <Users className="h-6 w-6" style={{ color: "#388BFD" }} />,
              label: "Participantes",
              sub: `${usuarios?.length ?? "..."} no bolão`,
              to: "/participantes",
            },
            {
              icon: <Trophy className="h-6 w-6" style={{ color: "#3FB950" }} />,
              label: "Jogos da Copa",
              sub: "Todos os placares",
              to: "/jogos",
            },
          ].map(({ icon, label, sub, to }) => (
            <Link key={to} to={to}>
              <div
                className="flex items-center gap-3 p-3.5 rounded-xl border transition-all hover:border-primary/30 active:scale-[0.97] cursor-pointer"
                style={{ background: "#161B22", borderColor: "#30363D" }}
              >
                <div className="shrink-0">{icon}</div>
                <div className="min-w-0">
                  <div
                    className="text-sm font-semibold leading-snug truncate"
                    style={{ color: "#E6EDF3" }}
                  >
                    {label}
                  </div>
                  <div className="text-[10px] mt-0.5 truncate" style={{ color: "#8B949E" }}>
                    {sub}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
