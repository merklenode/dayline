import { lg } from '@/lib/locusgraph';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { event_kind?: string; graph_id?: string } | null;

  if (!body || typeof body.event_kind !== 'string') {
    return Response.json({ error: 'event_kind is required' }, { status: 400 });
  }

  try {
    const result = await lg.storeEvent({ event_kind: body.event_kind }, body.graph_id);
    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
