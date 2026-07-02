export type SectionId = string;

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

function mergeDayRecords(local: DayRecord, remote: DayRecord): DayRecord {
  const tasksById = new Map<string, FocusTask>();
  for (const task of remote.tasks) tasksById.set(task.id, task);
  for (const task of local.tasks) tasksById.set(task.id, task);

  return {
    date: local.date,
    tasks: Array.from(tasksById.values()),
    focusMinutes: Math.max(local.focusMinutes, remote.focusMinutes),
    distractionNote: local.distractionNote || remote.distractionNote,
    closedAt: local.closedAt ?? remote.closedAt,
  };
}

export function mergeLedgers(local: LedgerState, remote: LedgerState): LedgerState {
  const days: Record<string, DayRecord> = {};
  const dates = new Set([...Object.keys(remote.days), ...Object.keys(local.days)]);

  for (const date of dates) {
    const localDay = local.days[date];
    const remoteDay = remote.days[date];

    if (localDay && remoteDay) {
      days[date] = mergeDayRecords(localDay, remoteDay);
    } else {
      days[date] = localDay ?? remoteDay;
    }
  }

  return { days };
}

// ── LocusGraph async layer ────────────────────────────────────────────────────

type LocusGraphMemory =
  | { contextId: string; contextType: "task"; data: FocusTask & { date: string } }
  | { contextId: string; contextType: "day"; data: { date: string; focusMinutes: number; distractionNote: string; closedAt?: string } };

type LocusGraphMemoriesResponse = { memories: LocusGraphMemory[] | string };

type LocusGraphEvent = {
  contextId: string;
  contextType: "task" | "day";
  operation: "upsert" | "delete" | "focus_session";
  data: Record<string, unknown>;
  occurredAt: string;
};

let syncDisabledForSession = false;

export function isLocusGraphEnabled() {
  return process.env.NEXT_PUBLIC_LOCUSGRAPH_ENABLED === "true";
}

function parseMemoryList(memories: LocusGraphMemory[] | string): LocusGraphMemory[] {
  if (Array.isArray(memories)) return memories;

  try {
    const parsed = JSON.parse(memories) as unknown;
    if (Array.isArray(parsed)) return parsed as LocusGraphMemory[];
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { memories?: unknown }).memories)
    ) {
      return (parsed as { memories: LocusGraphMemory[] }).memories;
    }
  } catch {
    // LocusGraph can return rendered text; keep local data if it is not JSON.
  }

  return [];
}

export function remapMemoriesToLedger(res: LocusGraphMemoriesResponse): LedgerState {
  const days: Record<string, DayRecord> = {};
  const memories = parseMemoryList(res.memories);

  // First pass: build day scaffolding
  for (const m of memories) {
    if (m.contextType === "day") {
      const { date, ...rest } = m.data;
      days[date] = { date, tasks: [], focusMinutes: rest.focusMinutes, distractionNote: rest.distractionNote, ...(rest.closedAt ? { closedAt: rest.closedAt } : {}) };
    }
  }

  // Second pass: attach tasks to their parent day
  for (const m of memories) {
    if (m.contextType === "task") {
      const { date, ...taskData } = m.data;
      if (!days[date]) {
        days[date] = createEmptyDay(date);
      }
      days[date].tasks.push(taskData as FocusTask);
    }
  }

  // Stable FIFO order — LocusGraph makes no ordering guarantee
  for (const day of Object.values(days)) {
    day.tasks.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
  if (!isLocusGraphEnabled() || syncDisabledForSession) {
    return { days: {} };
  }

  const res = await fetch("/api/locusgraph/memories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: "Dayline task and day records",
      contextTypes: { type: ["task", "day"] },
      format: "json",
      limit: 100,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  return remapMemoriesToLedger((await res.json()) as LocusGraphMemoriesResponse);
}

export async function pushLedger(prev: LedgerState, next: LedgerState): Promise<void> {
  if (!isLocusGraphEnabled() || syncDisabledForSession) return;

  const events = diffToEvents(prev, next);
  if (!events.length) return;
  try {
    const res = await fetch("/api/locusgraph/events-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
    });
    if (!res.ok) {
      syncDisabledForSession = true;
      console.warn("[dayline] pushLedger failed; disabling LocusGraph sync for this tab:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    syncDisabledForSession = true;
    console.warn("[dayline] pushLedger failed:", err);
  }
}

export async function pushCompletedSession(taskId: string, date: string, durationMs: number): Promise<void> {
  if (!isLocusGraphEnabled() || syncDisabledForSession) return;

  try {
    const res = await fetch("/api/locusgraph/events", {
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
    if (!res.ok) {
      syncDisabledForSession = true;
      console.warn("[dayline] pushCompletedSession failed; disabling LocusGraph sync for this tab:", res.status, await res.text().catch(() => ""));
    }
  } catch (err) {
    syncDisabledForSession = true;
    console.warn("[dayline] pushCompletedSession failed:", err);
  }
}
