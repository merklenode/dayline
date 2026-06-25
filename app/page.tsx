"use client";

import { useEffect, useRef, useState } from "react";
import { createEmptyDay, DayRecord, FocusTask, LedgerState, loadLedger, saveLedger, SectionId, todayKey } from "@/lib/storage";
import { AppSettings, loadSettings, saveSettings, SECTION_ORDER } from "@/lib/settings";
import { clearTimerState, loadTimerState, saveTimerState } from "@/lib/timerState";
import { Header } from "@/components/Header";
import { TaskInput } from "@/components/TaskInput";
import { SectionGroup } from "@/components/SectionGroup";
import { DistractionNote } from "@/components/DistractionNote";
import { SettingsModal } from "@/components/SettingsModal";

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

  // Timer state — running is never persisted
  const workMinutesRef = useRef(settings.workMinutes);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [timerMode, setTimerMode] = useState<"work" | "break">("work");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [running, setRunning] = useState(false);
  const expiredRef = useRef<{ mode: "work" | "break" } | null>(null);

  const date = todayKey();
  const today = ledger.days[date] ?? createEmptyDay(date);

  // Load client-only localStorage stores on mount.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const loadedLedger = loadLedger();
    const loadedSettings = loadSettings();
    const loadedTimer = loadTimerState();

    if (!loadedLedger.days[date]) {
      loadedLedger.days[date] = createEmptyDay(date);
    }

    setLedger(loadedLedger);
    setActiveTaskId(loadedTimer.activeTaskId);
    setTimerMode("work");
    setSecondsLeft(
      loadedTimer.activeTaskId && loadedTimer.secondsLeft > 0
        ? loadedTimer.secondsLeft
        : loadedSettings.workMinutes * 60
    );
    setRunning(false); // never auto-start
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

  // Persist timer position (but never running state)
  useEffect(() => {
    if (activeTaskId) {
      saveTimerState({ activeTaskId, secondsLeft });
    }
  }, [activeTaskId, secondsLeft]);

  // Timer tick
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s > 1) return s - 1;
        expiredRef.current = { mode: timerMode };
        setRunning(false);
        return 0;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, timerMode]);

  // Handle timer expiry outside the interval callback to avoid stale closures
  useEffect(() => {
    if (running || expiredRef.current === null) return;
    const expired = expiredRef.current;
    expiredRef.current = null;

    if (expired.mode === "work") {
      addFocusMinutes(workMinutesRef.current);
      setTimerMode("break");
      setSecondsLeft(settings.breakMinutes * 60);
      setRunning(true); // auto-start break
    } else {
      setTimerMode("work");
      setSecondsLeft(settings.workMinutes * 60);
      setActiveTaskId(null);
      clearTimerState();
    }
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateToday(updater: (record: DayRecord) => DayRecord) {
    setLedger((current) => ({
      days: {
        ...current.days,
        [date]: updater(current.days[date] ?? createEmptyDay(date))
      }
    }));
  }

  function addFocusMinutes(minutes: number) {
    updateToday((record) => ({ ...record, focusMinutes: record.focusMinutes + minutes }));
  }

  function addTask() {
    const cleanTitle = taskTitle.trim();
    if (!cleanTitle) return;

    const task: FocusTask = {
      id: uid(),
      title: cleanTitle,
      done: false,
      createdAt: new Date().toISOString(),
      section: selectedSection
    };

    updateToday((record) => ({ ...record, tasks: [...record.tasks, task] }));
    setTaskTitle("");
    setEnglishStatus("");
  }

  function toggleTask(id: string) {
    if (id === activeTaskId) {
      handleTimerReset();
    }
    updateToday((record) => ({
      ...record,
      tasks: record.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    }));
  }

  function deleteTask(id: string) {
    if (id === activeTaskId) {
      handleTimerReset();
    }
    updateToday((record) => ({
      ...record,
      tasks: record.tasks.filter((t) => t.id !== id)
    }));
  }

  function handleTimerStart(taskId: string) {
    workMinutesRef.current = settings.workMinutes;
    setActiveTaskId(taskId);
    setTimerMode("work");
    setSecondsLeft(settings.workMinutes * 60);
    setRunning(true);
  }

  function handleTimerPause() {
    setRunning(false);
  }

  function handleTimerResume() {
    setRunning(true);
  }

  function handleTimerReset() {
    setRunning(false);
    setTimerMode("work");
    setSecondsLeft(settings.workMinutes * 60);
    setActiveTaskId(null);
    clearTimerState();
  }

  async function fixEnglish(text: string) {
    const response = await fetch("/api/check-english", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const result = (await response.json()) as { correctedText?: string; changed?: boolean; error?: string };
    if (!response.ok || result.error) {
      throw new Error(result.error || "English check failed.");
    }
    return result;
  }

  async function fixTaskTitle() {
    const text = taskTitle.trim();
    if (!text) { setEnglishStatus("Write a task first."); return; }
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
    if (!text) { setEnglishStatus("Write a note first."); return; }
    setCheckingNote(true);
    setEnglishStatus("");
    try {
      const result = await fixEnglish(text);
      updateToday((record) => ({ ...record, distractionNote: result.correctedText ?? record.distractionNote }));
      setEnglishStatus(result.changed ? "Note spelling improved." : "No correction found.");
    } catch (error) {
      setEnglishStatus(error instanceof Error ? error.message : "English check failed.");
    } finally {
      setCheckingNote(false);
    }
  }

  const completedTasks = today.tasks.filter((t) => t.done).length;

  const timerProps = {
    running,
    mode: timerMode,
    secondsLeft,
    onStart: handleTimerStart,
    onPause: handleTimerPause,
    onResume: handleTimerResume,
    onReset: handleTimerReset
  };

  return (
    <main className="min-h-screen">
      <Header
        focusMinutes={today.focusMinutes}
        doneCount={completedTasks}
        totalCount={today.tasks.length}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <div className="mx-auto w-full max-w-2xl space-y-5 px-5 py-6 sm:px-8">
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
          <div className="divide-y divide-zinc-100">
            {SECTION_ORDER.map((sectionId) => (
              <SectionGroup
                key={sectionId}
                id={sectionId}
                name={settings.sectionNames[sectionId]}
                tasks={today.tasks.filter((t) => t.section === sectionId)}
                activeTaskId={activeTaskId}
                timerProps={timerProps}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </div>

        <DistractionNote
          value={today.distractionNote}
          checking={checkingNote}
          onChange={(value) => updateToday((record) => ({ ...record, distractionNote: value }))}
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
