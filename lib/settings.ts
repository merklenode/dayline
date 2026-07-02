export type Section = { id: string; name: string };

export type AppSettings = {
  sections: Section[];
  workMinutes: number;
  breakMinutes: number;
};

export const DEFAULT_SECTIONS: Section[] = [
  { id: "plan",      name: "Plan & Research" },
  { id: "execution", name: "Execution Time" },
  { id: "learning",  name: "Learning Time" },
  { id: "windup",    name: "Wind Up & Plan" },
];

export const DEFAULT_WORK_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;

// Used only for migrating old localStorage format — not exported.
const LEGACY_SECTION_ORDER = ["plan", "execution", "learning", "windup"] as const;
const LEGACY_DEFAULT_NAMES: Record<string, string> = {
  plan: "Plan & Research",
  execution: "Execution Time",
  learning: "Learning Time",
  windup: "Wind Up & Plan",
};

const SETTINGS_KEY = "dayline:settings";

export function defaultSettings(): AppSettings {
  return {
    sections: DEFAULT_SECTIONS.map(s => ({ ...s })),
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

    // Migrate old format: { sectionNames: Record<string, string>, ... }
    if (parsed.sectionNames && !parsed.sections) {
      const names = parsed.sectionNames as Record<string, string>;
      return {
        sections: LEGACY_SECTION_ORDER.map(id => ({
          id,
          name: names[id] ?? LEGACY_DEFAULT_NAMES[id],
        })),
        workMinutes: (parsed.workMinutes as number) ?? DEFAULT_WORK_MINUTES,
        breakMinutes: (parsed.breakMinutes as number) ?? DEFAULT_BREAK_MINUTES,
      };
    }

    const sections = Array.isArray(parsed.sections) && (parsed.sections as Section[]).length > 0
      ? (parsed.sections as Section[])
      : DEFAULT_SECTIONS.map(s => ({ ...s }));

    return {
      sections,
      workMinutes: (parsed.workMinutes as number) ?? DEFAULT_WORK_MINUTES,
      breakMinutes: (parsed.breakMinutes as number) ?? DEFAULT_BREAK_MINUTES,
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
