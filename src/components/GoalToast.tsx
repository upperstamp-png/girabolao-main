/**
 * GoalToast — notificação in-app animada de gol
 * ─────────────────────────────────────────────
 * Usa portal React para renderizar no topo da viewport.
 * Auto-dismiss em 5s com slide-up fade-out.
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { flag } from "@/lib/bolao";
import type { GoalEvent } from "@/lib/goalEvents";

interface GoalToastProps {
  events: GoalEvent[];
  onDismiss: (timestamp: number) => void;
}

function GoalToastItem({ event, onDismiss }: { event: GoalEvent; onDismiss: () => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const exitTimer = setTimeout(() => setExiting(true), 4600);
    const removeTimer = setTimeout(onDismiss, 5200);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(removeTimer);
    };
  }, [onDismiss]);

  return (
    <div
      className={`goal-toast ${exiting ? "goal-toast-exit" : ""}`}
      role="alert"
      aria-live="assertive"
    >
      {/* Ball icon */}
      <span className="goal-toast-icon">⚽</span>

      {/* Content */}
      <div className="goal-toast-content">
        <div className="goal-toast-headline">
          <span className="goal-toast-team">
            {flag(event.team)} GOL {event.side === "home" ? "DA CASA" : "DE FORA"} — {event.team}!
          </span>
        </div>
        <div className="goal-toast-score">
          Placar: {event.score}
          {event.minute != null && <span className="goal-toast-minute"> · {event.minute}'</span>}
        </div>
      </div>

      {/* Close button */}
      <button className="goal-toast-close" onClick={onDismiss} aria-label="Fechar">
        ✕
      </button>
    </div>
  );
}

export function GoalToastContainer({ events, onDismiss }: GoalToastProps) {
  if (typeof window === "undefined") return null;
  if (events.length === 0) return null;

  return createPortal(
    <div className="goal-toast-container">
      {events.map((ev) => (
        <GoalToastItem key={ev.timestamp} event={ev} onDismiss={() => onDismiss(ev.timestamp)} />
      ))}
    </div>,
    document.body,
  );
}
