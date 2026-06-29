import { NextResponse } from "next/server";

type LanguageToolReplacement = {
  value: string;
};

type LanguageToolMatch = {
  offset: number;
  length: number;
  replacements: LanguageToolReplacement[];
};

type LanguageToolResponse = {
  matches?: LanguageToolMatch[];
};

function applyTopReplacements(text: string, matches: LanguageToolMatch[]) {
  return matches
    .filter((match) => match.replacements.length > 0)
    .sort((a, b) => b.offset - a.offset)
    .reduce((current, match) => {
      const replacement = match.replacements[0]?.value;
      if (!replacement) {
        return current;
      }

      return `${current.slice(0, match.offset)}${replacement}${current.slice(match.offset + match.length)}`;
    }, text);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text?.trim();

  if (!text) {
    return NextResponse.json({ correctedText: "", changed: false, matches: 0 });
  }

  if (text.length > 5000) {
    return NextResponse.json({ error: "Text is too long to check." }, { status: 400 });
  }

  const params = new URLSearchParams({
    text,
    language: "en-US"
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString(),
      signal: controller.signal,
    });

    if (!response.ok) {
      return NextResponse.json({ error: "English check is unavailable right now." }, { status: 502 });
    }

    const result = (await response.json()) as LanguageToolResponse;
    const matches = result.matches ?? [];
    const correctedText = applyTopReplacements(text, matches);

    return NextResponse.json({
      correctedText,
      changed: correctedText !== text,
      matches: matches.length,
    });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      return NextResponse.json({ error: "English check timed out." }, { status: 504 });
    }
    return NextResponse.json({ error: "English check is unavailable right now." }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
}
