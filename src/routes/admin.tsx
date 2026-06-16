import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { supabase, callFn, flag } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Lock,
  RefreshCw,
  Trophy,
  Users,
  ShieldAlert,
  Coins,
  Settings,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Megaphone,
  Eye,
  Link as LinkIcon,
} from "lucide-react";
import { SkeletonCard } from "@/components/SkeletonCard";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel Admin — Bolão Copa 2026" },
      { name: "description", content: "Painel administrativo do bolão." },
    ],
  }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [adminPin, setAdminPin] = useState(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("admin_pin") || "" : "",
  );
  const [typedPin, setTypedPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [nomePart, setNomePart] = useState("");
  const [pinPart, setPinPart] = useState("");
  const [artilheiro, setArtilheiro] = useState("");
  const [f1, setF1] = useState("");
  const [f2, setF2] = useState("");
  const [premioDesc, setPremioDesc] = useState("");
  const [premioLoaded, setPremioLoaded] = useState(false);

  // ====== ADICIONADOS PELO USUÁRIO ======
  const [selectedJogoId, setSelectedJogoId] = useState("");
  const [editGc, setEditGc] = useState<number | "">("");
  const [editGf, setEditGf] = useState<number | "">("");
  const [editStatus, setEditStatus] = useState("pendente");
  const [editLocked, setEditLocked] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [conviteCode, setConviteCode] = useState("");
  const [conviteLimite, setConviteLimite] = useState<number | "">("");
  const [conviteExpira, setConviteExpira] = useState("");

  // ====== QUERIES ======
  const { data: configData, isLoading: loadingConfig } = useQuery({
    queryKey: ["bolao-config"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("bolao_config")
        .select("*")
        .eq("id", 1)
        .single();
      if (error)
        return {
          exclusividade_placar: false,
          admin_pin: "123456",
          status: "ABERTO",
          ultima_sync_api: null,
          total_jogos_api: 0,
        };
      return data;
    },
  });
  const config = configData as any;

  const { data: usuarios, isLoading: loadingUsuarios } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: async () => callFn<any[]>("usuarios", undefined, "GET"),
  });

  const { data: jogosData } = useQuery({
    queryKey: ["jogos-all"],
    queryFn: async () => (await (supabase as any).from("bolao_jogos").select("*")).data ?? [],
  });
  const jogos = jogosData as any[] | undefined;

  const { data: cfgArt } = useQuery({
    queryKey: ["cfg-art"],
    queryFn: async () =>
      (await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).single()).data,
  });

  const { data: cfgFin } = useQuery({
    queryKey: ["cfg-fin"],
    queryFn: async () =>
      (await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).single()).data,
  });

  const { data: syncLogs } = useQuery({
    queryKey: ["sync-logs"],
    queryFn: async () =>
      (
        await (supabase as any)
          .from("bolao_sync_log")
          .select("*")
          .order("criado_em", { ascending: false })
          .limit(5)
      ).data ?? [],
    enabled: !!adminPin && adminPin === config?.admin_pin,
  });

  // ====== NOVAS QUERIES ======
  const { data: convites } = useQuery({
    queryKey: ["admin-convites"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("bolao_convites")
        .select("*")
        .order("criado_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!adminPin && adminPin === config?.admin_pin,
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("bolao_analytics")
        .select("tela, criado_em");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!adminPin && adminPin === config?.admin_pin,
  });

  const sortedJogos = useMemo(() => {
    return [...(jogos ?? [])].sort(
      (a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime(),
    );
  }, [jogos]);

  const analyticsSummary = useMemo(() => {
    if (!analyticsData) return [];
    const counts: Record<string, number> = {};
    for (const item of analyticsData) {
      counts[item.tela] = (counts[item.tela] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([tela, count]) => ({ tela, count }))
      .sort((a, b) => b.count - a.count);
  }, [analyticsData]);

  // Sincroniza estado de edição do jogo selecionado
  useEffect(() => {
    if (selectedJogoId && jogos) {
      const jogo = (jogos as any[]).find((j) => j.id === selectedJogoId);
      if (jogo) {
        setEditGc(
          jogo.placar_casa !== null && jogo.placar_casa !== undefined ? jogo.placar_casa : "",
        );
        setEditGf(
          jogo.placar_fora !== null && jogo.placar_fora !== undefined ? jogo.placar_fora : "",
        );
        setEditStatus(jogo.status || "pendente");
        setEditLocked(!!jogo.bloqueado_manual);
      }
    } else {
      setEditGc("");
      setEditGf("");
      setEditStatus("pendente");
      setEditLocked(false);
    }
  }, [selectedJogoId, jogos]);

  // ====== MUTATIONS ======
  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await (supabase as any).from("bolao_config").update({ status }).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bolao-config"] });
      toast.success("Status atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePin = useMutation({
    mutationFn: async (pin: string) => {
      if (!/^\d{6}$/.test(pin)) throw new Error("PIN deve ter 6 dígitos");
      const { error } = await (supabase as any)
        .from("bolao_config")
        .update({ admin_pin: pin })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: (_, pin) => {
      sessionStorage.setItem("admin_pin", pin);
      setAdminPin(pin);
      setNewPin("");
      qc.invalidateQueries({ queryKey: ["bolao-config"] });
      toast.success("PIN atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updatePremio = useMutation({
    mutationFn: async (desc: string) => {
      const { error } = await (supabase as any)
        .from("bolao_config")
        .update({ premio_descricao: desc })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bolao-config"] });
      qc.invalidateQueries({ queryKey: ["bolao-config-ranking"] });
      toast.success("Prêmio atualizado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const initDefaults = useMutation({
    mutationFn: () => callFn("usuarios", { action: "init_defaults" }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success(`${res?.criados?.length ?? 0} participantes criados.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addUsuario = useMutation({
    mutationFn: () =>
      callFn("usuarios", { action: "create", nome: nomePart.trim(), pin: pinPart.trim() || null }),
    onSuccess: () => {
      setNomePart("");
      setPinPart("");
      qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Participante adicionado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removerUsuario = useMutation({
    mutationFn: (id: string) => callFn("usuarios", { action: "delete", id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Participante removido.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sync = useMutation({
    mutationFn: () => callFn("sync-copa"),
    onSuccess: (d: any) => {
      qc.invalidateQueries();
      const j = d?.jogos?.upserts ?? d?.upserts ?? 0;
      toast.success(`Sync OK: ${j} jogos | ${d?.standings ?? 0} classificação`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apurarJogos = useMutation({
    mutationFn: () => callFn("apurar-jogo"),
    onSuccess: (d: any) => {
      qc.invalidateQueries();
      toast.success(`${d?.apurados ?? 0} jogos apurados.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apurarArt = useMutation({
    mutationFn: () => callFn("apurar-artilheiro", { artilheiro }),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Artilheiro apurado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apurarFin = useMutation({
    mutationFn: () => callFn("apurar-finalistas", { finalista1: f1, finalista2: f2 }),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Finalistas apurados!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ====== NOVAS MUTATIONS ======
  const updateJogoManual = useMutation({
    mutationFn: async (params: {
      jogoId: string;
      placarCasa: number | null;
      placarFora: number | null;
      status: string;
      bloqueadoManual: boolean;
    }) => {
      // 1. Select old game score/status
      const { data: oldJogo, error: fetchErr } = await (supabase as any)
        .from("bolao_jogos")
        .select("placar_casa, placar_fora, status")
        .eq("id", params.jogoId)
        .single();
      if (fetchErr) throw fetchErr;

      // 2. Update bolao_jogos (gols, status, bloqueado_manual, atualizado_em)
      const { error: updateErr } = await (supabase as any)
        .from("bolao_jogos")
        .update({
          placar_casa: params.placarCasa,
          placar_fora: params.placarFora,
          status: params.status,
          bloqueado_manual: params.bloqueadoManual,
          atualizado_em: new Date().toISOString(),
        })
        .eq("id", params.jogoId);
      if (updateErr) throw updateErr;

      // 3. Insert into bolao_auditoria_jogos (storing antigo vs novo, responsavel: 'Admin')
      const { error: auditErr } = await (supabase as any).from("bolao_auditoria_jogos").insert({
        jogo_id: params.jogoId,
        placar_casa_antigo: oldJogo.placar_casa,
        placar_fora_antigo: oldJogo.placar_fora,
        placar_casa_novo: params.placarCasa,
        placar_fora_novo: params.placarFora,
        status_antigo: oldJogo.status,
        status_novo: params.status,
        responsavel: "Admin",
      });
      if (auditErr) throw auditErr;

      // 4. If status is 'encerrado', calls callFn("apurar-jogo")
      if (params.status === "encerrado") {
        await callFn("apurar-jogo");
      }
    },
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Jogo atualizado com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendBroadcast = useMutation({
    mutationFn: async (mensagem: string) => {
      return callFn("broadcast-mensagem", { admin_pin: adminPin, mensagem });
    },
    onSuccess: () => {
      setBroadcastMsg("");
      toast.success("Broadcast enviado com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createConvite = useMutation({
    mutationFn: async (params: {
      codigo: string;
      limiteVagas: number | null;
      expiraEm: string | null;
    }) => {
      // Gera código caso não seja informado (padrão de 6 caracteres aleatórios)
      const generateRandomCode = () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let result = "";
        for (let i = 0; i < 6; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const code = params.codigo.trim() ? params.codigo.trim().toUpperCase() : generateRandomCode();
      const { error } = await (supabase as any).from("bolao_convites").insert({
        codigo: code,
        limite_vagas: params.limiteVagas,
        expira_em: params.expiraEm ? new Date(params.expiraEm).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setConviteCode("");
      setConviteLimite("");
      setConviteExpira("");
      qc.invalidateQueries({ queryKey: ["admin-convites"] });
      toast.success("Convite criado com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteConvite = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("bolao_convites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-convites"] });
      toast.success("Convite excluído com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getConviteUrl = (codigo: string) => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/convite?code=${codigo}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copiado para a área de transferência!");
  };

  const getFriendlyRouteName = (route: string) => {
    if (route === "/") return "Jogos (Início)";
    if (route === "/ranking") return "Ranking";
    if (route === "/finalistas") return "Escolha de Finalistas";
    if (route === "/apostas-especiais") return "Apostas Especiais (Artilheiro)";
    if (route.startsWith("/jogos/")) return "Detalhe do Jogo";
    if (route === "/mural") return "Mural de Recados";
    if (route === "/regras") return "Regras do Bolão";
    if (route === "/admin") return "Painel Administrativo";
    return route;
  };

  // ====== AUTH ======
  if (loadingConfig) return <SkeletonCard lines={6} className="max-w-md mx-auto mt-10" />;

  const isAuthed = config && adminPin === config.admin_pin;

  // Initialize premio_descricao from config once
  if (config && !premioLoaded) {
    setPremioDesc((config as any).premio_descricao ?? "");
    setPremioLoaded(true);
  }

  if (!isAuthed) {
    return (
      <div className="admin-bg fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-border bg-card/60 backdrop-blur-md shadow-card">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl font-display text-foreground">Acesso Restrito</CardTitle>
            <CardDescription className="text-muted-foreground text-xs">
              PIN de 6 dígitos para acessar o painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Visual Dot Indicators */}
            <div className="pin-dots">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <span key={idx} className={idx < typedPin.length ? "filled" : ""} />
              ))}
            </div>

            <Input
              id="admin-pin-input"
              type="password"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              className="text-center text-lg tracking-widest font-mono bg-secondary/20 border-border"
              value={typedPin}
              onChange={(e) => setTypedPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && typedPin.length === 6) {
                  if (config && typedPin === config.admin_pin) {
                    sessionStorage.setItem("admin_pin", typedPin);
                    setAdminPin(typedPin);
                    toast.success("Acesso autorizado");
                  } else toast.error("PIN incorreto");
                }
              }}
            />
            <Button
              className="w-full btn-touch font-display bg-primary text-background hover:bg-primary/90"
              disabled={typedPin.length !== 6}
              onClick={() => {
                if (config && typedPin === config.admin_pin) {
                  sessionStorage.setItem("admin_pin", typedPin);
                  setAdminPin(typedPin);
                  toast.success("Acesso autorizado");
                } else toast.error("PIN incorreto");
              }}
            >
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ====== DASHBOARD ======
  const times = Array.from(new Set((jogos ?? []).flatMap((j) => [j.time_casa, j.time_fora])))
    .filter(Boolean)
    .sort();
  const nP = usuarios?.length ?? 0;
  const jogosEncerrados = (jogos ?? []).filter(
    (j) => j.status === "encerrado" || j.status === "apurado",
  );
  const totalArrecadado =
    nP * 20 + jogosEncerrados.reduce((s, j) => s + Number(j.valor_entrada || 0) * nP, 0);
  const statusBadge =
    config?.status === "ABERTO"
      ? "success"
      : config?.status === "FECHADO"
        ? "destructive"
        : "secondary";

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl sm:text-4xl flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Painel Admin
          </h1>
          <p className="text-muted-foreground text-sm">
            Configurações, apurações e gestão do bolão.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusBadge as any} className="text-sm px-3 py-1">
            {config?.status === "ABERTO"
              ? "🔓 Aberto"
              : config?.status === "FECHADO"
                ? "🔒 Fechado"
                : "🏁 Finalizado"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              sessionStorage.removeItem("admin_pin");
              setAdminPin("");
              setTypedPin("");
              toast.info("Sessão encerrada");
            }}
            className="shrink-0 btn-touch flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* STATUS DO BOLÃO */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Controle do Bolão
            </CardTitle>
            <CardDescription>Status global e segurança</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status das Apostas</Label>
              <p className="text-xs text-muted-foreground">
                🔓 <strong>Aberto</strong> — qualquer jogo aceita palpites até o intervalo.
                <br />
                🔒 <strong>Fechado</strong> — nenhum palpite aceito em nenhum jogo.
                <br />
                🏁 <strong>Finalizado</strong> — bolão encerrado definitivamente.
              </p>
              <Select
                value={config?.status ?? "ABERTO"}
                onValueChange={(val) => updateStatus.mutate(val)}
                disabled={updateStatus.isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ABERTO">🔓 Aberto para Apostas</SelectItem>
                  <SelectItem value="FECHADO">🔒 Fechado (Consulta Pública)</SelectItem>
                  <SelectItem value="FINALIZADO">🏁 Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Alterar PIN Admin
              </Label>
              <div className="flex gap-2">
                <Input
                  id="new-admin-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Novo PIN (6 dígitos)"
                  className="font-mono text-sm"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                <Button
                  size="sm"
                  className="btn-touch shrink-0"
                  disabled={newPin.length !== 6 || updatePin.isPending}
                  onClick={() => updatePin.mutate(newPin)}
                >
                  Salvar
                </Button>
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-border">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                🏆 Prêmio do Bolão
              </Label>
              <p className="text-xs text-muted-foreground">Descrição exibida no topo do Ranking.</p>
              <div className="flex gap-2">
                <Input
                  id="premio-input"
                  placeholder="Ex: R$ 500 para o 1º lugar"
                  className="text-sm"
                  value={premioDesc}
                  onChange={(e) => setPremioDesc(e.target.value)}
                />
                <Button
                  size="sm"
                  className="btn-touch shrink-0"
                  disabled={updatePremio.isPending}
                  onClick={() => updatePremio.mutate(premioDesc)}
                >
                  Salvar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ESTATÍSTICAS DO BOLÃO */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" /> Estatísticas do Bolão
            </CardTitle>
            <CardDescription>Resumo dos jogos e palpites</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="divide-y divide-border border rounded-lg bg-secondary/10 overflow-hidden">
              <StatItem label="Participantes Ativos" value={`${nP}`} />
              <StatItem label="Total de Jogos" value={`${jogos?.length ?? 0}`} />
              <StatItem label="Jogos Encerrados" value={`${jogosEncerrados.length}`} />
              <StatItem
                label="Jogos Pendentes"
                value={`${(jogos?.length ?? 0) - jogosEncerrados.length}`}
              />
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 p-2 bg-secondary/30 rounded border border-border">
              <ShieldAlert className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>
                Bolão operando totalmente baseado em pontuação e acertos de placar/resultados.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SYNC & APURAÇÃO */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" /> Sincronização & Apuração
          </CardTitle>
          <CardDescription>Atualizar jogos e apurar resultados de placar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs p-3 rounded-lg border border-border bg-secondary/10">
            <div>
              <div className="text-muted-foreground">Última sync</div>
              <div className="font-mono font-medium">
                {config?.ultima_sync_api
                  ? new Date(config.ultima_sync_api).toLocaleString("pt-BR")
                  : "Nunca"}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Total jogos</div>
              <div className="font-mono font-semibold">{config?.total_jogos_api ?? 0}</div>
            </div>
            <div>
              <div className="text-muted-foreground">API Football</div>
              <div className="font-mono">{(config as any)?.api_football_chamadas_hoje ?? 0}/95</div>
            </div>
            <div>
              <div className="text-muted-foreground">Jogos encerrados</div>
              <div className="font-mono font-semibold">{jogosEncerrados.length}</div>
            </div>
          </div>

          {(syncLogs?.length ?? 0) > 0 && (
            <div className="text-xs space-y-1 max-h-20 overflow-y-auto">
              {syncLogs!.map((l: any) => (
                <div key={l.id} className="flex justify-between text-muted-foreground">
                  <span>
                    {l.fonte} — {l.status}
                  </span>
                  <span>{new Date(l.criado_em).toLocaleTimeString("pt-BR")}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 btn-touch flex items-center justify-center gap-2"
              disabled={sync.isPending}
              onClick={() => sync.mutate()}
            >
              <RefreshCw className={`h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
              {sync.isPending ? "Sincronizando..." : "Sincronizar Jogos"}
            </Button>
            <Button
              variant="secondary"
              className="flex-1 btn-touch flex items-center justify-center gap-2"
              disabled={apurarJogos.isPending}
              onClick={() => apurarJogos.mutate()}
            >
              <CheckCircle2 className="h-4 w-4" />
              {apurarJogos.isPending ? "Apurando..." : "Apurar Resultados"}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground p-2 bg-secondary/20 rounded border border-border">
            <strong>Apurar Resultados</strong> processa jogos com status "encerrado" que têm placar
            definido, calculando pontos e distribuindo prêmios.
          </div>
        </CardContent>
      </Card>

      {/* GERENCIAMENTO MANUAL & BROADCAST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* GERENCIAMENTO MANUAL DE JOGOS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" /> Gerenciamento Manual de Jogos
            </CardTitle>
            <CardDescription>
              Ajuste manual de placares, controle de status do jogo e bloqueio de palpites.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="select-jogo">Selecione o Jogo</Label>
              <Select value={selectedJogoId} onValueChange={setSelectedJogoId}>
                <SelectTrigger id="select-jogo" className="w-full">
                  <SelectValue placeholder="Escolha um jogo para gerenciar" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {sortedJogos.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {flag(j.time_casa)} {j.time_casa} × {flag(j.time_fora)} {j.time_fora} (
                      {j.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedJogoId && (
              <div className="space-y-4 pt-3 border-t border-border animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-gc">
                      Gols {flag(sortedJogos.find((j) => j.id === selectedJogoId)?.time_casa)}
                    </Label>
                    <Input
                      id="edit-gc"
                      type="number"
                      min={0}
                      value={editGc}
                      onChange={(e) =>
                        setEditGc(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="Gols Casa"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-gf">
                      Gols {flag(sortedJogos.find((j) => j.id === selectedJogoId)?.time_fora)}
                    </Label>
                    <Input
                      id="edit-gf"
                      type="number"
                      min={0}
                      value={editGf}
                      onChange={(e) =>
                        setEditGf(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      placeholder="Gols Fora"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-status">Status do Jogo</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                      <SelectTrigger id="edit-status" className="w-full">
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="ao_vivo">Ao Vivo</SelectItem>
                        <SelectItem value="encerrado">Encerrado</SelectItem>
                        <SelectItem value="apurado">Apurado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      id="edit-locked"
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={editLocked}
                      onChange={(e) => setEditLocked(e.target.checked)}
                    />
                    <Label htmlFor="edit-locked" className="text-sm font-medium cursor-pointer">
                      Bloquear palpites manualmente
                    </Label>
                  </div>
                </div>

                <Button
                  className="w-full btn-touch"
                  disabled={updateJogoManual.isPending}
                  onClick={() =>
                    updateJogoManual.mutate({
                      jogoId: selectedJogoId,
                      placarCasa: editGc === "" ? null : Number(editGc),
                      placarFora: editGf === "" ? null : Number(editGf),
                      status: editStatus,
                      bloqueadoManual: editLocked,
                    })
                  }
                >
                  {updateJogoManual.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DISPARAR BROADCAST */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" /> Disparar Broadcast (Mural + Push)
            </CardTitle>
            <CardDescription>
              Enviar mensagem global no mural de recados e disparar notificações push para todos os
              usuários.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="broadcast-msg">Mensagem</Label>
              <textarea
                id="broadcast-msg"
                placeholder="Ex: A rodada das oitavas de final começou! Não se esqueça de palpitar."
                className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
              />
            </div>
            <Button
              className="w-full btn-touch flex items-center justify-center gap-2"
              disabled={!broadcastMsg.trim() || sendBroadcast.isPending}
              onClick={() => sendBroadcast.mutate(broadcastMsg)}
            >
              <Megaphone className="h-4 w-4" />
              {sendBroadcast.isPending ? "Enviando..." : "Enviar Broadcast"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CONVITES POR LINK */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary" /> Convites por Link
          </CardTitle>
          <CardDescription>
            Gere links exclusivos de cadastro para novos convidados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end p-3 rounded-lg border border-border bg-secondary/20">
            <div className="space-y-1">
              <Label htmlFor="convite-code">Código Customizado</Label>
              <Input
                id="convite-code"
                placeholder="Ex: VIP2026 (opcional)"
                value={conviteCode}
                onChange={(e) => setConviteCode(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="convite-limite">Limite de Vagas</Label>
              <Input
                id="convite-limite"
                type="number"
                min={1}
                placeholder="Sem limite"
                value={conviteLimite}
                onChange={(e) =>
                  setConviteLimite(e.target.value === "" ? "" : Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="convite-expira">Expira em</Label>
              <Input
                id="convite-expira"
                type="datetime-local"
                value={conviteExpira}
                onChange={(e) => setConviteExpira(e.target.value)}
              />
            </div>
            <Button
              className="btn-touch w-full flex items-center justify-center gap-1.5"
              disabled={createConvite.isPending}
              onClick={() =>
                createConvite.mutate({
                  codigo: conviteCode,
                  limiteVagas: conviteLimite === "" ? null : Number(conviteLimite),
                  expiraEm: conviteExpira || null,
                })
              }
            >
              <Plus className="h-4 w-4" /> Gerar Link
            </Button>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-2 text-left">Código</th>
                  <th className="px-4 py-2 text-left">Link de Convite</th>
                  <th className="px-4 py-2 text-center">Vagas Utilizadas</th>
                  <th className="px-4 py-2 text-left">Expira em</th>
                  <th className="px-4 py-2 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(convites ?? []).map((c: any) => {
                  const url = getConviteUrl(c.codigo);
                  const isExpired = c.expira_em && new Date(c.expira_em) < new Date();
                  return (
                    <tr key={c.id} className="hover:bg-secondary/10">
                      <td className="px-4 py-2.5 font-bold uppercase">{c.codigo}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2 max-w-[200px] sm:max-w-xs md:max-w-sm">
                          <span className="truncate text-xs font-mono text-muted-foreground bg-secondary/35 px-1.5 py-0.5 rounded">
                            {url}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 shrink-0 text-primary hover:bg-primary/10"
                            onClick={() => copyToClipboard(url)}
                          >
                            <LinkIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <Badge
                          variant={
                            c.limite_vagas && c.vagas_usadas >= c.limite_vagas
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {c.vagas_usadas} / {c.limite_vagas ?? "∞"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        {c.expira_em ? (
                          <span
                            className={
                              isExpired ? "text-destructive font-medium" : "text-muted-foreground"
                            }
                          >
                            {new Date(c.expira_em).toLocaleString("pt-BR")}{" "}
                            {isExpired && "(Expirado)"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Nunca</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 btn-touch"
                          disabled={deleteConvite.isPending}
                          onClick={() => {
                            if (confirm(`Remover link de convite para "${c.codigo}"?`)) {
                              deleteConvite.mutate(c.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
                {(!convites || convites.length === 0) && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-muted-foreground text-sm">
                      Nenhum convite gerado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* TELEMETRIA DE VISUALIZAÇÃO */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" /> Telemetria de Visualização
          </CardTitle>
          <CardDescription>
            Telas mais acessadas pelos participantes do bolão (atualizado em tempo real).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-2 text-left">Tela</th>
                  <th className="px-4 py-2 text-left">Rota</th>
                  <th className="px-4 py-2 text-right">Visualizações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {analyticsSummary.map(({ tela, count }) => (
                  <tr key={tela} className="hover:bg-secondary/10">
                    <td className="px-4 py-2.5 font-medium">{getFriendlyRouteName(tela)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{tela}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold">{count}</td>
                  </tr>
                ))}
                {analyticsSummary.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-muted-foreground text-sm">
                      Nenhum registro de visualização.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* PARTICIPANTES */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Participantes ({nP})
          </CardTitle>
          <CardDescription>Adicionar ou remover participantes do bolão</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3 rounded-lg border border-border bg-secondary/20">
            <div className="space-y-1">
              <Label htmlFor="user-name">Nome</Label>
              <Input
                id="user-name"
                placeholder="Ex: Pedro"
                value={nomePart}
                onChange={(e) => setNomePart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="user-pin">PIN (4 dígitos)</Label>
              <Input
                id="user-pin"
                placeholder="1234"
                inputMode="numeric"
                maxLength={4}
                value={pinPart}
                onChange={(e) => setPinPart(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
            <Button
              className="btn-touch w-full flex items-center justify-center gap-1.5"
              disabled={!nomePart.trim() || addUsuario.isPending}
              onClick={() => addUsuario.mutate()}
            >
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>

          {loadingUsuarios ? (
            <SkeletonCard lines={3} />
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-2 text-left">Nome</th>
                    <th className="px-4 py-2 text-left">PIN</th>
                    <th className="px-4 py-2 text-left">Tipo</th>
                    <th className="px-4 py-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(usuarios ?? []).map((u) => (
                    <tr key={u.id} className="hover:bg-secondary/10">
                      <td className="px-4 py-2.5 font-medium">{u.nome}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {u.tem_pin ? "🔒" : "Sem PIN"}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant={u.e_participante_padrao ? "outline" : "secondary"}
                          className="scale-90"
                        >
                          {u.e_participante_padrao ? "Padrão" : "Convidado"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 btn-touch"
                          disabled={removerUsuario.isPending}
                          onClick={() => {
                            if (confirm(`Remover ${u.nome}?`)) removerUsuario.mutate(u.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {(!usuarios || usuarios.length === 0) && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-muted-foreground text-sm">
                        Nenhum participante ativo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full btn-touch text-xs"
            disabled={initDefaults.isPending}
            onClick={() => initDefaults.mutate()}
          >
            {initDefaults.isPending
              ? "Inicializando..."
              : "Inicializar Participantes Padrão (Igor, Natan, Alison, Pedro, Zé, Paulo, Vitinho, Kelvin)"}
          </Button>
        </CardContent>
      </Card>

      {/* MÓDULOS ESPECIAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ARTILHEIRO */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Artilheiro da Copa
            </CardTitle>
            <CardDescription>
              Status:{" "}
              <Badge variant="outline" className="capitalize ml-1 scale-90">
                {cfgArt?.status ?? "aberto"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cfgArt?.artilheiro_real && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-500 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  Apurado: <strong>{cfgArt.artilheiro_real}</strong>
                </span>
              </div>
            )}
            <Input
              id="artilheiro-input"
              value={artilheiro}
              onChange={(e) => setArtilheiro(e.target.value)}
              placeholder="Ex: Kylian Mbappé"
              disabled={cfgArt?.status === "apurada"}
            />
            <Button
              className="w-full btn-touch"
              disabled={!artilheiro.trim() || apurarArt.isPending || cfgArt?.status === "apurada"}
              onClick={() => {
                if (confirm(`Apurar artilheiro como "${artilheiro}"? Irreversível.`))
                  apurarArt.mutate();
              }}
            >
              {apurarArt.isPending ? "Apurando..." : "Confirmar Artilheiro"}
            </Button>
          </CardContent>
        </Card>

        {/* FINALISTAS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Finalistas da Copa
            </CardTitle>
            <CardDescription>
              Status:{" "}
              <Badge variant="outline" className="capitalize ml-1 scale-90">
                {cfgFin?.status ?? "aberto"}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cfgFin?.finalista1_real && cfgFin?.finalista2_real && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-500">
                <CheckCircle2 className="inline h-4 w-4 mr-1" />
                {flag(cfgFin.finalista1_real)} <strong>{cfgFin.finalista1_real}</strong> ×{" "}
                {flag(cfgFin.finalista2_real)} <strong>{cfgFin.finalista2_real}</strong>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Finalista 1</Label>
                <Select value={f1} onValueChange={setF1} disabled={cfgFin?.status === "apurada"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {times.map((t) => (
                      <SelectItem key={t} value={t}>
                        {flag(t)} {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Finalista 2</Label>
                <Select value={f2} onValueChange={setF2} disabled={cfgFin?.status === "apurada"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {times
                      .filter((t) => t !== f1)
                      .map((t) => (
                        <SelectItem key={t} value={t}>
                          {flag(t)} {t}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full btn-touch"
              disabled={!f1 || !f2 || apurarFin.isPending || cfgFin?.status === "apurada"}
              onClick={() => {
                if (confirm(`Confirmar finalistas "${f1}" e "${f2}"? Irreversível.`))
                  apurarFin.mutate();
              }}
            >
              {apurarFin.isPending ? "Apurando..." : "Confirmar Finalistas"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center px-4 py-3 text-sm ${highlight ? "bg-primary/10 border-t border-primary/20" : ""}`}
    >
      <span className={highlight ? "font-bold text-foreground" : "text-muted-foreground"}>
        {label}
      </span>
      <span
        className={`font-mono ${highlight ? "font-bold text-primary text-base" : "font-semibold text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}
