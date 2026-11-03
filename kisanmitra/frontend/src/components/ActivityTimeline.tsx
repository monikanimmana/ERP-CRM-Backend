import React from "react";
import { MessageSquare, DollarSign, CheckSquare, Bell, Mail, HelpCircle } from "lucide-react";
import type { ActivityEntry, ActionType } from "../types/contract";

const ACTION_ICONS: Record<ActionType, any> = {
  expense_logged: DollarSign,
  task_created: CheckSquare,
  reminder_set: Bell,
  email_sent: Mail,
  query_answered: HelpCircle,
};

const ACTION_COLORS: Record<ActionType, string> = {
  expense_logged: "#34D399",
  task_created: "#7C5CFF",
  reminder_set: "#FBBF24",
  email_sent: "#22D3EE",
  query_answered: "#A78BFA",
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface ActivityTimelineProps {
  entries: ActivityEntry[];
  loading?: boolean;
}

export function ActivityTimeline({ entries, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="list-skeleton">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton-row tall" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    );
  }

  if (!entries.length) {
    return (
      <div className="list-empty">
        <MessageSquare size={28} opacity={0.3} aria-hidden="true" />
        <p>No activity yet</p>
        <p className="list-empty-hint">Your voice requests will appear here</p>
      </div>
    );
  }

  return (
    <ul className="activity-timeline" aria-label="Activity history">
      {entries.map((entry) => (
        <li key={entry.id} className="activity-entry">
          <div className="activity-meta">
            <MessageSquare size={12} aria-hidden="true" />
            <span className="activity-time">{timeAgo(entry.created_at)}</span>
          </div>
          <p className="activity-transcript">"{entry.transcript}"</p>
          <div className="activity-actions">
            {entry.actions.map((a) => {
              const Icon = ACTION_ICONS[a.type];
              const color = ACTION_COLORS[a.type];
              return (
                <span key={a.id} className="activity-action-chip" style={{ color, background: `${color}18` }}>
                  <Icon size={10} aria-hidden="true" />
                  {a.summary}
                </span>
              );
            })}
          </div>
        </li>
      ))}
    </ul>
  );
}
