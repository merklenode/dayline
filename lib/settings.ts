export type Section = { id: string; name: string };

export type AppSettings = {
  sections: Section[];
  workMinutes: number;
  breakMinutes: number;
};

const DEFAULT_WORK_MINUTES = 25;
const DEFAULT_BREAK_MINUTES = 5;

const SETTINGS_KEY = "dayline:settings";

export function defaultSettings(): AppSettings {
  return {
    sections: [
      { id: "plan",      name: "Plan & Research" },
      { id: "execution", name: "Execution Time" },
      { id: "learning",  name: "Learning Time" },
      { id: "windup",    name: "Wind Up & Plan" },
    ],
    workMinutes: DEFAULT_WORK_MINUTES,
    breakMinutes: DEFAULT_BREAK_MINUTES,
  };
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Record<string, unknown>;

    // Migrate old { sectionNames: Record<string,string> } shape
    if (parsed.sectionNames && !parsed.sections) {
      const oldNames = parsed.sectionNames as Record<string, string>;
      const def = defaultSettings();
      return {
        sections: def.sections.map((s) => ({ id: s.id, name: oldNames[s.id] ?? s.name })),
        workMinutes: typeof parsed.workMinutes === "number" ? parsed.workMinutes : DEFAULT_WORK_MINUTES,
        breakMinutes: typeof parsed.breakMinutes === "number" ? parsed.breakMinutes : DEFAULT_BREAK_MINUTES,
      };
    }

    const p = parsed as Partial<AppSettings>;
    return {
      sections: Array.isArray(p.sections) ? p.sections : defaultSettings().sections,
      workMinutes: p.workMinutes ?? DEFAULT_WORK_MINUTES,
      breakMinutes: p.breakMinutes ?? DEFAULT_BREAK_MINUTES,
    };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: AppSettings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn("saveSettings: localStorage write failed", e);
  }
}
