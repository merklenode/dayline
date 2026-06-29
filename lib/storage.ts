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
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("saveLedger: localStorage write failed", e);
  }
}

// ── LocusGraph async layer ────────────────────────────────────────────────────

type LocusGraphMemory =
  | { contextId: string; contextType: "task"; data: FocusTask & { date: string } }
  | { contextId: string; contextType: "day"; data: { date: string; focusMinutes: number; distractionNote: string; closedAt?: string } };

type LocusGraphMemoriesResponse = { memories: LocusGraphMemory[] };

type LocusGraphEvent = {
  contextId: string;
  contextType: "task" | "day";
  operation: "upsert" | "delete" | "focus_session";
  data: Record<string, unknown>;
  occurredAt: string;
};

function remapMemoriesToLedger(res: LocusGraphMemoriesResponse): LedgerState {
  const days: Record<string, DayRecord> = {};

  // First pass: build day scaffolding
  for (const m of res.memories) {
    if (m.contextType === "day") {
      const { date, ...rest } = m.data;
      days[date] = { date, tasks: [], focusMinutes: rest.focusMinutes, distractionNote: rest.distractionNote, ...(rest.closedAt ? { closedAt: rest.closedAt } : {}) };
    }
  }

  // Second pass: attach tasks to their parent day
  for (const m of res.memories) {
    if (m.contextType === "task") {
      const { date, ...taskData } = m.data;
      if (!days[date]) {
        days[date] = createEmptyDay(date);
      }
      days[date].tasks.push(taskData as FocusTask);
    }
  }

  return { days };
}

function diffToEvents(prev: LedgerState, next: LedgerState): LocusGraphEvent[] {
  const events: LocusGraphEvent[] = [];
  const occurredAt = new Date().toISOString();
  const allDates = new Set([...Object.keys(prev.days), ...Object.keys(next.days)]);

  for (const date of allDates) {
    const prevDay = prev.days[date];
    const nextDay = next.days[date];

    if (!nextDay) continue;

    if (
      !prevDay ||
      prevDay.focusMinutes !== nextDay.focusMinutes ||
      prevDay.distractionNote !== nextDay.distractionNote ||
      prevDay.closedAt !== nextDay.closedAt
    ) {
      events.push({
        contextId: `day:${date}`,
        contextType: "day",
        operation: "upsert",
        data: { date, focusMinutes: nextDay.focusMinutes, distractionNote: nextDay.distractionNote, ...(nextDay.closedAt ? { closedAt: nextDay.closedAt } : {}) },
        occurredAt,
      });
    }

    const prevTaskMap = new Map((prevDay?.tasks ?? []).map((t) => [t.id, t]));
    const nextTaskMap = new Map(nextDay.tasks.map((t) => [t.id, t]));

    for (const [id, task] of nextTaskMap) {
      const p = prevTaskMap.get(id);
      if (!p || p.title !== task.title || p.done !== task.done || p.section !== task.section) {
        events.push({
          contextId: `task:${id}`,
          contextType: "task",
          operation: "upsert",
          data: { ...task, date },
          occurredAt,
        });
      }
    }

    for (const id of prevTaskMap.keys()) {
      if (!nextTaskMap.has(id)) {
        events.push({
          contextId: `task:${id}`,
          contextType: "task",
          operation: "delete",
          data: { date },
          occurredAt,
        });
      }
    }
  }

  return events;
}

export async function fetchLedger(): Promise<LedgerState> {
  const res = await fetch("/api/locusgraph/memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contextTypes: { type: ["task", "day"] }, format: "json" }),
  });
  if (!res.ok) throw new Error(await res.text());
  return remapMemoriesToLedger((await res.json()) as LocusGraphMemoriesResponse);
}

export async function pushLedger(prev: LedgerState, next: LedgerState): Promise<void> {
  const events = diffToEvents(prev, next);
  if (!events.length) return;
  try {
    const res = await fetch("/api/locusgraph/events-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
    if (!res.ok) {
      console.warn("[dayline] pushLedger failed:", res.status);
    }
  } catch (err) {
    console.warn("[dayline] pushLedger failed:", err);
  }
}

export async function pushCompletedSession(taskId: string, date: string, durationMs: number): Promise<void> {
  try {
    await fetch("/api/locusgraph/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contextId: `task:${taskId}`,
        contextType: "task",
        operation: "focus_session",
        data: { date, durationMs },
        occurredAt: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn("[dayline] pushCompletedSession failed:", err);
  }
}
