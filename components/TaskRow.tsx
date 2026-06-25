import { Check, Circle, Trash2 } from "lucide-react";
import type { FocusTask } from "@/lib/storage";
import { TaskTimer, type TaskTimerProps } from "./TaskTimer";

type TaskRowProps = {
  task: FocusTask;
  timerProps: Omit<TaskTimerProps, "taskId" | "isActive">;
  activeTaskId: string | null;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function TaskRow({ task, timerProps, activeTaskId, onToggle, onDelete }: TaskRowProps) {
  const isActive = activeTaskId === task.id;

  return (
    <div className="flex min-h-14 items-center gap-3 px-4 py-2.5">
      <button
        type="button"
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? "Mark incomplete" : "Mark complete"}
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border transition ${
          task.done
            ? "border-teal-700 bg-teal-700 text-white"
            : "border-zinc-300 text-zinc-500 hover:border-teal-600"
        }`}
      >
        {task.done ? <Check size={15} /> : <Circle size={14} />}
      </button>

      <span className={`flex-1 text-sm leading-snug ${task.done ? "text-zinc-400 line-through" : "text-zinc-900"}`}>
        {task.title}
      </span>

      {!task.done && (
        <TaskTimer taskId={task.id} isActive={isActive} {...timerProps} />
      )}

      <button
        type="button"
        onClick={() => onDelete(task.id)}
        aria-label="Delete task"
        className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
