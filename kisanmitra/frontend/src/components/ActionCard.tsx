import React, { useState } from "react";
import {
  DollarSign, CheckSquare, Bell, Mail, HelpCircle, Undo2, CheckCircle2, XCircle,
} from "lucide-react";
import type { Action } from "../types/contract";

const ACTION_META = {
  expense_logged: { label: "Expense logged", Icon: DollarSign, color: "#34D399" },
  task_created: { label: "Task created", Icon: CheckSquare, color: "#7C5CFF" },
  reminder_set: { label: "Reminder set", Icon: Bell, color: "#FBBF24" },
  email_sent: { label: "Email sent", Icon: Mail, color: "#22D3EE" },
  query_answered: { label: "Answer", Icon: HelpCircle, color: "#7C5CFF" },
};

interface ActionCardProps {
  action: Action;
  onUndo?: (action: Action) => void;
  index: number;
}

export function ActionCard({ action, onUndo, index }: ActionCardProps) {
  const [undone, setUndone] = useState(false);
  const [undoing, setUndoing] = useState(false);

  const meta = ACTION_META[action.type];
  const { Icon, color, label } = meta;

  const canUndo = ["expense_logged", "task_created", "reminder_set"].includes(action.type);

  async function handleUndo() {
    if (!onUndo || undoing) return;
    setUndoing(true);
    try {
      await onUndo(action);
      setUndone(true);
    } catch {
      setUndoing(false);
    }
  }

  if (undone) return null;

  return (
    <div
      className="action-card"
      style={{ animationDelay: `${index * 80}ms` }}
      role="article"
      aria-label={`${label}: ${action.summary}`}
    >
      <div className="action-card-left">
        <div className="action-icon-wrap" style={{ background: `${color}18`, color }}>
          <Icon size={16} aria-hidden="true" />
        </div>
        <div className="action-card-body">
          <div className="action-card-header">
            <span className="action-type-label">{label}</span>
            <span className={`action-chip ${action.real ? "chip-real" : "chip-simulated"}`}>
              {action.real ? "Real" : "Simulated"}
            </span>
            {action.status === "success" ? (
              <CheckCircle2 size={13} className="action-status-ok" aria-label="Success" />
            ) : (
              <XCircle size={13} className="action-status-err" aria-label="Failed" />
            )}
          </div>
          <p className="action-summary">{action.summary}</p>
        </div>
      </div>
      {canUndo && (
        <button
          className={`undo-btn ${undoing ? "undoing" : ""}`}
          onClick={handleUndo}
          disabled={undoing}
          aria-label="Undo this action"
        >
          <Undo2 size={13} aria-hidden="true" />
          {undoing ? "Undoing…" : "Undo"}
        </button>
      )}
    </div>
  );
}
