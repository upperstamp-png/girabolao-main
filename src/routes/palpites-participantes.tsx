import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { supabase, fmtBRL, flag, countdown, getIdentidade } from "@/lib/bolao";
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
    (usuarios ?? []).forEach(u => map.set(u.id, 0));
    (premios ?? []).forEach(p => {
      if (p.usuario_id) {
        const val = map.get(p.usuario_id) ?? 0;
        map.set(p.usuario_id, val + Number(p.valor));
      }
    });
    return map;
  }, [usuarios, premios]);

  const bolaoFechado = useMemo(() => {
    if (config?.status === "FECHADO" || config?.status === "FINALIZADO") return true;
    if (primeiroJogo) {
      const kickoff = new Date(primeiroJogo.data_hora);
      const deadline = new Date(kickoff.getTime() - 60 * 60 * 1000);
      return new Date() >= deadline;
    }
    return false;
  }, [config, primeiroJogo]);

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
      <div>
        <h1 className="text-display text-3xl sm:text-4xl flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          📋 Palpites dos Participantes
        </h1>
        <p className="text-muted-foreground text-sm">
          Veja as apostas de cada um e compare as previsões para o campeonato.
        </p>
      </div>

      {/* STATUS HEADER CARD */}
      <Card className={`border ${bolaoFechado ? "bg-success/5 border-success/30" : isUrgent ? "bg-amber-500/5 border-amber-500/30" : "bg-card border-border"}`}>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${bolaoFechado ? "bg-success/15 text-success" : isUrgent ? "bg-amber-500/15 text-amber-500" : "bg-primary/10 text-primary"}`}>
              {bolaoFechado ? <Lock className="h-5 w-5" /> : <Unlock className="h-5 w-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {bolaoFechado ? "Bolão Oficialmente Fechado!" : "Bolão Aberto para Palpites"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {bolaoFechado
                  ? "Todos os palpites e escolhas especiais agora estão públicos para comparação."
                  : "Os palpites dos outros participantes ficarão ocultos até o encerramento do prazo."}
              </p>
            </div>
          </div>

          {!bolaoFechado && primeiroJogo && (
            <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg shrink-0 border border-border">
              <Timer className={`h-4 w-4 ${isUrgent ? "text-amber-500 animate-pulse" : "text-primary"}`} />
              <div className="text-right">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">Fecha em:</div>
                <div className={`font-mono font-bold text-sm sm:text-base ${isUrgent ? "text-amber-500" : "text-foreground"}`}>
                  {timeRemaining}
                </div>
              </div>
            </div>
          )}

          {bolaoFechado && (
            <Badge className="bg-success text-success-foreground font-semibold px-3 py-1 scale-105">
              Consulta Pública Liberada
            </Badge>
          )}
        </CardContent>
      </Card>

      {isLoading && <SkeletonCard lines={6} />}
      {errUs && <ErrorState message="Erro ao carregar dados dos participantes." onRetry={() => qc.invalidateQueries({ queryKey: ["usuarios-palpites"] })} />}

      {!isLoading && !errUs && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="usuario" className="py-2.5">👤 Por Participante</TabsTrigger>
            <TabsTrigger value="jogo" className="py-2.5">⚽ Por Jogo</TabsTrigger>
          </TabsList>

          {/* TAB: POR PARTICIPANTE */}
          <TabsContent value="usuario" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground shrink-0">Selecione o participante:</span>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full sm:max-w-xs">
                  <SelectValue placeholder="Participante" />
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
                {/* PARTICIPANTE ACUMULADO CARD */}
                <div className="md:col-span-1 space-y-4">
                  <Card className="bg-pitch border-border text-center overflow-hidden">
                    <CardHeader className="pb-1">
                      <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                      <CardTitle className="text-lg">{nomeMap.get(selectedUser) ?? "—"}</CardTitle>
                      <CardDescription>Pontuação Acumulada</CardDescription>
                    </CardHeader>
                    <CardContent className="py-4">
                      <div className="text-display text-3xl sm:text-4xl text-primary font-bold">
                        {fmtBRL(scoresMap.get(selectedUser) ?? 0)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Soma total obtida nas apurações
                      </div>
                    </CardContent>
                  </Card>

                  {/* APOSTAS ESPECIAIS CARD */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-amber-500" />
                        Apostas Especiais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="flex justify-between items-center py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Artilheiro:</span>
                        <span className="font-semibold">
                          {userEspeciais?.art?.revelado
                            ? userEspeciais.art.jogador_apostado || "Nenhum"
                            : bolaoFechado ? "Sem aposta" : "🔒 Oculto"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Campeão:</span>
                        <span className="font-semibold">
                          {userEspeciais?.cam?.revelado
                            ? (userEspeciais.cam.time_campeao ? `${flag(userEspeciais.cam.time_campeao)} ${userEspeciais.cam.time_campeao}` : "Nenhum")
                            : bolaoFechado ? "Sem aposta" : "🔒 Oculto"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Dois Finalistas:</span>
                        <span className="font-semibold text-right">
                          {userEspeciais?.fin?.revelado
                            ? (userEspeciais.fin.time1 && userEspeciais.fin.time2
                              ? `${flag(userEspeciais.fin.time1)} ${userEspeciais.fin.time1} × ${flag(userEspeciais.fin.time2)} ${userEspeciais.fin.time2}`
                              : "Nenhum")
                            : bolaoFechado ? "Sem aposta" : "🔒 Oculto"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5 border-b border-border">
                        <span className="text-muted-foreground">Zebra:</span>
                        <span className="font-semibold">
                          {userEspeciais?.zeb?.revelado
                            ? (userEspeciais.zeb.zebra_apostada ? `${flag(userEspeciais.zeb.zebra_apostada)} ${userEspeciais.zeb.zebra_apostada}` : "Nenhuma")
                            : bolaoFechado ? "Sem aposta" : "🔒 Oculto"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1.5">
                        <span className="text-muted-foreground">Maior Goleada:</span>
                        <span className="font-semibold text-right">
                          {userEspeciais?.gol?.revelado
                            ? (userEspeciais.gol.time_casa && userEspeciais.gol.time_fora
                              ? `${flag(userEspeciais.gol.time_casa)} ${userEspeciais.gol.time_casa} ${userEspeciais.gol.gols_casa}x${userEspeciais.gol.gols_fora} ${userEspeciais.gol.time_fora} ${flag(userEspeciais.gol.time_fora)}`
                              : "Nenhum")
                            : bolaoFechado ? "Sem aposta" : "🔒 Oculto"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* PALPITES DOS JOGOS */}
                <div className="md:col-span-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Palpites nos Jogos</CardTitle>
                      <CardDescription>Placares apostados pelo participante.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="table-scroll px-4 max-h-[500px]">
                        <table className="w-full text-sm">
                          <thead className="bg-secondary/40 sticky top-0 z-10">
                            <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                              <th className="py-2 text-left font-medium">Jogo</th>
                              <th className="py-2 text-center font-medium w-24">Palpite</th>
                              <th className="py-2 text-center font-medium w-24">Oficial</th>
                              <th className="py-2 text-right font-medium w-16">Acertou</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {(jogos ?? []).map(j => {
                              const p = userPalpites.find(palpite => palpite.jogo_id === j.id);
                              const gameLabel = `${flag(j.time_casa)} ${j.time_casa} vs ${j.time_fora} ${flag(j.time_fora)}`;

                              let palpString = "—";
                              if (p) {
                                palpString = p.revelado ? `${p.gols_casa} × ${p.gols_fora}` : "🔒 Oculto";
                              }

                              const oficialString = j.placar_casa != null && j.placar_fora != null
                                ? `${j.placar_casa} × ${j.placar_fora}`
                                : "Aguard.";

                              return (
                                <tr key={j.id} className="hover:bg-secondary/10">
                                  <td className="py-2.5 text-xs sm:text-sm">
                                    <div className="font-medium">{gameLabel}</div>
                                    <div className="text-[10px] text-muted-foreground">
                                      {new Date(j.data_hora).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                                    </div>
                                  </td>
                                  <td className="py-2.5 text-center font-mono font-bold">{palpString}</td>
                                  <td className="py-2.5 text-center font-mono text-muted-foreground text-xs">{oficialString}</td>
                                  <td className="py-2.5 text-right">
                                    {p?.revelado && j.status === "apurado" ? (
                                      p.acertou ? <Badge className="bg-success text-success-foreground scale-95">✓</Badge> : <span className="text-muted-foreground text-xs">✗</span>
                                    ) : "—"}
                                  </td>
                                </tr>
                              );
                            })}
                            {(jogos ?? []).length === 0 && (
                              <tr>
                                <td colSpan={4} className="text-center py-6 text-muted-foreground">
                                  Nenhum jogo cadastrado.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB: POR JOGO */}
          <TabsContent value="jogo" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground shrink-0">Selecione a partida:</span>
              <Select value={selectedJogo} onValueChange={setSelectedJogo}>
                <SelectTrigger className="w-full sm:max-w-md">
                  <SelectValue placeholder="Partida" />
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
                  <Card className="bg-secondary/15 border-border">
                    <CardHeader className="text-center pb-2">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">
                        {jogoEscolhidoObj.fase}
                      </div>
                      <CardTitle className="text-base sm:text-lg">
                        {flag(jogoEscolhidoObj.time_casa)} vs {flag(jogoEscolhidoObj.time_fora)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center pb-4 space-y-3">
                      <div className="text-display text-2xl font-bold flex justify-center items-center gap-4">
                        <span className="font-mono">{jogoEscolhidoObj.time_casa}</span>
                        <span className="bg-secondary/40 px-2 py-0.5 rounded text-lg">
                          {jogoEscolhidoObj.placar_casa ?? "—"}
                        </span>
                        <span>×</span>
                        <span className="bg-secondary/40 px-2 py-0.5 rounded text-lg">
                          {jogoEscolhidoObj.placar_fora ?? "—"}
                        </span>
                        <span className="font-mono">{jogoEscolhidoObj.time_fora}</span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-0.5">
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
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="h-5 w-5 text-primary" />
                        Palpites da Galera
                      </CardTitle>
                      <CardDescription>O que cada participante palpitou para este jogo.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="divide-y divide-border">
                        {(usuarios ?? []).map(u => {
                          const p = jogoPalpites.find(palpite => palpite.usuario_id === u.id);

                          let labelVal = "Sem palpite";
                          let acertou = false;

                          if (p) {
                            labelVal = p.revelado ? `${p.gols_casa} × ${p.gols_fora}` : "🔒 Oculto";
                            acertou = p.revelado && p.acertou === true;
                          }

                          return (
                            <div key={u.id} className="flex justify-between items-center py-2.5 text-sm">
                              <span className={`font-medium ${acertou ? "text-success font-bold" : ""}`}>
                                {u.nome} {u.id === identidadeLogada?.id ? "(Você)" : ""}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-semibold ${acertou ? "text-success font-bold text-base" : ""}`}>
                                  {labelVal}
                                </span>
                                {acertou && <Badge className="bg-success text-success-foreground scale-90">✓</Badge>}
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
      )}
    </div>
  );
}
