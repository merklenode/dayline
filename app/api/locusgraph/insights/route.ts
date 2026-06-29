import { lg } from '@/lib/locusgraph';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { task?: string; graph_id?: string } | null;

  if (!body || typeof body.task !== 'string') {
    return Response.json({ error: 'task is required' }, { status: 400 });
  }

  try {
    const result = await lg.generateInsights({ task: body.task, graphId: body.graph_id });
    return Response.json(result);
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
