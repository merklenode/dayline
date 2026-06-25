"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Circle, Clock3, ListTodo, Play, RotateCcw, Trash2 } from "lucide-react";
import {
  DEFAULT_SCHEDULE,
  DayStatus,
  ScheduleBlock,
  ScheduleDayState,
  ScheduleState,
  ScheduleTask,
  createEmptyScheduleDay,
  createEmptyScheduleState,
  formatDuration,
  formatTime,
  getActiveBlock,
  getDayStatus,
  getNextBlock,
  loadScheduleState,
  localDateKey,
  resolveHeading,
  saveScheduleState,
  secondsSinceMidnight,
  timeToSeconds
} from "@/lib/day-schedule";

function uid() {
  return crypto.randomUUID();
}

function createTask(text: string): ScheduleTask {
  return {
    id: uid(),
    text,
    done: false,
    createdAt: new Date().toISOString()
  };
}

function taskCount(day: ScheduleDayState) {
  return Object.values(day.tasksByBlockId).reduce(
    (summary, tasks) => {
      tasks.forEach((task) => {
        summary.total += 1;
        if (task.done) {
          summary.done += 1;
        }
      });
      return summary;
    },
    { done: 0, total: 0 }
  );
}

function workSeconds(blocks: ScheduleBlock[]) {
  return blocks
    .filter((block) => block.kind === "work")
    .reduce((total, block) => total + timeToSeconds(block.end) - timeToSeconds(block.start), 0);
}

function elapsedWorkSeconds(blocks: ScheduleBlock[], now: Date) {
  const currentSeconds = secondsSinceMidnight(now);

  return blocks
    .filter((block) => block.kind === "work")
    .reduce((total, block) => {
      const start = timeToSeconds(block.start);
      const end = timeToSeconds(block.end);
      if (currentSeconds <= start) {
        return total;
      }

      return total + Math.min(end, currentSeconds) - start;
    }, 0);
}

export default function Home() {
  const [state, setState] = useState<ScheduleState>(() => createEmptyScheduleState());
  const [loaded, setLoaded] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const todayKey = localDateKey(now);
  const today = state.days[todayKey] ?? createEmptyScheduleDay(todayKey);
  const activeBlock = getActiveBlock(DEFAULT_SCHEDULE, now);
  const nextBlock = getNextBlock(DEFAULT_SCHEDULE, now);
  const dayStatus = getDayStatus(DEFAULT_SCHEDULE, now);
  const counts = taskCount(today);
  const totalWorkSeconds = workSeconds(DEFAULT_SCHEDULE);
  const completedWorkSeconds = elapsedWorkSeconds(DEFAULT_SCHEDULE, now);
  const workProgress = Math.min(100, Math.round((completedWorkSeconds / totalWorkSeconds) * 100));

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadedState = loadScheduleState();
    const date = localDateKey();

    // localStorage is client-only, so hydration has to happen after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({
      ...loadedState,
      days: {
        ...loadedState.days,
        [date]: loadedState.days[date] ?? createEmptyScheduleDay(date)
      }
    });
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      saveScheduleState(state);
    }
  }, [loaded, state]);

  const remainingSeconds = useMemo(() => {
    if (!activeBlock) {
      return 0;
    }

    return timeToSeconds(activeBlock.end) - secondsSinceMidnight(now);
  }, [activeBlock, now]);

  function updateToday(updater: (day: ScheduleDayState) => ScheduleDayState) {
    setState((current) => {
      const date = localDateKey();
      return {
        ...current,
        days: {
          ...current.days,
          [date]: updater(current.days[date] ?? createEmptyScheduleDay(date))
        }
      };
    });
  }

  function updateHeading(blockId: string, heading: string) {
    setState((current) => ({
      ...current,
      headingOverrides: {
        ...current.headingOverrides,
        [blockId]: heading
      }
    }));
  }

  function resetHeading(blockId: string) {
    setState((current) => {
      const nextOverrides = { ...current.headingOverrides };
      delete nextOverrides[blockId];

      return {
        ...current,
        headingOverrides: nextOverrides
      };
    });
  }

  function addTask(blockId: string, text: string) {
    const cleanText = text.trim();
    if (!cleanText) {
      return;
    }

    updateToday((day) => ({
      ...day,
      tasksByBlockId: {
        ...day.tasksByBlockId,
        [blockId]: [...(day.tasksByBlockId[blockId] ?? []), createTask(cleanText)]
      }
    }));
  }

  function toggleTask(blockId: string, taskId: string) {
    updateToday((day) => ({
      ...day,
      tasksByBlockId: {
        ...day.tasksByBlockId,
        [blockId]: (day.tasksByBlockId[blockId] ?? []).map((task) => (task.id === taskId ? { ...task, done: !task.done } : task))
      }
    }));
  }

  function deleteTask(blockId: string, taskId: string) {
    updateToday((day) => ({
      ...day,
      tasksByBlockId: {
        ...day.tasksByBlockId,
        [blockId]: (day.tasksByBlockId[blockId] ?? []).filter((task) => task.id !== taskId)
      }
    }));
  }

  function startDay() {
    updateToday((day) => ({
      ...day,
      startedAt: day.startedAt ?? new Date().toISOString()
    }));
  }

  function completeDay() {
    updateToday((day) => ({
      ...day,
      completedAt: new Date().toISOString()
    }));
  }

  return (
    <main className="min-h-screen">
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-teal-700">
              {now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-zinc-950">Dayline</h1>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center sm:min-w-[30rem]">
            <Stat label="Now" value={dayStatus === "complete" ? "Done" : activeBlock ? formatDuration(remainingSeconds) : "Ready"} />
            <Stat label="Tasks" value={`${counts.done}/${counts.total}`} />
            <Stat label="Work" value={`${workProgress}%`} />
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-6 sm:px-8 lg:grid-cols-[22rem_1fr]">
        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <TimerPanel
            activeBlock={activeBlock}
            nextBlock={nextBlock}
            status={dayStatus}
            remainingSeconds={remainingSeconds}
            started={Boolean(today.startedAt)}
            completed={Boolean(today.completedAt)}
            headingOverrides={state.headingOverrides}
            onStart={startDay}
            onComplete={completeDay}
          />

          <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <ListTodo size={18} className="text-teal-700" />
              <h2 className="text-base font-semibold text-zinc-950">Today</h2>
            </div>
            <div className="space-y-3 text-sm">
              <ProgressLine label="Pure execution" value="4h" />
              <ProgressLine label="Learning" value="1h 30m" />
              <ProgressLine label="Planned day" value="9:00 AM - 7:00 PM" />
            </div>
          </div>
        </aside>

        <section className="space-y-4">
          {DEFAULT_SCHEDULE.map((block) => (
            <BlockRow
              key={block.id}
              block={block}
              active={activeBlock?.id === block.id}
              status={getBlockRowStatus(block, now, dayStatus)}
              heading={resolveHeading(block, state.headingOverrides)}
              tasks={today.tasksByBlockId[block.id] ?? []}
              onHeadingChange={(heading) => updateHeading(block.id, heading)}
              onHeadingReset={() => resetHeading(block.id)}
              onTaskAdd={(text) => addTask(block.id, text)}
              onTaskToggle={(taskId) => toggleTask(block.id, taskId)}
              onTaskDelete={(taskId) => deleteTask(block.id, taskId)}
            />
          ))}
        </section>
      </div>
    </main>
  );
}

