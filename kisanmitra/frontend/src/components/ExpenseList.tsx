import React from "react";
import { Trash2 } from "lucide-react";
import type { RecentExpense } from "../types/contract";

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#34D399",
  Transport: "#22D3EE",
  Education: "#7C5CFF",
  Medical: "#F87171",
  Shopping: "#FBBF24",
  Miscellaneous: "#A78BFA",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface ExpenseListProps {
  expenses: RecentExpense[];
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export function ExpenseList({ expenses, onDelete, loading }: ExpenseListProps) {
  if (loading) {
    return (
      <div className="list-skeleton">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
    );
  }

  if (!expenses.length) {
    return (
      <div className="list-empty">
        <p>No expenses logged yet</p>
        <p className="list-empty-hint">Say "Spent 150 rupees on lunch" to get started</p>
      </div>
    );
  }

  return (
    <ul className="expense-list" aria-label="Recent expenses">
      {expenses.map((e) => {
        const color = CATEGORY_COLORS[e.category] ?? "#A78BFA";
        return (
          <li key={e.id} className="expense-item">
            <div className="expense-left">
              <span className="expense-category-chip" style={{ background: `${color}20`, color }}>
                {e.category}
              </span>
              <span className="expense-desc">{e.description}</span>
            </div>
            <div className="expense-right">
              <span className="expense-amount">₹{e.amount.toLocaleString("en-IN")}</span>
              <span className="expense-date">{formatDate(e.created_at)}</span>
              {onDelete && (
                <button
                  className="delete-btn"
                  onClick={() => onDelete(e.id)}
                  aria-label={`Delete expense: ${e.description}`}
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
