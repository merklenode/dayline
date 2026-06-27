import { lg } from '@/lib/locusgraph';
import type { InsightQuery } from '@locusgraph/client';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { task?: string } | null;

  if (!body || typeof body.task !== 'string') {
    return Response.json({ error: 'task is required' }, { status: 400 });
  }

  try {
    const result = await lg.generateInsights(body as InsightQuery);
    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
