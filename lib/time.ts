"use client";

import { useEffect, useState } from "react";

export function useServerClock(serverNow: string | null) {
  const [clock, setClock] = useState(0);

  useEffect(() => {
    const server = serverNow ? Date.parse(serverNow) : Number.NaN;
    const offset = Number.isNaN(server) ? 0 : server - Date.now();
    const tick = () => setClock(Date.now() + offset);
    const start = window.setTimeout(tick, 0);
    const id = window.setInterval(tick, 100);
    return () => {
      window.clearTimeout(start);
      window.clearInterval(id);
    };
  }, [serverNow]);

  return clock;
}

export function remainingMs(endsAt: string | null, serverClock: number) {
  if (!endsAt) return 0;
  const ends = Date.parse(endsAt);
  if (Number.isNaN(ends)) return 0;
  return Math.max(0, ends - serverClock);
}
