import { Plus, WandSparkles } from "lucide-react";
import type { SectionId } from "@/lib/storage";
import { SECTION_ORDER } from "@/lib/settings";
import type { AppSettings } from "@/lib/settings";

type TaskInputProps = {
  value: string;
  selectedSection: SectionId;
  settings: AppSettings;
  checking: boolean;
  englishStatus: string;
  onChange: (value: string) => void;
  onSectionChange: (id: SectionId) => void;
  onAdd: () => void;
  onFixSpelling: () => void;
};

export function TaskInput({ value, selectedSection, settings, checking, englishStatus, onChange, onSectionChange, onAdd, onFixSpelling }: TaskInputProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onAdd(); }}
          placeholder="Add a task"
          spellCheck={true}
          autoCorrect="on"
          autoCapitalize="sentences"
          className="min-h-11 flex-1 rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
        <button
          type="button"
          onClick={onFixSpelling}
          disabled={checking || !value.trim()}
          aria-label="Fix task spelling"
          title="Fix spelling"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 transition hover:border-teal-700 hover:text-teal-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
        >
          <WandSparkles size={16} />
        </button>
        <button
          type="button"
          onClick={onAdd}
          disabled={!value.trim()}
          aria-label="Add task"
          className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-teal-700 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
        {SECTION_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSectionChange(id)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition ${
              selectedSection === id
                ? "bg-teal-700 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {settings.sectionNames[id]}
          </button>
        ))}
      </div>

      {englishStatus && <p className="mt-2 text-xs text-zinc-500">{englishStatus}</p>}
    </div>
  );
}
