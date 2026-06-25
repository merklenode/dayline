import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { AppSettings } from "@/lib/settings";
import { SECTION_ORDER, DEFAULT_SECTION_NAMES, DEFAULT_WORK_MINUTES, DEFAULT_BREAK_MINUTES } from "@/lib/settings";

type SettingsModalProps = {
  settings: AppSettings;
  onClose: () => void;
  onSave: (settings: AppSettings) => void;
};

export function SettingsModal({ settings, onClose, onSave }: SettingsModalProps) {
  const [draft, setDraft] = useState<AppSettings>({
    sectionNames: { ...settings.sectionNames },
    workMinutes: settings.workMinutes,
    breakMinutes: settings.breakMinutes
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function resetDefaults() {
    setDraft({
      sectionNames: { ...DEFAULT_SECTION_NAMES },
      workMinutes: DEFAULT_WORK_MINUTES,
      breakMinutes: DEFAULT_BREAK_MINUTES
    });
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
              {SECTION_ORDER.map((id) => (
                <div key={id} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs text-zinc-400">{id}</span>
                  <input
                    type="text"
                    value={draft.sectionNames[id]}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        sectionNames: { ...d.sectionNames, [id]: e.target.value }
                      }))
                    }
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              ))}
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
