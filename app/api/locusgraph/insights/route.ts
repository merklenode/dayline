import { NextResponse } from "next/server";
import type { DayRecord } from "@/lib/storage";

type InsightsRequestBody = {
  days?: Record<string, DayRecord>;
};

type AnthropicContent = {
  type: string;
  text?: string;
};

type AnthropicResponse = {
  content?: AnthropicContent[];
};

type InsightResult = {
  insight: string;
  recommendation: string;
};

const SYSTEM_PROMPT = `You are a personal productivity assistant. Analyze the provided 7-day work history from a daily planner app and return a JSON object with exactly two keys:
- "insight": one sentence identifying a notable pattern (e.g. recurring distraction, section imbalance, unfinished tasks)
- "recommendation": one sentence of actionable advice for today's planning

Respond with only the JSON object, no markdown fences, no extra text.`;

function buildUserPrompt(days: Record<string, DayRecord>): string {
  const entries = Object.entries(days)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  if (entries.length === 0) {
    return "No historical data available yet.";
  }

  return entries
    .map(([date, record]) => {
      const done = record.tasks.filter((t) => t.done).length;
      const total = record.tasks.length;
      const sections = record.tasks.reduce<Record<string, number>>((acc, t) => {
        acc[t.section] = (acc[t.section] ?? 0) + 1;
        return acc;
      }, {});
      const sectionSummary = Object.entries(sections)
        .map(([s, n]) => `${s}:${n}`)
        .join(", ");
      return [
        `Date: ${date}`,
        `Tasks: ${done}/${total} completed`,
        `Focus minutes: ${record.focusMinutes}`,
        sectionSummary ? `Sections: ${sectionSummary}` : null,
        record.distractionNote ? `Distractions: ${record.distractionNote}` : null,
      ]
        .filter(Boolean)
        .join(" | ");
    })
    .join("\n");
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({});
  }

  const body = (await request.json().catch(() => null)) as InsightsRequestBody | null;
  const days = body?.days ?? {};

  const userPrompt = buildUserPrompt(days);

  const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  }).catch(() => null);

  if (!anthropicResponse?.ok) {
    return NextResponse.json({});
  }

  const result = (await anthropicResponse.json().catch(() => null)) as AnthropicResponse | null;
  const text = result?.content?.find((c) => c.type === "text")?.text?.trim();

  if (!text) {
    return NextResponse.json({});
  }

  try {
    const parsed = JSON.parse(text) as Partial<InsightResult>;
    if (typeof parsed.insight === "string" && parsed.insight) {
      return NextResponse.json({
        insight: parsed.insight,
        recommendation: parsed.recommendation ?? "",
      });
    }
  } catch {
    // malformed JSON from model
  }

  return NextResponse.json({});
}
