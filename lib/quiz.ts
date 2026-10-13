import type { QuizFile, QuizQuestion } from "@/lib/types";

const MAX_QUESTIONS = 100;
const MAX_PROMPT = 280;
const MAX_CHOICE = 80;

export function parseQuiz(input: unknown): QuizFile {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Quiz file must be a JSON object with a questions array.");
  }

  const raw = input as Record<string, unknown>;
  const title =
    typeof raw.title === "string" && raw.title.trim()
      ? raw.title.trim().slice(0, 80)
      : "Dashain Tihar Quiz";

  if (!Array.isArray(raw.questions) || raw.questions.length < 1) {
    throw new Error("Add at least one question.");
  }
  if (raw.questions.length > MAX_QUESTIONS) {
    throw new Error("A quiz can have at most 100 questions.");
  }

  return {
    title,
    questions: raw.questions.map((item, index) => parseQuestion(item, index)),
  };
}

function parseQuestion(item: unknown, index: number): QuizQuestion {
  const number = index + 1;
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    throw new Error(`Question ${number} is not an object.`);
  }

  const raw = item as Record<string, unknown>;
  if (typeof raw.prompt !== "string" || !raw.prompt.trim()) {
    throw new Error(`Question ${number} is missing a prompt.`);
  }
  const prompt = raw.prompt.trim();
  if (prompt.length > MAX_PROMPT) {
    throw new Error(`Question ${number} prompt is too long.`);
  }

  if (!Array.isArray(raw.choices)) {
    throw new Error(`Question ${number} is missing choices.`);
  }
  const choices = raw.choices.map((choice, choiceIndex) => {
    if (typeof choice !== "string" || !choice.trim()) {
      throw new Error(`Question ${number} choice ${choiceIndex + 1} is empty.`);
    }
    const text = choice.trim();
    if (text.length > MAX_CHOICE) {
      throw new Error(`Question ${number} choice ${choiceIndex + 1} is too long.`);
    }
    return text;
  });
  if (choices.length < 2 || choices.length > 4) {
    throw new Error(`Question ${number} needs 2 to 4 choices.`);
  }

  if (
    typeof raw.correct !== "number" ||
    !Number.isInteger(raw.correct) ||
    raw.correct < 0 ||
    raw.correct >= choices.length
  ) {
    throw new Error(`Question ${number} has an invalid correct index.`);
  }

  let seconds = 20;
  if (raw.seconds !== undefined) {
    if (
      typeof raw.seconds !== "number" ||
      !Number.isInteger(raw.seconds) ||
      raw.seconds < 5 ||
      raw.seconds > 120
    ) {
      throw new Error(`Question ${number} time must be a whole number from 5 to 120.`);
    }
    seconds = raw.seconds;
  }

  return { prompt, choices, correct: raw.correct, seconds };
}

export function normalizePin(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

export function formatPin(pin: string) {
  return pin.length === 6 ? `${pin.slice(0, 3)} ${pin.slice(3)}` : pin;
}
