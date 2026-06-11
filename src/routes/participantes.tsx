import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { callFn, supabase } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, UserPlus, Users } from "lucide-react";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";

export const Route = createFileRoute("/participantes")({
  head: () => ({ meta: [{ title: "Participantes — Bolão Copa 2026" }, { name: "description", content: "Participantes do bolão da Copa 2026." }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [pin, setPin] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: usuarios, isLoading, isError, refetch } = useQuery({
    queryKey: ["usuarios-full"],
    queryFn: async () => callFn<any[]>("usuarios", undefined, "GET"),
  });

  const { data: sorteio } = useQuery({
    queryKey: ["sorteio"],
    queryFn: async () => callFn<any>("sorteio", undefined, "GET"),
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

  const total = usuarios?.length ?? 0;
  const sorteioRealizado = sorteio?.realizado ?? false;
  const ordemMap = new Map<string, number>((sorteio?.ordem ?? []).map((o: any) => [o.usuario_id, o.posicao]));

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-in">
      <div>
        <h1 className="text-display text-3xl sm:text-4xl">Participantes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          8 participantes padrão + possibilidade de adicionar mais.
        </p>
      </div>

      {/* Lista */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Cadastrados
            </CardTitle>
            <Badge variant="secondary">{total} participantes</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && <SkeletonCard lines={4} />}
          {isError && <ErrorState message="Erro ao carregar participantes." onRetry={() => refetch()} />}

          {!isLoading && !isError && (
            total === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <div className="text-3xl mb-2">👤</div>
                Nenhum participante. Vá em Admin para inicializar os participantes padrão.
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {usuarios!.map((u: any) => {
                  const pos = ordemMap.get(u.id);
                  return (
                    <li key={u.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {sorteioRealizado && pos && (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                            pos === 1 ? "bg-gold-gradient text-black" :
                            pos === 2 ? "bg-secondary text-foreground" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {pos}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-medium truncate">{u.nome}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {u.tem_pin ? "🔒 PIN" : "Sem PIN"}
                            {u.e_participante_padrao && <Badge variant="outline" className="text-xs py-0">Padrão</Badge>}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 btn-touch"
                        onClick={() => {
                          if (confirm(`Remover ${u.nome}?`)) remover.mutate(u.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )
          )}
        </CardContent>
      </Card>

      {/* Adicionar participante */}
      <Card>
        <CardHeader className="pb-3">
          <button
            className="flex items-center justify-between w-full text-left"
            onClick={() => setShowAdd(o => !o)}
          >
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Adicionar participante
            </CardTitle>
            <span className="text-muted-foreground text-sm">{showAdd ? "▲" : "▼"}</span>
          </button>
        </CardHeader>
        {showAdd && (
          <CardContent className="space-y-3 pt-0">
            <div>
              <Label>Nome</Label>
              <Input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: João"
                maxLength={40}
                className="mt-1"
              />
            </div>
            <div>
              <Label>PIN (4 dígitos, opcional)</Label>
              <Input
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="1234"
                inputMode="numeric"
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => criar.mutate()}
              disabled={!nome.trim() || criar.isPending}
              className="w-full btn-touch"
            >
              {criar.isPending ? "Adicionando..." : "Adicionar"}
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Sorteio preview */}
      {sorteioRealizado && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>🎲 Ordem do sorteio</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {(sorteio?.ordem ?? []).map((o: any) => (
                <li key={o.usuario_id} className={`flex items-center gap-3 p-2 rounded-lg border border-border sorteio-item ${
                  o.posicao === 1 ? "sorteio-posicao-1" :
                  o.posicao === 2 ? "sorteio-posicao-2" :
                  o.posicao === 3 ? "sorteio-posicao-3" : ""
                }`}>
                  <span className="text-display text-xl w-8 text-center">
                    {o.posicao === 1 ? "🥇" : o.posicao === 2 ? "🥈" : o.posicao === 3 ? "🥉" : o.posicao}
                  </span>
                  <span className="font-medium">{o.nome}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
