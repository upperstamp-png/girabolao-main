import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase, callFn, fmtBRL, flag } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Lock, RefreshCw, Trophy, Users, ShieldAlert, Coins, Settings, Dices, LogOut, Plus, Trash2 } from "lucide-react";
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
  const [adminPin, setAdminPin] = useState(() => typeof window !== "undefined" ? sessionStorage.getItem("admin_pin") || "" : "");
  const [typedPin, setTypedPin] = useState("");
  const [newPin, setNewPin] = useState("");

  const [nomePart, setNomePart] = useState("");
  const [pinPart, setPinPart] = useState("");

  const [artilheiro, setArtilheiro] = useState("");
  const [f1, setF1] = useState("");
  const [f2, setF2] = useState("");

  // ====== QUERIES ======
  const { data: config, isLoading: loadingConfig } = useQuery({
    queryKey: ["bolao-config"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.from("bolao_config").select("*").eq("id", 1).single();
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
      } catch (err: any) {
        console.warn("Error fetching bolao_config, using defaults:", err.message);
        return {
          exclusividade_placar: true,
          admin_pin: "123456",
          sorteio_realizado: false,
          ultima_sync_api: null,
          total_jogos_api: 0
        };
      }
    },
  });

  const { data: usuarios, isLoading: loadingUsuarios } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: async () => callFn<any[]>("usuarios", undefined, "GET"),
  });

  const { data: jogos } = useQuery({
    queryKey: ["jogos-all"],
    queryFn: async () => (await supabase.from("bolao_jogos").select("*")).data ?? [],
  });

  const { data: cfgArt } = useQuery({
    queryKey: ["cfg-art"],
    queryFn: async () => (await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).single()).data,
  });

  const { data: cfgFin } = useQuery({
    queryKey: ["cfg-fin"],
    queryFn: async () => (await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).single()).data,
  });

  const { data: sorteio, refetch: refetchSorteio } = useQuery({
    queryKey: ["sorteio-admin"],
    queryFn: async () => callFn<any>("sorteio", undefined, "GET"),
  });

  // ====== MUTATIONS ======
  const updateExclusividade = useMutation({
    mutationFn: async (exclusividade: boolean) => {
      const { error } = await supabase
        .from("bolao_config")
        .update({ exclusividade_placar: exclusividade })
        .eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bolao-config"] });
      toast.success("Regra de exclusividade de placar atualizada.");
    },
    onError: (e: Error) => toast.error("Erro ao atualizar exclusividade: " + e.message),
  });

  const updatePin = useMutation({
    mutationFn: async (pin: string) => {
      if (!/^\d{6}$/.test(pin)) throw new Error("O PIN deve ter exatamente 6 dígitos");
      const { error } = await supabase
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
      toast.success("PIN de administrador atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const initDefaults = useMutation({
    mutationFn: () => callFn("usuarios", { action: "init_defaults" }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success(`Inicializado! ${res?.criados?.length ?? 0} novos participantes criados.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const realizarSorteio = useMutation({
    mutationFn: () => callFn("sorteio", { action: "realizar" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sorteio-admin"] });
      qc.invalidateQueries({ queryKey: ["sorteio-publico"] });
      qc.invalidateQueries({ queryKey: ["sorteio"] });
      toast.success("Sorteio de ordem realizado com sucesso!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetarSorteio = useMutation({
    mutationFn: () => callFn("sorteio", { action: "resetar", admin_pin: adminPin }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sorteio-admin"] });
      qc.invalidateQueries({ queryKey: ["sorteio-publico"] });
      qc.invalidateQueries({ queryKey: ["sorteio"] });
      toast.success("Sorteio redefinido. Nova ordem pode ser sorteada.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addUsuario = useMutation({
    mutationFn: () => callFn("usuarios", { action: "create", nome: nomePart.trim(), pin: pinPart.trim() || null }),
    onSuccess: () => {
      setNomePart(""); setPinPart("");
      qc.invalidateQueries({ queryKey: ["admin-usuarios"] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Participante adicionado com sucesso.");
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
      toast.success(`${d?.upserts ?? 0} jogos sincronizados.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apurarJogos = useMutation({
    mutationFn: () => callFn("apurar-jogo"),
    onSuccess: (d: any) => {
      qc.invalidateQueries();
      toast.success(`${d?.apurados ?? 0} jogos encerrados apurados.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apurarArt = useMutation({
    mutationFn: () => callFn("apurar-artilheiro", { artilheiro }),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Artilheiro oficial apurado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const apurarFin = useMutation({
    mutationFn: () => callFn("apurar-finalistas", { finalista1: f1, finalista2: f2 }),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success("Finalistas oficiais apurados!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ====== AUTHENTICATION SCREEN ======
  if (loadingConfig) {
    return <SkeletonCard lines={6} className="max-w-md mx-auto mt-10" />;
  }

  const isAuthed = config && adminPin === config.admin_pin;

  if (!isAuthed) {
    return (
      <div className="max-w-md mx-auto mt-10 p-4">
        <Card className="border-border">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Acesso Restrito</CardTitle>
            <CardDescription>
              Digite o PIN de 6 dígitos para acessar o painel administrativo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-pin-input">PIN do Administrador</Label>
              <Input
                id="admin-pin-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="••••••"
                className="text-center text-lg tracking-widest font-mono"
                value={typedPin}
                onChange={e => setTypedPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={e => {
                  if (e.key === "Enter" && typedPin.length === 6) {
                    if (config && typedPin === config.admin_pin) {
                      sessionStorage.setItem("admin_pin", typedPin);
                      setAdminPin(typedPin);
                      toast.success("Acesso autorizado");
                    } else {
                      toast.error("PIN incorreto");
                    }
                  }
                }}
              />
            </div>
            <Button
              className="w-full btn-touch"
              disabled={typedPin.length !== 6}
              onClick={() => {
                if (config && typedPin === config.admin_pin) {
                  sessionStorage.setItem("admin_pin", typedPin);
                  setAdminPin(typedPin);
                  toast.success("Acesso autorizado");
                } else {
                  toast.error("PIN incorreto");
                }
              }}
            >
              Entrar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ====== VARIABLES FOR DASHBOARD ======
  const times = Array.from(new Set((jogos ?? []).flatMap(j => [j.time_casa, j.time_fora]))).filter(Boolean).sort();
  const nP = usuarios?.length ?? 0;
  const totalArrecadado =
    nP * 10 + nP * 10 +
    (jogos ?? []).filter(j => j.status === "encerrado" || j.status === "apurado")
      .reduce((s, j) => s + Number(j.valor_entrada || 0) * nP, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl sm:text-4xl flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Painel Admin
          </h1>
          <p className="text-muted-foreground text-sm">
            Configurações globais, sorteio de ordem e apurações oficiais.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            sessionStorage.removeItem("admin_pin");
            setAdminPin("");
            setTypedPin("");
            toast.info("Sessão encerrada");
          }}
          className="shrink-0 btn-touch flex items-center gap-2 self-start sm:self-center"
        >
          <LogOut className="h-4 w-4" />
          Sair do Admin
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD: CONFIGURAÇÕES */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Configurações Gerais
              </CardTitle>
              <CardDescription>
                Regras do bolão e segurança
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20">
                <div className="space-y-0.5 pr-2">
                  <Label className="text-sm font-medium">Exclusividade de Placar</Label>
                  <p className="text-xs text-muted-foreground">
                    Impede dois participantes de palpitarem o mesmo placar no mesmo jogo.
                  </p>
                </div>
                <Switch
                  checked={config?.exclusividade_placar ?? true}
                  onCheckedChange={(checked) => updateExclusividade.mutate(checked)}
                  disabled={updateExclusividade.isPending}
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Label htmlFor="new-admin-pin" className="text-xs font-semibold uppercase text-muted-foreground">
                  Alterar PIN do Administrador
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
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
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
            </CardContent>
          </div>
          <CardContent className="pt-0">
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 space-y-2">
              <div className="text-xs font-semibold text-primary uppercase">Participantes Padrão</div>
              <p className="text-xs text-muted-foreground">
                Caso os 8 participantes fixos (Igor, Natan, Alison, Pedro, Zé, Paulo, Vitinho, Kelvin) não tenham sido criados automaticamente.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full btn-touch text-xs"
                disabled={initDefaults.isPending}
                onClick={() => initDefaults.mutate()}
              >
                {initDefaults.isPending ? "Inicializando..." : "Inicializar 8 Participantes Padrão"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CARD: FINANÇAS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" />
              Resumo Financeiro
            </CardTitle>
            <CardDescription>Arrecadação e prêmios acumulados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="divide-y divide-border border rounded-lg bg-secondary/10 overflow-hidden">
              <StatItem label="Participantes Ativos" value={`${nP} participantes`} />
              <StatItem label="Pool Artilheiro" value={fmtBRL(nP * 10 + Number(cfgArt?.acumulado_anterior || 0))} />
              <StatItem label="Pool Finalistas" value={fmtBRL(nP * 10 + Number(cfgFin?.acumulado_anterior || 0))} />
              <StatItem label="Arrecadado em placar (Jogos encerrados)" value={fmtBRL(totalArrecadado - nP * 20)} />
              <StatItem
                label="Total Geral Arrecadado"
                value={fmtBRL(totalArrecadado)}
                highlight
              />
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5 p-2 bg-secondary/30 rounded border border-border">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <span>Custo de R$10 por módulo (Artilheiro, Finalistas) + R$1 por placar palpitado.</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD: SORTEIO */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Dices className="h-5 w-5 text-primary" />
                    Sorteio de Ordem
                  </CardTitle>
                  <CardDescription>Ordem de prioridade para os palpites</CardDescription>
                </div>
                <Badge variant={sorteio?.realizado ? "success" : "secondary"}>
                  {sorteio?.realizado ? "Realizado" : "Pendente"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sorteio?.realizado ? (
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 bg-secondary/5 divide-y divide-border">
                  {(sorteio.ordem ?? []).map((o: any) => (
                    <div key={o.usuario_id} className="flex items-center justify-between py-1.5 text-sm px-2">
                      <span className="font-semibold text-muted-foreground w-6">{o.posicao}º</span>
                      <span className="font-medium flex-1">{o.nome}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
                  Nenhum sorteio realizado ainda. Clique abaixo para sortear os {nP} participantes ativos de forma randômica.
                </div>
              )}
            </CardContent>
          </div>
          <CardContent className="pt-0 flex flex-col sm:flex-row gap-2">
            {!sorteio?.realizado ? (
              <Button
                className="w-full btn-touch flex items-center justify-center gap-2"
                disabled={realizarSorteio.isPending || nP === 0}
                onClick={() => realizarSorteio.mutate()}
              >
                <Dices className="h-4 w-4" />
                {realizarSorteio.isPending ? "Sorteando..." : "Realizar Sorteio"}
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="w-full btn-touch flex items-center justify-center gap-2"
                disabled={resetarSorteio.isPending}
                onClick={() => {
                  if (confirm("ATENÇÃO: Isso irá apagar a ordem sorteada e redefinir o status do sorteio. Deseja continuar?")) {
                    resetarSorteio.mutate();
                  }
                }}
              >
                <RefreshCw className="h-4 w-4" />
                {resetarSorteio.isPending ? "Redefinindo..." : "Redefinir / Limpar Sorteio"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* CARD: SINCRONIZAÇÃO */}
        <Card className="flex flex-col justify-between">
          <div>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Sincronização & Apuração
              </CardTitle>
              <CardDescription>Dados do campeonato e encerramentos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg border border-border bg-secondary/10 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última sincronização:</span>
                  <span className="font-mono">{config?.ultima_sync_api ? new Date(config.ultima_sync_api).toLocaleString("pt-BR") : "Nunca"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de jogos mapeados:</span>
                  <span className="font-mono font-semibold">{config?.total_jogos_api ?? 0} jogos</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p><strong>Apurar jogos:</strong> Processa os jogos com status &quot;encerrado&quot; que possuem placar, distribuindo os prêmios ou acumulando os valores para a rodada seguinte.</p>
              </div>
            </CardContent>
          </div>
          <CardContent className="pt-0 flex flex-col sm:flex-row gap-2">
            <Button
              className="flex-1 btn-touch flex items-center justify-center gap-2"
              disabled={sync.isPending}
              onClick={() => sync.mutate()}
            >
              <RefreshCw className={`h-4 w-4 ${sync.isPending ? "animate-spin" : ""}`} />
              Sincronizar Jogos
            </Button>
            <Button
              variant="secondary"
              className="flex-1 btn-touch flex items-center justify-center gap-2"
              disabled={apurarJogos.isPending}
              onClick={() => apurarJogos.mutate()}
            >
              ⚖️ Apurar Jogos
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* CARD: GERENCIAR PARTICIPANTES */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gerenciar Participantes ({nP}/20)
          </CardTitle>
          <CardDescription>Cadastre novos participantes ou remova (soft-delete)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Adicionar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end p-3 rounded-lg border border-border bg-secondary/20">
            <div className="space-y-1">
              <Label htmlFor="user-name">Nome</Label>
              <Input
                id="user-name"
                placeholder="Ex: Pedro"
                value={nomePart}
                onChange={e => setNomePart(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="user-pin">PIN (4 dígitos, opcional)</Label>
              <Input
                id="user-pin"
                placeholder="Ex: 9876"
                inputMode="numeric"
                maxLength={4}
                value={pinPart}
                onChange={e => setPinPart(e.target.value.replace(/\D/g, "").slice(0, 4))}
              />
            </div>
            <Button
              className="btn-touch w-full flex items-center justify-center gap-1.5"
              disabled={!nomePart.trim() || addUsuario.isPending}
              onClick={() => addUsuario.mutate()}
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          {/* Listagem */}
          {loadingUsuarios ? (
            <SkeletonCard lines={3} />
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-2">Nome</th>
                    <th className="px-4 py-2">PIN</th>
                    <th className="px-4 py-2">Tipo</th>
                    <th className="px-4 py-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(usuarios ?? []).map((u) => (
                    <tr key={u.id} className="hover:bg-secondary/10">
                      <td className="px-4 py-2.5 font-medium">{u.nome}</td>
                      <td className="px-4 py-2.5 font-mono text-xs">{u.tem_pin ? "🔒 Cadastrado" : "Sem PIN"}</td>
                      <td className="px-4 py-2.5">
                        {u.e_participante_padrao ? (
                          <Badge variant="outline" className="scale-90">Padrão</Badge>
                        ) : (
                          <Badge variant="secondary" className="scale-90">Convidado</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 btn-touch"
                          disabled={removerUsuario.isPending}
                          onClick={() => {
                            if (confirm(`Remover participante ${u.nome}?`)) {
                              removerUsuario.mutate(u.id);
                            }
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
                        Nenhum participante ativo cadastrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* APURAÇÃO MÓDULOS ESPECIAIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD: APURAR ARTILHEIRO */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              ⚽ Apurar Artilheiro da Copa
            </CardTitle>
            <CardDescription>
              Status atual do módulo: <Badge variant="outline" className="capitalize ml-1 scale-90">{cfgArt?.status ?? "fechado"}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cfgArt?.artilheiro_real && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-500 flex items-center gap-2">
                <span>🏆 Artilheiro Apurado: <strong>{cfgArt.artilheiro_real}</strong></span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="artilheiro-input">Nome Oficial do Artilheiro</Label>
              <Input
                id="artilheiro-input"
                value={artilheiro}
                onChange={e => setArtilheiro(e.target.value)}
                placeholder="Ex: Kylian Mbappé"
                disabled={cfgArt?.status === "apurada"}
              />
            </div>
            <Button
              className="w-full btn-touch"
              disabled={!artilheiro.trim() || apurarArt.isPending || cfgArt?.status === "apurada"}
              onClick={() => {
                if (confirm(`Apurar artilheiro como "${artilheiro}"? Esta ação não pode ser desfeita.`)) {
                  apurarArt.mutate();
                }
              }}
            >
              {apurarArt.isPending ? "Apurando..." : "Apurar Artilheiro"}
            </Button>
          </CardContent>
        </Card>

        {/* CARD: APURAR FINALISTAS */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              🏆 Apurar Dois Finalistas
            </CardTitle>
            <CardDescription>
              Status atual do módulo: <Badge variant="outline" className="capitalize ml-1 scale-90">{cfgFin?.status ?? "fechado"}</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cfgFin?.finalista1_real && cfgFin?.finalista2_real && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-500">
                <span>🏆 Finalistas Apurados: <strong>{flag(cfgFin.finalista1_real)} {cfgFin.finalista1_real}</strong> e <strong>{flag(cfgFin.finalista2_real)} {cfgFin.finalista2_real}</strong></span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="f1-select">Finalista 1</Label>
                <Select value={f1} onValueChange={setF1} disabled={cfgFin?.status === "apurada"}>
                  <SelectTrigger id="f1-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {times.map(t => <SelectItem key={t} value={t}>{flag(t)} {t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="f2-select">Finalista 2</Label>
                <Select value={f2} onValueChange={setF2} disabled={cfgFin?.status === "apurada"}>
                  <SelectTrigger id="f2-select"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {times.filter(t => t !== f1).map(t => <SelectItem key={t} value={t}>{flag(t)} {t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full btn-touch"
              disabled={!f1 || !f2 || apurarFin.isPending || cfgFin?.status === "apurada"}
              onClick={() => {
                if (confirm(`Confirmar finalistas como "${f1}" e "${f2}"? Esta ação não pode ser desfeita.`)) {
                  apurarFin.mutate();
                }
              }}
            >
              {apurarFin.isPending ? "Apurando..." : "Apurar Finalistas"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatItem({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex justify-between items-center px-4 py-3 text-sm ${highlight ? "bg-primary/10 border-t border-primary/20" : ""}`}>
      <span className={highlight ? "font-bold text-foreground" : "text-muted-foreground"}>{label}</span>
      <span className={`font-mono ${highlight ? "font-bold text-primary text-base" : "font-semibold text-foreground"}`}>{value}</span>
    </div>
  );
}
