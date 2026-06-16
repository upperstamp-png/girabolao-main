import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase, callFn, fmtBRL, flag, countdown } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { IdentidadePicker, type Identidade } from "@/components/IdentidadePicker";
import { Trophy, Users, Medal, Sparkles, AlertTriangle, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/apostas-especiais")({
  head: () => ({
    meta: [
      { title: "Apostas Especiais — Bolão Copa 2026" },
      { name: "description", content: "Apostas especiais do Bolão: Artilheiro, Finalistas, Campeão, Zebra e Maior Goleada." }
    ]
  }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [identidade, setIdentidade] = useState<Identidade | null>(null);

  // States for forms
  const [artilheiro, setArtilheiro] = useState("");
  const [selectedSelecaoId, setSelectedSelecaoId] = useState<string>("");
  const [jogadorSearch, setJogadorSearch] = useState<string>("");
  const [selectedJogadorId, setSelectedJogadorId] = useState<string>("");

  const [fin1, setFin1] = useState("");
  const [fin2, setFin2] = useState("");
  const [campeao, setCampeao] = useState("");
  const [zebra, setZebra] = useState("");
  const [golCasa, setGolCasa] = useState("");
  const [golFora, setGolFora] = useState("");
  const [golGolsCasa, setGolGolsCasa] = useState(0);
  const [golGolsFora, setGolGolsFora] = useState(0);


  // ====== QUERIES ======
  const { data: config } = useQuery({
    queryKey: ["bolao-config"],
    queryFn: async () => (await supabase.from("bolao_config").select("*").eq("id", 1).single()).data,
  });

  const { data: primeiroJogo } = useQuery({
    queryKey: ["primeiro-jogo-cfg"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("data_hora").order("data_hora", { ascending: true }).limit(1).maybeSingle()).data,
  });

  const { data: selecoes } = useQuery({
    queryKey: ["selecoes-especiais"],
    queryFn: async () => (await supabase.from("bolao_selecoes").select("id, nome").order("nome")).data ?? [],
  });

  const { data: elenco, isLoading: loadingElenco } = useQuery({
    queryKey: ["elenco-especial", selectedSelecaoId],
    queryFn: async () => {
      if (!selectedSelecaoId) return [];
      return (await supabase.from("bolao_elenco").select("id, jogador_nome, posicao, numero_camisa").eq("selecao_id", selectedSelecaoId).order("jogador_nome")).data ?? [];
    },
    enabled: !!selectedSelecaoId,
  });

  // Query as apostas privadas do usuário logado para mostrar o que ele já salvou
  const { data: minhaApostaArt } = useQuery({
    queryKey: ["minha-aposta-art", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return null;
      return (await supabase.from("bolao_apostas_artilheiro").select("id, jogador_apostado, jogador_id, confirmado_em, bloqueado_em").eq("usuario_id", identidade.id).maybeSingle()).data;
    },
    enabled: !!identidade?.id,
  });

  const { data: minhaApostaCam } = useQuery({
    queryKey: ["minha-aposta-cam", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return null;
      return (await supabase.from("bolao_apostas_campeao").select("id, time_campeao, confirmado_em, bloqueado_em").eq("usuario_id", identidade.id).maybeSingle()).data;
    },
    enabled: !!identidade?.id,
  });

  const { data: minhaApostaFin } = useQuery({
    queryKey: ["minha-aposta-fin", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return null;
      return (await supabase.from("bolao_apostas_finalistas").select("id, time1, time2, confirmado_em, bloqueado_em").eq("usuario_id", identidade.id).maybeSingle()).data;
    },
    enabled: !!identidade?.id,
  });

  const { data: minhaApostaZeb } = useQuery({
    queryKey: ["minha-aposta-zeb", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return null;
      return (await supabase.from("bolao_apostas_zebra").select("id, zebra_apostada, confirmado_em, bloqueado_em").eq("usuario_id", identidade.id).maybeSingle()).data;
    },
    enabled: !!identidade?.id,
  });

  const { data: minhaApostaGol } = useQuery({
    queryKey: ["minha-aposta-gol", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return null;
      return (await supabase.from("bolao_apostas_goleada").select("id, time_casa, time_fora, gols_casa, gols_fora, confirmado_em, bloqueado_em").eq("usuario_id", identidade.id).maybeSingle()).data;
    },
    enabled: !!identidade?.id,
  });

  const { data: usuarios } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("nome")).data ?? [],
  });

  const { data: times } = useQuery({
    queryKey: ["times"],
    queryFn: async () => {
      const { data } = await supabase.from("bolao_jogos").select("time_casa, time_fora");
      const set = new Set<string>();
      data?.forEach(j => { set.add(j.time_casa); set.add(j.time_fora); });
      return Array.from(set).sort();
    },
  });


  // Configs
  const { data: rawCfgArt } = useQuery({
    queryKey: ["cfg-art"],
    queryFn: async () => (await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).maybeSingle()).data || { status: "fechada", prazo_fim: null, acumulado_anterior: 0 },
  });
  const cfgArt = rawCfgArt || { status: "fechada", prazo_fim: null, acumulado_anterior: 0 };

  const { data: rawCfgFin } = useQuery({
    queryKey: ["cfg-fin"],
    queryFn: async () => (await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).maybeSingle()).data || { status: "fechada", prazo_fim: null, acumulado_anterior: 0 },
  });
  const cfgFin = rawCfgFin || { status: "fechada", prazo_fim: null, acumulado_anterior: 0 };

  const { data: rawCfgCam } = useQuery({
    queryKey: ["cfg-cam"],
    queryFn: async () => (await supabase.from("bolao_config_campeao").select("*").eq("id", 1).maybeSingle()).data || { status: "aberta", prazo_fim: null, acumulado_anterior: 0 },
  });
  const cfgCam = rawCfgCam || { status: "aberta", prazo_fim: null, acumulado_anterior: 0 };

  const { data: rawCfgZeb } = useQuery({
    queryKey: ["cfg-zeb"],
    queryFn: async () => (await supabase.from("bolao_config_zebra").select("*").eq("id", 1).maybeSingle()).data || { status: "aberta", prazo_fim: null, acumulado_anterior: 0 },
  });
  const cfgZeb = rawCfgZeb || { status: "aberta", prazo_fim: null, acumulado_anterior: 0 };

  const { data: rawCfgGol } = useQuery({
    queryKey: ["cfg-gol"],
    queryFn: async () => (await supabase.from("bolao_config_goleada").select("*").eq("id", 1).maybeSingle()).data || { status: "aberta", prazo_fim: null, acumulado_anterior: 0 },
  });
  const cfgGol = rawCfgGol || { status: "aberta", prazo_fim: null, acumulado_anterior: 0 };

  // Bets lists
  const { data: apostasArt } = useQuery({
    queryKey: ["apostas-art"],
    queryFn: async () => (await supabase.from("bolao_apostas_artilheiro_publica").select("*")).data ?? [],
  });
  const { data: apostasFin } = useQuery({
    queryKey: ["apostas-fin"],
    queryFn: async () => (await supabase.from("bolao_apostas_finalistas_publica").select("*")).data ?? [],
  });
  const { data: apostasCam } = useQuery({
    queryKey: ["apostas-cam"],
    queryFn: async () => (await supabase.from("bolao_apostas_campeao_publica").select("*")).data ?? [],
  });
  const { data: apostasZeb } = useQuery({
    queryKey: ["apostas-zeb"],
    queryFn: async () => (await supabase.from("bolao_apostas_zebra_publica").select("*")).data ?? [],
  });
  const { data: apostasGol } = useQuery({
    queryKey: ["apostas-gol"],
    queryFn: async () => (await supabase.from("bolao_apostas_goleada_publica").select("*")).data ?? [],
  });

  // ====== MUTATIONS ======
  const postArt = useMutation({
    mutationFn: () => callFn("aposta-artilheiro", { nome: identidade?.nome, pin: identidade?.pin, jogador_id: selectedJogadorId }),
    onSuccess: () => { setSelectedJogadorId(""); qc.invalidateQueries({ queryKey: ["apostas-art"] }); qc.invalidateQueries({ queryKey: ["minha-aposta-art"] }); toast.success("Aposta em Artilheiro registrada!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const postFin = useMutation({
    mutationFn: () => callFn("aposta-finalistas", { nome: identidade?.nome, pin: identidade?.pin, time1: fin1, time2: fin2 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["apostas-fin"] }); qc.invalidateQueries({ queryKey: ["minha-aposta-fin"] }); toast.success("Aposta em Finalistas registrada!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const postCam = useMutation({
    mutationFn: () => callFn("aposta-campeao", { nome: identidade?.nome, pin: identidade?.pin, time: campeao }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["apostas-cam"] }); qc.invalidateQueries({ queryKey: ["minha-aposta-cam"] }); toast.success("Aposta em Campeão registrada!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const postZeb = useMutation({
    mutationFn: () => callFn("aposta-zebra", { nome: identidade?.nome, pin: identidade?.pin, zebra: zebra }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["apostas-zeb"] }); qc.invalidateQueries({ queryKey: ["minha-aposta-zebra"] }); toast.success("Aposta em Zebra registrada!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const postGol = useMutation({
    mutationFn: () => callFn("aposta-goleada", { nome: identidade?.nome, pin: identidade?.pin, time_casa: golCasa, time_fora: golFora, gols_casa: golGolsCasa, gols_fora: golGolsFora }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["apostas-gol"] }); qc.invalidateQueries({ queryKey: ["minha-aposta-goleada"] }); toast.success("Aposta em Maior Goleada registrada!"); },
    onError: (e: Error) => toast.error(e.message),
  });


  const nP = usuarios?.length ?? 0;
  const nomeMap = useMemo(() => new Map((usuarios ?? []).map(u => [u.id, u.nome])), [usuarios]);

  const filteredElenco = useMemo(() => {
    if (!elenco) return [];
    if (!jogadorSearch.trim()) return elenco;
    return elenco.filter(p =>
      p.jogador_nome.toLowerCase().includes(jogadorSearch.toLowerCase())
    );
  }, [elenco, jogadorSearch]);

  const isBolaoFechadoGlobal = useMemo(() => {
    return config?.status === "FECHADO" || config?.status === "FINALIZADO";
  }, [config]);

  // Artilheiro: bloqueado apenas se o bolão estiver fechado globalmente, ou a aposta já foi apurada, ou já bloqueada
  const isArtilheiroClosed = isBolaoFechadoGlobal || cfgArt.status === "apurada" || !!minhaApostaArt?.bloqueado_em;


  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl sm:text-4xl flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            🎰 Apostas Especiais
          </h1>
          <p className="text-muted-foreground text-sm">
            Módulos especiais do bolão. Cada módulo custa R$10 adicionais por participante.
          </p>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quem está apostando?</CardTitle>
          <CardDescription>
            Identifique-se uma vez para preencher os palpites abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IdentidadePicker value={identidade} onChange={setIdentidade} />
        </CardContent>
      </Card>

      <div className="table-scroll pb-1">
        <Tabs defaultValue="artilheiro" className="w-full">
          <TabsList className="flex h-auto w-max min-w-full">
            <TabsTrigger value="artilheiro" className="shrink-0 flex items-center gap-1.5 py-2">⚽ Artilheiro</TabsTrigger>
            <TabsTrigger value="finalistas" className="shrink-0 flex items-center gap-1.5 py-2">🏆 Finalistas</TabsTrigger>
            <TabsTrigger value="campeao" className="shrink-0 flex items-center gap-1.5 py-2">🥇 Campeão</TabsTrigger>
            <TabsTrigger value="zebra" className="shrink-0 flex items-center gap-1.5 py-2">🦓 Zebra</TabsTrigger>
            <TabsTrigger value="goleada" className="shrink-0 flex items-center gap-1.5 py-2">🔥 Goleada</TabsTrigger>
          </TabsList>

          {/* TAB: ARTILHEIRO */}
          <TabsContent value="artilheiro" className="space-y-4 mt-4">
            <SpecialBetTab
              title="Artilheiro da Copa"
              description="Aposte em quem será o maior goleador da Copa do Mundo 2026."
              status={cfgArt.status}
              prazoFim={cfgArt.prazo_fim}
              acumulado={cfgArt.acumulado_anterior}
              nP={nP}
              resultadoReal={cfgArt.artilheiro_real}
              form={
                !isArtilheiroClosed ? (
                  <div className="space-y-4 pt-3 border-t border-border">
                    {minhaApostaArt?.jogador_apostado && (
                      <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                        Seu palpite atual: <strong className="text-primary">{minhaApostaArt.jogador_apostado}</strong>
                      </div>
                    )}
                    
                    {/* Seleção do País */}
                    <div className="space-y-1.5">
                      <Label htmlFor="artilheiro-selecao">1. Selecione a Seleção</Label>
                      <Select value={selectedSelecaoId} onValueChange={(val) => { setSelectedSelecaoId(val); setSelectedJogadorId(""); setJogadorSearch(""); }}>
                        <SelectTrigger id="artilheiro-selecao"><SelectValue placeholder="Escolha uma seleção..." /></SelectTrigger>
                        <SelectContent>
                          {selecoes?.map(s => <SelectItem key={s.id} value={s.id}>{flag(s.nome)} {s.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Autocomplete de Jogadores */}
                    {selectedSelecaoId && (
                      <div className="space-y-2">
                        <Label htmlFor="jogador-search">2. Selecione o Jogador</Label>
                        <Input
                          id="jogador-search"
                          placeholder="Digite para filtrar..."
                          value={jogadorSearch}
                          onChange={e => setJogadorSearch(e.target.value)}
                        />
                        
                        {loadingElenco ? (
                          <div className="text-xs text-muted-foreground">Carregando elenco...</div>
                        ) : filteredElenco.length === 0 ? (
                          <div className="text-xs text-muted-foreground italic">Nenhum jogador encontrado.</div>
                        ) : (
                          <div className="border border-border rounded-lg max-h-48 overflow-y-auto divide-y divide-border">
                            {filteredElenco.map(p => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedJogadorId(p.id)}
                                className={`w-full text-left px-3 py-2 text-xs flex justify-between items-center transition-colors hover:bg-secondary/40 ${selectedJogadorId === p.id ? "bg-primary/10 text-primary font-semibold" : ""}`}
                              >
                                <span>{p.jogador_nome}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {p.posicao || "Posição N/D"} {p.numero_camisa ? `(nº ${p.numero_camisa})` : ""}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      disabled={!identidade?.nome || !selectedJogadorId || postArt.isPending}
                      onClick={() => postArt.mutate()}
                      className="w-full btn-touch"
                    >
                      {postArt.isPending ? "Salvando..." : "Salvar Palpite de Artilheiro"}
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-secondary/20 rounded-md border border-border text-xs text-muted-foreground">
                    {minhaApostaArt?.jogador_apostado ? (
                      <div>
                        <span>Você apostou em: <strong className="text-primary">{minhaApostaArt.jogador_apostado}</strong> (Apostas de artilheiro encerradas)</span>
                      </div>
                    ) : (
                      <span>Apostas de artilheiro encerradas.</span>
                    )}
                  </div>
                )
              }
              bets={
                <BetsList
                  bets={apostasArt}
                  nomeMap={nomeMap}
                  renderValue={(a) => <span>{a.jogador_apostado}</span>}
                  isAcertou={(a) => a.acertou}
                />
              }
            />
          </TabsContent>

          {/* TAB: FINALISTAS */}
          <TabsContent value="finalistas" className="space-y-4 mt-4">
            <SpecialBetTab
              title="Dois Finalistas"
              description="Aposte nas duas equipes que farão a grande final."
              status={cfgFin.status}
              prazoFim={cfgFin.prazo_fim}
              acumulado={cfgFin.acumulado_anterior}
              nP={nP}
              resultadoReal={cfgFin.finalista1_real && cfgFin.finalista2_real ? `${flag(cfgFin.finalista1_real)} ${cfgFin.finalista1_real} x ${cfgFin.finalista2_real} ${flag(cfgFin.finalista2_real)}` : null}
              form={
                (!isBolaoFechadoGlobal && cfgFin.status !== "apurada") ? (
                  <div className="space-y-3 pt-3 border-t border-border">
                    {minhaApostaFin?.time1 && minhaApostaFin?.time2 && (
                      <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                        Seu palpite atual: <strong className="text-primary">{flag(minhaApostaFin.time1)} {minhaApostaFin.time1} × {minhaApostaFin.time2} {flag(minhaApostaFin.time2)}</strong>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="fin1-select">Finalista 1</Label>
                        <Select value={fin1} onValueChange={setFin1}>
                          <SelectTrigger id="fin1-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {times?.map(t => <SelectItem key={t} value={t}>{flag(t)} {t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="fin2-select">Finalista 2</Label>
                        <Select value={fin2} onValueChange={setFin2}>
                          <SelectTrigger id="fin2-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {times?.filter(t => t !== fin1).map(t => <SelectItem key={t} value={t}>{flag(t)} {t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      disabled={!identidade?.nome || !fin1 || !fin2 || postFin.isPending}
                      onClick={() => postFin.mutate()}
                      className="w-full btn-touch"
                    >
                      {postFin.isPending ? "Salvando..." : "Salvar Palpite de Finalistas"}
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-secondary/20 rounded-md border border-border text-xs text-muted-foreground">
                    {minhaApostaFin?.time1 && minhaApostaFin?.time2 ? (
                      <span>Você apostou em: <strong className="text-primary">{flag(minhaApostaFin.time1)} {minhaApostaFin.time1} × {minhaApostaFin.time2} {flag(minhaApostaFin.time2)}</strong> (Apostas de finalistas encerradas)</span>
                    ) : (
                      <span>Apostas de finalistas encerradas.</span>
                    )}
                  </div>
                )
              }
              bets={
                <BetsList
                  bets={apostasFin}
                  nomeMap={nomeMap}
                  renderValue={(a) => (
                    <span>
                      {flag(a.time1)} {a.time1} × {a.time2} {flag(a.time2)}
                    </span>
                  )}
                  isAcertou={(a) => a.acertou_os_dois}
                  acertouBadge={(a) => a.acertou_os_dois ? <Badge className="bg-success scale-90">Acertou 2</Badge> : a.acertou_um ? <Badge variant="secondary" className="scale-90">Acertou 1</Badge> : null}
                />
              }
            />
          </TabsContent>

          {/* TAB: CAMPEÃO */}
          <TabsContent value="campeao" className="space-y-4 mt-4">
            <SpecialBetTab
              title="Campeão Mundial"
              description="Aposte na seleção que levantará a taça de campeã do mundo."
              status={cfgCam.status}
              prazoFim={cfgCam.prazo_fim}
              acumulado={cfgCam.acumulado_anterior}
              nP={nP}
              resultadoReal={cfgCam.campeao_real ? `${flag(cfgCam.campeao_real)} ${cfgCam.campeao_real}` : null}
              form={
                (!isBolaoFechadoGlobal && cfgCam.status !== "apurada") ? (
                  <div className="space-y-3 pt-3 border-t border-border">
                    {minhaApostaCam?.time_campeao && (
                      <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                        Seu palpite atual: <strong className="text-primary">{flag(minhaApostaCam.time_campeao)} {minhaApostaCam.time_campeao}</strong>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="campeao-select">Seleção Campeã</Label>
                      <Select value={campeao} onValueChange={setCampeao}>
                        <SelectTrigger id="campeao-select"><SelectValue placeholder="Selecione uma seleção" /></SelectTrigger>
                        <SelectContent>
                          {times?.map(t => <SelectItem key={t} value={t}>{flag(t)} {t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      disabled={!identidade?.nome || !campeao || postCam.isPending}
                      onClick={() => postCam.mutate()}
                      className="w-full btn-touch"
                    >
                      {postCam.isPending ? "Salvando..." : "Salvar Palpite de Campeão"}
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-secondary/20 rounded-md border border-border text-xs text-muted-foreground">
                    {minhaApostaCam?.time_campeao ? (
                      <span>Você apostou em: <strong className="text-primary">{flag(minhaApostaCam.time_campeao)} {minhaApostaCam.time_campeao}</strong> (Apostas de campeão encerradas)</span>
                    ) : (
                      <span>Apostas de campeão encerradas.</span>
                    )}
                  </div>
                )
              }
              bets={
                <BetsList
                  bets={apostasCam}
                  nomeMap={nomeMap}
                  renderValue={(a) => <span>{flag(a.time_campeao)} {a.time_campeao}</span>}
                  isAcertou={(a) => a.acertou}
                />
              }
            />
          </TabsContent>

          {/* TAB: ZEBRA */}
          <TabsContent value="zebra" className="space-y-4 mt-4">
            <SpecialBetTab
              title="Zebra do Torneio"
              description="Qual seleção surpreenderá o mundo indo mais longe do que o esperado?"
              status={cfgZeb.status}
              prazoFim={cfgZeb.prazo_fim}
              acumulado={cfgZeb.acumulado_anterior}
              nP={nP}
              resultadoReal={cfgZeb.zebra_real ? `${flag(cfgZeb.zebra_real)} ${cfgZeb.zebra_real}` : null}
              form={
                (!isBolaoFechadoGlobal && cfgZeb.status !== "apurada") ? (
                  <div className="space-y-3 pt-3 border-t border-border">
                    {minhaApostaZeb?.zebra_apostada && (
                      <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                        Seu palpite atual: <strong className="text-primary">{flag(minhaApostaZeb.zebra_apostada)} {minhaApostaZeb.zebra_apostada}</strong>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="zebra-select">Seleção Zebra</Label>
                      <Select value={zebra} onValueChange={setZebra}>
                        <SelectTrigger id="zebra-select"><SelectValue placeholder="Selecione a Zebra" /></SelectTrigger>
                        <SelectContent>
                          {times?.map(t => <SelectItem key={t} value={t}>{flag(t)} {t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      disabled={!identidade?.nome || !zebra || postZeb.isPending}
                      onClick={() => postZeb.mutate()}
                      className="w-full btn-touch"
                    >
                      {postZeb.isPending ? "Salvando..." : "Salvar Palpite de Zebra"}
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-secondary/20 rounded-md border border-border text-xs text-muted-foreground">
                    {minhaApostaZeb?.zebra_apostada ? (
                      <span>Você apostou em: <strong className="text-primary">{flag(minhaApostaZeb.zebra_apostada)} {minhaApostaZeb.zebra_apostada}</strong> (Apostas de zebra encerradas)</span>
                    ) : (
                      <span>Apostas de zebra encerradas.</span>
                    )}
                  </div>
                )
              }
              bets={
                <BetsList
                  bets={apostasZeb}
                  nomeMap={nomeMap}
                  renderValue={(a) => <span>{flag(a.zebra_apostada)} {a.zebra_apostada}</span>}
                  isAcertou={(a) => a.acertou}
                />
              }
            />
          </TabsContent>

          {/* TAB: MAIOR GOLEADA */}
          <TabsContent value="goleada" className="space-y-4 mt-4">
            <SpecialBetTab
              title="Maior Goleada da Copa"
              description="Aposte em qual será o placar mais elástico de toda a competição."
              status={cfgGol.status}
              prazoFim={cfgGol.prazo_fim}
              acumulado={cfgGol.acumulado_anterior}
              nP={nP}
              resultadoReal={cfgGol.goleada_time_casa_real ? `${flag(cfgGol.goleada_time_casa_real)} ${cfgGol.goleada_time_casa_real} ${cfgGol.goleada_gols_casa_real} x ${cfgGol.goleada_gols_fora_real} ${cfgGol.goleada_time_fora_real} ${flag(cfgGol.goleada_time_fora_real)}` : null}
              form={
                (!isBolaoFechadoGlobal && cfgGol.status !== "apurada") ? (
                  <div className="space-y-4 pt-3 border-t border-border">
                    {minhaApostaGol?.time_casa && minhaApostaGol?.time_fora && (
                      <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                        Seu palpite atual: <strong className="text-primary">{flag(minhaApostaGol.time_casa)} {minhaApostaGol.time_casa} {minhaApostaGol.gols_casa} × {minhaApostaGol.gols_fora} {minhaApostaGol.time_fora} {flag(minhaApostaGol.time_fora)}</strong>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Mandante */}
                      <div className="space-y-2">
                        <Label htmlFor="gol-casa-select">Time Casa</Label>
                        <Select value={golCasa} onValueChange={setGolCasa}>
                          <SelectTrigger id="gol-casa-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {times?.map(t => <SelectItem key={t} value={t}>{flag(t)} {t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 justify-center pt-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setGolGolsCasa(Math.max(0, golGolsCasa - 1))}
                            className="h-8 w-8 rounded-full"
                          >-</Button>
                          <span className="text-xl font-bold font-mono w-6 text-center">{golGolsCasa}</span>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setGolGolsCasa(golGolsCasa + 1)}
                            className="h-8 w-8 rounded-full"
                          >+</Button>
                        </div>
                      </div>

                      {/* Visitante */}
                      <div className="space-y-2">
                        <Label htmlFor="gol-fora-select">Time Fora</Label>
                        <Select value={golFora} onValueChange={setGolFora}>
                          <SelectTrigger id="gol-fora-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            {times?.filter(t => t !== golCasa).map(t => <SelectItem key={t} value={t}>{flag(t)} {t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 justify-center pt-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setGolGolsFora(Math.max(0, golGolsFora - 1))}
                            className="h-8 w-8 rounded-full"
                          >-</Button>
                          <span className="text-xl font-bold font-mono w-6 text-center">{golGolsFora}</span>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setGolGolsFora(golGolsFora + 1)}
                            className="h-8 w-8 rounded-full"
                          >+</Button>
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-lg font-semibold bg-secondary/20 p-2 rounded">
                      Goleada: {golCasa || "Time Casa"} {golGolsCasa} x {golGolsFora} {golFora || "Time Fora"}
                    </div>
                    <Button
                      disabled={!identidade?.nome || !golCasa || !golFora || postGol.isPending}
                      onClick={() => postGol.mutate()}
                      className="w-full btn-touch"
                    >
                      {postGol.isPending ? "Salvando..." : "Salvar Palpite de Maior Goleada"}
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 bg-secondary/20 rounded-md border border-border text-xs text-muted-foreground">
                    {minhaApostaGol?.time_casa && minhaApostaGol?.time_fora ? (
                      <span>Você apostou em: <strong className="text-primary">{flag(minhaApostaGol.time_casa)} {minhaApostaGol.time_casa} {minhaApostaGol.gols_casa} × {minhaApostaGol.gols_fora} {minhaApostaGol.time_fora} {flag(minhaApostaGol.time_fora)}</strong> (Apostas de maior goleada encerradas)</span>
                    ) : (
                      <span>Apostas de maior goleada encerradas.</span>
                    )}
                  </div>
                )
              }
              bets={
                <BetsList
                  bets={apostasGol}
                  nomeMap={nomeMap}
                  renderValue={(a) => (
                    <span>
                      {flag(a.time_casa)} {a.time_casa} {a.gols_casa} × {a.gols_fora} {a.time_fora} {flag(a.time_fora)}
                    </span>
                  )}
                  isAcertou={(a) => a.acertou}
                />
              }
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ====== SUBCOMPONENTS ======

interface SpecialBetTabProps {
  title: string;
  description: string;
  status: string;
  prazoFim: string | Date | null;
  acumulado: number | string;
  nP: number;
  resultadoReal: string | null;
  form: React.ReactNode;
  bets: React.ReactNode;
}

function SpecialBetTab({
  title,
  description,
  status,
  prazoFim,
  acumulado,
  nP,
  resultadoReal,
  form,
  bets,
}: SpecialBetTabProps) {
  const poolVal = nP * 10 + Number(acumulado || 0);
  const isAberta = status === "aberta";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap items-center">
              <Badge variant={isAberta ? "success" : "secondary"} className="capitalize">
                {status}
              </Badge>
              {isAberta && prazoFim && new Date(prazoFim).getFullYear() < 2090 && (
                <Badge variant="outline" className="text-xs">
                  Fecha em: {countdown(prazoFim)}
                </Badge>
              )}
            </div>

            {resultadoReal && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-200">
                Resultado Oficial: <strong>{resultadoReal}</strong>
              </div>
            )}

            {!isAberta && status === "fechada" && (
              <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded border border-border text-sm text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>As apostas para este módulo estão atualmente fechadas.</span>
              </div>
            )}

            {form}
          </CardContent>
        </Card>

        {bets}
      </div>

      <div className="space-y-4">
        {/* Pool de prêmios */}
        <Card className="bg-pitch">
          <CardHeader className="pb-2">
            <CardDescription className="text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground">Pool de Prêmio Acumulado</CardDescription>
          </CardHeader>
          <CardContent className="text-center py-4">
            <div className="text-display text-4xl sm:text-5xl text-primary font-bold">{fmtBRL(poolVal)}</div>
            <div className="text-xs text-muted-foreground mt-2">
              R$10 x {nP} participantes = {fmtBRL(nP * 10)}
              {Number(acumulado) > 0 && ` + ${fmtBRL(acumulado)} acumulado anterior`}
            </div>
          </CardContent>
        </Card>

        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2 text-xs">
          <div className="flex items-center gap-1 font-semibold text-primary">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>Regras de Auditoria & Prazo</span>
          </div>
          <p className="text-muted-foreground leading-normal">
            As apostas especiais estão liberadas para consulta pública e podem ser visualizadas por todos os participantes a qualquer momento.
            Garantimos a integridade total do banco de dados contra alterações após o prazo configurado.
          </p>
        </div>
      </div>
    </div>
  );
}

interface BetsListProps {
  bets: any[];
  nomeMap: Map<string, string>;
  renderValue: (a: any) => React.ReactNode;
  isAcertou?: (a: any) => boolean | null | undefined;
  acertouBadge?: (a: any) => React.ReactNode;
}

function BetsList({ bets = [], nomeMap, renderValue, isAcertou, acertouBadge }: BetsListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Palpites Registrados ({bets.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {bets.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum palpite registrado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {bets.map((a: any) => {
              const acertou = isAcertou ? isAcertou(a) === true : false;
              return (
                <li key={a.id} className="flex justify-between items-center py-2 text-sm">
                  <span className={`font-medium ${acertou ? "text-success font-bold" : ""}`}>
                    {nomeMap.get(a.usuario_id) ?? "—"}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={acertou ? "text-success font-bold" : ""}>
                      {renderValue(a)}
                    </span>
                    {acertouBadge ? acertouBadge(a) : (acertou && <Badge className="bg-success scale-90">✓</Badge>)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
