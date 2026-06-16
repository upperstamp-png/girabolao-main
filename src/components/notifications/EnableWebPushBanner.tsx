import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, X, Share } from "lucide-react";
import { getIdentidade } from "@/lib/bolao";
import {
  isPushSupported,
  getNotificationPermissionState,
  subscribeToPush,
  isIOSStandalone
} from "@/lib/webPush";
import { toast } from "sonner";

export function EnableWebPushBanner() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);
    setIsStandalone(isIOSStandalone());

    const permission = getNotificationPermissionState();
    const isDismissed = localStorage.getItem("bolao_push_dismissed") === "true";
    const identity = getIdentidade();

    // Mostra o banner apenas se:
    // - O navegador suportar push
    // - O usuário estiver logado
    // - A permissão não foi concedida nem negada (ainda é 'default')
    // - O usuário não clicou em fechar/dispensar anteriormente
    if (isPushSupported() && identity?.nome && permission === "default" && !isDismissed) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("bolao_push_dismissed", "true");
    setShow(false);
  };

  const handleEnable = async () => {
    const identity = getIdentidade();
    if (!identity) return;

    setLoading(true);
    try {
      await subscribeToPush(identity);
      toast.success("🔔 Notificações ativadas com sucesso!");
      setShow(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao ativar notificações.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm animate-in mb-6">
      <CardContent className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="bg-secondary p-2 rounded-lg text-primary shrink-0">
            <Bell className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-foreground">Receba alertas em tempo real</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS && !isStandalone
                ? "No iOS/Safari, instale o app (Adicionar à Tela de Início) para receber notificações."
                : "Saiba quando seus amigos palpitarem ou quando os resultados forem apurados."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          {isIOS && !isStandalone ? (
            <div className="flex items-center gap-1.5 text-[11px] text-amber-500 bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-md">
              <span>Toque em</span>
              <Share className="h-3 w-3 inline text-primary" />
              <span>e em <strong>&quot;Tela de Início&quot;</strong></span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={handleEnable}
              disabled={loading}
              className="btn-touch w-full sm:w-auto font-display bg-primary text-background hover:bg-primary/95 text-xs px-4 h-8.5 rounded-md"
            >
              {loading ? "Ativando..." : "Ativar Notificações"}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8.5 w-8.5 text-muted-foreground hover:text-foreground shrink-0 btn-touch rounded-md"
            aria-label="Dispensar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
