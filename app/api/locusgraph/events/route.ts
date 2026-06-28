import { NextResponse } from "next/server";
import type { CreateEventApiRequest } from "@locusgraph/client";
import { getLocusGraphClient } from "@/lib/locusgraph";

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
  graph_id?: string;
};

function toStoreEventRequest(body: DaylineEvent): CreateEventApiRequest {
  const graphId = body.graph_id ?? process.env.LOCUSGRAPH_GRAPH_ID;
  if (!graphId) {
    throw new Error("LOCUSGRAPH_GRAPH_ID is not configured");
  }

  const payload = body.payload ?? {
    data: {
      ...(body.data ?? {}),
      contextType: body.contextType,
      operation: body.operation,
    },
  };

  return {
    graph_id: graphId,
    event_kind: body.event_kind ?? (body.operation === "focus_session" ? "completed" : "fact"),
    context_id: body.context_id ?? body.contextId,
    payload,
    timestamp: body.timestamp ?? body.occurredAt,
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as DaylineEvent | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await getLocusGraphClient().storeEvent(toStoreEventRequest(body));
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "LocusGraph unavailable" },
      { status: 502 }
    );
  }
}
