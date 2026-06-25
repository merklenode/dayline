export type PersistedTimerState = {
  activeTaskId: string | null;
  secondsLeft: number;
};

const TIMER_KEY = "dayline:timer";

export function loadTimerState(): PersistedTimerState {
  if (typeof window === "undefined") return { activeTaskId: null, secondsLeft: 0 };
  try {
    const raw = window.localStorage.getItem(TIMER_KEY);
    if (!raw) return { activeTaskId: null, secondsLeft: 0 };
    const parsed = JSON.parse(raw) as Partial<PersistedTimerState>;
    return {
      activeTaskId: parsed.activeTaskId ?? null,
      secondsLeft: parsed.secondsLeft ?? 0
    };
  } catch {
    return { activeTaskId: null, secondsLeft: 0 };
  }
}

export function saveTimerState(state: PersistedTimerState) {
  window.localStorage.setItem(TIMER_KEY, JSON.stringify(state));
}

export function clearTimerState() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TIMER_KEY);
  }
}
