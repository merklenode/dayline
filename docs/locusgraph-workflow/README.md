# LocusGraph In Dayline

Short version: Dayline saves your work locally first. LocusGraph is an optional cloud memory layer.

If LocusGraph fails, Dayline should still work from `localStorage`.

## Read In This Order

1. [Setup](./01-setup.md)
2. [How Data Moves](./02-how-data-moves.md)
3. [Important Files](./03-important-files.md)
4. [Architecture Diagrams](./04-diagrams.md)

## One-Minute Summary

Dayline has three storage layers:

```text
User edits task
  -> save immediately in browser localStorage
  -> try to send event to Dayline API route
  -> API route uses @locusgraph/client
  -> LocusGraph stores memory in your graph
```

Local save happens first. Remote sync happens after.

That means:

- The app does not depend on LocusGraph to show your tasks.
- LocusGraph needs env vars before sync works.
- Missing or wrong env vars cause `/api/locusgraph/*` to return `502`.
- After one failed sync, Dayline stops retrying in that browser tab to avoid spam.

## The Four Required Env Vars

Put these in `.env.local`:

```env
LOCUSGRAPH_SERVER_URL=https://us-east-1.locusgraph.com
LOCUSGRAPH_AGENT_SECRET=your-token
LOCUSGRAPH_GRAPH_ID=your-graph-id
NEXT_PUBLIC_LOCUSGRAPH_ENABLED=true
```

Then restart the dev server:

```bash
pnpm dev
```

## Common Error

If you see this:

```text
POST /api/locusgraph/memories 502
POST /api/locusgraph/events-batch 502
```

Most likely one of these is missing or wrong:

- `LOCUSGRAPH_AGENT_SECRET`
- `LOCUSGRAPH_GRAPH_ID`
- `LOCUSGRAPH_SERVER_URL`

Start with [Setup](./01-setup.md).
