"use client";

import type { CSSProperties } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Shape } from "@/components/Shapes";
import { Diyo, Fireworks, Kite, Marigold, PetalShower } from "@/components/festival";
import { ErrorNote, FestiveScreen, GhostButton, GoldButton, Greeting } from "@/components/ui";
import { ANSWER_LOOKS, tileBackground } from "@/lib/answers";
import { formatScore } from "@/lib/format";
import { useCountUp } from "@/lib/motion";
import { formatPin } from "@/lib/quiz";
import { remainingMs, useServerClock } from "@/lib/time";
import type { HostAction, HostSnapshot, Standing } from "@/lib/types";

export function HostStage({
  snap,
  joinUrl,
  busy,
  error,
  copied,
  onAction,
  onNewGame,
  onCopy,
}: {
  snap: HostSnapshot;
  joinUrl: string;
  busy: boolean;
  error: string | null;
  copied: boolean;
  onAction: (action: HostAction) => void;
  onNewGame: () => void;
  onCopy: () => void;
}) {
  if (snap.status === "lobby") {
    return (
      <Lobby
        snap={snap}
        joinUrl={joinUrl}
        busy={busy}
        error={error}
        copied={copied}
        onAction={onAction}
        onNewGame={onNewGame}
        onCopy={onCopy}
      />
    );
  }

  if (snap.status === "question" || snap.status === "reveal") {
    return (
      <QuestionBoard
        key={snap.questionIndex}
        snap={snap}
        busy={busy}
        error={error}
        onAction={onAction}
      />
    );
  }

  if (snap.status === "leaderboard") {
    return (
      <Leaderboard key={snap.questionIndex} snap={snap} busy={busy} error={error} onAction={onAction} />
    );
  }

  return <Podium snap={snap} error={error} onNewGame={onNewGame} />;
}

/* ---------------------------------------------------------------- Lobby */

