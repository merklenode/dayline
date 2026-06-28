import { NextResponse } from "next/server";
import type { ContextQuery } from "@locusgraph/client";
import { getLocusGraphClient } from "@/lib/locusgraph";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<ContextQuery> | null;

  try {
    const result = await getLocusGraphClient().retrieveMemories({
      query: body?.query ?? "Dayline tasks and day records",
      limit: body?.limit ?? 50,
      format: body?.format ?? "json",
      contextTypes: body?.contextTypes,
      contextIds: body?.contextIds,
      graphId: body?.graphId,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "LocusGraph unavailable" },
      { status: 502 }
    );
  }
}
