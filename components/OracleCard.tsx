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

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    void Promise.resolve().then(() => {
      const cacheKey = `dayline:oracle:${todayKey()}`;
      const hit = sessionStorage.getItem(cacheKey);
      if (hit) {
        try {
          const parsed = JSON.parse(hit) as Partial<OracleData>;
          if (typeof parsed.insight === "string" && parsed.insight) {
            if (!cancelled) {
              setData({ insight: parsed.insight, recommendation: parsed.recommendation ?? "" });
            }
            return;
          }
        } catch {
          // malformed cache; fall through to fetch
        }
      }

      const ledger = loadLedger();
      const last7Keys = getLast7DaysKeys();
      const days = Object.fromEntries(
        Object.entries(ledger.days).filter(([key]) => last7Keys.includes(key))
      );

      fetch("/api/locusgraph/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Requested-With": "dayline" },
        body: JSON.stringify({ days }),
      })
        .then((r) => r.json())
        .then((d: unknown) => {
          if (cancelled) return;
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
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  if (!data) return null;

  return (
    <div className="mb-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">
      <p>{data.insight}</p>
      {data.recommendation && (
        <p className="mt-1 font-medium text-zinc-300">{data.recommendation}</p>
      )}
      <p className="mt-2 text-xs text-zinc-500">
        Uses recent task history and distraction notes to generate this insight.
      </p>
    </div>
  );
}
