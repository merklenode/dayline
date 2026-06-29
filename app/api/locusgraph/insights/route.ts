import { NextResponse } from "next/server";
import { getLocusGraphClient } from "@/lib/locusgraph";

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { task?: string; graph_id?: string } | null;

  if (!body || typeof body.task !== 'string') {
    return Response.json({ error: 'task is required' }, { status: 400 });
  }

  try {
    const result = await getLocusGraphClient().generateInsights({ task: body.task, graphId: body.graph_id });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "LocusGraph unavailable" },
      { status: 502 }
    );
  }
}
