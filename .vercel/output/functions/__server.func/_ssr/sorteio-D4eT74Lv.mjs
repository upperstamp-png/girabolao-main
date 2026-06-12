import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as Card, a as CardContent, b as CardHeader, c as CardTitle, f as flag } from "./router-Cg1YCoF8.mjs";
import { B as Badge } from "./badge-DVbQUSsf.mjs";
import { S as SkeletonCard } from "./SkeletonCard-Im4FESGf.mjs";
import { E as ErrorState } from "./ErrorState-DAhPA3He.mjs";
import { s as supabase } from "./client-NTKDfrPQ.mjs";
import "../_libs/sonner.mjs";
import { D as Dices, A as ArrowRight } from "../_libs/lucide-react.mjs";
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
  const {
    data: jogos,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["jogos-sorteio"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("bolao_jogos").select("id, time_casa, time_fora, data_hora, fase, sorteio_realizado").order("data_hora");
      return data ?? [];
    }
  });
  const proximos = (jogos ?? []).filter((j) => new Date(j.data_hora) > /* @__PURE__ */ new Date());
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-6 animate-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-display text-3xl sm:text-4xl flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dices, { className: "h-8 w-8 text-primary shrink-0" }),
        "Sorteio por Jogo"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "Cada partida tem seu próprio sorteio. A ordem define quem palpita primeiro, segundo, e assim por diante." })
    ] }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { lines: 6 }),
    isError && /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { message: "Erro ao carregar jogos.", onRetry: () => refetch() }),
    !isLoading && !isError && (proximos.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "border-dashed border-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-10 text-center text-muted-foreground text-sm", children: "Nenhum jogo futuro para sortear. Sincronize os jogos no Admin." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: proximos.map((j) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "hover:shadow-glow transition-shadow", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-base font-semibold", children: [
            flag(j.time_casa),
            " ",
            j.time_casa,
            " × ",
            j.time_fora,
            " ",
            flag(j.time_fora)
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: j.sorteio_realizado ? "success" : "secondary", children: j.sorteio_realizado ? "Sorteado" : "Pendente" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: new Date(j.data_hora).toLocaleString("pt-BR") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/jogos/$id", params: {
        id: j.id
      }, className: "inline-flex items-center gap-1 text-sm text-primary hover:underline", children: [
        j.sorteio_realizado ? "Ver ordem e palpitar" : "Abrir jogo e sortear",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" })
      ] }) })
    ] }, j.id)) })),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground bg-secondary/30 p-3 rounded-lg border border-border", children: "Ao abrir um jogo, o sorteio é feito automaticamente (se ainda não existir). Os palpites devem seguir a ordem sorteada — cada participante espera sua vez." })
  ] });
}
export {
  Page as component
};
