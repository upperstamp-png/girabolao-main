import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase, callFn, flag, countdown } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { IdentidadePicker, type Identidade } from "@/components/IdentidadePicker";

export const Route = createFileRoute("/finalistas")({
  head: () => ({
    meta: [
      { title: "Finalistas — Bolão Copa 2026" },
      { name: "description", content: "Aposte nos dois finalistas da Copa 2026." },
    ],
  }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();
  const [identidade, setIdentidade] = useState<Identidade | null>(null);
  const [t1, setT1] = useState("");
  const [t2, setT2] = useState("");

  const { data: cfg } = useQuery({
    queryKey: ["cfg-fin"],
    queryFn: async () =>
      (await supabase.from("bolao_config_finalistas").select("*").eq("id", 1).single()).data,
  });
  const { data: usuarios } = useQuery({
    queryKey: ["usuarios"],
    queryFn: async () =>
      (await supabase.from("bolao_usuarios").select("id, nome").order("nome")).data ?? [],
  });
  const { data: apostas } = useQuery({
    queryKey: ["apostas-fin"],
    queryFn: async () =>
      (await supabase.from("bolao_apostas_finalistas_publica").select("*")).data ?? [],
  });
  const { data: times } = useQuery({
    queryKey: ["times"],
    queryFn: async () => {
      const { data } = await supabase.from("bolao_jogos").select("time_casa, time_fora");
      const set = new Set<string>();
      data?.forEach((j) => {
        set.add(j.time_casa);
        set.add(j.time_fora);
      });
      return Array.from(set).sort();
    },
  });

  const enviar = useMutation({
    mutationFn: () =>
      callFn("aposta-finalistas", {
        nome: identidade?.nome,
        pin: identidade?.pin,
        time1: t1,
        time2: t2,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["apostas-fin"] });
      toast.success("Aposta registrada!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nP = usuarios?.length ?? 0;
  const pool = nP * 10 + Number(cfg?.acumulado_anterior || 0);
  const nomeMap = useMemo(() => new Map((usuarios ?? []).map((u) => [u.id, u.nome])), [usuarios]);
  const aberta = cfg?.status === "aberta";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-display text-4xl">🏆 Dois Finalistas</h1>
        <p className="text-muted-foreground">
          R$10 por participante. Aposta abre quando começam as oitavas.
        </p>
      </div>

      <Card className="bg-pitch border-primary/20">
        <CardContent className="py-6 text-center">
          <div className="text-display text-5xl text-primary">+10 PONTOS</div>
          <p className="text-xs text-muted-foreground mt-1 mb-2">
            Acertar 1 finalista: +5 pontos | Acertar 2 finalistas: +10 pontos
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            <Badge variant="outline" className="capitalize">
              {cfg?.status}
            </Badge>
            {aberta && cfg?.prazo_fim && <Badge>Fecha em {countdown(cfg.prazo_fim)}</Badge>}
            {cfg?.finalista1_real && (
              <Badge className="bg-gold-gradient text-black">
                {flag(cfg.finalista1_real)} {cfg.finalista1_real} × {cfg.finalista2_real}{" "}
                {flag(cfg.finalista2_real)}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {!aberta && cfg?.status === "fechada" && (
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            As apostas abrem automaticamente quando o primeiro jogo das oitavas for agendado.
          </CardContent>
        </Card>
      )}

      {aberta && (
        <Card>
          <CardHeader>
            <CardTitle>Seu palpite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <IdentidadePicker value={identidade} onChange={setIdentidade} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>1º finalista</Label>
                <Select value={t1} onValueChange={setT1}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {times?.map((t) => (
                      <SelectItem key={t} value={t}>
                        {flag(t)} {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>2º finalista</Label>
                <Select value={t2} onValueChange={setT2}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {times
                      ?.filter((t) => t !== t1)
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
              onClick={() => enviar.mutate()}
              disabled={!identidade?.nome || !t1 || !t2 || enviar.isPending}
              className="w-full"
            >
              Registrar aposta
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Apostas ({apostas?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {(apostas?.length ?? 0) === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguém apostou ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {apostas!.map((a: any) => (
                <li
                  key={a.id}
                  className={`flex justify-between py-2 ${a.acertou_os_dois ? "text-success font-bold" : ""}`}
                >
                  <span>{nomeMap.get(a.usuario_id) ?? "—"}</span>
                  <span>
                    {`${flag(a.time1)} ${a.time1} × ${a.time2} ${flag(a.time2)}`}
                    {a.acertou_os_dois && " ✓✓"}
                    {!a.acertou_os_dois && a.acertou_um && " ✓"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
