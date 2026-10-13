"use client";

import { useRef, useState, type FormEvent } from "react";
import sampleQuiz from "@/data/questions.example.json";
import { Diyo } from "@/components/festival";
import {
  ErrorNote,
  FestiveScreen,
  GhostButton,
  GoldButton,
  Greeting,
  fieldClass,
} from "@/components/ui";
import { parseQuiz } from "@/lib/quiz";
import { messageFrom } from "@/lib/supabase";
import type { QuizFile } from "@/lib/types";

export function HostSetup({
  onCreate,
}: {
  onCreate: (password: string, quiz: QuizFile) => Promise<void>;
}) {
  const [password, setPassword] = useState("");
  const [quiz, setQuiz] = useState<QuizFile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const placeholder = quiz?.questions.some((question) =>
    question.prompt.startsWith("Replace this"),
  );

  async function readFile(file: File) {
    try {
      const parsed = parseQuiz(JSON.parse(await file.text()));
      setQuiz(parsed);
      setError(null);
    } catch (caught) {
      setQuiz(null);
      setError(caught instanceof SyntaxError ? "That file is not valid JSON." : messageFrom(caught));
    }
  }

  function loadSample() {
    try {
      setQuiz(parseQuiz(sampleQuiz));
      setError(null);
    } catch (caught) {
      setError(messageFrom(caught));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!quiz) {
      setError("Load a question file first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onCreate(password, quiz);
    } catch (caught) {
      setError(messageFrom(caught));
      setBusy(false);
    }
  }

  return (
    <FestiveScreen variant="quiet">
      <form
        onSubmit={submit}
        className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-10"
      >
        <div className="glass animate-rise flex flex-col gap-5 rounded-4xl p-6 sm:p-8">
          <div className="flex items-center gap-4">
            <Diyo className="w-16 shrink-0 sm:w-20" />
            <div>
              <Greeting className="text-xl sm:text-2xl" />
              <h1 className="font-display text-4xl leading-none sm:text-5xl">Host the quiz</h1>
            </div>
          </div>
          <p className="text-lg text-cream/75">
            The projector shows the question. Phones only tap a color. Load your questions, then open
            the room.
          </p>

          <label className="grid grid-cols-1 gap-2 text-lg">
            Host password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="change-me"
              className={fieldClass}
              required
            />
            <span className="text-base text-cream/60">
              The password stored in Supabase. Players never see this.
            </span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <GhostButton className="text-xl" onClick={() => fileRef.current?.click()}>
              Upload JSON
            </GhostButton>
            <GhostButton className="text-xl" onClick={loadSample}>
              Load sample
            </GhostButton>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void readFile(file);
              }}
            />
          </div>

          {quiz && (
            <div
              key={`${quiz.title}-${quiz.questions.length}`}
              className="animate-pop rounded-3xl border border-gold/30 bg-linear-to-br from-marigold/25 to-sindoor/15 p-5"
            >
              <p className="font-display text-2xl text-gold">
                {quiz.title} · {quiz.questions.length}{" "}
                {quiz.questions.length === 1 ? "question" : "questions"}
              </p>
              <p className="mt-2 line-clamp-3 text-lg text-cream/80">{quiz.questions[0]?.prompt}</p>
              {placeholder && (
                <p className="mt-3 text-base text-marigold">
                  These are placeholders. Upload your real questions before the event.
                </p>
              )}
            </div>
          )}

          <ErrorNote message={error} />
          <GoldButton type="submit" disabled={busy || !quiz} className="min-h-16 text-3xl">
            {busy ? "Opening room…" : "Open room"}
          </GoldButton>
        </div>
      </form>
    </FestiveScreen>
  );
}
