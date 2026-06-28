import { LocusGraphClient } from "@locusgraph/client";

let client: LocusGraphClient | null = null;

export function getLocusGraphClient() {
  const agentSecret = process.env.LOCUSGRAPH_AGENT_SECRET || process.env.LOCUSGRAPH_API_KEY;
  const graphId = process.env.LOCUSGRAPH_GRAPH_ID;

  if (!agentSecret) {
    throw new Error("LOCUSGRAPH_AGENT_SECRET is not configured");
  }

  client ??= new LocusGraphClient({
    serverUrl: process.env.LOCUSGRAPH_SERVER_URL || "https://us-east-1.locusgraph.com",
    agentSecret,
    graphId,
  });

  return client;
}
