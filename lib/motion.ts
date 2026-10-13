"use client";

import { useEffect, useRef, useState } from "react";

/** Animates a number from its previous value to `target` with an ease-out curve. */
export function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(origin + (target - origin) * eased);
      setValue(next);
      if (t < 1) {
        frame = requestAnimationFrame(step);
      } else {
        from.current = target;
      }
    };
    frame = requestAnimationFrame(step);
    // rAF pauses in background tabs; make sure the real number always lands.
    const settle = window.setTimeout(() => {
      setValue(target);
      from.current = target;
    }, duration + 150);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      from.current = target;
    };
  }, [target, duration]);

  return value;
}
