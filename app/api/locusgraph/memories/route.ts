import { lg } from '@/lib/locusgraph';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { query?: string; graph_id?: string } | null;

  if (!body || typeof body.query !== 'string') {
    return Response.json({ error: 'query is required' }, { status: 400 });
  }

  try {
    const result = await lg.retrieveMemories({ query: body.query, graphId: body.graph_id });
    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
