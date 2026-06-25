export type FocusTask = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
};

export type DayRecord = {
  date: string;
  tasks: FocusTask[];
  focusMinutes: number;
  distractionNote: string;
  closedAt?: string;
};

export type LedgerState = {
  days: Record<string, DayRecord>;
};

export const STORAGE_KEY = "dayline:v1";

export function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function createEmptyDay(date = todayKey()): DayRecord {
  return {
    date,
    tasks: [],
    focusMinutes: 0,
    distractionNote: ""
  };
}

export function loadLedger(): LedgerState {
  if (typeof window === "undefined") {
    return { days: {} };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { days: {} };
    }
    const parsed = JSON.parse(raw) as LedgerState;
    return parsed && parsed.days ? parsed : { days: {} };
  } catch {
    return { days: {} };
  }
}

export function saveLedger(state: LedgerState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
