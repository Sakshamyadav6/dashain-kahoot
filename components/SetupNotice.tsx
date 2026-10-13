import { FestiveScreen, Greeting } from "@/components/ui";

export function SetupNotice() {
  return (
    <FestiveScreen variant="quiet">
      <div className="relative z-10 mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-6 py-16">
        <div className="glass animate-rise flex flex-col gap-4 rounded-4xl p-8">
          <Greeting className="text-2xl" />
          <h1 className="font-display text-5xl leading-none">Connect Supabase</h1>
          <p className="text-lg text-cream/80">
            Add your project URL and anon key to <code className="text-gold">.env.local</code>, then
            restart the dev server. The README has the full setup, including the SQL to run once.
          </p>
        </div>
      </div>
    </FestiveScreen>
  );
}
