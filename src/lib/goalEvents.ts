/**
 * Goal Detection & Alert System
 * ─────────────────────────────
 * Compara placar anterior vs novo para detectar gols.
 * Dispara som (Web Audio API), vibração e retorna evento para o toast.
 */

// ── Types ──────────────────────────────────────────────────────────────────

export interface GoalEvent {
  team: string;
  side: "home" | "away";
  score: string; // "2 : 1"
  minute: number | null;
  timestamp: number; // Date.now()
}

export interface LiveScore {
  id: string;
  placar_casa: number | null;
  placar_fora: number | null;
  time_casa: string;
  time_fora: string;
  minuto_jogo: number | null;
}

// ── Score Cache ─────────────────────────────────────────────────────────────
// Um Map por jogo_id → { home, away } para comparar deltas.

const scoreCache = new Map<string, { home: number; away: number }>();
let initialLoadDone = false;

/**
 * Marca que a carga inicial de dados já ocorreu.
 * Gols só são emitidos DEPOIS da primeira carga (evita toasts falsos ao abrir o app).
 */
export function markInitialLoadDone() {
  initialLoadDone = true;
}

/**
 * Compara um jogo contra o cache e retorna GoalEvents se houver gol.
 * Atualiza o cache internamente.
 */
export function detectGoals(game: LiveScore): GoalEvent[] {
  const home = game.placar_casa ?? 0;
  const away = game.placar_fora ?? 0;
  const prev = scoreCache.get(game.id);

  // Atualiza cache
  scoreCache.set(game.id, { home, away });

  // Se é a primeira vez que vemos este jogo ou a primeira carga, não emite
  if (!prev || !initialLoadDone) return [];

  const events: GoalEvent[] = [];

  if (home > prev.home) {
    events.push({
      team: game.time_casa,
      side: "home",
      score: `${home} : ${away}`,
      minute: game.minuto_jogo,
      timestamp: Date.now(),
    });
  }

  if (away > prev.away) {
    events.push({
      team: game.time_fora,
      side: "away",
      score: `${home} : ${away}`,
      minute: game.minuto_jogo,
      timestamp: Date.now(),
    });
  }

  return events;
}

/**
 * Limpa o cache de score (ex: quando não há mais jogos ao vivo).
 */
export function clearScoreCache() {
  scoreCache.clear();
  initialLoadDone = false;
}

// ── Audio Context (Web Audio API) ───────────────────────────────────────────
// Inicializa após a primeira interação do usuário (requisito do browser).

let audioCtx: AudioContext | null = null;

function ensureAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  // Resume se suspenso (política de autoplay)
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Habilitar áudio com a primeira interação
if (typeof window !== "undefined") {
  const unlock = () => {
    ensureAudioContext();
    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
  };
  document.addEventListener("click", unlock, { once: true });
  document.addEventListener("touchstart", unlock, { once: true });
}

/**
 * Toca um beep sintético de 2 tons ascendentes — não depende de arquivo externo.
 * Duração: ~600ms
 */
export function playGoalSound() {
  const ctx = ensureAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const gain = ctx.createGain();
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  // Primeiro tom: 880 Hz (A5)
  const osc1 = ctx.createOscillator();
  osc1.type = "triangle";
  osc1.frequency.setValueAtTime(880, now);
  osc1.frequency.setValueAtTime(1100, now + 0.12);
  osc1.connect(gain);
  osc1.start(now);
  osc1.stop(now + 0.25);

  // Segundo tom: 1320 Hz (E6) — harmônico
  const osc2 = ctx.createOscillator();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(1320, now + 0.15);
  osc2.frequency.setValueAtTime(1760, now + 0.3);
  osc2.connect(gain);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.5);
}

/**
 * Vibração de gol — padrão forte para mobile.
 */
export function vibrateOnGoal() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate([150, 80, 150, 80, 300]);
  }
}
