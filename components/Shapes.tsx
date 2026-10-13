import type { AnswerShape } from "@/lib/answers";

export function Shape({
  shape,
  className = "",
}: {
  shape: AnswerShape;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {shape === "triangle" && <polygon points="50,10 92,88 8,88" fill="currentColor" />}
      {shape === "diamond" && <polygon points="50,6 94,50 50,94 6,50" fill="currentColor" />}
      {shape === "circle" && <circle cx="50" cy="50" r="38" fill="currentColor" />}
      {shape === "square" && <rect x="14" y="14" width="72" height="72" rx="10" fill="currentColor" />}
    </svg>
  );
}
