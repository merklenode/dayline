import { lg } from '@/lib/locusgraph';
import type { ContextQuery } from '@locusgraph/client';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { query?: string } | null;

  if (!body || typeof body.query !== 'string') {
    return Response.json({ error: 'query is required' }, { status: 400 });
  }

  try {
    const result = await lg.retrieveMemories(body as ContextQuery);
    return Response.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
