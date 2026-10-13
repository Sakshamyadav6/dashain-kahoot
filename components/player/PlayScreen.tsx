"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { SetupNotice } from "@/components/SetupNotice";
import { Shape } from "@/components/Shapes";
import { Diyo, Fireworks, PetalShower } from "@/components/festival";
import { ErrorNote, FestiveScreen, GhostButton, Greeting, LoadingScreen } from "@/components/ui";
import { publicState, submitAnswer } from "@/lib/api";
import { ANSWER_LOOKS, tileBackground } from "@/lib/answers";
import { answerName, formatScore, placeLabel } from "@/lib/format";
import { useCountUp } from "@/lib/motion";
import { applyPhasePing, isPhasePing } from "@/lib/state";
import { clearPlayer, loadPlayer, type PlayerSession } from "@/lib/storage";
import { getSupabase, hasSupabaseEnv, messageFrom } from "@/lib/supabase";
import { remainingMs, useServerClock } from "@/lib/time";
import type { PublicState } from "@/lib/types";

export default function PlayScreen() {
  const router = useRouter();
  const [session, setSession] = useState<PlayerSession | null>(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<PublicState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<number | null>(null);
  const [closed, setClosed] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const gen = useRef(0);
  const lockedRef = useRef(false);
  const seen = useRef<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!hasSupabaseEnv()) {
        setReady(true);
        return;
      }
      const saved = loadPlayer();
      if (!saved) {
        router.replace("/join");
        return;
      }
      setSession(saved);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [router]);

  const refresh = useCallback(async () => {
    if (!session) return;
    const ticket = ++gen.current;
    try {
      const next = await publicState(session.playerToken);
      if (ticket !== gen.current) return;
      setState((current) => {
        if (current && next.revision < current.revision) return current;
        return next;
      });
      setError(null);
    } catch (caught) {
      if (ticket !== gen.current) return;
      const message = messageFrom(caught);
      if (message === "Player not found") {
        clearPlayer();
        router.replace("/join");
        return;
      }
      setError(message);
    }
  }, [router, session]);

  useEffect(() => {
    if (!session) return;
    const kick = window.setTimeout(() => void refresh(), 0);
    const id = window.setInterval(() => void refresh(), 2000);
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh, session]);

  useEffect(() => {
    if (!session || !hasSupabaseEnv()) return;
    const supabase = getSupabase();
    const channel = supabase.channel(`game:${session.pin}`);
    channel.on("broadcast", { event: "phase" }, ({ payload }) => {
      if (isPhasePing(payload)) {
        setState((current) => applyPhasePing(current, payload));
      }
      void refresh();
    });
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refresh, session]);

  const marker = state ? `${state.phase}:${state.questionIndex}` : "";
  useEffect(() => {
    if (!marker) return;
    if (seen.current === null) {
      seen.current = marker;
      return;
    }
    if (seen.current === marker) return;
    seen.current = marker;
    lockedRef.current = false;
    const id = window.setTimeout(() => {
      setPending(null);
      setClosed(false);
      setActionError(null);
    }, 0);
    return () => window.clearTimeout(id);
  }, [marker]);

  async function pick(choice: number) {
    if (!session || !state || state.phase !== "question" || state.answered || closed || lockedRef.current) {
      return;
    }
    lockedRef.current = true;
    setPending(choice);
    setActionError(null);
    navigator.vibrate?.(12);
    try {
      await submitAnswer(session.playerToken, choice);
      await refresh();
    } catch (caught) {
      const message = messageFrom(caught);
      if (message === "Too late" || message === "The question is not open") {
        setClosed(true);
        setActionError(message === "Too late" ? "Too late" : "The question just closed");
        return;
      }
      lockedRef.current = false;
      setPending(null);
      setActionError(message);
    }
  }

  function leave() {
    if (!state) return;
    clearPlayer();
    router.push(`/join?pin=${state.pin}`);
  }

  if (!hasSupabaseEnv()) return <SetupNotice />;
  if (!ready || !session || !state) {
    if (error) {
      return (
        <FestiveScreen variant="quiet">
          <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-6">
            <ErrorNote message={error} />
            <GhostButton onClick={() => void refresh()}>Try again</GhostButton>
          </div>
        </FestiveScreen>
      );
    }
    return <LoadingScreen label="Joining" />;
  }

  return (
    <PlayView
      state={state}
      pending={pending}
      closed={closed}
      actionError={actionError}
      onPick={(choice) => void pick(choice)}
      onLeave={leave}
    />
  );
}

