import type { CSSProperties } from "react";

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/** Deterministic pseudo-random so server and client render identical markup. */
function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const STARS = (() => {
  const rand = seeded(7);
  return Array.from({ length: 46 }, () => ({
    left: rand() * 100,
    top: rand() * 70,
    size: 1.5 + rand() * 2.5,
    dur: 2 + rand() * 3,
    delay: rand() * 4,
  }));
})();

const EMBERS = (() => {
  const rand = seeded(21);
  return Array.from({ length: 22 }, () => ({
    left: rand() * 100,
    size: 3 + rand() * 5,
    dur: 8 + rand() * 9,
    delay: -rand() * 16,
    dx: (rand() - 0.5) * 120,
    hue: rand() > 0.5 ? "#ffcf5a" : "#ff8a00",
  }));
})();

const PETAL_COLORS = ["#ff8a00", "#ffcf5a", "#ff6a00", "#e0243c", "#ffb340"];

/* ---------------------------------------------------------------- Backdrop */

export function FestivalBackdrop({
  variant = "full",
}: {
  variant?: "full" | "lobby" | "quiet" | "stage";
}) {
  const quiet = variant === "quiet" || variant === "stage";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      {/* Kojagrat full moon */}
      <div
        className="absolute top-[9%] right-[4%] h-16 w-16 rounded-full sm:right-[10%] sm:h-40 sm:w-40"
        style={{
          background: "radial-gradient(circle at 38% 36%, #fff8e1, #ffe7a3 45%, #f5b94a 100%)",
          boxShadow: "0 0 80px 30px rgb(255 207 90 / 0.25), 0 0 200px 80px rgb(255 138 0 / 0.12)",
          opacity: variant === "stage" ? 0.25 : 0.85,
        }}
      />

      {STARS.map((star, index) => (
        <span
          key={index}
          className="animate-twinkle absolute rounded-full bg-[#fff1b8]"
          style={
            {
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: star.size,
              height: star.size,
              boxShadow: "0 0 6px #ffcf5a",
              "--dur": `${star.dur}s`,
              "--delay": `${star.delay}s`,
            } as Vars
          }
        />
      ))}

      <Rangoli
        className={`animate-spin-slow absolute top-1/2 left-1/2 w-[130vmin] -translate-x-1/2 -translate-y-1/2 ${
          quiet ? "opacity-[0.07]" : "opacity-[0.12]"
        }`}
      />

      {variant !== "stage" && (
        <>
          <Kite
            colors={["#e0243c", "#ffcf5a", "#fff6e4"]}
            className={
              variant === "lobby"
                ? "absolute top-[52%] left-[60%] hidden w-20 lg:block"
                : "absolute top-[14%] left-[3%] w-20 sm:w-32"
            }
            style={{ "--r": "-14deg", "--dur": "13s" } as Vars}
          />
          <Kite
            colors={["#1368ce", "#ff8a00", "#fff6e4"]}
            className="absolute top-[30%] right-[4%] w-16 sm:w-24"
            style={{ "--r": "12deg", "--dur": "16s", "--delay": "-4s" } as Vars}
          />
          {!quiet && (
            <>
              <Kite
                colors={["#26890c", "#ffcf5a", "#e0243c"]}
                className="absolute top-[4%] left-[38%] hidden w-14 sm:block"
                style={{ "--r": "-4deg", "--dur": "18s", "--delay": "-7s" } as Vars}
              />
              <Kite
                colors={["#ff8a00", "#e0243c", "#fff6e4"]}
                className={`absolute top-[46%] left-[12%] hidden w-12 ${variant === "lobby" ? "" : "lg:block"}`}
                style={{ "--r": "8deg", "--dur": "15s", "--delay": "-2s" } as Vars}
              />
            </>
          )}
        </>
      )}

      {EMBERS.slice(0, quiet ? 10 : EMBERS.length).map((ember, index) => (
        <span
          key={index}
          className="animate-ember absolute bottom-0 rounded-full"
          style={
            {
              left: `${ember.left}%`,
              width: ember.size,
              height: ember.size,
              background: ember.hue,
              boxShadow: `0 0 10px 2px ${ember.hue}`,
              "--dur": `${ember.dur}s`,
              "--delay": `${ember.delay}s`,
              "--dx": `${ember.dx}px`,
            } as Vars
          }
        />
      ))}

      {variant !== "stage" && <DiyoRow count={quiet ? 5 : 7} />}
    </div>
  );
}

/* ---------------------------------------------------------------- Toran */

