import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase, callFn, fmtBRL, countdown } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { IdentidadePicker, type Identidade } from "@/components/IdentidadePicker";

export const Route = createFileRoute("/artilheiro")({
  head: () => ({ meta: [{ title: "Artilheiro — Bolão Copa 2026" }, { name: "description", content: "Aposte no artilheiro da Copa 2026." }] }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [identidade, setIdentidade] = useState<Identidade | null>(null);
  const [jogador, setJogador] = useState("");

  const { data: cfg } = useQuery({
    queryKey: ["cfg-art"],
    queryFn: async () => (await supabase.from("bolao_config_artilheiro").select("*").eq("id", 1).single()).data,
  });
  const { data: usuarios } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome").order("nome")).data ?? [],
  });
  const { data: apostas } = useQuery({
    queryKey: ["apostas-art"],
    queryFn: async () => (await supabase.from("bolao_apostas_artilheiro_publica").select("*")).data ?? [],
  });

  const enviar = useMutation({
    mutationFn: () => callFn("aposta-artilheiro", { nome: identidade?.nome, pin: identidade?.pin, jogador }),
    onSuccess: () => { setJogador(""); qc.invalidateQueries({ queryKey: ["apostas-art"] }); toast.success("Aposta registrada!"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const nP = usuarios?.length ?? 0;
  const pool = nP * 10 + Number(cfg?.acumulado_anterior || 0);
  const nomeMap = new Map((usuarios ?? []).map(u => [u.id, u.nome]));
  const aberta = cfg?.status === "aberta";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-display text-4xl">⚽ Artilheiro da Copa</h1>
        <p className="text-muted-foreground">R$10 por participante. Aposte antes do primeiro jogo da Copa.</p>
      </div>

      <Card className="bg-pitch">
        <CardContent className="py-6 text-center">
          <div className="text-display text-5xl text-primary">{fmtBRL(pool)}</div>
          <div className="mt-2 flex justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">{cfg?.status}</Badge>
            {aberta && cfg?.prazo_fim && <Badge>Fecha em {countdown(cfg.prazo_fim)}</Badge>}
            {cfg?.artilheiro_real && <Badge className="bg-gold-gradient text-black">🏆 {cfg.artilheiro_real}</Badge>}
          </div>
        </CardContent>
      </Card>

      {aberta && (
        <Card>
          <CardHeader><CardTitle>Seu palpite de artilheiro</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <IdentidadePicker value={identidade} onChange={setIdentidade} />
            <div>
              <Label>Nome do jogador</Label>
              <Input value={jogador} onChange={e => setJogador(e.target.value)} placeholder="Ex: Vinícius Jr." maxLength={80} />
            </div>
            <Button onClick={() => enviar.mutate()} disabled={!identidade?.nome || !jogador.trim() || enviar.isPending} className="w-full">
              Registrar aposta
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Apostas ({apostas?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {(apostas?.length ?? 0) === 0 ? <p className="text-sm text-muted-foreground">Ninguém apostou ainda.</p> : (
            <ul className="divide-y divide-border">
              {apostas!.map((a: any) => (
                <li key={a.id} className={`flex justify-between py-2 ${a.acertou ? "text-success font-bold" : ""}`}>
                  <span>{nomeMap.get(a.usuario_id) ?? "—"}</span>
                  <span>{a.revelado ? a.jogador_apostado : "🔒 oculto até o fim da Copa"}{a.acertou && " ✓"}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
