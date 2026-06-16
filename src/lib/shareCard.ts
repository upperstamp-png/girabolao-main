import { useRef, useCallback } from "react";
import { flag } from "@/lib/bolao";

interface ShareCardData {
  timeCasa: string;
  timeFora: string;
  golsCasa: number;
  golsFora: number;
  fase: string;
  dataHora: string;
  userName: string;
}

/**
 * Draws a prediction card on a canvas and returns a Blob.
 */
async function generateCardBlob(data: ShareCardData): Promise<Blob> {
  const W = 600,
    H = 340;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#0D1117");
  bg.addColorStop(1, "#161B22");
  ctx.fillStyle = bg;
  ctx.roundRect(0, 0, W, H, 16);
  ctx.fill();

  // Border
  ctx.strokeStyle = "#30363D";
  ctx.lineWidth = 2;
  ctx.roundRect(0, 0, W, H, 16);
  ctx.stroke();

  // Top accent line
  const accent = ctx.createLinearGradient(0, 0, W, 0);
  accent.addColorStop(0, "#3FB950");
  accent.addColorStop(1, "#388BFD");
  ctx.fillStyle = accent;
  ctx.fillRect(20, 0, W - 40, 3);

  // Header
  ctx.fillStyle = "#8B949E";
  ctx.font = "bold 11px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("BOLÃO COPA DO MUNDO 2026", W / 2, 35);

  // Phase + date
  ctx.fillStyle = "#484F58";
  ctx.font = "10px 'Inter', sans-serif";
  const dateStr = new Date(data.dataHora).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  ctx.fillText(`${data.fase} · ${dateStr}`, W / 2, 55);

  // Team names
  ctx.fillStyle = "#E6EDF3";
  ctx.font = "bold 22px 'Inter', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(data.timeCasa, W / 2 - 70, 115);
  ctx.textAlign = "left";
  ctx.fillText(data.timeFora, W / 2 + 70, 115);

  // Flags (emoji text)
  ctx.font = "36px serif";
  ctx.textAlign = "right";
  ctx.fillText(flag(data.timeCasa), W / 2 - 75, 118);
  ctx.textAlign = "left";
  ctx.fillText(flag(data.timeFora), W / 2 + 75, 118);

  // VS
  ctx.fillStyle = "#484F58";
  ctx.font = "bold 14px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("VS", W / 2, 112);

  // Divider
  ctx.strokeStyle = "#21262D";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 145);
  ctx.lineTo(W - 40, 145);
  ctx.stroke();

  // "Meu Palpite" label
  ctx.fillStyle = "#3FB950";
  ctx.font = "bold 11px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("MEU PALPITE", W / 2, 175);

  // Score box background
  const boxW = 160,
    boxH = 60;
  const boxX = (W - boxW) / 2,
    boxY = 185;
  ctx.fillStyle = "#1C2333";
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 12);
  ctx.fill();
  ctx.strokeStyle = "#3FB950";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 12);
  ctx.stroke();

  // Score numbers
  ctx.fillStyle = "#3FB950";
  ctx.font = "bold 36px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${data.golsCasa}`, W / 2 - 35, boxY + 44);
  ctx.fillStyle = "#484F58";
  ctx.font = "bold 24px 'JetBrains Mono', monospace";
  ctx.fillText("×", W / 2, boxY + 42);
  ctx.fillStyle = "#3FB950";
  ctx.font = "bold 36px 'JetBrains Mono', monospace";
  ctx.fillText(`${data.golsFora}`, W / 2 + 35, boxY + 44);

  // Footer
  ctx.fillStyle = "#484F58";
  ctx.font = "11px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`Palpite de ${data.userName}`, W / 2, H - 35);

  ctx.fillStyle = "#30363D";
  ctx.font = "9px 'Inter', sans-serif";
  ctx.fillText("girabolao.vercel.app", W / 2, H - 18);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), "image/png");
  });
}

export function useSharePrediction() {
  const sharing = useRef(false);

  const share = useCallback(async (data: ShareCardData) => {
    if (sharing.current) return;
    sharing.current = true;

    try {
      const blob = await generateCardBlob(data);
      const file = new File([blob], "meu-palpite-copa-2026.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "Meu palpite — Bolão Copa 2026",
          text: `${data.timeCasa} ${data.golsCasa} × ${data.golsFora} ${data.timeFora}`,
          files: [file],
        });
      } else {
        // Fallback: download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "meu-palpite-copa-2026.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      // User cancelled share or error
      console.warn("Share cancelled or failed:", e);
    } finally {
      sharing.current = false;
    }
  }, []);

  return share;
}
