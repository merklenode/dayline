import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { AppSettings } from "@/lib/settings";
import { DEFAULT_WORK_MINUTES, DEFAULT_BREAK_MINUTES, defaultSettings } from "@/lib/settings";

type SettingsModalProps = {
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
};

export function SettingsModal({ settings, onClose, onSave }: SettingsModalProps) {
  const [draft, setDraft] = useState<AppSettings>({
    sections: settings.sections.map(s => ({ ...s })),
    workMinutes: settings.workMinutes,
    breakMinutes: settings.breakMinutes,
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function resetDefaults() {
    setDraft(defaultSettings());
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-950">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="inline-flex h-8 w-8 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-100"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Section Names</p>
            <div className="space-y-2">
              {draft.sections.map((section, i) => (
                <div key={section.id} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) =>
                      setDraft(d => ({
                        ...d,
                        sections: d.sections.map((s, j) =>
                          j === i ? { ...s, name: e.target.value } : s
                        ),
                      }))
                    }
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDraft(d => ({
                        ...d,
                        sections: d.sections.filter((_, j) => j !== i),
                      }))
                    }
                    disabled={draft.sections.length <= 1}
                    aria-label={`Delete section ${section.name || String(i + 1)}`}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-400 transition hover:bg-zinc-100 hover:text-red-600 disabled:cursor-not-allowed disabled:text-zinc-200"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setDraft(d => ({
                    ...d,
                    sections: [...d.sections, { id: crypto.randomUUID(), name: "" }],
                  }))
                }
                className="mt-1 text-sm text-teal-700 transition hover:text-teal-900"
              >
                + Add section
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">Timer Durations</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-zinc-600">Work (min)</label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={draft.workMinutes}
                  onChange={(e) => setDraft((d) => ({ ...d, workMinutes: Math.max(1, Number(e.target.value)) }))}
                  className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-zinc-600">Break (min)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={draft.breakMinutes}
                  onChange={(e) => setDraft((d) => ({ ...d, breakMinutes: Math.max(1, Number(e.target.value)) }))}
                  className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={resetDefaults}
            className="text-sm text-zinc-500 transition hover:text-red-600"
          >
            Reset defaults
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
