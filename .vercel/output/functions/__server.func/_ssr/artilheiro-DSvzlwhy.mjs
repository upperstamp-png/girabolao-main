import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { C as Card, a as CardContent, d as fmtBRL, h as countdown, b as CardHeader, c as CardTitle, L as Label, I as Input, B as Button, e as callFn } from "./router-Cg1YCoF8.mjs";
import { B as Badge } from "./badge-DVbQUSsf.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { I as IdentidadePicker } from "./IdentidadePicker-1FPTpbOA.mjs";
import { s as supabase } from "./client-NTKDfrPQ.mjs";
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
  const qc = useQueryClient();
  const [identidade, setIdentidade] = reactExports.useState(null);
  const [jogador, setJogador] = reactExports.useState("");
  const {
    data: cfg
  } = useQuery({
    queryKey: ["cfg-art"],
    queryFn: async () => (await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).single()).data
  });
  const {
    data: usuarios
  } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").order("nome")).data ?? []
  });
  const {
    data: apostas
  } = useQuery({
    queryKey: ["apostas-art"],
    queryFn: async () => (await supabase.from("bolao_apostas_artilheiro_publica").select("*")).data ?? []
  });
  const enviar = useMutation({
    mutationFn: () => callFn("aposta-artilheiro", {
      nome: identidade?.nome,
      pin: identidade?.pin,
      jogador
    }),
    onSuccess: () => {
      setJogador("");
      qc.invalidateQueries({
        queryKey: ["apostas-art"]
      });
      toast.success("Aposta registrada!");
    },
    onError: (e) => toast.error(e.message)
  });
  const nP = usuarios?.length ?? 0;
  const pool = nP * 10 + Number(cfg?.acumulado_anterior || 0);
  const nomeMap = new Map((usuarios ?? []).map((u) => [u.id, u.nome]));
  const aberta = cfg?.status === "aberta";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-display text-4xl", children: "⚽ Artilheiro da Copa" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "R$10 por participante. Aposte antes do primeiro jogo da Copa." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-pitch", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-display text-5xl text-primary", children: fmtBRL(pool) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex justify-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize", children: cfg?.status }),
        aberta && cfg?.prazo_fim && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { children: [
          "Fecha em ",
          countdown(cfg.prazo_fim)
        ] }),
        cfg?.artilheiro_real && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-gold-gradient text-black", children: [
          "🏆 ",
          cfg.artilheiro_real
        ] })
      ] })
    ] }) }),
    aberta && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Seu palpite de artilheiro" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(IdentidadePicker, { value: identidade, onChange: setIdentidade }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nome do jogador" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: jogador, onChange: (e) => setJogador(e.target.value), placeholder: "Ex: Vinícius Jr.", maxLength: 80 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => enviar.mutate(), disabled: !identidade?.nome || !jogador.trim() || enviar.isPending, className: "w-full", children: "Registrar aposta" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { children: [
        "Apostas (",
        apostas?.length ?? 0,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: (apostas?.length ?? 0) === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Ninguém apostou ainda." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: apostas.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: `flex justify-between py-2 ${a.acertou ? "text-success font-bold" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: nomeMap.get(a.usuario_id) ?? "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          a.revelado ? a.jogador_apostado : "🔒 oculto até o fim da Copa",
          a.acertou && " ✓"
        ] })
      ] }, a.id)) }) })
    ] })
  ] });
}
export {
  Page as component
};
