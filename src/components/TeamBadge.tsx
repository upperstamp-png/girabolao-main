import { flag } from "@/lib/bolao";

export function TeamBadge({
  nome,
  escudoUrl,
  size = "md",
}: {
  nome: string;
  escudoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const px = size === "sm" ? "h-6 w-6" : size === "lg" ? "h-14 w-14" : "h-10 w-10";
  if (escudoUrl) {
    return (
      <img
        src={escudoUrl}
        alt={nome}
        className={`${px} object-contain shrink-0`}
        loading="lazy"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return <span className={size === "lg" ? "text-4xl" : size === "sm" ? "text-lg" : "text-2xl"}>{flag(nome)}</span>;
}
