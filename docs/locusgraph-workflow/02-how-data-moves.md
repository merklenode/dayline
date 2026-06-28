# 02. How Data Moves

This page explains the workflow in small steps.

## Main Rule

Dayline is local-first.

That means:

```text
localStorage first
LocusGraph second
```

If LocusGraph is broken, your local tasks should still work.

## When The App Opens

1. Next.js renders a safe loading screen.
2. The browser starts the app.
3. `useLedger` reads `localStorage`.
4. Dayline shows your local tasks.
5. Dayline asks LocusGraph for remote memories.
6. If remote data is usable, Dayline merges it with local data.
7. If remote data fails, Dayline keeps local data.

## When You Change A Task

Example changes:

- Add task
- Mark task done
- Delete task
- Edit distraction note
- Finish focus timer

Workflow:

1. Dayline updates React state.
2. Dayline saves the full ledger to `localStorage`.
3. Dayline compares previous ledger vs current ledger.
4. Dayline creates LocusGraph events.
5. Dayline sends events to `/api/locusgraph/events-batch`.
6. That API route calls `@locusgraph/client`.
7. LocusGraph stores the event in your graph.

## What Gets Stored

Day record:

```text
context_id: day:2026-06-28
payload: focus minutes, distraction note, close time
```

Task record:

```text
context_id: task:<task-id>
payload: title, done, section, createdAt, date
```

Focus session:

```text
context_id: task:<task-id>
payload: date, durationMs
```

## Why You Saw Many 502 Errors

Before the retry fix, every local save tried to sync again.

So when LocusGraph was misconfigured:

```text
save local task
  -> try LocusGraph
  -> 502
  -> app state changes
  -> try LocusGraph again
  -> 502
  -> repeat
```

Now Dayline stops LocusGraph sync for the current tab after the first failed sync.

The local app still works.

## What Causes 502

Usually one of these:

- Missing `LOCUSGRAPH_AGENT_SECRET`
- Missing `LOCUSGRAPH_GRAPH_ID`
- Wrong token
- Wrong server URL
- LocusGraph rejects the event payload
- Network error

## What To Do After 502

1. Check `.env.local`.
2. Restart `pnpm dev`.
3. Reload the browser tab.
4. Try one task change.
5. Read the first console warning body.
