import { useEffect, useState } from "react";
import { getIdentidade } from "@/lib/bolao";
import { Badge } from "@/components/ui/badge";

export type Identidade = { nome: string; pin?: string; tem_pin: boolean };

export function IdentidadePicker({
  value,
  onChange,
}: {
  value: Identidade | null;
  onChange: (i: Identidade | null) => void;
}) {
  const [identidade] = useState<Identidade | null>(() => getIdentidade());

  useEffect(() => {
    if (!value && identidade) onChange(identidade);
  }, [identidade, onChange, value]);

  if (!identidade) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        Entre com nome e PIN para continuar.
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/20 px-3 py-2">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">Palpitando como</div>
        <div className="truncate font-medium">{identidade.nome}</div>
      </div>
      <Badge variant="secondary">PIN validado</Badge>
    </div>
  );
}
