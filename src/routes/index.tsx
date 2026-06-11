import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, fmtBRL, flag, countdown, FASES_LABEL } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "Bolão Copa do Mundo 2026" },
      { name: "description", content: "Painel principal do bolão da Copa 2026 com placar, artilheiro e finalistas." },
    ],
  }),
  component: Index,
}));

function Index() {
  const { data: cfgArt, isError: errArt } = useQuery({
    queryKey: ["cfg-art"],
    queryFn: async () => (await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).single()).data,
    refetchInterval: 30000,
  });
  const { data: cfgFin } = useQuery({
    queryKey: ["cfg-fin"],
    queryFn: async () => (await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).single()).data,
    refetchInterval: 30000,
  });
  const { data: usuarios } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("criado_em")).data ?? [],
  });
  const { data: proximos, isLoading: loadingProximos, isError: errProximos, refetch: refetchProximos } = useQuery({
    queryKey: ["proximos"],
    queryFn: async () => (await supabase.from("bolao_jogos")
      .select("*").gte("data_hora", new Date().toISOString())
      .order("data_hora").limit(6)).data ?? [],
    refetchInterval: 60000,
  });
  const { data: jogoAtual } = useQuery({
    queryKey: ["jogo-atual"],
    queryFn: async () => {
      const { data } = await supabase.from("bolao_jogos")
        .select("*").order("data_hora").limit(1)
        .gte("data_hora", new Date(Date.now() - 3 * 3600000).toISOString());
      return data?.[0] ?? null;
    },
    refetchInterval: 30000,
  });

  const nParticipantes = usuarios?.length ?? 0;
  const poolArt = nParticipantes * 10 + Number(cfgArt?.acumulado_anterior || 0);
  const poolFin = nParticipantes * 10 + Number(cfgFin?.acumulado_anterior || 0);
  const acumuladoAtual = Number(jogoAtual?.acumulado || 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in">
      {/* Hero */}
      <section className="text-center py-8 sm:py-12 bg-pitch rounded-2xl shadow-card px-4">
        <div className="text-5xl sm:text-6xl mb-3">🏆⚽</div>
        <h1 className="text-display text-4xl sm:text-5xl md:text-6xl">Bolão Copa 2026</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base">
          Três modalidades, um campeonato. Faça seus palpites e acompanhe ao vivo.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Badge variant="secondary">{nParticipantes}/8 participantes</Badge>
          {acumuladoAtual > 0 && <Badge className="bg-gold-gradient text-black">Acumulado: {fmtBRL(acumuladoAtual)}</Badge>}
        </div>
      </section>

      {/* Pool cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <PoolCard
          emoji="🎯" title="Placar Exato"
          status={jogoAtual ? "Próximo jogo" : "Aguardando"}
          pool={jogoAtual ? Number(jogoAtual.valor_entrada) * nParticipantes + acumuladoAtual : 0}
          subtitle={jogoAtual
            ? `${flag(jogoAtual.time_casa)} ${jogoAtual.time_casa} × ${jogoAtual.time_fora} ${flag(jogoAtual.time_fora)}`
            : "Sem jogos próximos"}
          to="/jogos"
        />
        <PoolCard
          emoji="⚽" title="Artilheiro"
          status={cfgArt?.status ?? "..."}
          pool={poolArt}
          subtitle={cfgArt?.status === "aberta"
            ? `Fecha em ${countdown(cfgArt.prazo_fim)}`
            : (cfgArt?.artilheiro_real || "Apostas fechadas")}
          to="/artilheiro"
        />
        <PoolCard
          emoji="🏆" title="Dois Finalistas"
          status={cfgFin?.status ?? "..."}
          pool={poolFin}
          subtitle={cfgFin?.status === "aberta"
            ? `Fecha em ${cfgFin?.prazo_fim ? countdown(cfgFin.prazo_fim) : "..."}`
            : "Abre nas oitavas"}
          to="/finalistas"
        />
      </section>

      {/* Próximos jogos */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-display text-2xl sm:text-3xl">Próximos jogos</h2>
          <Link to="/jogos" className="text-sm text-primary hover:underline">Ver todos →</Link>
        </div>

        {loadingProximos && (
          <div className="grid sm:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} lines={3} />)}
          </div>
        )}

        {errProximos && (
          <ErrorState
            message="Erro ao carregar os jogos. Verifique sua conexão."
            onRetry={() => refetchProximos()}
          />
        )}

        {!loadingProximos && !errProximos && (
          proximos?.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground text-sm">
                <div className="text-3xl mb-2">⏳</div>
                Nenhum jogo carregado ainda. Vá para <Link to="/admin" className="text-primary underline">Admin</Link> e sincronize a API.
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {proximos!.map(j => (
                <Link key={j.id} to="/jogos/$id" params={{ id: j.id }}>
                  <Card className="hover:shadow-glow transition-shadow cursor-pointer active:scale-[0.99]">
                    <CardContent className="py-3 sm:py-4 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground truncate">
                          {FASES_LABEL[j.fase]} • {new Date(j.data_hora).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-display text-base sm:text-xl mt-1 truncate">
                          {flag(j.time_casa)} {j.time_casa} <span className="text-muted-foreground">×</span> {j.time_fora} {flag(j.time_fora)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {j.e_brasil && <Badge className="bg-gold-gradient text-black mb-1 text-xs">BR R$10</Badge>}
                        <div className="text-xs text-muted-foreground">{countdown(j.data_hora)}</div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )
        )}
      </section>
    </div>
  );
}

function PoolCard({ emoji, title, status, pool, subtitle, to }: {
  emoji: string; title: string; status: string;
  pool: number; subtitle: string; to: string;
}) {
  return (
    <Link to={to}>
      <Card className="hover:shadow-glow transition-all cursor-pointer h-full active:scale-[0.99]">
        <CardHeader className="pb-2 pt-4">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-display text-xl sm:text-2xl">{emoji} {title}</CardTitle>
            <Badge variant="outline" className="capitalize text-xs shrink-0">{status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-display text-3xl sm:text-4xl text-primary">{fmtBRL(pool)}</div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-1">{subtitle}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
