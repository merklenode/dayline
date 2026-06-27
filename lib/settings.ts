import type { SectionId } from "./storage";

export const SECTION_ORDER: SectionId[] = ["plan", "execution", "learning", "windup"];

export const DEFAULT_SECTION_NAMES: Record<SectionId, string> = {
  plan: "Plan & Research",
  execution: "Execution Time",
  learning: "Learning Time",
  windup: "Wind Up & Plan"
};

export const DEFAULT_WORK_MINUTES = 25;
export const DEFAULT_BREAK_MINUTES = 5;

export type AppSettings = {
  sectionNames: Record<SectionId, string>;
  workMinutes: number;
  breakMinutes: number;
};

const SETTINGS_KEY = "dayline:settings";

export function defaultSettings(): AppSettings {
  return {
    sectionNames: { ...DEFAULT_SECTION_NAMES },
    workMinutes: DEFAULT_WORK_MINUTES,
    breakMinutes: DEFAULT_BREAK_MINUTES
  };
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return {
      sectionNames: { ...DEFAULT_SECTION_NAMES, ...parsed.sectionNames },
      workMinutes: parsed.workMinutes ?? DEFAULT_WORK_MINUTES,
      breakMinutes: parsed.breakMinutes ?? DEFAULT_BREAK_MINUTES
    };
  } catch {
    return defaultSettings();
  }
}

export function saveSettings(settings: AppSettings) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
