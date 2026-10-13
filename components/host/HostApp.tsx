"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { HostSetup } from "@/components/host/HostSetup";
import { HostStage } from "@/components/host/HostStage";
import { SetupNotice } from "@/components/SetupNotice";
import { LoadingScreen } from "@/components/ui";
import { createGame, hostAction, hostSnapshot } from "@/lib/api";
import { toPhasePing } from "@/lib/state";
import { clearHost, loadHost, saveHost } from "@/lib/storage";
import { getSupabase, hasSupabaseEnv, messageFrom } from "@/lib/supabase";
import { remainingMs, useServerClock } from "@/lib/time";
import type { HostAction, HostSnapshot, QuizFile } from "@/lib/types";

export default function HostApp() {
  const [mode, setMode] = useState<"loading" | "setup" | "live">("loading");
  const [token, setToken] = useState<string | null>(null);
  const [snap, setSnap] = useState<HostSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  const gen = useRef(0);
  const lock = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const subscribed = useRef(false);
  const clock = useServerClock(snap?.serverNow ?? null);

  const publish = useCallback((next: HostSnapshot) => {
    const channel = channelRef.current;
    if (!channel || !subscribed.current) return;
    void channel.send({
      type: "broadcast",
      event: "phase",
      payload: toPhasePing(next),
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return;
    const ticket = ++gen.current;
    try {
      const next = await hostSnapshot(token);
      if (ticket !== gen.current) return;
      setSnap((current) => {
        if (current && next.revision < current.revision) return current;
        return next;
      });
    } catch (caught) {
      if (ticket !== gen.current) return;
      setError(messageFrom(caught));
    }
  }, [token]);

  const run = useCallback(
    async (action: HostAction, quiet = false) => {
      if (!token || lock.current) return;
      lock.current = true;
      setBusy(true);
      try {
        const next = await hostAction(token, action);
        gen.current += 1;
        setSnap(next);
        publish(next);
        setError(null);
      } catch (caught) {
        const message = messageFrom(caught);
        if (!(quiet && message === "There is no question to reveal")) {
          setError(message);
        }
        try {
          const fresh = await hostSnapshot(token);
          gen.current += 1;
          setSnap((current) => {
            if (current && fresh.revision < current.revision) return current;
            return fresh;
          });
        } catch {
          // The action error is already on screen.
        }
      } finally {
        lock.current = false;
        setBusy(false);
      }
    },
    [publish, token],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setOrigin(window.location.origin), 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (!hasSupabaseEnv()) {
        setMode("setup");
        return;
      }
      const saved = loadHost();
      if (!saved) {
        setMode("setup");
        return;
      }
      void hostSnapshot(saved.hostToken)
        .then((next) => {
          if (cancelled) return;
          setToken(saved.hostToken);
          setSnap(next);
          setMode("live");
        })
        .catch(() => {
          if (cancelled) return;
          clearHost();
          setMode("setup");
        });
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (!snap?.pin || !hasSupabaseEnv()) return;
    const supabase = getSupabase();
    const channel = supabase.channel(`game:${snap.pin}`);
    channel.subscribe((status) => {
      subscribed.current = status === "SUBSCRIBED";
    });
    channelRef.current = channel;
    return () => {
      subscribed.current = false;
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [snap?.pin]);

  useEffect(() => {
    if (mode !== "live" || !token) return;
    const id = window.setInterval(() => {
      void refresh();
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, refresh, token]);

  useEffect(() => {
    if (mode !== "live" || !("wakeLock" in navigator)) return;
    let released = false;
    let sentinel: WakeLockSentinel | undefined;
    const acquire = () => {
      void navigator.wakeLock
        .request("screen")
        .then((next) => {
          if (released) {
            void next.release();
            return;
          }
          sentinel = next;
        })
        .catch(() => {});
    };
    acquire();
    const onVisible = () => {
      if (document.visibilityState === "visible") acquire();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisible);
      void sentinel?.release();
    };
  }, [mode]);

  useEffect(() => {
    if (clock <= 0 || snap?.status !== "question" || !snap.endsAt) return;
    if (remainingMs(snap.endsAt, clock) > 0) return;
    let cancelled = false;
    const id = window.setTimeout(() => {
      if (!cancelled) void run("reveal", true);
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [clock, run, snap?.endsAt, snap?.status]);

  const joinUrl = snap && origin ? `${origin}/join?pin=${snap.pin}` : "";

  async function onCreate(password: string, quiz: QuizFile) {
    const created = await createGame(password, quiz);
    const next = await hostSnapshot(created.hostToken);
    saveHost({ hostToken: created.hostToken, pin: created.pin });
    setToken(created.hostToken);
    setSnap(next);
    setError(null);
    setMode("live");
  }

  function onNewGame() {
    if (snap && snap.status !== "finished") {
      const leave = window.confirm(
        "Close this room and set up a new one? Players will need a new QR code.",
      );
      if (!leave) return;
    }
    clearHost();
    setToken(null);
    setSnap(null);
    setError(null);
    setMode("setup");
  }

  async function onCopy() {
    if (!joinUrl) return;
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy the link. Select it under the QR code.");
    }
  }

  if (!hasSupabaseEnv()) return <SetupNotice />;
  if (mode === "loading" || (mode === "live" && !snap)) return <LoadingScreen label="Opening the room" />;
  if (mode === "setup" || !snap) return <HostSetup onCreate={onCreate} />;

  return (
    <HostStage
      snap={snap}
      joinUrl={joinUrl}
      busy={busy}
      error={error}
      copied={copied}
      onAction={(action) => void run(action)}
      onNewGame={onNewGame}
      onCopy={() => void onCopy()}
    />
  );
}
