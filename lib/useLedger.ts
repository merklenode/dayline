import { useState, useEffect } from "react";
import {
  createEmptyDay,
  fetchLedger,
  LedgerState,
  loadLedger,
  todayKey,
} from "./storage";

export type LedgerLoad =
  | { status: "loading"; ledger: LedgerState | null }
  | { status: "stale"; ledger: LedgerState }
  | { status: "fresh"; ledger: LedgerState };

export function useLedger(): LedgerLoad {
  const [state, setState] = useState<LedgerLoad>(() => {
    const cached = loadLedger();
    const date = todayKey();
    if (!cached.days[date]) {
      cached.days[date] = createEmptyDay(date);
    }
    return {
      status: "loading",
      ledger: Object.keys(cached.days).length > 0 ? cached : null,
    };
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const fresh = await fetchLedger();
        if (cancelled) return;
        setState({ status: "fresh", ledger: fresh });
      } catch {
        if (cancelled) return;
        setState((s) =>
          s.ledger
            ? { status: "stale", ledger: s.ledger }
            : { status: "stale", ledger: loadLedger() }
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
