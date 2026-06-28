# 01. Setup

This page explains only what you need to configure LocusGraph for Dayline.

## Install Package

Dayline uses the official SDK:

```bash
pnpm add @locusgraph/client
```

The package is already added in this project.

## Create `.env.local`

Use this:

```env
LOCUSGRAPH_SERVER_URL=https://us-east-1.locusgraph.com
LOCUSGRAPH_AGENT_SECRET=your-token-from-locusgraph
LOCUSGRAPH_GRAPH_ID=your-graph-id
NEXT_PUBLIC_LOCUSGRAPH_ENABLED=true
```

Optional:

```env
ANTHROPIC_API_KEY=your-anthropic-key
```

## What Each Env Var Means

`LOCUSGRAPH_SERVER_URL`

The LocusGraph server. Use:

```env
LOCUSGRAPH_SERVER_URL=https://us-east-1.locusgraph.com
```

`LOCUSGRAPH_AGENT_SECRET`

The token from the LocusGraph Tokens page.

`LOCUSGRAPH_GRAPH_ID`

The graph where Dayline stores memories.

`NEXT_PUBLIC_LOCUSGRAPH_ENABLED`

Turns LocusGraph sync on in the browser.

Important: this value is read by Next.js at build/dev-server startup. Restart after changing it.

## Restart

After editing `.env.local`:

```bash
pnpm dev
```

## Do Not Commit Secrets

Never put real tokens in:

- `.env.local.example`
- docs
- source code

Only keep real tokens in `.env.local`.

## Quick Check

If LocusGraph is configured correctly, the browser should not repeatedly print:

```text
[dayline] pushLedger failed: 502
```

If it still does, open the browser console and look for the full error body printed after the first failure.
