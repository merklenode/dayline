import type { AppSettings } from "@/lib/settings";
import type { DayRecord } from "@/lib/storage";

type DailyRecordsProps = {
  records: DayRecord[];
  settings: AppSettings;
};

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  return parsed.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function DailyRecords({ records, settings }: DailyRecordsProps) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h2 className="text-base font-semibold text-zinc-950">Daily Records</h2>
      </div>

      {records.length === 0 ? (
        <div className="px-4 py-5 text-center">
          <p className="text-sm font-medium text-zinc-500">No previous records yet.</p>
          <p className="mt-1 text-xs text-zinc-400">Completed days will appear here automatically.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-100">
          {records.map((record) => {
            const doneCount = record.tasks.filter((task) => task.done).length;
            const groupedTasks = record.tasks.reduce<Record<string, typeof record.tasks>>(
              (groups, task) => {
                const sectionName = settings.sections.find((s) => s.id === task.section)?.name ?? "(removed)";
                groups[sectionName] = [...(groups[sectionName] ?? []), task];
                return groups;
              },
              {}
            );

            return (
              <article key={record.date} className="px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-zinc-950">{formatDate(record.date)}</h3>
                  <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
                    <span>{doneCount}/{record.tasks.length} done</span>
                    <span>{record.focusMinutes}m focus</span>
                  </div>
                </div>

                {record.tasks.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {Object.entries(groupedTasks).map(([sectionName, tasks]) => (
                      <div key={sectionName}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                          {sectionName}
                        </p>
                        <ul className="mt-1 space-y-1">
                          {tasks.map((task) => (
                            <li key={task.id} className="flex items-start gap-2 text-sm text-zinc-700">
                              <span className="mt-0.5 text-xs text-zinc-400">{task.done ? "Done" : "Open"}</span>
                              <span className={task.done ? "text-zinc-500 line-through" : ""}>{task.title}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {record.distractionNote.trim() && (
                  <p className="mt-3 rounded-md bg-stone-50 px-3 py-2 text-sm text-zinc-600">
                    {record.distractionNote}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
