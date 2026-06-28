import { NextResponse } from "next/server";
import { proxyToLocusGraph } from "@/lib/locusgraph-proxy";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  try {
    const upstream = await proxyToLocusGraph("/memories", body);
    if (!upstream.ok) {
      const data = (await upstream.json().catch(() => ({}))) as unknown;
      return NextResponse.json(data, { status: upstream.status });
    }
    const data = (await upstream.json()) as unknown;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "LocusGraph unavailable" },
      { status: 502 }
    );
  }
}