function Lobby({
  snap,
  joinUrl,
  busy,
  error,
  copied,
  onAction,
  onNewGame,
  onCopy,
}: {
  snap: HostSnapshot;
  joinUrl: string;
  busy: boolean;
  error: string | null;
  copied: boolean;
  onAction: (action: HostAction) => void;
  onNewGame: () => void;
  onCopy: () => void;
}) {
  return (
    <FestiveScreen variant="lobby">
      <div className="relative z-10 grid flex-1 items-center gap-8 px-6 pt-2 pb-4 lg:grid-cols-[1.35fr_0.65fr] lg:px-12">
        <section className="flex min-w-0 flex-col">
          <Greeting className="animate-rise text-2xl sm:text-3xl" />
          <h1
            className="animate-rise mt-1 font-display text-4xl leading-none sm:text-6xl"
            style={{ animationDelay: "0.1s" }}
          >
            {snap.title}
          </h1>

          <div
            className="glass animate-pop mt-6 self-start rounded-4xl px-8 py-5"
            style={{ animationDelay: "0.2s" }}
          >
            <p className="text-xl tracking-[0.3em] text-cream/70 uppercase">Game PIN</p>
            <p
              className="gold-text font-display text-[clamp(4.5rem,11vw,9.5rem)] leading-none tracking-[0.12em]"
              aria-label={`Game PIN ${snap.pin.split("").join(" ")}`}
            >
              {formatPin(snap.pin)}
            </p>
          </div>

          <div className="mt-8 flex items-end gap-4">
            <p
              key={snap.playerCount}
              className="animate-pop glow-text font-display text-[clamp(4rem,8vw,7rem)] leading-none tabular-nums"
            >
              {snap.playerCount}
            </p>
            <p className="pb-3 text-2xl text-cream/75">
              {snap.playerCount === 1 ? "player has joined" : "players have joined"}
            </p>
          </div>

          <ul className="mt-4 flex max-h-[26vh] flex-wrap gap-2 overflow-y-auto pr-2">
            {snap.nicknames.length === 0 && (
              <li className="animate-heartbeat rounded-full bg-white/10 px-5 py-2 text-xl text-cream/70">
                Waiting for the first player…
              </li>
            )}
            {snap.nicknames.map((nickname, index) => (
              <li
                key={nickname}
                className="animate-pop flex items-center gap-2 rounded-full border border-gold/30 bg-linear-to-r from-marigold/30 to-sindoor/25 py-2 pr-5 pl-2 text-xl font-bold shadow-lg"
              >
                <Marigold className="h-7 w-7" tone={index % 3} />
                {nickname}
              </li>
            ))}
          </ul>
        </section>

        <section
          className="animate-rise relative mx-auto flex w-full max-w-sm flex-col items-center gap-4 rounded-4xl bg-cream p-6 text-maroon-deep shadow-[0_0_0_6px_#ffcf5a,0_0_0_12px_#e0243c,0_30px_80px_-20px_rgb(0_0_0/0.8)]"
          style={{ animationDelay: "0.3s" }}
        >
          <Marigold className="animate-spin-slow absolute -top-5 -left-5 h-12 w-12" />
          <Marigold className="animate-spin-slow absolute -top-5 -right-5 h-12 w-12" tone={1} />
          <Marigold className="animate-spin-slow absolute -bottom-5 -left-5 h-12 w-12" tone={2} />
          <Marigold className="animate-spin-slow absolute -right-5 -bottom-5 h-12 w-12" />
          <p className="font-display text-3xl">Scan to join</p>
          {joinUrl ? (
            <QRCodeSVG
              value={joinUrl}
              size={280}
              level="H"
              marginSize={2}
              bgColor="#fff6e4"
              fgColor="#1d040a"
              title="QR code to join the quiz"
              className="h-auto w-full max-w-[280px]"
            />
          ) : (
            <div className="aspect-square w-full max-w-[280px]" />
          )}
          <p className="max-w-full text-center text-base break-all select-all">{joinUrl}</p>
          <button
            type="button"
            onClick={onCopy}
            className="cursor-pointer rounded-full bg-maroon px-5 py-2 font-display text-xl text-cream transition hover:scale-105 active:scale-95"
          >
            {copied ? "Copied ✓" : "Copy join link"}
          </button>
        </section>
      </div>

      <footer className="relative z-10 flex flex-wrap items-center gap-4 px-6 pb-24 lg:px-12">
        <div className="min-w-[16rem] flex-1">
          <ErrorNote message={error} />
        </div>
        <GhostButton onClick={onNewGame}>New room</GhostButton>
        <GoldButton
          className={`min-h-16 px-10 text-3xl ${snap.playerCount > 0 ? "animate-pulse-ring" : ""}`}
          disabled={busy}
          onClick={() => onAction("start")}
        >
          Start quiz
        </GoldButton>
      </footer>
    </FestiveScreen>
  );
}

/* ---------------------------------------------------------------- Question */

