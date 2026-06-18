// Centraliza formatação de datas no fuso oficial da Copa (America/Sao_Paulo).
// Todos os timestamps no banco são timestamptz (UTC) — converta SEMPRE via estes helpers.

const TZ = "America/Sao_Paulo";

const fmtDateTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const fmtDate = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const fmtTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});

const fmtWeekday = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  weekday: "short",
  day: "2-digit",
  month: "short",
});

function toDate(input: string | Date | number | null | undefined): Date | null {
  if (input == null) return null;
  const d = input instanceof Date ? input : new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

export function formatBR(input: string | Date | number | null | undefined): string {
  const d = toDate(input);
  return d ? fmtDateTime.format(d) : "—";
}

export function formatBRDate(input: string | Date | number | null | undefined): string {
  const d = toDate(input);
  return d ? fmtDate.format(d) : "—";
}

export function formatBRTime(input: string | Date | number | null | undefined): string {
  const d = toDate(input);
  return d ? fmtTime.format(d) : "—";
}

export function formatBRWeekday(input: string | Date | number | null | undefined): string {
  const d = toDate(input);
  return d ? fmtWeekday.format(d) : "—";
}

/** Diferença em ms (positiva se `at` ainda está no futuro). */
export function msUntil(at: string | Date | number | null | undefined): number {
  const d = toDate(at);
  if (!d) return 0;
  return d.getTime() - Date.now();
}

/** Countdown em formato curto (ex.: "2d 4h", "12m 30s"). */
export function countdown(at: string | Date | number | null | undefined): string {
  const ms = msUntil(at);
  if (ms <= 0) return "encerrado";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

/** Regra oficial: palpite de placar bloqueia 15 min após o início do jogo. */
export const PALPITE_TOLERANCIA_MIN = 15;

export function palpiteBloqueado(dataHora: string | Date | number | null | undefined): boolean {
  const d = toDate(dataHora);
  if (!d) return true;
  return Date.now() > d.getTime() + PALPITE_TOLERANCIA_MIN * 60_000;
}

export function prazoPalpite(dataHora: string | Date | number | null | undefined): Date | null {
  const d = toDate(dataHora);
  if (!d) return null;
  return new Date(d.getTime() + PALPITE_TOLERANCIA_MIN * 60_000);
}
