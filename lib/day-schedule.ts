export type ScheduleBlockKind = "work" | "break" | "meal";

export type ScheduleBlock = {
  id: string;
  part: string;
  start: string;
  end: string;
  defaultHeading: string;
  kind: ScheduleBlockKind;
};

export type ScheduleTask = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
};

export type ScheduleDayState = {
  date: string;
  tasksByBlockId: Record<string, ScheduleTask[]>;
  startedAt?: string;
  completedAt?: string;
};

export type ScheduleState = {
  schemaVersion: 1;
  headingOverrides: Record<string, string>;
  days: Record<string, ScheduleDayState>;
};

export type DayStatus = "before" | "active" | "complete";

export const SCHEDULE_STORAGE_KEY = "dayline:schedule:v1";

export const DEFAULT_SCHEDULE: ScheduleBlock[] = [
  {
    id: "research-strategy",
    part: "Plan & Research",
    start: "09:00",
    end: "10:30",
    defaultHeading: "Research & Strategy",
    kind: "work"
  },
  {
    id: "morning-break",
    part: "Plan & Research",
    start: "10:30",
    end: "10:50",
    defaultHeading: "Break",
    kind: "break"
  },
  {
    id: "deep-execution-1",
    part: "Execution Time",
    start: "10:50",
    end: "12:20",
    defaultHeading: "Deep Execution 1",
    kind: "work"
  },
  {
    id: "quick-stretch",
    part: "Execution Time",
    start: "12:20",
    end: "12:30",
    defaultHeading: "Quick Stretch",
    kind: "break"
  },
  {
    id: "deep-execution-2",
    part: "Execution Time",
    start: "12:30",
    end: "13:30",
    defaultHeading: "Deep Execution 2",
    kind: "work"
  },
  {
    id: "lunch-disconnect",
    part: "Execution Time",
    start: "13:30",
    end: "14:45",
    defaultHeading: "Lunch & Disconnect",
    kind: "meal"
  },
  {
    id: "deep-execution-3",
    part: "Execution Time",
    start: "14:45",
    end: "16:15",
    defaultHeading: "Deep Execution 3",
    kind: "work"
  },
  {
    id: "afternoon-break",
    part: "Execution Time",
    start: "16:15",
    end: "16:35",
    defaultHeading: "Afternoon Break",
    kind: "break"
  },
  {
    id: "learning-upskilling",
    part: "Learning Time",
    start: "16:35",
    end: "18:05",
    defaultHeading: "Learning & Upskilling",
    kind: "work"
  },
  {
    id: "evening-break",
    part: "Learning Time",
    start: "18:05",
    end: "18:20",
    defaultHeading: "Evening Break",
    kind: "break"
  },
  {
    id: "wrap-up",
    part: "Wind Up & Plan",
    start: "18:20",
    end: "19:00",
    defaultHeading: "Wrap-up",
    kind: "work"
  }
];

export function createEmptyScheduleState(): ScheduleState {
  return {
    schemaVersion: 1,
    headingOverrides: {},
    days: {}
  };
}

export function createEmptyScheduleDay(date: string): ScheduleDayState {
  return {
    date,
    tasksByBlockId: {}
  };
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function timeToSeconds(time: string) {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 3600 + Number(minutes) * 60;
}

export function secondsSinceMidnight(date: Date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

export function formatDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, totalSeconds);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatTime(time: string) {
  const [hourText = "0", minuteText = "0"] = time.split(":");
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteText} ${suffix}`;
}

export function resolveHeading(block: ScheduleBlock, overrides: Record<string, string>) {
  return overrides[block.id]?.trim() || block.defaultHeading;
}

export function getDayStatus(blocks: ScheduleBlock[], now: Date): DayStatus {
  const currentSeconds = secondsSinceMidnight(now);
  const first = blocks[0];
  const last = blocks[blocks.length - 1];

  if (!first || !last || currentSeconds < timeToSeconds(first.start)) {
    return "before";
  }

  if (currentSeconds >= timeToSeconds(last.end)) {
    return "complete";
  }

  return "active";
}

export function getActiveBlock(blocks: ScheduleBlock[], now: Date) {
  const currentSeconds = secondsSinceMidnight(now);
  return blocks.find((block) => currentSeconds >= timeToSeconds(block.start) && currentSeconds < timeToSeconds(block.end));
}

export function getNextBlock(blocks: ScheduleBlock[], now: Date) {
  const currentSeconds = secondsSinceMidnight(now);
  return blocks.find((block) => currentSeconds < timeToSeconds(block.start));
}

export function loadScheduleState(): ScheduleState {
  if (typeof window === "undefined") {
    return createEmptyScheduleState();
  }

  try {
    const raw = window.localStorage.getItem(SCHEDULE_STORAGE_KEY);
    if (!raw) {
      return createEmptyScheduleState();
    }

    const parsed = JSON.parse(raw) as Partial<ScheduleState>;
    if (parsed.schemaVersion !== 1 || !parsed.days || !parsed.headingOverrides) {
      return createEmptyScheduleState();
    }

    return {
      schemaVersion: 1,
      headingOverrides: parsed.headingOverrides,
      days: parsed.days
    };
  } catch {
    return createEmptyScheduleState();
  }
}

export function saveScheduleState(state: ScheduleState) {
  window.localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(state));
}
