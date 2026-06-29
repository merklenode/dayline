import { describe, it, expect, afterEach, vi } from "vitest";
import {
  loadLedger,
  saveLedger,
  remapMemoriesToLedger,
  STORAGE_KEY,
  STORAGE_KEY_V1,
} from "../storage";
import type { LedgerState } from "../storage";

afterEach(() => {
  localStorage.clear();
});

describe("loadLedger — V1 to V2 migration", () => {
  it("migrates tasks from V1, adding section: 'execution' to each task", () => {
    const v1Payload = {
      days: {
        "2026-06-01": {
          date: "2026-06-01",
          tasks: [
            { id: "t1", title: "Write tests", done: false, createdAt: "2026-06-01T09:00:00Z" },
            { id: "t2", title: "Fix bug", done: true, createdAt: "2026-06-01T10:00:00Z" },
          ],
          focusMinutes: 50,
          distractionNote: "",
        },
      },
    };
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(v1Payload));

    const ledger = loadLedger();

    expect(ledger.days["2026-06-01"].tasks).toHaveLength(2);
    expect(ledger.days["2026-06-01"].tasks[0]).toMatchObject({ id: "t1", section: "execution" });
    expect(ledger.days["2026-06-01"].tasks[1]).toMatchObject({ id: "t2", section: "execution" });
    expect(ledger.days["2026-06-01"].focusMinutes).toBe(50);
  });

  it("removes the V1 key and writes V2 key after migration", () => {
    const v1Payload = {
      days: {
        "2026-06-01": {
          date: "2026-06-01",
          tasks: [],
          focusMinutes: 0,
          distractionNote: "",
        },
      },
    };
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(v1Payload));

    loadLedger();

    expect(localStorage.getItem(STORAGE_KEY_V1)).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
  });

  it("preserves all original V1 fields during migration", () => {
    const v1Payload = {
      days: {
        "2026-06-01": {
          date: "2026-06-01",
          tasks: [{ id: "t1", title: "Task", done: false, createdAt: "2026-06-01T09:00:00Z" }],
          focusMinutes: 25,
          distractionNote: "too many meetings",
          closedAt: "2026-06-01T18:00:00Z",
        },
      },
    };
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify(v1Payload));

    const ledger = loadLedger();

    const day = ledger.days["2026-06-01"];
    expect(day.distractionNote).toBe("too many meetings");
    expect(day.closedAt).toBe("2026-06-01T18:00:00Z");
  });

  it("returns empty ledger when there is no V1 or V2 data", () => {
    expect(loadLedger()).toEqual({ days: {} });
  });

  it("returns empty ledger when V1 payload has no days key", () => {
    localStorage.setItem(STORAGE_KEY_V1, JSON.stringify({ other: "data" }));
    expect(loadLedger()).toEqual({ days: {} });
  });

  it("returns empty ledger when V1 data is malformed JSON", () => {
    localStorage.setItem(STORAGE_KEY_V1, "{invalid json");
    expect(loadLedger()).toEqual({ days: {} });
  });
});

describe("loadLedger — V2 direct load", () => {
  it("returns parsed V2 data unchanged", () => {
    const state: LedgerState = {
      days: {
        "2026-06-27": {
          date: "2026-06-27",
          tasks: [
            {
              id: "t1",
              title: "Ship the fix",
              done: false,
              createdAt: "2026-06-27T08:00:00Z",
              section: "execution",
            },
          ],
          focusMinutes: 25,
          distractionNote: "Slack notifications",
        },
      },
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    expect(loadLedger()).toEqual(state);
  });

  it("returns empty ledger when V2 JSON is corrupted", () => {
    localStorage.setItem(STORAGE_KEY, "not valid json{{{");
    expect(loadLedger()).toEqual({ days: {} });
  });

  it("returns empty ledger when V2 data has no days key", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ something: "else" }));
    expect(loadLedger()).toEqual({ days: {} });
  });
});

describe("remapMemoriesToLedger — task ordering", () => {
  it("sorts tasks by createdAt ascending regardless of memory order", () => {
    const res = {
      memories: [
        {
          contextId: "t2",
          contextType: "task" as const,
          data: { id: "t2", title: "B", done: false, createdAt: "2026-06-29T10:00:00Z", section: "execution" as const, date: "2026-06-29" },
        },
        {
          contextId: "t1",
          contextType: "task" as const,
          data: { id: "t1", title: "A", done: false, createdAt: "2026-06-29T09:00:00Z", section: "execution" as const, date: "2026-06-29" },
        },
        {
          contextId: "t3",
          contextType: "task" as const,
          data: { id: "t3", title: "C", done: false, createdAt: "2026-06-29T08:00:00Z", section: "plan" as const, date: "2026-06-29" },
        },
      ],
    };
    const ledger = remapMemoriesToLedger(res);
    const tasks = ledger.days["2026-06-29"].tasks;
    expect(tasks.map((t) => t.id)).toEqual(["t3", "t1", "t2"]);
  });

  it("sorts tasks independently per day", () => {
    const res = {
      memories: [
        {
          contextId: "d1t2",
          contextType: "task" as const,
          data: { id: "d1t2", title: "late", done: false, createdAt: "2026-06-28T11:00:00Z", section: "execution" as const, date: "2026-06-28" },
        },
        {
          contextId: "d1t1",
          contextType: "task" as const,
          data: { id: "d1t1", title: "early", done: false, createdAt: "2026-06-28T08:00:00Z", section: "execution" as const, date: "2026-06-28" },
        },
        {
          contextId: "d2t1",
          contextType: "task" as const,
          data: { id: "d2t1", title: "only", done: false, createdAt: "2026-06-29T09:00:00Z", section: "execution" as const, date: "2026-06-29" },
        },
      ],
    };
    const ledger = remapMemoriesToLedger(res);
    expect(ledger.days["2026-06-28"].tasks.map((t) => t.id)).toEqual(["d1t1", "d1t2"]);
    expect(ledger.days["2026-06-29"].tasks.map((t) => t.id)).toEqual(["d2t1"]);
  });
});

describe("saveLedger error resilience", () => {
  it("swallows QuotaExceededError and emits a console.warn", () => {
    const setItemSpy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() => saveLedger({ days: {} })).not.toThrow();
    expect(warn).toHaveBeenCalledWith(
      "saveLedger: localStorage write failed",
      expect.any(DOMException)
    );
    setItemSpy.mockRestore();
  });
});
