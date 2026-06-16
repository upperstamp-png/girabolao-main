import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase, flag, calcularPontosPalpite } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Star, Activity } from "lucide-react";

export const Route = createFileRoute("/ranking")({
  head: () => ({ meta: [{ title: "Ranking Geral — Bolão Copa 2026" }, { name: "description", content: "Ranking geral de pontuação dos participantes do bolão." }] }),
  component: Page,
});

function Page() {
  const { data: usuarios, isLoading: loadingU, isError: errU, refetch } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("nome")).data ?? [],
  });

  const { data: jogos, isLoading: loadingJ } = useQuery({
    queryKey: ["jogos-all-ranking"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("id, time_casa, time_fora, placar_casa, placar_fora, status")).data ?? [],
    refetchInterval: 30000,
  });

  const { data: palpites, isLoading: loadingPa } = useQuery({
    queryKey: ["palpites-all-ranking"],
    queryFn: async () => (await supabase.from("bolao_palpites").select("usuario_id, jogo_id, gols_casa, gols_fora, acertou")).data ?? [],
    refetchInterval: 30000,
  });

  const { data: apostasArt } = useQuery({
    queryKey: ["apostas-art-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_artilheiro").select("usuario_id, acertou")).data ?? [],
  });

  const { data: apostasFin } = useQuery({
    queryKey: ["apostas-fin-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_finalistas").select("usuario_id, acertou_os_dois, acertou_um")).data ?? [],
  });

  const { data: apostasCam } = useQuery({
    queryKey: ["apostas-cam-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_campeao").select("usuario_id, acertou")).data ?? [],
  });

  const { data: apostasZeb } = useQuery({
    queryKey: ["apostas-zeb-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_zebra").select("usuario_id, acertou")).data ?? [],
  });

  const { data: apostasGol } = useQuery({
    queryKey: ["apostas-gol-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_goleada").select("usuario_id, acertou")).data ?? [],
  });

  const nomeMap = useMemo(() => new Map((usuarios ?? []).map(u => [u.id, u.nome])), [usuarios]);

  const ranking = useMemo(() => {
    const gamesMap = new Map((jogos ?? []).map(g => [g.id, g]));

    return (usuarios ?? []).map(u => {
      let acertosPlacar = 0;
      let acertosResultado = 0;
      let pontosPlacares = 0;

      const userPalpites = (palpites ?? []).filter(p => p.usuario_id === u.id);
      for (const p of userPalpites) {
        const g = gamesMap.get(p.jogo_id);
        if (g && g.placar_casa != null && g.placar_fora != null) {
          const res = calcularPontosPalpite(p.gols_casa, p.gols_fora, g.placar_casa, g.placar_fora);
          pontosPlacares += res.pontos;
          if (res.acertouPlacar) acertosPlacar++;
          else if (res.acertouResultado) acertosResultado++;
        }
      }

      // Pontos das apostas especiais
      const acertouArt = !!(apostasArt ?? []).find(a => a.usuario_id === u.id)?.acertou;
      const pontosArt = acertouArt ? 10 : 0;

      const apostaFin = (apostasFin ?? []).find(a => a.usuario_id === u.id);
      let pontosFin = 0;
      let acertouFin = false;
      if (apostaFin) {
        if (apostaFin.acertou_os_dois) {
          pontosFin = 10;
          acertouFin = true;
        } else if (apostaFin.acertou_um) {
          pontosFin = 5;
        }
      }

      const acertouCam = !!(apostasCam ?? []).find(a => a.usuario_id === u.id)?.acertou;
      const pontosCam = acertouCam ? 10 : 0;

      const acertouZeb = !!(apostasZeb ?? []).find(a => a.usuario_id === u.id)?.acertou;
      const pontosZeb = acertouZeb ? 10 : 0;

      const acertouGol = !!(apostasGol ?? []).find(a => a.usuario_id === u.id)?.acertou;
      const pontosGol = acertouGol ? 10 : 0;

      const pontosEspeciais = pontosArt + pontosFin + pontosCam + pontosZeb + pontosGol;
      const totalPontos = pontosPlacares + pontosEspeciais;

      return {
        ...u,
        acertosPlacar,
        acertosResultado,
        pontosEspeciais,
        totalPontos,
        acertouArt,
        acertouFin,
        acertouCam,
        acertouZeb,
        acertouGol,
      };
    }).sort((a, b) => b.totalPontos - a.totalPontos || b.acertosPlacar - a.acertosPlacar || b.acertosResultado - a.acertosResultado);
  }, [usuarios, palpites, jogos, apostasArt, apostasFin, apostasCam, apostasZeb, apostasGol]);

  const stats = useMemo(() => {
    const encerrados = (jogos ?? []).filter(g => g.status === "encerrado" || g.status === "apurado").length;
    const totalPalpites = palpites?.length ?? 0;
    const lider = ranking[0]?.nome ? `${ranking[0].nome} (${ranking[0].totalPontos} pts)` : "—";
    return { encerrados, totalPalpites, lider };
  }, [jogos, palpites, ranking]);

  const correctPalpitesList = useMemo(() => {
    const gamesMap = new Map((jogos ?? []).map(g => [g.id, g]));
    return (palpites ?? [])
      .filter(p => p.acertou)
      .map(p => {
        const g = gamesMap.get(p.jogo_id);
        const userName = nomeMap.get(p.usuario_id) ?? "—";
        return {
          id: `${p.usuario_id}_${p.jogo_id}`,
          userName,
          gameLabel: g ? `${flag(g.time_casa)} ${g.time_casa} ${g.placar_casa} × ${g.placar_fora} ${g.time_fora} ${flag(g.time_fora)}` : "—",
          gols_casa: p.gols_casa,
          gols_fora: p.gols_fora,
        };
      })
      .slice(0, 10);
  }, [palpites, jogos, nomeMap]);

  const isLoading = loadingU || loadingJ || loadingPa;

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-display text-3xl sm:text-4xl">📊 Ranking Geral</h1>
        <p className="text-muted-foreground text-sm mt-1">Classificação oficial dos participantes por pontuação.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <SmallStat label="Jogos Apurados" value={stats.encerrados} icon={<Activity className="h-4 w-4 text-primary" />} />
        <SmallStat label="Total Palpites" value={stats.totalPalpites} icon={<Star className="h-4 w-4 text-gold" />} />
        <SmallStat label="Líder Atual" value={stats.lider} icon={<Trophy className="h-4 w-4 text-amber-500" />} />
      </div>

      {isLoading && <SkeletonCard lines={6} />}
      {errU && <ErrorState message="Erro ao carregar o ranking." onRetry={() => refetch()} />}

      {!isLoading && !errU && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle>Classificação Oficial</CardTitle>
            <CardDescription>Critério de desempate: 1º Acertos Exatos, 2º Acertos de Vencedor.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <div className="table-scroll px-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground w-8">#</th>
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Nome</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">🎯 Exatos (3 pts)</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">⚽ Vencedor (1 pt)</th>
                    <th className="text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap">🎰 Especiais</th>
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
                    <tr key={u.id} className={`border-b border-border/50 ${i === 0 ? "bg-primary/5 font-semibold text-primary" : ""}`}>
                      <td className="py-3 pr-3 text-lg">
                        {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : <span className="text-muted-foreground">{i + 1}</span>}
                      </td>
                      <td className="py-3 pr-3 font-medium">{u.nome}</td>
                      <td className="py-3 px-2 text-center font-mono">{u.acertosPlacar}</td>
                      <td className="py-3 px-2 text-center font-mono">{u.acertosResultado}</td>
                      <td className="py-3 px-2 text-center font-mono">{u.pontosEspeciais} pts</td>
                      <td className="py-3 pl-3 text-right text-display text-base text-primary font-bold">
                        {u.totalPontos} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Últimos Placares Exatos */}
      {!isLoading && correctPalpitesList.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-gold" />
              Últimos Acertos de Placar (3 pts)
            </CardTitle>
            <CardDescription>Feed recente de palpites certeiros dos participantes.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {correctPalpitesList.map(p => (
                <li key={p.id} className="flex justify-between items-center py-2.5 gap-2">
                  <span className="font-semibold text-primary">{p.userName}</span>
                  <span className="text-muted-foreground text-xs text-right truncate">
                    acertou o placar de {p.gameLabel}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SmallStat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="border-border bg-secondary/10">
      <CardContent className="py-3 px-3 sm:py-4 flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] sm:text-xs text-muted-foreground leading-tight uppercase font-semibold">{label}</div>
          <div className="text-display text-sm sm:text-lg text-foreground mt-1 truncate max-w-36">{value}</div>
        </div>
        <div className="shrink-0 p-1.5 bg-secondary rounded-full">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
