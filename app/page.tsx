"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  createEmptyDay,
  DayRecord,
  FocusTask,
  LedgerState,
  loadLedger,
  saveLedger,
  SectionId,
  todayKey,
} from "@/lib/storage";
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

function uid() {
  return crypto.randomUUID();
}

export default function Home() {
  const [ledger, setLedger] = useState<LedgerState>({ days: {} });
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedSection, setSelectedSection] = useState<SectionId>("execution");
  const [checkingTask, setCheckingTask] = useState(false);
  const [checkingNote, setCheckingNote] = useState(false);
  const [englishStatus, setEnglishStatus] = useState("");

  const [session, setSession] = useState<SessionState>({ status: "idle" });
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Refs used inside the interval callback — never read during render
  const sessionRef = useRef<SessionState>(session);
  const prevSessionRef = useRef<SessionState>({ status: "idle" });
  const markedDoneRef = useRef(false);
  const hasMountedRef = useRef(false);

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

  // Load localStorage on mount
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const loadedLedger = loadLedger();
    if (!loadedLedger.days[date]) {
      loadedLedger.days[date] = createEmptyDay(date);
    }
    setLedger(loadedLedger);

    const restored = loadSession();
    setSession(restored);
    sessionRef.current = restored;
    prevSessionRef.current = restored;
  }, [date]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Persist ledger
  useEffect(() => {
    if (Object.keys(ledger.days).length > 0) {
      saveLedger(ledger);
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

  return (
    <main className="min-h-screen">
      <Header
        focusMinutes={today.focusMinutes}
        doneCount={completedTasks}
        totalCount={today.tasks.length}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <div className="mx-auto w-full max-w-2xl space-y-5 px-5 py-6 sm:px-8">
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

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-4 py-3">
            <h2 className="text-base font-semibold text-zinc-950">Today Plan</h2>
          </div>

          {allDone && (
            <div className="border-b border-zinc-100 bg-teal-50 px-4 py-3 text-center">
              <p className="text-sm font-medium text-teal-800">All done for today.</p>
              <p className="mt-0.5 text-xs text-teal-600">
                Great work — take a break or add more tasks.
              </p>
            </div>
          )}

          <div className="divide-y divide-zinc-100">
            {SECTION_ORDER.map((sectionId) => (
              <SectionGroup
                key={sectionId}
                name={settings.sectionNames[sectionId]}
                tasks={today.tasks.filter((t) => t.section === sectionId)}
                activeTaskId={activeTaskId}
                onStart={handleStartFocus}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </div>

        <DistractionNote
          value={today.distractionNote}
          checking={checkingNote}
          onChange={(value) =>
            updateToday((record) => ({ ...record, distractionNote: value }))
          }
          onFixSpelling={fixDistractionNote}
        />
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
