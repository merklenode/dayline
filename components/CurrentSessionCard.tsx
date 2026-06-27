"use client";

import { useState } from "react";
import { Coffee, Play, Square } from "lucide-react";
import type { FocusTask, SectionId } from "@/lib/storage";
import { type SessionState, msLeft } from "@/lib/sessionState";

type CurrentSessionCardProps = {
  session: SessionState;
  tasks: FocusTask[];
  sectionNames: Record<SectionId, string>;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onMarkDone: () => void;
  onStartBreak: () => void;
  onEndBreak: () => void;
};

function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function ProgressBar({
  progress,
  color,
  animate,
}: {
  progress: number;
  color: "teal" | "sky";
  animate: boolean;
}) {
  const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
  return (
    <div
      className={`mt-3 h-1.5 overflow-hidden rounded-full ${
        color === "teal" ? "bg-teal-100" : "bg-sky-100"
      }`}
    >
      <div
        className={`h-full rounded-full ${color === "teal" ? "bg-teal-600" : "bg-sky-500"} ${
          animate ? "transition-[width] duration-500 ease-linear" : ""
        }`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function CurrentSessionCard({
  session,
  tasks,
  sectionNames,
  onPause,
  onResume,
  onStop,
  onMarkDone,
  onStartBreak,
  onEndBreak,
}: CurrentSessionCardProps) {
  const [reducedMotion] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  const activeTask =
    session.status !== "idle" ? tasks.find((t) => t.id === session.taskId) : undefined;

  if (session.status === "idle") {
    return (
      <section aria-label="Current session" className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-zinc-500">Ready to focus</p>
        <p className="mt-1 text-xs text-zinc-400">Start a task from Today Plan below.</p>
      </section>
    );
  }

  if (session.status === "running" && session.phase === "focus") {
    const remaining = msLeft(session);
    const progress = 1 - remaining / session.durationMs;
    const sectionLabel = activeTask ? sectionNames[activeTask.section] : "";

    return (
      <section
        aria-label="Current session"
        aria-live="polite"
        aria-atomic="true"
        className="rounded-lg border border-teal-200 bg-teal-50/40 p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-700">
              Focus
            </span>
            <p className="mt-0.5 truncate text-base font-semibold leading-snug text-zinc-950">
              {activeTask?.title ?? "Unknown task"}
            </p>
            {sectionLabel && <p className="mt-0.5 text-xs text-zinc-500">{sectionLabel}</p>}
          </div>
          <span className="shrink-0 font-mono text-3xl font-bold tabular-nums text-zinc-900">
            {formatMs(remaining)}
          </span>
        </div>

        <ProgressBar progress={progress} color="teal" animate={!reducedMotion} />

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onPause}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={onMarkDone}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            Mark done
          </button>
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop session"
            title="Stop"
            className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            <Square size={14} />
          </button>
        </div>
        <p className="mt-2 text-xs text-zinc-400">Break next</p>
      </section>
    );
  }

  if (session.status === "paused") {
    const progress = 1 - session.remainingMs / session.durationMs;

    return (
      <section
        aria-label="Current session"
        aria-live="polite"
        className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Focus · Paused
            </span>
            <p className="mt-0.5 truncate text-base font-semibold leading-snug text-zinc-950">
              {activeTask?.title ?? "Unknown task"}
            </p>
          </div>
          <span className="shrink-0 font-mono text-3xl font-bold tabular-nums text-zinc-400">
            {formatMs(session.remainingMs)}
          </span>
        </div>

        <ProgressBar progress={progress} color="teal" animate={false} />

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onResume}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <Play size={13} />
            Resume
          </button>
          <button
            type="button"
            onClick={onStop}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
          >
            Stop
          </button>
        </div>
      </section>
    );
  }

  if (session.status === "complete") {
    return (
      <section
        aria-label="Current session"
        aria-live="polite"
        className="rounded-lg border border-teal-300 bg-teal-50 p-5 shadow-sm"
      >
        <p className="text-sm font-semibold text-teal-800">Focus complete</p>
        {activeTask && (
          <p className="mt-0.5 truncate text-xs text-zinc-600">{activeTask.title}</p>
        )}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={onStartBreak}
            className="inline-flex items-center gap-1.5 rounded-md border border-teal-300 bg-white px-3 py-1.5 text-sm font-medium text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <Coffee size={13} />
            Take a break
          </button>
          <button
            type="button"
            onClick={onStop}
            className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            Back to plan
          </button>
        </div>
      </section>
    );
  }

  // running break — all other states were handled above
  if (session.status !== "running") return null;
  const remaining = msLeft(session);
  const breakProgress = 1 - remaining / session.durationMs;

  return (
    <section
      aria-label="Current session"
      aria-live="polite"
      aria-atomic="true"
      className="rounded-lg border border-sky-200 bg-sky-50/40 p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-600">Break</span>
          {activeTask && (
            <p className="mt-0.5 truncate text-xs text-zinc-500">After: {activeTask.title}</p>
          )}
        </div>
        <span className="shrink-0 font-mono text-3xl font-bold tabular-nums text-zinc-900">
          {formatMs(remaining)}
        </span>
      </div>

      <ProgressBar progress={breakProgress} color="sky" animate={!reducedMotion} />

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={onEndBreak}
          className="inline-flex items-center gap-1.5 rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          End break
        </button>
        <button
          type="button"
          onClick={onStop}
          aria-label="Stop break"
          title="Stop"
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
        >
          <Square size={14} />
        </button>
      </div>
    </section>
  );
}
