export type Phase = "lobby" | "question" | "reveal" | "leaderboard" | "finished";

export type HostAction = "start" | "reveal" | "leaderboard" | "next";

export type HostQuestion = {
  prompt: string;
  choices: string[];
  seconds: number;
};

export type Standing = {
  nickname: string;
  score: number;
  rank: number;
};

export type HostSnapshot = {
  pin: string;
  title: string;
  status: Phase;
  questionIndex: number;
  questionCount: number;
  endsAt: string | null;
  serverNow: string;
  durationMs: number | null;
  choiceCount: number;
  playerCount: number;
  nicknames: string[];
  question: HostQuestion | null;
  correctIndex: number | null;
  answerCounts: number[];
  answeredCount: number;
  top: Standing[];
  revision: number;
};

export type PublicState = {
  phase: Phase;
  title: string;
  pin: string;
  nickname: string;
  questionIndex: number;
  questionCount: number;
  endsAt: string | null;
  serverNow: string;
  durationMs: number | null;
  choiceCount: number;
  answered: boolean;
  yourChoice: number | null;
  correct: boolean | null;
  pointsEarned: number | null;
  correctIndex: number | null;
  score: number;
  rank: number | null;
  playerCount: number;
  revision: number;
};

export type PhasePing = {
  phase: Phase;
  questionIndex: number;
  endsAt: string | null;
  serverNow: string;
  choiceCount: number;
  durationMs: number | null;
  correctIndex: number | null;
  revision: number;
};

export type CreateGameResult = {
  pin: string;
  hostToken: string;
  title: string;
  questionCount: number;
};

export type JoinGameResult = {
  playerToken: string;
  state: PublicState;
};

export type QuizQuestion = {
  prompt: string;
  choices: string[];
  correct: number;
  seconds: number;
};

export type QuizFile = {
  title: string;
  questions: QuizQuestion[];
};