function getBlockRowStatus(block: ScheduleBlock, now: Date, dayStatus: DayStatus) {
  const currentSeconds = secondsSinceMidnight(now);
  const start = timeToSeconds(block.start);
  const end = timeToSeconds(block.end);

  if (dayStatus === "complete" || currentSeconds >= end) {
    return "Done";
  }

  if (currentSeconds >= start && currentSeconds < end) {
    return "Active";
  }

  return "Upcoming";
}

function TimerPanel({
  activeBlock,
  nextBlock,
  status,
  remainingSeconds,
  started,
  completed,
  headingOverrides,
  onStart,
  onComplete
}: {
  activeBlock?: ScheduleBlock;
  nextBlock?: ScheduleBlock;
  status: DayStatus;
  remainingSeconds: number;
  started: boolean;
  completed: boolean;
  headingOverrides: Record<string, string>;
  onStart: () => void;
  onComplete: () => void;
}) {
  const activeHeading = activeBlock ? resolveHeading(activeBlock, headingOverrides) : "";
  const nextHeading = nextBlock ? resolveHeading(nextBlock, headingOverrides) : "";

  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-400">Schedule timer</p>
          <h2 className="mt-1 text-lg font-semibold">{status === "complete" ? "Day complete" : activeHeading || "Before start"}</h2>
        </div>
        <Clock3 className="text-teal-300" size={24} />
      </div>

      <div className="py-8 text-center" role="status" aria-live="polite">
        <p className="font-mono text-6xl font-semibold tracking-normal">{status === "active" ? formatDuration(remainingSeconds) : "--:--"}</p>
        <p className="mt-3 text-sm text-zinc-400">
          {status === "before" && nextBlock ? `Starts at ${formatTime(nextBlock.start)}` : null}
          {status === "active" && activeBlock ? `Until ${formatTime(activeBlock.end)}` : null}
          {status === "complete" ? "All scheduled blocks are finished." : null}
        </p>
      </div>

      <div className="rounded-md bg-white/10 px-3 py-3 text-sm text-zinc-300">
        <span className="font-medium text-white">Next:</span> {nextHeading || "No more blocks"}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onStart}
          disabled={started}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white text-sm font-semibold text-zinc-950 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:bg-white/20 disabled:text-zinc-400"
        >
          <Play size={16} />
          {started ? "Started" : "Start Day"}
        </button>
        <button
          type="button"
          onClick={onComplete}
          disabled={completed}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-white/10 text-sm font-semibold text-zinc-100 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:text-zinc-500"
        >
          <Check size={16} />
          {completed ? "Closed" : "End Day"}
        </button>
      </div>
    </div>
  );
}

