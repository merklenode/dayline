import { lg } from '@/lib/locusgraph';
import type { CreateEventApiRequest } from '@locusgraph/client';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { event_kind?: string } | null;

  if (!body || typeof body.event_kind !== 'string') {
    return Response.json({ error: 'event_kind is required' }, { status: 400 });
  }

  try {
    const result = await lg.storeEvent(body as unknown as CreateEventApiRequest);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
