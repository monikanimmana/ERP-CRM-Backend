import React from "react";
import { Trash2, Bell, CheckSquare } from "lucide-react";
import type { OpenTask } from "../types/contract";

function getDueChip(dueDate?: string): { label: string; color: string } | null {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { label: "Overdue", color: "#F87171" };
  if (diffDays === 0) return { label: "Today", color: "#FBBF24" };
  if (diffDays === 1) return { label: "Tomorrow", color: "#34D399" };
  return {
    label: due.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
    color: "#A78BFA",
  };
}

interface TaskListProps {
  tasks: OpenTask[];
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export function TaskList({ tasks, onComplete, onDelete, loading }: TaskListProps) {
  if (loading) {
    return (
      <div className="list-skeleton">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="list-empty">
        <p>No open tasks</p>
        <p className="list-empty-hint">Say "Remind me to call mom tomorrow" to add one</p>
      </div>
    );
  }

  return (
    <ul className="task-list" aria-label="Tasks and reminders">
      {tasks.map((task) => {
        const chip = getDueChip(task.due_date);
        const Icon = task.type === "reminder" ? Bell : CheckSquare;
        return (
          <li key={task.id} className="task-item">
            <button
              className="task-check"
              onClick={() => onComplete?.(task.id)}
              aria-label={`Mark as done: ${task.title}`}
            >
              <Icon size={14} aria-hidden="true" />
            </button>
            <div className="task-body">
              <span className="task-title">{task.title}</span>
              {chip && (
                <span className="due-chip" style={{ color: chip.color, background: `${chip.color}18` }}>
                  {chip.label}
                </span>
              )}
            </div>
            {onDelete && (
              <button
                className="delete-btn"
                onClick={() => onDelete(task.id)}
                aria-label={`Delete: ${task.title}`}
              >
                <Trash2 size={12} aria-hidden="true" />
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
