import { Plus, WandSparkles } from "lucide-react";
import type { SectionId } from "@/lib/storage";
import { todayKey } from "@/lib/storage";
import { SECTION_ORDER } from "@/lib/settings";
import type { AppSettings } from "@/lib/settings";

function tomorrowKey() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return todayKey(d);
}

type TaskInputProps = {
  value: string;
  selectedSection: SectionId;
  selectedDate: string;
  settings: AppSettings;
  checking: boolean;
  englishStatus: string;
  onChange: (value: string) => void;
  onSectionChange: (id: SectionId) => void;
  onDateChange: (date: string) => void;
  onAdd: () => void;
  onFixSpelling: () => void;
};

export function TaskInput({
  value,
  selectedSection,
  selectedDate,
  settings,
  checking,
  englishStatus,
  onChange,
  onSectionChange,
  onDateChange,
  onAdd,
  onFixSpelling,
}: TaskInputProps) {
  const todayVal = todayKey();
  const tomorrowVal = tomorrowKey();

  const preset =
    selectedDate === todayVal ? "today"
    : selectedDate === tomorrowVal ? "tomorrow"
    : "custom";

  function handlePresetChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    if (v === "today") onDateChange(todayVal);
    else if (v === "tomorrow") onDateChange(tomorrowVal);
    else onDateChange(""); // reveal the date input; user must pick a date
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onAdd();
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Add a task..."
          aria-label="Add a task"
          spellCheck={true}
          autoCorrect="on"
          autoCapitalize="sentences"
          className="min-h-11 min-w-0 flex-[1_1_100%] rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:flex-[1_1_14rem]"
        />

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:flex-none">
          <select
            value={preset}
            onChange={handlePresetChange}
            aria-label="Task date"
            className="min-h-11 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:w-36 sm:flex-none"
          >
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="custom">Pick a date</option>
          </select>

          {preset === "custom" && (
            <input
              type="date"
              value={selectedDate}
              min={todayVal}
              required
              aria-label="Custom task date"
              onChange={(e) => onDateChange(e.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:w-40 sm:flex-none"
            />
          )}

          <select
            value={selectedSection}
            onChange={(e) => onSectionChange(e.target.value as SectionId)}
            aria-label="Task section"
            className="min-h-11 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:w-52 sm:flex-none"
          >
            {SECTION_ORDER.map((id) => (
              <option key={id} value={id}>
                {settings.sectionNames[id]}
              </option>
            ))}
          </select>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onFixSpelling}
              disabled={checking || !value.trim()}
              aria-label="Fix task spelling"
              title="Fix spelling"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 transition hover:border-teal-700 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
            >
              <WandSparkles size={16} />
            </button>
            <button
              type="submit"
              disabled={!value.trim() || !selectedDate}
              aria-label="Add task"
              title="Add task"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-teal-700 text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {englishStatus && <p className="mt-2 text-xs text-zinc-500">{englishStatus}</p>}
    </form>
  );
}
