import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export function getSupabase() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error("Missing Supabase keys. Add them to .env.local and restart the server.");
  }

  client = createClient(url, key, {
    realtime: { params: { eventsPerSecond: 20 } },
  });
  return client;
}

export function messageFrom(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim().split("\n")[0];
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim().split("\n")[0];
    }
  }
  return "Something went wrong";
}
