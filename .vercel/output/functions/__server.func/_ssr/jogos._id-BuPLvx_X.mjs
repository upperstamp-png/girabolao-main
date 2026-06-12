import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useParams, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { c as confetti } from "../_libs/canvas-confetti.mjs";
import { g as getIdentidade, C as Card, a as CardContent, F as FASES_LABEL, f as flag, h as countdown, d as fmtBRL, b as CardHeader, c as CardTitle, B as Button, e as callFn } from "./router-Cg1YCoF8.mjs";
import { p as pollIntervalForStatus } from "./realtime-Zp7UVzLF.mjs";
import { B as Badge } from "./badge-DVbQUSsf.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { I as IdentidadePicker } from "./IdentidadePicker-1FPTpbOA.mjs";
import { S as SkeletonCard } from "./SkeletonCard-Im4FESGf.mjs";
import { E as ErrorState } from "./ErrorState-DAhPA3He.mjs";
import { s as supabase } from "./client-NTKDfrPQ.mjs";
import { D as Dices, i as Minus, P as Plus } from "../_libs/lucide-react.mjs";
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
function verificarVezNaSequencia(ordem, usuario_id, usuariosComPalpite) {
  if (!usuario_id) {
    return { podeApostar: false, mensagem: "Entre com nome e PIN para apostar." };
  }
  if (ordem.length === 0) {
    return { podeApostar: false, mensagem: "Aguardando sorteio deste jogo..." };
  }
  const minhaPosicao = ordem.find((o) => o.usuario_id === usuario_id)?.posicao;
  if (usuariosComPalpite.has(usuario_id)) {
    return { podeApostar: true, minhaPosicao };
  }
  for (const item of ordem) {
    if (!usuariosComPalpite.has(item.usuario_id)) {
      if (item.usuario_id === usuario_id) {
        return { podeApostar: true, minhaPosicao };
      }
      return {
        podeApostar: false,
        mensagem: `Aguarde a vez de ${item.nome ?? "outro participante"} (${item.posicao}º).`,
        aguardando: item.nome,
        minhaPosicao
      };
    }
  }
  return { podeApostar: true, minhaPosicao };
}
function GolInput({
  label,
  value,
  onChange,
  disabled
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground text-center", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled, onClick: () => onChange(Math.max(0, value - 1)), className: "h-11 w-11 rounded-full border border-border bg-secondary flex items-center justify-center hover:bg-secondary/80 active:scale-95 transition-all btn-touch disabled:opacity-50 disabled:pointer-events-none", "aria-label": "Diminuir", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-4 w-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-display text-5xl w-12 text-center text-primary", children: value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", disabled, onClick: () => onChange(Math.min(30, value + 1)), className: "h-11 w-11 rounded-full border border-border bg-secondary flex items-center justify-center hover:bg-secondary/80 active:scale-95 transition-all btn-touch disabled:opacity-50 disabled:pointer-events-none", "aria-label": "Aumentar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) })
    ] })
  ] });
}
function Page() {
  const {
    id
  } = useParams({
    from: "/jogos/$id"
  });
  const qc = useQueryClient();
  const [identidade, setIdentidade] = reactExports.useState(() => getIdentidade());
  const [gc, setGc] = reactExports.useState(0);
  const [gf, setGf] = reactExports.useState(0);
  const {
    data: jogo,
    isLoading: loadingJogo,
    isError: errJogo,
    refetch: refetchJogo
  } = useQuery({
    queryKey: ["jogo", id],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*").eq("id", id).single()).data,
    refetchInterval: (q) => pollIntervalForStatus(q.state.data?.status)
  });
  const {
    data: stats
  } = useQuery({
    queryKey: ["jogo-stats", id],
    queryFn: async () => (await supabase.from("bolao_jogo_estatisticas").select("*").eq("jogo_id", id).maybeSingle()).data,
    refetchInterval: (q) => pollIntervalForStatus(jogo?.status),
    enabled: !!id
  });
  const {
    data: sorteio,
    isLoading: loadingSorteio
  } = useQuery({
    queryKey: ["sorteio-jogo", id],
    queryFn: async () => callFn("sorteio", void 0, "GET", 1, {
      jogo_id: id
    }),
    refetchInterval: 1e4
  });
  const realizarSorteio = useMutation({
    mutationFn: () => callFn("sorteio", {
      action: "realizar",
      jogo_id: id
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["sorteio-jogo", id]
      });
      toast.success("Sorteio deste jogo realizado!");
    },
    onError: (e) => toast.error(e.message)
  });
  const {
    data: usuarios
  } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").eq("excluido_manualmente", false).order("nome")).data ?? []
  });
  reactExports.useEffect(() => {
    if (!identidade?.nome || identidade.id || !usuarios?.length) return;
    const u = usuarios.find((x) => x.nome === identidade.nome);
    if (u) setIdentidade({
      ...identidade,
      id: u.id
    });
  }, [identidade, usuarios]);
  const {
    data: palpites,
    isLoading: loadingPalpites
  } = useQuery({
    queryKey: ["palpites", id],
    queryFn: async () => (await supabase.from("bolao_palpites_publica").select("*").eq("jogo_id", id)).data ?? [],
    refetchInterval: (q) => pollIntervalForStatus(jogo?.status)
  });
  const enviar = useMutation({
    mutationFn: () => callFn("palpite-placar", {
      nome: identidade?.nome,
      pin: identidade?.pin,
      jogo_id: id,
      gols_casa: gc,
      gols_fora: gf
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["palpites", id]
      });
      toast.success("🎯 Palpite registrado com sucesso!");
    },
    onError: (e) => toast.error(e.message)
  });
  const comPalpite = reactExports.useMemo(() => new Set((palpites ?? []).map((p) => p.usuario_id)), [palpites]);
  const prazoExpirado = reactExports.useMemo(() => {
    if (!jogo) return true;
    const dataHoraJogo = new Date(jogo.data_hora);
    const dataHoraLimite = new Date(dataHoraJogo.getTime() - 60 * 60 * 1e3);
    return dataHoraLimite <= /* @__PURE__ */ new Date();
  }, [jogo]);
  const vez = reactExports.useMemo(() => {
    const res = verificarVezNaSequencia(sorteio?.ordem ?? [], identidade?.id, comPalpite);
    if (prazoExpirado) {
      return {
        podeApostar: false,
        mensagem: "Prazo de palpite encerrado (limite de 1 hora antes do jogo)."
      };
    }
    return res;
  }, [sorteio?.ordem, identidade?.id, comPalpite, prazoExpirado]);
  const ehMinhaVezDeFato = reactExports.useMemo(() => {
    if (prazoExpirado || !identidade?.id || !sorteio?.ordem || !sorteio?.realizado) return false;
    for (const item of sorteio.ordem ?? []) {
      if (!comPalpite.has(item.usuario_id)) {
        return item.usuario_id === identidade.id;
      }
    }
    return false;
  }, [sorteio?.ordem, comPalpite, identidade?.id, prazoExpirado, sorteio?.realizado]);
  reactExports.useEffect(() => {
    if (!jogo || !identidade || !palpites) return;
    if (jogo.status !== "encerrado" && jogo.status !== "apurado") return;
    const meu = palpites.find((p) => p.usuario_id === identidade.id);
    if (meu?.acertou) confetti({
      particleCount: 200,
      spread: 80,
      origin: {
        y: 0.4
      }
    });
  }, [jogo?.status, palpites, identidade?.id]);
  if (loadingJogo) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto space-y-4 animate-in", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { lines: 1, className: "h-10 w-40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { lines: 4 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { lines: 3 })
    ] });
  }
  if (errJogo || !jogo) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jogos", className: "text-sm text-muted-foreground hover:text-foreground inline-block mb-4", children: "← Todos os jogos" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ErrorState, { message: "Não foi possível carregar este jogo.", onRetry: () => refetchJogo() })
    ] });
  }
  const future = new Date(jogo.data_hora) > /* @__PURE__ */ new Date();
  const revelado = !future;
  const acumulado = Number(jogo.acumulado || 0);
  const nP = palpites?.length ?? 0;
  const poolEstimado = nP * Number(jogo.valor_entrada) + acumulado;
  const nomeMap = new Map((usuarios ?? []).map((u) => [u.id, u.nome]));
  const ordem = sorteio?.ordem ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-3xl mx-auto space-y-4 sm:space-y-6 animate-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/jogos", className: "text-sm text-muted-foreground hover:text-foreground", children: "← Todos os jogos" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: `bg-pitch shadow-card border-2 ${ehMinhaVezDeFato ? "border-green-500 bg-green-500/5 card-minha-vez" : "border-border"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "py-6 sm:py-8 text-center px-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mb-3", children: [
        FASES_LABEL[jogo.fase],
        " • ",
        new Date(jogo.data_hora).toLocaleString("pt-BR")
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-3 sm:gap-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl sm:text-6xl", children: flag(jogo.time_casa) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-display text-sm sm:text-xl mt-2 leading-tight", children: jogo.time_casa })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-display game-hero-score text-4xl sm:text-6xl text-primary shrink-0", children: [
          jogo.placar_casa ?? "–",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: ":" }),
          " ",
          jogo.placar_fora ?? "–"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-4xl sm:text-6xl", children: flag(jogo.time_fora) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-display text-sm sm:text-xl mt-2 leading-tight", children: jogo.time_fora })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex justify-center gap-2 flex-wrap", children: [
        jogo.e_brasil && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "bg-gold-gradient text-black", children: "Brasil • R$10" }),
        !jogo.e_brasil && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", children: "R$5 por palpite" }),
        jogo.status === "ao_vivo" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-destructive animate-pulse", children: [
          "AO VIVO",
          jogo.minuto_jogo != null ? ` ${jogo.minuto_jogo}'` : ""
        ] }),
        future && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "secondary", children: [
          "Fecha em ",
          countdown(jogo.data_hora)
        ] }),
        poolEstimado > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { className: "bg-primary/20 text-primary border-primary/40", children: [
          "Pool: ",
          fmtBRL(poolEstimado)
        ] })
      ] }),
      jogo.estadio && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground mt-2", children: [
        "🏟️ ",
        jogo.estadio
      ] })
    ] }) }),
    jogo.status === "ao_vivo" && stats && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "border-destructive/30", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-lg", children: "Estatísticas ao vivo" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 text-center text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "Posse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-semibold", children: [
            stats.posse_casa ?? "—",
            "% × ",
            stats.posse_fora ?? "—",
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "Chutes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-semibold", children: [
            stats.chutes_casa,
            " × ",
            stats.chutes_fora
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "No gol" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-semibold", children: [
            stats.chutes_gol_casa,
            " × ",
            stats.chutes_gol_fora
          ] })
        ] })
      ] }) })
    ] }),
    future && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { className: "flex items-center gap-2 text-lg", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Dices, { className: "h-5 w-5 text-primary" }),
        "Sorteio deste jogo"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { className: "space-y-3", children: loadingSorteio || realizarSorteio.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center py-2", children: "Realizando sorteio..." }) : !sorteio?.realizado ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Aguardando o administrador realizar o sorteio deste jogo." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Palpites seguem esta ordem. Quem já apostou pode alterar o palpite a qualquer momento." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "space-y-1.5", children: ordem.map((o) => {
          const apostou = comPalpite.has(o.usuario_id);
          const ehEu = o.usuario_id === identidade?.id;
          const ehVez = !apostou && vez.aguardando === o.nome;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: `flex items-center justify-between p-2 rounded-lg border text-sm ${ehVez ? "border-primary bg-primary/10 font-semibold" : apostou ? "border-border bg-secondary/20 opacity-80" : "border-border"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              o.posicao === 1 ? "🥇" : o.posicao === 2 ? "🥈" : o.posicao === 3 ? "🥉" : `${o.posicao}º`,
              " ",
              o.nome,
              ehEu ? " (você)" : ""
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: apostou ? "secondary" : ehVez ? "default" : "outline", children: apostou ? "Apostou" : ehVez ? "Sua vez" : "Aguardando" })
          ] }, o.usuario_id);
        }) })
      ] }) })
    ] }),
    future && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { children: "Seu palpite" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(IdentidadePicker, { value: identidade, onChange: setIdentidade }),
        !vez.podeApostar && vez.mensagem && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200", children: vez.mensagem }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(GolInput, { label: `${flag(jogo.time_casa)} ${jogo.time_casa}`, value: gc, onChange: setGc, disabled: !vez.podeApostar }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(GolInput, { label: `${flag(jogo.time_fora)} ${jogo.time_fora}`, value: gf, onChange: setGf, disabled: !vez.podeApostar })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-display text-3xl text-muted-foreground py-1", children: [
          gc,
          " × ",
          gf
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => enviar.mutate(), disabled: !identidade?.nome || !vez.podeApostar || !sorteio?.realizado || enviar.isPending, className: "w-full btn-touch", size: "lg", children: enviar.isPending ? "Enviando..." : "Registrar palpite" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardHeader, { className: "pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(CardTitle, { children: [
        "Palpites (",
        nP,
        ")"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardContent, { children: loadingPalpites ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "skeleton h-10 rounded" }, i)) }) : nP === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground text-center py-4", children: future ? "Ninguém palpitou ainda. Seja o primeiro!" : "Nenhum palpite registrado." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "divide-y divide-border", children: palpites.map((p) => {
        const acertou = p.acertou === true;
        const nome = nomeMap.get(p.usuario_id) ?? "—";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: `flex justify-between items-center py-3 ${acertou ? "text-success font-bold" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: nome }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-display text-xl", children: [
            revelado ? p.gols_casa != null ? `${p.gols_casa} : ${p.gols_fora}` : "—" : "🔒",
            acertou && " ✓"
          ] })
        ] }, p.id);
      }) }) })
    ] })
  ] });
}
export {
  Page as component
};
