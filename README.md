# Dayline

A simple daily planning and focus timer app for building routine and visible progress.

## Why This Exists

Dayline is built for a student or early-career developer who needs a practical routine before chasing jobs or freelance work. It keeps the main workflow focused on a compact Today Plan while still allowing evening planning for tomorrow or another upcoming day.

- add tasks for today, tomorrow, or a custom future date
- keep tasks grouped under configurable work sections
- preserve task order so the first task entered appears first
- use a manual focus timer for today's tasks
- review past days separately from upcoming plans
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

## Product Behavior

- Today is the default workspace.
- Tasks can be planned for Today, Tomorrow, or a picked future date.
- Upcoming planned tasks stay out of today's section cards and history.
- History shows past days only.
- Focus timers are available only for today's tasks.
