import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { d as fmtBRL, C as Card, a as CardContent, f as flag, h as countdown, F as FASES_LABEL, b as CardHeader, c as CardTitle } from "./router-Cg1YCoF8.mjs";
import { P as POLL } from "./realtime-Zp7UVzLF.mjs";
import { B as Badge } from "./badge-DVbQUSsf.mjs";
import { S as SkeletonCard } from "./SkeletonCard-Im4FESGf.mjs";
import { E as ErrorState } from "./ErrorState-DAhPA3He.mjs";
import { s as supabase } from "./client-NTKDfrPQ.mjs";
import "../_libs/sonner.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/lucide-react.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function Index() {
  const {
    data: cfgArt,
    isError: errArt
  } = useQuery({
    queryKey: ["cfg-art"],
    queryFn: async () => (await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).single()).data,
    refetchInterval: POLL.SLOW
  });
  const {
    data: cfgFin
  } = useQuery({
    queryKey: ["cfg-fin"],
    queryFn: async () => (await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).single()).data,
    refetchInterval: POLL.SLOW
  });
  const {
    data: bolaoCfg
  } = useQuery({
    queryKey: ["bolao-config-home"],
    queryFn: async () => (await supabase.from("bolao_config").select("ultima_sync_api, total_jogos_api").eq("id", 1).single()).data,
    refetchInterval: POLL.NORMAL
  });
  const {
    data: aoVivo
  } = useQuery({
    queryKey: ["jogos-ao-vivo"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*").eq("status", "ao_vivo").order("data_hora")).data ?? [],
    refetchInterval: POLL.LIVE
  });
  const {
    data: usuarios
  } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("criado_em")).data ?? []
  });
  const {
    data: proximos,
    isLoading: loadingProximos,
    isError: errProximos,
    refetch: refetchProximos
  } = useQuery({
    queryKey: ["proximos"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*").gte("data_hora", (/* @__PURE__ */ new Date()).toISOString()).order("data_hora").limit(6)).data ?? [],
    refetchInterval: POLL.NORMAL
  });
  const {
    data: jogoAtual
  } = useQuery({
    queryKey: ["jogo-atual"],
    queryFn: async () => {
      const {
        data: live
      } = await supabase.from("bolao_jogos").select("*").eq("status", "ao_vivo").limit(1);
      if (live?.[0]) return live[0];
      const {
        data
      } = await supabase.from("bolao_jogos").select("*").order("data_hora").limit(1).gte("data_hora", new Date(Date.now() - 3 * 36e5).toISOString());
      return data?.[0] ?? null;
    },
    refetchInterval: POLL.LIVE
  });
  const nParticipantes = usuarios?.length ?? 0;
  const poolArt = nParticipantes * 10 + Number(cfgArt?.acumulado_anterior || 0);
  const poolFin = nParticipantes * 10 + Number(cfgFin?.acumulado_anterior || 0);
  const acumuladoAtual = Number(jogoAtual?.acumulado || 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 sm:space-y-8 animate-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "text-center py-8 sm:py-12 bg-pitch rounded-2xl shadow-card px-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-5xl sm:text-6xl mb-3", children: "🏆⚽" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-display text-4xl sm:text-5xl md:text-6xl", children: "Bolão Copa 2026" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-muted-foreground max-w-xl mx-auto text-sm sm:text-base", children: "Três modalidades, um campeonato. Faça seus palpites e acompanhe ao vivo." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-wrap justify-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
          nParticipantes,
          "/8 participantes"
        ] }),
        acumuladoAtual > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-gold-gradient text-black", children: [
          "Acumulado: ",
          fmtBRL(acumuladoAtual)
        ] }),
        (aoVivo?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-destructive animate-pulse", children: [
          aoVivo.length,
          " ao vivo"
        ] }),
        bolaoCfg?.ultima_sync_api && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-xs", children: [
          "Sync: ",
          new Date(bolaoCfg.ultima_sync_api).toLocaleTimeString("pt-BR")
        ] })
      ] })
    ] }),
    (aoVivo?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-display text-2xl sm:text-3xl mb-3 flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-destructive animate-pulse" }),
        "Ao vivo agora"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: aoVivo.map((j) => /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jogos/$id", params: {
        id: j.id
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-destructive/40 hover:shadow-glow transition-shadow", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-4 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-display text-2xl text-primary", children: [
          flag(j.time_casa),
          " ",
          j.placar_casa ?? 0,
          " : ",
          j.placar_fora ?? 0,
          " ",
          flag(j.time_fora)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm mt-1", children: [
          j.time_casa,
          " × ",
          j.time_fora
        ] }),
        j.minuto_jogo != null && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "mt-2 bg-destructive", children: [
          j.minuto_jogo,
          "'"
        ] })
      ] }) }) }, j.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PoolCard, { emoji: "🎯", title: "Placar Exato", status: jogoAtual ? "Próximo jogo" : "Aguardando", pool: jogoAtual ? Number(jogoAtual.valor_entrada) * nParticipantes + acumuladoAtual : 0, subtitle: jogoAtual ? `${flag(jogoAtual.time_casa)} ${jogoAtual.time_casa} × ${jogoAtual.time_fora} ${flag(jogoAtual.time_fora)}` : "Sem jogos próximos", to: "/jogos" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PoolCard, { emoji: "⚽", title: "Artilheiro", status: cfgArt?.status ?? "...", pool: poolArt, subtitle: cfgArt?.status === "aberta" ? `Fecha em ${countdown(cfgArt.prazo_fim)}` : cfgArt?.artilheiro_real || "Apostas fechadas", to: "/artilheiro" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(PoolCard, { emoji: "🏆", title: "Dois Finalistas", status: cfgFin?.status ?? "...", pool: poolFin, subtitle: cfgFin?.status === "aberta" ? `Fecha em ${cfgFin?.prazo_fim ? countdown(cfgFin.prazo_fim) : "..."}` : "Abre nas oitavas", to: "/finalistas" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3 sm:mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-display text-2xl sm:text-3xl", children: "Próximos jogos" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jogos", className: "text-sm text-primary hover:underline", children: "Ver todos →" })
      ] }),
      loadingProximos && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { lines: 3 }, i)) }),
      errProximos && /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { message: "Erro ao carregar os jogos. Verifique sua conexão.", onRetry: () => refetchProximos() }),
      !loadingProximos && !errProximos && (proximos?.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-10 text-center text-muted-foreground text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl mb-2", children: "⏳" }),
        "Nenhum jogo carregado ainda. Vá para ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin", className: "text-primary underline", children: "Admin" }),
        " e sincronize a API."
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: proximos.map((j) => /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jogos/$id", params: {
        id: j.id
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "hover:shadow-glow transition-shadow cursor-pointer active:scale-[0.99]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-3 sm:py-4 flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground truncate", children: [
            FASES_LABEL[j.fase],
            " • ",
            new Date(j.data_hora).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-display text-base sm:text-xl mt-1 truncate", children: [
            flag(j.time_casa),
            " ",
            j.time_casa,
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "×" }),
            " ",
            j.time_fora,
            " ",
            flag(j.time_fora)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right shrink-0", children: [
          j.e_brasil && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-gold-gradient text-black mb-1 text-xs", children: "BR R$10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: countdown(j.data_hora) })
        ] })
      ] }) }) }, j.id)) }))
    ] })
  ] });
}
function PoolCard({
  emoji,
  title,
  status,
  pool,
  subtitle,
  to
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "hover:shadow-glow transition-all cursor-pointer h-full active:scale-[0.99]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-display text-xl sm:text-2xl", children: [
        emoji,
        " ",
        title
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize text-xs shrink-0", children: status })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-display text-3xl sm:text-4xl text-primary", children: fmtBRL(pool) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-1", children: subtitle })
    ] })
  ] }) });
}
export {
  Index as component
};
