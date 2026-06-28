# 04. Architecture Diagrams

These diagrams show the LocusGraph workflow visually.

## Simple Architecture

```mermaid
flowchart TD
  User[User]
  UI[Dayline UI]
  Local[Browser localStorage]
  API[Next.js API routes]
  SDK[@locusgraph/client]
  LG[LocusGraph]

  User --> UI
  UI --> Local
  UI --> API
  API --> SDK
  SDK --> LG
```

Meaning:

- UI always saves to localStorage.
- API routes are only used for remote sync.
- SDK talks to LocusGraph.

## App Startup

```mermaid
sequenceDiagram
  participant UI as Dayline UI
  participant Local as localStorage
  participant API as /api/locusgraph/memories
  participant LG as LocusGraph

  UI->>Local: Load local ledger after browser mount
  Local-->>UI: Local tasks
  UI->>API: Ask for remote memories
  API->>LG: retrieveMemories()
  alt success
    LG-->>API: memories
    API-->>UI: remote data
    UI-->>UI: merge remote with local
  else fail
    API-->>UI: error
    UI-->>UI: keep local data
  end
```

## Task Change Sync

```mermaid
sequenceDiagram
  participant UI as Dayline UI
  participant Local as localStorage
  participant API as /api/locusgraph/events-batch
  participant LG as LocusGraph

  UI->>Local: Save task change
  UI->>API: Send event batch
  API->>LG: storeEventsBatch()
  alt success
    LG-->>API: stored
    API-->>UI: ok
  else fail
    API-->>UI: 502
    UI-->>UI: disable sync for this tab
  end
```

## Oracle Insight

```mermaid
flowchart LR
  Local[localStorage last 7 days]
  Card[OracleCard]
  API[/api/locusgraph/insights]
  AI[Anthropic]

  Local --> Card
  Card --> API
  API --> AI
  AI --> API
  API --> Card
```

Meaning:

- Oracle uses local task history.
- Oracle needs `ANTHROPIC_API_KEY`.
- Oracle is separate from normal LocusGraph sync.
