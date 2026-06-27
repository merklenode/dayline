# Dayline Upgrade Plan

## Goal

Keep Dayline simple on the single `Today Plan` screen while fixing the current usability gaps around section display, daily records, branding, loading state, and settings access.

## Requested Improvements

1. Hide empty Today Plan sections
   - In the `Today Plan` table, section/category headers should appear only after at least one task exists in that section.
   - Empty sections should not show placeholder rows such as `No tasks yet`.
   - If there are no tasks at all for the day, show one clear empty state for the whole plan.

2. Add daily record tracking
   - Users should be able to view records from previous days.
   - Each daily record should preserve that day's tasks, completed count, focus minutes, and distraction note.
   - The current day should remain the default screen.
   - Historical records should be read-only unless a later requirement explicitly allows editing old days.

3. Add favicon, logo, and loader
   - Add a Dayline favicon for browser tabs.
   - Add a small Dayline logo mark in the app header.
   - Add a lightweight loading state for initial app hydration/storage loading.
   - The loader should feel minimal and should not add a new marketing-style splash page.

4. Improve settings gear placement
   - Keep the settings gear easy to find without crowding the date, title, or progress stats.
   - On mobile, the gear should not overlap or squeeze the Focus/Done stats.
   - On desktop, the gear should align cleanly with the header controls.

## Implementation Notes

- Continue using the existing localStorage ledger model unless a future requirement asks for server sync.
- Keep the four default sections:
  - Plan & Research
  - Execution Time
  - Learning Time
  - Wind Up & Plan
- Do not return to the older large scheduled block UI.
- Do not auto-start timers from wall-clock time.
- Keep timer behavior manual and per task.

## Alternative UI Direction

The current simple vertical layout can start to feel too plain or too much like one long online list. Before continuing implementation, consider one of these UI directions.

### Option A: Compact Dashboard

- Keep `Today Plan` as the main screen.
- Put the active timer, task input, and daily stats in a compact top control area.
- Show tasks below in a cleaner grouped list.
- Put daily records behind a small `History` tab or button instead of always showing them on the main page.
- Best for keeping the app fast, simple, and work-focused.

```text
+------------------------------------------------+
| Dayline                         Focus  Done [S]|
| Sat, Jun 27                       45m   3/5    |
+------------------------------------------------+
| [ Current Task Timer ]  [ Pause ] [ Done ]      |
+------------------------------------------------+
| Add task...              Section v   [ + ]      |
+------------------------------------------------+
| Today Plan                         [ History ]  |
|                                                |
| Plan & Research                    1/1          |
| [x] Review roadmap                               |
|                                                |
| Execution Time                     2/3          |
| [ ] Build UI polish                              |
| [x] Fix timer state                              |
| [x] Test mobile                                  |
+------------------------------------------------+
| Distraction Note                                |
| [ quick note area... ]                          |
+------------------------------------------------+
```

### Option B: Two-Panel Workbench

- Left side: Today Plan tasks grouped by section.
- Right side: current timer, focus stats, distraction note, and history preview.
- On mobile, stack the right panel below the task list.
- Best for desktop use because the user can see task list and timer tools together.

```text
+------------------------------------------------------------------+
| Dayline                                             Focus Done [S]|
+--------------------------------------+---------------------------+
| Add task... Section v [ + ]           | Current Timer             |
|                                      | 18:42                     |
| Today Plan                           | [ Pause ] [ Done ]        |
|                                      |                           |
| Plan & Research              1/1     | Today Stats               |
| [x] Read docs                        | Focus: 45m                |
|                                      | Done: 3/5                 |
| Execution Time               2/3     |                           |
| [ ] Build dashboard                  | Distraction Note          |
| [x] Fix settings gear                | [ note... ]               |
| [x] Check layout                     |                           |
|                                      | History Preview           |
| Learning Time                0/1     | Jun 26 - 4/6 done         |
| [ ] Practice English                 | Jun 25 - 5/5 done         |
+--------------------------------------+---------------------------+
```

### Option C: Section Tabs

- Show the four sections as tabs:
  - Plan & Research
  - Execution Time
  - Learning Time
  - Wind Up & Plan
