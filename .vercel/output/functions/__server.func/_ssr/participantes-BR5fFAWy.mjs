import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { g as getIdentidade, C as Card, b as CardHeader, c as CardTitle, a as CardContent, L as Label, I as Input, B as Button, s as setIdentidade, e as callFn } from "./router-Cg1YCoF8.mjs";
import { B as Badge } from "./badge-DVbQUSsf.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { S as SkeletonCard } from "./SkeletonCard-Im4FESGf.mjs";
import { E as ErrorState } from "./ErrorState-DAhPA3He.mjs";
import { U as Users, a as Trash2, b as UserPlus } from "../_libs/lucide-react.mjs";
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
function Page() {
  const qc = useQueryClient();
  const [nome, setNome] = reactExports.useState("");
  const [pin, setPin] = reactExports.useState("");
  const [showAdd, setShowAdd] = reactExports.useState(false);
  const [minhaConta, setMinhaConta] = reactExports.useState(() => getIdentidade());
  const [meuNome, setMeuNome] = reactExports.useState(() => getIdentidade()?.nome ?? "");
  const [pinAtual, setPinAtual] = reactExports.useState("");
  const [novoPin, setNovoPin] = reactExports.useState("");
  const {
    data: usuarios,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ["usuarios-full"],
    queryFn: async () => callFn("usuarios", void 0, "GET")
  });
  const {
    data: sorteio
  } = useQuery({
    queryKey: ["sorteio"],
    queryFn: async () => callFn("sorteio", void 0, "GET")
  });
  const criar = useMutation({
    mutationFn: () => callFn("usuarios", {
      action: "create",
      nome: nome.trim(),
      pin: pin.trim() || null
    }),
    onSuccess: () => {
      setNome("");
      setPin("");
      setShowAdd(false);
      qc.invalidateQueries({
        queryKey: ["usuarios-full"]
      });
      qc.invalidateQueries({
        queryKey: ["usuarios"]
      });
      toast.success("Participante adicionado");
    },
    onError: (e) => toast.error(e.message)
  });
  const remover = useMutation({
    mutationFn: (id) => callFn("usuarios", {
      action: "delete",
      id
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["usuarios-full"]
      });
      qc.invalidateQueries({
        queryKey: ["usuarios"]
      });
      toast.success("Participante removido");
    },
    onError: (e) => toast.error(e.message)
  });
  const atualizarConta = useMutation({
    mutationFn: () => callFn("usuarios", {
      action: "update_self",
      nome_atual: minhaConta?.nome,
      pin_atual: pinAtual,
      novo_nome: meuNome.trim(),
      novo_pin: novoPin
    }),
    onSuccess: (res) => {
      const atualizada = {
        id: res.usuario.id,
        nome: res.usuario.nome,
        pin: novoPin,
        tem_pin: true
      };
      setIdentidade(atualizada);
      setMinhaConta(atualizada);
      setPinAtual("");
      setNovoPin("");
      qc.invalidateQueries({
        queryKey: ["usuarios-full"]
      });
      qc.invalidateQueries({
        queryKey: ["usuarios"]
      });
      toast.success("Seus dados foram atualizados.");
    },
    onError: (e) => toast.error(e.message)
  });
  const total = usuarios?.length ?? 0;
  const sorteioRealizado = sorteio?.realizado ?? false;
  const ordemMap = new Map((sorteio?.ordem ?? []).map((o) => [o.usuario_id, o.posicao]));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl mx-auto space-y-5 animate-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-display text-3xl sm:text-4xl", children: "Participantes" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "8 participantes padrão + possibilidade de adicionar mais." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Minha conta" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nome" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: meuNome, onChange: (e) => setMeuNome(e.target.value), maxLength: 40, className: "mt-1" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "PIN atual" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: pinAtual, onChange: (e) => setPinAtual(e.target.value.replace(/\D/g, "").slice(0, 4)), placeholder: "1234", inputMode: "numeric", type: "password", className: "mt-1" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Novo PIN" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: novoPin, onChange: (e) => setNovoPin(e.target.value.replace(/\D/g, "").slice(0, 4)), placeholder: "4 dígitos", inputMode: "numeric", type: "password", className: "mt-1" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full btn-touch", disabled: !minhaConta?.nome || !meuNome.trim() || pinAtual.length !== 4 || novoPin.length !== 4 || atualizarConta.isPending, onClick: () => atualizarConta.mutate(), children: atualizarConta.isPending ? "Salvando..." : "Salvar meu nome e PIN" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "O PIN inicial dos cadastrados é 1234. Depois de trocar, use o novo PIN no próximo acesso." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
          "Cadastrados"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
          total,
          " participantes"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { children: [
        isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { lines: 4 }),
        isError && /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { message: "Erro ao carregar participantes.", onRetry: () => refetch() }),
        !isLoading && !isError && (total === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6 text-muted-foreground text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl mb-2", children: "👤" }),
          "Nenhum participante. Vá em Admin para inicializar os participantes padrão."
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: usuarios.map((u) => {
          const pos = ordemMap.get(u.id);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between py-3 gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 min-w-0", children: [
              sorteioRealizado && pos && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${pos === 1 ? "bg-gold-gradient text-black" : pos === 2 ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground"}`, children: pos }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium truncate", children: u.nome }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-2", children: [
                  u.tem_pin ? "🔒 PIN" : "Sem PIN",
                  u.e_participante_padrao && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "text-xs py-0", children: "Padrão" })
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", className: "shrink-0 btn-touch", onClick: () => {
              if (confirm(`Remover ${u.nome}?`)) remover.mutate(u.id);
            }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4 text-destructive" }) })
          ] }, u.id);
        }) }))
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "flex items-center justify-between w-full text-left", onClick: () => setShowAdd((o) => !o), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "h-4 w-4" }),
          "Adicionar participante"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-sm", children: showAdd ? "▲" : "▼" })
      ] }) }),
      showAdd && /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-3 pt-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nome" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: nome, onChange: (e) => setNome(e.target.value), placeholder: "Ex: João", maxLength: 40, className: "mt-1" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "PIN (4 dígitos, opcional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: pin, onChange: (e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4)), placeholder: "1234", inputMode: "numeric", className: "mt-1" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => criar.mutate(), disabled: !nome.trim() || criar.isPending, className: "w-full btn-touch", children: criar.isPending ? "Adicionando..." : "Adicionar" })
      ] })
    ] }),
    sorteioRealizado && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "🎲 Ordem do sorteio" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "space-y-2", children: (sorteio?.ordem ?? []).map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: `flex items-center gap-3 p-2 rounded-lg border border-border sorteio-item ${o.posicao === 1 ? "sorteio-posicao-1" : o.posicao === 2 ? "sorteio-posicao-2" : o.posicao === 3 ? "sorteio-posicao-3" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-display text-xl w-8 text-center", children: o.posicao === 1 ? "🥇" : o.posicao === 2 ? "🥈" : o.posicao === 3 ? "🥉" : o.posicao }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: o.nome })
      ] }, o.usuario_id)) }) })
    ] })
  ] });
}
export {
  Page as component
};
