/** Intervalos de polling para dados em tempo quasi-real (sync server a cada 10 min). */
export const POLL = {
  /** Jogos ao vivo: 5 segundos */
  LIVE: 5_000,
  /** Jogos proximos / dashboard: 10 segundos */
  NORMAL: 10_000,
  /** Config estatica: 30 segundos */
  SLOW: 30_000,
} as const;

/**
 * Determina o intervalo de polling com base no estado real do jogo da API FIFA 2026.
 * Usa os campos: finished (boolean) e time_elapsed (number | null)
 */
export function pollIntervalForStatus(game: { finished: boolean; time_elapsed: number | null }): number {
  const isLive = !game.finished && game.time_elapsed !== null;
  return isLive ? POLL.LIVE : POLL.NORMAL;
}

/**
 * Determina se um jogo está ao vivo (para exibição UI).
 */
export function isGameLive(game: { finished: boolean; time_elapsed: number | null }): boolean {
  return !game.finished && game.time_elapsed !== null;
}

/**
 * Converte o status da API para texto legível para o usuário.
 */
export function formatGameStatus(game: { finished: boolean; time_elapsed: number | null }): string {
  if (game.finished) return "ENCERRADO";
  if (game.time_elapsed === null) return "AGENDADO";
  return `AO VIVO - ${game.time_elapsed}'`;
}
