"use client";
// TEMPORARY visual preview — delete after review.
import { useSearchParams } from "next/navigation";
import { HostStage } from "@/components/host/HostStage";
import { PlayView } from "@/components/player/PlayScreen";
import type { HostSnapshot, Phase, PublicState } from "@/lib/types";

const top = ["Aarati", "Bikash", "Sita", "Ramesh", "Pemba", "Kriti", "Nabin", "Asmita"].map((nickname, i) => ({
  nickname,
  score: 4200 - i * 430,
  rank: i + 1,
}));

export default function Preview() {
  const params = useSearchParams();
  const view = params.get("v") ?? "lobby";
  const now = new Date();
  if (view.startsWith("p-")) {
    const phase = view.slice(2).replace("-wrong", "") as Phase;
    const state: PublicState = {
      phase, title: "Dashain Tihar Quiz", pin: "482913", nickname: "Aarati", questionIndex: 2, questionCount: 10,
      endsAt: new Date(now.getTime() + 12000).toISOString(), serverNow: now.toISOString(), durationMs: 20000,
      choiceCount: 4, answered: phase !== "question", yourChoice: 1, correct: !view.endsWith("-wrong"),
      pointsEarned: view.endsWith("-wrong") ? 0 : 860, correctIndex: 1, score: 3120, rank: 2, playerCount: 24, revision: 1,
    };
    return <PlayView state={state} pending={null} closed={false} actionError={null} onPick={() => {}} onLeave={() => {}} />;
  }
  const snap: HostSnapshot = {
    pin: "482913", title: "Dashain Tihar Quiz", status: view as Phase, questionIndex: 2, questionCount: 10,
    endsAt: new Date(now.getTime() + 12000).toISOString(), serverNow: now.toISOString(), durationMs: 20000,
    choiceCount: 4, playerCount: 8, nicknames: top.map((t) => t.nickname),
    question: { prompt: "On which day of Tihar are dogs honoured with garlands and tika?", choices: ["Kaag Tihar", "Kukur Tihar", "Gai Tihar", "Bhai Tika"], seconds: 20 },
    correctIndex: 1, answerCounts: [1, 5, 1, 1], answeredCount: view === "reveal" ? 8 : 5, top, revision: 1,
  };
  return <HostStage snap={snap} joinUrl="http://localhost:3000/join?pin=482913" busy={false} error={null} copied={false} onAction={() => {}} onNewGame={() => {}} onCopy={() => {}} />;
}
