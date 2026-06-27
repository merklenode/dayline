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
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-zinc-100 bg-stone-50 px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-zinc-950">{name}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">Section progress</p>
        </div>
        <span className="ml-auto shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200">
          {doneCount}/{tasks.length}
        </span>
      </div>

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
    </section>
  );
}
