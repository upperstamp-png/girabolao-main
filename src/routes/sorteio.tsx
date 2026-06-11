import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { callFn, flag, supabase } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Dices, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/sorteio")({
  head: () => ({
    meta: [
      { title: "Sorteio por Jogo — Bolão Copa 2026" },
      { name: "description", content: "Ordem de palpites de cada jogo do bolão." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: jogos, isLoading, isError, refetch } = useQuery({
    queryKey: ["jogos-sorteio"],
    queryFn: async () => {
      const { data } = await supabase
        .from("bolao_jogos")
        .select("id, time_casa, time_fora, data_hora, fase, sorteio_realizado")
        .order("data_hora");
      return data ?? [];
    },
  });

  const proximos = (jogos ?? []).filter(j => new Date(j.data_hora) > new Date());

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-display text-3xl sm:text-4xl flex items-center gap-2">
          <Dices className="h-8 w-8 text-primary shrink-0" />
          Sorteio por Jogo
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Cada partida tem seu próprio sorteio. A ordem define quem palpita primeiro, segundo, e assim por diante.
        </p>
      </div>

      {isLoading && <SkeletonCard lines={6} />}
      {isError && <ErrorState message="Erro ao carregar jogos." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        proximos.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              Nenhum jogo futuro para sortear. Sincronize os jogos no Admin.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {proximos.map(j => (
              <Card key={j.id} className="hover:shadow-glow transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold">
                      {flag(j.time_casa)} {j.time_casa} × {j.time_fora} {flag(j.time_fora)}
                    </CardTitle>
                    <Badge variant={j.sorteio_realizado ? "success" : "secondary"}>
                      {j.sorteio_realizado ? "Sorteado" : "Pendente"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(j.data_hora).toLocaleString("pt-BR")}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link
                    to="/jogos/$id"
                    params={{ id: j.id }}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {j.sorteio_realizado ? "Ver ordem e palpitar" : "Abrir jogo e sortear"}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <p className="text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border">
        Ao abrir um jogo, o sorteio é feito automaticamente (se ainda não existir). Os palpites devem seguir a ordem sorteada — cada participante espera sua vez.
      </p>
    </div>
  );
}
