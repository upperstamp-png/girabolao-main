import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase, callFn, flag, countdown } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { IdentidadePicker, type Identidade } from "@/components/IdentidadePicker";
import { Trophy, Users, Medal, Sparkles, AlertTriangle, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/apostas-especiais")({
  head: () => ({
    meta: [
      { title: "Apostas Especiais — Bolão Copa 2026" },
      {
        name: "description",
        content:
          "Apostas especiais do Bolão: Artilheiro, Finalistas, Campeão, Zebra e Maior Goleada.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [identidade, setIdentidade] = useState<Identidade | null>(null);
  const [activeTab, setActiveTab] = useState("artilheiro");

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
    queryFn: async () =>
      (await supabase.from("bolao_config").select("*").eq("id", 1).single()).data,
  });

  const { data: primeiroJogo } = useQuery({
    queryKey: ["primeiro-jogo-cfg"],
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

  const { data: selecoes } = useQuery({
    queryKey: ["selecoes-especiais"],
    queryFn: async () =>
      (await supabase.from("bolao_selecoes").select("id, nome").order("nome")).data ?? [],
  });

  const { data: elenco, isLoading: loadingElenco } = useQuery({
    queryKey: ["elenco-especial", selectedSelecaoId],
    queryFn: async () => {
      if (!selectedSelecaoId) return [];
      return (
        (
          await supabase
            .from("bolao_elenco")
            .select("id, jogador_nome, posicao, numero_camisa")
            .eq("selecao_id", selectedSelecaoId)
            .order("jogador_nome")
        ).data ?? []
      );
    },
    enabled: !!selectedSelecaoId,
  });

  // Query as apostas privadas do usuário logado para mostrar o que ele já salvou
  const { data: minhaApostaArt } = useQuery({
    queryKey: ["minha-aposta-art", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return null;
      return (
        await supabase
          .from("bolao_apostas_artilheiro")
          .select("id, jogador_apostado, jogador_id, confirmado_em, bloqueado_em")
          .eq("usuario_id", identidade.id)
          .maybeSingle()
      ).data;
    },
    enabled: !!identidade?.id,
  });

  const { data: minhaApostaCam } = useQuery({
    queryKey: ["minha-aposta-cam", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return null;
      return (
        await supabase
          .from("bolao_apostas_campeao")
          .select("id, time_campeao, confirmado_em, bloqueado_em")
          .eq("usuario_id", identidade.id)
          .maybeSingle()
      ).data;
    },
    enabled: !!identidade?.id,
  });

  const { data: minhaApostaFin } = useQuery({
    queryKey: ["minha-aposta-fin", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return null;
      return (
        await supabase
          .from("bolao_apostas_finalistas")
          .select("id, time1, time2, confirmado_em, bloqueado_em")
          .eq("usuario_id", identidade.id)
          .maybeSingle()
      ).data;
    },
    enabled: !!identidade?.id,
  });

  const { data: minhaApostaZeb } = useQuery({
    queryKey: ["minha-aposta-zeb", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return null;
      return (
        await supabase
          .from("bolao_apostas_zebra")
          .select("id, zebra_apostada, confirmado_em, bloqueado_em")
          .eq("usuario_id", identidade.id)
          .maybeSingle()
      ).data;
    },
    enabled: !!identidade?.id,
  });

  const { data: minhaApostaGol } = useQuery({
    queryKey: ["minha-aposta-gol", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return null;
      return (
        await supabase
          .from("bolao_apostas_goleada")
          .select("id, time_casa, time_fora, gols_casa, gols_fora, confirmado_em, bloqueado_em")
          .eq("usuario_id", identidade.id)
          .maybeSingle()
      ).data;
    },
    enabled: !!identidade?.id,
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

  const { data: times } = useQuery({
    queryKey: ["times"],
    queryFn: async () => {
      const { data } = await supabase.from("bolao_jogos").select("time_casa, time_fora");
      const set = new Set<string>();
      data?.forEach((j) => {
        set.add(j.time_casa);
        set.add(j.time_fora);
      });
      return Array.from(set).sort();
    },
  });

  // Configs
  const { data: rawCfgArt } = useQuery({
    queryKey: ["cfg-art"],
    queryFn: async () =>
      (await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).maybeSingle()).data,
  });
  const cfgArt: any = rawCfgArt || { status: "fechada", prazo_fim: null, acumulado_anterior: 0 };

  const { data: rawCfgFin } = useQuery({
    queryKey: ["cfg-fin"],
    queryFn: async () =>
      (await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).maybeSingle()).data,
  });
  const cfgFin: any = rawCfgFin || { status: "fechada", prazo_fim: null, acumulado_anterior: 0 };

  const { data: rawCfgCam } = useQuery({
    queryKey: ["cfg-cam"],
    queryFn: async () =>
      (await supabase.from("bolao_config_campeao").select("*").eq("id", 1).maybeSingle()).data,
  });
  const cfgCam: any = rawCfgCam || { status: "aberta", prazo_fim: null, acumulado_anterior: 0 };

  const { data: rawCfgZeb } = useQuery({
    queryKey: ["cfg-zeb"],
    queryFn: async () =>
      (await supabase.from("bolao_config_zebra").select("*").eq("id", 1).maybeSingle()).data,
  });
  const cfgZeb: any = rawCfgZeb || { status: "aberta", prazo_fim: null, acumulado_anterior: 0 };

  const { data: rawCfgGol } = useQuery({
    queryKey: ["cfg-gol"],
    queryFn: async () =>
      (await supabase.from("bolao_config_goleada").select("*").eq("id", 1).maybeSingle()).data,
  });
  const cfgGol: any = rawCfgGol || { status: "aberta", prazo_fim: null, acumulado_anterior: 0 };

  // Bets lists
  const { data: apostasArt } = useQuery({
    queryKey: ["apostas-art"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_artilheiro_publica").select("*")).data ?? [],
  });
  const { data: apostasFin } = useQuery({
    queryKey: ["apostas-fin"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_finalistas_publica").select("*")).data ?? [],
  });
  const { data: apostasCam } = useQuery({
    queryKey: ["apostas-cam"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_campeao_publica").select("*")).data ?? [],
  });
  const { data: apostasZeb } = useQuery({
    queryKey: ["apostas-zeb"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_zebra_publica").select("*")).data ?? [],
  });
  const { data: apostasGol } = useQuery({
    queryKey: ["apostas-gol"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_goleada_publica").select("*")).data ?? [],
  });

  // ====== MUTATIONS ======
  const postArt = useMutation({
    mutationFn: () =>
      callFn("aposta-artilheiro", {
        nome: identidade?.nome,
        pin: identidade?.pin,
        jogador_id: selectedJogadorId,
      }),
    onSuccess: () => {
      setSelectedJogadorId("");
      qc.invalidateQueries({ queryKey: ["apostas-art"] });
      qc.invalidateQueries({ queryKey: ["minha-aposta-art"] });
      toast.success("Aposta em Artilheiro registrada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const postFin = useMutation({
    mutationFn: () =>
      callFn("aposta-finalistas", {
        nome: identidade?.nome,
        pin: identidade?.pin,
        time1: fin1,
        time2: fin2,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apostas-fin"] });
      qc.invalidateQueries({ queryKey: ["minha-aposta-fin"] });
      toast.success("Aposta em Finalistas registrada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const postCam = useMutation({
    mutationFn: () =>
      callFn("aposta-campeao", { nome: identidade?.nome, pin: identidade?.pin, time: campeao }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apostas-cam"] });
      qc.invalidateQueries({ queryKey: ["minha-aposta-cam"] });
      toast.success("Aposta em Campeão registrada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const postZeb = useMutation({
    mutationFn: () =>
      callFn("aposta-zebra", { nome: identidade?.nome, pin: identidade?.pin, zebra: zebra }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apostas-zeb"] });
      qc.invalidateQueries({ queryKey: ["minha-aposta-zeb"] });
      toast.success("Aposta em Zebra registrada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const postGol = useMutation({
    mutationFn: () =>
      callFn("aposta-goleada", {
        nome: identidade?.nome,
        pin: identidade?.pin,
        time_casa: golCasa,
        time_fora: golFora,
        gols_casa: golGolsCasa,
        gols_fora: golGolsFora,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apostas-gol"] });
      qc.invalidateQueries({ queryKey: ["minha-aposta-gol"] });
      toast.success("Aposta em Maior Goleada registrada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nP = usuarios?.length ?? 0;
  const nomeMap = useMemo(() => new Map((usuarios ?? []).map((u) => [u.id, u.nome])), [usuarios]);

  const filteredElenco = useMemo(() => {
    if (!elenco) return [];
    if (!jogadorSearch.trim()) return elenco;
    return elenco.filter((p) => p.jogador_nome.toLowerCase().includes(jogadorSearch.toLowerCase()));
  }, [elenco, jogadorSearch]);

  const isBolaoFechadoGlobal = useMemo(() => {
    return config?.status === "FECHADO" || config?.status === "FINALIZADO";
  }, [config]);

  const isArtilheiroClosed =
    isBolaoFechadoGlobal || cfgArt.status === "apurada" || !!minhaApostaArt?.bloqueado_em;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl sm:text-4xl flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            🎰 Apostas Especiais
          </h1>
          <p className="text-muted-foreground text-sm">
            Palpites extras que valem pontos valiosos para subir no ranking geral.
          </p>
        </div>
      </div>

      <Card className="border-border shadow-sm max-w-2xl mx-auto bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold uppercase text-foreground">
            Quem está apostando?
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Identifique-se uma vez para preencher os palpites abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <IdentidadePicker value={identidade} onChange={setIdentidade} />
        </CardContent>
      </Card>

      <div className="max-w-2xl mx-auto">
        {/* Scrollable Pills tabs switcher */}
        <div className="tab-scroll-container mb-4">
          <button
            onClick={() => setActiveTab("artilheiro")}
            className={`tab-pill shrink-0 ${activeTab === "artilheiro" ? "active" : ""}`}
          >
            ⚽ Artilheiro
          </button>
          <button
            onClick={() => setActiveTab("finalistas")}
            className={`tab-pill shrink-0 ${activeTab === "finalistas" ? "active" : ""}`}
          >
            🏆 Finalistas
          </button>
          <button
            onClick={() => setActiveTab("campeao")}
            className={`tab-pill shrink-0 ${activeTab === "campeao" ? "active" : ""}`}
          >
            🥇 Campeão
          </button>
          <button
            onClick={() => setActiveTab("zebra")}
            className={`tab-pill shrink-0 ${activeTab === "zebra" ? "active" : ""}`}
          >
            🦓 Zebra
          </button>
          <button
            onClick={() => setActiveTab("goleada")}
            className={`tab-pill shrink-0 ${activeTab === "goleada" ? "active" : ""}`}
          >
            🔥 Goleada
          </button>
        </div>

        {/* TAB: ARTILHEIRO */}
        {activeTab === "artilheiro" && (
          <SpecialBetTab
            title="Artilheiro da Copa"
            description="Aposte em quem será o maior goleador da Copa do Mundo 2026. (Acerto vale +10 pts)"
            status={cfgArt.status}
            prazoFim={cfgArt.prazo_fim}
            pointsText="+10 pts"
            resultadoReal={cfgArt.artilheiro_real}
            form={
              !isArtilheiroClosed ? (
                <div className="space-y-3 pt-3 border-t border-border/40">
                  {minhaApostaArt?.jogador_apostado && (
                    <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                      Seu palpite atual:{" "}
                      <strong className="text-primary">{minhaApostaArt.jogador_apostado}</strong>
                    </div>
                  )}

                  {/* Seleção do País */}
                  <div className="space-y-1">
                    <Select
                      value={selectedSelecaoId}
                      onValueChange={(val) => {
                        setSelectedSelecaoId(val);
                        setSelectedJogadorId("");
                        setJogadorSearch("");
                      }}
                    >
                      <SelectTrigger
                        id="artilheiro-selecao"
                        className="w-full bg-secondary/35 border-border hover:bg-secondary/50 transition-colors font-medium h-9.5 text-xs text-foreground focus:ring-primary"
                      >
                        <SelectValue placeholder="1. Escolha a Seleção..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selecoes?.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {flag(s.nome)} {s.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Autocomplete de Jogadores */}
                  {selectedSelecaoId && (
                    <div className="space-y-2 pt-2">
                      <Input
                        id="jogador-search"
                        placeholder="2. Digite para filtrar os jogadores..."
                        value={jogadorSearch}
                        onChange={(e) => setJogadorSearch(e.target.value)}
                        className="text-xs bg-secondary/15 border-border"
                      />

                      {loadingElenco ? (
                        <div className="text-xs text-muted-foreground animate-pulse">
                          Carregando elenco...
                        </div>
                      ) : filteredElenco.length === 0 ? (
                        <div className="text-xs text-muted-foreground italic text-center py-2">
                          Nenhum jogador encontrado.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1.5 border border-border/40 rounded-lg bg-secondary/5">
                          {filteredElenco.map((p) => (
                            <Badge
                              key={p.id}
                              variant={selectedJogadorId === p.id ? "default" : "outline"}
                              className="cursor-pointer py-1 px-2 text-[10px] transition-all hover:scale-105 active:scale-95 border-border/80"
                              onClick={() => setSelectedJogadorId(p.id)}
                            >
                              {p.jogador_nome} {p.numero_camisa ? `(${p.numero_camisa})` : ""}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <Button
                    disabled={!identidade?.nome || !selectedJogadorId || postArt.isPending}
                    onClick={() => postArt.mutate()}
                    className="w-full btn-touch font-display bg-primary text-background hover:bg-primary/95 text-xs mt-2"
                  >
                    {postArt.isPending ? "Salvando..." : "Confirmar Palpite de Artilheiro"}
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-secondary/20 rounded-md border border-border text-xs text-muted-foreground">
                  {minhaApostaArt?.jogador_apostado ? (
                    <div>
                      <span>
                        Você apostou em:{" "}
                        <strong className="text-primary">{minhaApostaArt.jogador_apostado}</strong>{" "}
                        (Apostas encerradas)
                      </span>
                    </div>
                  ) : (
                    <span>Apostas encerradas.</span>
                  )}
                </div>
              )
            }
            bets={
              <BetsList
                bets={apostasArt ?? []}
                nomeMap={nomeMap}
                renderValue={(a) => <span>{a.jogador_apostado}</span>}
                isAcertou={(a) => a.acertou}
                acertouBadge={(a) => {
                  if (cfgArt.status !== "apurada") return null;
                  return a.acertou ? (
                    <Badge className="bg-success text-success-foreground font-bold scale-90">
                      +10 pts
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="scale-90 text-muted-foreground">
                      0 pts
                    </Badge>
                  );
                }}
                loggedUserId={identidade?.id}
              />
            }
          />
        )}

        {/* TAB: FINALISTAS */}
        {activeTab === "finalistas" && (
          <SpecialBetTab
            title="Dois Finalistas"
            description="Aposte nas duas equipes que farão a grande final. (5 pts por acerto, 10 pts se acertar ambas)"
            status={cfgFin.status}
            prazoFim={cfgFin.prazo_fim}
            pointsText="+5 / +10 pts"
            resultadoReal={
              cfgFin.finalista1_real && cfgFin.finalista2_real
                ? `${flag(cfgFin.finalista1_real)} ${cfgFin.finalista1_real} x ${cfgFin.finalista2_real} ${flag(cfgFin.finalista2_real)}`
                : null
            }
            form={
              !isBolaoFechadoGlobal && cfgFin.status !== "apurada" ? (
                <div className="space-y-3 pt-3 border-t border-border/40">
                  {minhaApostaFin?.time1 && minhaApostaFin?.time2 && (
                    <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                      Seu palpite atual:{" "}
                      <strong className="text-primary">
                        {flag(minhaApostaFin.time1)} {minhaApostaFin.time1} × {minhaApostaFin.time2}{" "}
                        {flag(minhaApostaFin.time2)}
                      </strong>
                    </div>
                  )}
                  <div className="flex items-center gap-3 justify-center py-1">
                    <div className="flex-1">
                      <Select value={fin1} onValueChange={setFin1}>
                        <SelectTrigger
                          id="fin1-select"
                          className="w-full bg-secondary/35 border-border hover:bg-secondary/50 transition-colors font-medium h-9.5 text-xs text-foreground focus:ring-primary"
                        >
                          <SelectValue placeholder="Finalista 1" />
                        </SelectTrigger>
                        <SelectContent>
                          {times?.map((t) => (
                            <SelectItem key={t} value={t}>
                              {flag(t)} {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <span className="text-muted-foreground font-bold text-sm font-sans">vs</span>
                    <div className="flex-1">
                      <Select value={fin2} onValueChange={setFin2}>
                        <SelectTrigger
                          id="fin2-select"
                          className="w-full bg-secondary/35 border-border hover:bg-secondary/50 transition-colors font-medium h-9.5 text-xs text-foreground focus:ring-primary"
                        >
                          <SelectValue placeholder="Finalista 2" />
                        </SelectTrigger>
                        <SelectContent>
                          {times
                            ?.filter((t) => t !== fin1)
                            .map((t) => (
                              <SelectItem key={t} value={t}>
                                {flag(t)} {t}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    disabled={!identidade?.nome || !fin1 || !fin2 || postFin.isPending}
                    onClick={() => postFin.mutate()}
                    className="w-full btn-touch font-display bg-primary text-background hover:bg-primary/95 text-xs mt-2"
                  >
                    {postFin.isPending ? "Salvando..." : "Confirmar Palpite de Finalistas"}
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-secondary/20 rounded-md border border-border text-xs text-muted-foreground">
                  {minhaApostaFin?.time1 && minhaApostaFin?.time2 ? (
                    <span>
                      Você apostou em:{" "}
                      <strong className="text-primary">
                        {flag(minhaApostaFin.time1)} {minhaApostaFin.time1} × {minhaApostaFin.time2}{" "}
                        {flag(minhaApostaFin.time2)}
                      </strong>{" "}
                      (Apostas encerradas)
                    </span>
                  ) : (
                    <span>Apostas encerradas.</span>
                  )}
                </div>
              )
            }
            bets={
              <BetsList
                bets={apostasFin ?? []}
                nomeMap={nomeMap}
                renderValue={(a) => (
                  <span>
                    {flag(a.time1)} {a.time1} × {a.time2} {flag(a.time2)}
                  </span>
                )}
                isAcertou={(a) => a.acertou_os_dois || a.acertou_um}
                acertouBadge={(a) => {
                  if (cfgFin.status !== "apurada") return null;
                  if (a.acertou_os_dois) {
                    return (
                      <Badge className="bg-success text-success-foreground font-bold scale-90">
                        +10 pts
                      </Badge>
                    );
                  }
                  if (a.acertou_um) {
                    return (
                      <Badge className="bg-primary/20 text-primary border border-primary/30 font-semibold scale-90">
                        +5 pts
                      </Badge>
                    );
                  }
                  return (
                    <Badge variant="secondary" className="scale-90 text-muted-foreground">
                      0 pts
                    </Badge>
                  );
                }}
                loggedUserId={identidade?.id}
              />
            }
          />
        )}

        {/* TAB: CAMPEÃO */}
        {activeTab === "campeao" && (
          <SpecialBetTab
            title="Campeão Mundial"
            description="Aposte na seleção que levantará a taça de campeã do mundo. (Acerto vale +10 pts)"
            status={cfgCam.status}
            prazoFim={cfgCam.prazo_fim}
            pointsText="+10 pts"
            resultadoReal={
              cfgCam.campeao_real ? `${flag(cfgCam.campeao_real)} ${cfgCam.campeao_real}` : null
            }
            form={
              !isBolaoFechadoGlobal && cfgCam.status !== "apurada" ? (
                <div className="space-y-3 pt-3 border-t border-border/40">
                  {minhaApostaCam?.time_campeao && (
                    <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                      Seu palpite atual:{" "}
                      <strong className="text-primary">
                        {flag(minhaApostaCam.time_campeao)} {minhaApostaCam.time_campeao}
                      </strong>
                    </div>
                  )}
                  <div className="py-1">
                    <Select value={campeao} onValueChange={setCampeao}>
                      <SelectTrigger
                        id="campeao-select"
                        className="w-full bg-secondary/35 border-border hover:bg-secondary/50 transition-colors font-medium h-9.5 text-xs text-foreground focus:ring-primary"
                      >
                        <SelectValue placeholder="Escolha a Seleção Campeã" />
                      </SelectTrigger>
                      <SelectContent>
                        {times?.map((t) => (
                          <SelectItem key={t} value={t}>
                            {flag(t)} {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    disabled={!identidade?.nome || !campeao || postCam.isPending}
                    onClick={() => postCam.mutate()}
                    className="w-full btn-touch font-display bg-primary text-background hover:bg-primary/95 text-xs mt-2"
                  >
                    {postCam.isPending ? "Salvando..." : "Confirmar Palpite de Campeão"}
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-secondary/20 rounded-md border border-border text-xs text-muted-foreground">
                  {minhaApostaCam?.time_campeao ? (
                    <span>
                      Você apostou em:{" "}
                      <strong className="text-primary">
                        {flag(minhaApostaCam.time_campeao)} {minhaApostaCam.time_campeao}
                      </strong>{" "}
                      (Apostas encerradas)
                    </span>
                  ) : (
                    <span>Apostas encerradas.</span>
                  )}
                </div>
              )
            }
            bets={
              <BetsList
                bets={apostasCam ?? []}
                nomeMap={nomeMap}
                renderValue={(a) => (
                  <span>
                    {flag(a.time_campeao)} {a.time_campeao}
                  </span>
                )}
                isAcertou={(a) => a.acertou}
                acertouBadge={(a) => {
                  if (cfgCam.status !== "apurada") return null;
                  return a.acertou ? (
                    <Badge className="bg-success text-success-foreground font-bold scale-90">
                      +10 pts
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="scale-90 text-muted-foreground">
                      0 pts
                    </Badge>
                  );
                }}
                loggedUserId={identidade?.id}
              />
            }
          />
        )}

        {/* TAB: ZEBRA */}
        {activeTab === "zebra" && (
          <SpecialBetTab
            title="Zebra do Torneio"
            description="Qual seleção surpreenderá o mundo indo mais longe do que o esperado? (Acerto vale +10 pts)"
            status={cfgZeb.status}
            prazoFim={cfgZeb.prazo_fim}
            pointsText="+10 pts"
            resultadoReal={
              cfgZeb.zebra_real ? `${flag(cfgZeb.zebra_real)} ${cfgZeb.zebra_real}` : null
            }
            form={
              !isBolaoFechadoGlobal && cfgZeb.status !== "apurada" ? (
                <div className="space-y-3 pt-3 border-t border-border/40">
                  {minhaApostaZeb?.zebra_apostada && (
                    <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                      Seu palpite atual:{" "}
                      <strong className="text-primary">
                        {flag(minhaApostaZeb.zebra_apostada)} {minhaApostaZeb.zebra_apostada}
                      </strong>
                    </div>
                  )}
                  <div className="py-1">
                    <Select value={zebra} onValueChange={setZebra}>
                      <SelectTrigger
                        id="zebra-select"
                        className="w-full bg-secondary/35 border-border hover:bg-secondary/50 transition-colors font-medium h-9.5 text-xs text-foreground focus:ring-primary"
                      >
                        <SelectValue placeholder="Escolha a Seleção Zebra" />
                      </SelectTrigger>
                      <SelectContent>
                        {times?.map((t) => (
                          <SelectItem key={t} value={t}>
                            {flag(t)} {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    disabled={!identidade?.nome || !zebra || postZeb.isPending}
                    onClick={() => postZeb.mutate()}
                    className="w-full btn-touch font-display bg-primary text-background hover:bg-primary/95 text-xs mt-2"
                  >
                    {postZeb.isPending ? "Salvando..." : "Confirmar Palpite de Zebra"}
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-secondary/20 rounded-md border border-border text-xs text-muted-foreground">
                  {minhaApostaZeb?.zebra_apostada ? (
                    <span>
                      Você apostou em:{" "}
                      <strong className="text-primary">
                        {flag(minhaApostaZeb.zebra_apostada)} {minhaApostaZeb.zebra_apostada}
                      </strong>{" "}
                      (Apostas encerradas)
                    </span>
                  ) : (
                    <span>Apostas encerradas.</span>
                  )}
                </div>
              )
            }
            bets={
              <BetsList
                bets={apostasZeb ?? []}
                nomeMap={nomeMap}
                renderValue={(a) => (
                  <span>
                    {flag(a.zebra_apostada)} {a.zebra_apostada}
                  </span>
                )}
                isAcertou={(a) => a.acertou}
                acertouBadge={(a) => {
                  if (cfgZeb.status !== "apurada") return null;
                  return a.acertou ? (
                    <Badge className="bg-success text-success-foreground font-bold scale-90">
                      +10 pts
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="scale-90 text-muted-foreground">
                      0 pts
                    </Badge>
                  );
                }}
                loggedUserId={identidade?.id}
              />
            }
          />
        )}

        {/* TAB: MAIOR GOLEADA */}
        {activeTab === "goleada" && (
          <SpecialBetTab
            title="Maior Goleada da Copa"
            description="Aposte em qual será o placar mais elástico de toda a competição. (Acerto vale +10 pts)"
            status={cfgGol.status}
            prazoFim={cfgGol.prazo_fim}
            pointsText="+10 pts"
            resultadoReal={
              cfgGol.goleada_time_casa_real
                ? `${flag(cfgGol.goleada_time_casa_real)} ${cfgGol.goleada_time_casa_real} ${cfgGol.goleada_gols_casa_real} x ${cfgGol.goleada_gols_fora_real} ${cfgGol.goleada_time_fora_real} ${flag(cfgGol.goleada_time_fora_real)}`
                : null
            }
            form={
              !isBolaoFechadoGlobal && cfgGol.status !== "apurada" ? (
                <div className="space-y-3 pt-3 border-t border-border/40">
                  {minhaApostaGol?.time_casa && minhaApostaGol?.time_fora && (
                    <div className="p-2.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                      Seu palpite atual:{" "}
                      <strong className="text-primary">
                        {flag(minhaApostaGol.time_casa)} {minhaApostaGol.time_casa}{" "}
                        {minhaApostaGol.gols_casa} × {minhaApostaGol.gols_fora}{" "}
                        {minhaApostaGol.time_fora} {flag(minhaApostaGol.time_fora)}
                      </strong>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-secondary/10 border border-border/50">
                    {/* Casa */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <Select value={golCasa} onValueChange={setGolCasa}>
                        <SelectTrigger className="w-full bg-secondary/35 border-border hover:bg-secondary/50 transition-colors font-medium h-9.5 text-xs text-foreground focus:ring-primary">
                          <SelectValue placeholder="Mandante" />
                        </SelectTrigger>
                        <SelectContent>
                          {times?.map((t) => (
                            <SelectItem key={t} value={t}>
                              {flag(t)} {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2 font-mono">
                        <button
                          type="button"
                          onClick={() => setGolGolsCasa(Math.max(0, golGolsCasa - 1))}
                          className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-sm font-bold btn-touch"
                        >
                          -
                        </button>
                        <span className="text-2xl font-bold font-mono w-6 text-center">
                          {golGolsCasa}
                        </span>
                        <button
                          type="button"
                          onClick={() => setGolGolsCasa(golGolsCasa + 1)}
                          className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-sm font-bold btn-touch"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <span className="text-2xl font-bold text-muted-foreground self-center">×</span>

                    {/* Fora */}
                    <div className="flex-1 flex flex-col items-center gap-2">
                      <Select value={golFora} onValueChange={setGolFora}>
                        <SelectTrigger className="w-full bg-secondary/35 border-border hover:bg-secondary/50 transition-colors font-medium h-9.5 text-xs text-foreground focus:ring-primary">
                          <SelectValue placeholder="Visitante" />
                        </SelectTrigger>
                        <SelectContent>
                          {times
                            ?.filter((t) => t !== golCasa)
                            .map((t) => (
                              <SelectItem key={t} value={t}>
                                {flag(t)} {t}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2 font-mono">
                        <button
                          type="button"
                          onClick={() => setGolGolsFora(Math.max(0, golGolsFora - 1))}
                          className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-sm font-bold btn-touch"
                        >
                          -
                        </button>
                        <span className="text-2xl font-bold font-mono w-6 text-center">
                          {golGolsFora}
                        </span>
                        <button
                          type="button"
                          onClick={() => setGolGolsFora(golGolsFora + 1)}
                          className="h-8 w-8 rounded-full bg-secondary hover:bg-secondary/80 border border-border flex items-center justify-center text-sm font-bold btn-touch"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button
                    disabled={!identidade?.nome || !golCasa || !golFora || postGol.isPending}
                    onClick={() => postGol.mutate()}
                    className="w-full btn-touch font-display bg-primary text-background hover:bg-primary/95 text-xs mt-2"
                  >
                    {postGol.isPending ? "Salvando..." : "Confirmar Palpite de Maior Goleada"}
                  </Button>
                </div>
              ) : (
                <div className="p-3 bg-secondary/20 rounded-md border border-border text-xs text-muted-foreground">
                  {minhaApostaGol?.time_casa && minhaApostaGol?.time_fora ? (
                    <span>
                      Você apostou em:{" "}
                      <strong className="text-primary">
                        {flag(minhaApostaGol.time_casa)} {minhaApostaGol.time_casa}{" "}
                        {minhaApostaGol.gols_casa} × {minhaApostaGol.gols_fora}{" "}
                        {minhaApostaGol.time_fora} {flag(minhaApostaGol.time_fora)}
                      </strong>{" "}
                      (Apostas encerradas)
                    </span>
                  ) : (
                    <span>Apostas encerradas.</span>
                  )}
                </div>
              )
            }
            bets={
              <BetsList
                bets={apostasGol ?? []}
                nomeMap={nomeMap}
                renderValue={(a) => (
                  <span>
                    {flag(a.time_casa)} {a.time_casa} {a.gols_casa} × {a.gols_fora} {a.time_fora}{" "}
                    {flag(a.time_fora)}
                  </span>
                )}
                isAcertou={(a) => a.acertou}
                acertouBadge={(a) => {
                  if (cfgGol.status !== "apurada") return null;
                  return a.acertou ? (
                    <Badge className="bg-success text-success-foreground font-bold scale-90">
                      +10 pts
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="scale-90 text-muted-foreground">
                      0 pts
                    </Badge>
                  );
                }}
                loggedUserId={identidade?.id}
              />
            }
          />
        )}
      </div>

      <div className="max-w-2xl mx-auto text-center text-[10px] text-muted-foreground/80 mt-12 p-4 border-t border-border/30">
        🔒 Todas as apostas especiais são auditadas automaticamente e abertas publicamente para
        garantir a total integridade dos resultados.
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
  pointsText: string;
  resultadoReal: string | null;
  form: React.ReactNode;
  bets: React.ReactNode;
}

function SpecialBetTab({
  title,
  description,
  status,
  prazoFim,
  pointsText,
  resultadoReal,
  form,
  bets,
}: SpecialBetTabProps) {
  const isAberta = status === "aberta";

  return (
    <div className="space-y-4">
      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader className="pb-4 bg-secondary/10 border-b border-border/30">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                {title}
                <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-0 text-xs font-semibold py-0.5 px-2">
                  {pointsText}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1 text-xs sm:text-sm text-muted-foreground">
                {description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="flex gap-2 flex-wrap items-center">
            <Badge
              variant={isAberta ? "default" : "secondary"}
              className="capitalize text-[10px] py-0.5 px-2"
            >
              {isAberta ? "🔓 Aberto" : "🔒 Fechado"}
            </Badge>
            {isAberta && prazoFim && new Date(prazoFim).getFullYear() < 2090 && (
              <Badge
                variant="outline"
                className="text-[10px] py-0.5 px-2 text-muted-foreground border-border/80"
              >
                Fecha em: {countdown(prazoFim)}
              </Badge>
            )}
          </div>

          {resultadoReal && (
            <div className="p-3 bg-success/10 border border-success/20 rounded-lg text-xs sm:text-sm text-success flex items-center gap-2">
              <span className="text-base">🎯</span>
              <span>
                Resultado Oficial: <strong>{resultadoReal}</strong>
              </span>
            </div>
          )}

          {!isAberta && status === "fechada" && (
            <div className="flex items-center gap-2 p-3 bg-secondary/35 rounded-lg border border-border text-xs text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              <span>As apostas para este módulo estão atualmente fechadas.</span>
            </div>
          )}

          {form}
        </CardContent>
      </Card>

      {bets}
    </div>
  );
}

interface BetsListProps {
  bets: any[];
  nomeMap: Map<string, string>;
  renderValue: (a: any) => React.ReactNode;
  isAcertou?: (a: any) => boolean | null | undefined;
  acertouBadge?: (a: any) => React.ReactNode;
  loggedUserId?: string;
}

function BetsList({
  bets = [],
  nomeMap,
  renderValue,
  isAcertou,
  acertouBadge,
  loggedUserId,
}: BetsListProps) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="py-3.5 border-b border-border/20 bg-secondary/5">
        <CardTitle className="text-sm font-semibold text-muted-foreground">
          Palpites Registrados ({bets.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-2 px-3 pb-3">
        {bets.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Nenhum palpite registrado ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border/40">
            {bets.map((a: any) => {
              const acertou = isAcertou ? isAcertou(a) === true : false;
              const isMe = loggedUserId && a.usuario_id === loggedUserId;
              return (
                <li
                  key={a.id}
                  className={`flex justify-between items-center py-2 px-2 text-xs rounded-lg transition-colors ${isMe ? "bg-primary/5 border border-primary/20" : "hover:bg-secondary/20"}`}
                >
                  <span
                    className={`font-medium ${acertou ? "text-success font-bold" : ""} ${isMe ? "text-primary font-semibold" : ""}`}
                  >
                    {nomeMap.get(a.usuario_id) ?? "—"}{" "}
                    {isMe && (
                      <span className="text-[9px] text-primary font-semibold ml-1">(Você)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-medium ${acertou ? "text-success font-bold" : "text-foreground"}`}
                    >
                      {renderValue(a)}
                    </span>
                    {acertouBadge
                      ? acertouBadge(a)
                      : acertou && <Badge className="bg-success scale-90">✓</Badge>}
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
