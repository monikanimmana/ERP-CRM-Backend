/**
 * API Contract Types — matches the backend specification exactly
 * Defines all TypeScript interfaces for voice processing pipeline
 */

// Language support for voice recognition and synthesis
export type Language = "en-IN" | "hi-IN";

// Action types generated from voice commands
export type ActionType =
  | "expense_logged"
  | "task_created"
  | "reminder_set"
  | "email_sent"
  | "query_answered";

// Status of action execution
export type ActionStatus = "success" | "failed";

// LLM provider used for processing
export type LLMProvider = "gemini" | "claude" | "openai" | "rules_fallback";

// Expense data structure
export interface ExpenseData {
  id: string;
  amount: number;
  category: string;
  description: string;
  created_at: string;
}

// Task data structure
export interface TaskData {
  id: string;
  title: string;
  due_date?: string;
  status: "open" | "done";
  created_at: string;
}

// Reminder data structure
export interface ReminderData {
  id: string;
  title: string;
  remind_at: string;
  status: "open" | "done";
  created_at: string;
}

// Email data structure
export interface EmailData {
  to: string;
  subject: string;
  sent_at: string;
}

// Query response data
export interface QueryData {
  answer: string;
  amount?: number;
  period?: string;
}

// Union type for all possible action data
export type ActionData = ExpenseData | TaskData | ReminderData | EmailData | QueryData;

// Single action performed by the system
export interface Action {
  id: string;
  type: ActionType;
  status: ActionStatus;
  real: boolean; // true = real backend, false = simulated
  summary: string;
  data: ActionData;
}

// Processing timings in milliseconds
export interface TimingsMs {
  understand: number; // Time to understand voice
  act: number; // Time to perform actions
  total: number; // Total processing time
}

// Request to process voice/text
export interface ProcessRequest {
  transcript: string;
  lang: Language;
  client_time: string;
  timezone: string;
}

// Response from voice processing
export interface ProcessResponse {
  transcript: string;
  reply_text: string;
  actions: Action[];
  timings_ms: TimingsMs;
  llm_provider: LLMProvider;
}

// API error response
export interface APIError {
  error: {
    code: "EMPTY_TRANSCRIPT" | "NOT_UNDERSTOOD";
    message: string;
  };
}

// Category spending summary
export interface CategoryTotal {
  category: string;
  total: number;
}

// Recent expense entry
export interface RecentExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  created_at: string;
}

// Open task or reminder
export interface OpenTask {
  id: string;
  title: string;
  due_date?: string;
  status: "open" | "done";
  created_at: string;
  type: "task" | "reminder";
}

// Activity entry (transcript + actions)
export interface ActivityEntry {
  id: string;
  transcript: string;
  actions: Action[];
  created_at: string;
}

// Complete dashboard data
export interface DashboardData {
  totals: {
    today: number;
    week: number;
    month: number;
  };
  by_category: CategoryTotal[];
  recent_expenses: RecentExpense[];
  open_tasks: OpenTask[];
  activity: ActivityEntry[];
}

// Backend health check response
export interface HealthData {
  status: "ok" | "degraded";
  llm: string;
  email: string;
  db: string;
}

// Voice pipeline state transitions
export type PipelineState =
  | "idle"
  | "listening"
  | "transcribing"
  | "thinking"
  | "acting"
  | "speaking"
  | "error";

// Individual pipeline step for UI display
export interface PipelineStep {
  key: "voice_in" | "understood" | "action_done" | "voice_out";
  label: string;
  ms?: number; // Milliseconds taken for this step
  active: boolean;
  done: boolean;
}
