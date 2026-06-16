import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase, flag, countdown, FASES_LABEL } from "@/lib/bolao";
import { POLL } from "@/lib/realtime";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { EnableWebPushBanner } from "@/components/notifications/EnableWebPushBanner";
import { Trophy, Users, Activity, RefreshCw, Target, Star, Calendar, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bolão Copa do Mundo 2026" },
      { name: "description", content: "Painel principal do bolão da Copa 2026 com placar, artilheiro e finalistas." },
    ],
  }),
  component: Index,
});

function CountdownTimer({ date }: { date: string }) {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const target = new Date(date).getTime();

    const update = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [date]);

  if (!timeLeft) {
    return <span className="text-xs font-mono font-semibold uppercase text-muted-foreground">Em andamento</span>;
  }

  return (
    <div className="flex gap-2 sm:gap-3 text-center font-mono">
      {timeLeft.days > 0 && (
        <div className="flex flex-col">
          <span className="text-xl sm:text-2xl font-bold text-primary">{timeLeft.days}</span>
          <span className="text-[9px] text-muted-foreground uppercase font-semibold">Dias</span>
        </div>
      )}
      {timeLeft.days > 0 && <span className="text-lg text-muted-foreground/60 mt-0.5">:</span>}
      <div className="flex flex-col">
        <span className="text-xl sm:text-2xl font-bold text-foreground">{String(timeLeft.hours).padStart(2, "0")}</span>
        <span className="text-[9px] text-muted-foreground uppercase font-semibold">Horas</span>
      </div>
      <span className="text-lg text-muted-foreground/60 mt-0.5">:</span>
      <div className="flex flex-col">
        <span className="text-xl sm:text-2xl font-bold text-foreground">{String(timeLeft.minutes).padStart(2, "0")}</span>
        <span className="text-[9px] text-muted-foreground uppercase font-semibold">Min</span>
      </div>
      <span className="text-lg text-muted-foreground/60 mt-0.5">:</span>
      <div className="flex flex-col">
        <span className="text-xl sm:text-2xl font-bold text-accent">{String(timeLeft.seconds).padStart(2, "0")}</span>
        <span className="text-[9px] text-muted-foreground uppercase font-semibold">Seg</span>
      </div>
    </div>
  );
}

