# Upcoming Day Planning Plan

## Problem

Dayline currently edits only `todayKey()`, so users can add tasks for today but cannot prepare tomorrow or another upcoming day. The task list should also preserve input order: the first task added to a day and section should remain first in that section.

## Goals

- Keep the current single-screen Dayline workflow.
- Let users choose an editable planning date for today or a near-future day.
- Add tasks to the selected planning date, not always today.
- Render tasks in first-input-first-display order within each section.
- Keep history focused on past records.
- Avoid returning to the old scheduled block UI.

## Proposed UX

- Replace the Today/History view control with a compact planner control that supports:
  - Today
  - Tomorrow
  - A date picker for another upcoming day
  - History
- When an upcoming date is selected, show the same four section cards and task input against that date.
- Use clear labels such as `Today Plan`, `Tomorrow Plan`, or the selected date.
- Keep timers focused on the current selected day only when the selected day is today; upcoming-day plans should allow adding, completing, and deleting tasks, but should not start a live focus session for a future day.

## Data Model

- Reuse the existing `LedgerState.days[date]` structure.
- No storage migration should be required.
- Preserve task array order during local edits, remote memory remapping, and ledger merges.

## Acceptance Criteria

- A user can add tasks for today and tomorrow without the lists mixing.
- A user can select a future date and pre-add tasks for that date.
- Within a section, tasks display oldest first by `createdAt`/input order.
- History still lists only days before today, newest past day first.
- Future planned days are not shown as history records.
- Running timers remain tied to today and are not exposed for future dates.
- `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` pass.
