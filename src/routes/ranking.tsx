import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, useEffect, useRef } from "react";
import { supabase, flag, calcularPontosPalpite, getIdentidade, FASES_LABEL } from "@/lib/bolao";
import { POLL } from "@/lib/realtime";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star, Activity, ChevronRight, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Sparkline } from "@/components/Sparkline";

const RANKING_PREV_KEY = "bolao_ranking_prev";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking Geral — Bolão Copa 2026" },
      { name: "description", content: "Ranking geral de pontuação dos participantes do bolão." },
    ],
  }),
  component: Page,
});

function Page() {
  const identidade = getIdentidade();
  const [faseFilter, setFaseFilter] = useState<string>("todos");
  const [exporting, setExporting] = useState(false);

  const handleExportRanking = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      const W = 600,
        H = 700;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, W, H);
      bg.addColorStop(0, "#0D1117");
      bg.addColorStop(1, "#161B22");
      ctx.fillStyle = bg;
      ctx.roundRect(0, 0, W, H, 16);
      ctx.fill();

      // Border
      ctx.strokeStyle = "#30363D";
      ctx.lineWidth = 2;
      ctx.roundRect(0, 0, W, H, 16);
      ctx.stroke();

      // Top gold accent line
      const accent = ctx.createLinearGradient(0, 0, W, 0);
      accent.addColorStop(0, "#D29922");
      accent.addColorStop(0.5, "#E6EDF3");
      accent.addColorStop(1, "#D29922");
      ctx.fillStyle = accent;
      ctx.fillRect(20, 0, W - 40, 3);

      // Header
      ctx.fillStyle = "#8B949E";
      ctx.font = "bold 12px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("BOLÃO COPA DO MUNDO 2026", W / 2, 40);

      ctx.fillStyle = "#D29922";
      ctx.font = "bold 26px 'Barlow Condensed', sans-serif";
      ctx.fillText("CLASSIFICAÇÃO GERAL", W / 2, 75);

      ctx.fillStyle = "#484F58";
      ctx.font = "11px 'Inter', sans-serif";
      const dateStr = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      ctx.fillText(`Gerado em ${dateStr}`, W / 2, 98);

      // Table Header
      ctx.strokeStyle = "#30363D";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(30, 120);
      ctx.lineTo(W - 30, 120);
      ctx.stroke();

      ctx.fillStyle = "#8B949E";
      ctx.font = "bold 12px 'Inter', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("POS", 40, 138);
      ctx.fillText("PARTICIPANTE", 100, 138);
      ctx.textAlign = "right";
      ctx.fillText("PLACAR", W - 165, 138);
      ctx.fillText("RESULTADO", W - 85, 138);
      ctx.fillText("PONTOS", W - 40, 138);

      ctx.beginPath();
      ctx.moveTo(30, 148);
      ctx.lineTo(W - 30, 148);
      ctx.stroke();

      // Draw rows (Top 10)
      const rows = ranking.slice(0, 10);
      let y = 175;

      rows.forEach((row, i) => {
        // Row background highlights
        if (i < 3) {
          ctx.fillStyle =
            i === 0
              ? "rgba(210,153,34,0.08)"
              : i === 1
                ? "rgba(230,237,243,0.04)"
                : "rgba(163,113,247,0.04)";
          ctx.beginPath();
          ctx.roundRect(30, y - 18, W - 60, 26, 6);
          ctx.fill();
        }

        // Rank number / Medal
        let rankStr = `${i + 1}º`;
        if (i === 0) rankStr = "🥇";
        else if (i === 1) rankStr = "🥈";
        else if (i === 2) rankStr = "🥉";

        ctx.fillStyle = i === 0 ? "#D29922" : i === 1 ? "#C9D1D9" : i === 2 ? "#D7C49E" : "#8B949E";
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(rankStr, i < 3 ? 42 : 40, y);

        // Name
        ctx.fillStyle = "#E6EDF3";
        ctx.font = "bold 13px 'Inter', sans-serif";
        ctx.fillText(row.nome, 100, y);

        // Stats (Placares, Resultados, Pontos)
        ctx.fillStyle = "#8B949E";
        ctx.font = "12px 'JetBrains Mono', monospace";
        ctx.textAlign = "right";
        ctx.fillText(`${row.acertosPlacar}`, W - 165, y);
        ctx.fillText(`${row.acertosResultado}`, W - 85, y);

        // Points (Highlighted)
        ctx.fillStyle = i === 0 ? "#D29922" : "#3FB950";
        ctx.font = "bold 14px 'JetBrains Mono', monospace";
        ctx.fillText(`${row.totalPontos} pts`, W - 40, y);

        // Divider
        ctx.strokeStyle = "#21262D";
        ctx.beginPath();
        ctx.moveTo(30, y + 14);
        ctx.lineTo(W - 30, y + 14);
        ctx.stroke();

        y += 42;
      });

      // Footer
      ctx.fillStyle = "#30363D";
      ctx.font = "9px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("girabolao.vercel.app — Bolão Oficial Copa 2026", W / 2, H - 20);

      // Share / Download
      canvas.toBlob(async (blob) => {
        if (!blob) throw new Error("Falha ao gerar blob");
        const file = new File([blob], "ranking-bolao-copa-2026.png", { type: "image/png" });

        if (navigator.share && navigator.canShare?.({ files: [file] })) {
          await navigator.share({
            title: "Ranking Geral — Bolão Copa 2026",
            text: `Confira a classificação atualizada do nosso bolão! Liderança atual por ${rows[0]?.nome}.`,
            files: [file],
          });
        } else {
          // Fallback Download
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `ranking-bolao-${new Date().toISOString().slice(0, 10)}.png`;
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Imagem do ranking baixada!");
        }
      }, "image/png");
    } catch (err: any) {
      toast.error(`Falha ao exportar imagem: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastFiredRef = useRef(false);

  const {
    data: usuarios,
    isLoading: loadingU,
    isError: errU,
    refetch,
  } = useQuery({
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

  const { data: jogos, isLoading: loadingJ } = useQuery({
    queryKey: ["jogos-all-ranking"],
    queryFn: async () =>
      (
        await supabase
          .from("bolao_jogos")
          .select("id, time_casa, time_fora, placar_casa, placar_fora, status, fase, data_hora")
      ).data ?? [],
    refetchInterval: 30000,
  });

  const { data: palpites, isLoading: loadingPa } = useQuery({
    queryKey: ["palpites-all-ranking"],
    queryFn: async () =>
      (
        await supabase
          .from("bolao_palpites")
          .select("usuario_id, jogo_id, gols_casa, gols_fora, acertou")
      ).data ?? [],
    refetchInterval: 30000,
  });

  const { data: apostasArt } = useQuery({
    queryKey: ["apostas-art-all"],
    queryFn: async () =>
      (await (supabase as any).from("bolao_apostas_artilheiro").select("usuario_id, acertou")).data ?? [],
  });

  const { data: apostasFin } = useQuery({
    queryKey: ["apostas-fin-all"],
    queryFn: async () =>
      (
        await (supabase as any)
          .from("bolao_apostas_finalistas")
          .select("usuario_id, acertou_os_dois, acertou_um")
      ).data ?? [],
  });

  const { data: apostasCam } = useQuery({
    queryKey: ["apostas-cam-all"],
    queryFn: async () =>
      (await (supabase as any).from("bolao_apostas_campeao").select("usuario_id, acertou")).data ?? [],
  });

  const { data: apostasZeb } = useQuery({
    queryKey: ["apostas-zeb-all"],
    queryFn: async () =>
      (await (supabase as any).from("bolao_apostas_zebra").select("usuario_id, acertou")).data ?? [],
  });

  const { data: apostasGol } = useQuery({
    queryKey: ["apostas-gol-all"],
    queryFn: async () =>
      (await (supabase as any).from("bolao_apostas_goleada").select("usuario_id, acertou")).data ?? [],
  });

  const { data: bolaoConfig } = useQuery({
    queryKey: ["bolao-config-ranking"],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("bolao_config")
        .select("premio_descricao")
        .eq("id", 1)
        .single();
      return data;
    },
  });

  const nomeMap = useMemo(() => new Map((usuarios ?? []).map((u) => [u.id, u.nome])), [usuarios]);

  const ranking = useMemo(() => {
    const gamesMap = new Map((jogos ?? []).map((g) => [g.id, g]));

    // Filter games by phase if needed
    const filteredGameIds =
      faseFilter === "todos"
        ? null
        : new Set((jogos ?? []).filter((g) => g.fase === faseFilter).map((g) => g.id));

    return (usuarios ?? [])
      .map((u) => {
        let acertosPlacar = 0;
        let acertosResultado = 0;
        let pontosPlacares = 0;

        const userPalpites = (palpites ?? []).filter((p) => p.usuario_id === u.id);
        for (const p of userPalpites) {
          // Skip palpites for games not in selected phase
          if (filteredGameIds && !filteredGameIds.has(p.jogo_id)) continue;
          const g = gamesMap.get(p.jogo_id);
          if (g && g.placar_casa != null && g.placar_fora != null) {
            const res = calcularPontosPalpite(
              p.gols_casa,
              p.gols_fora,
              g.placar_casa,
              g.placar_fora,
            );
            pontosPlacares += res.pontos;
            if (res.acertouPlacar) acertosPlacar++;
            else if (res.acertouResultado) acertosResultado++;
          }
        }

        // Pontos das apostas especiais (only count when showing all phases)
        const includeSpecials = faseFilter === "todos";

        const acertouArt = !!(apostasArt ?? []).find((a: any) => a.usuario_id === u.id)?.acertou;
        const pontosArt = includeSpecials && acertouArt ? 10 : 0;

        const apostaFin = (apostasFin ?? []).find((a: any) => a.usuario_id === u.id);
        let pontosFin = 0;
        let acertouFin = false;
        if (includeSpecials && apostaFin) {
          if (apostaFin.acertou_os_dois) {
            pontosFin = 10;
            acertouFin = true;
          } else if (apostaFin.acertou_um) {
            pontosFin = 5;
          }
        }

        const acertouCam = !!(apostasCam ?? []).find((a: any) => a.usuario_id === u.id)?.acertou;
        const pontosCam = includeSpecials && acertouCam ? 10 : 0;

        const acertouZeb = !!(apostasZeb ?? []).find((a: any) => a.usuario_id === u.id)?.acertou;
        const pontosZeb = includeSpecials && acertouZeb ? 10 : 0;

        const acertouGol = !!(apostasGol ?? []).find((a: any) => a.usuario_id === u.id)?.acertou;
        const pontosGol = includeSpecials && acertouGol ? 10 : 0;

        const pontosEspeciais = pontosArt + pontosFin + pontosCam + pontosZeb + pontosGol;
        const totalPontos = pontosPlacares + pontosEspeciais;

        return {
          ...u,
          acertosPlacar,
          acertosResultado,
          pontosEspeciais,
          totalPontos,
          acertouArt,
          acertouFin,
          acertouCam,
          acertouZeb,
          acertouGol,
        };
      })
      .sort(
        (a, b) =>
          b.totalPontos - a.totalPontos ||
          b.acertosPlacar - a.acertosPlacar ||
          b.acertosResultado - a.acertosResultado,
      );
  }, [
    usuarios,
    palpites,
    jogos,
    apostasArt,
    apostasFin,
    apostasCam,
    apostasZeb,
    apostasGol,
    faseFilter,
  ]);

  // --- Cumulative points timeline (for sparkline) ---
  const sparklineMap = useMemo(() => {
    const map = new Map<string, number[]>();
    const finGames = (jogos ?? [])
      .filter(
        (g) =>
          (g.status === "encerrado" || g.status === "apurado") &&
          g.placar_casa != null &&
          g.placar_fora != null,
      )
      .sort((a, b) => (a.data_hora ?? "").localeCompare(b.data_hora ?? ""));
    if (finGames.length < 3) return map;

    const palpitesByUser = new Map<string, Map<any, { gols_casa: number; gols_fora: number }>>();
    for (const p of palpites ?? []) {
      if (!palpitesByUser.has(p.usuario_id)) palpitesByUser.set(p.usuario_id, new Map());
      palpitesByUser
        .get(p.usuario_id)!
        .set(p.jogo_id, { gols_casa: p.gols_casa, gols_fora: p.gols_fora });
    }

    for (const u of usuarios ?? []) {
      const userPalpMap = palpitesByUser.get(u.id);
      if (!userPalpMap) continue;
      const timeline: number[] = [];
      let cumulative = 0;
      for (const g of finGames) {
        const p = userPalpMap.get(g.id);
        if (p) {
          const res = calcularPontosPalpite(
            p.gols_casa,
            p.gols_fora,
            g.placar_casa!,
            g.placar_fora!,
          );
          cumulative += res.pontos;
        }
        timeline.push(cumulative);
      }
      map.set(u.id, timeline);
    }
    return map;
  }, [jogos, palpites, usuarios]);

  const stats = useMemo(() => {
    const encerrados = (jogos ?? []).filter(
      (g) => g.status === "encerrado" || g.status === "apurado",
    ).length;
    const totalPalpites = palpites?.length ?? 0;
    const lider = ranking[0]?.nome ? `${ranking[0].nome} (${ranking[0].totalPontos} pts)` : "—";
    return { encerrados, totalPalpites, lider };
  }, [jogos, palpites, ranking]);

  // --- Position change tracking (localStorage) ---
  const prevPositions = useMemo<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(RANKING_PREV_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }, []);

  // Debounced save: persist current positions after 5s of stability
  useEffect(() => {
    if (ranking.length === 0) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const positions: Record<string, number> = {};
      ranking.forEach((u, i) => {
        positions[u.id] = i + 1;
      });
      localStorage.setItem(RANKING_PREV_KEY, JSON.stringify(positions));
    }, 5000);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [ranking]);

  // --- Ranking change toast (fire once on mount) ---
  useEffect(() => {
    if (toastFiredRef.current || !identidade?.id || ranking.length === 0) return;
    const myIndex = ranking.findIndex((u) => u.id === identidade.id);
    if (myIndex === -1) return;
    const currentPos = myIndex + 1;
    const prevPos = prevPositions[identidade.id];
    if (prevPos == null) return;
    const delta = prevPos - currentPos;
    if (delta > 0) {
      toast.success(`🎉 Você subiu para ${currentPos}º lugar!`);
      toastFiredRef.current = true;
    } else if (delta < 0) {
      toast(`📉 Você caiu para ${currentPos}º lugar`);
      toastFiredRef.current = true;
    }
  }, [ranking, identidade, prevPositions]);

  // --- Match history dots ---
  const finishedGames = useMemo(() => {
    return (jogos ?? [])
      .filter((g) => g.status === "encerrado" || g.status === "apurado")
      .sort((a, b) => (a.data_hora ?? "").localeCompare(b.data_hora ?? ""))
      .slice(-20);
  }, [jogos]);

  type DotResult = "exact" | "result" | "wrong";
  const matchHistoryMap = useMemo(() => {
    const map = new Map<string, DotResult[]>();
    if (finishedGames.length === 0) return map;
    const palpitesByUser = new Map<string, Map<any, { gols_casa: number; gols_fora: number }>>();
    for (const p of palpites ?? []) {
      if (!palpitesByUser.has(p.usuario_id)) palpitesByUser.set(p.usuario_id, new Map());
      palpitesByUser
        .get(p.usuario_id)!
        .set(p.jogo_id, { gols_casa: p.gols_casa, gols_fora: p.gols_fora });
    }
    for (const u of usuarios ?? []) {
      const userPalpMap = palpitesByUser.get(u.id);
      const dots: DotResult[] = [];
      for (const g of finishedGames) {
        const p = userPalpMap?.get(g.id);
        if (!p) continue; // no dot if no prediction
        if (g.placar_casa == null || g.placar_fora == null) continue;
        const res = calcularPontosPalpite(p.gols_casa, p.gols_fora, g.placar_casa, g.placar_fora);
        if (res.acertouPlacar) dots.push("exact");
        else if (res.acertouResultado) dots.push("result");
        else dots.push("wrong");
      }
      map.set(u.id, dots);
    }
    return map;
  }, [finishedGames, palpites, usuarios]);

  // --- Points projection ---
  const remainingGames = useMemo(() => {
    return (jogos ?? []).filter((g) => g.placar_casa == null).length;
  }, [jogos]);

  const correctPalpitesList = useMemo(() => {
    const gamesMap = new Map((jogos ?? []).map((g) => [g.id, g]));
    return (palpites ?? [])
      .filter((p) => p.acertou)
      .map((p) => {
        const g = gamesMap.get(p.jogo_id);
        const userName = nomeMap.get(p.usuario_id) ?? "—";
        return {
          id: `${p.usuario_id}_${p.jogo_id}`,
          userName,
          gameLabel: g
            ? `${flag(g.time_casa)} ${g.time_casa} ${g.placar_casa} × ${g.placar_fora} ${g.time_fora} ${flag(g.time_fora)}`
            : "—",
          gols_casa: p.gols_casa,
          gols_fora: p.gols_fora,
        };
      })
      .slice(0, 10);
  }, [palpites, jogos, nomeMap]);

  const isLoading = loadingU || loadingJ || loadingPa;

  return (
    <div className="space-y-6 animate-in pb-20">
      {/* Prize Banner */}
      {bolaoConfig?.premio_descricao && (
        <div className="relative overflow-hidden rounded-xl border-2 border-gold/40 bg-gradient-to-r from-gold/10 via-card to-gold/10 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl shrink-0">🏆</span>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gold">
                Prêmio do Bolão
              </div>
              <div className="text-sm sm:text-base font-medium text-foreground mt-0.5">
                {bolaoConfig.premio_descricao}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-gold/10 to-transparent rounded-bl-full" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl sm:text-4xl text-foreground font-extrabold tracking-wide">
            📊 Ranking Geral
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Classificação oficial dos participantes por pontuação.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 btn-touch gap-1.5 h-9 border-primary/20 text-foreground hover:bg-secondary/40"
          onClick={handleExportRanking}
          disabled={exporting}
        >
          <Share2 className="h-4 w-4" />
          {exporting ? "Exportando..." : "Compartilhar Ranking"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SmallStat
          label="Jogos Apurados"
          value={stats.encerrados}
          icon={<Activity className="h-4 w-4 text-primary" />}
        />
        <SmallStat
          label="Total Palpites"
          value={stats.totalPalpites}
          icon={<Star className="h-4 w-4 text-gold" />}
        />
        <SmallStat
          label="Líder Atual"
          value={stats.lider}
          icon={<Trophy className="h-4 w-4 text-accent" />}
        />
      </div>

      {/* Phase Filter Pills */}
      <div className="tab-scroll-container">
        <button
          onClick={() => setFaseFilter("todos")}
          className={`tab-pill shrink-0 ${faseFilter === "todos" ? "active" : ""}`}
        >
          Todos
        </button>
        {Object.entries(FASES_LABEL).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFaseFilter(k)}
            className={`tab-pill shrink-0 ${faseFilter === k ? "active" : ""}`}
          >
            {v}
          </button>
        ))}
      </div>

      {isLoading && <SkeletonCard lines={6} />}
      {errU && <ErrorState message="Erro ao carregar o ranking." onRetry={() => refetch()} />}

      {!isLoading && !errU && (
        <Card className="border-border bg-card/40 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold uppercase text-foreground">
              Classificação Oficial
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Critério de desempate: 1º Acertos Exatos, 2º Acertos de Vencedor.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              {ranking.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  Nenhum dado disponível ainda.
                </div>
              ) : (
                ranking.map((u, i) => {
                  const isMe = identidade?.id === u.id;
                  const medalEmoji = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

                  // Progress relative to leader
                  const leaderPoints = ranking[0]?.totalPontos || 1;
                  const ratio = Math.max(0, Math.min(100, (u.totalPontos / leaderPoints) * 100));

                  // Position change indicator
                  const currentPos = i + 1;
                  const prevPos = prevPositions[u.id];
                  const positionDelta = prevPos != null ? prevPos - currentPos : null;

                  // Match history dots for this user
                  const dots = matchHistoryMap.get(u.id) ?? [];

                  // Points projection
                  const maxProjection =
                    remainingGames > 0 ? u.totalPontos + remainingGames * 3 : null;

                  return (
                    <div
                      key={u.id}
                      className={`ranking-card-row p-3 flex items-center justify-between gap-3 relative ${isMe ? "is-me" : "bg-transparent"}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank / Medal position */}
                        <div className="w-8 shrink-0 text-center">
                          <div className="font-mono text-sm font-bold text-muted-foreground">
                            {medalEmoji ? (
                              <span
                                className={`text-xl ${i === 0 ? "drop-shadow-[0_0_8px_rgba(210,153,34,0.5)]" : ""}`}
                              >
                                {medalEmoji}
                              </span>
                            ) : (
                              `#${currentPos}`
                            )}
                          </div>
                          {/* Position change arrow */}
                          <div className="text-[9px] font-mono font-bold leading-none mt-0.5">
                            {positionDelta === null ? (
                              <span style={{ color: "#D29922" }}>NEW</span>
                            ) : positionDelta > 0 ? (
                              <span style={{ color: "#3FB950" }}>↑{positionDelta}</span>
                            ) : positionDelta < 0 ? (
                              <span style={{ color: "#F85149" }}>↓{Math.abs(positionDelta)}</span>
                            ) : (
                              <span style={{ color: "#8B949E" }}>=</span>
                            )}
                          </div>
                        </div>

                        {/* User identity & stats details */}
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate flex items-center gap-1.5 text-sm sm:text-base">
                            {u.nome}
                            {isMe && (
                              <Badge className="bg-primary/20 text-primary border border-primary/30 text-[9px] uppercase tracking-wide px-1.5 py-0 h-4.5">
                                Você
                              </Badge>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 font-mono mt-0.5 flex-wrap">
                            <span>🎯 {u.acertosPlacar} exatos</span>
                            <span>•</span>
                            <span>⚽ {u.acertosResultado} result</span>
                            {u.pontosEspeciais > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-gold">🎰 {u.pontosEspeciais} pts esp</span>
                              </>
                            )}
                          </div>

                          {/* Match history dots */}
                          {dots.length > 0 && (
                            <div className="overflow-x-auto mt-1">
                              <div className="flex items-center gap-[3px]">
                                {dots.map((dot, di) => (
                                  <span
                                    key={di}
                                    style={{
                                      display: "inline-block",
                                      width: 6,
                                      height: 6,
                                      borderRadius: "50%",
                                      backgroundColor:
                                        dot === "exact"
                                          ? "#3FB950"
                                          : dot === "result"
                                            ? "#D29922"
                                            : "#484F58",
                                      flexShrink: 0,
                                    }}
                                    title={
                                      dot === "exact"
                                        ? "Placar exato"
                                        : dot === "result"
                                          ? "Acertou resultado"
                                          : "Errou"
                                    }
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Points projection */}
                          {maxProjection != null && faseFilter === "todos" && (
                            <div
                              className="text-[9px] font-mono mt-0.5"
                              style={{ color: "#8B949E" }}
                            >
                              Projeção máx: {maxProjection} pts
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score display + sparkline */}
                      <div className="flex items-center gap-2 shrink-0">
                        {(sparklineMap.get(u.id)?.length ?? 0) >= 3 && (
                          <div className="hidden sm:block">
                            <Sparkline data={sparklineMap.get(u.id)!} width={80} height={24} />
                          </div>
                        )}
                        <div className="text-right">
                          <div className="text-display text-base sm:text-lg text-primary font-bold font-mono">
                            {u.totalPontos}{" "}
                            <span className="text-[9px] text-muted-foreground font-sans font-medium uppercase">
                              pts
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Relative progress bar compared to leader */}
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-border-subtle/20">
                        <div className="h-full bg-primary/20" style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Últimos Placares Exatos */}
      {!isLoading && correctPalpitesList.length > 0 && (
        <Card className="border-border bg-card/20 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold uppercase flex items-center gap-2 text-foreground">
              <Award className="h-5 w-5 text-gold animate-pulse" />
              Últimos Acertos de Placar (3 pts)
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Feed recente de palpites certeiros dos participantes.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/40 text-xs sm:text-sm">
              {correctPalpitesList.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between items-center py-2.5 px-4 gap-2 hover:bg-secondary/5"
                >
                  <span className="font-semibold text-primary">{p.userName}</span>
                  <span className="text-muted-foreground text-right truncate">
                    acertou o placar de{" "}
                    <span className="font-mono text-foreground font-semibold">{p.gameLabel}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Sticky User Position Footer Widget */}
      {!isLoading &&
        identidade?.id &&
        (() => {
          const myRankIndex = ranking.findIndex((u) => u.id === identidade.id);
          if (myRankIndex === -1) return null;
          const myStats = ranking[myRankIndex];
          const medalEmoji =
            myRankIndex === 0 ? "🥇" : myRankIndex === 1 ? "🥈" : myRankIndex === 2 ? "🥉" : null;

          return (
            <div className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-border p-3 sm:px-6 shadow-[0_-8px_24px_rgba(0,0,0,0.6)]">
              <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                    Sua Posição
                  </div>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-xs font-bold text-foreground">
                      {medalEmoji ? medalEmoji : `#${myRankIndex + 1}`}
                    </span>
                    <span className="font-semibold text-foreground truncate text-sm">
                      {myStats.nome}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 font-mono text-xs text-muted-foreground">
                  <span className="hidden md:inline">🎯 {myStats.acertosPlacar} exatos</span>
                  <span className="hidden md:inline">•</span>
                  <div className="text-display text-sm text-primary font-bold">
                    {myStats.totalPontos}{" "}
                    <span className="text-[10px] text-muted-foreground font-sans font-medium uppercase">
                      pts
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}

function SmallStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-secondary/10 shadow-card">
      <CardContent className="py-2.5 px-3 sm:py-3.5 flex items-center justify-between gap-2">
        <div>
          <div className="text-[9px] sm:text-xs text-muted-foreground leading-tight uppercase font-semibold">
            {label}
          </div>
          <div className="text-display text-xs sm:text-base text-foreground mt-1 truncate max-w-28 sm:max-w-44 font-bold">
            {value}
          </div>
        </div>
        <div className="shrink-0 p-1 bg-secondary rounded-lg border border-border/30">{icon}</div>
      </CardContent>
    </Card>
  );
}