- Only the selected section's tasks are visible.
- Add a small count on each tab.
- Hide tabs with zero tasks unless the user is choosing a section while adding a task.
- Best if the Today Plan list becomes too long.

```text
+------------------------------------------------+
| Dayline                         Focus  Done [S]|
+------------------------------------------------+
| [ Current Task Timer ]                          |
+------------------------------------------------+
| Add task...                         [ + ]       |
| Section: [ Execution Time v ]                   |
+------------------------------------------------+
| Today Plan                         [ History ]  |
|                                                |
| [ Plan 1 ] [ Execution 3 ] [ Learning 1 ]       |
|                                                |
| Execution Time                                  |
| [ ] Build dashboard                             |
| [x] Fix settings gear                           |
| [x] Check layout                                |
+------------------------------------------------+
| Distraction Note                                |
+------------------------------------------------+
```

### Option D: Day Journal View

- Make each day feel like a small daily journal.
- Top: date, focus minutes, completed count.
- Middle: tasks grouped by section.
- Bottom: distraction note and reflection/history.
- Previous days open as journal records.
- Best if daily tracking and review become more important than only task execution.

```text
+------------------------------------------------+
| Dayline                                    [S] |
+------------------------------------------------+
| Saturday, Jun 27                               |
| Focus: 45m        Done: 3/5       [ History ] |
+------------------------------------------------+
| Today's Journal                                |
|                                                |
| Plan & Research                                |
| [x] Review roadmap                             |
|                                                |
| Execution Time                                 |
| [ ] Build UI polish                            |
| [x] Fix timer state                            |
| [x] Test mobile                                |
|                                                |
| Learning Time                                  |
| [ ] English practice                           |
+------------------------------------------------+
| Timer                                          |
| Current: Build UI polish        18:42          |
| [ Pause ] [ Mark Done ]                       |
+------------------------------------------------+
| Reflection / Distraction Note                  |
| [ what pulled focus today... ]                 |
+------------------------------------------------+
```

## Recommended Next UI

Use `Option A: Compact Dashboard` as the final selected direction.

Reasons:

- It keeps the current simple Dayline direction.
- It avoids making the main screen feel like one long list.
- It keeps history available without pushing today's work too far down.
- It works well on mobile and desktop.

## Selected Implementation Plan

Build the Compact Dashboard as a focused Today-first app:

1. Header
   - Keep the Dayline logo, date, Focus/Done stats, and settings button.
   - Add a lightweight `Today / History` switch near the main content, not as a large navigation system.

2. Today dashboard
   - Keep the current session timer visible near the top.
   - Keep task entry directly under the timer.
   - Render task sections as compact dashboard cards.
   - Only show cards for sections that contain tasks.
   - If no tasks exist, show one empty state for the whole Today Plan.

3. Section cards
   - Each card shows section name and done/total count.
   - Each card contains its tasks with start, complete, and delete controls.
   - Cards should feel grouped and scannable, not like one long online list.
   - On desktop, cards can use a two-column grid.
   - On mobile, cards stack cleanly.

4. History view
   - Move daily records behind the `History` view.
   - Use the Day Journal style from Option D for previous days.
   - Keep history read-only.

5. Loader and branding
   - Keep the small loader.
   - Keep favicon and compact logo mark.

6. Verification
   - Run `pnpm lint`.
   - Run `pnpm exec tsc --noEmit`.
   - Run `pnpm build`.
   - Smoke-test the local preview.

## Acceptance Criteria

- Today Plan renders only sections that contain tasks.
- A day with zero tasks shows one Today Plan empty state.
- Previous days can be found from the UI and reviewed.
- Daily records show date, total tasks, completed tasks, focus minutes, and notes/tasks.
- Browser tab shows the Dayline favicon.
- Header shows a compact Dayline logo.
- Initial load has a small loader or skeleton state.
- Settings gear is visually stable on mobile and desktop.
- `pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` pass before implementation is merged.

## Suggested Phases

1. Create a Moa-tracked issue for the Compact Dashboard direction.
2. Update Today Plan into section cards.
3. Move daily records behind a `History` view.
4. Keep favicon, logo mark, loader, and header/settings polish.
5. Local verification and preview smoke test.
