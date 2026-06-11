import { supabase } from "@/integrations/supabase/client";

const FN = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/** Chamada às Edge Functions com timeout e retry automático */
export async function callFn<T = any>(
  name: string,
  body?: any,
  method: "GET" | "POST" = "POST",
  retries = 1
): Promise<T> {
  const attempt = async (): Promise<Response> => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000); // 15s timeout
    try {
      const res = await fetch(`${FN}/${name}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          apikey: KEY,
          Authorization: `Bearer ${KEY}`,
        },
        body: method === "POST" ? JSON.stringify(body ?? {}) : undefined,
        signal: ctrl.signal,
      });
      return res;
    } catch (err: any) {
      if (err.name === "AbortError") throw new Error("Tempo esgotado. Verifique sua conexão.");
      throw err;
    } finally {
      clearTimeout(timer);
    }
  };

  let lastError: Error | null = null;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await attempt();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `Erro ${res.status}`);
      return data as T;
    } catch (err: any) {
      lastError = err;
      if (i < retries && err.message !== "Tempo esgotado. Verifique sua conexão.") {
        await new Promise(r => setTimeout(r, 800 * (i + 1))); // backoff
      }
    }
  }
  throw lastError!;
}

export { supabase };

// LocalStorage para identificação do usuário no navegador (não é auth real)
export type Identidade = { nome: string; pin?: string; tem_pin: boolean };
const KEY_ID = "bolao_identidade";
export function getIdentidade(): Identidade | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY_ID) || "null"); } catch { return null; }
}
export function setIdentidade(i: Identidade | null) {
  if (typeof window === "undefined") return;
  if (i) localStorage.setItem(KEY_ID, JSON.stringify(i));
  else localStorage.removeItem(KEY_ID);
}

export const fmtBRL = (v: number | string) =>
  Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const FASES_LABEL: Record<string, string> = {
  grupos: "Fase de Grupos",
  oitavas: "Oitavas de Final",
  quartas: "Quartas de Final",
  semis: "Semifinais",
  terceiro: "Disputa de 3º",
  final: "Final",
};

// Bandeiras emoji — cobertura completa Copa 2026 (48 seleções)
const FLAGS: Record<string, string> = {
  // Grupo A
  USA: "🇺🇸", "United States": "🇺🇸",
  Panama: "🇵🇦",
  Canada: "🇨🇦",
  Honduras: "🇭🇳",
  // Grupo B
  Mexico: "🇲🇽",
  Jamaica: "🇯🇲",
  Uruguay: "🇺🇾",
  Bolivia: "🇧🇴",
  // Grupo C
  Brazil: "🇧🇷", Brasil: "🇧🇷",
  Argentina: "🇦🇷",
  Paraguay: "🇵🇾",
  Peru: "🇵🇪",
  // Grupo D
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  Nigeria: "🇳🇬",
  Serbia: "🇷🇸",
  France: "🇫🇷",
  // Grupo E
  Germany: "🇩🇪",
  Netherlands: "🇳🇱",
  Spain: "🇪🇸",
  Portugal: "🇵🇹",
  // Grupo F
  Colombia: "🇨🇴",
  Ecuador: "🇪🇨",
  Japan: "🇯🇵",
  Australia: "🇦🇺",
  // Grupo G
  Morocco: "🇲🇦",
  Senegal: "🇸🇳",
  "South Korea": "🇰🇷",
  Belgium: "🇧🇪",
  // Grupo H
  Turkey: "🇹🇷",
  Croatia: "🇭🇷",
  Switzerland: "🇨🇭",
  Denmark: "🇩🇰",
  // Grupo I
  Italy: "🇮🇹",
  Norway: "🇳🇴",
  Poland: "🇵🇱",
  "New Zealand": "🇳🇿",
  // Grupo J
  Iran: "🇮🇷",
  "Saudi Arabia": "🇸🇦",
  "South Africa": "🇿🇦",
  Egypt: "🇪🇬",
  // Grupo K
  Algeria: "🇩🇿",
  Tunisia: "🇹🇳",
  Cameroon: "🇨🇲",
  Ghana: "🇬🇭",
  // Grupo L
  Venezuela: "🇻🇪",
  Chile: "🇨🇱",
  Iraq: "🇮🇶",
  Qatar: "🇶🇦",
  // Extras
  Wales: "🏴󠁧󠁢󠁷󠁬󠁳󠁿", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Ireland: "🇮🇪",
  Ukraine: "🇺🇦", Austria: "🇦🇹", Sweden: "🇸🇪",
  "United Arab Emirates": "🇦🇪", "Costa Rica": "🇨🇷",
};
export const flag = (nome: string | null | undefined) => (nome && FLAGS[nome]) || "⚽";

export function countdown(target: string | Date): string {
  const t = new Date(target).getTime() - Date.now();
  if (t <= 0) return "Encerrado";
  const d = Math.floor(t / 86400000);
  const h = Math.floor((t % 86400000) / 3600000);
  const m = Math.floor((t % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}
