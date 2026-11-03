// Real + Mock API client — same interface, toggled by VITE_USE_MOCK or runtime flag
import type {
  ProcessRequest,
  ProcessResponse,
  DashboardData,
  RecentExpense,
  OpenTask,
  HealthData,
  Action,
  ActivityEntry,
} from "../types/contract";

// ─── Shared interface ──────────────────────────────────────────────────────────
export interface APIClient {
  processVoice(req: ProcessRequest): Promise<ProcessResponse>;
  getDashboard(): Promise<DashboardData>;
  getExpenses(limit?: number): Promise<RecentExpense[]>;
  getTasks(status?: "open" | "done"): Promise<OpenTask[]>;
  patchTask(id: string, status: "done"): Promise<OpenTask>;
  deleteExpense(id: string): Promise<void>;
  deleteTask(id: string): Promise<void>;
  resetDemo(): Promise<void>;
  health(): Promise<HealthData>;
}

// ─── Real Client ───────────────────────────────────────────────────────────────
const BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body?.error?.message ?? `HTTP ${res.status}`);
    (err as any).code = body?.error?.code;
    (err as any).status = res.status;
    throw err;
  }
  return res.json();
}

export const realClient: APIClient = {
  async processVoice(req) {
    const res = await fetch(`${BASE}/api/voice/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });
    return handleResponse<ProcessResponse>(res);
  },
  async getDashboard() {
    const res = await fetch(`${BASE}/api/dashboard`);
    return handleResponse<DashboardData>(res);
  },
  async getExpenses(limit = 20) {
    const res = await fetch(`${BASE}/api/expenses?limit=${limit}`);
    return handleResponse<RecentExpense[]>(res);
  },
  async getTasks(status = "open") {
    const res = await fetch(`${BASE}/api/tasks?status=${status}`);
    return handleResponse<OpenTask[]>(res);
  },
  async patchTask(id, status) {
    const res = await fetch(`${BASE}/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    return handleResponse<OpenTask>(res);
  },
  async deleteExpense(id) {
    const res = await fetch(`${BASE}/api/expenses/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
  async deleteTask(id) {
    const res = await fetch(`${BASE}/api/tasks/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
  async resetDemo() {
    const res = await fetch(`${BASE}/api/demo/reset`, { method: "POST" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  },
  async health() {
    const res = await fetch(`${BASE}/api/health`);
    return handleResponse<HealthData>(res);
  },
};

// ─── Mock In-Memory Store ──────────────────────────────────────────────────────
function uuid() {
  return crypto.randomUUID();
}

function isoNow() {
  return new Date().toISOString();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

interface MockStore {
  expenses: RecentExpense[];
  tasks: OpenTask[];
  activity: ActivityEntry[];
}

const SEED_EXPENSES: RecentExpense[] = [
  { id: uuid(), amount: 250, category: "Food", description: "lunch", created_at: isoNow() },
  { id: uuid(), amount: 120, category: "Transport", description: "auto rickshaw", created_at: isoNow() },
  { id: uuid(), amount: 80, category: "Food", description: "chai", created_at: isoNow() },
];

const SEED_TASKS: OpenTask[] = [
  {
    id: uuid(),
    title: "Submit the form",
    due_date: (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d.toISOString(); })(),
    status: "open",
    created_at: isoNow(),
    type: "reminder",
  },
];

let store: MockStore = {
  expenses: [...SEED_EXPENSES],
  tasks: [...SEED_TASKS],
  activity: [],
};

function resetStore() {
  store = {
    expenses: SEED_EXPENSES.map((e) => ({ ...e, id: uuid() })),
    tasks: SEED_TASKS.map((t) => ({ ...t, id: uuid() })),
    activity: [],
  };
}

// ─── Mock Parser ───────────────────────────────────────────────────────────────
interface ParsedIntent {
  type: "expense" | "task" | "reminder" | "email" | "query" | "multi";
  expenses?: Array<{ amount: number; category: string; description: string }>;
  task?: string;
  reminder?: { title: string; when: string };
  email?: boolean;
  query?: { period: string };
}

const CATEGORY_MAP: Record<string, string> = {
  lunch: "Food",
  dinner: "Food",
  breakfast: "Food",
  food: "Food",
  chai: "Food",
  canteen: "Food",
  coffee: "Food",
  auto: "Transport",
  rickshaw: "Transport",
  bus: "Transport",
  metro: "Transport",
  cab: "Transport",
  uber: "Transport",
  fuel: "Transport",
  book: "Education",
  course: "Education",
  medical: "Medical",
  medicine: "Medical",
  doctor: "Medical",
  shopping: "Shopping",
  clothes: "Shopping",
  default: "Miscellaneous",
};

function guessCategory(desc: string): string {
  const lower = desc.toLowerCase();
  for (const [keyword, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(keyword)) return cat;
  }
  return CATEGORY_MAP.default;
}

function parseTranscript(text: string): ParsedIntent {
  const lower = text.toLowerCase();

  // Email summary
  if (lower.includes("email") || lower.includes("summary")) {
    return { type: "email", email: true };
  }

  // Query
  if (lower.includes("how much") || lower.includes("kitna") || lower.includes("spent")) {
    const period = lower.includes("today")
      ? "today"
      : lower.includes("week")
      ? "this week"
      : lower.includes("month")
      ? "this month"
      : "today";
    return { type: "query", query: { period } };
  }

  const actions: ParsedIntent = { type: "multi", expenses: [], };
  let hasReminder = false;
  let hasExpense = false;

  // Extract reminder
  const reminderMatch = text.match(/remind(?:er)? (?:me )?(?:to )?(.+?)(?:on|at|by)?\s*((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today|\d+ \w+|\w+ \d+)(?:\s+at\s+\d+(?::\d+)?\s*(?:am|pm)?)?)?/i);
  if (reminderMatch) {
    const title = reminderMatch[1].trim().replace(/(friday|monday|tuesday|wednesday|thursday|saturday|sunday|tomorrow|today)/i, "").trim();
    const when = reminderMatch[2] ?? "tomorrow";
    actions.reminder = { title: title || "Follow up", when };
    hasReminder = true;
  }

  // Extract expenses — match "NNN rupees on/for X" or "NNN for X" or "NNN rupaye X"
  const expenseRegex = /(\d+)\s*(?:rs\.?|rupees?|rupaye?|₹)?\s*(?:on|for|mein|per)?\s*([a-zA-Z\s]+?)(?=\s+(?:and|,|\d)|$)/gi;
  let match;
  while ((match = expenseRegex.exec(text)) !== null) {
    const amount = parseInt(match[1], 10);
    const desc = match[2].trim().replace(/\s+/g, " ");
    if (amount > 0 && desc.length > 0) {
      const cleanDesc = desc.replace(/(?:remind|me|to|submit|form|friday|monday|tuesday|wednesday|thursday|saturday|sunday|tomorrow|today)/gi, "").trim();
      if (cleanDesc.length > 0) {
        actions.expenses!.push({ amount, category: guessCategory(cleanDesc), description: cleanDesc });
        hasExpense = true;
      }
    }
  }

  // Hindi/simple "90 rupaye X"
  const hindiMatch = text.match(/(\d+)\s*rupaye?\s+(.+)/i);
  if (hindiMatch && !hasExpense) {
    const amount = parseInt(hindiMatch[1], 10);
    const desc = hindiMatch[2].trim();
    actions.expenses!.push({ amount, category: guessCategory(desc), description: desc });
    hasExpense = true;
  }

  if (!hasExpense && !hasReminder) {
    // Try add task
    const taskMatch = text.match(/(?:add|create|remind?)\s+(?:task\s+)?(.+)/i);
    if (taskMatch) {
      return { type: "task", task: taskMatch[1].trim() };
    }
  }

  if (hasExpense || hasReminder) {
    return actions;
  }

  return { type: "query", query: { period: "today" } };
}

function buildReply(intent: ParsedIntent, actions: Action[]): string {
  const parts: string[] = [];
  const successActions = actions.filter((a) => a.status === "success");

  for (const a of successActions) {
    if (a.type === "expense_logged") parts.push(`Saved ${a.summary}`);
    if (a.type === "task_created") parts.push(`Task added: ${a.summary}`);
    if (a.type === "reminder_set") parts.push(`Reminder set — ${a.summary}`);
    if (a.type === "email_sent") parts.push("Summary email sent!");
    if (a.type === "query_answered") {
      const d = a.data as any;
      parts.push(`You spent ₹${d.amount} ${d.period}`);
    }
  }

  return parts.length > 0 ? parts.join(". ") + "." : "Done!";
}

function computeTotals() {
  const now = new Date();
  const todayStr = now.toDateString();
  const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
  const monthAgo = new Date(now); monthAgo.setDate(1);

  let today = 0, week = 0, month = 0;
  for (const e of store.expenses) {
    const d = new Date(e.created_at);
    const amount = e.amount;
    if (d.toDateString() === todayStr) today += amount;
    if (d >= weekAgo) week += amount;
    if (d >= monthAgo) month += amount;
  }
  return { today, week, month };
}

// ─── Mock Client ───────────────────────────────────────────────────────────────
export const mockClient: APIClient = {
  async processVoice(req) {
    await sleep(900);
    const t0 = Date.now();

    if (!req.transcript.trim()) {
      const err = new Error("I didn't catch that. Please try again.");
      (err as any).code = "EMPTY_TRANSCRIPT";
      throw err;
    }

    const intent = parseTranscript(req.transcript);
    const actions: Action[] = [];
    const t1 = Date.now();

    if (intent.expenses) {
      for (const e of intent.expenses) {
        const id = uuid();
        const expense: RecentExpense = {
          id,
          amount: e.amount,
          category: e.category,
          description: e.description,
          created_at: isoNow(),
        };
        store.expenses.unshift(expense);
        actions.push({
          id: uuid(),
          type: "expense_logged",
          status: "success",
          real: false,
          summary: `Rs ${e.amount} · ${e.category} · ${e.description}`,
          data: expense,
        });
      }
    }

    if (intent.reminder) {
      const id = uuid();
      const task: OpenTask = {
        id,
        title: intent.reminder.title,
        due_date: (() => {
          const d = new Date();
          const when = intent.reminder!.when.toLowerCase();
          if (when.includes("tomorrow")) d.setDate(d.getDate() + 1);
          else if (when.includes("friday")) { const day = d.getDay(); d.setDate(d.getDate() + ((5 - day + 7) % 7) || 7); }
          else d.setDate(d.getDate() + 1);
          return d.toISOString();
        })(),
        status: "open",
        created_at: isoNow(),
        type: "reminder",
      };
      store.tasks.unshift(task);
      actions.push({
        id: uuid(),
        type: "reminder_set",
        status: "success",
        real: false,
        summary: `${intent.reminder.title} · ${intent.reminder.when}`,
        data: task,
      });
    }

    if (intent.task) {
      const id = uuid();
      const task: OpenTask = {
        id,
        title: intent.task,
        status: "open",
        created_at: isoNow(),
        type: "task",
      };
      store.tasks.unshift(task);
      actions.push({
        id: uuid(),
        type: "task_created",
        status: "success",
        real: false,
        summary: intent.task,
        data: task,
      });
    }

    if (intent.email) {
      actions.push({
        id: uuid(),
        type: "email_sent",
        status: "success",
        real: false,
        summary: "Summary sent to your inbox",
        data: { to: "you@example.com", subject: "Your SayDone Summary", sent_at: isoNow() },
      });
    }

    if (intent.query) {
      const totals = computeTotals();
      const period = intent.query.period;
      const amount = period === "today" ? totals.today : period === "this week" ? totals.week : totals.month;
      actions.push({
        id: uuid(),
        type: "query_answered",
        status: "success",
        real: false,
        summary: `₹${amount} ${period}`,
        data: { answer: `You spent ₹${amount} ${period}`, amount, period },
      });
    }

    const t2 = Date.now();
    const reply_text = buildReply(intent, actions);

    const response: ProcessResponse = {
      transcript: req.transcript,
      reply_text,
      actions,
      timings_ms: { understand: t1 - t0, act: t2 - t1, total: t2 - t0 },
      llm_provider: "rules_fallback",
    };

    store.activity.unshift({
      id: uuid(),
      transcript: req.transcript,
      actions,
      created_at: isoNow(),
    });

    return response;
  },

  async getDashboard() {
    await sleep(200);
    const totals = computeTotals();
    const byCategory: Record<string, number> = {};
    for (const e of store.expenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + e.amount;
    }
    return {
      totals,
      by_category: Object.entries(byCategory).map(([category, total]) => ({ category, total })),
      recent_expenses: store.expenses.slice(0, 20),
      open_tasks: store.tasks.filter((t) => t.status === "open"),
      activity: store.activity.slice(0, 20),
    };
  },

  async getExpenses(limit = 20) {
    await sleep(100);
    return store.expenses.slice(0, limit);
  },

  async getTasks(status = "open") {
    await sleep(100);
    return store.tasks.filter((t) => t.status === status);
  },

  async patchTask(id, status) {
    await sleep(200);
    const task = store.tasks.find((t) => t.id === id);
    if (!task) throw new Error("Task not found");
    task.status = status;
    return task;
  },

  async deleteExpense(id) {
    await sleep(200);
    store.expenses = store.expenses.filter((e) => e.id !== id);
  },

  async deleteTask(id) {
    await sleep(200);
    store.tasks = store.tasks.filter((t) => t.id !== id);
  },

  async resetDemo() {
    await sleep(300);
    resetStore();
  },

  async health() {
    await sleep(100);
    return { status: "ok", llm: "rules_fallback", email: "mock", db: "in-memory" };
  },
};

// ─── Active Client (runtime toggled) ──────────────────────────────────────────
let _useMock = import.meta.env.VITE_USE_MOCK === "true";

export function isUsingMock() { return _useMock; }
export function setMockMode(val: boolean) { _useMock = val; }
export function getClient(): APIClient { return _useMock ? mockClient : realClient; }
