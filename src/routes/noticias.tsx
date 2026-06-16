import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, callFn } from "@/lib/bolao";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/SkeletonCard";
import { ErrorState } from "@/components/ErrorState";
import { Newspaper, RefreshCw, ExternalLink, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/noticias")({
  head: () => ({
    meta: [
      { title: "Notícias da Copa — Bolão Copa 2026" },
      {
        name: "description",
        content: "Notícias e atualizações oficiais sobre a Copa do Mundo 2026.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  const qc = useQueryClient();

  const {
    data: noticias,
    isLoading,
    isError,
    refetch,
  } = useQuery({
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
    },
  });

  return (
    <div className="max-w-4xl mx-auto pb-16 animate-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
            <Newspaper className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-display text-2xl sm:text-3xl leading-none">Notícias da Copa</h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Copa do Mundo 2026 — Cobertura completa
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={syncMutation.isPending}
          onClick={() => syncMutation.mutate()}
          className="shrink-0 flex items-center gap-1.5 h-8 text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncMutation.isPending ? "animate-spin" : ""}`} />
          {syncMutation.isPending ? "Sincronizando..." : "Sincronizar"}
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
          <SkeletonCard lines={4} />
        </div>
      )}

      {/* Error */}
      {isError && (
        <ErrorState
          message="Não foi possível carregar as notícias. Execute a migração do banco para criar a tabela bolao_noticias."
          onRetry={() => refetch()}
        />
      )}

      {/* Empty state */}
      {!isLoading && !isError && (noticias?.length ?? 0) === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/30 border border-border">
            <Newspaper className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Nenhuma notícia encontrada</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-xs">
              Clique em Sincronizar para buscar notícias atualizadas da Copa.
            </p>
          </div>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="mt-2"
          >
            Buscar Notícias
          </Button>
        </div>
      )}

      {/* News grid */}
      {!isLoading && !isError && (noticias?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {noticias!.map((n: any, i: number) => {
            const dataPub = new Date(n.publicado_em).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            });

            // Derive editorial category + color from fonte
            const categoriaMap: Record<
              string,
              { label: string; color: string; bg: string; border: string }
            > = {
              ge: {
                label: "COPA 2026",
                color: "#3FB950",
                bg: "rgba(63,185,80,0.1)",
                border: "rgba(63,185,80,0.2)",
              },
              ESPN: {
                label: "COPA 2026",
                color: "#3FB950",
                bg: "rgba(63,185,80,0.1)",
                border: "rgba(63,185,80,0.2)",
              },
              FIFA: {
                label: "COPA 2026",
                color: "#3FB950",
                bg: "rgba(63,185,80,0.1)",
                border: "rgba(63,185,80,0.2)",
              },
              "UOL Esporte": {
                label: "SELEÇÕES",
                color: "#388BFD",
                bg: "rgba(56,139,253,0.1)",
                border: "rgba(56,139,253,0.2)",
              },
              "Lance!": {
                label: "SELEÇÕES",
                color: "#388BFD",
                bg: "rgba(56,139,253,0.1)",
                border: "rgba(56,139,253,0.2)",
              },
              "TNT Sports": {
                label: "AO VIVO",
                color: "#F85149",
                bg: "rgba(248,81,73,0.1)",
                border: "rgba(248,81,73,0.2)",
              },
              CazéTV: {
                label: "AO VIVO",
                color: "#F85149",
                bg: "rgba(248,81,73,0.1)",
                border: "rgba(248,81,73,0.2)",
              },
              Transfermarkt: {
                label: "MERCADO",
                color: "#D29922",
                bg: "rgba(210,153,34,0.1)",
                border: "rgba(210,153,34,0.2)",
              },
              "90min": {
                label: "CURIOSIDADES",
                color: "#A371F7",
                bg: "rgba(163,113,247,0.1)",
                border: "rgba(163,113,247,0.2)",
              },
            };
            const defaultCat = {
              label: "COPA 2026",
              color: "#3FB950",
              bg: "rgba(63,185,80,0.1)",
              border: "rgba(63,185,80,0.2)",
            };
            const cat = categoriaMap[n.fonte] ?? defaultCat;

            return (
              <a
                key={n.id}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`group block rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${i === 0 ? "md:col-span-2" : ""}`}
              >
                {/* Image */}
                {n.imagem_url ? (
                  <div
                    className={`w-full overflow-hidden bg-secondary/20 ${i === 0 ? "aspect-[21/9]" : "aspect-video"}`}
                  >
                    <img
                      src={n.imagem_url}
                      alt={n.titulo}
                      className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div
                    className={`w-full bg-gradient-to-br from-secondary/40 to-background flex items-center justify-center ${i === 0 ? "aspect-[21/9]" : "aspect-video"}`}
                  >
                    <Newspaper className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}

                {/* Content */}
                <div className="p-4 space-y-2">
                  {/* Meta row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                      style={{ color: cat.color, background: cat.bg, borderColor: cat.border }}
                    >
                      ● {cat.label}
                    </span>
                    {n.fonte && n.fonte !== cat.label && (
                      <span className="text-[10px] text-muted-foreground">{n.fonte}</span>
                    )}
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {dataPub}
                    </span>
                  </div>

                  {/* Title */}
                  <h2
                    className={`font-display font-bold leading-snug group-hover:text-primary transition-colors ${i === 0 ? "text-xl sm:text-2xl" : "text-base"} line-clamp-2`}
                  >
                    {n.titulo}
                  </h2>

                  {/* Summary */}
                  {n.resumo && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {n.resumo}
                    </p>
                  )}

                  {/* Link */}
                  <div className="flex items-center gap-1 text-xs text-primary font-semibold pt-1 group-hover:gap-2 transition-all">
                    Ler matéria completa
                    <ExternalLink className="h-3 w-3" />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
