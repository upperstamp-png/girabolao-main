import { useState, useEffect } from "react";
import { supabase, getIdentidade } from "@/lib/bolao";

const EMOJIS = ["🔥", "😱", "😂", "👏", "😭", "⚽"] as const;
type Emoji = (typeof EMOJIS)[number];

interface ReactionCounts {
  [emoji: string]: { count: number; hasReacted: boolean };
}

export function ReactionBar({ jogoId }: { jogoId: string }) {
  const identidade = getIdentidade();
  const [counts, setCounts] = useState<ReactionCounts>({});
  const [loading, setLoading] = useState<string | null>(null);

  // Fetch initial counts
  useEffect(() => {
    async function fetchReactions() {
      const { data } = await supabase
        .from("bolao_reacoes")
        .select("emoji, usuario_id")
        .eq("jogo_id", jogoId);

      if (!data) return;

      const result: ReactionCounts = {};
      for (const emoji of EMOJIS) {
        const matching = data.filter((r) => r.emoji === emoji);
        result[emoji] = {
          count: matching.length,
          hasReacted: matching.some((r) => r.usuario_id === identidade?.id),
        };
      }
      setCounts(result);
    }

    fetchReactions();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`reactions-${jogoId}`)
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "bolao_reacoes", filter: `jogo_id=eq.${jogoId}` },
        () => {
          fetchReactions(); // Re-fetch on any change
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jogoId, identidade?.id]);

  async function toggleReaction(emoji: Emoji) {
    if (!identidade?.id || loading) return;
    setLoading(emoji);

    const current = counts[emoji];
    if (current?.hasReacted) {
      // Remove reaction
      await supabase
        .from("bolao_reacoes")
        .delete()
        .eq("jogo_id", jogoId)
        .eq("usuario_id", identidade.id)
        .eq("emoji", emoji);
    } else {
      // Add reaction
      await supabase
        .from("bolao_reacoes")
        .upsert(
          { jogo_id: jogoId, usuario_id: identidade.id, emoji },
          { onConflict: "jogo_id,usuario_id,emoji" },
        );
    }

    setLoading(null);
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {EMOJIS.map((emoji) => {
        const info = counts[emoji] ?? { count: 0, hasReacted: false };
        return (
          <button
            key={emoji}
            onClick={() => toggleReaction(emoji)}
            disabled={!identidade?.id || loading === emoji}
            className={`
              flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm
              border transition-all active:scale-95 btn-touch
              ${
                info.hasReacted
                  ? "bg-primary/15 border-primary/40 shadow-[0_0_8px_rgba(63,185,80,0.15)]"
                  : "bg-secondary/30 border-border/50 hover:bg-secondary/60"
              }
              ${loading === emoji ? "opacity-50" : ""}
            `}
          >
            <span className="text-base leading-none">{emoji}</span>
            {info.count > 0 && (
              <span
                className="font-mono text-[11px] font-bold tabular-nums"
                style={{ color: info.hasReacted ? "#3FB950" : "#8B949E" }}
              >
                {info.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
