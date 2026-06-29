# Task Input Calendar Control Plan

## Goal

Fix the task add panel alignment by removing the visible date selector bar and keeping date planning behind a compact calendar icon.

## Current Problem

The task input currently renders:

- Task text input
- Today/Tomorrow/Pick a date select
- Conditional custom date input
- Section select
- Fix spelling button
- Add button

The date selector consumes a full control slot and wraps awkwardly, which makes the rest of the panel feel misaligned.

## Planned UI

- Keep today as the default task date.
- Remove the visible Today/Tomorrow/Pick a date select.
- Add a compact calendar icon button/control where the fix-spelling button currently sits.
- Use the calendar control to pick a custom date when planning ahead.
- Move the fix-spelling wand action into the trailing end of the task title input.
- Keep the section select and add button aligned with stable control sizes.
- Show a small selected-date label only when the selected date is not today, so the default Today flow stays quiet.

## Implementation Notes

- Update `components/TaskInput.tsx`.
- Import `CalendarDays` from `lucide-react`.
- Replace preset state/select logic with a hidden or visually compact `input type="date"` inside a fixed-size icon control.
- Keep `min={todayVal}` so past dates cannot be selected.
- Keep add disabled when the title is blank or no date is selected.
- Preserve the existing `selectedDate` state and `onDateChange` contract from `app/page.tsx`.

## Testing Strategy

- Run lint, TypeScript, and production build.
- Manually verify desktop and mobile layout.
- Verify default add still creates a task for today.
- Verify choosing a future date creates an upcoming task and does not add it to Today Plan.
- Verify fix spelling remains reachable from inside the task input.

## Acceptance Criteria

- The visible date selector bar is gone.
- A calendar icon controls date selection.
- The spelling fix icon is inside the task text input at the trailing end.
- Task input controls stay aligned on desktop and mobile.
- Today remains the default date.
- Existing date planning behavior still works for future dates.