function TimerRing({ seconds, percent }: { seconds: number; percent: number }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const color = seconds <= 5 ? "#e0243c" : seconds <= 10 ? "#ff8a00" : "#ffcf5a";
  return (
    <div className={`relative h-28 w-28 shrink-0 sm:h-32 sm:w-32 ${seconds <= 5 ? "animate-heartbeat" : ""}`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="rgb(29 4 10 / 0.75)" stroke="rgb(255 255 255 / 0.12)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.4s ease", filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center font-display text-5xl tabular-nums sm:text-6xl"
        style={{ color }}
      >
        {seconds}
      </span>
    </div>
  );
}

function QuestionBoard({
  snap,
  busy,
  error,
  onAction,
}: {
  snap: HostSnapshot;
  busy: boolean;
  error: string | null;
  onAction: (action: HostAction) => void;
}) {
  const clock = useServerClock(snap.status === "question" ? snap.serverNow : null);
  const durationMs = snap.durationMs ?? (snap.question?.seconds ?? 20) * 1000;
  const remaining =
    snap.status === "question" ? (clock > 0 ? remainingMs(snap.endsAt, clock) : durationMs) : 0;
  const percent = durationMs > 0 ? Math.max(0, Math.min(100, (remaining / durationMs) * 100)) : 0;
  const seconds = Math.ceil(remaining / 1000);
  const revealing = snap.status === "reveal";
  const totalAnswers = snap.answerCounts.reduce((sum, count) => sum + count, 0);
  const choices = snap.question?.choices ?? [];
  const answeredShare = snap.playerCount > 0 ? (snap.answeredCount / snap.playerCount) * 100 : 0;

  return (
    <FestiveScreen variant="stage" className="h-dvh">
      {revealing && <PetalShower count={22} />}

      <header className="relative z-10 flex items-center justify-between gap-4 px-6 lg:px-10">
        <div className="flex flex-col gap-2">
          <p className="font-display text-2xl text-cream/85 sm:text-3xl">
            Question <span className="text-gold">{snap.questionIndex + 1}</span>
            <span className="text-cream/50"> / {snap.questionCount}</span>
          </p>
          <div className="flex flex-wrap gap-1.5" aria-hidden>
            {Array.from({ length: Math.min(snap.questionCount, 30) }, (_, index) => (
              <span
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index < snap.questionIndex
                    ? "w-4 bg-gold"
                    : index === snap.questionIndex
                      ? "w-8 bg-marigold shadow-[0_0_10px_#ff8a00]"
                      : "w-4 bg-white/20"
                }`}
              />
            ))}
          </div>
        </div>
        {revealing ? (
          <p className="animate-pop gold-text font-display text-5xl sm:text-6xl">Answer!</p>
        ) : (
          <TimerRing seconds={seconds} percent={percent} />
        )}
      </header>

      <div className="relative z-10 flex min-h-0 flex-1 items-center px-6 py-4 lg:px-10">
        <h2 className="glass animate-pop max-h-full w-full overflow-y-auto rounded-4xl px-6 py-6 text-center text-[clamp(2rem,4.4vw,4.2rem)] leading-tight font-extrabold text-balance sm:px-10">
          {snap.question?.prompt}
        </h2>
      </div>

      <div
        className={`relative z-10 grid min-h-[36vh] grid-cols-2 gap-4 px-5 pb-3 ${
          choices.length <= 2 ? "grid-rows-1" : "grid-rows-2"
        }`}
      >
        {choices.map((choice, index) => {
          const look = ANSWER_LOOKS[index];
          const count = snap.answerCounts[index] ?? 0;
          const share = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
          const correct = revealing && snap.correctIndex === index;
          const dim = revealing && !correct;
          return (
            <article
              key={`${index}-${choice}`}
              className={`tile animate-pop flex h-full flex-col justify-between rounded-3xl p-4 text-white transition-[opacity,filter,transform] duration-500 sm:p-6 ${
                choices.length === 3 && index === 2 ? "col-span-2" : ""
              } ${dim ? "scale-[0.97] opacity-40 saturate-50" : ""} ${correct ? "animate-winner z-10" : ""}`}
              style={{ background: tileBackground(index), animationDelay: correct ? undefined : `${0.15 + index * 0.08}s` }}
            >
              <div className="flex items-start justify-between">
                <Shape
                  shape={look?.shape ?? "square"}
                  className="h-12 w-12 drop-shadow-[0_3px_0_rgb(0_0_0/0.3)] sm:h-16 sm:w-16"
                />
                {correct && (
                  <span className="animate-pop grid h-14 w-14 place-items-center rounded-full bg-cream text-4xl text-[#175c06] shadow-lg">
                    ✓
                  </span>
                )}
              </div>
              <p className="text-[clamp(1.2rem,2.5vw,2.3rem)] leading-tight font-extrabold text-balance [text-shadow:0_2px_0_rgb(0_0_0/0.3)]">
                {choice}
              </p>
              {revealing && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-5 flex-1 overflow-hidden rounded-full bg-black/30">
                    <div
                      className="animate-grow-x h-full rounded-full bg-white/90"
                      style={{ width: `${share}%`, animationDelay: `${0.2 + index * 0.1}s` }}
                    />
                  </div>
                  <span className="font-display text-3xl tabular-nums">{count}</span>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <footer className="relative z-10 flex flex-wrap items-center gap-4 px-6 pb-4 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="h-3 w-40 overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full rounded-full bg-linear-to-r from-gold to-marigold transition-[width] duration-500"
              style={{ width: `${answeredShare}%` }}
            />
          </div>
          <p className="text-2xl text-cream/85 tabular-nums">
            <span key={snap.answeredCount} className="animate-pop inline-block font-display text-gold">
              {snap.answeredCount}
            </span>{" "}
            / {snap.playerCount} answered
          </p>
        </div>
        <div className="min-w-[12rem] flex-1">
          <ErrorNote message={error} />
        </div>
        {revealing ? (
          <GoldButton disabled={busy} onClick={() => onAction("leaderboard")}>
            Leaderboard →
          </GoldButton>
        ) : (
          <GoldButton disabled={busy} onClick={() => onAction("reveal")}>
            Show answer
          </GoldButton>
        )}
      </footer>
    </FestiveScreen>
  );
}

/* ---------------------------------------------------------------- Leaderboard */

const MEDALS = ["#ffcf5a", "#e9e4da", "#e08a3c"];

function Score({ value, className = "" }: { value: number; className?: string }) {
  const shown = useCountUp(value, 1400);
  return <span className={`tabular-nums ${className}`}>{formatScore(shown)}</span>;
}

function Leaderboard({
  snap,
  busy,
  error,
  onAction,
}: {
  snap: HostSnapshot;
  busy: boolean;
  error: string | null;
  onAction: (action: HostAction) => void;
}) {
  const last = snap.questionIndex + 1 >= snap.questionCount;
  return (
    <FestiveScreen variant="quiet">
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 pb-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Greeting className="animate-rise text-2xl" />
            <h2 className="animate-rise gold-text font-display text-6xl leading-none sm:text-7xl">Top 10</h2>
            <p className="mt-2 text-xl text-cream/70">
              After question {snap.questionIndex + 1} of {snap.questionCount}
            </p>
          </div>
          <Kite
            colors={["#e0243c", "#ffcf5a", "#fff6e4"]}
            className="hidden w-20 sm:block"
            style={{ "--r": "10deg" } as CSSProperties}
          />
        </div>
        <ol className="mt-5 grid gap-3">
          {snap.top.slice(0, 3).map((row, index) => (
            <LeaderRow key={`${row.rank}-${row.nickname}`} row={row} index={index} />
          ))}
        </ol>
        {snap.top.length > 3 && (
          <ol className="mt-3 grid gap-2 sm:grid-cols-2">
            {snap.top.slice(3).map((row, index) => (
              <LeaderRow key={`${row.rank}-${row.nickname}`} row={row} index={index + 3} compact />
            ))}
          </ol>
        )}
        {snap.top.length === 0 && <p className="mt-8 text-2xl text-cream/70">No players yet.</p>}
        <div className="mt-auto flex flex-wrap items-center gap-4 pt-6">
          <div className="min-w-[12rem] flex-1">
            <ErrorNote message={error} />
          </div>
          <GoldButton className="min-h-16 px-8 text-3xl" disabled={busy} onClick={() => onAction("next")}>
            {last ? "Final results 🎆" : "Next question →"}
          </GoldButton>
        </div>
      </div>
    </FestiveScreen>
  );
}

function LeaderRow({ row, index, compact = false }: { row: Standing; index: number; compact?: boolean }) {
  const medal = row.rank <= 3 ? MEDALS[row.rank - 1] : null;
  const size = compact ? "text-2xl" : "text-3xl";
  return (
    <li
      className={`animate-slide grid items-center rounded-2xl ${
        compact ? "grid-cols-[2.5rem_1fr_auto] gap-3 px-4 py-2" : "grid-cols-[4rem_1fr_auto] gap-4 px-5 py-3"
      } ${
        medal
          ? "border border-gold/40 bg-linear-to-r from-gold/30 via-marigold/15 to-transparent shadow-[0_10px_30px_-12px_rgb(255_138_0/0.6)]"
          : "bg-white/8"
      }`}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <span
        className={`grid place-items-center rounded-full font-display ${compact ? "h-9 w-9" : "h-12 w-12"} ${size}`}
        style={
          medal
            ? { background: medal, color: "#1d040a", boxShadow: `0 0 18px ${medal}` }
            : { color: "#ffcf5a" }
        }
      >
        {row.rank}
      </span>
      <span className={`truncate font-extrabold ${size}`}>{row.nickname}</span>
      <Score value={row.score} className={`font-display ${size}`} />
    </li>
  );
}

/* ---------------------------------------------------------------- Podium */

function Podium({
  snap,
  error,
  onNewGame,
}: {
  snap: HostSnapshot;
  error: string | null;
  onNewGame: () => void;
}) {
  const slots = [
    { row: snap.top[1], height: "h-44", tone: "from-[#fff6e4] to-[#d8cdb8]", delay: 0.5 },
    { row: snap.top[0], height: "h-64", tone: "from-[#ffe08a] to-[#ff9d1c]", delay: 1.0 },
    { row: snap.top[2], height: "h-32", tone: "from-[#ffb36b] to-[#c25400]", delay: 0 },
  ].filter((slot): slot is typeof slot & { row: Standing } => Boolean(slot.row));
  const rest = snap.top.slice(3);

  return (
    <FestiveScreen>
      <Fireworks count={7} />
      <PetalShower count={36} />
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 pb-24 text-center">
        <Greeting className="animate-rise text-3xl sm:text-4xl" />
        <h2 className="animate-pop gold-text mt-1 font-display text-6xl leading-none sm:text-8xl">
          Final results
        </h2>

        <div className="mt-10 flex w-full max-w-3xl items-end justify-center gap-3 sm:gap-5">
          {slots.map((slot) => {
            const first = slot.row.rank === 1;
            return (
              <div key={slot.row.nickname} className="flex w-full max-w-60 flex-col items-center">
                <div
                  className="animate-pop flex flex-col items-center"
                  style={{ animationDelay: `${slot.delay + 0.8}s` }}
                >
                  {first && <span className="animate-crown mb-1 text-6xl">👑</span>}
                  <p className={`max-w-full truncate font-extrabold ${first ? "text-4xl" : "text-2xl"}`}>
                    {slot.row.nickname}
                  </p>
                  <Score value={slot.row.score} className="mb-3 font-display text-2xl text-gold" />
                </div>
                <div
                  className={`animate-grow-up relative flex w-full items-start justify-center overflow-hidden rounded-t-3xl bg-linear-to-b pt-4 text-maroon-deep shadow-[0_-10px_40px_-10px_rgb(255_207_90/0.6)] ${slot.height} ${slot.tone}`}
                  style={{ animationDelay: `${slot.delay}s` }}
                >
                  <span className="font-display text-6xl">{slot.row.rank}</span>
                  <Diyo className="absolute bottom-1 w-12 opacity-90" />
                </div>
              </div>
            );
          })}
        </div>
        {slots.length === 0 && <p className="mt-10 text-2xl text-cream/70">No players joined.</p>}

        {rest.length > 0 && (
          <ol className="mt-6 flex flex-wrap justify-center gap-2">
            {rest.map((row, index) => (
              <li
                key={`${row.rank}-${row.nickname}`}
                className="animate-rise rounded-full bg-white/10 px-4 py-2 text-lg"
                style={{ animationDelay: `${2 + index * 0.08}s` }}
              >
                <span className="font-display text-gold">{row.rank}.</span> {row.nickname} ·{" "}
                {formatScore(row.score)}
              </li>
            ))}
          </ol>
        )}

        <div className="mt-auto w-full max-w-md pt-8">
          <ErrorNote message={error} />
          <GoldButton className="mt-4 min-h-16 w-full" onClick={onNewGame}>
            New room
          </GoldButton>
        </div>
      </div>
    </FestiveScreen>
  );
}
