import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { g as getIdentidade } from "./router-Cg1YCoF8.mjs";
import { B as Badge } from "./badge-DVbQUSsf.mjs";
function IdentidadePicker({
  value,
  onChange
}) {
  const [identidade] = reactExports.useState(() => getIdentidade());
  reactExports.useEffect(() => {
    if (!value && identidade) onChange(identidade);
  }, [identidade, onChange, value]);
  if (!identidade) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive", children: "Entre com nome e PIN para continuar." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/20 px-3 py-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Palpitando como" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate font-medium", children: identidade.nome })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", children: "PIN validado" })
  ] });
}
export {
  IdentidadePicker as I
};
