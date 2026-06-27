import { Check, Circle, Play, Trash2 } from "lucide-react";
import type { FocusTask } from "@/lib/storage";

type TaskRowProps = {
  task: FocusTask;
  isActive: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
};

export function TaskRow({ task, isActive, onToggle, onDelete, onStart }: TaskRowProps) {
  return (
    <div
      className={`flex min-h-14 items-center gap-3 px-4 py-2.5 transition-colors ${
        isActive ? "border-l-2 border-l-teal-500 bg-teal-50/60 pl-[14px]" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
          task.done
            ? "border-teal-700 bg-teal-700 text-white"
            : "border-zinc-300 text-zinc-500 hover:border-teal-600"
        }`}
      >
        {task.done ? <Check size={15} /> : <Circle size={14} />}
      </button>

      <span
        className={`flex-1 text-sm leading-snug ${
          task.done ? "text-zinc-400 line-through" : "text-zinc-900"
        }`}
      >
        {task.title}
      </span>

      {!task.done && (
        isActive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-700">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            Active
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onStart(task.id)}
            aria-label="Start focus timer"
            title="Start focus"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <Play size={14} />
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
