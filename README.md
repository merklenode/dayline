# Dayline

A scheduled daily focus system for building routine and visible progress.

## Why This Exists

Dayline is built for a student or early-career developer who needs a practical routine before chasing jobs or freelance work. It uses a fixed 9:00 AM to 7:00 PM workday so the user always knows what block should be active.

- follow a time-blocked daily schedule
- edit each block heading
- add topics/tasks to each block
- see the active block and remaining time
- keep progress in browser localStorage

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- Browser localStorage

## Run Locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## MVP Acceptance Criteria

- Render the full 9:00 AM to 7:00 PM daily schedule.
- Derive the active block from the current clock time.
- Preserve heading edits and block tasks in localStorage.
- Add, complete, and delete topics per schedule block.
- Show before-start and day-complete states.
- Deploy cleanly on Vercel.
