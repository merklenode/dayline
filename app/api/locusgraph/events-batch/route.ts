import { lg } from '@/lib/locusgraph';
import type { BatchEventItem } from '@locusgraph/client';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    events?: unknown[];
    graph_id?: string;
  } | null;

  if (!body || !Array.isArray(body.events) || body.events.length === 0) {
    return Response.json({ error: 'events must be a non-empty array' }, { status: 400 });
  }

  try {
    const result = await lg.storeEventsBatch(
      body.events as BatchEventItem[],
      body.graph_id
    );
    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
