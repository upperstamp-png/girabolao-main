import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { C as Card, a as CardContent, B as Button } from "./router-Cg1YCoF8.mjs";
import { W as WifiOff, c as TriangleAlert, R as RefreshCw } from "../_libs/lucide-react.mjs";
function ErrorState({ message, onRetry, offline = false, className = "" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `border-destructive/40 ${className}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-8 flex flex-col items-center gap-3 text-center", children: [
    offline ? /* @__PURE__ */ jsxRuntimeExports.jsx(WifiOff, { className: "h-8 w-8 text-destructive" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-8 w-8 text-destructive" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground max-w-xs", children: message || (offline ? "Sem conexão. Verifique sua internet e tente novamente." : "Ocorreu um erro ao carregar os dados.") }),
    onRetry && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: onRetry, className: "gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-3.5 w-3.5" }),
      "Tentar novamente"
    ] })
  ] }) });
}
export {
  ErrorState as E
};
