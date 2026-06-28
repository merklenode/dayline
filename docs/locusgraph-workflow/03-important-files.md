# 03. Important Files

This page maps files to jobs.

## Browser/UI Files

### `app/page.tsx`

Main Dayline screen.

Uses:

- `useLedger()` to load data
- `saveLedger()` indirectly through state changes
- `pushLedger()` indirectly through `lib/storage.ts`

It also avoids hydration mismatch by waiting for client-side ledger loading.

### `lib/useLedger.ts`

Loads data in this order:

1. Start with safe loading state.
2. After browser mount, read `localStorage`.
3. Ask LocusGraph for remote memories.
4. Merge remote with local if possible.

This file prevents server/client HTML mismatch.

### `lib/storage.ts`

This is the main local-first storage file.

It does four jobs:

1. Load and save the Dayline ledger in `localStorage`.
2. Convert old `dayline:v1` data to `dayline:v2`.
3. Convert task changes into LocusGraph events.
4. Stop sync after first LocusGraph failure in a tab.

## Server/API Files

### `lib/locusgraph.ts`

Creates the SDK client:

```ts
new LocusGraphClient({
  serverUrl,
  agentSecret,
  graphId,
});
```

Reads env vars:

- `LOCUSGRAPH_SERVER_URL`
- `LOCUSGRAPH_AGENT_SECRET`
- `LOCUSGRAPH_GRAPH_ID`

### `app/api/locusgraph/events/route.ts`

Stores one event.

Uses:

```ts
client.storeEvent(...)
```

### `app/api/locusgraph/events-batch/route.ts`

Stores many events.

Uses:

```ts
client.storeEventsBatch(...)
```

Most Dayline task changes go through this route.

### `app/api/locusgraph/memories/route.ts`

Reads remote memories.

Uses:

```ts
client.retrieveMemories(...)
```

### `app/api/locusgraph/insights/route.ts`

This is for the Oracle card.

It does not store Dayline ledger data. It sends recent task history to Anthropic and returns a short insight.

## Component File

### `components/OracleCard.tsx`

Shows the Oracle insight.

It:

- reads recent local history
- calls `/api/locusgraph/insights`
- stores one daily result in `sessionStorage`

## Files You Usually Edit

If sync breaks:

- `lib/storage.ts`
- `lib/locusgraph.ts`
- `app/api/locusgraph/events-batch/route.ts`
- `.env.local`

If loading/hydration breaks:

- `lib/useLedger.ts`
- `app/page.tsx`

If Oracle insight breaks:

- `components/OracleCard.tsx`
- `app/api/locusgraph/insights/route.ts`
