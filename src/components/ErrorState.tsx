import { AlertTriangle, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  offline?: boolean;
  className?: string;
}

export function ErrorState({ message, onRetry, offline = false, className = "" }: ErrorStateProps) {
  return (
    <Card className={`border-destructive/40 ${className}`}>
      <CardContent className="py-8 flex flex-col items-center gap-3 text-center">
        {offline
          ? <WifiOff className="h-8 w-8 text-destructive" />
          : <AlertTriangle className="h-8 w-8 text-destructive" />
        }
        <p className="text-sm text-muted-foreground max-w-xs">
          {message || (offline
            ? "Sem conexão. Verifique sua internet e tente novamente."
            : "Ocorreu um erro ao carregar os dados."
          )}
        </p>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="gap-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function EmptyState({ message = "Nenhum dado encontrado.", icon = "📭" }: { message?: string; icon?: string }) {
  return (
    <Card>
      <CardContent className="py-10 text-center text-muted-foreground">
        <div className="text-4xl mb-3">{icon}</div>
        <p className="text-sm">{message}</p>
      </CardContent>
    </Card>
  );
}
