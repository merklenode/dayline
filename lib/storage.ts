export type SectionId = "plan" | "execution" | "learning" | "windup";

export type FocusTask = {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
  section: SectionId;
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

export const STORAGE_KEY_V1 = "dayline:v1";
export const STORAGE_KEY = "dayline:v2";

export function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function createEmptyDay(date = todayKey()): DayRecord {
  return {
    date,
    tasks: [],
    focusMinutes: 0,
    distractionNote: ""
  };
}

function migrateV1ToV2(): LedgerState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { days?: Record<string, { date: string; tasks: { id: string; title: string; done: boolean; createdAt: string }[]; focusMinutes: number; distractionNote: string; closedAt?: string }> };
    if (!parsed?.days) return null;

    const migrated: LedgerState = {
      days: Object.fromEntries(
        Object.entries(parsed.days).map(([key, record]) => [
          key,
          {
            ...record,
            tasks: record.tasks.map((t) => ({ ...t, section: "execution" as SectionId }))
          }
        ])
      )
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    window.localStorage.removeItem(STORAGE_KEY_V1);
    return migrated;
  } catch {
    return null;
  }
}

export function loadLedger(): LedgerState {
  if (typeof window === "undefined") {
    return { days: {} };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const migrated = migrateV1ToV2();
      return migrated ?? { days: {} };
    }
    const parsed = JSON.parse(raw) as LedgerState;
    return parsed?.days ? parsed : { days: {} };
  } catch {
    return { days: {} };
  }
}

export function saveLedger(state: LedgerState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
