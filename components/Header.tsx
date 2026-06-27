import { Settings } from "lucide-react";

type HeaderProps = {
  focusMinutes: number;
  doneCount: number;
  totalCount: number;
  onSettingsClick: () => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-16 rounded-md border border-zinc-200 bg-stone-50 px-3 py-2 text-center">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-sm font-semibold text-white shadow-sm">
      D
    </div>
  );
}

export function Header({ focusMinutes, doneCount, totalCount, onSettingsClick }: HeaderProps) {
  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric"
  });

  return (
    <section className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-3 px-5 py-5 sm:flex-nowrap sm:gap-4 sm:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <LogoMark />
          <div className="min-w-0">
            <p className="text-sm font-medium text-teal-700">{dateLabel}</p>
            <h1 className="mt-0.5 text-2xl font-semibold tracking-normal text-zinc-950">Dayline</h1>
          </div>
        </div>
        <div className="order-3 flex w-full items-center gap-2 sm:order-none sm:w-auto">
          <Stat label="Focus" value={`${focusMinutes}m`} />
          <Stat label="Done" value={`${doneCount}/${totalCount}`} />
        </div>
        <button
          type="button"
          onClick={onSettingsClick}
          aria-label="Open settings"
          title="Settings"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
        >
          <Settings size={18} />
        </button>
      </div>
    </section>
  );
}