function BlockRow({
  block,
  active,
  status,
  heading,
  tasks,
  onHeadingChange,
  onHeadingReset,
  onTaskAdd,
  onTaskToggle,
  onTaskDelete
}: {
  block: ScheduleBlock;
  active: boolean;
  status: string;
  heading: string;
  tasks: ScheduleTask[];
  onHeadingChange: (heading: string) => void;
  onHeadingReset: () => void;
  onTaskAdd: (text: string) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}) {
  const doneCount = tasks.filter((task) => task.done).length;
  const tone = active ? "border-teal-600 bg-teal-50 shadow-sm" : "border-zinc-200 bg-white";

  return (
    <article className={`rounded-lg border p-4 transition ${tone}`}>
      <div className="grid gap-4 xl:grid-cols-[9rem_1fr_18rem]">
        <div>
          <p className="text-sm font-semibold text-zinc-950">
            {formatTime(block.start)} - {formatTime(block.end)}
          </p>
          <p className="mt-1 text-xs font-medium uppercase text-zinc-500">{block.part}</p>
          <span
            className={`mt-3 inline-flex rounded-md px-2 py-1 text-xs font-semibold ${
              active ? "bg-teal-700 text-white" : status === "Done" ? "bg-zinc-100 text-zinc-600" : "bg-amber-50 text-amber-800"
            }`}
          >
            {status}
          </span>
        </div>

        <div>
          <label htmlFor={`${block.id}-heading`} className="text-xs font-semibold uppercase text-zinc-500">
            Block heading
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id={`${block.id}-heading`}
              value={heading}
              onChange={(event) => onHeadingChange(event.target.value)}
              className="min-h-11 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
            <button
              type="button"
              onClick={onHeadingReset}
              aria-label={`Reset ${heading} heading`}
              title="Reset heading"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-500 transition hover:border-teal-700 hover:text-teal-800"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>

        <TaskPanel blockId={block.id} tasks={tasks} doneCount={doneCount} onTaskAdd={onTaskAdd} onTaskToggle={onTaskToggle} onTaskDelete={onTaskDelete} />
      </div>
    </article>
  );
}

function TaskPanel({
  blockId,
  tasks,
  doneCount,
  onTaskAdd,
  onTaskToggle,
  onTaskDelete
}: {
  blockId: string;
  tasks: ScheduleTask[];
  doneCount: number;
  onTaskAdd: (text: string) => void;
  onTaskToggle: (taskId: string) => void;
  onTaskDelete: (taskId: string) => void;
}) {
  const [text, setText] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onTaskAdd(text);
    setText("");
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={`${blockId}-task`} className="text-xs font-semibold uppercase text-zinc-500">
          Topics
        </label>
        <span className="text-xs font-medium text-zinc-500">
          {doneCount}/{tasks.length}
        </span>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          id={`${blockId}-task`}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Add topic"
          className="min-h-10 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
        <button
          type="submit"
          aria-label="Add topic"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-teal-700 text-white transition hover:bg-teal-800"
        >
          <Check size={16} />
        </button>
      </form>

      <div className="mt-3 space-y-2">
        {tasks.length === 0 ? <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm text-zinc-500">No topics yet.</p> : null}
        {tasks.map((task) => (
          <div key={task.id} className="flex min-h-10 items-center gap-2 rounded-md border border-zinc-200 bg-white px-2">
            <button
              type="button"
              onClick={() => onTaskToggle(task.id)}
              aria-label={task.done ? "Mark topic incomplete" : "Mark topic complete"}
              className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${
                task.done ? "border-teal-700 bg-teal-700 text-white" : "border-zinc-300 text-zinc-500 hover:border-teal-600"
              }`}
            >
              {task.done ? <Check size={14} /> : <Circle size={13} />}
            </button>
            <span className={`min-w-0 flex-1 break-words text-sm ${task.done ? "text-zinc-400 line-through" : "text-zinc-900"}`}>{task.text}</span>
            <button
              type="button"
              onClick={() => onTaskDelete(task.id)}
              aria-label="Delete topic"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
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

function ProgressLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
