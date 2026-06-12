import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { C as Card, b as CardHeader, c as CardTitle, i as CardDescription, a as CardContent, L as Label, I as Input, B as Button, d as fmtBRL, f as flag, j as cn, e as callFn } from "./router-Cg1YCoF8.mjs";
import { B as Badge } from "./badge-DVbQUSsf.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CIQDqwqZ.mjs";
import { R as Root, T as Thumb } from "../_libs/radix-ui__react-switch.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { S as SkeletonCard } from "./SkeletonCard-Im4FESGf.mjs";
import { s as supabase } from "./client-NTKDfrPQ.mjs";
import { d as Lock, e as Settings, L as LogOut, C as Coins, S as ShieldAlert, D as Dices, R as RefreshCw, U as Users, P as Plus, a as Trash2, T as Trophy } from "../_libs/lucide-react.mjs";
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
const Switch = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Root,
  {
    className: cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Thumb,
      {
        className: cn(
          "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = Root.displayName;
function Page() {
  const qc = useQueryClient();
  const [adminPin, setAdminPin] = reactExports.useState(() => typeof window !== "undefined" ? sessionStorage.getItem("admin_pin") || "" : "");
  const [typedPin, setTypedPin] = reactExports.useState("");
  const [newPin, setNewPin] = reactExports.useState("");
  const [nomePart, setNomePart] = reactExports.useState("");
  const [pinPart, setPinPart] = reactExports.useState("");
  const [artilheiro, setArtilheiro] = reactExports.useState("");
  const [f1, setF1] = reactExports.useState("");
  const [f2, setF2] = reactExports.useState("");
  const {
    data: config,
    isLoading: loadingConfig
  } = useQuery({
    queryKey: ["bolao-config"],
    queryFn: async () => {
      try {
        const {
          data,
          error
        } = await supabase.from("bolao_config").select("*").eq("id", 1).single();
        if (error) {
          console.warn("Table bolao_config not found or inaccessible, using defaults:", error.message);
          return {
            exclusividade_placar: true,
            admin_pin: "123456",
            sorteio_realizado: false,
            ultima_sync_api: null,
            total_jogos_api: 0
          };
        }
        return data;
      } catch (err) {
        console.warn("Error fetching bolao_config, using defaults:", err.message);
        return {
          exclusividade_placar: true,
          admin_pin: "123456",
          sorteio_realizado: false,
          ultima_sync_api: null,
          total_jogos_api: 0
        };
      }
    }
  });
  const {
    data: usuarios,
    isLoading: loadingUsuarios
  } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: async () => callFn("usuarios", void 0, "GET")
  });
  const {
    data: jogos
  } = useQuery({
    queryKey: ["jogos-all"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*")).data ?? []
  });
  const {
    data: cfgArt
  } = useQuery({
    queryKey: ["cfg-art"],
    queryFn: async () => (await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).single()).data
  });
  const {
    data: cfgFin
  } = useQuery({
    queryKey: ["cfg-fin"],
    queryFn: async () => (await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).single()).data
  });
  const {
    data: sorteio,
    refetch: refetchSorteio
  } = useQuery({
    queryKey: ["sorteio-admin"],
    queryFn: async () => callFn("sorteio", void 0, "GET")
  });
  const updateExclusividade = useMutation({
    mutationFn: async (exclusividade) => {
      const {
        error
      } = await supabase.from("bolao_config").update({
        exclusividade_placar: exclusividade
      }).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["bolao-config"]
      });
      toast.success("Regra de exclusividade de placar atualizada.");
    },
    onError: (e) => toast.error("Erro ao atualizar exclusividade: " + e.message)
  });
  const updatePin = useMutation({
    mutationFn: async (pin) => {
      if (!/^\d{6}$/.test(pin)) throw new Error("O PIN deve ter exatamente 6 dígitos");
      const {
        error
      } = await supabase.from("bolao_config").update({
        admin_pin: pin
      }).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: (_, pin) => {
      sessionStorage.setItem("admin_pin", pin);
      setAdminPin(pin);
      setNewPin("");
      qc.invalidateQueries({
        queryKey: ["bolao-config"]
      });
      toast.success("PIN de administrador atualizado.");
    },
    onError: (e) => toast.error(e.message)
  });
  const initDefaults = useMutation({
    mutationFn: () => callFn("usuarios", {
      action: "init_defaults"
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({
        queryKey: ["admin-usuarios"]
      });
      qc.invalidateQueries({
        queryKey: ["usuarios"]
      });
      toast.success(`Inicializado! ${res?.criados?.length ?? 0} novos participantes criados.`);
    },
    onError: (e) => toast.error(e.message)
  });
  const realizarSorteio = useMutation({
    mutationFn: () => callFn("sorteio", {
      action: "realizar"
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["sorteio-admin"]
      });
      qc.invalidateQueries({
        queryKey: ["sorteio-publico"]
      });
      qc.invalidateQueries({
        queryKey: ["sorteio"]
      });
      toast.success("Sorteio de ordem realizado com sucesso!");
    },
    onError: (e) => toast.error(e.message)
  });
  const realizarSorteioTodos = useMutation({
    mutationFn: () => callFn("sorteio", {
      action: "realizar_todos",
      admin_pin: adminPin
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["sorteio-admin"]
      });
      qc.invalidateQueries({
        queryKey: ["sorteio-publico"]
      });
      qc.invalidateQueries({
        queryKey: ["sorteio"]
      });
      qc.invalidateQueries({
        queryKey: ["jogos-all"]
      });
      toast.success("Fila aleatória gerada com sucesso para TODOS os jogos!");
    },
    onError: (e) => toast.error(e.message)
  });
  const resetarSorteio = useMutation({
    mutationFn: () => callFn("sorteio", {
      action: "resetar",
      admin_pin: adminPin
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["sorteio-admin"]
      });
      qc.invalidateQueries({
        queryKey: ["sorteio-publico"]
      });
      qc.invalidateQueries({
        queryKey: ["sorteio"]
      });
      toast.success("Sorteio redefinido. Nova ordem pode ser sorteada.");
    },
    onError: (e) => toast.error(e.message)
  });
  const addUsuario = useMutation({
    mutationFn: () => callFn("usuarios", {
      action: "create",
      nome: nomePart.trim(),
      pin: pinPart.trim() || null
    }),
    onSuccess: () => {
      setNomePart("");
      setPinPart("");
      qc.invalidateQueries({
        queryKey: ["admin-usuarios"]
      });
      qc.invalidateQueries({
        queryKey: ["usuarios"]
      });
      toast.success("Participante adicionado com sucesso.");
    },
    onError: (e) => toast.error(e.message)
  });
  const removerUsuario = useMutation({
    mutationFn: (id) => callFn("usuarios", {
      action: "delete",
      id
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["admin-usuarios"]
      });
      qc.invalidateQueries({
        queryKey: ["usuarios"]
      });
      toast.success("Participante removido.");
    },
    onError: (e) => toast.error(e.message)
  });
  const {
    data: syncLogs
  } = useQuery({
    queryKey: ["sync-logs"],
    queryFn: async () => (await supabase.from("bolao_sync_log").select("*").order("criado_em", {
      ascending: false
    }).limit(5)).data ?? [],
    enabled: !!adminPin && adminPin === config?.admin_pin
  });
  const sync = useMutation({
    mutationFn: () => callFn("sync-copa"),
    onSuccess: (d) => {
      qc.invalidateQueries();
      const jogos2 = d?.jogos?.upserts ?? d?.upserts ?? 0;
      toast.success(`Sync OK: ${jogos2} jogos | ${d?.standings ?? 0} classificação | ${d?.squads ?? 0} elencos`);
    },
    onError: (e) => toast.error(e.message)
  });
  const apurarJogos = useMutation({
    mutationFn: () => callFn("apurar-jogo"),
    onSuccess: (d) => {
      qc.invalidateQueries();
      toast.success(`${d?.apurados ?? 0} jogos encerrados apurados.`);
    },
    onError: (e) => toast.error(e.message)
  });
  const apurarArt = useMutation({
    mutationFn: () => callFn("apurar-artilheiro", {
      artilheiro
    }),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Artilheiro oficial apurado!");
    },
    onError: (e) => toast.error(e.message)
  });
  const apurarFin = useMutation({
    mutationFn: () => callFn("apurar-finalistas", {
      finalista1: f1,
      finalista2: f2
    }),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Finalistas oficiais apurados!");
    },
    onError: (e) => toast.error(e.message)
  });
  if (loadingConfig) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { lines: 6, className: "max-w-md mx-auto mt-10" });
  }
  const isAuthed = config && adminPin === config.admin_pin;
  if (!isAuthed) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-w-md mx-auto mt-10 p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-6 w-6 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-xl", children: "Acesso Restrito" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Digite o PIN de 6 dígitos para acessar o painel administrativo." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "admin-pin-input", children: "PIN do Administrador" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "admin-pin-input", type: "password", inputMode: "numeric", pattern: "[0-9]*", maxLength: 6, placeholder: "••••••", className: "text-center text-lg tracking-widest font-mono", value: typedPin, onChange: (e) => setTypedPin(e.target.value.replace(/\D/g, "").slice(0, 6)), onKeyDown: (e) => {
            if (e.key === "Enter" && typedPin.length === 6) {
              if (config && typedPin === config.admin_pin) {
                sessionStorage.setItem("admin_pin", typedPin);
                setAdminPin(typedPin);
                toast.success("Acesso autorizado");
              } else {
                toast.error("PIN incorreto");
              }
            }
          } })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full btn-touch", disabled: typedPin.length !== 6, onClick: () => {
          if (config && typedPin === config.admin_pin) {
            sessionStorage.setItem("admin_pin", typedPin);
            setAdminPin(typedPin);
            toast.success("Acesso autorizado");
          } else {
            toast.error("PIN incorreto");
          }
        }, children: "Entrar" })
      ] })
    ] }) });
  }
  const times = Array.from(new Set((jogos ?? []).flatMap((j) => [j.time_casa, j.time_fora]))).filter(Boolean).sort();
  const nP = usuarios?.length ?? 0;
  const totalArrecadado = nP * 10 + nP * 10 + (jogos ?? []).filter((j) => j.status === "encerrado" || j.status === "apurado").reduce((s, j) => s + Number(j.valor_entrada || 0) * nP, 0);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 max-w-4xl mx-auto animate-in pb-12", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-display text-3xl sm:text-4xl flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-8 w-8 text-primary" }),
          "Painel Admin"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Configurações globais, sorteio de ordem e apurações oficiais." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", size: "sm", onClick: () => {
        sessionStorage.removeItem("admin_pin");
        setAdminPin("");
        setTypedPin("");
        toast.info("Sessão encerrada");
      }, className: "shrink-0 btn-touch flex items-center gap-2 self-start sm:self-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" }),
        "Sair do Admin"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Settings, { className: "h-5 w-5 text-primary" }),
              "Configurações Gerais"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Regras do bolão e segurança" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5 pr-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-sm font-medium", children: "Exclusividade de Placar" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Impede dois participantes de palpitarem o mesmo placar no mesmo jogo." })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: config?.exclusividade_placar ?? true, onCheckedChange: (checked) => updateExclusividade.mutate(checked), disabled: updateExclusividade.isPending })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-2 border-t border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "new-admin-pin", className: "text-xs font-semibold uppercase text-muted-foreground", children: "Alterar PIN do Administrador" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "new-admin-pin", type: "password", inputMode: "numeric", maxLength: 6, placeholder: "Novo PIN (6 dígitos)", className: "font-mono text-sm", value: newPin, onChange: (e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6)) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", className: "btn-touch shrink-0", disabled: newPin.length !== 6 || updatePin.isPending, onClick: () => updatePin.mutate(newPin), children: "Salvar" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "pt-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-primary uppercase", children: "Participantes Padrão" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Caso os 8 participantes fixos (Igor, Natan, Alison, Pedro, Zé, Paulo, Vitinho, Kelvin) não tenham sido criados automaticamente." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", className: "w-full btn-touch text-xs", disabled: initDefaults.isPending, onClick: () => initDefaults.mutate(), children: initDefaults.isPending ? "Inicializando..." : "Inicializar 8 Participantes Padrão" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Coins, { className: "h-5 w-5 text-amber-500" }),
            "Resumo Financeiro"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Arrecadação e prêmios acumulados" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "divide-y divide-border border rounded-lg bg-secondary/10 overflow-hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatItem, { label: "Participantes Ativos", value: `${nP} participantes` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatItem, { label: "Pool Artilheiro", value: fmtBRL(nP * 10 + Number(cfgArt?.acumulado_anterior || 0)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatItem, { label: "Pool Finalistas", value: fmtBRL(nP * 10 + Number(cfgFin?.acumulado_anterior || 0)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatItem, { label: "Arrecadado em placar (Jogos encerrados)", value: fmtBRL(totalArrecadado - nP * 20) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(StatItem, { label: "Total Geral Arrecadado", value: fmtBRL(totalArrecadado), highlight: true })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground flex items-center gap-1.5 p-2 bg-secondary/30 rounded border border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-3.5 w-3.5 text-amber-500 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Custo de R$10 por módulo (Artilheiro, Finalistas) + R$1 por placar palpitado." })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Dices, { className: "h-5 w-5 text-primary" }),
                "Sorteio de Ordem"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Sorteio global legado. Cada jogo tem sorteio próprio ao ser aberto." })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: sorteio?.realizado ? "success" : "secondary", children: sorteio?.realizado ? "Realizado" : "Pendente" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: sorteio?.realizado ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-48 overflow-y-auto border rounded-lg p-2 bg-secondary/5 divide-y divide-border", children: (sorteio.ordem ?? []).map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-1.5 text-sm px-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold text-muted-foreground w-6", children: [
              o.posicao,
              "º"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium flex-1", children: o.nome })
          ] }, o.usuario_id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg", children: [
            "Nenhum sorteio realizado ainda. Clique abaixo para sortear os ",
            nP,
            " participantes ativos de forma randômica."
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-0 flex flex-col gap-2", children: [
          !sorteio?.realizado ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "w-full btn-touch flex items-center justify-center gap-2 border-primary", disabled: realizarSorteio.isPending || nP === 0, onClick: () => realizarSorteio.mutate(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Dices, { className: "h-4 w-4" }),
            realizarSorteio.isPending ? "Sorteando..." : "Realizar Sorteio Global Legado"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", className: "w-full btn-touch flex items-center justify-center gap-2", disabled: resetarSorteio.isPending, onClick: () => {
            if (confirm("ATENÇÃO: Isso irá apagar a ordem sorteada e redefinir o status do sorteio. Deseja continuar?")) {
              resetarSorteio.mutate();
            }
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-4 w-4" }),
            resetarSorteio.isPending ? "Redefinindo..." : "Limpar Sorteio Global"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "default", className: "w-full btn-touch flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white", disabled: realizarSorteioTodos.isPending || nP === 0, onClick: () => {
            if (confirm("Deseja gerar/regenerar a fila aleatória para TODOS os jogos do bolão de forma segura?")) {
              realizarSorteioTodos.mutate();
            }
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Dices, { className: "h-4 w-4" }),
            realizarSorteioTodos.isPending ? "Gerando Fila de Jogos..." : "Gerar Fila para TODOS os Jogos"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "h-5 w-5 text-primary" }),
              "Sincronização & Apuração"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "4 APIs: Football-Data, API-Football, TheSportsDB, StatsBomb — cron a cada 10 min" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-lg border border-border bg-secondary/10 text-xs space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Última sincronização:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: config?.ultima_sync_api ? new Date(config.ultima_sync_api).toLocaleString("pt-BR") : "Nunca" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Total de jogos mapeados:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono font-semibold", children: [
                  config?.total_jogos_api ?? 0,
                  " jogos"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "API-Football hoje:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono", children: [
                  config?.api_football_chamadas_hoje ?? 0,
                  "/95"
                ] })
              ] })
            ] }),
            (syncLogs?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs space-y-1 max-h-24 overflow-y-auto", children: syncLogs.map((l) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                l.fonte,
                " — ",
                l.status
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: new Date(l.criado_em).toLocaleTimeString("pt-BR") })
            ] }, l.id)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Apurar jogos:" }),
              ' Processa os jogos com status "encerrado" que possuem placar, distribuindo os prêmios ou acumulando os valores para a rodada seguinte.'
            ] }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "pt-0 flex flex-col sm:flex-row gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "flex-1 btn-touch flex items-center justify-center gap-2", disabled: sync.isPending, onClick: () => sync.mutate(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: `h-4 w-4 ${sync.isPending ? "animate-spin" : ""}` }),
            "Sincronizar Jogos"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", className: "flex-1 btn-touch flex items-center justify-center gap-2", disabled: apurarJogos.isPending, onClick: () => apurarJogos.mutate(), children: "⚖️ Apurar Jogos" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-5 w-5 text-primary" }),
          "Gerenciar Participantes (",
          nP,
          "/20)"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Cadastre novos participantes ou remova (soft-delete)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3 rounded-lg border border-border bg-secondary/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "user-name", children: "Nome" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "user-name", placeholder: "Ex: Pedro", value: nomePart, onChange: (e) => setNomePart(e.target.value) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "user-pin", children: "PIN (4 dígitos, opcional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "user-pin", placeholder: "Ex: 9876", inputMode: "numeric", maxLength: 4, value: pinPart, onChange: (e) => setPinPart(e.target.value.replace(/\D/g, "").slice(0, 4)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "btn-touch w-full flex items-center justify-center gap-1.5", disabled: !nomePart.trim() || addUsuario.isPending, onClick: () => addUsuario.mutate(), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
            "Adicionar"
          ] })
        ] }),
        loadingUsuarios ? /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { lines: 3 }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border rounded-lg overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-secondary/50 text-xs uppercase text-muted-foreground border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2", children: "Nome" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2", children: "PIN" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2", children: "Tipo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-right", children: "Ação" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-border", children: [
            (usuarios ?? []).map((u) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-secondary/10", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2.5 font-medium", children: u.nome }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2.5 font-mono text-xs", children: u.tem_pin ? "🔒 Cadastrado" : "Sem PIN" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2.5", children: u.e_participante_padrao ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "scale-90", children: "Padrão" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "scale-90", children: "Convidado" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2.5 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", className: "text-destructive hover:bg-destructive/10 btn-touch", disabled: removerUsuario.isPending, onClick: () => {
                if (confirm(`Remover participante ${u.nome}?`)) {
                  removerUsuario.mutate(u.id);
                }
              }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) }) })
            ] }, u.id)),
            (!usuarios || usuarios.length === 0) && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 4, className: "text-center py-6 text-muted-foreground text-sm", children: "Nenhum participante ativo cadastrado." }) })
          ] })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-5 w-5 text-amber-500" }),
            "⚽ Apurar Artilheiro da Copa"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
            "Status atual do módulo: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize ml-1 scale-90", children: cfgArt?.status ?? "fechado" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          cfgArt?.artilheiro_real && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-500 flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "🏆 Artilheiro Apurado: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: cfgArt.artilheiro_real })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "artilheiro-input", children: "Nome Oficial do Artilheiro" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "artilheiro-input", value: artilheiro, onChange: (e) => setArtilheiro(e.target.value), placeholder: "Ex: Kylian Mbappé", disabled: cfgArt?.status === "apurada" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full btn-touch", disabled: !artilheiro.trim() || apurarArt.isPending || cfgArt?.status === "apurada", onClick: () => {
            if (confirm(`Apurar artilheiro como "${artilheiro}"? Esta ação não pode ser desfeita.`)) {
              apurarArt.mutate();
            }
          }, children: apurarArt.isPending ? "Apurando..." : "Apurar Artilheiro" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-5 w-5 text-amber-500" }),
            "🏆 Apurar Dois Finalistas"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CardDescription, { children: [
            "Status atual do módulo: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "capitalize ml-1 scale-90", children: cfgFin?.status ?? "fechado" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          cfgFin?.finalista1_real && cfgFin?.finalista2_real && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-500", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "🏆 Finalistas Apurados: ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              flag(cfgFin.finalista1_real),
              " ",
              cfgFin.finalista1_real
            ] }),
            " e ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              flag(cfgFin.finalista2_real),
              " ",
              cfgFin.finalista2_real
            ] })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "f1-select", children: "Finalista 1" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: f1, onValueChange: setF1, disabled: cfgFin?.status === "apurada", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "f1-select", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: times.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: t, children: [
                  flag(t),
                  " ",
                  t
                ] }, t)) })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "f2-select", children: "Finalista 2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: f2, onValueChange: setF2, disabled: cfgFin?.status === "apurada", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "f2-select", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: times.filter((t) => t !== f1).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: t, children: [
                  flag(t),
                  " ",
                  t
                ] }, t)) })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full btn-touch", disabled: !f1 || !f2 || apurarFin.isPending || cfgFin?.status === "apurada", onClick: () => {
            if (confirm(`Confirmar finalistas como "${f1}" e "${f2}"? Esta ação não pode ser desfeita.`)) {
              apurarFin.mutate();
            }
          }, children: apurarFin.isPending ? "Apurando..." : "Apurar Finalistas" })
        ] })
      ] })
    ] })
  ] });
}
function StatItem({
  label,
  value,
  highlight = false
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex justify-between items-center px-4 py-3 text-sm ${highlight ? "bg-primary/10 border-t border-primary/20" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: highlight ? "font-bold text-foreground" : "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-mono ${highlight ? "font-bold text-primary text-base" : "font-semibold text-foreground"}`, children: value })
  ] });
}
export {
  Page as component
};
