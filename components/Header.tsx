import { Settings } from "lucide-react";

type HeaderProps = {
  focusMinutes: number;
  doneCount: number;
  totalCount: number;
  onSettingsClick: () => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-stone-50 px-3 py-2 text-center">
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-zinc-950">{value}</p>
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
      <div className="mx-auto flex w-full max-w-2xl items-center gap-4 px-5 py-5 sm:px-8">
        <div className="flex-1">
          <p className="text-sm font-medium text-teal-700">{dateLabel}</p>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-normal text-zinc-950">Dayline</h1>
        </div>
        <div className="flex items-center gap-2">
          <Stat label="Focus" value={`${focusMinutes}m`} />
          <Stat label="Done" value={`${doneCount}/${totalCount}`} />
        </div>
        <button
          type="button"
          onClick={onSettingsClick}
          aria-label="Open settings"
          title="Settings"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
        >
          <Settings size={18} />
        </button>
      </div>
    </section>
  );
}
