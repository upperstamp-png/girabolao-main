import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { supabase, callFn, flag, countdown, fmtBRL, FASES_LABEL } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { IdentidadePicker, type Identidade } from "@/components/IdentidadePicker";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/jogos/$id")({
  head: () => ({ meta: [{ title: "Palpite — Bolão Copa 2026" }, { name: "description", content: "Palpite no placar exato deste jogo." }] }),
  component: Page,
});

function GolInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-sm text-muted-foreground text-center">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="h-11 w-11 rounded-full border border-border bg-secondary flex items-center justify-center hover:bg-secondary/80 active:scale-95 transition-all btn-touch"
          aria-label="Diminuir"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="text-display text-5xl w-12 text-center text-primary">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(30, value + 1))}
          className="h-11 w-11 rounded-full border border-border bg-secondary flex items-center justify-center hover:bg-secondary/80 active:scale-95 transition-all btn-touch"
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
  const [identidade, setIdentidade] = useState<Identidade | null>(null);
  const [gc, setGc] = useState(0);
  const [gf, setGf] = useState(0);

  const { data: jogo, isLoading: loadingJogo, isError: errJogo, refetch: refetchJogo } = useQuery({
    queryKey: ["jogo", id],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*").eq("id", id).single()).data,
    refetchInterval: 15000,
  });
  const { data: usuarios } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("nome")).data ?? [],
  });
  const { data: palpites, isLoading: loadingPalpites } = useQuery({
    queryKey: ["palpites", id],
    queryFn: async () => (await supabase.from("bolao_palpites_publica").select("*").eq("jogo_id", id)).data ?? [],
    refetchInterval: 15000,
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

  // Confete quando o jogo encerra e o usuário acertou
  useEffect(() => {
    if (!jogo || !identidade || !palpites) return;
    if (jogo.status !== "encerrado" && jogo.status !== "apurado") return;
    const meu = palpites.find((p: any) => usuarios?.find(u => u.id === p.usuario_id)?.nome === identidade.nome);
    if (meu?.acertou) confetti({ particleCount: 200, spread: 80, origin: { y: 0.4 } });
  }, [jogo?.status, palpites]);

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

  return (
    <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-in">
      <Link to="/jogos" className="text-sm text-muted-foreground hover:text-foreground">← Todos os jogos</Link>

      {/* Header do jogo */}
      <Card className="bg-pitch shadow-card">
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
            {jogo.status === "ao_vivo" && <Badge className="bg-destructive animate-pulse">AO VIVO</Badge>}
            {future && <Badge variant="secondary">Fecha em {countdown(jogo.data_hora)}</Badge>}
            {poolEstimado > 0 && <Badge className="bg-primary/20 text-primary border-primary/40">Pool: {fmtBRL(poolEstimado)}</Badge>}
          </div>
          {jogo.estadio && <p className="text-xs text-muted-foreground mt-2">🏟️ {jogo.estadio}</p>}
        </CardContent>
      </Card>

      {/* Formulário de palpite */}
      {future && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Seu palpite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <IdentidadePicker value={identidade} onChange={setIdentidade} />
            <div className="grid grid-cols-2 gap-4">
              <GolInput
                label={`${flag(jogo.time_casa)} ${jogo.time_casa}`}
                value={gc}
                onChange={setGc}
              />
              <GolInput
                label={`${flag(jogo.time_fora)} ${jogo.time_fora}`}
                value={gf}
                onChange={setGf}
              />
            </div>
            <div className="text-center text-display text-3xl text-muted-foreground py-1">
              {gc} × {gf}
            </div>
            <Button
              onClick={() => enviar.mutate()}
              disabled={!identidade?.nome || enviar.isPending}
              className="w-full btn-touch"
              size="lg"
            >
              {enviar.isPending ? "Enviando..." : "Registrar palpite"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de palpites */}
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
              {palpites!.map((p: any) => {
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
