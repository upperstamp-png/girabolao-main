import { j as jsxRuntimeExports } from "../_libs/react.mjs";
function SkeletonCard({ lines = 3, className = "" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `rounded-xl border border-border p-4 space-y-3 ${className}`, children: Array.from({ length: lines }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `skeleton h-4 rounded ${i === 0 ? "w-2/3" : i === lines - 1 ? "w-1/2" : "w-full"}` }, i)) });
}
export {
  SkeletonCard as S
};
