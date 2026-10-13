import Link from "next/link";
import { Shape } from "@/components/Shapes";
import { Rangoli } from "@/components/festival";
import { FestiveScreen, Greeting, ghostClass, goldClass } from "@/components/ui";
import { ANSWER_LOOKS, tileBackground } from "@/lib/answers";

export default function HomePage() {
  return (
    <FestiveScreen>
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 pt-2 pb-24 text-center">
        <div className="relative grid h-40 w-40 place-items-center sm:h-52 sm:w-52">
          <Rangoli className="animate-spin-slow absolute inset-0 h-full w-full opacity-90" />
          <div className="animate-pop relative grid h-24 w-24 place-items-center rounded-full bg-maroon-deep/80 shadow-[0_0_60px_10px_rgb(255_138_0/0.45)] sm:h-28 sm:w-28">
            <span lang="ne" className="font-festive gold-text text-5xl leading-none sm:text-6xl">
              ॐ
            </span>
          </div>
        </div>

        <Greeting className="animate-rise mt-4 text-3xl sm:text-4xl" />
        <h1
          className="animate-rise mt-2 font-display text-6xl leading-[0.95] sm:text-7xl lg:text-8xl"
          style={{ animationDelay: "0.12s" }}
        >
          <span className="gold-text">Dashain Tihar</span>
          <br />
          <span className="glow-text">Quiz Night</span>
        </h1>
        <p
          className="animate-rise mt-5 max-w-md text-xl text-cream/80"
          style={{ animationDelay: "0.24s" }}
        >
          Questions glow on the big screen. Your phone is the buzzer: tap the matching color, fast.
        </p>

        <div className="mt-6 flex gap-3" aria-hidden>
          {ANSWER_LOOKS.map((look, index) => (
            <span
              key={look.name}
              className="tile animate-pop grid h-12 w-12 place-items-center rounded-2xl text-white sm:h-14 sm:w-14"
              style={{ background: tileBackground(index), animationDelay: `${0.4 + index * 0.1}s` }}
            >
              <Shape shape={look.shape} className="animate-bob h-6 w-6" />
            </span>
          ))}
        </div>

        <div className="animate-rise mt-7 flex w-full max-w-md flex-col gap-4" style={{ animationDelay: "0.5s" }}>
          <Link href="/join" className={`${goldClass} min-h-16 w-full text-3xl`}>
            Join a game
          </Link>
          <Link href="/host" className={`${ghostClass} min-h-14 w-full`}>
            Host on the big screen
          </Link>
        </div>
      </div>
    </FestiveScreen>
  );
}
