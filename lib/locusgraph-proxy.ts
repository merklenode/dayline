export async function proxyToLocusGraph(path: string, body: unknown): Promise<Response> {
  const baseUrl = process.env.LOCUSGRAPH_API_URL;
  const apiKey = process.env.LOCUSGRAPH_API_KEY;

  if (!baseUrl) {
    throw new Error("LOCUSGRAPH_API_URL is not configured");
  }

  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });
}
