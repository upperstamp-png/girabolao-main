/** Intervalos de polling para dados em tempo quasi-real (sync server a cada 10 min). */
export const POLL = {
  /** Jogos ao vivo: 5 segundos */
  LIVE: 5_000,
  /** Jogos proximos / dashboard: 10 segundos */
  NORMAL: 10_000,
  /** Config estatica: 30 segundos */
  SLOW: 30_000,
} as const;

export function pollIntervalForStatus(status?: string | null): number {
  if (status === "ao_vivo") return POLL.LIVE;
  return POLL.NORMAL;
}
