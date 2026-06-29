import { describe, it, expect, afterEach } from "vitest";
import {
  saveLedger,
  loadLedger,
  todayKey,
  createEmptyDay,
  remapMemoriesToLedger,
} from "../storage";
import type { LedgerState } from "../storage";

const TODAY = "2026-06-29";
const TOMORROW = "2026-06-30";
const FUTURE = "2026-07-15";

afterEach(() => {
  localStorage.clear();
});

describe("date scoping", () => {
  it("task written to a future key is absent from today's entry", () => {
    const futureDay = createEmptyDay(FUTURE);
    futureDay.tasks.push({
      id: "f1",
      title: "Plan something",
      done: false,
      createdAt: `${FUTURE}T09:00:00Z`,
      section: "plan",
    });
    const ledger: LedgerState = {
      days: {
        [TODAY]: createEmptyDay(TODAY),
        [FUTURE]: futureDay,
      },
    };

    expect(ledger.days[TODAY].tasks).toHaveLength(0);
    expect(ledger.days[FUTURE].tasks).toHaveLength(1);
    expect(ledger.days[FUTURE].tasks[0].id).toBe("f1");
  });

  it("future-dated tasks are excluded from a today-scoped section filter", () => {
    const todayDay = createEmptyDay(TODAY);
    todayDay.tasks.push({
      id: "t1",
      title: "Today task",
      done: false,
      createdAt: `${TODAY}T08:00:00Z`,
      section: "execution",
    });
    const futureDay = createEmptyDay(FUTURE);
    futureDay.tasks.push({
      id: "f1",
      title: "Future task",
      done: false,
      createdAt: `${FUTURE}T08:00:00Z`,
      section: "execution",
    });
    const ledger: LedgerState = {
      days: { [TODAY]: todayDay, [FUTURE]: futureDay },
    };

    // Simulate the visibleSections filter from page.tsx
    const todayTasks = ledger.days[TODAY].tasks.filter((t) => t.section === "execution");
    expect(todayTasks).toHaveLength(1);
    expect(todayTasks[0].id).toBe("t1");
  });

  it("tasks added for different dates land under the correct keys", () => {
    const ledger: LedgerState = { days: {} };

    const addToDate = (dateKey: string, id: string, title: string): LedgerState => ({
      days: {
        ...ledger.days,
        [dateKey]: {
          ...(ledger.days[dateKey] ?? createEmptyDay(dateKey)),
          tasks: [
            ...(ledger.days[dateKey]?.tasks ?? []),
            { id, title, done: false, createdAt: `${dateKey}T09:00:00Z`, section: "execution" as const },
          ],
        },
      },
    });

    const after1 = addToDate(TODAY, "a", "Today task");
    const after2 = { days: { ...after1.days, ...addToDate(TOMORROW, "b", "Tomorrow task").days } };

    expect(after2.days[TODAY].tasks.map((t) => t.id)).toEqual(["a"]);
    expect(after2.days[TOMORROW].tasks.map((t) => t.id)).toEqual(["b"]);
    expect(after2.days[TODAY].tasks.some((t) => t.id === "b")).toBe(false);
    expect(after2.days[TOMORROW].tasks.some((t) => t.id === "a")).toBe(false);
  });
});

describe("remapMemoriesToLedger — FIFO ordering", () => {
  it("produces tasks sorted by createdAt ascending per day when memories arrive out of order", () => {
    const res = {
      memories: [
        {
          contextId: "t3",
          contextType: "task" as const,
          data: { id: "t3", title: "Last", done: false, createdAt: `${TODAY}T12:00:00Z`, section: "execution" as const, date: TODAY },
        },
        {
          contextId: "t1",
          contextType: "task" as const,
          data: { id: "t1", title: "First", done: false, createdAt: `${TODAY}T08:00:00Z`, section: "execution" as const, date: TODAY },
        },
        {
          contextId: "t2",
          contextType: "task" as const,
          data: { id: "t2", title: "Middle", done: false, createdAt: `${TODAY}T10:00:00Z`, section: "execution" as const, date: TODAY },
        },
      ],
    };

    const ledger = remapMemoriesToLedger(res);
    expect(ledger.days[TODAY].tasks.map((t) => t.id)).toEqual(["t1", "t2", "t3"]);
  });
});

describe("persistence round-trip", () => {
  it("saves and reloads a future-dated task under the correct key", () => {
    const futureDay = createEmptyDay(FUTURE);
    futureDay.tasks.push({
      id: "future-task",
      title: "Do something next month",
      done: false,
      createdAt: `${FUTURE}T09:00:00Z`,
      section: "plan",
    });
    const original: LedgerState = {
      days: {
        [TODAY]: createEmptyDay(TODAY),
        [FUTURE]: futureDay,
      },
    };

    saveLedger(original);
    const reloaded = loadLedger();

    expect(reloaded.days[FUTURE]).toBeDefined();
    expect(reloaded.days[FUTURE].tasks).toHaveLength(1);
    expect(reloaded.days[FUTURE].tasks[0].id).toBe("future-task");
    expect(reloaded.days[TODAY].tasks).toHaveLength(0);
  });

  it("preserves all task fields across a save/load cycle", () => {
    const task = {
      id: "abc123",
      title: "Preserved task",
      done: true,
      createdAt: `${TOMORROW}T10:30:00Z`,
      section: "learning" as const,
    };
    const ledger: LedgerState = {
      days: {
        [TOMORROW]: { ...createEmptyDay(TOMORROW), tasks: [task] },
      },
    };

    saveLedger(ledger);
    const reloaded = loadLedger();

    expect(reloaded.days[TOMORROW].tasks[0]).toEqual(task);
  });

  it("uses the correct todayKey format", () => {
    const key = todayKey(new Date("2026-06-29T12:00:00"));
    expect(key).toBe("2026-06-29");
  });
});
