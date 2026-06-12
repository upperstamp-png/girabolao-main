import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { C as Card, a as CardContent, d as fmtBRL, h as countdown, f as flag, b as CardHeader, c as CardTitle, L as Label, B as Button, e as callFn } from "./router-Cg1YCoF8.mjs";
import { B as Badge } from "./badge-DVbQUSsf.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CIQDqwqZ.mjs";
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
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
function Page() {
  const qc = useQueryClient();
  const [identidade, setIdentidade] = reactExports.useState(null);
  const [t1, setT1] = reactExports.useState("");
  const [t2, setT2] = reactExports.useState("");
  const {
    data: cfg
  } = useQuery({
    queryKey: ["cfg-fin"],
    queryFn: async () => (await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).single()).data
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
    queryKey: ["apostas-fin"],
    queryFn: async () => (await supabase.from("bolao_apostas_finalistas_publica").select("*")).data ?? []
  });
  const {
    data: times
  } = useQuery({
    queryKey: ["times"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("bolao_jogos").select("time_casa, time_fora");
      const set = /* @__PURE__ */ new Set();
      data?.forEach((j) => {
        set.add(j.time_casa);
        set.add(j.time_fora);
      });
      return Array.from(set).sort();
    }
  });
  const enviar = useMutation({
    mutationFn: () => callFn("aposta-finalistas", {
      nome: identidade?.nome,
      pin: identidade?.pin,
      time1: t1,
      time2: t2
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["apostas-fin"]
      });
      toast.success("Aposta registrada!");
    },
    onError: (e) => toast.error(e.message)
  });
  const nP = usuarios?.length ?? 0;
  const pool = nP * 10 + Number(cfg?.acumulado_anterior || 0);
  const nomeMap = reactExports.useMemo(() => new Map((usuarios ?? []).map((u) => [u.id, u.nome])), [usuarios]);
  const aberta = cfg?.status === "aberta";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-display text-4xl", children: "🏆 Dois Finalistas" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "R$10 por participante. Aposta abre quando começam as oitavas." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "bg-pitch", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-display text-5xl text-primary", children: fmtBRL(pool) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex justify-center gap-2 flex-wrap", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize", children: cfg?.status }),
        aberta && cfg?.prazo_fim && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { children: [
          "Fecha em ",
          countdown(cfg.prazo_fim)
        ] }),
        cfg?.finalista1_real && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-gold-gradient text-black", children: [
          flag(cfg.finalista1_real),
          " ",
          cfg.finalista1_real,
          " × ",
          cfg.finalista2_real,
          " ",
          flag(cfg.finalista2_real)
        ] })
      ] })
    ] }) }),
    !aberta && cfg?.status === "fechada" && /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "py-6 text-center text-muted-foreground", children: "As apostas abrem automaticamente quando o primeiro jogo das oitavas for agendado." }) }),
    aberta && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Seu palpite" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(IdentidadePicker, { value: identidade, onChange: setIdentidade }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "1º finalista" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: t1, onValueChange: setT1, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: times?.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: t, children: [
                flag(t),
                " ",
                t
              ] }, t)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "2º finalista" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: t2, onValueChange: setT2, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: times?.filter((t) => t !== t1).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: t, children: [
                flag(t),
                " ",
                t
              ] }, t)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => enviar.mutate(), disabled: !identidade?.nome || !t1 || !t2 || enviar.isPending, className: "w-full", children: "Registrar aposta" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { children: [
        "Apostas (",
        apostas?.length ?? 0,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: (apostas?.length ?? 0) === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Ninguém apostou ainda." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: apostas.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: `flex justify-between py-2 ${a.acertou_os_dois ? "text-success font-bold" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: nomeMap.get(a.usuario_id) ?? "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          a.revelado ? `${flag(a.time1)} ${a.time1} × ${a.time2} ${flag(a.time2)}` : "🔒 oculto até apuração",
          a.acertou_os_dois && " ✓✓",
          !a.acertou_os_dois && a.acertou_um && " ✓"
        ] })
      ] }, a.id)) }) })
    ] })
  ] });
}
export {
  Page as component
};
