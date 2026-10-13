import { getSupabase, messageFrom } from "@/lib/supabase";
import type {
  CreateGameResult,
  HostAction,
  HostSnapshot,
  JoinGameResult,
  PublicState,
  QuizFile,
} from "@/lib/types";

async function rpc<T>(fn: string, args: Record<string, unknown>) {
  const supabase = getSupabase();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(messageFrom(error));
  if (data == null) throw new Error("Empty response from the server");
  return data as T;
}

export function createGame(password: string, quiz: QuizFile) {
  return rpc<CreateGameResult>("create_game", {
    p_password: password,
    p_questions: quiz,
  });
}

export function joinGame(pin: string, nickname: string) {
  return rpc<JoinGameResult>("join_game", {
    p_pin: pin,
    p_nickname: nickname,
  });
}

export function hostSnapshot(hostToken: string) {
  return rpc<HostSnapshot>("host_snapshot", { p_host_token: hostToken });
}

export function publicState(playerToken: string) {
  return rpc<PublicState>("public_state", { p_player_token: playerToken });
}

export function hostAction(hostToken: string, action: HostAction) {
  return rpc<HostSnapshot>("host_action", {
    p_host_token: hostToken,
    p_action: action,
  });
}

export function submitAnswer(playerToken: string, choice: number) {
  return rpc<{ accepted: boolean }>("submit_answer", {
    p_player_token: playerToken,
    p_choice: choice,
  });
}
