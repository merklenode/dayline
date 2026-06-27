"use client";

import { useEffect, useState } from "react";
import { loadLedger, todayKey } from "@/lib/storage";

type OracleData = {
  insight: string;
  recommendation: string;
};

function getLast7DaysKeys(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return todayKey(d);
  });
}

export function OracleCard({ enabled }: { enabled: boolean }) {
  const [data, setData] = useState<OracleData | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!enabled) return;

    const cacheKey = `dayline:oracle:${todayKey()}`;
    const hit = sessionStorage.getItem(cacheKey);
    if (hit) {
      try {
        const parsed = JSON.parse(hit) as Partial<OracleData>;
        if (typeof parsed.insight === "string" && parsed.insight) {
          setData({ insight: parsed.insight, recommendation: parsed.recommendation ?? "" });
        }
      } catch {
        // malformed cache — fall through to fetch
      }
      return;
    }

    const ledger = loadLedger();
    const last7Keys = getLast7DaysKeys();
    const days = Object.fromEntries(
      Object.entries(ledger.days).filter(([key]) => last7Keys.includes(key))
    );

    fetch("/api/locusgraph/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    })
      .then((r) => r.json())
      .then((d: unknown) => {
        const result = d as Partial<OracleData>;
        if (typeof result.insight === "string" && result.insight) {
          const safe: OracleData = {
            insight: result.insight,
            recommendation: result.recommendation ?? "",
          };
          sessionStorage.setItem(cacheKey, JSON.stringify(safe));
          setData(safe);
        }
      })
      .catch(() => {});
  }, [enabled]);
  /* eslint-enable react-hooks/set-state-in-effect */

  if (!data) return null;

  return (
    <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
      <p>{data.insight}</p>
      {data.recommendation && (
        <p className="mt-1 font-medium text-zinc-300">{data.recommendation}</p>
      )}
    </div>
  );
}
