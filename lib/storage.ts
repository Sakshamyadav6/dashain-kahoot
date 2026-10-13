const HOST_KEY = "dashain-tihar-host";
const PLAYER_KEY = "dashain-tihar-player";

export type HostSession = {
  hostToken: string;
  pin: string;
};

export type PlayerSession = {
  playerToken: string;
  pin: string;
  nickname: string;
};

export function loadHost(): HostSession | null {
  return read(HOST_KEY, (value): value is HostSession => {
    return typeof value.hostToken === "string" && typeof value.pin === "string";
  });
}

export function saveHost(session: HostSession) {
  window.localStorage.setItem(HOST_KEY, JSON.stringify(session));
}

export function clearHost() {
  window.localStorage.removeItem(HOST_KEY);
}

export function loadPlayer(): PlayerSession | null {
  return read(PLAYER_KEY, (value): value is PlayerSession => {
    return (
      typeof value.playerToken === "string" &&
      typeof value.pin === "string" &&
      typeof value.nickname === "string"
    );
  });
}

export function savePlayer(session: PlayerSession) {
  window.localStorage.setItem(PLAYER_KEY, JSON.stringify(session));
}

export function clearPlayer() {
  window.localStorage.removeItem(PLAYER_KEY);
}

function read<T extends object>(key: string, guard: (value: Partial<T>) => value is T): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<T>;
    return guard(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
