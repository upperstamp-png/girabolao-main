const POLL = {
  /** Jogos ao vivo: 5 segundos */
  LIVE: 5e3,
  /** Jogos proximos / dashboard: 10 segundos */
  NORMAL: 1e4,
  /** Config estatica: 30 segundos */
  SLOW: 3e4
};
function pollIntervalForStatus(status) {
  if (status === "ao_vivo") return POLL.LIVE;
  return POLL.NORMAL;
}
export {
  POLL as P,
  pollIntervalForStatus as p
};
