import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { callFn, getIdentidade, setIdentidade, supabase } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, UserPlus, Users, User, Shield, ChevronDown, ChevronUp } from "lucide-react";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";

export const Route = createFileRoute("/participantes")({
  head: () => ({
    meta: [
      { title: "Participantes — Bolão Copa 2026" },
      { name: "description", content: "Participantes do bolão da Copa 2026." }
    ]
  }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [minhaConta] = useState(() => getIdentidade());
  const [meuNome, setMeuNome] = useState(() => getIdentidade()?.nome ?? "");
  const [pinAtual, setPinAtual] = useState("");
  const [novoPin, setNovoPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const { data: usuarios, isLoading, isError, refetch } = useQuery({
    queryKey: ["usuarios-full"],
    queryFn: async () => callFn<any[]>("usuarios", undefined, "GET"),
  });

  const criar = useMutation({
    mutationFn: () => callFn("usuarios", { action: "create", nome: nome.trim(), pin: pin.trim() || null }),
    onSuccess: () => {
      setNome(""); setPin(""); setShowAdd(false);
      qc.invalidateQueries({ queryKey: ["usuarios-full"] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Participante adicionado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: (id: string) => callFn("usuarios", { action: "delete", id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["usuarios-full"] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Participante removido");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const atualizarConta = useMutation({
    mutationFn: () =>
      callFn<{ ok: boolean; usuario: { id: string; nome: string } }>("usuarios", {
        action: "update_self",
        nome_atual: minhaConta?.nome,
        pin_atual: pinAtual,
        novo_nome: meuNome.trim(),
        novo_pin: novoPin,
      }),
    onSuccess: (res) => {
      const atualizada = { id: res.usuario.id, nome: res.usuario.nome, pin: novoPin, tem_pin: true };
      setIdentidade(atualizada);
      setPinAtual("");
      setNovoPin("");
      setConfirmPin("");
      qc.invalidateQueries({ queryKey: ["usuarios-full"] });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast.success("Seus dados foram atualizados.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pinMismatch = novoPin.length === 4 && confirmPin.length === 4 && novoPin !== confirmPin;
  const canSaveProfile = !!minhaConta?.nome && !!meuNome.trim() && meuNome.trim() !== minhaConta?.nome;
  const canSavePin = pinAtual.length === 4 && novoPin.length === 4 && confirmPin === novoPin;

  const total = usuarios?.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-display text-2xl sm:text-3xl leading-none">Participantes</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Gerencie os participantes do bolão</p>
        </div>
      </div>

      {/* ── PERFIL ── */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border/40">
          <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
            <User className="h-4 w-4 text-primary" />
            Meu Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Profile name section */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Nome de exibição</p>
            <div className="flex gap-2">
              <Input
                value={meuNome}
                onChange={(e) => setMeuNome(e.target.value)}
                maxLength={40}
                placeholder="Seu nome"
                className="flex-1 bg-secondary/20 border-border h-9"
              />
              <Button
                size="sm"
                disabled={!canSaveProfile || atualizarConta.isPending}
                onClick={() => atualizarConta.mutate()}
                className="h-9 shrink-0"
              >
                {atualizarConta.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/60" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Alterar PIN
            </div>
            <div className="flex-1 h-px bg-border/60" />
          </div>

          {/* PIN section */}
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              O PIN inicial de todos é <span className="font-mono font-bold text-foreground">1234</span>. Troque para proteger sua conta.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">PIN atual</Label>
                <Input
                  value={pinAtual}
                  onChange={(e) => setPinAtual(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  inputMode="numeric"
                  type="password"
                  className="bg-secondary/20 border-border h-9 font-mono text-center tracking-widest"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Novo PIN</Label>
                <Input
                  value={novoPin}
                  onChange={(e) => setNovoPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  inputMode="numeric"
                  type="password"
                  className="bg-secondary/20 border-border h-9 font-mono text-center tracking-widest"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Confirmar PIN</Label>
                <Input
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="••••"
                  inputMode="numeric"
                  type="password"
                  className={`bg-secondary/20 border-border h-9 font-mono text-center tracking-widest ${pinMismatch ? "border-destructive" : ""}`}
                />
              </div>
            </div>
            {pinMismatch && (
              <p className="text-xs text-destructive font-medium">Os PINs não coincidem.</p>
            )}
            <Button
              className="w-full btn-touch h-9"
              disabled={!canSavePin || atualizarConta.isPending}
              onClick={() => atualizarConta.mutate()}
            >
              {atualizarConta.isPending ? "Salvando..." : "Atualizar PIN"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── LISTA ── */}
      <Card className="border-border">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              Cadastrados
            </CardTitle>
            <Badge variant="secondary" className="font-mono text-xs">{total}</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          {isLoading && <SkeletonCard lines={4} />}
          {isError && <ErrorState message="Erro ao carregar participantes." onRetry={() => refetch()} />}

          {!isLoading && !isError && (
            total === 0 ? (
              <div className="flex flex-col items-center py-10 gap-3 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/30 border border-border">
                  <Users className="h-6 w-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Nenhum participante. Acesse Admin para inicializar os padrão.
                </p>
              </div>
            ) : (
              <ul className="space-y-1">
                {usuarios!.map((u: any) => {
                  const isMe = u.nome === minhaConta?.nome;
                  return (
                    <li
                      key={u.id}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all ${
                        isMe
                          ? "border-primary/30 bg-primary/5"
                          : "border-border/30 hover:bg-secondary/15"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                          isMe ? "bg-primary/20 text-primary" : "bg-secondary/40 text-muted-foreground"
                        }`}>
                          {u.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold truncate ${isMe ? "text-primary" : ""}`}>
                            {u.nome} {isMe && <span className="text-[10px] font-normal opacity-70">• Você</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                            {u.tem_pin ? (
                              <span className="flex items-center gap-0.5"><Shield className="h-2.5 w-2.5" /> PIN configurado</span>
                            ) : (
                              "Sem PIN"
                            )}
                            {u.e_participante_padrao && (
                              <Badge variant="outline" className="text-[9px] py-0 px-1 h-4">Padrão</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all btn-touch"
                        onClick={() => {
                          if (confirm(`Remover ${u.nome}?`)) remover.mutate(u.id);
                        }}
                        title={`Remover ${u.nome}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )
          )}
        </CardContent>
      </Card>

      {/* ── ADICIONAR PARTICIPANTE ── */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowAdd(o => !o)}
          >
            <CardTitle className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <UserPlus className="h-4 w-4 text-primary" />
              Adicionar Participante
            </CardTitle>
            {showAdd
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />
            }
          </button>
        </CardHeader>
        {showAdd && (
          <CardContent className="space-y-3 pt-0 px-4 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Nome</Label>
                <Input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: João"
                  maxLength={40}
                  className="bg-secondary/20 border-border h-9"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">PIN (4 dígitos, opcional)</Label>
                <Input
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="1234"
                  inputMode="numeric"
                  className="bg-secondary/20 border-border h-9 font-mono tracking-widest"
                />
              </div>
            </div>
            <Button
              onClick={() => criar.mutate()}
              disabled={!nome.trim() || criar.isPending}
              className="w-full btn-touch h-9"
            >
              {criar.isPending ? "Adicionando..." : "Adicionar Participante"}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
