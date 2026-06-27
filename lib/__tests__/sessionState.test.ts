import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  startFocus,
  startBreak,
  pauseSession,
  resumeSession,
  expireSession,
  stopSession,
  markDoneSession,
  msLeft,
  saveSession,
} from "../sessionState";

const FIXED_NOW = new Date("2026-06-27T12:00:00.000Z").getTime();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(FIXED_NOW);
});

afterEach(() => {
  vi.useRealTimers();
  localStorage.clear();
});

describe("startFocus", () => {
  it("returns a running focus session with endsAt = now + durationMs", () => {
    const s = startFocus("task-1", 25 * 60_000);
    expect(s).toEqual({
      status: "running",
      phase: "focus",
      taskId: "task-1",
      endsAt: FIXED_NOW + 25 * 60_000,
      durationMs: 25 * 60_000,
    });
  });
});

describe("startBreak", () => {
  it("returns a running break session with endsAt = now + durationMs", () => {
    const s = startBreak("task-1", 5 * 60_000);
    expect(s).toEqual({
      status: "running",
      phase: "break",
      taskId: "task-1",
      endsAt: FIXED_NOW + 5 * 60_000,
      durationMs: 5 * 60_000,
    });
  });
});

describe("pauseSession", () => {
  it("captures remainingMs = endsAt - now", () => {
    const running = {
      status: "running" as const,
      phase: "focus" as const,
      taskId: "task-1",
      endsAt: FIXED_NOW + 10_000,
      durationMs: 25 * 60_000,
    };
    expect(pauseSession(running)).toEqual({
      status: "paused",
      phase: "focus",
      taskId: "task-1",
      remainingMs: 10_000,
      durationMs: 25 * 60_000,
    });
  });

  it("clamps remainingMs to 0 when session has already expired", () => {
    const running = {
      status: "running" as const,
      phase: "focus" as const,
      taskId: "task-1",
      endsAt: FIXED_NOW - 5_000,
      durationMs: 25 * 60_000,
    };
    const paused = pauseSession(running);
    expect((paused as { remainingMs: number }).remainingMs).toBe(0);
  });
});

describe("resumeSession", () => {
  it("sets endsAt = now + remainingMs", () => {
    const paused = {
      status: "paused" as const,
      phase: "focus" as const,
      taskId: "task-1",
      remainingMs: 8_000,
      durationMs: 25 * 60_000,
    };
    expect(resumeSession(paused)).toEqual({
      status: "running",
      phase: "focus",
      taskId: "task-1",
      endsAt: FIXED_NOW + 8_000,
      durationMs: 25 * 60_000,
    });
  });
});

describe("expireSession", () => {
  it("focus session transitions to complete", () => {
    const running = {
      status: "running" as const,
      phase: "focus" as const,
      taskId: "task-1",
      endsAt: FIXED_NOW - 1,
      durationMs: 25 * 60_000,
    };
    expect(expireSession(running)).toEqual({
      status: "complete",
      phase: "focus",
      taskId: "task-1",
    });
  });

  it("break session transitions to idle", () => {
    const running = {
      status: "running" as const,
      phase: "break" as const,
      taskId: "task-1",
      endsAt: FIXED_NOW - 1,
      durationMs: 5 * 60_000,
    };
    expect(expireSession(running)).toEqual({ status: "idle" });
  });
});

describe("stopSession", () => {
  it("returns idle", () => {
    expect(stopSession()).toEqual({ status: "idle" });
  });
});

describe("markDoneSession", () => {
  it("returns a complete focus state with the given taskId", () => {
    expect(markDoneSession("task-42")).toEqual({
      status: "complete",
      phase: "focus",
      taskId: "task-42",
    });
  });
});

describe("msLeft", () => {
  it("returns positive ms remaining", () => {
    const running = {
      status: "running" as const,
      phase: "focus" as const,
      taskId: "task-1",
      endsAt: FIXED_NOW + 3_000,
      durationMs: 25 * 60_000,
    };
    expect(msLeft(running)).toBe(3_000);
  });

  it("clamps to 0 when past endsAt", () => {
    const running = {
      status: "running" as const,
      phase: "focus" as const,
      taskId: "task-1",
      endsAt: FIXED_NOW - 1_000,
      durationMs: 25 * 60_000,
    };
    expect(msLeft(running)).toBe(0);
  });
});

describe("saveSession error resilience", () => {
  it("does not throw when localStorage.setItem fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    expect(() => saveSession(startFocus("task-1", 25 * 60_000))).not.toThrow();
  });

  it("warns to console when localStorage.setItem fails", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    saveSession(startFocus("task-1", 25 * 60_000));
    expect(warn).toHaveBeenCalledWith(
      "saveSession: localStorage write failed",
      expect.any(DOMException)
    );
  });
});
