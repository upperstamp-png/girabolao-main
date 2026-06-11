import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { callFn } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Dices, Trophy, ArrowRight, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/sorteio")({
  head: () => ({
    meta: [
      { title: "Sorteio de Ordem — Bolão Copa 2026" },
      { name: "description", content: "Ordem de escolha dos participantes para o bolão da Copa 2026." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: sorteio, isLoading, isError, refetch } = useQuery({
    queryKey: ["sorteio-publico"],
    queryFn: async () => callFn<any>("sorteio", undefined, "GET"),
  });

  const realizado = sorteio?.realizado ?? false;
  const ordem = sorteio?.ordem ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in">
      <div>
        <h1 className="text-display text-3xl sm:text-4xl flex items-center gap-2">
          <Dices className="h-8 w-8 text-primary shrink-0" />
          Sorteio de Ordem
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          A ordem de escolha dos times/participantes para o Bolão da Copa 2026.
        </p>
      </div>

      {isLoading && <SkeletonCard lines={6} />}
      {isError && <ErrorState message="Erro ao carregar sorteio." onRetry={() => refetch()} />}

      {!isLoading && !isError && (
        <>
          {!realizado ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-10 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center animate-bounce">
                  <Dices className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">Aguardando sorteio</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    A ordem de escolha ainda não foi sorteada pelo administrador. Fique atento para o início!
                  </p>
                </div>
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="btn-touch flex items-center gap-2">
                    Ir para Admin <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Ordem Sorteada
                  </CardTitle>
                  <Badge variant="success">Realizado</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {ordem.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum participante na ordem.
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {ordem.map((o: any) => {
                      const isTop3 = o.posicao <= 3;
                      const bgClass =
                        o.posicao === 1 ? "bg-amber-500/10 border-amber-500/30 text-amber-500 font-bold" :
                        o.posicao === 2 ? "bg-slate-400/10 border-slate-400/30 text-slate-300" :
                        o.posicao === 3 ? "bg-amber-700/10 border-amber-700/30 text-amber-700" :
                        "bg-card border-border hover:bg-secondary/20";

                      return (
                        <li
                          key={o.usuario_id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${bgClass}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg w-8 text-center font-mono">
                              {o.posicao === 1 ? "🥇" : o.posicao === 2 ? "🥈" : o.posicao === 3 ? "🥉" : `${o.posicao}º`}
                            </span>
                            <span className="font-semibold text-foreground">{o.nome}</span>
                          </div>
                          {isTop3 && (
                            <Badge variant="outline" className="text-xs uppercase scale-90 select-none">
                              {o.posicao === 1 ? "1º Escolha" : o.posicao === 2 ? "2º Escolha" : "3º Escolha"}
                            </Badge>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border">
            <ShieldAlert className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              A ordem do sorteio define a ordem em que os participantes podem palpitar nos jogos quando houver restrições, se aplicável, ou a prioridade na escolha de seleções.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
