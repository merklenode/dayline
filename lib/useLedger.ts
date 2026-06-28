import { useState, useEffect } from "react";
import {
  createEmptyDay,
  fetchLedger,
  LedgerState,
  loadLedger,
  mergeLedgers,
  todayKey,
} from "./storage";

export type LedgerLoad =
  | { status: "loading"; ledger: LedgerState | null }
  | { status: "stale"; ledger: LedgerState }
  | { status: "fresh"; ledger: LedgerState };

function withToday(ledger: LedgerState): LedgerState {
  const date = todayKey();
  if (ledger.days[date]) return ledger;

  return {
    days: {
      ...ledger.days,
      [date]: createEmptyDay(date),
    },
  };
}

export function useLedger(): LedgerLoad {
  const [state, setState] = useState<LedgerLoad>({ status: "loading", ledger: null });

  useEffect(() => {
    let cancelled = false;
    void Promise.resolve().then(async () => {
      const cached = withToday(loadLedger());
      if (Object.keys(cached.days).length > 0 && !cancelled) {
        setState({ status: "loading", ledger: cached });
      }

      try {
        const fresh = await fetchLedger();
        if (cancelled) return;
        setState((current) => ({
          status: "fresh",
          ledger: current.ledger ? mergeLedgers(current.ledger, fresh) : withToday(fresh),
        }));
      } catch {
        if (cancelled) return;
        setState((s) =>
          s.ledger
            ? { status: "stale", ledger: s.ledger }
            : { status: "stale", ledger: cached }
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
