# Recent Implementation

Dayline has been simplified into one primary `Today Plan` screen. The app no longer depends on a fixed wall-clock schedule or auto-starting time blocks.

Current behavior:

- Tasks are grouped into four configurable sections:
  - Plan & Research
  - Execution Time
  - Learning Time
  - Wind Up & Plan
- New tasks are added manually and assigned to one section.
- Each task can be started with a manual focus timer.
- The current session card supports focus, pause, resume, stop, mark done, focus complete, and break states.
- Focus and break durations are configurable from the settings modal.
- Section names are configurable from the settings modal.
- Daily tasks, focus minutes, distraction notes, settings, and active session state are saved in browser `localStorage`.
- Older `dayline:v1` task data is migrated into `dayline:v2` by assigning existing tasks to the `Execution Time` section.
- English correction is available for task titles and distraction notes through `/api/check-english`.

Important files:

- `app/page.tsx` controls the main Today Plan workflow.
- `lib/storage.ts` stores daily task records and handles v1-to-v2 migration.
- `lib/sessionState.ts` controls focus and break session state.
- `lib/settings.ts` stores default section names and timer defaults.
- `components/CurrentSessionCard.tsx` renders the active focus or break session.
- `components/SettingsModal.tsx` manages section names and timer defaults.
- `components/SectionGroup.tsx`, `components/TaskInput.tsx`, and `components/TaskRow.tsx` render the task workflow.
