import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { supabase, flag, countdown, getIdentidade, calcularPontosPalpite } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Users, Lock, Unlock, Timer, Trophy, ShieldAlert, Award, Star } from "lucide-react";

export const Route = createFileRoute("/palpites-participantes")({
  head: () => ({
    meta: [
      { title: "Palpites dos Participantes — Bolão Copa 2026" },
      { name: "description", content: "Compare os palpites de todos os participantes do bolão." }
    ]
  }),
  component: Page,
});

function Page() {
  const [activeTab, setActiveTab] = useState("usuario");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedJogo, setSelectedJogo] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isUrgent, setIsUrgent] = useState(false);
  const identidadeLogada = getIdentidade();

  // ====== QUERIES ======
  const { data: config } = useQuery({
    queryKey: ["bolao-config"],
    queryFn: async () => (await supabase.from("bolao_config").select("*").eq("id", 1).single()).data,
  });

  const { data: primeiroJogo } = useQuery({
    queryKey: ["primeiro-jogo"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("data_hora").order("data_hora", { ascending: true }).limit(1).maybeSingle()).data,
  });

  const { data: usuarios, isLoading: loadingUs, isError: errUs } = useQuery({
    queryKey: ["usuarios-palpites"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("nome")).data ?? [],
  });

  const { data: jogos, isLoading: loadingJo } = useQuery({
    queryKey: ["jogos-palpites"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*").order("data_hora", { ascending: true })).data ?? [],
  });

  const { data: palpites, isLoading: loadingPa } = useQuery({
    queryKey: ["palpites-publicos-all"],
    queryFn: async () => (await supabase.from("bolao_palpites_publica").select("*")).data ?? [],
    refetchInterval: 30000,
  });

  // Especial bets public views
  const { data: apostasArt } = useQuery({
    queryKey: ["art-publicos-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_artilheiro_publica").select("*")).data ?? [],
  });
  const { data: apostasCam } = useQuery({
    queryKey: ["cam-publicos-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_campeao_publica").select("*")).data ?? [],
  });
  const { data: apostasFin } = useQuery({
    queryKey: ["fin-publicos-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_finalistas_publica").select("*")).data ?? [],
  });
  const { data: apostasZeb } = useQuery({
    queryKey: ["zeb-publicos-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_zebra_publica").select("*")).data ?? [],
  });
  const { data: apostasGol } = useQuery({
    queryKey: ["gol-publicos-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_goleada_publica").select("*")).data ?? [],
  });
  const { data: premios } = useQuery({
    queryKey: ["premios-comparison"],
    queryFn: async () => (await supabase.from("bolao_premios").select("*")).data ?? [],
  });

  // ====== MAPS & MEMOS ======
  const nomeMap = useMemo(() => new Map((usuarios ?? []).map(u => [u.id, u.nome])), [usuarios]);

  const scoresMap = useMemo(() => {
    const map = new Map<string, number>();
    const gamesMap = new Map((jogos ?? []).map(g => [g.id, g]));

    (usuarios ?? []).forEach(u => {
      let pontos = 0;

      // 1. Calculate points from match predictions (palpites)
      const userPalpites = (palpites ?? []).filter(p => p.usuario_id === u.id);
      for (const p of userPalpites) {
        const g = gamesMap.get(p.jogo_id);
        if (g && g.placar_casa != null && g.placar_fora != null) {
          const res = calcularPontosPalpite(p.gols_casa, p.gols_fora, g.placar_casa, g.placar_fora);
          pontos += res.pontos;
        }
      }

      // 2. Points from special bets
      const acertouArt = !!(apostasArt ?? []).find(a => a.usuario_id === u.id)?.acertou;
      if (acertouArt) pontos += 10;

      const apostaFin = (apostasFin ?? []).find(a => a.usuario_id === u.id);
      if (apostaFin) {
        if (apostaFin.acertou_os_dois) pontos += 10;
        else if (apostaFin.acertou_um) pontos += 5;
      }

      const acertouCam = !!(apostasCam ?? []).find(c => c.usuario_id === u.id)?.acertou;
      if (acertouCam) pontos += 10;

      const acertouZeb = !!(apostasZeb ?? []).find(z => z.usuario_id === u.id)?.acertou;
      if (acertouZeb) pontos += 10;

      const acertouGol = !!(apostasGol ?? []).find(g => g.usuario_id === u.id)?.acertou;
      if (acertouGol) pontos += 10;

      map.set(u.id, pontos);
    });

    return map;
  }, [usuarios, palpites, jogos, apostasArt, apostasFin, apostasCam, apostasZeb, apostasGol]);

  const bolaoFechado = useMemo(() => {
    return config?.status === "FECHADO" || config?.status === "FINALIZADO";
  }, [config]);

  // Set default selection when data loads
  useEffect(() => {
    if (usuarios && usuarios.length > 0 && !selectedUser) {
      const logado = usuarios.find(u => u.nome === identidadeLogada?.nome);
      setSelectedUser(logado ? logado.id : usuarios[0].id);
    }
  }, [usuarios, identidadeLogada]);

  useEffect(() => {
    if (jogos && jogos.length > 0 && !selectedJogo) {
      setSelectedJogo(jogos[0].id);
    }
  }, [jogos]);

  // ====== COUNTDOWN CLOCK TIMER ======
  useEffect(() => {
    if (!primeiroJogo) return;
    const kickoff = new Date(primeiroJogo.data_hora);
    const deadline = new Date(kickoff.getTime() - 60 * 60 * 1000); // 1h antes

    const tick = () => {
      const now = new Date().getTime();
      const diff = deadline.getTime() - now;

      if (diff <= 0) {
        setTimeRemaining("Encerrado");
        setIsUrgent(false);
      } else {
        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        if (days > 0) {
          setTimeRemaining(`${days}d ${hours}h ${minutes}m`);
          setIsUrgent(false);
        } else {
          setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
          setIsUrgent(hours < 12); // Destacar urgente abaixo de 12 horas
        }
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [primeiroJogo]);

  // ====== FILTER PALPITES BY CHOSEN USER ======
  const userPalpites = useMemo(() => {
    if (!selectedUser || !palpites) return [];
    return palpites.filter(p => p.usuario_id === selectedUser);
  }, [selectedUser, palpites]);

  const userEspeciais = useMemo(() => {
    if (!selectedUser) return null;
    const art = apostasArt?.find(a => a.usuario_id === selectedUser);
    const cam = apostasCam?.find(c => c.usuario_id === selectedUser);
    const fin = apostasFin?.find(f => f.usuario_id === selectedUser);
    const zeb = apostasZeb?.find(z => z.usuario_id === selectedUser);
    const gol = apostasGol?.find(g => g.usuario_id === selectedUser);
    return { art, cam, fin, zeb, gol };
  }, [selectedUser, apostasArt, apostasCam, apostasFin, apostasZeb, apostasGol]);

  // ====== FILTER PALPITES BY CHOSEN MATCH ======
  const jogoPalpites = useMemo(() => {
    if (!selectedJogo || !palpites) return [];
    return palpites.filter(p => p.jogo_id === selectedJogo);
  }, [selectedJogo, palpites]);

  const jogoEscolhidoObj = useMemo(() => {
    return jogos?.find(j => j.id === selectedJogo);
  }, [selectedJogo, jogos]);

  const isLoading = loadingUs || loadingJo || loadingPa;
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl sm:text-4xl flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            📋 Palpites dos Participantes
          </h1>
          <p className="text-muted-foreground text-sm">
            Compare as previsões de todos os participantes e veja quem está acertando.
          </p>
        </div>
      </div>

      {/* STATUS HEADER CARD */}
      <div className={`flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-xl border text-xs gap-3 ${bolaoFechado ? "bg-success/5 border-success/20 text-success" : isUrgent ? "bg-amber-500/5 border-amber-500/20" : "bg-primary/5 border-primary/20 text-primary"}`}>
        <div className="flex items-center gap-2">
          {bolaoFechado ? <Lock className="h-4 w-4 shrink-0" /> : <Unlock className="h-4 w-4 shrink-0" />}
          <span className="font-semibold text-foreground">
            {bolaoFechado ? "Bolão Oficialmente Fechado" : "Bolão Aberto para Palpites"}
          </span>
          <span className="text-muted-foreground/80 hidden sm:inline">• Todos os palpites são públicos e auditados.</span>
        </div>

        {!bolaoFechado && primeiroJogo && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/50 border border-border shrink-0 font-mono text-[11px] font-semibold text-foreground">
            <Timer className={`h-3.5 w-3.5 ${isUrgent ? "text-amber-500 animate-pulse" : "text-primary"}`} />
            <span>Fecha em: {timeRemaining}</span>
          </div>
        )}
      </div>

      {isLoading && <SkeletonCard lines={6} />}
      {errUs && <ErrorState message="Erro ao carregar dados dos participantes." onRetry={() => {}} />}

      {!isLoading && !errUs && (
        <div className="space-y-4 w-full">
          {/* LEGENDA DE PONTUAÇÃO BANNER */}
          <div className="py-1 px-2 text-[10px] text-muted-foreground/80 flex flex-wrap gap-x-4 gap-y-1 justify-center items-center border-b border-border/20 pb-2">
            <span className="font-semibold uppercase tracking-wider text-[9px]">Legenda:</span>
            <span className="flex items-center gap-1">🎯 Placar Exato = 3 pts</span>
            <span className="flex items-center gap-1">⚽ Vencedor/Empate = 1 pt</span>
            <span className="flex items-center gap-1">❌ Erro = 0 pts</span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/35 p-1 rounded-xl max-w-md mx-auto">
              <TabsTrigger value="usuario" className="py-2 rounded-lg">👤 Por Participante</TabsTrigger>
              <TabsTrigger value="jogo" className="py-2 rounded-lg">⚽ Por Jogo</TabsTrigger>
            </TabsList>

            {/* TAB: POR PARTICIPANTE */}
            <TabsContent value="usuario" className="space-y-4 mt-6">
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Participante:</span>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-full sm:max-w-xs h-9">
                    <SelectValue placeholder="Selecione o participante" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuarios?.map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nome} {u.id === identidadeLogada?.id ? "(Você)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedUser && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* PARTICIPANTE ACUMULADO & ESPECIAIS CARD */}
                  <div className="md:col-span-1 space-y-4">
                    <Card className="bg-pitch border-border text-center overflow-hidden shadow-sm">
                      <CardHeader className="pb-1 pt-4">
                        <Award className="h-6 w-6 text-primary mx-auto mb-1" />
                        <CardTitle className="text-base font-bold">{nomeMap.get(selectedUser) ?? "—"}</CardTitle>
                        <CardDescription className="text-xs">Pontuação Acumulada</CardDescription>
                      </CardHeader>
                      <CardContent className="py-3">
                        <div className="text-display text-3xl text-primary font-bold">
                          {scoresMap.get(selectedUser) ?? 0} pts
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Soma total obtida no ranking
                        </div>
                      </CardContent>
                    </Card>

                    {/* APOSTAS ESPECIAIS */}
                    <Card className="border-border shadow-sm">
                      <CardHeader className="py-3 px-4 border-b border-border/20 bg-secondary/5">
                        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5 text-amber-500" />
                          Escolhas Especiais
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-3 grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 rounded-lg border border-border/40 bg-secondary/5 flex flex-col gap-0.5">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">⚽ Artilheiro</span>
                          <span className="font-semibold truncate text-[11px]">{userEspeciais?.art?.jogador_apostado || "—"}</span>
                        </div>
                        <div className="p-2 rounded-lg border border-border/40 bg-secondary/5 flex flex-col gap-0.5">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">🥇 Campeão</span>
                          <span className="font-semibold truncate text-[11px]">
                            {userEspeciais?.cam?.time_campeao
                              ? `${flag(userEspeciais.cam.time_campeao)} ${userEspeciais.cam.time_campeao}`
                              : "—"}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg border border-border/40 bg-secondary/5 flex flex-col gap-0.5 col-span-2">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">🏆 Dois Finalistas</span>
                          <span className="font-semibold truncate text-[11px]">
                            {userEspeciais?.fin?.time1 && userEspeciais?.fin?.time2
                              ? `${flag(userEspeciais.fin.time1)} ${userEspeciais.fin.time1} × ${flag(userEspeciais.fin.time2)} ${userEspeciais.fin.time2}`
                              : "—"}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg border border-border/40 bg-secondary/5 flex flex-col gap-0.5">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">🦓 Zebra</span>
                          <span className="font-semibold truncate text-[11px]">
                            {userEspeciais?.zeb?.zebra_apostada
                              ? `${flag(userEspeciais.zeb.zebra_apostada)} ${userEspeciais.zeb.zebra_apostada}`
                              : "—"}
                          </span>
                        </div>
                        <div className="p-2 rounded-lg border border-border/40 bg-secondary/5 flex flex-col gap-0.5">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">🔥 Goleada</span>
                          <span className="font-semibold truncate text-[11px]">
                            {userEspeciais?.gol?.time_casa && userEspeciais?.gol?.time_fora
                              ? `${flag(userEspeciais.gol.time_casa)} ${userEspeciais.gol.time_casa} ${userEspeciais.gol.gols_casa}x${userEspeciais.gol.gols_fora} ${userEspeciais.gol.time_fora}`
                              : "—"}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* PALPITES DOS JOGOS */}
                  <div className="md:col-span-2">
                    <Card className="border-border shadow-sm">
                      <CardHeader className="py-3 px-4 border-b border-border/20 bg-secondary/5 flex justify-between items-center flex-row">
                        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Palpites nos Jogos</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                          {(jogos ?? []).map(j => {
                            const p = userPalpites.find(palpite => palpite.jogo_id === j.id);
                            const gameLabel = `${flag(j.time_casa)} ${j.time_casa} vs ${j.time_fora} ${flag(j.time_fora)}`;

                            let palpString = "—";
                            if (p) {
                              palpString = `${p.gols_casa} × ${p.gols_fora}`;
                            }

                            const oficialString = j.placar_casa != null && j.placar_fora != null
                              ? `${j.placar_casa} × ${j.placar_fora}`
                              : "Aguardando";

                            let pointsText = "";
                            let badgeColor = "";
                            let isCalculated = false;

                            if (p && j.placar_casa != null && j.placar_fora != null) {
                              isCalculated = true;
                              const res = calcularPontosPalpite(p.gols_casa, p.gols_fora, j.placar_casa, j.placar_fora);
                              if (res.acertouPlacar) {
                                pointsText = "🎯 +3";
                                badgeColor = "bg-success text-success-foreground font-bold border-0";
                              } else if (res.acertouResultado) {
                                pointsText = "⚽ +1";
                                badgeColor = "bg-primary/20 text-primary border border-primary/30";
                              } else {
                                pointsText = "❌ 0";
                                badgeColor = "bg-secondary text-muted-foreground border-0";
                              }
                            }

                            return (
                              <div key={j.id} className="flex items-center justify-between p-2.5 rounded-xl border border-border/40 hover:bg-secondary/20 transition-all gap-3 text-xs">
                                {/* Confronto */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 font-bold truncate">
                                    <span>{flag(j.time_casa)} {j.time_casa}</span>
                                    <span className="text-muted-foreground text-[10px]">vs</span>
                                    <span>{j.time_fora} {flag(j.time_fora)}</span>
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-0.5">
                                    {new Date(j.data_hora).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                                  </div>
                                </div>

                                {/* Pontuações / Palpites */}
                                <div className="flex items-center gap-4 shrink-0">
                                  <div className="text-right">
                                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Palpite</div>
                                    <div className="font-mono font-bold">{palpString}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Placar</div>
                                    <div className="font-mono text-[11px] text-muted-foreground bg-secondary/35 px-1.5 py-0.5 rounded">{oficialString}</div>
                                  </div>
                                  <div className="w-12 text-right">
                                    {isCalculated ? (
                                      <Badge className={`${badgeColor} text-[10px] py-0.5 px-1.5 shrink-0`}>
                                        {pointsText}
                                      </Badge>
                                    ) : p ? (
                                      <span className="text-muted-foreground text-[9px] italic shrink-0">Aguardando</span>
                                    ) : (
                                      "—"
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {(jogos ?? []).length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-6">Nenhum jogo cadastrado.</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB: POR JOGO */}
            <TabsContent value="jogo" className="space-y-4 mt-6">
              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Partida:</span>
                <Select value={selectedJogo} onValueChange={setSelectedJogo}>
                  <SelectTrigger className="w-full sm:max-w-md h-9">
                    <SelectValue placeholder="Selecione a partida" />
                  </SelectTrigger>
                  <SelectContent>
                    {jogos?.map(j => (
                      <SelectItem key={j.id} value={j.id}>
                        {flag(j.time_casa)} {j.time_casa} vs {j.time_fora} {flag(j.time_fora)} ({new Date(j.data_hora).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedJogo && jogoEscolhidoObj && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* JOGO DETALHES CARD */}
                  <div className="md:col-span-1 space-y-4">
                    <Card className="bg-secondary/15 border-border shadow-sm">
                      <CardHeader className="text-center pb-2 pt-4">
                        <div className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">
                          {jogoEscolhidoObj.fase}
                        </div>
                        <CardTitle className="text-sm font-bold flex items-center justify-center gap-1.5">
                          {flag(jogoEscolhidoObj.time_casa)} vs {flag(jogoEscolhidoObj.time_fora)}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center pb-4 space-y-2">
                        <div className="text-display text-xl font-bold flex justify-center items-center gap-2">
                          <span className="truncate max-w-24 text-xs font-semibold">{jogoEscolhidoObj.time_casa}</span>
                          <span className="bg-secondary/40 px-2 py-0.5 rounded text-sm font-mono">
                            {jogoEscolhidoObj.placar_casa ?? "—"}
                          </span>
                          <span>×</span>
                          <span className="bg-secondary/40 px-2 py-0.5 rounded text-sm font-mono">
                            {jogoEscolhidoObj.placar_fora ?? "—"}
                          </span>
                          <span className="truncate max-w-24 text-xs font-semibold">{jogoEscolhidoObj.time_fora}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground space-y-0.5">
                          <div>{jogoEscolhidoObj.estadio || "Estádio pendente"}</div>
                          <div>
                            {new Date(jogoEscolhidoObj.data_hora).toLocaleString("pt-BR", {
                              day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* COMPARAÇÃO DOS PALPITES */}
                  <div className="md:col-span-2">
                    <Card className="border-border shadow-sm">
                      <CardHeader className="py-3 px-4 border-b border-border/20 bg-secondary/5">
                        <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Palpites da Galera</CardTitle>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto pr-1">
                          {(usuarios ?? []).map(u => {
                            const p = jogoPalpites.find(palpite => palpite.usuario_id === u.id);

                            let labelVal = "Sem palpite";
                            let isCalculated = false;
                            let pointsText = "";
                            let badgeColor = "";

                            if (p) {
                              labelVal = `${p.gols_casa} × ${p.gols_fora}`;
                              if (jogoEscolhidoObj.placar_casa != null && jogoEscolhidoObj.placar_fora != null) {
                                isCalculated = true;
                                const res = calcularPontosPalpite(p.gols_casa, p.gols_fora, jogoEscolhidoObj.placar_casa, jogoEscolhidoObj.placar_fora);
                                if (res.acertouPlacar) {
                                  pointsText = "🎯 +3";
                                  badgeColor = "bg-success text-success-foreground font-bold border-0";
                                } else if (res.acertouResultado) {
                                  pointsText = "⚽ +1";
                                  badgeColor = "bg-primary/20 text-primary border border-primary/30";
                                } else {
                                  pointsText = "❌ 0";
                                  badgeColor = "bg-secondary text-muted-foreground border-0";
                                }
                              }
                            }

                            return (
                              <div key={u.id} className="flex justify-between items-center p-2.5 rounded-xl border border-border/40 hover:bg-secondary/20 transition-all text-xs">
                                <span className="font-semibold text-muted-foreground/90 truncate mr-2">
                                  {u.nome} {u.id === identidadeLogada?.id ? <span className="text-[10px] text-primary font-bold">(Você)</span> : ""}
                                </span>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono font-bold bg-secondary/35 px-2 py-0.5 rounded text-[11px]">
                                    {labelVal}
                                  </span>
                                  {isCalculated ? (
                                    <Badge className={`${badgeColor} text-[9px] py-0.5 px-1.5 shrink-0`}>
                                      {pointsText}
                                    </Badge>
                                  ) : p ? (
                                    <span className="text-[9px] text-muted-foreground italic shrink-0">Aguardando</span>
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
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}
