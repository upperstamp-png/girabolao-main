import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { C as Card, b as CardHeader, c as CardTitle, a as CardContent, d as fmtBRL } from "./router-Cg1YCoF8.mjs";
import { S as SkeletonCard } from "./SkeletonCard-Im4FESGf.mjs";
import { E as ErrorState } from "./ErrorState-DAhPA3He.mjs";
import { s as supabase } from "./client-NTKDfrPQ.mjs";
import "../_libs/sonner.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-router.mjs";
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
function Page() {
  const {
    data: usuarios,
    isLoading: loadingU,
    isError: errU,
    refetch
  } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("nome")).data ?? []
  });
  const {
    data: premios,
    isLoading: loadingP
  } = useQuery({
    queryKey: ["premios-all"],
    queryFn: async () => (await supabase.from("bolao_premios").select("*").order("criado_em", {
      ascending: false
    })).data ?? [],
    refetchInterval: 3e4
  });
  const {
    data: palpites
  } = useQuery({
    queryKey: ["palpites-all"],
    queryFn: async () => (await supabase.from("bolao_palpites").select("usuario_id, acertou")).data ?? [],
    refetchInterval: 3e4
  });
  const {
    data: apostasArt
  } = useQuery({
    queryKey: ["apostas-art-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_artilheiro").select("usuario_id, acertou")).data ?? []
  });
  const {
    data: apostasFin
  } = useQuery({
    queryKey: ["apostas-fin-all"],
    queryFn: async () => (await supabase.from("bolao_apostas_finalistas").select("usuario_id, acertou_os_dois")).data ?? []
  });
  const ranking = reactExports.useMemo(() => {
    return (usuarios ?? []).map((u) => {
      const acertosPlacar = (palpites ?? []).filter((p) => p.usuario_id === u.id && p.acertou).length;
      const acertouArt = !!(apostasArt ?? []).find((a) => a.usuario_id === u.id)?.acertou;
      const acertouFin = !!(apostasFin ?? []).find((a) => a.usuario_id === u.id)?.acertou_os_dois;
      const total = (premios ?? []).filter((p) => p.usuario_id === u.id).reduce((s, p) => s + Number(p.valor), 0);
      return {
        ...u,
        acertosPlacar,
        acertouArt,
        acertouFin,
        total
      };
    }).sort((a, b) => b.total - a.total || b.acertosPlacar - a.acertosPlacar);
  }, [usuarios, palpites, apostasArt, apostasFin, premios]);
  const acumulados = reactExports.useMemo(() => ({
    placar: (premios ?? []).filter((p) => p.modalidade === "placar" && p.status === "acumulado").reduce((s, p) => s + Number(p.valor), 0),
    artilheiro: (premios ?? []).filter((p) => p.modalidade === "artilheiro" && p.status === "acumulado").reduce((s, p) => s + Number(p.valor), 0),
    finalistas: (premios ?? []).filter((p) => p.modalidade === "finalistas" && p.status === "acumulado").reduce((s, p) => s + Number(p.valor), 0)
  }), [premios]);
  const isLoading = loadingU || loadingP;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 sm:space-y-6 animate-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-display text-3xl sm:text-4xl", children: "Ranking Geral" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "Total ganho em todas as modalidades." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 sm:gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SmallStat, { label: "Acum. placar", value: acumulados.placar }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SmallStat, { label: "Acum. artilheiro", value: acumulados.artilheiro }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SmallStat, { label: "Acum. finalistas", value: acumulados.finalistas })
    ] }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { lines: 6 }),
    errU && /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { message: "Erro ao carregar ranking.", onRetry: () => refetch() }),
    !isLoading && !errU && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Classificação" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "px-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-scroll px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-2 pr-3 font-medium text-muted-foreground w-8", children: "#" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-left py-2 pr-3 font-medium text-muted-foreground", children: "Nome" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-center py-2 px-2 font-medium text-muted-foreground whitespace-nowrap", children: "⚽ Placar" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-center py-2 px-2 font-medium text-muted-foreground", children: "Art" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-center py-2 px-2 font-medium text-muted-foreground", children: "Fin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right py-2 pl-3 font-medium text-muted-foreground whitespace-nowrap", children: "Total" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: ranking.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "text-center py-8 text-muted-foreground", children: "Nenhum dado disponível ainda." }) }) : ranking.map((u, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: `border-b border-border/50 ${i === 0 ? "bg-gold-gradient/5" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-3 text-lg", children: i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: i + 1 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pr-3 font-medium", children: u.nome }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-2 text-center", children: u.acertosPlacar }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-2 text-center", children: u.acertouArt ? "✓" : "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 px-2 text-center", children: u.acertouFin ? "✓" : "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 pl-3 text-right text-display text-base text-primary font-bold", children: fmtBRL(u.total) })
        ] }, u.id)) })
      ] }) }) })
    ] }),
    (premios?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Histórico de prêmios" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border text-sm", children: premios.slice(0, 20).map((p) => {
        const u = usuarios?.find((x) => x.id === p.usuario_id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex justify-between items-center py-2 gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground text-xs truncate", children: [
            new Date(p.criado_em).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            }),
            " • ",
            p.modalidade
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "shrink-0", children: [
            u?.nome ?? "💰 acumulado",
            " · ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-primary", children: fmtBRL(p.valor) })
          ] })
        ] }, p.id);
      }) }) })
    ] })
  ] });
}
function SmallStat({
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-3 px-3 sm:py-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground leading-tight", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-display text-lg sm:text-2xl text-gold mt-1", children: fmtBRL(value) })
  ] }) });
}
export {
  Page as component
};
