import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { g as getIdentidade, F as FASES_LABEL, C as Card, a as CardContent, f as flag, h as countdown, d as fmtBRL } from "./router-Cg1YCoF8.mjs";
import { P as POLL } from "./realtime-Zp7UVzLF.mjs";
import { B as Badge } from "./badge-DVbQUSsf.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-D_C3GFFZ.mjs";
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
import "../_libs/radix-ui__react-tabs.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function Page() {
  const [fase, setFase] = reactExports.useState("todos");
  const identidade = getIdentidade();
  const {
    data: jogos,
    isLoading: loadingJogos,
    isError: errJogos,
    refetch: refetchJogos
  } = useQuery({
    queryKey: ["jogos-all"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*").order("data_hora")).data ?? [],
    refetchInterval: (query) => {
      const list = query.state.data ?? [];
      return list.some((j) => j.status === "ao_vivo") ? POLL.LIVE : POLL.NORMAL;
    }
  });
  const {
    data: ordens
  } = useQuery({
    queryKey: ["sorteio-jogos-all"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("bolao_sorteio_jogo_ordem").select("jogo_id, usuario_id, posicao, bolao_usuarios(nome)");
      return data ?? [];
    },
    refetchInterval: 15e3
  });
  const {
    data: palpites
  } = useQuery({
    queryKey: ["palpites-all"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("bolao_palpites_publica").select("jogo_id, usuario_id");
      return data ?? [];
    },
    refetchInterval: 15e3
  });
  const filtrados = (jogos ?? []).filter((j) => fase === "todos" || j.fase === fase);
  const isLoading = loadingJogos;
  const isError = errJogos;
  const refetch = refetchJogos;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 animate-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-display text-3xl sm:text-4xl", children: "Jogos da Copa" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "Toque em um jogo para fazer seu palpite." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-scroll pb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Tabs, { value: fase, onValueChange: setFase, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "flex h-auto w-max min-w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "todos", className: "shrink-0", children: "Todos" }),
      Object.entries(FASES_LABEL).map(([k, v]) => /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: k, className: "shrink-0", children: v }, k))
    ] }) }) }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: [1, 2, 3, 4, 5, 6].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { lines: 3 }, i)) }),
    isError && /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { message: "Não foi possível carregar os jogos.", onRetry: () => refetch() }),
    !isLoading && !isError && (filtrados.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-12 text-center text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl mb-2", children: "📋" }),
      jogos?.length === 0 ? "Nenhum jogo carregado. Sincronize na aba Admin." : "Nenhum jogo nessa fase ainda."
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid sm:grid-cols-2 gap-3", children: filtrados.map((j) => {
      const future = new Date(j.data_hora) > /* @__PURE__ */ new Date();
      const ordemJogo = (ordens ?? []).filter((o) => o.jogo_id === j.id).sort((a, b) => a.posicao - b.posicao);
      const palpitesJogo = new Set((palpites ?? []).filter((p) => p.jogo_id === j.id).map((p) => p.usuario_id));
      let vezNome = "Não sorteado";
      let minhaVez = false;
      let minhaPosicao = void 0;
      const dataHoraJogo = new Date(j.data_hora);
      const dataHoraLimite = new Date(dataHoraJogo.getTime() - 60 * 60 * 1e3);
      const prazoExpirado = dataHoraLimite <= /* @__PURE__ */ new Date();
      if (ordemJogo.length > 0) {
        if (prazoExpirado) {
          vezNome = "Prazo expirado";
        } else {
          vezNome = "Finalizado";
          const oEu = ordemJogo.find((o) => o.usuario_id === identidade?.id);
          minhaPosicao = oEu?.posicao;
          for (const item of ordemJogo) {
            if (!palpitesJogo.has(item.usuario_id)) {
              const nomeParticipante = item.bolao_usuarios?.nome ?? "Outro";
              vezNome = `Vez de: ${nomeParticipante}`;
              if (item.usuario_id === identidade?.id) {
                minhaVez = true;
              }
              break;
            }
          }
        }
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jogos/$id", params: {
        id: j.id
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `hover:shadow-glow transition-all cursor-pointer active:scale-[0.99] border-2 ${minhaVez ? "border-green-500 bg-green-500/10 card-minha-vez" : "border-border"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-3 sm:py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: FASES_LABEL[j.fase] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 ml-2", children: new Date(j.data_hora).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
          }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-display text-base sm:text-lg flex-1 min-w-0 truncate", children: [
            flag(j.time_casa),
            " ",
            j.time_casa
          ] }),
          j.placar_casa != null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-display text-2xl sm:text-3xl text-primary shrink-0", children: [
            j.placar_casa,
            " : ",
            j.placar_fora
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground shrink-0", children: future ? countdown(j.data_hora) : "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-display text-base sm:text-lg flex-1 min-w-0 truncate text-right", children: [
            j.time_fora,
            " ",
            flag(j.time_fora)
          ] })
        ] }),
        future && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2.5 pt-2.5 border-t border-border/50 flex justify-between items-center text-[11px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `${minhaVez ? "text-green-400 font-bold" : "text-muted-foreground"}`, children: minhaVez ? "👉 É SUA VEZ!" : vezNome }),
          minhaPosicao != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground font-mono", children: [
            "Sua posição: ",
            minhaPosicao,
            "º"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2 text-xs flex-wrap", children: [
          j.e_brasil && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-gold-gradient text-black text-xs", children: "Brasil • R$10" }),
          !j.e_brasil && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs", children: "R$5" }),
          j.status === "ao_vivo" && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-destructive animate-pulse text-xs", children: "AO VIVO" }),
          j.status === "apurado" && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-xs", children: "Apurado" }),
          Number(j.acumulado) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-gold text-xs", children: [
            "+",
            fmtBRL(j.acumulado)
          ] })
        ] })
      ] }) }) }, j.id);
    }) }))
  ] });
}
export {
  Page as component
};
