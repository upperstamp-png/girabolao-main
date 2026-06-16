import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase, callFn, setIdentidade } from "@/lib/bolao";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trophy, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { SkeletonCard } from "@/components/SkeletonCard";

export const Route = createFileRoute("/convite")({
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code : undefined,
  }),
  component: ConvitePage,
});

function ConvitePage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/convite" });
  const code = search.code || "";

  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    data: convite,
    isLoading: loadingConvite,
    isError,
  } = useQuery({
    queryKey: ["convite", code],
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await supabase
        .from("bolao_convites")
        .select("*")
        .eq("codigo", code.trim().toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

  const cadastrar = useMutation({
    mutationFn: async () => {
      const nomeClean = nome.trim();
      if (!nomeClean || !/^\d{4}$/.test(pin)) {
        throw new Error("Informe seu nome e um PIN de 4 dígitos.");
      }

      setLoading(true);
      try {
        // 1. Criar o participante
        const res = await callFn<{ id: string; nome: string }>("usuarios", {
          action: "create",
          nome: nomeClean,
          pin,
        });

        // 2. Incrementar vagas_usadas no convite
        if (convite) {
          await supabase
            .from("bolao_convites")
            .update({ vagas_usadas: convite.vagas_usadas + 1 })
            .eq("id", convite.id);
        }

        // 3. Salvar identidade e direcionar
        const identity = { id: res.id, nome: res.nome, pin, tem_pin: true };
        setIdentidade(identity);
        toast.success(`Cadastro realizado! Bem-vindo, ${res.nome}! 🏆`);
        navigate({ to: "/" });
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    },
  });

  if (loadingConvite) {
    return (
      <div className="max-w-sm mx-auto mt-12">
        <SkeletonCard lines={5} />
      </div>
    );
  }

  const isExpired = convite?.expira_em && new Date(convite.expira_em) < new Date();
  const isFull = convite?.limite_vagas != null && convite.vagas_usadas >= convite.limite_vagas;
  const isValid = convite && !isExpired && !isFull;

  if (!code || isError || !convite || isExpired || isFull) {
    let msgErro = "Código de convite inválido ou ausente.";
    if (isExpired) msgErro = "Este link de convite expirou.";
    if (isFull) msgErro = "O limite de vagas para este convite foi atingido.";

    return (
      <main className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="w-full max-w-sm border-destructive/35 bg-destructive/5 text-center">
          <CardHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle className="text-xl text-destructive font-display">
              Convite Inválido
            </CardTitle>
            <CardDescription className="text-xs">{msgErro}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full btn-touch" onClick={() => navigate({ to: "/" })}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-[60vh] flex items-center justify-center p-4 animate-in">
      <Card className="w-full max-w-sm shadow-card border-primary/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-display text-2xl">Cadastro Simplificado</CardTitle>
          <CardDescription className="text-xs">
            Você foi convidado! Digite seu nome e crie um PIN de acesso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-nome">Seu Nome completo</Label>
            <Input
              id="reg-nome"
              placeholder="Ex: Carlos Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-pin">PIN de 4 dígitos (senha de acesso)</Label>
            <Input
              id="reg-pin"
              placeholder="Ex: 5678"
              inputMode="numeric"
              maxLength={4}
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            />
          </div>
          <Button
            className="w-full btn-touch"
            disabled={!nome.trim() || pin.length !== 4 || loading}
            onClick={() => cadastrar.mutate()}
          >
            {loading ? "Cadastrando..." : "Confirmar Cadastro & Entrar"}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground">
            🔒 O PIN serve para garantir que outros participantes não alterem seus palpites.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
