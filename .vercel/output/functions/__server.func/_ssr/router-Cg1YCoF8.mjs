import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent, d as useLocation } from "../_libs/tanstack__react-router.mjs";
import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { T as Toaster$1, t as toast } from "../_libs/sonner.mjs";
import { S as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { R as Root } from "../_libs/radix-ui__react-label.mjs";
import { T as Trophy, X, M as Menu, L as LogOut } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = reactExports.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const Input = reactExports.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
const Label = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Root, { ref, className: cn(labelVariants(), className), ...props }));
Label.displayName = Root.displayName;
const Card = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref,
      className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
      ...props
    }
  )
);
Card.displayName = "Card";
const CardHeader = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
const CardTitle = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref,
      className: cn("font-semibold leading-none tracking-tight", className),
      ...props
    }
  )
);
CardTitle.displayName = "CardTitle";
const CardDescription = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("text-sm text-muted-foreground", className), ...props })
);
CardDescription.displayName = "CardDescription";
const CardContent = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
const CardFooter = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";
const FN = "https://ahcpszcxmqqiofacjasz.supabase.co/functions/v1";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoY3BzemN4bXFxaW9mYWNqYXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTQxNDUsImV4cCI6MjA5MDEzMDE0NX0.Wq4fChb6tX-fDAe3sgAySv0GxOCpJsrKEFF8End_hA0";
async function callFn(name, body, method = "POST", retries = 1, query) {
  const qs = query && Object.keys(query).length ? "?" + new URLSearchParams(query).toString() : "";
  const attempt = async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15e3);
    try {
      const res = await fetch(`${FN}/${name}${qs}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          apikey: KEY,
          Authorization: `Bearer ${KEY}`
        },
        body: method === "POST" ? JSON.stringify(body ?? {}) : void 0,
        signal: ctrl.signal
      });
      return res;
    } catch (err) {
      if (err.name === "AbortError") throw new Error("Tempo esgotado. Verifique sua conexão.");
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };
  let lastError = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await attempt();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
      return data;
    } catch (err) {
      lastError = err;
      if (i < retries && err.message !== "Tempo esgotado. Verifique sua conexão.") {
        await new Promise((r) => setTimeout(r, 800 * (i + 1)));
      }
    }
  }
  throw lastError;
}
const KEY_ID = "bolao_identidade";
function getIdentidade() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(KEY_ID) || "null");
  } catch {
    return null;
  }
}
function setIdentidade(i) {
  if (typeof window === "undefined") return;
  if (i) localStorage.setItem(KEY_ID, JSON.stringify(i));
  else localStorage.removeItem(KEY_ID);
}
const fmtBRL = (v) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const FASES_LABEL = {
  grupos: "Fase de Grupos",
  oitavas: "Oitavas de Final",
  quartas: "Quartas de Final",
  semis: "Semifinais",
  terceiro: "Disputa de 3º",
  final: "Final"
};
const FLAGS = {
  // Grupo A
  USA: "🇺🇸",
  "United States": "🇺🇸",
  Panama: "🇵🇦",
  Canada: "🇨🇦",
  Honduras: "🇭🇳",
  // Grupo B
  Mexico: "🇲🇽",
  Jamaica: "🇯🇲",
  Uruguay: "🇺🇾",
  Bolivia: "🇧🇴",
  // Grupo C
  Brazil: "🇧🇷",
  Brasil: "🇧🇷",
  Argentina: "🇦🇷",
  Paraguay: "🇵🇾",
  Peru: "🇵🇪",
  // Grupo D
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Nigeria: "🇳🇬",
  Serbia: "🇷🇸",
  France: "🇫🇷",
  // Grupo E
  Germany: "🇩🇪",
  Netherlands: "🇳🇱",
  Spain: "🇪🇸",
  Portugal: "🇵🇹",
  // Grupo F
  Colombia: "🇨🇴",
  Ecuador: "🇪🇨",
  Japan: "🇯🇵",
  Australia: "🇦🇺",
  // Grupo G
  Morocco: "🇲🇦",
  Senegal: "🇸🇳",
  "South Korea": "🇰🇷",
  Belgium: "🇧🇪",
  // Grupo H
  Turkey: "🇹🇷",
  Croatia: "🇭🇷",
  Switzerland: "🇨🇭",
  Denmark: "🇩🇰",
  // Grupo I
  Italy: "🇮🇹",
  Norway: "🇳🇴",
  Poland: "🇵🇱",
  "New Zealand": "🇳🇿",
  // Grupo J
  Iran: "🇮🇷",
  "Saudi Arabia": "🇸🇦",
  "South Africa": "🇿🇦",
  Egypt: "🇪🇬",
  // Grupo K
  Algeria: "🇩🇿",
  Tunisia: "🇹🇳",
  Cameroon: "🇨🇲",
  Ghana: "🇬🇭",
  // Grupo L
  Venezuela: "🇻🇪",
  Chile: "🇨🇱",
  Iraq: "🇮🇶",
  Qatar: "🇶🇦",
  // Extras
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  Ireland: "🇮🇪",
  Ukraine: "🇺🇦",
  Austria: "🇦🇹",
  Sweden: "🇸🇪",
  "United Arab Emirates": "🇦🇪",
  "Costa Rica": "🇨🇷"
};
const flag = (nome) => nome && FLAGS[nome] || "⚽";
function countdown(target) {
  const t = new Date(target).getTime() - Date.now();
  if (t <= 0) return "Encerrado";
  const d = Math.floor(t / 864e5);
  const h = Math.floor(t % 864e5 / 36e5);
  const m = Math.floor(t % 36e5 / 6e4);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}
const appCss = "/assets/styles-CfLzn_zr.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl text-display text-primary", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold", children: "Página não encontrada" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Essa rota não existe." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90", children: "Voltar ao bolão" })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  const router2 = useRouter();
  reactExports.useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-5xl mb-4", children: "⚠️" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold", children: "Algo deu errado" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: error.message }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          router2.invalidate();
          reset();
        },
        className: "mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
        children: "Tentar novamente"
      }
    )
  ] }) });
}
const Route$a = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1a2847" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "Bolão Copa do Mundo 2026" },
      { name: "description", content: "Bolão entre amigos para a Copa do Mundo 2026 — placar exato, artilheiro e finalistas." },
      { property: "og:title", content: "Bolão Copa do Mundo 2026" },
      { property: "og:description", content: "Bolão entre amigos para a Copa do Mundo 2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "pt-BR", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { className: "font-[Inter,sans-serif]", children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
const NAV_LINKS = [
  { to: "/", label: "Início", exact: true },
  { to: "/jogos", label: "⚽ Jogos" },
  { to: "/apostas-especiais", label: "🎰 Apostas" },
  { to: "/ranking", label: "📊 Ranking" },
  { to: "/participantes", label: "👥 Participantes" },
  { to: "/sorteio", label: "🎲 Sorteio" },
  { to: "/admin", label: "⚙️ Admin" }
];
function Nav() {
  const [open, setOpen] = reactExports.useState(false);
  const location = useLocation();
  const [identidade] = reactExports.useState(() => getIdentidade());
  reactExports.useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  const linkBase = "px-3 py-2 text-sm font-medium transition-colors rounded-md";
  const linkInactive = `${linkBase} text-muted-foreground hover:text-foreground hover:bg-secondary/50`;
  const linkActive = `${linkBase} text-primary bg-primary/10 font-semibold`;
  const isActive = (to, exact = false) => exact ? location.pathname === to : location.pathname.startsWith(to);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border", style: { height: "var(--nav-height)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl flex items-center justify-between px-3 h-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 shrink-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-5 w-5 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-display text-lg leading-none", children: "Bolão Copa 2026" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "hidden md:flex items-center gap-0.5 overflow-x-auto", children: NAV_LINKS.map(({ to, label, exact }) => /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to, className: isActive(to, exact) ? linkActive : linkInactive, children: label }, to)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          id: "nav-menu-toggle",
          className: "md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors btn-touch",
          onClick: () => setOpen((o) => !o),
          "aria-label": open ? "Fechar menu" : "Abrir menu",
          "aria-expanded": open,
          children: open ? /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { className: "h-5 w-5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          className: "hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md",
          onClick: () => {
            setIdentidade(null);
            window.location.reload();
          },
          title: "Sair",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "max-w-24 truncate", children: identidade?.nome }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4" })
          ]
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { id: "nav-mobile-menu", className: `nav-mobile-menu ${open ? "open" : ""}`, "aria-hidden": !open, children: [
      NAV_LINKS.map(({ to, label, exact }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        Link,
        {
          to,
          className: `${isActive(to, exact) ? linkActive : linkInactive} block`,
          onClick: () => setOpen(false),
          children: label
        },
        to
      )),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: `${linkInactive} block text-left`,
          onClick: () => {
            setIdentidade(null);
            window.location.reload();
          },
          children: "Sair"
        }
      )
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$a.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(AuthGate, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Nav, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "mx-auto max-w-6xl px-3 sm:px-4 py-5 sm:py-8 min-h-[calc(100vh-var(--nav-height))]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { richColors: true, position: "top-center" })
  ] });
}
function AuthGate({ children }) {
  const [identidade, setIdentidadeState] = reactExports.useState(() => getIdentidade());
  const [nome, setNome] = reactExports.useState(() => getIdentidade()?.nome ?? "");
  const [pin, setPin] = reactExports.useState(() => getIdentidade()?.pin ?? "");
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    callFn("usuarios", { action: "init_defaults" }).catch(() => {
    });
  }, []);
  async function entrar() {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo || !/^\d{4}$/.test(pin)) {
      toast.error("Informe seu nome e o PIN de 4 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const res = await callFn(
        "usuarios",
        { action: "login", nome: nomeLimpo, pin },
        "POST",
        0
      );
      const id = { id: res.usuario.id, nome: res.usuario.nome, pin, tem_pin: true };
      setIdentidade(id);
      setIdentidadeState(id);
      toast.success("Entrada liberada.");
    } catch (e) {
      setIdentidade(null);
      setIdentidadeState(null);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }
  if (identidade?.nome && identidade?.pin) return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "min-h-screen flex items-center justify-center px-4 py-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "w-full max-w-sm shadow-card", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardHeader, { className: "text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-6 w-6 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardTitle, { className: "text-display text-3xl", children: "Entrar no Bolão" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CardContent, { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "login-nome", children: "Nome" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "login-nome",
            value: nome,
            onChange: (e) => setNome(e.target.value),
            placeholder: "Seu nome cadastrado",
            autoComplete: "username"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "login-pin", children: "PIN" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            id: "login-pin",
            value: pin,
            onChange: (e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4)),
            placeholder: "1234",
            inputMode: "numeric",
            type: "password",
            autoComplete: "current-password",
            onKeyDown: (e) => {
              if (e.key === "Enter") entrar();
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full btn-touch", onClick: entrar, disabled: loading, children: loading ? "Entrando..." : "Entrar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-xs text-muted-foreground", children: "PIN inicial dos cadastrados: 1234. Troque em Participantes." })
    ] })
  ] }) });
}
const $$splitComponentImporter$9 = () => import("./sorteio-D4eT74Lv.mjs");
const Route$9 = createFileRoute("/sorteio")({
  head: () => ({
    meta: [{
      title: "Sorteio por Jogo — Bolão Copa 2026"
    }, {
      name: "description",
      content: "Ordem de palpites de cada jogo do bolão."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./ranking-BlgBah12.mjs");
const Route$8 = createFileRoute("/ranking")({
  head: () => ({
    meta: [{
      title: "Ranking — Bolão Copa 2026"
    }, {
      name: "description",
      content: "Ranking geral dos participantes do bolão."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./participantes-BR5fFAWy.mjs");
const Route$7 = createFileRoute("/participantes")({
  head: () => ({
    meta: [{
      title: "Participantes — Bolão Copa 2026"
    }, {
      name: "description",
      content: "Participantes do bolão da Copa 2026."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./jogos-Bp5OrY9_.mjs");
const Route$6 = createFileRoute("/jogos")({
  head: () => ({
    meta: [{
      title: "Jogos — Bolão Copa 2026"
    }, {
      name: "description",
      content: "Todos os jogos da Copa 2026, palpite no placar exato."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./finalistas-DD3w7XPU.mjs");
const Route$5 = createFileRoute("/finalistas")({
  head: () => ({
    meta: [{
      title: "Finalistas — Bolão Copa 2026"
    }, {
      name: "description",
      content: "Aposte nos dois finalistas da Copa 2026."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./artilheiro-DSvzlwhy.mjs");
const Route$4 = createFileRoute("/artilheiro")({
  head: () => ({
    meta: [{
      title: "Artilheiro — Bolão Copa 2026"
    }, {
      name: "description",
      content: "Aposte no artilheiro da Copa 2026."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./apostas-especiais-w0R3ePIR.mjs");
const Route$3 = createFileRoute("/apostas-especiais")({
  head: () => ({
    meta: [{
      title: "Apostas Especiais — Bolão Copa 2026"
    }, {
      name: "description",
      content: "Apostas especiais do Bolão: Artilheiro, Finalistas, Campeão, Zebra e Maior Goleada."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./admin-BC4_THmm.mjs");
const Route$2 = createFileRoute("/admin")({
  head: () => ({
    meta: [{
      title: "Painel Admin — Bolão Copa 2026"
    }, {
      name: "description",
      content: "Painel administrativo do bolão."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./index-MN2AxrWc.mjs");
const Route$1 = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "Bolão Copa do Mundo 2026"
    }, {
      name: "description",
      content: "Painel principal do bolão da Copa 2026 com placar, artilheiro e finalistas."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./jogos._id-BuPLvx_X.mjs");
const Route = createFileRoute("/jogos/$id")({
  head: () => ({
    meta: [{
      title: "Palpite — Bolão Copa 2026"
    }, {
      name: "description",
      content: "Palpite no placar exato deste jogo."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SorteioRoute = Route$9.update({
  id: "/sorteio",
  path: "/sorteio",
  getParentRoute: () => Route$a
});
const RankingRoute = Route$8.update({
  id: "/ranking",
  path: "/ranking",
  getParentRoute: () => Route$a
});
const ParticipantesRoute = Route$7.update({
  id: "/participantes",
  path: "/participantes",
  getParentRoute: () => Route$a
});
const JogosRoute = Route$6.update({
  id: "/jogos",
  path: "/jogos",
  getParentRoute: () => Route$a
});
const FinalistasRoute = Route$5.update({
  id: "/finalistas",
  path: "/finalistas",
  getParentRoute: () => Route$a
});
const ArtilheiroRoute = Route$4.update({
  id: "/artilheiro",
  path: "/artilheiro",
  getParentRoute: () => Route$a
});
const ApostasEspeciaisRoute = Route$3.update({
  id: "/apostas-especiais",
  path: "/apostas-especiais",
  getParentRoute: () => Route$a
});
const AdminRoute = Route$2.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => Route$a
});
const IndexRoute = Route$1.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$a
});
const JogosIdRoute = Route.update({
  id: "/$id",
  path: "/$id",
  getParentRoute: () => JogosRoute
});
const JogosRouteChildren = {
  JogosIdRoute
};
const JogosRouteWithChildren = JogosRoute._addFileChildren(JogosRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  AdminRoute,
  ApostasEspeciaisRoute,
  ArtilheiroRoute,
  FinalistasRoute,
  JogosRoute: JogosRouteWithChildren,
  ParticipantesRoute,
  RankingRoute,
  SorteioRoute
};
const routeTree = Route$a._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Button as B,
  Card as C,
  FASES_LABEL as F,
  Input as I,
  Label as L,
  CardContent as a,
  CardHeader as b,
  CardTitle as c,
  fmtBRL as d,
  callFn as e,
  flag as f,
  getIdentidade as g,
  countdown as h,
  CardDescription as i,
  cn as j,
  router as r,
  setIdentidade as s
};
