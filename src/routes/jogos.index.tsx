import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase, flag, countdown, FASES_LABEL, getIdentidade, calcularPontosPalpite } from "@/lib/bolao";
import { POLL } from "@/lib/realtime";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { PenTool, Calendar, Clock, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/jogos/")({
  head: () => ({
    meta: [
      { title: "Jogos — Bolão Copa 2026" },
      { name: "description", content: "Todos os jogos da Copa 2026, palpite no placar exato." },
    ],
  }),
  component: Page,
});

function Page() {
  const [fase, setFase] = useState<string>("todos");
  const identidade = getIdentidade();

  const { data: config } = useQuery({
    queryKey: ["config-global-index"],
    queryFn: async () => (await supabase.from("bolao_config").select("*").eq("id", 1).single()).data,
  });

  const { data: jogos, isLoading: loadingJogos, isError: errJogos, refetch: refetchJogos } = useQuery({
    queryKey: ["jogos-all"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*").order("data_hora")).data ?? [],
    refetchInterval: (query) => {
      const list = query.state.data ?? [];
      return list.some((j: { status?: string }) => j.status === "ao_vivo") ? POLL.LIVE : POLL.NORMAL;
    },
  });

  const { data: userPalpites } = useQuery({
    queryKey: ["user-palpites", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return [];
      return (await supabase.from("bolao_palpites").select("*").eq("usuario_id", identidade.id)).data ?? [];
    },
    enabled: !!identidade?.id,
  });

  const filtrados = (jogos ?? []).filter(j => fase === "todos" || j.fase === fase);
  
  // Group matches by date
  const groupedMatches = useMemo(() => {
    const map = new Map<string, typeof filtrados>();
    for (const j of filtrados) {
      const date = new Date(j.data_hora);
      const weekday = date.toLocaleDateString("pt-BR", { weekday: "long" });
      const dayMonth = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
      const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1) + ", " + dayMonth;
      if (!map.has(capitalized)) map.set(capitalized, []);
      map.get(capitalized)!.push(j);
    }
    return Array.from(map.entries());
  }, [filtrados]);

  const isLoading = loadingJogos;
  const isError = errJogos;
  const refetch = refetchJogos;

  return (
    <div className="space-y-6 animate-in pb-12">
      <div>
        <h1 className="text-display text-3xl sm:text-4xl text-foreground font-extrabold tracking-wide">Jogos da Copa</h1>
        <p className="text-muted-foreground text-sm mt-1">Selecione uma partida para fazer ou alterar seu palpite.</p>
      </div>

      {/* Custom Horizontal Scrollable Tabs Pills */}
      <div className="tab-scroll-container">
        <button
          onClick={() => setFase("todos")}
          className={`tab-pill shrink-0 ${fase === "todos" ? "active" : ""}`}
        >
          Todos
        </button>
        {Object.entries(FASES_LABEL).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setFase(k)}
            className={`tab-pill shrink-0 ${fase === k ? "active" : ""}`}
          >
            {v}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} lines={3} />)}
        </div>
      )}

      {isError && (
        <ErrorState
          message="Não foi possível carregar os jogos."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (
        filtrados.length === 0 ? (
          <Card className="border-border">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
              {jogos?.length === 0
                ? "Nenhum jogo carregado. Sincronize na aba Admin."
                : "Nenhum jogo cadastrado nesta fase."
              }
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {groupedMatches.map(([dateLabel, games]) => (
              <div key={dateLabel} className="space-y-3">
                {/* Date separator */}
                <div className="flex items-center gap-3 my-4">
                  <div className="h-px bg-border/40 flex-1" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground bg-background px-2">{dateLabel}</span>
                  <div className="h-px bg-border/40 flex-1" />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {games.map(j => {
                    const palpite = userPalpites?.find(p => p.jogo_id === j.id);
                    const future = new Date(j.data_hora) > new Date();
                    const pendingPalpite = future && !palpite;

                    // Scoreboard color depending on result state
                    let scoreColorClass = "text-muted-foreground";
                    if (j.status === "ao_vivo") {
                      scoreColorClass = "score-live-pulse font-mono font-bold";
                    } else if (j.placar_casa != null && j.placar_fora != null) {
                      if (palpite) {
                        const res = calcularPontosPalpite(palpite.gols_casa, palpite.gols_fora, j.placar_casa, j.placar_fora);
                        if (res.acertouPlacar) {
                          scoreColorClass = "text-gold font-mono font-bold drop-shadow-[0_0_10px_rgba(210,153,34,0.3)]";
                        } else if (res.acertouResultado) {
                          scoreColorClass = "text-primary font-mono font-bold";
                        } else {
                          scoreColorClass = "text-text-secondary font-mono font-semibold";
                        }
                      } else {
                        scoreColorClass = "text-text-secondary font-mono font-semibold";
                      }
                    }

                    // User prediction score indicator
                    let pointsBadge = null;
                    if (palpite && j.placar_casa != null && j.placar_fora != null) {
                      const res = calcularPontosPalpite(palpite.gols_casa, palpite.gols_fora, j.placar_casa, j.placar_fora);
                      if (res.acertouPlacar) {
                        pointsBadge = <Badge className="bg-gold/15 text-gold border border-gold/30 font-mono text-[9px] py-0 px-1.5 h-4.5">🎯 +3 pts</Badge>;
                      } else if (res.acertouResultado) {
                        pointsBadge = <Badge className="bg-primary/15 text-primary border border-primary/30 font-mono text-[9px] py-0 px-1.5 h-4.5">⚽ +1 pt</Badge>;
                      } else {
                        pointsBadge = <Badge variant="secondary" className="font-mono text-[9px] text-muted-foreground/60 border border-border/50 py-0 px-1.5 h-4.5">❌ 0 pts</Badge>;
                      }
                    }

                    return (
                      <Link key={j.id} to="/jogos/$id" params={{ id: j.id }}>
                        <Card className={`transition-all cursor-pointer active:scale-[0.99] border-border bg-card/60 backdrop-blur-sm shadow-card ${pendingPalpite ? "border-dashed border-primary/40 hover:border-primary/70" : "border hover:border-border-default"}`}>
                          <CardContent className="py-3 sm:py-4">
                            {/* Card Header metadata */}
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono mb-2">
                              <span className="truncate uppercase">{FASES_LABEL[j.fase]}</span>
                              <span className="shrink-0 font-bold ml-2 text-foreground">
                                {new Date(j.data_hora).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" })} HS
                              </span>
                            </div>

                            {/* Scoreboard block */}
                            <div className="flex items-center justify-between gap-2 my-1.5">
                              <div className="text-display text-sm sm:text-base flex-1 min-w-0 truncate">
                                {flag(j.time_casa)} {j.time_casa}
                              </div>
                              {j.placar_casa != null ? (
                                <div className={`text-xl sm:text-2xl shrink-0 px-2.5 py-0.5 rounded bg-secondary/25 border border-border/30 ${scoreColorClass}`}>
                                  {j.placar_casa} : {j.placar_fora}
                                </div>
                              ) : (
                                <div className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1 font-mono">
                                  {future ? (
                                    <>
                                      <Clock className="h-3 w-3" />
                                      {countdown(j.data_hora)}
                                    </>
                                  ) : "—"}
                                </div>
                              )}
                              <div className="text-display text-sm sm:text-base flex-1 min-w-0 truncate text-right">
                                {j.time_fora} {flag(j.time_fora)}
                              </div>
                            </div>

                            {/* Prediction indicators */}
                            <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {j.e_brasil && <Badge className="bg-gold-gradient text-black text-[9px] py-0 px-1.5 h-4.5 font-bold font-mono">Brasil</Badge>}
                                {j.status === "ao_vivo" && <Badge className="bg-destructive animate-pulse text-[9px] py-0 px-1.5 h-4.5 font-bold font-mono">AO VIVO</Badge>}
                                {j.status === "apurado" && <Badge variant="secondary" className="text-[9px] py-0 px-1.5 h-4.5 font-mono">Apurado</Badge>}
                                
                                {pendingPalpite && (
                                  <Badge className="bg-gold/10 text-gold border border-gold/20 font-mono text-[9px] py-0 px-1.5 h-4.5 font-semibold gap-1">
                                    <PenTool className="h-2.5 w-2.5" /> Palpite Pendente
                                  </Badge>
                                )}
                              </div>

                              {/* User Prediction summary inline */}
                              {palpite && (
                                <div className="flex items-center gap-1.5 text-xs">
                                  <span className="text-[10px] text-muted-foreground">Seu palpite:</span>
                                  <span className="font-mono font-bold text-foreground bg-secondary/35 border border-border/40 px-1.5 py-0.2 rounded text-[11px]">
                                    {palpite.gols_casa}×{palpite.gols_fora}
                                  </span>
                                  {pointsBadge}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
