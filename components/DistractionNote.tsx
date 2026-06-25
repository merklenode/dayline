import { WandSparkles } from "lucide-react";

type DistractionNoteProps = {
  value: string;
  checking: boolean;
  onChange: (value: string) => void;
  onFixSpelling: () => void;
};

export function DistractionNote({ value, checking, onChange, onFixSpelling }: DistractionNoteProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="distraction" className="text-base font-semibold text-zinc-950">
          Distraction Note
        </label>
        <button
          type="button"
          onClick={onFixSpelling}
          disabled={checking || !value.trim()}
          className="inline-flex min-h-9 items-center gap-2 rounded-md border border-zinc-300 px-3 text-sm font-medium text-zinc-800 transition hover:border-teal-700 hover:text-teal-800 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-400"
        >
          <WandSparkles size={14} />
          {checking ? "Checking" : "Fix spelling"}
        </button>
      </div>
      <textarea
        id="distraction"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What wasted your time today?"
        spellCheck={true}
        autoCorrect="on"
        autoCapitalize="sentences"
        className="mt-3 min-h-24 w-full resize-none rounded-md border border-zinc-300 p-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
      />
      <p className="mt-2 text-xs text-zinc-400">English checks run only when you click the button. Powered by LanguageTool.</p>
    </div>
  );
}
