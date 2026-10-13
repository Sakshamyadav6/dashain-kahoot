import type { HostSnapshot, PhasePing, PublicState } from "@/lib/types";

const PHASES = new Set(["lobby", "question", "reveal", "leaderboard", "finished"]);

export function toPhasePing(snapshot: HostSnapshot): PhasePing {
  const showAnswer = snapshot.status === "reveal" || snapshot.status === "leaderboard";
  return {
    phase: snapshot.status,
    questionIndex: snapshot.questionIndex,
    endsAt: snapshot.endsAt,
    serverNow: snapshot.serverNow,
    choiceCount: snapshot.choiceCount,
    durationMs: snapshot.durationMs,
    correctIndex: showAnswer ? snapshot.correctIndex : null,
    revision: snapshot.revision,
  };
}

export function isPhasePing(value: unknown): value is PhasePing {
  if (!value || typeof value !== "object") return false;
  const ping = value as Partial<PhasePing>;
  return (
    typeof ping.phase === "string" &&
    PHASES.has(ping.phase) &&
    typeof ping.revision === "number" &&
    typeof ping.questionIndex === "number"
  );
}

// The broadcast wakes phones immediately. Personal results still come from
// public_state, so a fake broadcast cannot reveal the answer.
export function applyPhasePing(current: PublicState | null, ping: PhasePing): PublicState | null {
  if (!current || ping.revision <= current.revision) return current;

  const sameQuestion =
    ping.phase === "question" &&
    current.phase === "question" &&
    ping.questionIndex === current.questionIndex;

  return {
    ...current,
    phase: ping.phase,
    questionIndex: ping.questionIndex,
    endsAt: ping.phase === "question" && typeof ping.endsAt === "string" ? ping.endsAt : null,
    serverNow: typeof ping.serverNow === "string" ? ping.serverNow : current.serverNow,
    choiceCount: typeof ping.choiceCount === "number" ? ping.choiceCount : current.choiceCount,
    durationMs: ping.phase === "question" && typeof ping.durationMs === "number" ? ping.durationMs : null,
    revision: ping.revision,
    correctIndex: null,
    correct: null,
    pointsEarned: null,
    rank: null,
    answered: sameQuestion ? current.answered : false,
    yourChoice: sameQuestion ? current.yourChoice : null,
  };
}
