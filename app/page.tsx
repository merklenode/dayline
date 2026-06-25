"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  Circle,
  Clock3,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Square,
  Trash2
} from "lucide-react";
import { createEmptyDay, DayRecord, FocusTask, LedgerState, loadLedger, saveLedger, todayKey } from "@/lib/storage";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;
const START_DATE = "2026-06-25";
const DEADLINE = "2026-08-24";
const DAILY_TASK_LIMIT = 5;

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function uid() {
  return crypto.randomUUID();
}

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return todayKey(date);
  });
}

function daysBetween(start: string, end: string) {
  const startTime = new Date(`${start}T00:00:00`).getTime();
  const endTime = new Date(`${end}T00:00:00`).getTime();
  return Math.max(0, Math.ceil((endTime - startTime) / 86400000));
}

export default function Home() {
  const [ledger, setLedger] = useState<LedgerState>({ days: {} });
  const [taskTitle, setTaskTitle] = useState("");
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const date = todayKey();

  const today = ledger.days[date] ?? createEmptyDay(date);

  useEffect(() => {
    const loaded = loadLedger();
    if (!loaded.days[date]) {
      loaded.days[date] = createEmptyDay(date);
    }
    setLedger(loaded);
  }, [date]);

  useEffect(() => {
    if (Object.keys(ledger.days).length > 0) {
      saveLedger(ledger);
    }
  }, [ledger]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(() => {
      setSecondsLeft((current) => {
        if (current > 1) {
          return current - 1;
        }

        setRunning(false);
        if (mode === "focus") {
          addFocusMinutes(25);
          setMode("break");
          return BREAK_SECONDS;
        }

        setMode("focus");
        return FOCUS_SECONDS;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [mode, running]);

  const completedTasks = today.tasks.filter((task) => task.done).length;
  const completionRate = today.tasks.length ? Math.round((completedTasks / today.tasks.length) * 100) : 0;
  const daysRemaining = daysBetween(date, DEADLINE);
  const elapsedDays = Math.max(1, daysBetween(START_DATE, date) + 1);

  const week = useMemo(() => {
    return lastSevenDays().map((day) => {
      const record = ledger.days[day] ?? createEmptyDay(day);
      return {
        date: day,
        minutes: record.focusMinutes,
        completed: record.tasks.filter((task) => task.done).length
      };
    });
  }, [ledger.days]);

  const weekMax = Math.max(60, ...week.map((day) => day.minutes));

  function updateToday(updater: (record: DayRecord) => DayRecord) {
    setLedger((current) => ({
      days: {
        ...current.days,
        [date]: updater(current.days[date] ?? createEmptyDay(date))
      }
    }));
  }

  function addTask() {
    const cleanTitle = taskTitle.trim();
    if (!cleanTitle) {
      return;
    }

    const task: FocusTask = {
      id: uid(),
      title: cleanTitle,
      done: false,
      createdAt: new Date().toISOString()
    };

    updateToday((record) => ({
      ...record,
      tasks: record.tasks.length >= DAILY_TASK_LIMIT ? record.tasks : [...record.tasks, task]
    }));
    setTaskTitle("");
  }

  function toggleTask(id: string) {
    updateToday((record) => ({
      ...record,
      tasks: record.tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    }));
  }

  function deleteTask(id: string) {
    updateToday((record) => ({
      ...record,
      tasks: record.tasks.filter((task) => task.id !== id)
    }));
  }

  function addFocusMinutes(minutes: number) {
    updateToday((record) => ({
      ...record,
      focusMinutes: record.focusMinutes + minutes
    }));
  }

  function resetTimer() {
    setRunning(false);
    setSecondsLeft(mode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);
  }

  function switchMode(nextMode: "focus" | "break") {
    setMode(nextMode);
    setRunning(false);
    setSecondsLeft(nextMode === "focus" ? FOCUS_SECONDS : BREAK_SECONDS);
  }

  function closeDay() {
    updateToday((record) => ({
      ...record,
      closedAt: new Date().toISOString()
    }));
  }

  return (
    <main className="min-h-screen">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-6 sm:px-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-zinc-950">Dayline</h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-96">
            <Stat label="Focus" value={`${today.focusMinutes}m`} />
            <Stat label="Done" value={`${completedTasks}/${today.tasks.length}`} />
            <Stat label="Score" value={`${completionRate}%`} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-5">
          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">Current sprint</p>
                <h2 className="mt-1 text-xl font-semibold text-zinc-950">60-day independence sprint</h2>
              </div>
              <p className="text-sm font-semibold text-teal-800">Day {elapsedDays} of 60 · {daysRemaining} days left</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-teal-700" style={{ width: `${Math.min(100, (elapsedDays / 60) * 100)}%` }} />
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <input
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    addTask();
                  }
                }}
                placeholder="Add one important task"
                disabled={today.tasks.length >= DAILY_TASK_LIMIT}
                spellCheck={true}
                autoCorrect="on"
                autoCapitalize="sentences"
                className="min-h-11 flex-1 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
              <button
                type="button"
                onClick={addTask}
                disabled={today.tasks.length >= DAILY_TASK_LIMIT}
                aria-label="Add task"
                className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-teal-700 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              >
                <Plus size={18} />
              </button>
            </div>
            {today.tasks.length >= DAILY_TASK_LIMIT ? <p className="mt-2 text-sm text-zinc-500">Daily cap reached. Finish these before adding more.</p> : null}
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="text-base font-semibold text-zinc-950">Today Plan</h2>
            </div>
            <div className="divide-y divide-zinc-100">
              {today.tasks.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-zinc-500">No tasks yet. Add one income task and one skill task for today.</div>
              ) : (
                today.tasks.map((task) => (
                  <div key={task.id} className="flex min-h-14 items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      aria-label={task.done ? "Mark incomplete" : "Mark complete"}
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition ${
                        task.done ? "border-teal-700 bg-teal-700 text-white" : "border-zinc-300 text-zinc-500 hover:border-teal-600"
                      }`}
                    >
                      {task.done ? <Check size={16} /> : <Circle size={15} />}
                    </button>
                    <span className={`flex-1 text-sm ${task.done ? "text-zinc-400 line-through" : "text-zinc-900"}`}>{task.title}</span>
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      aria-label="Delete task"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <label htmlFor="distraction" className="text-base font-semibold text-zinc-950">
              Distraction Note
            </label>
            <textarea
              id="distraction"
              value={today.distractionNote}
              onChange={(event) =>
                updateToday((record) => ({
                  ...record,
                  distractionNote: event.target.value
                }))
              }
              placeholder="What wasted your time today?"
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
              className="mt-3 min-h-24 w-full resize-none rounded-md border border-zinc-300 p-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Timer</p>
                <h2 className="mt-1 text-lg font-semibold">{mode === "focus" ? "Focus Sprint" : "Break"}</h2>
              </div>
              <Clock3 className="text-teal-300" size={24} />
            </div>

            <div className="py-8 text-center">
              <p className="font-mono text-6xl font-semibold tracking-normal">{formatSeconds(secondsLeft)}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => switchMode("focus")}
                className={`min-h-10 rounded-md text-sm font-medium transition ${mode === "focus" ? "bg-white text-zinc-950" : "bg-white/10 text-zinc-300 hover:bg-white/15"}`}
              >
                Focus
              </button>
              <button
                type="button"
                onClick={() => switchMode("break")}
                className={`min-h-10 rounded-md text-sm font-medium transition ${mode === "break" ? "bg-white text-zinc-950" : "bg-white/10 text-zinc-300 hover:bg-white/15"}`}
              >
                Break
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <IconButton label={running ? "Pause timer" : "Start timer"} onClick={() => setRunning((current) => !current)}>
                {running ? <Pause size={18} /> : <Play size={18} />}
              </IconButton>
              <IconButton label="Reset timer" onClick={resetTimer}>
                <RotateCcw size={18} />
              </IconButton>
              <IconButton label="Add 25 focus minutes" onClick={() => addFocusMinutes(25)}>
                <Square size={16} />
              </IconButton>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-zinc-950">Last 7 Days</h2>
              <BarChart3 size={18} className="text-teal-700" />
            </div>
            <div className="space-y-3">
              {week.map((day) => (
                <div key={day.date} className="grid grid-cols-[3.5rem_1fr_3rem] items-center gap-3 text-sm">
                  <span className="text-zinc-500">{day.date.slice(5)}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                    <div className="h-full rounded-full bg-teal-700" style={{ width: `${Math.min(100, (day.minutes / weekMax) * 100)}%` }} />
                  </div>
                  <span className="text-right font-medium text-zinc-800">{day.minutes}m</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={closeDay}
            className="min-h-11 w-full rounded-md border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 transition hover:border-teal-700 hover:text-teal-800"
          >
            End Day
          </button>
        </aside>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-stone-50 px-3 py-2">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center rounded-md bg-white/10 text-zinc-100 transition hover:bg-white/15"
    >
      {children}
    </button>
  );
}
