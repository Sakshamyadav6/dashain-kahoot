import { ANSWER_LOOKS } from "@/lib/answers";

export function formatScore(score: number) {
  return score.toLocaleString("en-US");
}

export function placeLabel(rank: number) {
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
  const mod10 = rank % 10;
  if (mod10 === 1) return `${rank}st`;
  if (mod10 === 2) return `${rank}nd`;
  if (mod10 === 3) return `${rank}rd`;
  return `${rank}th`;
}

const COLOR_NAMES = ["red", "blue", "yellow", "green"] as const;

export function answerName(index: number) {
  const look = ANSWER_LOOKS[index];
  const color = COLOR_NAMES[index];
  if (!look || !color) return "that shape";
  return `the ${color} ${look.name.toLowerCase()}`;
}
