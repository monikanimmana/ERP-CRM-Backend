import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Mic, MicOff, Globe, Volume2, VolumeX, MoreVertical, RotateCcw,
  AlertTriangle, Settings, X,
} from "lucide-react";
import { Orb } from "./components/Orb";
import { TranscriptView } from "./components/TranscriptView";
import { PipelineStrip } from "./components/PipelineStrip";
import { ActionCard } from "./components/ActionCard";
import { ReplyBubble } from "./components/ReplyBubble";
import { TryChips } from "./components/TryChips";
import { StatusPill } from "./components/StatusPill";
import { StatCards } from "./components/StatCards";
import { CategoryDonut } from "./components/CategoryDonut";
import { ExpenseList } from "./components/ExpenseList";
import { TaskList } from "./components/TaskList";
import { ActivityTimeline } from "./components/ActivityTimeline";
import { useVoicePipeline } from "./hooks/useVoicePipeline";
import { getClient, isUsingMock, setMockMode } from "./lib/api";
import type { DashboardData } from "./types/contract";

type DashboardTab = "expenses" | "tasks" | "activity";

const EMPTY_DASHBOARD: DashboardData = {
  totals: { today: 0, week: 0, month: 0 },
  by_category: [],
  recent_expenses: [],
  open_tasks: [],
  activity: [],
};