function Index() {
  const { data: cfgArt } = useQuery({
    queryKey: ["cfg-art"],
    queryFn: async () => (await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).single()).data,
    refetchInterval: POLL.SLOW,
  });
  const { data: cfgFin } = useQuery({
    queryKey: ["cfg-fin"],
    queryFn: async () => (await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).single()).data,
    refetchInterval: POLL.SLOW,
  });
  const { data: bolaoCfg } = useQuery({
    queryKey: ["bolao-config-home"],
    queryFn: async () => (await supabase.from("bolao_config").select("ultima_sync_api, total_jogos_api").eq("id", 1).single()).data,
    refetchInterval: POLL.NORMAL,
  });
  const { data: aoVivo } = useQuery({
    queryKey: ["jogos-ao-vivo"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*").eq("status", "ao_vivo").order("data_hora")).data ?? [],
    refetchInterval: POLL.LIVE,
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
    refetchInterval: POLL.NORMAL,
  });
  const { data: jogoAtual } = useQuery({
    queryKey: ["jogo-atual"],
    queryFn: async () => {
      const { data: live } = await supabase.from("bolao_jogos").select("*").eq("status", "ao_vivo").limit(1);
      if (live?.[0]) return live[0];
      const { data } = await supabase.from("bolao_jogos")
        .select("*").order("data_hora").limit(1)
        .gte("data_hora", new Date(Date.now() - 3 * 3600000).toISOString());
      return data?.[0] ?? null;
    },
    refetchInterval: POLL.LIVE,
  });

  const nParticipantes = usuarios?.length ?? 0;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in pb-12">
      {/* Hero */}
      <section className="text-center py-8 sm:py-12 bg-pitch rounded-2xl shadow-card px-4 border border-border/30 relative overflow-hidden">
        <Trophy className="h-12 w-12 mx-auto text-primary mb-3 drop-shadow-[0_0_15px_rgba(63,185,80,0.3)]" />
        <h1 className="text-display text-4xl sm:text-5xl md:text-6xl text-foreground font-extrabold tracking-wide">
          Bolão Copa 2026
        </h1>
        <p className="mt-3 text-text-secondary max-w-xl mx-auto text-sm sm:text-base">
          Faça seus palpites nos jogos e categorias especiais e acompanhe as transmissões ao vivo.
        </p>
        
        {/* Styled readable stats badges list */}
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs sm:text-sm font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/60 border border-border">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-foreground font-semibold">{nParticipantes}</span>
            <span className="text-muted-foreground text-[10px] uppercase">Participantes</span>
          </div>
          {(aoVivo?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-live/10 border border-red-live/30 text-red-live animate-pulse">
              <Activity className="h-4 w-4" />
              <span className="font-semibold">{aoVivo!.length}</span>
              <span className="text-[10px] uppercase">Ao Vivo</span>
            </div>
          )}
          {bolaoCfg?.ultima_sync_api && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card/60 border border-border">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground text-[10px] uppercase">Sync:</span>
              <span className="text-foreground">{new Date(bolaoCfg.ultima_sync_api).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          )}
        </div>
      </section>

      <EnableWebPushBanner />

      {/* Countdown Widget for the next match */}
      {!loadingProximos && proximos?.[0] && (
        <section className="bg-card border border-border rounded-2xl overflow-hidden p-4 sm:p-5 shadow-card">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] text-primary font-mono font-bold uppercase mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-ping" />
                Próximo Jogo
              </div>
              <h2 className="text-display text-lg sm:text-xl md:text-2xl text-foreground font-extrabold">
                {flag(proximos[0].time_casa)} {proximos[0].time_casa} <span className="text-muted-foreground text-xs lowercase font-sans">vs</span> {proximos[0].time_fora} {flag(proximos[0].time_fora)}
              </h2>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                {FASES_LABEL[proximos[0].fase]} • {new Date(proximos[0].data_hora).toLocaleString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            
            <div className="shrink-0 bg-secondary/15 px-4 py-2.5 rounded-xl border border-border/40">
              <CountdownTimer date={proximos[0].data_hora} />
            </div>
          </div>
        </section>
      )}

      {/* Live Streams */}
      {(aoVivo?.length ?? 0) > 0 && (
        <section className="space-y-4">
          <h2 className="text-display text-xl sm:text-2xl mb-1 flex items-center gap-2 text-foreground">
            <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            Ao vivo agora
          </h2>

          <Card className="overflow-hidden border-border bg-card/60 backdrop-blur-md shadow-card">
            <CardHeader className="pb-3 flex flex-row items-center justify-between gap-4 border-b border-border/40">
              <CardTitle className="text-sm font-semibold uppercase flex items-center gap-2 text-foreground">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                Transmissão ao vivo — CazéTV
              </CardTitle>
              <Button asChild size="sm" variant="secondary" className="text-xs shrink-0 gap-1.5 h-8 font-mono bg-secondary hover:bg-bg-muted border border-border rounded-md">
                <a href="https://www.youtube.com/@CazeTV/live" target="_blank" rel="noopener noreferrer">
                  Assistir no YouTube ↗
                </a>
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-4">
              <div className="relative w-full aspect-video rounded-b-lg sm:rounded-lg overflow-hidden border border-border/80">
                <iframe
                  src="https://www.youtube.com/embed/live_stream?channel=UCiUpYtTjV6P-H-3qOq-1WIA"
                  title="CazéTV Live Stream"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
              <p className="text-[11px] text-muted-foreground p-3 text-center sm:pt-2 sm:pb-0">
                Caso a transmissão esteja indisponível devido a bloqueios locais do YouTube, clique no botão acima para assistir diretamente no canal da CazéTV.
              </p>
            </CardContent>
          </Card>

          <div className="grid sm:grid-cols-2 gap-3">
            {aoVivo!.map(j => (
              <Link key={j.id} to="/jogos/$id" params={{ id: j.id }}>
                <Card className="border-destructive/40 hover:shadow-glow transition-shadow bg-secondary/10 active:scale-[0.99]">
                  <CardContent className="py-4 text-center">
                    <div className="text-display text-2xl text-primary font-bold font-mono">
                      {flag(j.time_casa)} {j.placar_casa ?? 0} : {j.placar_fora ?? 0} {flag(j.time_fora)}
                    </div>
                    <div className="text-sm mt-1 font-semibold text-foreground">{j.time_casa} × {j.time_fora}</div>
                    {j.minuto_jogo != null && <Badge className="mt-2 bg-destructive">{j.minuto_jogo}&apos;</Badge>}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Pool cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <PoolCard
          icon={<Calendar className="h-5 w-5 text-primary" />}
          title="Placar Exato"
          status={jogoAtual ? "Próximo jogo" : "Aguardando"}
          value="3 / 1 pts"
          subtitle={jogoAtual
            ? `${flag(jogoAtual.time_casa)} ${jogoAtual.time_casa} × ${jogoAtual.time_fora} ${flag(jogoAtual.time_fora)}`
            : "Sem jogos próximos"}
          to="/jogos"
        />
        <PoolCard
          icon={<Trophy className="h-5 w-5 text-accent" />}
          title="Artilheiro"
          status={cfgArt?.status ?? "..."}
          value="10 pts"
          subtitle={cfgArt?.status === "aberta"
            ? `Fecha em ${countdown(cfgArt.prazo_fim)}`
            : (cfgArt?.artilheiro_real || "Apostas fechadas")}
          to="/apostas-especiais"
        />
        <PoolCard
          icon={<Star className="h-5 w-5 text-blue-info" />}
          title="Dois Finalistas"
          status={cfgFin?.status ?? "..."}
          value="5 / 10 pts"
          subtitle={cfgFin?.status === "aberta"
            ? `Fecha em ${cfgFin?.prazo_fim ? countdown(cfgFin.prazo_fim) : "..."}`
            : "Abre nas oitavas"}
          to="/apostas-especiais"
        />
      </section>

      {/* Próximos jogos */}
      <section>
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-display text-xl sm:text-2xl text-foreground">Próximos jogos</h2>
          <Link to="/jogos" className="text-xs text-primary hover:underline flex items-center gap-0.5">
            Ver todos <ChevronRight className="h-3 w-3" />
          </Link>
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
                  <Card className="hover:shadow-glow transition-shadow cursor-pointer active:scale-[0.99] bg-secondary/15 border-border/80">
                    <CardContent className="py-3 sm:py-4 flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wide">
                          {FASES_LABEL[j.fase]} • {new Date(j.data_hora).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="text-display text-sm sm:text-base mt-1 truncate">
                          {flag(j.time_casa)} {j.time_casa} <span className="text-muted-foreground text-[10px] lowercase font-sans">×</span> {j.time_fora} {flag(j.time_fora)}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {j.e_brasil && <Badge className="bg-gold-gradient text-black mb-1 text-xs font-mono font-bold">Brasil</Badge>}
                        <div className="text-[10px] text-muted-foreground font-mono">{countdown(j.data_hora)}</div>
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

function PoolCard({ icon, title, status, value, subtitle, to }: {
  icon: React.ReactNode; title: string; status: string;
  value: string; subtitle: string; to: string;
}) {
  return (
    <Link to={to}>
      <Card className="hover:shadow-glow transition-all cursor-pointer h-full active:scale-[0.99] bg-card/60 border-border/80 flex flex-col justify-between">
        <CardHeader className="pb-2 pt-4">
          <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-display text-sm sm:text-base text-foreground flex items-center gap-1.5">
              {icon} {title}
            </CardTitle>
            <Badge variant="outline" className="capitalize text-[10px] shrink-0 font-mono text-muted-foreground">{status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="text-display text-2xl sm:text-3xl text-primary font-mono font-bold">{value}</div>
          <p className="text-[11px] text-muted-foreground mt-2 line-clamp-1">{subtitle}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
