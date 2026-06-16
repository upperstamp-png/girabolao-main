import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase, flag, calcularPontosPalpite, getIdentidade } from "@/lib/bolao";
import { POLL } from "@/lib/realtime";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star, Activity, ChevronRight } from "lucide-react";

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

  const { data: usuarios, isLoading: loadingU, isError: errU, refetch } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("nome")).data ?? [],
  });

  const { data: jogos, isLoading: loadingJ } = useQuery({
    queryKey: ["jogos-all-ranking"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("id, time_casa, time_fora, placar_casa, placar_fora, status")).data ?? [],
    refetchInterval: 30000,
  });

  const { data: palpites, isLoading: loadingPa } = useQuery({
    queryKey: ["palpites-all-ranking"],
    queryFn: async () => (await supabase.from("bolao_palpites").select("usuario_id, jogo_id, gols_casa, gols_fora, acertou")).data ?? [],
    refetchInterval: 30000,
  });

  const { data: apostasArt } = useQuery({
    queryKey: ["apostas-art-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_artilheiro").select("usuario_id, acertou")).data ?? [],
  });

  const { data: apostasFin } = useQuery({
    queryKey: ["apostas-fin-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_finalistas").select("usuario_id, acertou_os_dois, acertou_um")).data ?? [],
  });

  const { data: apostasCam } = useQuery({
    queryKey: ["apostas-cam-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_campeao").select("usuario_id, acertou")).data ?? [],
  });

  const { data: apostasZeb } = useQuery({
    queryKey: ["apostas-zeb-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_zebra").select("usuario_id, acertou")).data ?? [],
  });

  const { data: apostasGol } = useQuery({
    queryKey: ["apostas-gol-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_goleada").select("usuario_id, acertou")).data ?? [],
  });

  const nomeMap = useMemo(() => new Map((usuarios ?? []).map(u => [u.id, u.nome])), [usuarios]);

  const ranking = useMemo(() => {
    const gamesMap = new Map((jogos ?? []).map(g => [g.id, g]));

    return (usuarios ?? []).map(u => {
      let acertosPlacar = 0;
      let acertosResultado = 0;
      let pontosPlacares = 0;

      const userPalpites = (palpites ?? []).filter(p => p.usuario_id === u.id);
      for (const p of userPalpites) {
        const g = gamesMap.get(p.jogo_id);
        if (g && g.placar_casa != null && g.placar_fora != null) {
          const res = calcularPontosPalpite(p.gols_casa, p.gols_fora, g.placar_casa, g.placar_fora);
          pontosPlacares += res.pontos;
          if (res.acertouPlacar) acertosPlacar++;
          else if (res.acertouResultado) acertosResultado++;
        }
      }

      // Pontos das apostas especiais
      const acertouArt = !!(apostasArt ?? []).find(a => a.usuario_id === u.id)?.acertou;
      const pontosArt = acertouArt ? 10 : 0;

      const apostaFin = (apostasFin ?? []).find(a => a.usuario_id === u.id);
      let pontosFin = 0;
      let acertouFin = false;
      if (apostaFin) {
        if (apostaFin.acertou_os_dois) {
          pontosFin = 10;
          acertouFin = true;
        } else if (apostaFin.acertou_um) {
          pontosFin = 5;
        }
      }

      const acertouCam = !!(apostasCam ?? []).find(a => a.usuario_id === u.id)?.acertou;
      const pontosCam = acertouCam ? 10 : 0;

      const acertouZeb = !!(apostasZeb ?? []).find(a => a.usuario_id === u.id)?.acertou;
      const pontosZeb = acertouZeb ? 10 : 0;

      const acertouGol = !!(apostasGol ?? []).find(a => a.usuario_id === u.id)?.acertou;
      const pontosGol = acertouGol ? 10 : 0;

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
    }).sort((a, b) => b.totalPontos - a.totalPontos || b.acertosPlacar - a.acertosPlacar || b.acertosResultado - a.acertosResultado);
  }, [usuarios, palpites, jogos, apostasArt, apostasFin, apostasCam, apostasZeb, apostasGol]);

  const stats = useMemo(() => {
    const encerrados = (jogos ?? []).filter(g => g.status === "encerrado" || g.status === "apurado").length;
    const totalPalpites = palpites?.length ?? 0;
    const lider = ranking[0]?.nome ? `${ranking[0].nome} (${ranking[0].totalPontos} pts)` : "—";
    return { encerrados, totalPalpites, lider };
  }, [jogos, palpites, ranking]);

  const correctPalpitesList = useMemo(() => {
    const gamesMap = new Map((jogos ?? []).map(g => [g.id, g]));
    return (palpites ?? [])
      .filter(p => p.acertou)
      .map(p => {
        const g = gamesMap.get(p.jogo_id);
        const userName = nomeMap.get(p.usuario_id) ?? "—";
        return {
          id: `${p.usuario_id}_${p.jogo_id}`,
          userName,
          gameLabel: g ? `${flag(g.time_casa)} ${g.time_casa} ${g.placar_casa} × ${g.placar_fora} ${g.time_fora} ${flag(g.time_fora)}` : "—",
          gols_casa: p.gols_casa,
          gols_fora: p.gols_fora,
        };
      })
      .slice(0, 10);
  }, [palpites, jogos, nomeMap]);

  const isLoading = loadingU || loadingJ || loadingPa;

  return (
    <div className="space-y-6 animate-in pb-20">
      <div>
        <h1 className="text-display text-3xl sm:text-4xl text-foreground font-extrabold tracking-wide">📊 Ranking Geral</h1>
        <p className="text-muted-foreground text-sm mt-1">Classificação oficial dos participantes por pontuação.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SmallStat label="Jogos Apurados" value={stats.encerrados} icon={<Activity className="h-4 w-4 text-primary" />} />
        <SmallStat label="Total Palpites" value={stats.totalPalpites} icon={<Star className="h-4 w-4 text-gold" />} />
        <SmallStat label="Líder Atual" value={stats.lider} icon={<Trophy className="h-4 w-4 text-accent" />} />
      </div>

      {isLoading && <SkeletonCard lines={6} />}
      {errU && <ErrorState message="Erro ao carregar o ranking." onRetry={() => refetch()} />}

      {!isLoading && !errU && (
        <Card className="border-border bg-card/40 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-sm font-semibold uppercase text-foreground">Classificação Oficial</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Critério de desempate: 1º Acertos Exatos, 2º Acertos de Vencedor.</CardDescription>
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

                  return (
                    <div
                      key={u.id}
                      className={`ranking-card-row p-3 flex items-center justify-between gap-3 relative ${isMe ? "is-me" : "bg-transparent"}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Rank / Medal position */}
                        <div className="w-8 shrink-0 text-center font-mono text-sm font-bold text-muted-foreground">
                          {medalEmoji ? (
                            <span className={`text-xl ${i === 0 ? "drop-shadow-[0_0_8px_rgba(210,153,34,0.5)]" : ""}`}>
                              {medalEmoji}
                            </span>
                          ) : (
                            `#${i + 1}`
                          )}
                        </div>
                        
                        {/* User identity & stats details */}
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate flex items-center gap-1.5 text-sm sm:text-base">
                            {u.nome}
                            {isMe && <Badge className="bg-primary/20 text-primary border border-primary/30 text-[9px] uppercase tracking-wide px-1.5 py-0 h-4.5">Você</Badge>}
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
                        </div>
                      </div>

                      {/* Score display */}
                      <div className="text-right shrink-0">
                        <div className="text-display text-base sm:text-lg text-primary font-bold font-mono">
                          {u.totalPontos} <span className="text-[9px] text-muted-foreground font-sans font-medium uppercase">pts</span>
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
            <CardDescription className="text-xs text-muted-foreground">Feed recente de palpites certeiros dos participantes.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/40 text-xs sm:text-sm">
              {correctPalpitesList.map(p => (
                <li key={p.id} className="flex justify-between items-center py-2.5 px-4 gap-2 hover:bg-secondary/5">
                  <span className="font-semibold text-primary">{p.userName}</span>
                  <span className="text-muted-foreground text-right truncate">
                    acertou o placar de <span className="font-mono text-foreground font-semibold">{p.gameLabel}</span>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Sticky User Position Footer Widget */}
      {!isLoading && identidade?.id && (
        (() => {
          const myRankIndex = ranking.findIndex(u => u.id === identidade.id);
          if (myRankIndex === -1) return null;
          const myStats = ranking[myRankIndex];
          const medalEmoji = myRankIndex === 0 ? "🥇" : myRankIndex === 1 ? "🥈" : myRankIndex === 2 ? "🥉" : null;

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
                    {myStats.totalPontos} <span className="text-[10px] text-muted-foreground font-sans font-medium uppercase">pts</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}

function SmallStat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="border-border bg-secondary/10 shadow-card">
      <CardContent className="py-2.5 px-3 sm:py-3.5 flex items-center justify-between gap-2">
        <div>
          <div className="text-[9px] sm:text-xs text-muted-foreground leading-tight uppercase font-semibold">{label}</div>
          <div className="text-display text-xs sm:text-base text-foreground mt-1 truncate max-w-28 sm:max-w-44 font-bold">{value}</div>
        </div>
        <div className="shrink-0 p-1 bg-secondary rounded-lg border border-border/30">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
