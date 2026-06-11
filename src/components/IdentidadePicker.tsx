import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase, getIdentidade, setIdentidade } from "@/lib/bolao";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type Identidade = { nome: string; pin?: string; tem_pin: boolean };

export function IdentidadePicker({ value, onChange }: { value: Identidade | null; onChange: (i: Identidade | null) => void }) {
  const { data: usuarios } = useQuery({
    queryKey: ["usuarios-pick"],
    queryFn: async () => (await supabase.from("bolao_usuarios").select("id, nome, pin_hash").order("nome")).data ?? [],
  });
  const [nome, setNome] = useState(value?.nome ?? "");
  const [pin, setPin] = useState(value?.pin ?? "");

  useEffect(() => {
    if (!value) {
      const saved = getIdentidade();
      if (saved && usuarios?.some(u => u.nome === saved.nome)) {
        setNome(saved.nome); setPin(saved.pin ?? "");
        const u = usuarios.find(x => x.nome === saved.nome)!;
        onChange({ nome: saved.nome, pin: saved.pin, tem_pin: !!u.pin_hash });
      }
    }
  }, [usuarios]);

  const usuarioSel = usuarios?.find(u => u.nome === nome);
  const temPin = !!usuarioSel?.pin_hash;

  function update(n: string, p: string) {
    setNome(n); setPin(p);
    if (!n) { onChange(null); setIdentidade(null); return; }
    const u = usuarios?.find(x => x.nome === n);
    const id = { nome: n, pin: p || undefined, tem_pin: !!u?.pin_hash };
    onChange(id);
    setIdentidade({ nome: n, pin: p || undefined });
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Quem é você?</Label>
        <Select value={nome} onValueChange={v => update(v, "")}>
          <SelectTrigger><SelectValue placeholder="Selecione seu nome" /></SelectTrigger>
          <SelectContent>
            {(usuarios ?? []).map(u => <SelectItem key={u.id} value={u.nome}>{u.nome}{u.pin_hash ? " 🔒" : ""}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {temPin && (
        <div>
          <Label>PIN</Label>
          <Input value={pin} onChange={e => update(nome, e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="••••" inputMode="numeric" />
        </div>
      )}
    </div>
  );
}
