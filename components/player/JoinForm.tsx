"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { SetupNotice } from "@/components/SetupNotice";
import { Kite } from "@/components/festival";
import {
  ErrorNote,
  FestiveScreen,
  GoldButton,
  Greeting,
  fieldClass,
  ghostClass,
} from "@/components/ui";
import { joinGame } from "@/lib/api";
import { normalizePin } from "@/lib/quiz";
import { loadPlayer, savePlayer, type PlayerSession } from "@/lib/storage";
import { hasSupabaseEnv, messageFrom } from "@/lib/supabase";

export function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const nickRef = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [existing, setExisting] = useState<PlayerSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fromQuery = normalizePin(params.get("pin") ?? "");
    const id = window.setTimeout(() => {
      if (fromQuery) setPin(fromQuery);
      setExisting(loadPlayer());
      if (fromQuery.length === 6) nickRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [params]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const cleanName = nickname.trim().replace(/\s+/g, " ");
      const result = await joinGame(pin, cleanName);
      savePlayer({
        playerToken: result.playerToken,
        pin: result.state.pin,
        nickname: result.state.nickname,
      });
      router.push("/play");
    } catch (caught) {
      setError(messageFrom(caught));
      setBusy(false);
    }
  }

  if (!hasSupabaseEnv()) return <SetupNotice />;

  const sameRoom = existing && existing.pin === pin && pin.length === 6;

  return (
    <FestiveScreen variant="quiet">
      <form
        onSubmit={submit}
        className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pt-4 pb-24"
      >
        <div className="glass animate-rise relative flex flex-col gap-5 rounded-4xl p-6 sm:p-8">
          <Kite
            colors={["#e0243c", "#ffcf5a", "#fff6e4"]}
            className="absolute -top-14 -right-3 w-16"
            style={{ "--r": "14deg", "--dur": "9s" } as CSSProperties}
          />
          <div>
            <Greeting className="text-2xl" />
            <h1 className="font-display text-5xl leading-none">Join the quiz</h1>
          </div>
          <label className="grid grid-cols-1 gap-2 text-lg">
            Game PIN
            <input
              inputMode="numeric"
              autoComplete="off"
              autoFocus={pin.length !== 6}
              value={pin}
              onChange={(event) => setPin(normalizePin(event.target.value))}
              placeholder="000000"
              className={`${fieldClass} min-h-18 text-center font-display text-4xl tracking-[0.35em] text-gold`}
              required
            />
          </label>
          <label className="grid grid-cols-1 gap-2 text-lg">
            Nickname
            <input
              ref={nickRef}
              autoComplete="nickname"
              autoCapitalize="words"
              maxLength={16}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Your name"
              className={`${fieldClass} text-xl`}
              required
            />
          </label>
          <ErrorNote message={error} />
          <GoldButton type="submit" disabled={busy || pin.length !== 6} className="min-h-16 text-3xl">
            {busy ? "Joining…" : "Let's play!"}
          </GoldButton>
          {sameRoom && (
            <Link href="/play" className={`${ghostClass} min-h-14 text-xl`}>
              Continue as {existing.nickname}
            </Link>
          )}
        </div>
      </form>
    </FestiveScreen>
  );
}
