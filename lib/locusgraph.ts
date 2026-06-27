import { LocusGraphClient } from '@locusgraph/client';

if (!process.env.LOCUSGRAPH_AGENT_SECRET) {
  throw new Error('LOCUSGRAPH_AGENT_SECRET is required');
}

export const lg = new LocusGraphClient({
  serverUrl: process.env.LOCUSGRAPH_SERVER_URL ?? 'https://us-east-1.locusgraph.com',
  agentSecret: process.env.LOCUSGRAPH_AGENT_SECRET,
  graphId: process.env.LOCUSGRAPH_GRAPH_ID,
});
