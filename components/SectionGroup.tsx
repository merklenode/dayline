import type { FocusTask, SectionId } from "@/lib/storage";
import type { TaskTimerProps } from "./TaskTimer";
import { TaskRow } from "./TaskRow";

type SectionGroupProps = {
  id: SectionId;
  name: string;
  tasks: FocusTask[];
  activeTaskId: string | null;
  timerProps: Omit<TaskTimerProps, "taskId" | "isActive">;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function SectionGroup({ id, name, tasks, activeTaskId, timerProps, onToggle, onDelete }: SectionGroupProps) {
  return (
    <div>
      <div className="flex items-center gap-3 border-b border-zinc-100 bg-stone-50 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{name}</span>
        {tasks.length > 0 && (
          <span className="ml-auto text-xs text-zinc-400">{tasks.filter(t => t.done).length}/{tasks.length}</span>
        )}
      </div>
      {tasks.length === 0 ? (
        <div className="px-4 py-4 text-center text-xs text-zinc-400">No tasks yet</div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              activeTaskId={activeTaskId}
              timerProps={timerProps}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
