import { Pause, Play, RotateCcw } from "lucide-react";

function formatSeconds(total: number) {
  const m = Math.floor(total / 60).toString().padStart(2, "0");
  const s = (total % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export type TaskTimerProps = {
  taskId: string;
  isActive: boolean;
  running: boolean;
  mode: "work" | "break";
  secondsLeft: number;
  onStart: (taskId: string) => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
};

export function TaskTimer({ taskId, isActive, running, mode, secondsLeft, onStart, onPause, onResume, onReset }: TaskTimerProps) {
  if (!isActive) {
    return (
      <button
        type="button"
        onClick={() => onStart(taskId)}
        aria-label="Start timer"
        title="Start timer"
        className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition hover:bg-teal-50 hover:text-teal-700"
      >
        <Play size={14} />
      </button>
    );
  }

  if (mode === "break") {
    return (
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-xs font-semibold text-teal-600">
          {formatSeconds(secondsLeft)}
        </span>
        <span className="rounded bg-teal-50 px-1.5 py-0.5 text-xs font-medium text-teal-700">
          break
        </span>
        <button
          type="button"
          onClick={onReset}
          aria-label="Stop break"
          title="Stop break"
          className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
        >
          <RotateCcw size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-xs font-semibold text-zinc-700 tabular-nums">
        {formatSeconds(secondsLeft)}
      </span>
      <button
        type="button"
        onClick={running ? onPause : onResume}
        aria-label={running ? "Pause timer" : "Resume timer"}
        title={running ? "Pause" : "Resume"}
        className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
      >
        {running ? <Pause size={13} /> : <Play size={13} />}
      </button>
      <button
        type="button"
        onClick={onReset}
        aria-label="Reset timer"
        title="Reset"
        className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
      >
        <RotateCcw size={12} />
      </button>
    </div>
  );
}
