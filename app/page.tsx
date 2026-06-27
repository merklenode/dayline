"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  createEmptyDay,
  DayRecord,
  FocusTask,
  LedgerState,
  pushCompletedSession,
  pushLedger,
  saveLedger,
  SectionId,
  todayKey,
} from "@/lib/storage";
import { useLedger } from "@/lib/useLedger";
import { AppSettings, loadSettings, saveSettings, SECTION_ORDER } from "@/lib/settings";
import {
  expireSession,
  loadSession,
  markDoneSession,
  pauseSession,
  resumeSession,
  saveSession,
  SessionState,
  startBreak,
  startFocus,
  stopSession,
} from "@/lib/sessionState";
import { Header } from "@/components/Header";
import { TaskInput } from "@/components/TaskInput";
import { SectionGroup } from "@/components/SectionGroup";
import { DistractionNote } from "@/components/DistractionNote";
import { SettingsModal } from "@/components/SettingsModal";
import { CurrentSessionCard } from "@/components/CurrentSessionCard";
import { DailyRecords } from "@/components/DailyRecords";

type ViewMode = "today" | "history";

function uid() {
  return crypto.randomUUID();
}

export default function Home() {
  const load = useLedger();
  const [ledger, setLedger] = useState<LedgerState>(() => load.ledger ?? { days: {} });
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedSection, setSelectedSection] = useState<SectionId>("execution");
  const [checkingTask, setCheckingTask] = useState(false);
  const [checkingNote, setCheckingNote] = useState(false);
  const [englishStatus, setEnglishStatus] = useState("");
  const [view, setView] = useState<ViewMode>("today");

  const [session, setSession] = useState<SessionState>({ status: "idle" });
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Refs used inside the interval callback — never read during render
  const sessionRef = useRef<SessionState>(session);
  const prevSessionRef = useRef<SessionState>({ status: "idle" });
  const markedDoneRef = useRef(false);
  const hasMountedRef = useRef(false);
  const prevLedgerRef = useRef<LedgerState>(load.ledger ?? { days: {} });

  const date = todayKey();
  const today = ledger.days[date] ?? createEmptyDay(date);

  // Helper functions declared before effects that call them
  function updateToday(updater: (record: DayRecord) => DayRecord) {
    setLedger((current) => ({
      days: {
        ...current.days,
        [date]: updater(current.days[date] ?? createEmptyDay(date)),
      },
    }));
  }

  function addFocusMinutes(minutes: number) {
    updateToday((record) => ({ ...record, focusMinutes: record.focusMinutes + minutes }));
  }

  // Keep sessionRef current after every commit (not during render)
  useEffect(() => {
    sessionRef.current = session;
  });

  // Restore session from localStorage on mount
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const restored = loadSession();
    setSession(restored);
    sessionRef.current = restored;
    prevSessionRef.current = restored;
  }, []);

  // Sync fresh LocusGraph data into local ledger state
  // Pre-seed prevLedgerRef so the persist effect sees no diff for this update
  useEffect(() => {
    if (load.status === "fresh" && load.ledger != null) {
      prevLedgerRef.current = load.ledger;
      setLedger(load.ledger);
    }
  }, [load.status]); // eslint-disable-line react-hooks/exhaustive-deps
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist ledger and push diff to LocusGraph
  useEffect(() => {
    if (Object.keys(ledger.days).length > 0) {
      saveLedger(ledger);
      void pushLedger(prevLedgerRef.current, ledger);
      prevLedgerRef.current = ledger;
    }
  }, [ledger]);

  // Persist settings
  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Tick interval — only active while running; triggers re-renders for countdown display
  useEffect(() => {
    if (session.status !== "running") return;
    const id = window.setInterval(() => {
      const s = sessionRef.current;
      if (s.status !== "running") return;
      if (Date.now() >= s.endsAt) {
        const next = expireSession(s);
        setSession(next);
      } else {
        forceUpdate();
      }
    }, 500);
    return () => window.clearInterval(id);
  }, [session.status]);

  // Persist session and credit focus minutes when focus expires naturally
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    const prev = prevSessionRef.current;
    prevSessionRef.current = session;

    if (
      prev.status === "running" &&
      prev.phase === "focus" &&
      session.status === "complete" &&
      !markedDoneRef.current
    ) {
      addFocusMinutes(Math.round(prev.durationMs / 60000));
      void pushCompletedSession(prev.taskId, date, prev.durationMs);
    }
    markedDoneRef.current = false;

    saveSession(session);
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleStartFocus(taskId: string) {
    if (session.status === "running" || session.status === "paused") {
      if (!window.confirm("Switch focus to this task?")) return;
    }
    const next = startFocus(taskId, settings.workMinutes * 60 * 1000);
    setSession(next);
  }

  function handlePause() {
    if (session.status !== "running") return;
    const next = pauseSession(session);
    setSession(next);
  }

  function handleResume() {
    if (session.status !== "paused") return;
    const next = resumeSession(session);
    setSession(next);
  }

  function handleStop() {
    setSession(stopSession());
  }

  function handleMarkDone() {
    if (session.status !== "running" && session.status !== "paused") return;
    const taskId = session.taskId;
    markedDoneRef.current = true;
    updateToday((record) => ({
      ...record,
      tasks: record.tasks.map((t) => (t.id === taskId ? { ...t, done: true } : t)),
    }));
    setSession(markDoneSession(taskId));
  }

  function handleStartBreak() {
    if (session.status !== "complete") return;
    const next = startBreak(session.taskId, settings.breakMinutes * 60 * 1000);
    setSession(next);
  }

  function handleEndBreak() {
    setSession(stopSession());
  }

  function addTask() {
    const cleanTitle = taskTitle.trim();
    if (!cleanTitle) return;

    const task: FocusTask = {
      id: uid(),
      title: cleanTitle,
      done: false,
      createdAt: new Date().toISOString(),
      section: selectedSection,
    };

    updateToday((record) => ({ ...record, tasks: [...record.tasks, task] }));
    setTaskTitle("");
    setEnglishStatus("");
  }

  function toggleTask(id: string) {
    if (session.status !== "idle" && session.taskId === id) {
      setSession(stopSession());
    }
    updateToday((record) => ({
      ...record,
      tasks: record.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    }));
  }

  function deleteTask(id: string) {
    if (session.status !== "idle" && session.taskId === id) {
      setSession(stopSession());
    }
    updateToday((record) => ({
      ...record,
      tasks: record.tasks.filter((t) => t.id !== id),
    }));
  }

  async function fixEnglish(text: string) {
    const response = await fetch("/api/check-english", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const result = (await response.json()) as {
      correctedText?: string;
      changed?: boolean;
      error?: string;
    };
    if (!response.ok || result.error) {
      throw new Error(result.error || "English check failed.");
    }
    return result;
  }

  async function fixTaskTitle() {
    const text = taskTitle.trim();
    if (!text) {
      setEnglishStatus("Write a task first.");
      return;
    }
    setCheckingTask(true);
    setEnglishStatus("");
    try {
      const result = await fixEnglish(text);
      setTaskTitle(result.correctedText ?? taskTitle);
      setEnglishStatus(result.changed ? "Task spelling improved." : "No correction found.");
    } catch (error) {
      setEnglishStatus(error instanceof Error ? error.message : "English check failed.");
    } finally {
      setCheckingTask(false);
    }
  }

  async function fixDistractionNote() {
    const text = today.distractionNote.trim();
    if (!text) {
      setEnglishStatus("Write a note first.");
      return;
    }
    setCheckingNote(true);
    setEnglishStatus("");
    try {
      const result = await fixEnglish(text);
      updateToday((record) => ({
        ...record,
        distractionNote: result.correctedText ?? record.distractionNote,
      }));
      setEnglishStatus(result.changed ? "Note spelling improved." : "No correction found.");
    } catch (error) {
      setEnglishStatus(error instanceof Error ? error.message : "English check failed.");
    } finally {
      setCheckingNote(false);
    }
  }

  const completedTasks = today.tasks.filter((t) => t.done).length;
  const allDone = today.tasks.length > 0 && today.tasks.every((t) => t.done);
  const activeTaskId = session.status !== "idle" ? session.taskId : null;
  const visibleSections = SECTION_ORDER.map((sectionId) => ({
    id: sectionId,
    tasks: today.tasks.filter((t) => t.section === sectionId),
  })).filter((section) => section.tasks.length > 0);
  const previousRecords = Object.values(ledger.days)
    .filter((record) => record.date !== date)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (load.status === "loading" && !load.ledger) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-600 shadow-sm">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-teal-700" />
          Loading Dayline
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Header
        focusMinutes={today.focusMinutes}
        doneCount={completedTasks}
        totalCount={today.tasks.length}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <div className="mx-auto w-full max-w-4xl space-y-5 px-5 py-6 sm:px-8">
        <div className="flex rounded-lg border border-zinc-200 bg-white p-1 shadow-sm sm:w-fit">
          {(["today", "history"] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setView(mode)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition sm:flex-none ${
                view === mode
                  ? "bg-teal-700 text-white"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {view === "today" ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.75fr)]">
              <CurrentSessionCard
                session={session}
                tasks={today.tasks}
                sectionNames={settings.sectionNames}
                onPause={handlePause}
                onResume={handleResume}
                onStop={handleStop}
                onMarkDone={handleMarkDone}
                onStartBreak={handleStartBreak}
                onEndBreak={handleEndBreak}
              />

              <TaskInput
                value={taskTitle}
                selectedSection={selectedSection}
                settings={settings}
                checking={checkingTask}
                englishStatus={englishStatus}
                onChange={setTaskTitle}
                onSectionChange={setSelectedSection}
                onAdd={addTask}
                onFixSpelling={fixTaskTitle}
              />
            </div>

            <section>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div>
                  <h2 className="text-base font-semibold text-zinc-950">Today Plan</h2>
                  <p className="mt-0.5 text-xs text-zinc-500">Compact section cards for today&apos;s work.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setView("history")}
                  className="ml-auto rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
                >
                  History
                </button>
              </div>

              {allDone && (
                <div className="mb-3 rounded-lg border border-teal-100 bg-teal-50 px-4 py-3 text-center">
                  <p className="text-sm font-medium text-teal-800">All done for today.</p>
                  <p className="mt-0.5 text-xs text-teal-600">
                    Great work. Take a break or add more tasks.
                  </p>
                </div>
              )}

              {today.tasks.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-300 bg-white px-4 py-8 text-center shadow-sm">
                  <p className="text-sm font-medium text-zinc-500">No tasks planned yet.</p>
                  <p className="mt-1 text-xs text-zinc-400">Add a task above to start filling Today Plan.</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleSections.map((section) => (
                    <SectionGroup
                      key={section.id}
                      name={settings.sectionNames[section.id]}
                      tasks={section.tasks}
                      activeTaskId={activeTaskId}
                      onStart={handleStartFocus}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                    />
                  ))}
                </div>
              )}
            </section>

            <DistractionNote
              value={today.distractionNote}
              checking={checkingNote}
              onChange={(value) =>
                updateToday((record) => ({ ...record, distractionNote: value }))
              }
              onFixSpelling={fixDistractionNote}
            />
          </>
        ) : (
          <DailyRecords records={previousRecords} settings={settings} />
        )}
      </div>

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onSave={(updated) => {
            setSettings(updated);
            setSettingsOpen(false);
          }}
        />
      )}
    </main>
  );
}
