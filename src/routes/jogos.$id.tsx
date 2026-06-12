import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import { supabase, callFn, flag, countdown, fmtBRL, FASES_LABEL, getIdentidade } from "@/lib/bolao";
import { pollIntervalForStatus } from "@/lib/realtime";
import { verificarVezNaSequencia } from "@/lib/sorteio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IdentidadePicker, type Identidade } from "@/components/IdentidadePicker";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Minus, Plus, Dices } from "lucide-react";

export const Route = createFileRoute("/jogos/$id")({
  head: () => ({ meta: [{ title: "Palpite — Bolão Copa 2026" }, { name: "description", content: "Palpite no placar exato deste jogo." }] }),
  component: Page,
});

function GolInput({ label, value, onChange, disabled }: { label: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
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

  const { data: jogo, isLoading: loadingJogo, isError: errJogo, refetch: refetchJogo } = useQuery({
    queryKey: ["jogo", id],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*").eq("id", id).single()).data,
    refetchInterval: (q) => pollIntervalForStatus(q.state.data?.status),
  });

  const { data: stats } = useQuery({
    queryKey: ["jogo-stats", id],
    queryFn: async () => (await supabase.from("bolao_jogo_estatisticas").select("*").eq("jogo_id", id).maybeSingle()).data,
    refetchInterval: (q) => pollIntervalForStatus(jogo?.status),
    enabled: !!id,
  });

  const { data: sorteio, isLoading: loadingSorteio } = useQuery({
    queryKey: ["sorteio-jogo", id],
    queryFn: async () => callFn<any>("sorteio", undefined, "GET", 1, { jogo_id: id }),
    refetchInterval: 10000,
  });

  const realizarSorteio = useMutation({
    mutationFn: () => callFn("sorteio", { action: "realizar", jogo_id: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sorteio-jogo", id] });
      toast.success("Sorteio deste jogo realizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const { data: usuarios } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("nome")).data ?? [],
  });

  const { data: config } = useQuery({
    queryKey: ["config-global"],
    queryFn: async () => (await supabase.from("bolao_config").select("*").eq("id", 1).single()).data,
  });

  const { data: primeiroJogo } = useQuery({
    queryKey: ["primeiro-jogo-global"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("data_hora").order("data_hora", { ascending: true }).limit(1).maybeSingle()).data,
  });

  useEffect(() => {
    if (!identidade?.nome || identidade.id || !usuarios?.length) return;
    const u = usuarios.find(x => x.nome === identidade.nome);
    if (u) setIdentidade({ ...identidade, id: u.id });
  }, [identidade, usuarios]);

  const { data: palpites, isLoading: loadingPalpites } = useQuery({
    queryKey: ["palpites", id],
    queryFn: async () => (await supabase.from("bolao_palpites_publica").select("*").eq("jogo_id", id)).data ?? [],
    refetchInterval: (q) => pollIntervalForStatus(jogo?.status),
  });

  const enviar = useMutation({
    mutationFn: () => callFn("palpite-placar", {
      nome: identidade?.nome, pin: identidade?.pin,
      jogo_id: id, gols_casa: gc, gols_fora: gf,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["palpites", id] });
      toast.success("🎯 Palpite registrado com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const comPalpite = useMemo(
    () => new Set((palpites ?? []).map((p: { usuario_id: string }) => p.usuario_id)),
    [palpites],
  );

  const prazoExpirado = useMemo(() => {
    if (!jogo) return true;

    // Verificar se o bolão está fechado globalmente
    if (config?.status === "FECHADO" || config?.status === "FINALIZADO") return true;
    if (primeiroJogo) {
      const kickoff = new Date(primeiroJogo.data_hora);
      const deadline = new Date(kickoff.getTime() - 60 * 60 * 1000); // 1h antes do primeiro jogo
      if (new Date() >= deadline) return true;
    }

    const dataHoraJogo = new Date(jogo.data_hora);
    const dataHoraLimite = new Date(dataHoraJogo.getTime() - 60 * 60 * 1000); // 1h antes
    return dataHoraLimite <= new Date();
  }, [jogo, config, primeiroJogo]);


  const vez = useMemo(() => {
    const res = verificarVezNaSequencia(sorteio?.ordem ?? [], identidade?.id, comPalpite);
    if (prazoExpirado) {
      return { podeApostar: false, mensagem: "Prazo de palpite encerrado (limite de 1 hora antes do jogo)." };
    }
    return res;
  }, [sorteio?.ordem, identidade?.id, comPalpite, prazoExpirado]);

  const ehMinhaVezDeFato = useMemo(() => {
    if (prazoExpirado || !identidade?.id || !sorteio?.ordem || !sorteio?.realizado) return false;
    for (const item of (sorteio.ordem ?? [])) {
      if (!comPalpite.has(item.usuario_id)) {
        return item.usuario_id === identidade.id;
      }
    }
    return false;
  }, [sorteio?.ordem, comPalpite, identidade?.id, prazoExpirado, sorteio?.realizado]);

  useEffect(() => {
    if (!jogo || !identidade || !palpites) return;
    if (jogo.status !== "encerrado" && jogo.status !== "apurado") return;
    const meu = palpites.find((p: { usuario_id: string; acertou?: boolean }) => p.usuario_id === identidade.id);
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
        <Link to="/jogos" className="text-sm text-muted-foreground hover:text-foreground inline-block mb-4">← Todos os jogos</Link>
        <ErrorState message="Não foi possível carregar este jogo." onRetry={() => refetchJogo()} />
      </div>
    );
  }

  const future = new Date(jogo.data_hora) > new Date();
  const revelado = !future;
  const acumulado = Number(jogo.acumulado || 0);
  const nP = palpites?.length ?? 0;
  const poolEstimado = nP * Number(jogo.valor_entrada) + acumulado;
  const nomeMap = new Map((usuarios ?? []).map(u => [u.id, u.nome]));
  const ordem = sorteio?.ordem ?? [];

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-in">
      <Link to="/jogos" className="text-sm text-muted-foreground hover:text-foreground">← Todos os jogos</Link>

      <Card className={`bg-pitch shadow-card border-2 ${
        ehMinhaVezDeFato ? "border-green-500 bg-green-500/5 card-minha-vez" : "border-border"
      }`}>
        <CardContent className="py-6 sm:py-8 text-center px-4">
          <div className="text-xs text-muted-foreground mb-3">
            {FASES_LABEL[jogo.fase]} • {new Date(jogo.data_hora).toLocaleString("pt-BR")}
          </div>
          <div className="flex items-center justify-center gap-3 sm:gap-8">
            <div className="text-center flex-1">
              <div className="text-4xl sm:text-6xl">{flag(jogo.time_casa)}</div>
              <div className="text-display text-sm sm:text-xl mt-2 leading-tight">{jogo.time_casa}</div>
            </div>
            <div className="text-display game-hero-score text-4xl sm:text-6xl text-primary shrink-0">
              {jogo.placar_casa ?? "–"} <span className="text-muted-foreground">:</span> {jogo.placar_fora ?? "–"}
            </div>
            <div className="text-center flex-1">
              <div className="text-4xl sm:text-6xl">{flag(jogo.time_fora)}</div>
              <div className="text-display text-sm sm:text-xl mt-2 leading-tight">{jogo.time_fora}</div>
            </div>
          </div>
          <div className="mt-4 flex justify-center gap-2 flex-wrap">
            {jogo.e_brasil && <Badge className="bg-gold-gradient text-black">Brasil • R$10</Badge>}
            {!jogo.e_brasil && <Badge variant="outline">R$5 por palpite</Badge>}
            {jogo.status === "ao_vivo" && (
              <Badge className="bg-destructive animate-pulse">
                AO VIVO{jogo.minuto_jogo != null ? ` ${jogo.minuto_jogo}'` : ""}
              </Badge>
            )}
            {future && <Badge variant="secondary">Fecha em {countdown(jogo.data_hora)}</Badge>}
            {poolEstimado > 0 && <Badge className="bg-primary/20 text-primary border-primary/40">Pool: {fmtBRL(poolEstimado)}</Badge>}
          </div>
          {jogo.estadio && <p className="text-xs text-muted-foreground mt-2">🏟️ {jogo.estadio}</p>}
        </CardContent>
      </Card>

      {jogo.status === "ao_vivo" && stats && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Estatísticas ao vivo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div>
                <div className="text-muted-foreground text-xs">Posse</div>
                <div className="font-semibold">{stats.posse_casa ?? "—"}% × {stats.posse_fora ?? "—"}%</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">Chutes</div>
                <div className="font-semibold">{stats.chutes_casa} × {stats.chutes_fora}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs">No gol</div>
                <div className="font-semibold">{stats.chutes_gol_casa} × {stats.chutes_gol_fora}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sorteio deste jogo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Dices className="h-5 w-5 text-primary" />
            Sorteio deste jogo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loadingSorteio || realizarSorteio.isPending ? (
            <p className="text-sm text-muted-foreground text-center py-2">Realizando sorteio...</p>
          ) : !sorteio?.realizado ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">Aguardando o administrador realizar o sorteio deste jogo.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Palpites seguem esta ordem. Quem já apostou pode alterar o palpite a qualquer momento.
              </p>
              <ol className="space-y-1.5">
                {ordem.map((o: { usuario_id: string; posicao: number; nome: string }) => {
                  const apostou = comPalpite.has(o.usuario_id);
                  const ehEu = o.usuario_id === identidade?.id;
                  const ehVez = !apostou && vez.aguardando === o.nome;
                  return (
                    <li
                      key={o.usuario_id}
                      className={`flex items-center justify-between p-2 rounded-lg border text-sm ${
                        ehVez ? "border-primary bg-primary/10 font-semibold" :
                        apostou ? "border-border bg-secondary/20 opacity-80" :
                        "border-border"
                      }`}
                    >
                      <span>
                        {o.posicao === 1 ? "🥇" : o.posicao === 2 ? "🥈" : o.posicao === 3 ? "🥉" : `${o.posicao}º`}
                        {" "}{o.nome}{ehEu ? " (você)" : ""}
                      </span>
                      <Badge variant={apostou ? "secondary" : ehVez ? "default" : "outline"}>
                        {apostou ? "Apostou" : ehVez ? "Sua vez" : "Aguardando"}
                      </Badge>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </CardContent>
      </Card>

      {future && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Seu palpite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <IdentidadePicker value={identidade} onChange={setIdentidade} />
            {!vez.podeApostar && vez.mensagem && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                {vez.mensagem}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <GolInput
                label={`${flag(jogo.time_casa)} ${jogo.time_casa}`}
                value={gc}
                onChange={setGc}
                disabled={!vez.podeApostar}
              />
              <GolInput
                label={`${flag(jogo.time_fora)} ${jogo.time_fora}`}
                value={gf}
                onChange={setGf}
                disabled={!vez.podeApostar}
              />
            </div>
            <div className="text-center text-display text-3xl text-muted-foreground py-1">
              {gc} × {gf}
            </div>
            <Button
              onClick={() => enviar.mutate()}
              disabled={!identidade?.nome || !vez.podeApostar || !sorteio?.realizado || enviar.isPending}
              className="w-full btn-touch"
              size="lg"
            >
              {enviar.isPending ? "Enviando..." : "Registrar palpite"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Palpites ({nP})</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingPalpites ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="skeleton h-10 rounded" />)}
            </div>
          ) : nP === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {future ? "Ninguém palpitou ainda. Seja o primeiro!" : "Nenhum palpite registrado."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {palpites!.map((p: { id: string; usuario_id: string; gols_casa?: number; gols_fora?: number; acertou?: boolean }) => {
                const acertou = p.acertou === true;
                const nome = nomeMap.get(p.usuario_id) ?? "—";
                return (
                  <li key={p.id} className={`flex justify-between items-center py-3 ${acertou ? "text-success font-bold" : ""}`}>
                    <span className="font-medium">{nome}</span>
                    <span className="text-display text-xl">
                      {revelado
                        ? (p.gols_casa != null ? `${p.gols_casa} : ${p.gols_fora}` : "—")
                        : "🔒"}
                      {acertou && " ✓"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