function PlayView({
  state,
  pending,
  closed,
  actionError,
  onPick,
  onLeave,
}: {
  state: PublicState;
  pending: number | null;
  closed: boolean;
  actionError: string | null;
  onPick: (choice: number) => void;
  onLeave: () => void;
}) {
  const clock = useServerClock(state.phase === "question" ? state.serverNow : null);
  const durationMs = state.durationMs ?? 0;
  const remaining =
    state.phase === "question" ? (clock > 0 ? remainingMs(state.endsAt, clock) : durationMs) : 0;
  const percent = durationMs > 0 ? Math.max(0, Math.min(100, (remaining / durationMs) * 100)) : 0;
  const selected = state.answered ? state.yourChoice : pending;
  const locked = state.answered || pending != null || closed;
  const answering = state.phase === "question" && state.choiceCount > 0;

  return (
    <FestiveScreen variant={answering ? "stage" : "quiet"} className="h-dvh overscroll-none">
      <header className="relative z-10 flex items-center justify-between gap-3 px-4">
        <p className="flex min-w-0 items-center gap-2 rounded-full bg-maroon-deep/70 py-1.5 pr-4 pl-1.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-gold to-marigold font-display text-lg text-maroon-deep">
            {state.nickname.slice(0, 1).toUpperCase()}
          </span>
          <span className="truncate font-display text-xl">{state.nickname}</span>
        </p>
        <p className="shrink-0 rounded-full bg-maroon-deep/70 px-4 py-2 text-cream/80">
          {state.phase === "lobby"
            ? "Lobby"
            : `Q ${Math.min(state.questionIndex + 1, state.questionCount)} / ${state.questionCount}`}
        </p>
      </header>

      {state.phase === "question" && durationMs > 0 && (
        <div className="relative z-10 mx-4 mt-3 h-3 overflow-hidden rounded-full bg-white/15">
          <div
            className={`h-full rounded-full transition-[width] duration-100 ease-linear ${
              percent < 25 ? "bg-sindoor" : "bg-linear-to-r from-gold to-marigold"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {state.phase === "lobby" && (
        <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
          <Diyo className="animate-bob w-28" />
          <Greeting className="animate-rise mt-2 text-2xl" />
          <h1 className="animate-pop gold-text mt-2 max-w-full truncate font-display text-6xl">
            {state.nickname}
          </h1>
          <p className="animate-rise mt-4 max-w-xs text-2xl text-cream/85" style={{ animationDelay: "0.2s" }}>
            You&apos;re in! Watch the big screen.
          </p>
          <p className="mt-3 flex gap-1.5" aria-hidden>
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="animate-bob h-2.5 w-2.5 rounded-full bg-gold"
                style={{ "--dur": "1.2s", "--delay": `${dot * 0.15}s` } as CSSProperties}
              />
            ))}
          </p>
          <GhostButton className="mt-8 text-xl" onClick={onLeave}>
            Use a different name
          </GhostButton>
        </section>
      )}

      {answering && (
        <section
          key={state.questionIndex}
          className="relative z-10 flex min-h-0 flex-1 flex-col px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          {actionError && (
            <p className="animate-shake pb-2 text-center font-display text-2xl text-gold">{actionError}</p>
          )}
          <div
            className={`grid min-h-0 flex-1 grid-cols-2 gap-3 ${state.choiceCount <= 2 ? "grid-rows-1" : "grid-rows-2"}`}
          >
            {ANSWER_LOOKS.slice(0, state.choiceCount).map((look, index) => {
              const chosen = selected === index;
              const dim = locked && !chosen;
              return (
                <button
                  key={look.name}
                  type="button"
                  aria-label={look.name}
                  disabled={locked}
                  onClick={() => onPick(index)}
                  className={`tile animate-pop relative flex items-center justify-center rounded-3xl text-white transition-[transform,opacity,filter] duration-300 select-none active:scale-95 disabled:opacity-100 ${
                    state.choiceCount === 3 && index === 2 ? "col-span-2" : ""
                  } ${dim ? "scale-90 opacity-30 saturate-50" : ""} ${chosen ? "animate-winner" : ""}`}
                  style={{ background: tileBackground(index), animationDelay: chosen ? undefined : `${index * 0.07}s` }}
                >
                  <Shape
                    shape={look.shape}
                    className={`h-24 w-24 drop-shadow-[0_4px_0_rgb(0_0_0/0.3)] sm:h-32 sm:w-32 ${chosen ? "animate-heartbeat" : ""}`}
                  />
                  {chosen && (
                    <span className="animate-pop absolute bottom-4 rounded-full bg-black/35 px-4 py-1 font-display text-2xl">
                      Locked in ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {state.phase === "question" && state.choiceCount === 0 && (
        <Center title="Get ready" detail="Look at the projector." />
      )}

      {state.phase === "reveal" && <Result key={state.questionIndex} state={state} />}
      {state.phase === "leaderboard" && (
        <Rank key={`lb-${state.questionIndex}`} state={state} heading="Your place" />
      )}
      {state.phase === "finished" && <Rank state={state} heading="Final place" finale />}
    </FestiveScreen>
  );
}

function Result({ state }: { state: PublicState }) {
  const points = useCountUp(state.pointsEarned ?? 0, 1000);
  if (state.correct === null) {
    return <Center title="Checking your answer" detail="Hold on." />;
  }
  const title = !state.answered ? "Time's up!" : state.correct ? "Correct!" : "Not this time";
  const detail =
    !state.correct && state.correctIndex != null
      ? `The answer was ${answerName(state.correctIndex)}.`
      : state.correct
        ? "Shubha! Look at the projector."
        : "No points this round.";
  const badge = !state.answered ? "⏳" : state.correct ? "✓" : "✕";

  return (
    <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
      {state.correct && (
        <>
          <Fireworks count={4} />
          <PetalShower count={24} />
        </>
      )}
      <span
        className={`relative grid h-32 w-32 place-items-center rounded-full font-display text-7xl ${
          state.correct
            ? "animate-pop bg-linear-to-br from-[#3ccf1f] to-[#175c06] text-white shadow-[0_0_60px_10px_rgb(60_207_31/0.45)]"
            : "animate-shake bg-linear-to-br from-sindoor to-[#7a0d1f] text-white shadow-[0_0_50px_6px_rgb(224_36_60/0.4)]"
        }`}
      >
        {badge}
      </span>
      <h1 className={`animate-pop relative mt-6 font-display text-6xl ${state.correct ? "gold-text" : "text-gold"}`}>
        {title}
      </h1>
      <p className="relative mt-3 max-w-xs text-2xl text-cream/85">{detail}</p>
      {state.pointsEarned != null && state.pointsEarned > 0 && (
        <p className="animate-pop glow-text relative mt-6 font-display text-7xl text-gold tabular-nums">
          +{formatScore(points)}
        </p>
      )}
    </section>
  );
}

function Rank({
  state,
  heading,
  finale = false,
}: {
  state: PublicState;
  heading: string;
  finale?: boolean;
}) {
  const score = useCountUp(state.score, 1400);
  const podium = state.rank != null && state.rank <= 3;
  return (
    <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
      {finale && podium && (
        <>
          <Fireworks count={5} />
          <PetalShower count={30} />
        </>
      )}
      {finale && <Greeting className="animate-rise relative mb-4 text-3xl" />}
      <p className="relative text-xl tracking-[0.2em] text-cream/70 uppercase">{heading}</p>
      <div className={`animate-pop relative grid h-48 w-48 place-items-center rounded-full bg-maroon-deep/70 shadow-[0_0_0_6px_#ffcf5a,0_0_60px_10px_rgb(255_138_0/0.4)] ${podium ? "mt-14" : "mt-3"}`}>
        {podium && <span className="animate-crown absolute -top-10 text-5xl">👑</span>}
        <span className="gold-text font-display text-7xl leading-none">
          {state.rank ? placeLabel(state.rank) : "…"}
        </span>
      </div>
      <p className="relative mt-6 font-display text-4xl tabular-nums">{formatScore(score)} points</p>
      {!finale && state.pointsEarned != null && (
        <p className="relative mt-2 text-xl text-cream/70">+{formatScore(state.pointsEarned)} this round</p>
      )}
    </section>
  );
}

function Center({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
      <Diyo className="animate-bob w-24" />
      <h1 className="animate-pop gold-text mt-2 font-display text-5xl">{title}</h1>
      <p className="mt-4 text-2xl text-cream/80">{detail}</p>
    </section>
  );
}
