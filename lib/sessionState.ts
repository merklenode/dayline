export type SessionPhase = "focus" | "break";

export type SessionState =
  | { status: "idle" }
  | { status: "running"; phase: SessionPhase; taskId: string; endsAt: number; durationMs: number }
  | { status: "paused"; phase: SessionPhase; taskId: string; remainingMs: number; durationMs: number }
  | { status: "complete"; phase: SessionPhase; taskId: string };

const SESSION_KEY = "dayline:session";

export function loadSession(): SessionState {
  if (typeof window === "undefined") return { status: "idle" };
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return { status: "idle" };
    const parsed = JSON.parse(raw) as SessionState;
    if (!parsed?.status) return { status: "idle" };
    if (parsed.status === "running") {
      if (typeof parsed.endsAt !== "number" || !isFinite(parsed.endsAt)) return { status: "idle" };
      if (Date.now() >= parsed.endsAt) {
        return { status: "complete", phase: parsed.phase, taskId: parsed.taskId };
      }
      return parsed;
    }
    if (parsed.status === "paused" || parsed.status === "complete") return parsed;
    return { status: "idle" };
  } catch {
    return { status: "idle" };
  }
}

export function saveSession(state: SessionState) {
  if (typeof window === "undefined") return;
  if (state.status === "idle") {
    window.localStorage.removeItem(SESSION_KEY);
  } else {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }
}

export function msLeft(session: SessionState & { status: "running" }): number {
  return Math.max(0, session.endsAt - Date.now());
}

export function startFocus(taskId: string, durationMs: number): SessionState {
  return { status: "running", phase: "focus", taskId, endsAt: Date.now() + durationMs, durationMs };
}

export function pauseSession(session: SessionState & { status: "running" }): SessionState {
  return {
    status: "paused",
    phase: session.phase,
    taskId: session.taskId,
    remainingMs: Math.max(0, session.endsAt - Date.now()),
    durationMs: session.durationMs,
  };
}

export function resumeSession(session: SessionState & { status: "paused" }): SessionState {
  return {
    status: "running",
    phase: session.phase,
    taskId: session.taskId,
    endsAt: Date.now() + session.remainingMs,
    durationMs: session.durationMs,
  };
}

export function expireSession(session: SessionState & { status: "running" }): SessionState {
  if (session.phase === "focus") {
    return { status: "complete", phase: "focus", taskId: session.taskId };
  }
  return { status: "idle" };
}

export function startBreak(taskId: string, durationMs: number): SessionState {
  return { status: "running", phase: "break", taskId, endsAt: Date.now() + durationMs, durationMs };
}

export function stopSession(): SessionState {
  return { status: "idle" };
}

export function markDoneSession(taskId: string): SessionState {
  return { status: "complete", phase: "focus", taskId };
}
