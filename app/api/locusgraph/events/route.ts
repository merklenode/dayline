import { lg } from '@/lib/locusgraph';
import type { CreateEventApiRequest } from '@locusgraph/client';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Partial<CreateEventApiRequest> | null;

  if (!body || typeof body.event_kind !== 'string') {
    return Response.json({ error: 'event_kind is required' }, { status: 400 });
  }

  if (typeof body.graph_id !== 'string') {
    return Response.json({ error: 'graph_id is required' }, { status: 400 });
  }

  if (!body.payload || typeof body.payload !== 'object' || Array.isArray(body.payload)) {
    return Response.json({ error: 'payload object is required' }, { status: 400 });
  }

  try {
    const result = await lg.storeEvent(body as CreateEventApiRequest);
    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
