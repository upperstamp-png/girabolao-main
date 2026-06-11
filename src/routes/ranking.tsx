import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase, fmtBRL } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "Ranking — Bolão Copa 2026" }, { name: "description", content: "Ranking geral dos participantes do bolão." }] }),
  component: Page,
});

function Page() {
  const { data: usuarios, isLoading: loadingU, isError: errU, refetch } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("nome")).data ?? [],
  });
  const { data: premios, isLoading: loadingP } = useQuery({
    queryKey: ["premios-all"],
    queryFn: async () => (await supabase.from("bolao_premios").select("*").order("criado_em", { ascending: false })).data ?? [],
    refetchInterval: 30000,
  });
  const { data: palpites } = useQuery({
    queryKey: ["palpites-all"],
    queryFn: async () => (await supabase.from("bolao_palpites").select("usuario_id, acertou")).data ?? [],
    refetchInterval: 30000,
  });
  const { data: apostasArt } = useQuery({
    queryKey: ["apostas-art-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_artilheiro").select("usuario_id, acertou")).data ?? [],
  });
  const { data: apostasFin } = useQuery({
    queryKey: ["apostas-fin-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_finalistas").select("usuario_id, acertou_os_dois")).data ?? [],
  });

  const ranking = useMemo(() => {
    return (usuarios ?? []).map(u => {
      const acertosPlacar = (palpites ?? []).filter(p => p.usuario_id === u.id && p.acertou).length;
      const acertouArt = !!(apostasArt ?? []).find(a => a.usuario_id === u.id)?.acertou;
      const acertouFin = !!(apostasFin ?? []).find(a => a.usuario_id === u.id)?.acertou_os_dois;
      const total = (premios ?? []).filter(p => p.usuario_id === u.id).reduce((s, p) => s + Number(p.valor), 0);
      return { ...u, acertosPlacar, acertouArt, acertouFin, total };
    }).sort((a, b) => b.total - a.total || b.acertosPlacar - a.acertosPlacar);
  }, [usuarios, palpites, apostasArt, apostasFin, premios]);

  const acumulados = useMemo(() => ({
    placar: (premios ?? []).filter(p => p.modalidade === "placar" && p.status === "acumulado").reduce((s, p) => s + Number(p.valor), 0),
    artilheiro: (premios ?? []).filter(p => p.modalidade === "artilheiro" && p.status === "acumulado").reduce((s, p) => s + Number(p.valor), 0),
    finalistas: (premios ?? []).filter(p => p.modalidade === "finalistas" && p.status === "acumulado").reduce((s, p) => s + Number(p.valor), 0),
  }), [premios]);

  const isLoading = loadingU || loadingP;

  return (
    <div className="space-y-5 sm:space-y-6 animate-in">
      <div>
        <h1 className="text-display text-3xl sm:text-4xl">Ranking Geral</h1>
        <p className="text-muted-foreground text-sm mt-1">Total ganho em todas as modalidades.</p>
      </div>

      {/* Acumulados */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SmallStat label="Acum. placar" value={acumulados.placar} />
        <SmallStat label="Acum. artilheiro" value={acumulados.artilheiro} />
        <SmallStat label="Acum. finalistas" value={acumulados.finalistas} />
      </div>

      {isLoading && <SkeletonCard lines={6} />}
      {errU && <ErrorState message="Erro ao carregar ranking." onRetry={() => refetch()} />}

      {!isLoading && !errU && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Classificação</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {/* Tabela responsiva com scroll horizontal em telas pequenas */}
            <div className="table-scroll px-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground w-8">#</th>
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">⚽ Placar</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Art</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground">Fin</th>
                    <th className="text-right py-2 pl-3 font-medium text-muted-foreground whitespace-nowrap">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum dado disponível ainda.
                      </td>
                    </tr>
                  ) : ranking.map((u, i) => (
                    <tr key={u.id} className={`border-b border-border/50 ${i === 0 ? "bg-gold-gradient/5" : ""}`}>
                      <td className="py-3 pr-3 text-lg">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-muted-foreground">{i + 1}</span>}
                      </td>
                      <td className="py-3 pr-3 font-medium">{u.nome}</td>
                      <td className="py-3 px-2 text-center">{u.acertosPlacar}</td>
                      <td className="py-3 px-2 text-center">{u.acertouArt ? "✓" : "—"}</td>
                      <td className="py-3 px-2 text-center">{u.acertouFin ? "✓" : "—"}</td>
                      <td className="py-3 pl-3 text-right text-display text-base text-primary font-bold">
                        {fmtBRL(u.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico */}
      {(premios?.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Histórico de prêmios</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {premios!.slice(0, 20).map(p => {
                const u = usuarios?.find(x => x.id === p.usuario_id);
                return (
                  <li key={p.id} className="flex justify-between items-center py-2 gap-2">
                    <span className="text-muted-foreground text-xs truncate">
                      {new Date(p.criado_em).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })} • {p.modalidade}
                    </span>
                    <span className="shrink-0">
                      {u?.nome ?? "💰 acumulado"} · <strong className="text-primary">{fmtBRL(p.valor)}</strong>
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="py-3 px-3 sm:py-4">
        <div className="text-xs text-muted-foreground leading-tight">{label}</div>
        <div className="text-display text-lg sm:text-2xl text-gold mt-1">{fmtBRL(value)}</div>
      </CardContent>
    </Card>
  );
}
