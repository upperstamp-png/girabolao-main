import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase, flag, countdown, FASES_LABEL, getIdentidade } from "@/lib/bolao";
import { POLL } from "@/lib/realtime";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";

export const Route = createFileRoute("/jogos/")({
  head: () => ({ meta: [{ title: "Jogos — Bolão Copa 2026" }, { name: "description", content: "Todos os jogos da Copa 2026, palpite no placar exato." }] }),
  component: Page,
});

function Page() {
  const [fase, setFase] = useState<string>("todos");
  const identidade = getIdentidade();

  const { data: config } = useQuery({
    queryKey: ["config-global-index"],
    queryFn: async () => (await supabase.from("bolao_config").select("*").eq("id", 1).single()).data,
  });

  const { data: primeiroJogo } = useQuery({
    queryKey: ["primeiro-jogo-global-index"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("data_hora").order("data_hora", { ascending: true }).limit(1).maybeSingle()).data,
  });

  const { data: jogos, isLoading: loadingJogos, isError: errJogos, refetch: refetchJogos } = useQuery({
    queryKey: ["jogos-all"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*").order("data_hora")).data ?? [],
    refetchInterval: (query) => {
      const list = query.state.data ?? [];
      return list.some((j: { status?: string }) => j.status === "ao_vivo") ? POLL.LIVE : POLL.NORMAL;
    },
  });



  const filtrados = (jogos ?? []).filter(j => fase === "todos" || j.fase === fase);
  const isLoading = loadingJogos;
  const isError = errJogos;
  const refetch = refetchJogos;

  return (
    <div className="space-y-5 animate-in">
      <div>
        <h1 className="text-display text-3xl sm:text-4xl">Jogos da Copa</h1>
        <p className="text-muted-foreground text-sm mt-1">Toque em um jogo para fazer seu palpite.</p>
      </div>

      {/* Tabs com scroll horizontal em mobile */}
      <div className="table-scroll pb-1">
        <Tabs value={fase} onValueChange={setFase}>
          <TabsList className="flex h-auto w-max min-w-full">
            <TabsTrigger value="todos" className="shrink-0">Todos</TabsTrigger>
            {Object.entries(FASES_LABEL).map(([k, v]) => (
              <TabsTrigger key={k} value={k} className="shrink-0">{v}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading && (
        <div className="grid sm:grid-cols-2 gap-3">
          {[1,2,3,4,5,6].map(i => <SkeletonCard key={i} lines={3} />)}
        </div>
      )}

      {isError && (
        <ErrorState
          message="Não foi possível carregar os jogos."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (
        filtrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <div className="text-3xl mb-2">📋</div>
              {jogos?.length === 0
                ? "Nenhum jogo carregado. Sincronize na aba Admin."
                : "Nenhum jogo nessa fase ainda."
              }
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtrados.map(j => {
              const future = new Date(j.data_hora) > new Date();



              return (
                <Link key={j.id} to="/jogos/$id" params={{ id: j.id }}>
                  <Card className="hover:shadow-glow transition-all cursor-pointer active:scale-[0.99] border-2 border-border">
                    <CardContent className="py-3 sm:py-4">
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                        <span className="truncate">{FASES_LABEL[j.fase]}</span>
                        <span className="shrink-0 ml-2">
                          {new Date(j.data_hora).toLocaleString("pt-BR", { day:"2-digit", month:"2-digit", hour:"2-digit", minute:"2-digit" })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-display text-base sm:text-lg flex-1 min-w-0 truncate">
                          {flag(j.time_casa)} {j.time_casa}
                        </div>
                        {j.placar_casa != null ? (
                          <div className="text-display text-2xl sm:text-3xl text-primary shrink-0">
                            {j.placar_casa} : {j.placar_fora}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground shrink-0">
                            {future ? countdown(j.data_hora) : "—"}
                          </div>
                        )}
                        <div className="text-display text-base sm:text-lg flex-1 min-w-0 truncate text-right">
                          {j.time_fora} {flag(j.time_fora)}
                        </div>
                      </div>



                      <div className="mt-2 flex items-center gap-2 text-xs flex-wrap">
                        {j.e_brasil && <Badge className="bg-gold-gradient text-black text-xs">Brasil</Badge>}
                        {j.status === "ao_vivo" && <Badge className="bg-destructive animate-pulse text-xs">AO VIVO</Badge>}
                        {j.status === "apurado" && <Badge variant="secondary" className="text-xs">Apurado</Badge>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
