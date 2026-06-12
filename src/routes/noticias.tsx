import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, callFn } from "@/lib/bolao";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Newspaper, RefreshCw, Calendar, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/noticias")({
  head: () => ({
    meta: [
      { title: "Notícias da Copa — Bolão Copa 2026" },
      { name: "description", content: "Notícias e atualizações oficiais sobre a Copa do Mundo 2026." }
    ]
  }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();

  const { data: noticias, isLoading, isError, refetch } = useQuery({
    queryKey: ["noticias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bolao_noticias")
        .select("*")
        .order("publicado_em", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => callFn("sync-noticias", { force: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["noticias"] });
      toast.success("Notícias atualizadas com sucesso!");
    },
    onError: (e: Error) => {
      toast.error(`Falha ao atualizar notícias: ${e.message}`);
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl sm:text-4xl flex items-center gap-2">
            <Newspaper className="h-8 w-8 text-primary" />
            📰 Notícias da Copa
          </h1>
          <p className="text-muted-foreground text-sm">
            Fique por dentro de tudo o que acontece na Copa do Mundo 2026.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "Atualizando..." : "Sincronizar"}
        </Button>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      )}

      {isError && (
        <ErrorState
          message="Não foi possível carregar as notícias. Execute a migração do banco para criar a tabela bolao_noticias."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (noticias?.length ?? 0) === 0 && (
        <Card className="text-center py-12 border-dashed">
          <CardContent className="space-y-4">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Nenhuma notícia encontrada</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Clique no botão de sincronizar para buscar notícias atualizadas da Copa do Mundo.
              </p>
            </div>
            <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              Buscar Notícias
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && (noticias?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {noticias!.map((n: any) => {
            const dataPub = new Date(n.publicado_em).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <Card key={n.id} className="overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-all shadow-card h-full">
                <div>
                  {n.imagem_url && (
                    <div className="aspect-video w-full overflow-hidden bg-secondary/30 relative">
                      <img
                        src={n.imagem_url}
                        alt={n.titulo}
                        className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{dataPub}</span>
                    </div>
                    <CardTitle className="text-base font-semibold leading-snug line-clamp-2">
                      {n.titulo}
                    </CardTitle>
                  </CardHeader>
                  {n.resumo && (
                    <CardContent className="p-4 pt-0 text-sm text-muted-foreground line-clamp-3">
                      {n.resumo}
                    </CardContent>
                  )}
                </div>
                <div className="p-4 pt-0">
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 mt-2"
                  >
                    Ler matéria completa
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
