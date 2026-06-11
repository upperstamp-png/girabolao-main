import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts, useLocation,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Menu, X, Trophy, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { callFn, getIdentidade, setIdentidade, type Identidade } from "@/lib/bolao";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl text-display text-primary">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">Essa rota não existe.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Voltar ao bolão
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1a2847" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { title: "Bolão Copa do Mundo 2026" },
      { name: "description", content: "Bolão entre amigos para a Copa do Mundo 2026 — placar exato, artilheiro e finalistas." },
      { property: "og:title", content: "Bolão Copa do Mundo 2026" },
      { property: "og:description", content: "Bolão entre amigos para a Copa do Mundo 2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head><HeadContent /></head>
      <body className="font-[Inter,sans-serif]">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const NAV_LINKS = [
  { to: "/", label: "Início", exact: true },
  { to: "/jogos", label: "⚽ Jogos" },
  { to: "/artilheiro", label: "🎯 Artilheiro" },
  { to: "/finalistas", label: "🏆 Finalistas" },
  { to: "/ranking", label: "📊 Ranking" },
  { to: "/participantes", label: "👥 Participantes" },
  { to: "/sorteio", label: "🎲 Sorteio" },
  { to: "/admin", label: "⚙️ Admin" },
] as const;

function Nav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const [identidade] = useState<Identidade | null>(() => getIdentidade());

  // Fechar menu ao mudar de rota
  useEffect(() => { setOpen(false); }, [location.pathname]);

  const linkBase = "px-3 py-2 text-sm font-medium transition-colors rounded-md";
  const linkInactive = `${linkBase} text-muted-foreground hover:text-foreground hover:bg-secondary/50`;
  const linkActive = `${linkBase} text-primary bg-primary/10 font-semibold`;

  const isActive = (to: string, exact = false) =>
    exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <>
      <header className="sticky top-0 z-30 backdrop-blur-md bg-background/80 border-b border-border" style={{ height: "var(--nav-height)" }}>
        <div className="mx-auto max-w-6xl flex items-center justify-between px-3 h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <Trophy className="h-5 w-5 text-primary" />
            <span className="text-display text-lg leading-none">Bolão Copa 2026</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 overflow-x-auto">
            {NAV_LINKS.map(({ to, label, exact }) => (
              <Link key={to} to={to} className={isActive(to, exact) ? linkActive : linkInactive}>
                {label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburguer */}
          <button
            id="nav-menu-toggle"
            className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors btn-touch"
            onClick={() => setOpen(o => !o)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            className="hidden md:flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md"
            onClick={() => {
              setIdentidade(null);
              window.location.reload();
            }}
            title="Sair"
          >
            <span className="max-w-24 truncate">{identidade?.nome}</span>
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile dropdown menu */}
      <div id="nav-mobile-menu" className={`nav-mobile-menu ${open ? "open" : ""}`} aria-hidden={!open}>
        {NAV_LINKS.map(({ to, label, exact }) => (
          <Link
            key={to}
            to={to}
            className={`${isActive(to, exact) ? linkActive : linkInactive} block`}
            onClick={() => setOpen(false)}
          >
            {label}
          </Link>
        ))}
        <button
          className={`${linkInactive} block text-left`}
          onClick={() => {
            setIdentidade(null);
            window.location.reload();
          }}
        >
          Sair
        </button>
      </div>
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate>
        <Nav />
        <main className="mx-auto max-w-6xl px-3 sm:px-4 py-5 sm:py-8 min-h-[calc(100vh-var(--nav-height))]">
          <Outlet />
        </main>
      </AuthGate>
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const [identidade, setIdentidadeState] = useState<Identidade | null>(() => getIdentidade());
  const [nome, setNome] = useState(() => getIdentidade()?.nome ?? "");
  const [pin, setPin] = useState(() => getIdentidade()?.pin ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    callFn("usuarios", { action: "init_defaults" }).catch(() => {});
  }, []);

  async function entrar() {
    const nomeLimpo = nome.trim();
    if (!nomeLimpo || !/^\d{4}$/.test(pin)) {
      toast.error("Informe seu nome e o PIN de 4 dígitos.");
      return;
    }

    setLoading(true);
    try {
      const res = await callFn<{ ok: boolean; usuario: { id: string; nome: string } }>(
        "usuarios",
        { action: "login", nome: nomeLimpo, pin },
        "POST",
        0,
      );
      const id = { id: res.usuario.id, nome: res.usuario.nome, pin, tem_pin: true };
      setIdentidade(id);
      setIdentidadeState(id);
      toast.success("Entrada liberada.");
    } catch (e) {
      setIdentidade(null);
      setIdentidadeState(null);
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (identidade?.nome && identidade?.pin) return <>{children}</>;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-sm shadow-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-display text-3xl">Entrar no Bolão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-nome">Nome</Label>
            <Input
              id="login-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome cadastrado"
              autoComplete="username"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-pin">PIN</Label>
            <Input
              id="login-pin"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="1234"
              inputMode="numeric"
              type="password"
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") entrar();
              }}
            />
          </div>
          <Button className="w-full btn-touch" onClick={entrar} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            PIN inicial dos cadastrados: 1234. Troque em Participantes.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