export default function App() {
  const pipeline = useVoicePipeline();
  const [mockMode, setMockModeState] = useState(isUsingMock());
  const [dashboard, setDashboard] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [dashLoading, setDashLoading] = useState(true);
  const [backendConnected, setBackendConnected] = useState<boolean | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<DashboardTab>("expenses");
  const [menuOpen, setMenuOpen] = useState(false);
  const [typeInput, setTypeInput] = useState("");
  const [showTypeInput, setShowTypeInput] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const prevStateRef = useRef(pipeline.state);

  // Toggle mock mode
  const handleMockToggle = useCallback((val: boolean) => {
    setMockMode(val);
    setMockModeState(val);
  }, []);

  // Fetch dashboard data
  const refreshDashboard = useCallback(async () => {
    try {
      const data = await getClient().getDashboard();
      setDashboard(data);
    } catch {
      // If in real mode and backend is down, mark accordingly
      if (!isUsingMock()) setBackendConnected(false);
    }
  }, []);

  // Check backend health (real mode only)
  const checkHealth = useCallback(async () => {
    if (isUsingMock()) { setBackendConnected(undefined); return; }
    try {
      await getClient().health();
      setBackendConnected(true);
    } catch {
      setBackendConnected(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setDashLoading(true);
    Promise.all([refreshDashboard(), checkHealth()]).finally(() => setDashLoading(false));
  }, [mockMode]); // eslint-disable-line

  // Refresh dashboard after each completed pipeline run
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = pipeline.state;
    if (prev === "speaking" && pipeline.state === "idle") {
      refreshDashboard();
    }
    if (prev === "acting" && pipeline.state === "speaking") {
      refreshDashboard();
    }
  }, [pipeline.state, refreshDashboard]);

  // Orb click handler — toggle listening
  const handleOrbClick = () => {
    if (pipeline.state === "listening") {
      pipeline.stopListening();
    } else if (pipeline.state === "idle" || pipeline.state === "error") {
      pipeline.startListening();
    } else if (pipeline.state === "speaking") {
      pipeline.cancelAll();
    }
  };

  // Typed input submit
  const handleTypeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeInput.trim()) return;
    pipeline.submitText(typeInput.trim());
    setTypeInput("");
    setShowTypeInput(false);
  };

  // Chip select
  const handleChipSelect = (text: string) => {
    pipeline.submitText(text);
  };

  // Reset demo
  const handleResetDemo = async () => {
    setMenuOpen(false);
    await getClient().resetDemo();
    await refreshDashboard();
  };

  // Task complete
  const handleTaskComplete = async (id: string) => {
    await getClient().patchTask(id, "done");
    await refreshDashboard();
  };

  // Delete expense
  const handleDeleteExpense = async (id: string) => {
    await getClient().deleteExpense(id);
    await refreshDashboard();
  };

  // Delete task
  const handleDeleteTask = async (id: string) => {
    await getClient().deleteTask(id);
    await refreshDashboard();
  };

  // Undo action
  const handleUndo = async (action: any) => {
    await pipeline.undoAction(action);
    await refreshDashboard();
  };

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isBusy = !["idle", "error"].includes(pipeline.state);

  // ─── Unsupported browser banner ───────────────────────────────────────────
  if (!pipeline.speechSupported) {
    return (
      <div className="unsupported-banner" role="alert">
        <AlertTriangle size={40} className="banner-icon" aria-hidden="true" />
        <h2>Voice not supported</h2>
        <p>
          Your browser doesn't support the Web Speech API.<br />
          Please use <strong>Chrome</strong> or <strong>Edge</strong> for the full experience.
        </p>
        <p className="banner-hint">You can still use the typed input below once you dismiss this.</p>
        <div className="banner-actions">
          <button className="btn-primary" onClick={() => setShowTypeInput(true)}>
            Use typed input instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* ── Left: Voice Stage ─────────────────────────────────────────── */}
      <main className="voice-stage" aria-label="Voice stage">
        {/* Top bar */}
        <header className="stage-topbar">
          <div className="logo-wrap">
            <div className="logo-orb" aria-hidden="true" />
            <span className="logo-text">SayDone</span>
          </div>

          <div className="topbar-controls">
            {/* Language toggle */}
            <button
              className={`ctrl-btn lang-btn ${pipeline.lang === "hi-IN" ? "active" : ""}`}
              onClick={() => pipeline.setLang(pipeline.lang === "en-IN" ? "hi-IN" : "en-IN")}
              aria-label={`Switch to ${pipeline.lang === "en-IN" ? "Hindi" : "English"}`}
              title="Toggle language"
            >
              <Globe size={14} aria-hidden="true" />
              {pipeline.lang === "en-IN" ? "EN" : "HI"}
            </button>

            {/* Mute toggle */}
            <button
              className={`ctrl-btn ${pipeline.muted ? "active" : ""}`}
              onClick={() => pipeline.setMuted(!pipeline.muted)}
              aria-label={pipeline.muted ? "Unmute voice output" : "Mute voice output"}
              title="Toggle mute"
            >
              {pipeline.muted ? <VolumeX size={14} aria-hidden="true" /> : <Volume2 size={14} aria-hidden="true" />}
            </button>

            {/* Demo mode toggle */}
            <button
              className={`ctrl-btn demo-btn ${mockMode ? "active" : ""}`}
              onClick={() => handleMockToggle(!mockMode)}
              aria-label={mockMode ? "Switch to real backend" : "Switch to demo mode"}
              title="Demo mode"
            >
              Demo {mockMode ? "ON" : "OFF"}
            </button>

            <StatusPill mockMode={mockMode} connected={backendConnected} />

            {/* Menu */}
            <div className="menu-wrap" ref={menuRef}>
              <button
                className="ctrl-btn icon-btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More options"
                aria-expanded={menuOpen}
              >
                <MoreVertical size={14} aria-hidden="true" />
              </button>
              {menuOpen && (
                <div className="dropdown-menu" role="menu">
                  <button className="menu-item" onClick={handleResetDemo} role="menuitem">
                    <RotateCcw size={12} aria-hidden="true" /> Reset demo data
                  </button>
                  <button className="menu-item" onClick={() => { setShowTypeInput(true); setMenuOpen(false); }} role="menuitem">
                    <Settings size={12} aria-hidden="true" /> Typed input
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Permission denied state */}
        {pipeline.permissionDenied && (
          <div className="permission-denied" role="alert">
            <MicOff size={24} aria-hidden="true" />
            <h3>Microphone access denied</h3>
            <p>Click the lock icon in your browser's address bar and allow microphone access, then refresh.</p>
            <button className="btn-secondary" onClick={() => handleMockToggle(true)}>
              Switch to demo mode
            </button>
          </div>
        )}

        {/* Backend error state (real mode only) */}
        {!mockMode && backendConnected === false && (
          <div className="backend-error" role="alert">
            <AlertTriangle size={18} aria-hidden="true" />
            <span>Backend unreachable.</span>
            <button className="btn-inline" onClick={() => handleMockToggle(true)}>
              Switch to demo mode
            </button>
          </div>
        )}

        {/* Main orb area */}
        <div className="orb-area">
          <Orb
            state={pipeline.state}
            micLevel={pipeline.micLevel}
            onClick={handleOrbClick}
          />

          <p className="orb-hint" aria-live="polite">
            {pipeline.state === "idle" && "Tap · Hold Space · or type below"}
            {pipeline.state === "listening" && "Listening… tap to stop"}
            {pipeline.state === "thinking" && ""}
            {pipeline.state === "acting" && "Saving actions…"}
            {pipeline.state === "speaking" && "Speaking…"}
            {pipeline.state === "error" && "Tap to try again"}
          </p>
        </div>

        {/* Error display */}
        {pipeline.state === "error" && pipeline.error && (
          <div className="error-banner" role="alert" aria-live="assertive">
            <AlertTriangle size={14} aria-hidden="true" />
            <span>{pipeline.error}</span>
            {!mockMode && (
              <button className="btn-inline" onClick={() => handleMockToggle(true)}>
                Switch to demo mode
              </button>
            )}
          </div>
        )}

        {/* Pipeline strip */}
        <PipelineStrip steps={pipeline.steps} />

        {/* Transcript */}
        <TranscriptView
          finalTranscript={pipeline.transcript}
          interimTranscript={pipeline.interimTranscript}
          isTyped={pipeline.isTyped}
        />

        {/* Action cards */}
        {pipeline.actions.length > 0 && (
          <div className="action-cards-wrap" role="region" aria-label="Actions taken">
            {pipeline.actions.map((action, i) => (
              <ActionCard
                key={action.id}
                action={action}
                index={i}
                onUndo={handleUndo}
              />
            ))}
          </div>
        )}

        {/* Reply bubble */}
        <ReplyBubble
          text={pipeline.replyText}
          speaking={pipeline.state === "speaking"}
          currentWordIndex={pipeline.currentWordIndex}
        />

        {/* Typed input */}
        {showTypeInput ? (
          <form className="type-input-form" onSubmit={handleTypeSubmit} aria-label="Typed input">
            <input
              type="text"
              className="type-input"
              value={typeInput}
              onChange={(e) => setTypeInput(e.target.value)}
              placeholder="Type your request…"
              disabled={isBusy}
              aria-label="Type your voice command"
              autoFocus
            />
            <button type="submit" className="btn-primary" disabled={isBusy || !typeInput.trim()}>
              Send
            </button>
            <button type="button" className="icon-btn" onClick={() => setShowTypeInput(false)} aria-label="Close typed input">
              <X size={14} />
            </button>
          </form>
        ) : (
          <button className="show-type-btn" onClick={() => setShowTypeInput(true)}>
            <Settings size={12} aria-hidden="true" /> Or type it
          </button>
        )}

        {/* Try chips */}
        <TryChips onSelect={handleChipSelect} disabled={isBusy} />
      </main>

      {/* ── Right: Dashboard ───────────────────────────────────────────── */}
      <aside className="dashboard" aria-label="Your day dashboard">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Your Day</h2>
        </div>

        <StatCards
          today={dashboard.totals.today}
          week={dashboard.totals.week}
          month={dashboard.totals.month}
        />

        <div className="dashboard-card">
          <h3 className="card-section-title">Spending by Category</h3>
          <CategoryDonut data={dashboard.by_category} />
        </div>

        {/* Mobile tabs */}
        <div className="dashboard-tabs" role="tablist">
          {(["expenses", "tasks", "activity"] as DashboardTab[]).map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              className={`dash-tab ${activeTab === tab ? "tab-active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "expenses" ? "Expenses" : tab === "tasks" ? "Tasks" : "Activity"}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="dashboard-card tab-content" role="tabpanel">
          {activeTab === "expenses" && (
            <>
              <h3 className="card-section-title">Recent Expenses</h3>
              <ExpenseList
                expenses={dashboard.recent_expenses}
                onDelete={handleDeleteExpense}
                loading={dashLoading}
              />
            </>
          )}
          {activeTab === "tasks" && (
            <>
              <h3 className="card-section-title">Tasks & Reminders</h3>
              <TaskList
                tasks={dashboard.open_tasks}
                onComplete={handleTaskComplete}
                onDelete={handleDeleteTask}
                loading={dashLoading}
              />
            </>
          )}
          {activeTab === "activity" && (
            <>
              <h3 className="card-section-title">Activity</h3>
              <ActivityTimeline entries={dashboard.activity} loading={dashLoading} />
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
