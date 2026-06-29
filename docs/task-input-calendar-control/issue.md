## Summary

Fix the task add panel alignment by removing the visible Today/Tomorrow/Pick-a-date selector and moving date planning behind a compact calendar control.

## Scope

- Remove the visible date selector bar from `components/TaskInput.tsx`.
- Put a calendar icon/date picker in the old fix-spelling button slot.
- Move the fix-spelling wand action into the trailing end of the task title input.
- Keep today as the default selected date.
- Preserve future-date planning through the calendar picker.
- Keep section selection and add button aligned on desktop and mobile.
- Keep icon-only controls accessible with meaningful labels.
- Show or announce the selected date so custom future dates are not hidden state.

## Acceptance Criteria

- The old Today/Tomorrow/Pick-a-date select is no longer visible.
- The calendar icon can choose a future date and blocks past dates.
- The spelling wand appears inside the task input trailing end and still calls the existing spelling fix handler.
- Pressing Enter in the task input still submits the form.
- Calendar and wand controls do not submit the form.
- Adding a task without changing date creates a Today task.
- Adding a task after selecting a future date creates an Upcoming task.
- Controls stay aligned across mobile and desktop widths.

## Verification

- `pnpm lint`
- `pnpm exec tsc --noEmit`
- `pnpm build`
- Manual smoke test for Today add, future-date add, and spelling fix.
