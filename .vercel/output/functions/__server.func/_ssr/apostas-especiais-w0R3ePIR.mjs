import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { C as Card, b as CardHeader, c as CardTitle, i as CardDescription, a as CardContent, L as Label, I as Input, B as Button, f as flag, h as countdown, d as fmtBRL, e as callFn } from "./router-Cg1YCoF8.mjs";
import { B as Badge } from "./badge-DVbQUSsf.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-CIQDqwqZ.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-D_C3GFFZ.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { I as IdentidadePicker } from "./IdentidadePicker-1FPTpbOA.mjs";
import { s as supabase } from "./client-NTKDfrPQ.mjs";
import { T as Trophy, c as TriangleAlert, S as ShieldAlert } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-tabs.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-presence.mjs";
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
  const [artilheiro, setArtilheiro] = reactExports.useState("");
  const [fin1, setFin1] = reactExports.useState("");
  const [fin2, setFin2] = reactExports.useState("");
  const [campeao, setCampeao] = reactExports.useState("");
  const [zebra, setZebra] = reactExports.useState("");
  const [golCasa, setGolCasa] = reactExports.useState("");
  const [golFora, setGolFora] = reactExports.useState("");
  const [golGolsCasa, setGolGolsCasa] = reactExports.useState(0);
  const [golGolsFora, setGolGolsFora] = reactExports.useState(0);
  const {
    data: usuarios
  } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("nome")).data ?? []
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
  const {
    data: cfgArt
  } = useQuery({
    queryKey: ["cfg-art"],
    queryFn: async () => (await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).maybeSingle()).data || {
      status: "fechada",
      prazo_fim: null,
      acumulado_anterior: 0
    }
  });
  const {
    data: cfgFin
  } = useQuery({
    queryKey: ["cfg-fin"],
    queryFn: async () => (await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).maybeSingle()).data || {
      status: "fechada",
      prazo_fim: null,
      acumulado_anterior: 0
    }
  });
  const {
    data: cfgCam
  } = useQuery({
    queryKey: ["cfg-cam"],
    queryFn: async () => (await supabase.from("bolao_config_campeao").select("*").eq("id", 1).maybeSingle()).data || {
      status: "aberta",
      prazo_fim: null,
      acumulado_anterior: 0
    }
  });
  const {
    data: cfgZeb
  } = useQuery({
    queryKey: ["cfg-zeb"],
    queryFn: async () => (await supabase.from("bolao_config_zebra").select("*").eq("id", 1).maybeSingle()).data || {
      status: "aberta",
      prazo_fim: null,
      acumulado_anterior: 0
    }
  });
  const {
    data: cfgGol
  } = useQuery({
    queryKey: ["cfg-gol"],
    queryFn: async () => (await supabase.from("bolao_config_goleada").select("*").eq("id", 1).maybeSingle()).data || {
      status: "aberta",
      prazo_fim: null,
      acumulado_anterior: 0
    }
  });
  const {
    data: apostasArt
  } = useQuery({
    queryKey: ["apostas-art"],
    queryFn: async () => (await supabase.from("bolao_apostas_artilheiro_publica").select("*")).data ?? []
  });
  const {
    data: apostasFin
  } = useQuery({
    queryKey: ["apostas-fin"],
    queryFn: async () => (await supabase.from("bolao_apostas_finalistas_publica").select("*")).data ?? []
  });
  const {
    data: apostasCam
  } = useQuery({
    queryKey: ["apostas-cam"],
    queryFn: async () => (await supabase.from("bolao_apostas_campeao_publica").select("*")).data ?? []
  });
  const {
    data: apostasZeb
  } = useQuery({
    queryKey: ["apostas-zeb"],
    queryFn: async () => (await supabase.from("bolao_apostas_zebra_publica").select("*")).data ?? []
  });
  const {
    data: apostasGol
  } = useQuery({
    queryKey: ["apostas-gol"],
    queryFn: async () => (await supabase.from("bolao_apostas_goleada_publica").select("*")).data ?? []
  });
  const postArt = useMutation({
    mutationFn: () => callFn("aposta-artilheiro", {
      nome: identidade?.nome,
      pin: identidade?.pin,
      jogador: artilheiro
    }),
    onSuccess: () => {
      setArtilheiro("");
      qc.invalidateQueries({
        queryKey: ["apostas-art"]
      });
      toast.success("Aposta em Artilheiro registrada!");
    },
    onError: (e) => toast.error(e.message)
  });
  const postFin = useMutation({
    mutationFn: () => callFn("aposta-finalistas", {
      nome: identidade?.nome,
      pin: identidade?.pin,
      time1: fin1,
      time2: fin2
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["apostas-fin"]
      });
      toast.success("Aposta em Finalistas registrada!");
    },
    onError: (e) => toast.error(e.message)
  });
  const postCam = useMutation({
    mutationFn: () => callFn("aposta-campeao", {
      nome: identidade?.nome,
      pin: identidade?.pin,
      time: campeao
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["apostas-cam"]
      });
      toast.success("Aposta em Campeão registrada!");
    },
    onError: (e) => toast.error(e.message)
  });
  const postZeb = useMutation({
    mutationFn: () => callFn("aposta-zebra", {
      nome: identidade?.nome,
      pin: identidade?.pin,
      zebra
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["apostas-zeb"]
      });
      toast.success("Aposta em Zebra registrada!");
    },
    onError: (e) => toast.error(e.message)
  });
  const postGol = useMutation({
    mutationFn: () => callFn("aposta-goleada", {
      nome: identidade?.nome,
      pin: identidade?.pin,
      time_casa: golCasa,
      time_fora: golFora,
      gols_casa: golGolsCasa,
      gols_fora: golGolsFora
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["apostas-gol"]
      });
      toast.success("Aposta em Maior Goleada registrada!");
    },
    onError: (e) => toast.error(e.message)
  });
  const nP = usuarios?.length ?? 0;
  const nomeMap = reactExports.useMemo(() => new Map((usuarios ?? []).map((u) => [u.id, u.nome])), [usuarios]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 max-w-4xl mx-auto pb-12 animate-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-display text-3xl sm:text-4xl flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-8 w-8 text-primary" }),
        "🎰 Apostas Especiais"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "Módulos especiais do bolão. Cada módulo custa R$10 adicionais por participante." })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "pb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Quem está apostando?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: "Identifique-se uma vez para preencher os palpites abaixo." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(IdentidadePicker, { value: identidade, onChange: setIdentidade }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "table-scroll pb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "artilheiro", className: "w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "flex h-auto w-max min-w-full", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "artilheiro", className: "shrink-0 flex items-center gap-1.5 py-2", children: "⚽ Artilheiro" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "finalistas", className: "shrink-0 flex items-center gap-1.5 py-2", children: "🏆 Finalistas" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "campeao", className: "shrink-0 flex items-center gap-1.5 py-2", children: "🥇 Campeão" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "zebra", className: "shrink-0 flex items-center gap-1.5 py-2", children: "🦓 Zebra" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "goleada", className: "shrink-0 flex items-center gap-1.5 py-2", children: "🔥 Goleada" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "artilheiro", className: "space-y-4 mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SpecialBetTab, { title: "Artilheiro da Copa", description: "Aposte em quem será o maior goleador da Copa do Mundo 2026.", status: cfgArt.status, prazoFim: cfgArt.prazo_fim, acumulado: cfgArt.acumulado_anterior, nP, resultadoReal: cfgArt.artilheiro_real, form: cfgArt.status === "aberta" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-3 border-t border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "artilheiro-name", children: "Nome do Artilheiro" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "artilheiro-name", placeholder: "Ex: Kylian Mbappé", value: artilheiro, onChange: (e) => setArtilheiro(e.target.value) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !identidade?.nome || !artilheiro.trim() || postArt.isPending, onClick: () => postArt.mutate(), className: "w-full btn-touch", children: postArt.isPending ? "Salvando..." : "Salvar Palpite de Artilheiro" })
      ] }), bets: /* @__PURE__ */ jsxRuntimeExports.jsx(BetsList, { bets: apostasArt, nomeMap, renderValue: (a) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: a.revelado ? a.jogador_apostado : "🔒 oculto até o fim" }), isAcertou: (a) => a.acertou }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "finalistas", className: "space-y-4 mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SpecialBetTab, { title: "Dois Finalistas", description: "Aposte nas duas equipes que farão a grande final.", status: cfgFin.status, prazoFim: cfgFin.prazo_fim, acumulado: cfgFin.acumulado_anterior, nP, resultadoReal: cfgFin.finalista1_real && cfgFin.finalista2_real ? `${flag(cfgFin.finalista1_real)} ${cfgFin.finalista1_real} x ${cfgFin.finalista2_real} ${flag(cfgFin.finalista2_real)}` : null, form: cfgFin.status === "aberta" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-3 border-t border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "fin1-select", children: "Finalista 1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: fin1, onValueChange: setFin1, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "fin1-select", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: times?.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: t, children: [
                flag(t),
                " ",
                t
              ] }, t)) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "fin2-select", children: "Finalista 2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: fin2, onValueChange: setFin2, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "fin2-select", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: times?.filter((t) => t !== fin1).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: t, children: [
                flag(t),
                " ",
                t
              ] }, t)) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !identidade?.nome || !fin1 || !fin2 || postFin.isPending, onClick: () => postFin.mutate(), className: "w-full btn-touch", children: postFin.isPending ? "Salvando..." : "Salvar Palpite de Finalistas" })
      ] }), bets: /* @__PURE__ */ jsxRuntimeExports.jsx(BetsList, { bets: apostasFin, nomeMap, renderValue: (a) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: a.revelado ? `${flag(a.time1)} ${a.time1} × ${a.time2} ${flag(a.time2)}` : "🔒 oculto até a final" }), isAcertou: (a) => a.acertou_os_dois, acertouBadge: (a) => a.acertou_os_dois ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-success scale-90", children: "Acertou 2" }) : a.acertou_um ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "scale-90", children: "Acertou 1" }) : null }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "campeao", className: "space-y-4 mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SpecialBetTab, { title: "Campeão Mundial", description: "Aposte na seleção que levantará a taça de campeã do mundo.", status: cfgCam.status, prazoFim: cfgCam.prazo_fim, acumulado: cfgCam.acumulado_anterior, nP, resultadoReal: cfgCam.campeao_real ? `${flag(cfgCam.campeao_real)} ${cfgCam.campeao_real}` : null, form: cfgCam.status === "aberta" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-3 border-t border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "campeao-select", children: "Seleção Campeã" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: campeao, onValueChange: setCampeao, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "campeao-select", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione uma seleção" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: times?.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: t, children: [
              flag(t),
              " ",
              t
            ] }, t)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !identidade?.nome || !campeao || postCam.isPending, onClick: () => postCam.mutate(), className: "w-full btn-touch", children: postCam.isPending ? "Salvando..." : "Salvar Palpite de Campeão" })
      ] }), bets: /* @__PURE__ */ jsxRuntimeExports.jsx(BetsList, { bets: apostasCam, nomeMap, renderValue: (a) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: a.revelado ? `${flag(a.time_campeao)} ${a.time_campeao}` : "🔒 oculto" }), isAcertou: (a) => a.acertou }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "zebra", className: "space-y-4 mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SpecialBetTab, { title: "Zebra do Torneio", description: "Qual seleção surpreenderá o mundo indo mais longe do que o esperado?", status: cfgZeb.status, prazoFim: cfgZeb.prazo_fim, acumulado: cfgZeb.acumulado_anterior, nP, resultadoReal: cfgZeb.zebra_real ? `${flag(cfgZeb.zebra_real)} ${cfgZeb.zebra_real}` : null, form: cfgZeb.status === "aberta" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-3 border-t border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "zebra-select", children: "Seleção Zebra" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: zebra, onValueChange: setZebra, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "zebra-select", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione a Zebra" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: times?.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: t, children: [
              flag(t),
              " ",
              t
            ] }, t)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !identidade?.nome || !zebra || postZeb.isPending, onClick: () => postZeb.mutate(), className: "w-full btn-touch", children: postZeb.isPending ? "Salvando..." : "Salvar Palpite de Zebra" })
      ] }), bets: /* @__PURE__ */ jsxRuntimeExports.jsx(BetsList, { bets: apostasZeb, nomeMap, renderValue: (a) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: a.revelado ? `${flag(a.zebra_apostada)} ${a.zebra_apostada}` : "🔒 oculto" }), isAcertou: (a) => a.acertou }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "goleada", className: "space-y-4 mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SpecialBetTab, { title: "Maior Goleada da Copa", description: "Aposte em qual será o placar mais elástico de toda a competição.", status: cfgGol.status, prazoFim: cfgGol.prazo_fim, acumulado: cfgGol.acumulado_anterior, nP, resultadoReal: cfgGol.goleada_time_casa_real ? `${flag(cfgGol.goleada_time_casa_real)} ${cfgGol.goleada_time_casa_real} ${cfgGol.goleada_gols_casa_real} x ${cfgGol.goleada_gols_fora_real} ${cfgGol.goleada_time_fora_real} ${flag(cfgGol.goleada_time_fora_real)}` : null, form: cfgGol.status === "aberta" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 pt-3 border-t border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "gol-casa-select", children: "Time Casa" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: golCasa, onValueChange: setGolCasa, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "gol-casa-select", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: times?.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: t, children: [
                flag(t),
                " ",
                t
              ] }, t)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 justify-center pt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => setGolGolsCasa(Math.max(0, golGolsCasa - 1)), className: "h-8 w-8 rounded-full", children: "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold font-mono w-6 text-center", children: golGolsCasa }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => setGolGolsCasa(golGolsCasa + 1), className: "h-8 w-8 rounded-full", children: "+" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "gol-fora-select", children: "Time Fora" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: golFora, onValueChange: setGolFora, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { id: "gol-fora-select", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: times?.filter((t) => t !== golCasa).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectItem, { value: t, children: [
                flag(t),
                " ",
                t
              ] }, t)) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 justify-center pt-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => setGolGolsFora(Math.max(0, golGolsFora - 1)), className: "h-8 w-8 rounded-full", children: "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-bold font-mono w-6 text-center", children: golGolsFora }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "secondary", size: "sm", onClick: () => setGolGolsFora(golGolsFora + 1), className: "h-8 w-8 rounded-full", children: "+" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-lg font-semibold bg-secondary/20 p-2 rounded", children: [
          "Goleada: ",
          golCasa || "Time Casa",
          " ",
          golGolsCasa,
          " x ",
          golGolsFora,
          " ",
          golFora || "Time Fora"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: !identidade?.nome || !golCasa || !golFora || postGol.isPending, onClick: () => postGol.mutate(), className: "w-full btn-touch", children: postGol.isPending ? "Salvando..." : "Salvar Palpite de Maior Goleada" })
      ] }), bets: /* @__PURE__ */ jsxRuntimeExports.jsx(BetsList, { bets: apostasGol, nomeMap, renderValue: (a) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: a.revelado ? `${flag(a.time_casa)} ${a.time_casa} ${a.gols_casa} × ${a.gols_fora} ${a.time_fora} ${flag(a.time_fora)}` : "🔒 oculto" }), isAcertou: (a) => a.acertou }) }) })
    ] }) })
  ] });
}
function SpecialBetTab({
  title,
  description,
  status,
  prazoFim,
  acumulado,
  nP,
  resultadoReal,
  form,
  bets
}) {
  const poolVal = nP * 10 + Number(acumulado || 0);
  const isAberta = status === "aberta";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { children: description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 flex-wrap items-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: isAberta ? "success" : "secondary", className: "capitalize", children: status }),
            isAberta && prazoFim && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "text-xs", children: [
              "Fecha em: ",
              countdown(prazoFim)
            ] })
          ] }),
          resultadoReal && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-200", children: [
            "Resultado Oficial: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: resultadoReal })
          ] }),
          !isAberta && status === "fechada" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 p-3 bg-secondary/30 rounded border border-border text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-amber-500 shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "As apostas para este módulo estão atualmente fechadas." })
          ] }),
          form
        ] })
      ] }),
      bets
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "bg-pitch", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardDescription, { className: "text-center font-semibold text-xs uppercase tracking-wider text-muted-foreground", children: "Pool de Prêmio Acumulado" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "text-center py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-display text-4xl sm:text-5xl text-primary font-bold", children: fmtBRL(poolVal) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mt-2", children: [
            "R$10 x ",
            nP,
            " participantes = ",
            fmtBRL(nP * 10),
            Number(acumulado) > 0 && ` + ${fmtBRL(acumulado)} acumulado anterior`
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 font-semibold text-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-4 w-4 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Regras de Auditoria & Prazo" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground leading-normal", children: "As apostas especiais ficam ocultas para os demais participantes até o encerramento do prazo ou apuração oficial. Garantimos a integridade total do banco de dados contra alterações após o prazo configurado." })
      ] })
    ] })
  ] });
}
function BetsList({
  bets,
  nomeMap,
  renderValue,
  isAcertou,
  acertouBadge
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "text-lg", children: [
      "Palpites Registrados (",
      bets.length,
      ")"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: bets.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: "Nenhum palpite registrado ainda." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: bets.map((a) => {
      const acertou = isAcertou ? isAcertou(a) === true : false;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex justify-between items-center py-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-medium ${acertou ? "text-success font-bold" : ""}`, children: nomeMap.get(a.usuario_id) ?? "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: acertou ? "text-success font-bold" : "", children: renderValue(a) }),
          acertouBadge ? acertouBadge(a) : acertou && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-success scale-90", children: "✓" })
        ] })
      ] }, a.id);
    }) }) })
  ] });
}
export {
  Page as component
};
