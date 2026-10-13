import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Diyo, FestivalBackdrop, Toran } from "@/components/festival";

export const goldClass =
  "btn-gold inline-flex cursor-pointer items-center justify-center rounded-full px-7 py-3 text-center font-display text-2xl tracking-wide text-maroon-deep disabled:cursor-not-allowed disabled:opacity-50 disabled:saturate-50";

export const ghostClass =
  "btn-ghost inline-flex cursor-pointer items-center justify-center rounded-full px-6 py-3 text-center font-display text-2xl tracking-wide text-gold disabled:cursor-not-allowed disabled:opacity-50";

export const fieldClass =
  "min-h-14 w-full rounded-2xl border-2 border-gold/30 bg-maroon-deep/60 px-4 text-lg text-cream outline-none transition placeholder:text-cream/35 focus:border-gold focus:bg-maroon-deep/80 focus:shadow-[0_0_0_6px_rgb(255_207_90/0.15)]";

export function GoldButton({
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`${goldClass} ${className}`} {...props} />;
}

export function GhostButton({
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={`${ghostClass} ${className}`} {...props} />;
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="animate-shake rounded-2xl border border-sindoor/50 bg-sindoor/20 px-4 py-3 text-lg text-gold"
    >
      {message}
    </p>
  );
}

export function Greeting({ className = "" }: { className?: string }) {
  return (
    <p lang="ne" className={`font-festive gold-text leading-normal ${className}`}>
      शुभ दशैं · शुभ तिहार
    </p>
  );
}

/** Full-height festive page: garland on top, animated sky behind. */
export function FestiveScreen({
  children,
  variant = "full",
  className = "",
}: {
  children: ReactNode;
  variant?: "full" | "lobby" | "quiet" | "stage";
  className?: string;
}) {
  return (
    <main className={`relative isolate flex min-h-dvh flex-col overflow-x-clip ${className}`}>
      <FestivalBackdrop variant={variant} />
      <Toran />
      {children}
    </main>
  );
}

export function LoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <FestiveScreen variant="quiet">
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-4">
        <Diyo className="animate-bob w-28" />
        <p className="font-display text-3xl text-gold glow-text">{label}…</p>
      </div>
    </FestiveScreen>
  );
}