/** A marigold-and-mango-leaf garland hung across the top of the screen. */
export function Toran({ className = "" }: { className?: string }) {
  const strands = Array.from({ length: 22 }, (_, index) => index);
  return (
    <div aria-hidden className={`pointer-events-none relative z-20 h-14 w-full shrink-0 sm:h-20 ${className}`}>
      <div
        className="absolute inset-x-0 top-0 h-3"
        style={{
          background:
            "repeating-linear-gradient(90deg, #ff8a00 0 14px, #ffcf5a 14px 28px, #e0243c 28px 42px)",
          boxShadow: "0 4px 12px rgb(0 0 0 / 0.4)",
        }}
      />
      <div className="absolute inset-x-0 top-2 flex justify-around">
        {strands.map((index) => {
          const long = index % 2 === 0;
          return (
            <div
              key={index}
              className={`animate-swing flex flex-col items-center ${index % 3 === 2 ? "hidden sm:flex" : ""}`}
              style={{ "--dur": `${3.2 + (index % 4) * 0.5}s`, "--delay": `${-index * 0.37}s` } as Vars}
            >
              <Leaf />
              {Array.from({ length: long ? 3 : 2 }, (_, bead) => (
                <Marigold
                  key={bead}
                  className="-mt-1 h-4 w-4 sm:h-5 sm:w-5"
                  tone={(index + bead) % 3}
                />
              ))}
              {long && <span className="mt-0.5 h-2 w-1.5 rounded-b-full bg-[#e0243c]" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Leaf() {
  return (
    <svg viewBox="0 0 20 30" className="h-4 w-3 sm:h-5 sm:w-4">
      <path d="M10 0 C20 10 16 24 10 30 C4 24 0 10 10 0Z" fill="#2f7d1f" />
      <path d="M10 3 L10 27" stroke="#8cc04a" strokeWidth="1.2" />
    </svg>
  );
}

export function Marigold({ className = "", tone = 0 }: { className?: string; tone?: number }) {
  const palettes = [
    ["#ff8a00", "#ffb340", "#c25400"],
    ["#ffcf5a", "#ffe08a", "#d38a00"],
    ["#ff6a00", "#ff9d1c", "#b43d00"],
  ];
  const [outer, inner, core] = palettes[tone % palettes.length];
  return (
    <svg viewBox="0 0 40 40" className={className}>
      {Array.from({ length: 12 }, (_, index) => (
        <ellipse
          key={index}
          cx="20"
          cy="9"
          rx="5"
          ry="9"
          fill={outer}
          transform={`rotate(${index * 30} 20 20)`}
        />
      ))}
      {Array.from({ length: 8 }, (_, index) => (
        <ellipse
          key={`i${index}`}
          cx="20"
          cy="13"
          rx="4"
          ry="7"
          fill={inner}
          transform={`rotate(${index * 45 + 20} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="5" fill={core} />
    </svg>
  );
}

/* ---------------------------------------------------------------- Kite */

export function Kite({
  className = "",
  colors,
  style,
}: {
  className?: string;
  colors: [string, string, string];
  style?: CSSProperties;
}) {
  const [main, accent, light] = colors;
  return (
    <div className={`animate-kite ${className}`} style={style}>
      <svg viewBox="0 0 120 140" className="w-full drop-shadow-[0_10px_20px_rgb(0_0_0/0.45)]">
        <polygon points="60,4 112,62 60,128 8,62" fill={main} />
        <polygon points="60,4 112,62 60,62" fill={accent} />
        <polygon points="8,62 60,62 60,128" fill={light} opacity="0.4" />
        <circle cx="60" cy="62" r="9" fill={light} opacity="0.85" />
        <line x1="60" y1="4" x2="60" y2="128" stroke="#2b070e" strokeOpacity="0.35" strokeWidth="2" />
        <line x1="8" y1="62" x2="112" y2="62" stroke="#2b070e" strokeOpacity="0.35" strokeWidth="2" />
      </svg>
      <svg viewBox="0 0 40 90" className="animate-tail -mt-1 ml-[38%] w-[28%]">
        <path d="M20 0 C8 20 32 34 18 52 C6 68 28 76 20 90" fill="none" stroke={accent} strokeWidth="2.5" />
        <polygon points="14,24 26,20 22,32" fill={main} />
        <polygon points="12,52 24,48 20,60" fill={accent} />
        <polygon points="16,78 28,74 24,86" fill={main} />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------------- Diyo */

export function Diyo({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <svg viewBox="0 0 120 120" className={className} style={{ "--delay": `${delay}s` } as Vars}>
      <defs>
        <radialGradient id="diyo-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffcf5a" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ff8a00" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="diyo-flame" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ff6a00" />
          <stop offset="55%" stopColor="#ffcf5a" />
          <stop offset="100%" stopColor="#fff8e1" />
        </linearGradient>
        <linearGradient id="diyo-clay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e07a2e" />
          <stop offset="100%" stopColor="#8a3410" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="46" r="36" fill="url(#diyo-halo)" className="animate-halo" />
      <path d="M14 74 Q60 70 106 74 Q96 104 60 106 Q24 104 14 74Z" fill="url(#diyo-clay)" />
      <path d="M14 74 Q60 82 106 74" fill="none" stroke="#ffcf5a" strokeWidth="3" />
      <circle cx="40" cy="90" r="3" fill="#ffcf5a" />
      <circle cx="60" cy="94" r="3" fill="#ffcf5a" />
      <circle cx="80" cy="90" r="3" fill="#ffcf5a" />
      <path
        className="animate-flicker"
        d="M60 74 C46 62 52 44 60 24 C68 44 74 62 60 74Z"
        fill="url(#diyo-flame)"
      />
      <path className="animate-flicker" d="M60 70 C55 62 57 52 60 44 C63 52 65 62 60 70Z" fill="#fff8e1" />
    </svg>
  );
}

function DiyoRow({ count }: { count: number }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-end justify-around px-2">
      {Array.from({ length: count }, (_, index) => (
        <Diyo
          key={index}
          delay={-index * 0.31}
          className={`w-12 sm:w-16 lg:w-20 ${index % 2 === 1 ? "mb-2 hidden sm:block" : ""}`}
        />
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- Rangoli */

export function Rangoli({ className = "" }: { className?: string }) {
  const rings = [
    { count: 8, r: 88, rx: 22, ry: 46, color: "#ff8a00" },
    { count: 12, r: 64, rx: 14, ry: 30, color: "#e0243c" },
    { count: 16, r: 44, rx: 9, ry: 20, color: "#ffcf5a" },
    { count: 8, r: 26, rx: 8, ry: 14, color: "#b7d36a" },
  ];
  return (
    <svg viewBox="-200 -200 400 400" className={className} aria-hidden>
      <circle r="190" fill="none" stroke="#ffcf5a" strokeWidth="3" strokeDasharray="2 10" />
      <circle r="168" fill="none" stroke="#ff8a00" strokeWidth="2" />
      {Array.from({ length: 24 }, (_, index) => (
        <circle
          key={`d${index}`}
          cx="0"
          cy="-178"
          r="5"
          fill={index % 2 ? "#e0243c" : "#ffcf5a"}
          transform={`rotate(${index * 15})`}
        />
      ))}
      {rings.map((ring, ringIndex) =>
        Array.from({ length: ring.count }, (_, index) => (
          <ellipse
            key={`${ringIndex}-${index}`}
            cx="0"
            cy={-ring.r}
            rx={ring.rx}
            ry={ring.ry}
            fill={ring.color}
            opacity={0.9}
            transform={`rotate(${(360 / ring.count) * index + (ringIndex % 2) * (180 / ring.count)})`}
          />
        )),
      )}
      <circle r="18" fill="#ffcf5a" />
      <circle r="9" fill="#e0243c" />
    </svg>
  );
}

/* ---------------------------------------------------------------- Celebrations */

const BURSTS = [
  { left: 18, top: 24, color: "#ffcf5a", delay: 0 },
  { left: 78, top: 18, color: "#e0243c", delay: 0.6 },
  { left: 50, top: 12, color: "#ff8a00", delay: 1.1 },
  { left: 30, top: 42, color: "#b7d36a", delay: 1.7 },
  { left: 70, top: 40, color: "#fff1b8", delay: 2.2 },
  { left: 88, top: 58, color: "#ffcf5a", delay: 0.9 },
  { left: 10, top: 60, color: "#ff8a00", delay: 2.6 },
];

/** Tihar fireworks: looping radial bursts. */
export function Fireworks({ count = 5, className = "" }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}>
      {BURSTS.slice(0, count).map((burst, index) => (
        <div key={index} className="absolute" style={{ left: `${burst.left}%`, top: `${burst.top}%` }}>
          {Array.from({ length: 14 }, (_, spark) => (
            <span
              key={spark}
              className="animate-burst absolute -mt-1 -ml-1 h-2 w-2 rounded-full"
              style={
                {
                  background: burst.color,
                  boxShadow: `0 0 10px 3px ${burst.color}`,
                  "--a": `${(360 / 14) * spark}deg`,
                  "--d": `${90 + (spark % 3) * 30}px`,
                  "--dur": "2.4s",
                  "--delay": `${burst.delay}s`,
                } as Vars
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Marigold petals drifting down. */
export function PetalShower({ count = 28, className = "" }: { count?: number; className?: string }) {
  const rand = seeded(count * 13 + 5);
  const petals = Array.from({ length: count }, () => ({
    left: rand() * 100,
    w: 8 + rand() * 10,
    dur: 4.5 + rand() * 4,
    delay: -rand() * 8,
    dx: (rand() - 0.5) * 160,
    spin: 360 + rand() * 540,
    color: PETAL_COLORS[Math.floor(rand() * PETAL_COLORS.length)],
  }));
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 z-30 overflow-hidden ${className}`}>
      {petals.map((petal, index) => (
        <span
          key={index}
          className="animate-petal absolute top-0"
          style={
            {
              left: `${petal.left}%`,
              width: petal.w,
              height: petal.w * 1.5,
              background: petal.color,
              borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%",
              "--dur": `${petal.dur}s`,
              "--delay": `${petal.delay}s`,
              "--dx": `${petal.dx}px`,
              "--spin": `${petal.spin}deg`,
            } as Vars
          }
        />
      ))}
    </div>
  );
}
