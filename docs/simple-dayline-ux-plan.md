# Dayline Simple UX Implementation Plan

## Status

Planning only. Do not implement from this document until the user approves the direction.

## Context

The current scheduled preview feels too large and heavy. The desired direction is closer to the simple Dayline reference at:

https://dayline.merklenode.dev/

That reference keeps the app focused on a small daily workspace:

- header with simple stats
- one task input
- Today Plan
- compact timer
- minimal panels

The new feature should keep that simple feel while adding four task sections and a manual task timer.

## Moa Consultation Summary

Consulted Moa oracles:

- `product-designer`
- `frontend-engineer`
- `product-manager`

Shared conclusion:

- Do not use a full wall-clock schedule UI.
- Keep one simple Today Plan screen.
- Use four lightweight section dividers.
- Put section management behind a settings icon.
- Add tasks by selecting one section and entering task text.
- Timer must not auto-start from real clock time.
- Timer should start only when the user starts a task.
- Breaks should be part of the task timer flow, not hidden wall-clock blocks.

## Product Shape

Dayline should become a simple daily task runner.

Main screen:

- Top header with date and simple stats.
- Add-task form.
- Today Plan grouped by four sections.
- Compact timer panel.
- Distraction note can remain if it still feels useful.

Avoid:

- full schedule grid
- 9:00 AM to 7:00 PM block layout
- auto-start by current time
- large cards for every time block
- complex analytics

## Four Sections

Default sections:

1. Plan & Research
2. Execution Time
3. Learning Time
4. Wind Up & Plan

Rules:

- All four section dividers should always be visible in Today Plan.
- Empty sections should show a small empty state.
- Section names can be managed from settings.
- The main screen should not expose section configuration controls directly.

## Add Task Flow

The add-task area should stay simple:

- text input for task title
- visible four-option section selector
- add button

Recommended UI:

- Use segmented buttons or compact chips for the four sections.
- Avoid a dropdown because there are only four options and visibility is better.
- Default selected section can be `Execution Time`.

Behavior:

- User selects a section.
- User types a task.
- User clicks add or presses Enter.
- Task appears under that section in Today Plan.
- Input clears after successful add.
- Task grouping persists after reload.

## Today Plan Layout

Use a simple grouped list:

```text
Today Plan

Plan & Research
  - Task

Execution Time
  - Task
  - Task

Learning Time
  Empty

Wind Up & Plan
  - Task
```

Each task row should include:

- complete toggle
- task title
- small timer start button
- delete button

Keep row height compact. Avoid large nested cards.

## Timer Model

The timer should be task-based and manual.

Rules:

- No timer starts automatically.
- Opening the app at any wall-clock time must show no running timer.
- User starts a timer from a task row.
- Only one task timer can run at a time.
- Timer can pause/resume.
- Timer can complete the current task.
- Timer state should survive reload where practical.

Recommended v1 behavior:

- Countdown timer with a default work duration.
- Default work duration: 25 minutes.
- Default break duration: 5 minutes.
- After a work countdown ends, show a break option.
- Break is counted separately from work time.

Settings can later allow changing these defaults.

## Settings

Settings opens from a small gear icon in the header.

Settings should manage:

- section names
- section order, optional later
- default work duration
- default break duration
- optional reset-to-defaults

For the first simple implementation, section rename and timer defaults are enough.

Do not put settings controls in the main Today Plan.

## Data Model Recommendation

Use localStorage for v1.

Suggested state:

```ts
type Section = {
  id: string;
  name: string;
};

type Task = {
  id: string;
  sectionId: string;
  title: string;
  done: boolean;
  createdAt: string;
};

type TimerState = {
  taskId?: string;
  mode: "idle" | "work" | "break" | "paused";
  startedAt?: string;
  pausedRemainingSeconds?: number;
  workSecondsCompleted: number;
  breakSecondsCompleted: number;
};

type DayState = {
  date: string;
  tasks: Task[];
  timer: TimerState;
};
```

Important:

- Store tasks as a flat array.
- Derive grouped sections during render.
- Do not store duplicated grouped task arrays.
- Use stable section IDs so renamed sections keep their tasks.

## Implementation Phases

### Phase 1: Simplify UI Back To Today Plan

Goal:

- Remove the massive schedule-block layout.
- Return to a simple Dayline page structure.

Deliverables:

- Header stats.
- Add task input.
- Section selector.
- Today Plan grouped by four sections.
- LocalStorage persistence.

Acceptance:

- All four sections are visible.
- Adding a task to a selected section works.
- Tasks persist after reload.

### Phase 2: Manual Per-Task Timer

Goal:

- Add a simple timer attached to the active task.

Deliverables:

- Start timer from task row.
- Pause/resume timer.
- Stop/complete task.
- Only one task runs at once.

Acceptance:

- App never auto-starts timer.
- Timer starts only from user action.
- Starting another task stops or switches from the previous active task intentionally.
- Reload does not create two running timers.

### Phase 3: Break Flow

Goal:

- Add break handling without turning the app into a schedule grid.

Deliverables:

- Break starts after work timer finishes or from a break button.
- Break countdown uses default break duration.
- Break can end manually.

Acceptance:

- Work time and break time are distinguishable in state.
- Break UI is visible and simple.
- User can return to task work after break.

### Phase 4: Settings Panel

Goal:

- Move configuration behind a settings icon.

Deliverables:

- Gear icon in header.
- Settings modal or side panel.
- Edit section names.
- Edit default work/break durations.
- Reset defaults.

Acceptance:

- Existing tasks remain assigned after section rename.
- Settings can be opened and closed with keyboard.
- Main screen stays clean.

## Non-Goals For This Iteration

- No wall-clock schedule blocks.
- No automatic time-of-day transitions.
- No calendar view.
- No drag-and-drop schedule.
- No cloud sync.
- No advanced analytics.
- No notifications unless requested later.

## Testing Plan

Run:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Manual checks:

1. Fresh load shows four section dividers.
2. Add task to each section.
3. Reload and confirm tasks remain in correct sections.
4. Rename a section in settings and confirm tasks stay attached.
5. Start a task timer and confirm no other task timer runs.
6. Pause/resume timer.
7. Complete task from timer flow.
8. Start break and return to work.
9. Confirm opening app does not auto-start timer.
10. Check mobile layout for no overlapping text.

## Open Decisions Before Implementation

Recommended assumptions for v1:

- Use localStorage only.
- Use countdown timer, not stopwatch.
- Use 25 minute default work timer.
- Use 5 minute default break timer.
- Reset daily tasks by local date.

Confirm before implementation:

1. Should task timer be countdown or stopwatch?
2. Should unfinished tasks roll over to the next day?
3. Should the distraction note stay on the simple screen?
4. Should section order be editable in v1, or only section names?

## Final Direction

Build Dayline as a simple Today Plan app with four named sections and a manual per-task timer. Keep the visual style close to the earlier simple deployment. Add power through settings, not through a larger main interface.
