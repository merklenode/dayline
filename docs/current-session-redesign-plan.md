# Dayline Current Session Redesign Plan

## Status

Approved direction for implementation after Moa consultation.

## Goal

Make Dayline feel more finished and more impressive without making the app large again.

The app should stay simple:

- one Today Plan screen
- four task sections
- settings behind a gear icon
- no wall-clock schedule grid
- no auto-start by time of day

The redesign should make the current task session unmistakable.

## Moa Consultation Summary

Consulted Moa oracles:

- `product-designer`
- `frontend-engineer`
- `product-manager`
- `testing-engineer`

Shared conclusion:

- The missing polish is mostly hierarchy and state clarity, not more features.
- Promote the active task/timer into a current-session hero card.
- Keep the layout single-column and focused.
- Replace loose inline countdown behavior with one explicit session state machine.
- Store timer deadlines with timestamps instead of decrementing counters as the source of truth.
- Add complete empty, idle, running, paused, break, complete, and all-done states.

## Product Shape

The page should read in this order:

1. Header with Dayline, date, simple stats, settings.
2. Current Session card.
3. Add task form with section selector.
4. Today Plan grouped by section.
5. Distraction note.

The current session card is the visual focus.

## Current Session Card

The card should always be visible.

Idle state:

- Show `Ready to focus`.
- Show helper text such as `Start a task from Today Plan`.
- No countdown runs.

Running focus state:

- Show active task title.
- Show section label.
- Show large countdown.
- Show phase label: `Focus`.
- Show progress bar/ring.
- Show next step: `Break next`.
- Primary controls: Pause, Mark done.
- Secondary control: Stop.

Paused state:

- Show active task title.
- Show `Paused`.
- Countdown is frozen.
- Primary controls: Resume, Stop.

Break state:

- Show `Break`.
- Show countdown.
- Show previous task context.
- Controls: End break / Stop.
- Do not auto-start the next focus task.

Complete state:

- Show short confirmation.
- Offer next action: Start break, Start next task, or Back to plan.

## Timer State Model

Use one central session object.

Recommended shape:

```ts
type SessionPhase = "focus" | "break";

type SessionState =
  | { status: "idle" }
  | {
      status: "running";
      phase: SessionPhase;
      taskId: string;
      endsAt: number;
      durationMs: number;
    }
  | {
      status: "paused";
      phase: SessionPhase;
      taskId: string;
      remainingMs: number;
      durationMs: number;
    }
  | {
      status: "complete";
      phase: SessionPhase;
      taskId: string;
    };
```

Rules:

- Only one session can exist at a time.
- Start is always a user action.
- No timer starts from wall-clock time.
- Store `endsAt` as the source of truth for running countdowns.
- Derive remaining time from `endsAt - Date.now()`.
- `setInterval` should only trigger re-render; it should not be the source of elapsed time.
- Pause stores `remainingMs`.
- Resume creates a new `endsAt`.
- A running focus session reaching zero moves to `complete`, not auto-running break.
- The user starts or skips break manually.
- Changing settings affects new sessions, not an in-flight session.

## Start Task Behavior

When no session is active:

- Start immediately starts the selected task.

When another session is active:

- Prefer a simple confirmation before replacing the active session.
- Text: `Switch focus to this task?`
- Confirm stops/replaces the previous session.
- Cancel keeps current session unchanged.

## Visual Polish Requirements

Keep the UI clean and practical:

- Use one `max-w-2xl` column.
- Use consistent spacing and component sizes.
- Give the current session card stronger hierarchy than the task list.
- Use section headers as lightweight dividers.
- Use `ul`/`li` semantics for task lists where practical.
- Use visible hover/focus/active/disabled states on all controls.
- Make selected section chips distinguishable by more than color.
- Add empty state for no tasks.
- Add all-done state when every task is complete.
- Avoid decorative gradients, oversized cards, or marketing-style layout.

## Persistence

Use localStorage for v1.

Persist:

- session status
- task id
- phase
- endsAt or remainingMs
- durationMs

On reload:

- If running and `endsAt` is still future, restore running state.
- If running and `endsAt` is past, restore as `complete`.
- If paused, restore paused state.
- Never auto-start a new session just because of current time.

## Accessibility

- Current session changes should have a live region.
- Do not announce every second to screen readers.
- Buttons must have accessible names.
- Keyboard users must be able to start, pause, resume, stop, and complete.
- Settings modal must remain keyboard accessible.
- Honor reduced-motion preference for any transitions.

## Implementation Phases

### Phase 1: Session State Model

- Replace timer counter persistence with a central session object.
- Add helpers for starting, pausing, resuming, completing, stopping, and starting break.
- Derive countdown from `endsAt`.

### Phase 2: Current Session Card

- Add `CurrentSessionCard` component.
- Always render it above task input.
- Show idle, running, paused, break, and complete states.
- Move primary timer controls into this card.

### Phase 3: Task Row Simplification

- Task rows show a compact Start button or active marker.
- Rows should not contain competing full timer controls.
- Non-active rows stay quiet.
- Active row visually connects to the session card.

### Phase 4: Visual Polish

- Tighten header, stats, task input, section headers, and empty states.
- Add all-done state.
- Improve focus-visible styling and selected chip affordance.
- Keep layout single-column.

### Phase 5: Verification And Deployment

- Run local verification.
- Use Moa review/fix workflow.
- Merge to `dev`.
- Deploy Vercel preview.

## Non-Goals

- No wall-clock schedule grid.
- No automatic time-of-day start.
- No calendar.
- No cloud sync.
- No advanced analytics.
- No multi-theme system.
- No major data model rewrite beyond session state.

## Acceptance Criteria

- [ ] Current Session card is visible in idle, running, paused, break, and complete states.
- [ ] No timer runs when the app first opens.
- [ ] Starting a task makes that task the only active session.
- [ ] Starting another task while one is active asks for confirmation or clearly replaces the session.
- [ ] Countdown is derived from timestamp deadline and does not drift after tab backgrounding.
- [ ] Pause freezes remaining time.
- [ ] Resume continues from the frozen remaining time.
- [ ] Focus reaching zero enters a complete state and offers break or return-to-plan actions.
- [ ] Break does not auto-start a new task.
- [ ] Reload during running session restores correct remaining time or complete state.
- [ ] Reload during paused session restores paused state.
- [ ] Settings duration changes affect only newly started sessions.
- [ ] Empty task state is polished.
- [ ] All-done state is polished.
- [ ] Layout remains single-column and simple.
- [ ] `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` pass.

## Testing Checklist

- [ ] Fresh load: idle session, no timer running.
- [ ] Add task and start focus.
- [ ] Pause and resume.
- [ ] Reload while running.
- [ ] Reload while paused.
- [ ] Let focus expire with a short test duration.
- [ ] Start break from complete state.
- [ ] End break.
- [ ] Start second task while first is active.
- [ ] Confirm no two timers can run.
- [ ] Edit settings duration and start a new task.
- [ ] Check empty state and all-done state.
- [ ] Check keyboard navigation and focus rings.
- [ ] Check mobile layout.
