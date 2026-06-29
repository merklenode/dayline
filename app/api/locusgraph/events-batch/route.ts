import { NextResponse } from "next/server";
import type { BatchEventItem } from "@locusgraph/client";
import { getLocusGraphClient } from "@/lib/locusgraph";

export const runtime = "nodejs";

type DaylineEvent = {
  contextId?: string;
  context_id?: string;
  contextType?: string;
  operation?: string;
  event_kind?: string;
  data?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  occurredAt?: string;
  timestamp?: string;
};

function toBatchEventItem(event: DaylineEvent): BatchEventItem {
  const payload = event.payload ?? {
    data: {
      ...(event.data ?? {}),
      contextType: event.contextType,
      operation: event.operation,
    },
  };

  return {
    event_kind: event.event_kind ?? (event.operation === "delete" ? "action" : "fact"),
    context_id: event.context_id ?? event.contextId,
    payload,
    timestamp: event.timestamp ?? event.occurredAt,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { events?: DaylineEvent[]; graph_id?: string } | null;
  if (!body || !Array.isArray(body.events)) {
    return NextResponse.json({ error: "events must be an array" }, { status: 400 });
  }

  try {
    const result = await getLocusGraphClient().storeEventsBatch(
      body.events.map(toBatchEventItem),
      body.graph_id
    );
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "LocusGraph unavailable" },
      { status: 502 }
    );
  }
}
