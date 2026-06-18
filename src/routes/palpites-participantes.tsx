import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { supabase, flag, countdown, getIdentidade, calcularPontosPalpite } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, Unlock, Timer, Trophy, Award } from "lucide-react";

export const Route = createFileRoute("/palpites-participantes")({
  head: () => ({
    meta: [
      { title: "Palpites dos Participantes — Bolão Copa 2026" },
      { name: "description", content: "Compare os palpites de todos os participantes do bolão." },
    ],
  }),
  component: Page,
});

function Page() {
  const [activeTab, setActiveTab] = useState<"usuario" | "jogo">("usuario");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedJogo, setSelectedJogo] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState(false);
  const identidadeLogada = getIdentidade();

  // ====== QUERIES ======
  const { data: config } = useQuery({
    queryKey: ["bolao-config"],
    queryFn: async () =>
      (await supabase.from("bolao_config").select("*").eq("id", 1).single()).data,
  });

  const { data: primeiroJogo } = useQuery({
    queryKey: ["primeiro-jogo"],
    queryFn: async () =>
      (
        await supabase
          .from("bolao_jogos")
          .select("data_hora")
          .order("data_hora", { ascending: true })
          .limit(1)
          .maybeSingle()
      ).data,
  });

  const {
    data: usuarios,
    isLoading: loadingUs,
    isError: errUs,
  } = useQuery({
    queryKey: ["usuarios-palpites"],
    queryFn: async () =>
      (
        await supabase
          .from("bolao_usuarios")
          .select("id, nome")
          .eq("excluido_manualmente", false)
          .order("nome")
      ).data ?? [],
  });

  const { data: jogos, isLoading: loadingJo } = useQuery({
    queryKey: ["jogos-palpites"],
    queryFn: async () =>
      (await supabase.from("bolao_jogos").select("*").order("data_hora", { ascending: true }))
        .data ?? [],
  });

  const { data: palpites, isLoading: loadingPa } = useQuery({
    queryKey: ["palpites-publicos-all"],
    queryFn: async () => (await supabase.from("bolao_palpites_publica").select("*")).data ?? [],
    refetchInterval: 30000,
  });

  const { data: apostasArt } = useQuery({
    queryKey: ["art-publicos-all"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_artilheiro_publica").select("*")).data ?? [],
  });
  const { data: apostasCam } = useQuery({
    queryKey: ["cam-publicos-all"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_campeao_publica").select("*")).data ?? [],
  });
  const { data: apostasFin } = useQuery({
    queryKey: ["fin-publicos-all"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_finalistas_publica").select("*")).data ?? [],
  });
  const { data: apostasZeb } = useQuery({
    queryKey: ["zeb-publicos-all"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_zebra_publica").select("*")).data ?? [],
  });
  const { data: apostasGol } = useQuery({
    queryKey: ["gol-publicos-all"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_goleada_publica").select("*")).data ?? [],
  });

  // ====== MAPS & MEMOS ======
  const nomeMap = useMemo(() => new Map((usuarios ?? []).map((u) => [u.id, u.nome])), [usuarios]);

  const scoresMap = useMemo(() => {
    const map = new Map<string, number>();
    const gamesMap = new Map((jogos ?? []).map((g) => [g.id, g]));

    (usuarios ?? []).forEach((u) => {
      let pontos = 0;
      const userPalpites = (palpites ?? []).filter((p) => p.usuario_id === u.id);
      for (const p of userPalpites) {
        const g = gamesMap.get(p.jogo_id as string);
        if (g && g.placar_casa != null && g.placar_fora != null) {
          pontos += calcularPontosPalpite(
            p.gols_casa,
            p.gols_fora,
            g.placar_casa,
            g.placar_fora,
          ).pontos;
        }
      }
      if (!!(apostasArt ?? []).find((a) => a.usuario_id === u.id)?.acertou) pontos += 10;
      const apostaFin = (apostasFin ?? []).find((a) => a.usuario_id === u.id);
      if (apostaFin) {
        if (apostaFin.acertou_os_dois) pontos += 10;
        else if (apostaFin.acertou_um) pontos += 5;
      }
      if (!!(apostasCam ?? []).find((c) => c.usuario_id === u.id)?.acertou) pontos += 10;
      if (!!(apostasZeb ?? []).find((z) => z.usuario_id === u.id)?.acertou) pontos += 10;
      if (!!(apostasGol ?? []).find((g) => g.usuario_id === u.id)?.acertou) pontos += 10;
      map.set(u.id, pontos);
    });
    return map;
  }, [usuarios, palpites, jogos, apostasArt, apostasFin, apostasCam, apostasZeb, apostasGol]);

  const bolaoFechado = useMemo(
    () => config?.status === "FECHADO" || config?.status === "FINALIZADO",
    [config],
  );

  useEffect(() => {
    if (usuarios && usuarios.length > 0 && !selectedUser) {
      const logado = usuarios.find((u) => u.nome === identidadeLogada?.nome);
      setSelectedUser(logado ? logado.id : usuarios[0].id);
    }
  }, [usuarios, identidadeLogada]);

  useEffect(() => {
    if (jogos && jogos.length > 0 && !selectedJogo) setSelectedJogo(jogos[0].id);
  }, [jogos]);

  // Countdown
  useEffect(() => {
    if (!primeiroJogo) return;
    const kickoff = new Date(primeiroJogo.data_hora);
    const deadline = new Date(kickoff.getTime() - 60 * 60 * 1000);
    const tick = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) {
        setTimeRemaining("Encerrado");
        setIsUrgent(false);
        return;
      }
      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setTimeRemaining(days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m ${secs}s`);
      setIsUrgent(days === 0 && hours < 12);
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [primeiroJogo]);

  const userPalpites = useMemo(() => {
    if (!selectedUser || !palpites) return [];
    return palpites.filter((p) => p.usuario_id === selectedUser);
  }, [selectedUser, palpites]);

  const userEspeciais = useMemo(() => {
    if (!selectedUser) return null;
    return {
      art: apostasArt?.find((a) => a.usuario_id === selectedUser),
      cam: apostasCam?.find((c) => c.usuario_id === selectedUser),
      fin: apostasFin?.find((f) => f.usuario_id === selectedUser),
      zeb: apostasZeb?.find((z) => z.usuario_id === selectedUser),
      gol: apostasGol?.find((g) => g.usuario_id === selectedUser),
    };
  }, [selectedUser, apostasArt, apostasCam, apostasFin, apostasZeb, apostasGol]);

  const jogoPalpites = useMemo(() => {
    if (!selectedJogo || !palpites) return [];
    return palpites.filter((p) => p.jogo_id === selectedJogo);
  }, [selectedJogo, palpites]);

  const jogoEscolhidoObj = useMemo(
    () => jogos?.find((j) => j.id === selectedJogo),
    [selectedJogo, jogos],
  );

  const isLoading = loadingUs || loadingJo || loadingPa;

  // Helper to compute points result
  function pontuarPalpite(pGolsCasa: number, pGolsFora: number, rCasa: number, rFora: number) {
    return calcularPontosPalpite(pGolsCasa, pGolsFora, rCasa, rFora);
  }

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-display text-2xl sm:text-3xl leading-none">Palpites</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            Compare as previsões de todos os participantes
          </p>
        </div>
      </div>

      {/* Status banner */}
      <div
        className={`flex items-center justify-between p-3 rounded-xl border text-xs gap-3 ${
          bolaoFechado
            ? "bg-green-500/5 border-green-500/20 text-green-400"
            : isUrgent
              ? "bg-amber-500/5 border-amber-500/20 text-amber-400"
              : "bg-primary/5 border-primary/20 text-primary"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {bolaoFechado ? (
            <Lock className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Unlock className="h-3.5 w-3.5 shrink-0" />
          )}
          <span className="font-semibold text-foreground truncate">
            {bolaoFechado ? "Bolão Fechado" : "Bolão Aberto para Palpites"}
          </span>
        </div>
        {!bolaoFechado && primeiroJogo && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 border border-border shrink-0 font-mono text-[11px] font-bold text-foreground">
            <Timer
              className={`h-3.5 w-3.5 ${isUrgent ? "text-amber-500 animate-pulse" : "text-primary"}`}
            />
            <span>Fecha em: {timeRemaining}</span>
          </div>
        )}
      </div>

      {/* Points legend */}
      <div className="grid grid-cols-3 gap-2">
        {[
          {
            emoji: "🎯",
            label: "Placar Exato",
            pts: "+3 pts",
            color: "border-yellow-500/30 bg-yellow-500/5 text-yellow-400",
          },
          {
            emoji: "⚽",
            label: "Vencedor/Empate",
            pts: "+1 pt",
            color: "border-primary/30 bg-primary/5 text-primary",
          },
          {
            emoji: "❌",
            label: "Errou",
            pts: "0 pts",
            color: "border-border bg-secondary/10 text-muted-foreground",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center ${item.color}`}
          >
            <span className="text-lg leading-none">{item.emoji}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span>
            <span className="font-mono font-bold text-xs">{item.pts}</span>
          </div>
        ))}
      </div>

      {isLoading && <SkeletonCard lines={6} />}
      {errUs && (
        <ErrorState message="Erro ao carregar dados dos participantes." onRetry={() => {}} />
      )}

      {!isLoading && !errUs && (
        <div className="space-y-4">
          {/* Pill segment switcher */}
          <div className="flex p-1 rounded-xl bg-secondary/30 border border-border gap-1">
            {[
              { key: "usuario" as const, label: "👤 Por Participante" },
              { key: "jogo" as const, label: "⚽ Por Jogo" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB: POR PARTICIPANTE */}
          {activeTab === "usuario" && (
            <div className="space-y-4">
              {/* User selector */}
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full h-10 bg-secondary/20 border-border">
                  <SelectValue placeholder="Selecione o participante" />
                </SelectTrigger>
                <SelectContent>
                  {usuarios?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome} {u.id === identidadeLogada?.id ? "• Você" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedUser && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Score + special bets */}
                  <div className="space-y-3">
                    {/* Score card */}
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
                      <Award className="h-5 w-5 text-primary mx-auto mb-1.5" />
                      <div className="text-display text-3xl text-primary font-bold">
                        {scoresMap.get(selectedUser) ?? 0}
                      </div>
                      <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">
                        pontos totais
                      </div>
                      <div className="text-sm font-bold text-foreground mt-2">
                        {nomeMap.get(selectedUser) ?? "—"}
                      </div>
                    </div>

                    {/* Special bets */}
                    <Card className="border-border">
                      <CardHeader className="py-2.5 px-3 border-b border-border/30">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          Apostas Especiais
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: "⚽ Artilheiro", value: userEspeciais?.art?.jogador_apostado },
                          {
                            label: "🥇 Campeão",
                            value: userEspeciais?.cam?.time_campeao
                              ? `${flag(userEspeciais.cam.time_campeao)} ${userEspeciais.cam.time_campeao}`
                              : null,
                          },
                          {
                            label: "🏆 Finalistas",
                            span: true,
                            value:
                              userEspeciais?.fin?.time1 && userEspeciais?.fin?.time2
                                ? `${flag(userEspeciais.fin.time1)} ${userEspeciais.fin.time1} × ${flag(userEspeciais.fin.time2)} ${userEspeciais.fin.time2}`
                                : null,
                          },
                          {
                            label: "🦓 Zebra",
                            value: userEspeciais?.zeb?.zebra_apostada
                              ? `${flag(userEspeciais.zeb.zebra_apostada)} ${userEspeciais.zeb.zebra_apostada}`
                              : null,
                          },
                          {
                            label: "🔥 Goleada",
                            value:
                              userEspeciais?.gol?.time_casa && userEspeciais?.gol?.time_fora
                                ? `${flag(userEspeciais.gol.time_casa)} ${userEspeciais.gol.gols_casa}×${userEspeciais.gol.gols_fora} ${flag(userEspeciais.gol.time_fora)}`
                                : null,
                          },
                        ].map((item: any) => (
                          <div
                            key={item.label}
                            className={`p-2 rounded-lg border border-border/30 bg-secondary/10 flex flex-col gap-0.5 ${item.span ? "col-span-2" : ""}`}
                          >
                            <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold">
                              {item.label}
                            </span>
                            <span className="font-semibold text-[11px] truncate">
                              {item.value || "—"}
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Match predictions */}
                  <div className="md:col-span-2">
                    <Card className="border-border h-full">
                      <CardHeader className="py-2.5 px-3 border-b border-border/30">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Palpites nos Jogos
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
                          {(jogos ?? []).map((j) => {
                            const p = userPalpites.find((pal) => pal.jogo_id === j.id);
                            const palpStr = p ? `${p.gols_casa} × ${p.gols_fora}` : "—";
                            const oficialStr =
                              j.placar_casa != null && j.placar_fora != null
                                ? `${j.placar_casa} × ${j.placar_fora}`
                                : "–";

                            let badge = null;
                            if (p && j.placar_casa != null && j.placar_fora != null) {
                              const rCasa: number = j.placar_casa;
                              const rFora: number = j.placar_fora;
                              const res = pontuarPalpite(p.gols_casa as number, p.gols_fora as number, rCasa, rFora);
                              if (res.acertouPlacar)
                                badge = {
                                  text: "🎯 +3",
                                  cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
                                };
                              else if (res.acertouResultado)
                                badge = {
                                  text: "⚽ +1",
                                  cls: "bg-primary/15 text-primary border-primary/30",
                                };
                              else
                                badge = {
                                  text: "❌ 0",
                                  cls: "bg-secondary/30 text-muted-foreground border-border",
                                };
                            }

                            return (
                              <div
                                key={j.id}
                                className="flex items-center gap-2 p-2.5 rounded-xl border border-border/30 hover:bg-secondary/15 transition-all text-xs"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold truncate flex items-center gap-1">
                                    <span>{flag(j.time_casa)}</span>
                                    <span className="truncate">{j.time_casa}</span>
                                    <span className="text-muted-foreground mx-0.5">vs</span>
                                    <span className="truncate">{j.time_fora}</span>
                                    <span>{flag(j.time_fora)}</span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground">
                                    {new Date(j.data_hora).toLocaleDateString("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right">
                                    <div className="text-[9px] text-muted-foreground uppercase font-bold">
                                      Palpite
                                    </div>
                                    <div className="font-mono font-bold">{palpStr}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-[9px] text-muted-foreground uppercase font-bold">
                                      Placar
                                    </div>
                                    <div className="font-mono text-[11px] text-muted-foreground bg-secondary/30 px-1.5 py-0.5 rounded">
                                      {oficialStr}
                                    </div>
                                  </div>
                                  <div className="w-12 text-right">
                                    {badge ? (
                                      <span
                                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.cls}`}
                                      >
                                        {badge.text}
                                      </span>
                                    ) : p ? (
                                      <span className="text-[9px] text-muted-foreground italic">
                                        Aguard.
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {(jogos ?? []).length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-8">
                              Nenhum jogo cadastrado.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: POR JOGO */}
          {activeTab === "jogo" && (
            <div className="space-y-4">
              {/* Match selector */}
              <Select value={selectedJogo} onValueChange={setSelectedJogo}>
                <SelectTrigger className="w-full h-10 bg-secondary/20 border-border">
                  <SelectValue placeholder="Selecione a partida" />
                </SelectTrigger>
                <SelectContent>
                  {jogos?.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {flag(j.time_casa)} {j.time_casa} vs {j.time_fora} {flag(j.time_fora)} (
                      {new Date(j.data_hora).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                      })}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedJogo && jogoEscolhidoObj && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Match details */}
                  <div>
                    <Card className="border-border text-center">
                      <CardHeader className="pb-2 pt-4">
                        <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                          {jogoEscolhidoObj.fase}
                        </div>
                        <div className="flex items-center justify-center gap-3 text-2xl">
                          <span>{flag(jogoEscolhidoObj.time_casa)}</span>
                          <div className="flex items-center gap-1 font-mono font-bold text-xl bg-secondary/30 px-3 py-1 rounded-lg">
                            <span>{jogoEscolhidoObj.placar_casa ?? "—"}</span>
                            <span className="text-muted-foreground text-sm">×</span>
                            <span>{jogoEscolhidoObj.placar_fora ?? "—"}</span>
                          </div>
                          <span>{flag(jogoEscolhidoObj.time_fora)}</span>
                        </div>
                        <div className="text-xs font-semibold mt-1">
                          {jogoEscolhidoObj.time_casa} vs {jogoEscolhidoObj.time_fora}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-4 text-[10px] text-muted-foreground space-y-0.5">
                        <div>{jogoEscolhidoObj.estadio || "Estádio a confirmar"}</div>
                        <div>
                          {new Date(jogoEscolhidoObj.data_hora).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* All predictions for this match */}
                  <div className="md:col-span-2">
                    <Card className="border-border h-full">
                      <CardHeader className="py-2.5 px-3 border-b border-border/30">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                          Palpites da Galera
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[480px] overflow-y-auto pr-1">
                          {(usuarios ?? []).map((u) => {
                            const p = jogoPalpites.find((pal) => pal.usuario_id === u.id);
                            let badge = null;
                            let labelVal = "Sem palpite";
                            if (p) {
                              labelVal = `${p.gols_casa} × ${p.gols_fora}`;
                              if (
                                jogoEscolhidoObj.placar_casa != null &&
                                jogoEscolhidoObj.placar_fora != null
                              ) {
                                const rCasa: number = jogoEscolhidoObj.placar_casa;
                                const rFora: number = jogoEscolhidoObj.placar_fora;
                                const res = pontuarPalpite(p.gols_casa as number, p.gols_fora as number, rCasa, rFora);
                                if (res.acertouPlacar)
                                  badge = {
                                    text: "🎯 +3",
                                    cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
                                  };
                                else if (res.acertouResultado)
                                  badge = {
                                    text: "⚽ +1",
                                    cls: "bg-primary/15 text-primary border-primary/30",
                                  };
                                else
                                  badge = {
                                    text: "❌ 0",
                                    cls: "bg-secondary/30 text-muted-foreground border-border",
                                  };
                              }
                            }
                            const isMe = u.id === identidadeLogada?.id;
                            return (
                              <div
                                key={u.id}
                                className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                                  isMe
                                    ? "border-primary/40 bg-primary/5"
                                    : "border-border/30 hover:bg-secondary/15"
                                }`}
                              >
                                <span
                                  className={`font-semibold truncate mr-2 ${isMe ? "text-primary" : "text-foreground"}`}
                                >
                                  {u.nome}
                                  {isMe ? " • Você" : ""}
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono font-bold bg-secondary/30 px-2 py-0.5 rounded text-[11px]">
                                    {labelVal}
                                  </span>
                                  {badge ? (
                                    <span
                                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.cls}`}
                                    >
                                      {badge.text}
                                    </span>
                                  ) : p ? (
                                    <span className="text-[9px] text-muted-foreground italic">
                                      Aguard.
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
