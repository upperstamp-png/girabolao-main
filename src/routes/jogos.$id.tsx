import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import {
  supabase,
  callFn,
  flag,
  countdown,
  FASES_LABEL,
  getIdentidade,
  calcularPontosPalpite,
} from "@/lib/bolao";
import { pollIntervalForStatus } from "@/lib/realtime";
import { ReactionBar } from "@/components/ReactionBar";
import { useSharePrediction } from "@/lib/shareCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IdentidadePicker, type Identidade } from "@/components/IdentidadePicker";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Minus, Plus, ArrowRight, Share2 } from "lucide-react";

export const Route = createFileRoute("/jogos/$id")({
  head: () => ({
    meta: [
      { title: "Palpite — Bolão Copa 2026" },
      { name: "description", content: "Palpite no placar exato deste jogo." },
    ],
  }),
  component: Page,
});

function GolInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-muted-foreground text-center">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-11 w-11 rounded-full border border-border bg-secondary flex items-center justify-center hover:bg-secondary/80 active:scale-95 transition-all btn-touch disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Diminuir"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-display text-5xl w-12 text-center text-primary">{value}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(Math.min(30, value + 1))}
          className="h-11 w-11 rounded-full border border-border bg-secondary flex items-center justify-center hover:bg-secondary/80 active:scale-95 transition-all btn-touch disabled:opacity-50 disabled:pointer-events-none"
          aria-label="Aumentar"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Page() {
  const { id } = useParams({ from: "/jogos/$id" });
  const qc = useQueryClient();
  const [identidade, setIdentidade] = useState<Identidade | null>(() => getIdentidade());
  const [gc, setGc] = useState(0);
  const [gf, setGf] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();
  const sharePrediction = useSharePrediction();

  const {
    data: jogo,
    isLoading: loadingJogo,
    isError: errJogo,
    refetch: refetchJogo,
  } = useQuery({
    queryKey: ["jogo", id],
    queryFn: async () =>
      (await supabase.from("bolao_jogos").select("*").eq("id", id).single()).data,
    refetchInterval: (q) => pollIntervalForStatus(q.state.data?.status),
  });

  const { data: stats } = useQuery({
    queryKey: ["jogo-stats", id],
    queryFn: async () =>
      (await supabase.from("bolao_jogo_estatisticas").select("*").eq("jogo_id", id).maybeSingle())
        .data,
    refetchInterval: (q) => pollIntervalForStatus(jogo?.status),
    enabled: !!id,
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

  const { data: config } = useQuery({
    queryKey: ["config-global"],
    queryFn: async () =>
      (await supabase.from("bolao_config").select("*").eq("id", 1).single()).data,
  });

  const { data: primeiroJogo } = useQuery({
    queryKey: ["primeiro-jogo-global"],
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

  useEffect(() => {
    if (!identidade?.nome || identidade.id || !usuarios?.length) return;
    const u = usuarios.find((x) => x.nome === identidade.nome);
    if (u) setIdentidade({ ...identidade, id: u.id });
  }, [identidade, usuarios]);

  const { data: palpites, isLoading: loadingPalpites } = useQuery({
    queryKey: ["palpites", id],
    queryFn: async () =>
      (await supabase.from("bolao_palpites_publica").select("*").eq("jogo_id", id)).data ?? [],
    refetchInterval: (q) => pollIntervalForStatus(jogo?.status),
  });

  const { data: meuPalpiteRaw } = useQuery({
    queryKey: ["meu-palpite-raw", id, identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return null;
      return (
        await supabase
          .from("bolao_palpites")
          .select("*")
          .eq("jogo_id", id)
          .eq("usuario_id", identidade.id)
          .maybeSingle()
      ).data;
    },
    enabled: !!identidade?.id,
  });

  const { data: eventos } = useQuery({
    queryKey: ["jogo-eventos", id],
    queryFn: async () =>
      (
        await supabase
          .from("bolao_jogo_eventos")
          .select("*")
          .eq("jogo_id", id)
          .order("minuto", { ascending: false })
      ).data ?? [],
    refetchInterval: (q) => pollIntervalForStatus(jogo?.status),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id || !identidade?.id) return;

    // 1. Carregar do LocalStorage (Rascunho) - Apenas se não tiver palpite no banco
    const draftKey = `bolao_draft_palpite_${id}`;
    const draft = localStorage.getItem(draftKey);
    if (draft && !meuPalpiteRaw) {
      try {
        const { gc: dGc, gf: dGf } = JSON.parse(draft);
        setGc(dGc);
        setGf(dGf);
        setHasDraft(true);
        setInitialized(true);
        return;
      } catch {}
    }

    // 2. Se não houver rascunho ou se já tiver palpite no banco, iniciar com o do banco
    if (!initialized && meuPalpiteRaw) {
      setGc(meuPalpiteRaw.gols_casa);
      setGf(meuPalpiteRaw.gols_fora);
      setInitialized(true);
    } else if (!initialized && palpites !== undefined) {
      setInitialized(true);
    }
  }, [id, identidade?.id, meuPalpiteRaw, palpites, initialized]);

  useEffect(() => {
    if (!initialized || !id || !identidade?.id) return;

    const draftKey = `bolao_draft_palpite_${id}`;
    const isMatchDb = meuPalpiteRaw && meuPalpiteRaw.gols_casa === gc && meuPalpiteRaw.gols_fora === gf;
    const isDefaultZero = !meuPalpiteRaw && gc === 0 && gf === 0;

    if (isMatchDb || isDefaultZero || meuPalpiteRaw) {
      localStorage.removeItem(draftKey);
      setHasDraft(false);
    } else {
      localStorage.setItem(draftKey, JSON.stringify({ gc, gf }));
      setHasDraft(true);
    }
  }, [gc, gf, id, identidade?.id, meuPalpiteRaw, initialized]);

  const enviar = useMutation({
    mutationFn: () => {
      return callFn("palpite-placar", {
        nome: identidade?.nome,
        pin: identidade?.pin,
        jogo_id: id,
        gols_casa: gc,
        gols_fora: gf,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["palpites", id] });
      qc.invalidateQueries({ queryKey: ["meu-palpite-raw", id, identidade?.id] });
      qc.invalidateQueries({ queryKey: ["user-palpites"] });
      localStorage.removeItem(`bolao_draft_palpite_${id}`);
      setHasDraft(false);
      toast.success("🎯 Palpite registrado com sucesso!");
      setSaved(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // All future games for multi-game navigation
  const { data: allGames } = useQuery({
    queryKey: ["jogos-nav"],
    queryFn: async () =>
      (await supabase.from("bolao_jogos").select("id, data_hora").order("data_hora")).data ?? [],
    staleTime: 60000,
  });

  const { data: allUserPalpites } = useQuery({
    queryKey: ["user-palpites-nav", identidade?.id],
    queryFn: async () => {
      if (!identidade?.id) return [];
      return (
        (await supabase.from("bolao_palpites").select("jogo_id").eq("usuario_id", identidade.id))
          .data ?? []
      );
    },
    enabled: !!identidade?.id,
  });

  const nextUnpredictedGame = useMemo(() => {
    if (!allGames || !allUserPalpites) return null;
    const predictedSet = new Set(allUserPalpites.map((p) => p.jogo_id));
    const now = new Date();
    return (
      allGames.find((g) => g.id !== id && new Date(g.data_hora) > now && !predictedSet.has(g.id)) ??
      null
    );
  }, [allGames, allUserPalpites, id]);

  const comPalpite = useMemo(
    () => new Set((palpites ?? []).map((p: { usuario_id: string }) => p.usuario_id)),
    [palpites],
  );

  const prazoExpirado = useMemo(() => {
    if (!jogo) return true;

    // Bloqueado manualmente
    if (jogo.bloqueado_manual) return true;

    // Resultado confirmado — não pode mais apostar/alterar
    if (jogo.status === "encerrado" || jogo.status === "apurado") return true;

    // Prazo de 15 minutos após início da partida
    const dataInicio = new Date(jogo.data_hora);
    const limiteAposta = new Date(dataInicio.getTime() + 15 * 60 * 1000);
    if (new Date() > limiteAposta) return true;

    // Verificar se o bolão está fechado globalmente
    if (config?.status === "FECHADO" || config?.status === "FINALIZADO") return true;

    return false;
  }, [jogo, config]);

  // Status message to show the user
  const mensagemBloqueio = useMemo(() => {
    if (!jogo) return null;
    if (jogo.bloqueado_manual) {
      return "Palpites encerrados para este jogo (bloqueado manualmente pelo administrador).";
    }
    if (jogo.status === "encerrado" || jogo.status === "apurado") {
      return "Resultado confirmado. Palpites não podem mais ser alterados.";
    }
    const dataInicio = new Date(jogo.data_hora);
    const limiteAposta = new Date(dataInicio.getTime() + 15 * 60 * 1000);
    if (new Date() > limiteAposta) {
      return "Prazo limite de 15 minutos de jogo atingido — palpites encerrados.";
    }
    if (config?.status === "FECHADO" || config?.status === "FINALIZADO") {
      return "Bolão encerrado. Palpites não são mais aceitos.";
    }
    return null;
  }, [jogo, config]);

  useEffect(() => {
    if (!jogo || !identidade || !palpites) return;
    if (jogo.status !== "encerrado" && jogo.status !== "apurado") return;
    const meu = palpites.find(
      (p: { usuario_id: string; acertou?: boolean }) => p.usuario_id === identidade.id,
    );
    if (meu?.acertou) confetti({ particleCount: 200, spread: 80, origin: { y: 0.4 } });
  }, [jogo?.status, palpites, identidade?.id]);

  if (loadingJogo) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-in">
        <SkeletonCard lines={1} className="h-10 w-40" />
        <SkeletonCard lines={4} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  if (errJogo || !jogo) {
    return (
      <div className="max-w-3xl mx-auto">
        <Link
          to="/jogos"
          className="text-sm text-muted-foreground hover:text-foreground inline-block mb-4"
        >
          ← Todos os jogos
        </Link>
        <ErrorState message="Não foi possível carregar este jogo." onRetry={() => refetchJogo()} />
      </div>
    );
  }

  const future = new Date(jogo.data_hora) > new Date();
  const revelado = true;
  const acumulado = Number(jogo.acumulado || 0);
  const nP = palpites?.length ?? 0;
  const poolEstimado = nP * Number(jogo.valor_entrada) + acumulado;
  const nomeMap = new Map((usuarios ?? []).map((u) => [u.id, u.nome]));

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-in">
      <Link to="/jogos" className="text-sm text-muted-foreground hover:text-foreground">
        ← Todos os jogos
      </Link>

      <Card className="bg-pitch shadow-card border-2 border-border">
        <CardContent className="py-6 sm:py-8 text-center px-4">
          <div className="text-xs text-muted-foreground mb-3">
            {FASES_LABEL[jogo.fase]} • {new Date(jogo.data_hora).toLocaleString("pt-BR")}
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-8">
            <div className="text-center flex-1">
              <div className="text-4xl sm:text-6xl">{flag(jogo.time_casa)}</div>
              <div className="text-display text-sm sm:text-xl mt-2 leading-tight">
                {jogo.time_casa}
              </div>
            </div>
            <div className="text-display game-hero-score text-4xl sm:text-6xl text-primary shrink-0">
              {jogo.placar_casa ?? "–"} <span className="text-muted-foreground">:</span>{" "}
              {jogo.placar_fora ?? "–"}
            </div>
            <div className="text-center flex-1">
              <div className="text-4xl sm:text-6xl">{flag(jogo.time_fora)}</div>
              <div className="text-display text-sm sm:text-xl mt-2 leading-tight">
                {jogo.time_fora}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            {jogo.e_brasil && <Badge className="bg-gold-gradient text-black">Brasil</Badge>}
            {jogo.status === "ao_vivo" && (
              <Badge className="bg-destructive animate-pulse">
                AO VIVO{jogo.minuto_jogo != null ? ` ${jogo.minuto_jogo}'` : ""}
              </Badge>
            )}
            {(jogo.status === "encerrado" || jogo.status === "apurado") && (
              <Badge variant="destructive">Encerrado</Badge>
            )}
          </div>
          {jogo.estadio && <p className="text-xs text-muted-foreground mt-2">🏟️ {jogo.estadio}</p>}
          <div className="pt-3">
            <ReactionBar jogoId={jogo.id} />
          </div>
        </CardContent>
      </Card>

      {jogo.status === "ao_vivo" && (
        <Card className="overflow-hidden border-destructive/30 shadow-glow animate-in fade-in-50 duration-300">
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
              📺 Transmissão ao vivo — CazéTV
            </CardTitle>
            <Button asChild size="sm" variant="outline" className="text-xs shrink-0 gap-1.5 h-8">
              <a
                href="https://www.youtube.com/@CazeTV/live"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir no YouTube ↗
              </a>
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-4">
            <div className="relative w-full aspect-video rounded-b-lg sm:rounded-lg overflow-hidden border border-border">
              <iframe
                src="https://www.youtube.com/embed/live_stream?channel=UC2uVqTzZp8r9Qp0wZ-Xy4hQ"
                title="CazéTV Live Stream"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
            <p className="text-xs text-muted-foreground p-3 text-center sm:pt-2 sm:pb-0">
              Se o vídeo acima aparecer como indisponível devido a restrições de direitos autorais
              do YouTube, clique no botão para assistir diretamente no canal da CazéTV.
            </p>
          </CardContent>
        </Card>
      )}

      {jogo.status === "ao_vivo" && stats && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Estatísticas ao vivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Posse</div>
                <div className="font-semibold">
                  {stats.posse_casa ?? "—"}% × {stats.posse_fora ?? "—"}%
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Chutes</div>
                <div className="font-semibold">
                  {stats.chutes_casa} × {stats.chutes_fora}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">No gol</div>
                <div className="font-semibold">
                  {stats.chutes_gol_casa} × {stats.chutes_gol_fora}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {!prazoExpirado && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4">
            <CardTitle>Seu palpite</CardTitle>
            {hasDraft && !meuPalpiteRaw && (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-500 border-amber-500/30 animate-pulse text-[10px] py-0.5 px-2"
              >
                ✍️ Rascunho salvo
              </Badge>
            )}
            {meuPalpiteRaw && (
              <Badge
                variant="outline"
                className="bg-success/15 text-success border-success/30 text-[10px] py-0.5 px-2 font-bold"
              >
                ✓ Confirmado
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-5">
            <IdentidadePicker value={identidade} onChange={setIdentidade} />
            <div className="grid grid-cols-2 gap-4">
              <GolInput
                label={`${flag(jogo.time_casa)} ${jogo.time_casa}`}
                value={gc}
                onChange={setGc}
                disabled={!!meuPalpiteRaw}
              />
              <GolInput
                label={`${flag(jogo.time_fora)} ${jogo.time_fora}`}
                value={gf}
                onChange={setGf}
                disabled={!!meuPalpiteRaw}
              />
            </div>
            <div className="text-center text-display text-3xl text-muted-foreground py-1">
              {gc} × {gf}
            </div>

            <Button
              onClick={() => enviar.mutate()}
              disabled={!identidade?.nome || enviar.isPending || !!meuPalpiteRaw}
              className="w-full btn-touch"
              size="lg"
            >
              {enviar.isPending
                ? "Enviando..."
                : meuPalpiteRaw
                  ? "Aposta Confirmada e Salva ✓"
                  : "Registrar palpite"}
            </Button>

            {/* Multi-game navigation */}
            {saved && nextUnpredictedGame && (
              <Button
                variant="outline"
                className="w-full btn-touch gap-2 border-primary/30 text-primary hover:bg-primary/10"
                size="lg"
                onClick={() =>
                  navigate({ to: "/jogos/$id", params: { id: nextUnpredictedGame.id } })
                }
              >
                Palpitar próximo jogo <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            {/* Share prediction */}
            {(saved || meuPalpiteRaw) && (
              <Button
                variant="outline"
                className="w-full btn-touch gap-2 text-muted-foreground hover:text-foreground"
                size="lg"
                onClick={() =>
                  sharePrediction({
                    timeCasa: jogo.time_casa,
                    timeFora: jogo.time_fora,
                    golsCasa: gc,
                    golsFora: gf,
                    fase: FASES_LABEL[jogo.fase] ?? jogo.fase,
                    dataHora: jogo.data_hora,
                    userName: identidade?.nome ?? "Anônimo",
                  })
                }
              >
                <Share2 className="h-4 w-4" /> Compartilhar palpite
              </Button>
            )}

            <p className="text-center text-[11px] text-muted-foreground leading-normal mt-2">
              💡 <strong>Regras de pontuação:</strong> Acertar placar exato = <strong>3 pts</strong>{" "}
              | Acertar vencedor ou empate = <strong>1 pt</strong>
            </p>
          </CardContent>
        </Card>
      )}

      {eventos && eventos.length > 0 && (
        <Card className="border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Eventos da Partida</CardTitle>
            {jogo.status === "ao_vivo" && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="relative border-l border-border pl-6 ml-3 space-y-5">
              {eventos.map((ev: any) => {
                let icon = "⚽";
                if (ev.tipo === "YELLOW_CARD" || ev.tipo === "cartao_amarelo") icon = "🟨";
                if (ev.tipo === "RED_CARD" || ev.tipo === "cartao_vermelho") icon = "🟥";
                if (ev.tipo === "SUBSTITUTION" || ev.tipo === "substituicao") icon = "🔄";
                
                const desc = ev.detalhe?.descricao || ev.descricao || `${ev.tipo.replace("_", " ")} - ${ev.time || ""}`;
                
                return (
                  <div key={ev.id} className="relative flex items-start gap-3 animate-in fade-in-50 duration-300">
                    <span className="absolute -left-[36px] flex h-6 w-6 items-center justify-center rounded-full bg-background border border-border text-xs">
                      {icon}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-red-500">{ev.minuto}</span>
                        <span className="text-sm font-semibold">{ev.jogador || "Lance"}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {prazoExpirado && mensagemBloqueio && (
        <div className="space-y-3">
          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200 text-center">
            🔒 {mensagemBloqueio}
          </div>
          {(() => {
            if (!meuPalpiteRaw || meuPalpiteRaw.gols_casa == null || meuPalpiteRaw.gols_fora == null)
              return null;
            return (
              <Button
                variant="outline"
                className="w-full btn-touch gap-2 text-muted-foreground hover:text-foreground"
                size="lg"
                onClick={() =>
                  sharePrediction({
                    timeCasa: jogo.time_casa,
                    timeFora: jogo.time_fora,
                    golsCasa: meuPalpiteRaw.gols_casa!,
                    golsFora: meuPalpiteRaw.gols_fora!,
                    fase: FASES_LABEL[jogo.fase] ?? jogo.fase,
                    dataHora: jogo.data_hora,
                    userName: identidade?.nome ?? "Anônimo",
                  })
                }
              >
                <Share2 className="h-4 w-4" /> Compartilhar palpite
              </Button>
            );
          })()}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Palpites ({nP})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPalpites ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-10 rounded" />
              ))}
            </div>
          ) : nP === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {future ? "Ninguém palpitou ainda. Seja o primeiro!" : "Nenhum palpite registrado."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {palpites!.map(
                (p: {
                  id: string;
                  usuario_id: string;
                  gols_casa?: number;
                  gols_fora?: number;
                  acertou?: boolean;
                }) => {
                  const nome = nomeMap.get(p.usuario_id) ?? "—";
                  const isMe = p.usuario_id === identidade?.id;
                  const gcExibido = isMe && meuPalpiteRaw ? meuPalpiteRaw.gols_casa : p.gols_casa;
                  const gfExibido = isMe && meuPalpiteRaw ? meuPalpiteRaw.gols_fora : p.gols_fora;

                  let pointsText = "";
                  let badgeColor = "";
                  let isCalculated = false;

                  if (
                    gcExibido != null &&
                    gfExibido != null &&
                    jogo.placar_casa != null &&
                    jogo.placar_fora != null
                  ) {
                    isCalculated = true;
                    const res = calcularPontosPalpite(
                      gcExibido,
                      gfExibido,
                      jogo.placar_casa,
                      jogo.placar_fora,
                    );
                    if (res.acertouPlacar) {
                      pointsText = "🎯 +3";
                      badgeColor = "bg-success text-success-foreground font-bold";
                    } else if (res.acertouResultado) {
                      pointsText = "⚽ +1";
                      badgeColor = "bg-primary/20 text-primary border border-primary/30";
                    } else {
                      pointsText = "❌ 0";
                      badgeColor = "bg-secondary text-muted-foreground";
                    }
                  }

                  return (
                    <li
                      key={p.id}
                      className="flex justify-between items-center py-2.5 border-b border-border/30 last:border-0 hover:bg-secondary/10 px-2 rounded-md transition-colors"
                    >
                      <span className="font-medium">
                        {nome}{" "}
                        {p.usuario_id === identidade?.id ? (
                          <span className="text-xs text-primary font-semibold">(Você)</span>
                        ) : (
                          ""
                        )}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold bg-secondary/35 px-2 py-0.5 rounded text-sm">
                          {gcExibido != null && gfExibido != null ? `${gcExibido} × ${gfExibido}` : "— × —"}
                        </span>
                        {isCalculated ? (
                          <Badge className={`${badgeColor} text-[10px] py-0.5 px-1.5 shrink-0`}>
                            {pointsText}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[10px] italic">
                            Aguardando
                          </span>
                        )}
                      </div>
                    </li>
                  );
                },
              )}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
