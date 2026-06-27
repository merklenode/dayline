import type { FocusTask } from "@/lib/storage";
import { TaskRow } from "./TaskRow";

type SectionGroupProps = {
  name: string;
  tasks: FocusTask[];
  activeTaskId: string | null;
  onStart: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
};

export function SectionGroup({ name, tasks, activeTaskId, onStart, onToggle, onDelete }: SectionGroupProps) {
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-zinc-100 bg-stone-50 px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">{name}</span>
        {tasks.length > 0 && (
          <span className="ml-auto text-xs text-zinc-400">
            {doneCount}/{tasks.length}
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <p className="text-xs text-zinc-400">No tasks yet</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {tasks.map((task) => (
            <li key={task.id}>
              <TaskRow
                task={task}
                isActive={activeTaskId === task.id}
                onStart={onStart}
                onToggle={onToggle}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
