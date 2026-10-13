export const ANSWER_LOOKS = [
  { name: "Triangle", color: "#e21b3c", deep: "#9e0f26", shape: "triangle" },
  { name: "Diamond", color: "#1f74e0", deep: "#0d3f8f", shape: "diamond" },
  { name: "Circle", color: "#e8a800", deep: "#a86a00", shape: "circle" },
  { name: "Square", color: "#2f9a14", deep: "#175c06", shape: "square" },
] as const;

export type AnswerShape = (typeof ANSWER_LOOKS)[number]["shape"];

export function tileBackground(index: number) {
  const look = ANSWER_LOOKS[index];
  if (!look) return "#4a0e18";
  return `linear-gradient(155deg, ${look.color} 0%, ${look.color} 45%, ${look.deep} 100%)`;
}
