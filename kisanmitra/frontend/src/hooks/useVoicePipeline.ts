import { useState, useRef, useCallback, useEffect } from "react";
import type {
  Language,
  PipelineState,
  PipelineStep,
  ProcessResponse,
  Action,
} from "../types/contract";
import { getClient } from "../lib/api";
import { useSpeechRecognition } from "./useSpeechRecognition";
import { useSpeechSynthesis } from "./useSpeechSynthesis";
import { useMicLevel } from "./useMicLevel";

export interface VoicePipelineHook {
  state: PipelineState;
  lang: Language;
  setLang: (l: Language) => void;
  transcript: string;
  interimTranscript: string;
  isTyped: boolean;
  steps: PipelineStep[];
  actions: Action[];
  replyText: string;
  currentWordIndex: number;
  micLevel: number;
  error: string | null;
  permissionDenied: boolean;
  speechSupported: boolean;
  muted: boolean;
  setMuted: (v: boolean) => void;
  // Actions
  startListening: () => void;
  stopListening: () => void;
  submitText: (text: string) => void;
  cancelAll: () => void;
  undoAction: (action: Action) => Promise<void>;
}

const INITIAL_STEPS: PipelineStep[] = [
  { key: "voice_in", label: "Voice in", active: false, done: false },
  { key: "understood", label: "Understood", active: false, done: false },
  { key: "action_done", label: "Action done", active: false, done: false },
  { key: "voice_out", label: "Voice out", active: false, done: false },
];

function resetSteps(): PipelineStep[] {
  return INITIAL_STEPS.map((s) => ({ ...s }));
}

export function useVoicePipeline(): VoicePipelineHook {
  const [lang, setLang] = useState<Language>("en-IN");
  const [state, setState] = useState<PipelineState>("idle");
  const [transcript, setTranscript] = useState("");
  const [isTyped, setIsTyped] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>(resetSteps());
  const [actions, setActions] = useState<Action[]>([]);
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognition = useSpeechRecognition(lang);
  const synthesis = useSpeechSynthesis();
  const micLevel = useMicLevel();

  const isBusyRef = useRef(false);
  const listeningRef = useRef(false);

  // Update a specific pipeline step
  const setStep = useCallback((key: PipelineStep["key"], patch: Partial<PipelineStep>) => {
    setSteps((prev) =>
      prev.map((s) => (s.key === key ? { ...s, ...patch } : s))
    );
  }, []);

  // Submit transcript to API and run the full pipeline
  const runPipeline = useCallback(
    async (text: string, typed: boolean) => {
      if (isBusyRef.current) return;
      isBusyRef.current = true;

      const trimmed = text.trim();
      if (!trimmed) {
        setError("I didn't catch that. Try speaking again.");
        setState("error");
        isBusyRef.current = false;
        return;
      }

      setTranscript(trimmed);
      setIsTyped(typed);
      setError(null);
      setActions([]);
      setReplyText("");
      setSteps(resetSteps());

      // Step 1: Voice in — done
      setStep("voice_in", { active: true, done: false });
      setState("thinking");

      await new Promise((r) => setTimeout(r, 100));
      setStep("voice_in", { active: false, done: true });
      setStep("understood", { active: true });

      try {
        const now = new Date();
        const response: ProcessResponse = await getClient().processVoice({
          transcript: trimmed,
          lang,
          client_time: now.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        // Step 2: Understood
        if (response.timings_ms) {
          setStep("understood", { active: false, done: true, ms: response.timings_ms.understand });
        } else {
          setStep("understood", { active: false, done: true });
        }

        setState("acting");
        setStep("action_done", { active: true });
        setActions(response.actions);

        await new Promise((r) => setTimeout(r, 300));
        if (response.timings_ms) {
          setStep("action_done", { active: false, done: true, ms: response.timings_ms.act });
        } else {
          setStep("action_done", { active: false, done: true });
        }

        // Step 3+4: Speak reply
        setReplyText(response.reply_text);
        setState("speaking");
        setStep("voice_out", { active: true });

        synthesis.speak(response.reply_text, lang);

        // Wait for speech to finish (poll)
        await new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (!window.speechSynthesis.speaking) {
              clearInterval(check);
              resolve();
            }
          }, 200);
          setTimeout(() => { clearInterval(check); resolve(); }, 15000);
        });

        setStep("voice_out", { active: false, done: true });
        setState("idle");
      } catch (err: any) {
        const code = (err as any).code;
        let msg = err?.message ?? "Something went wrong.";

        if (code === "EMPTY_TRANSCRIPT") {
          msg = "I didn't catch that. Please try again.";
        } else if (code === "NOT_UNDERSTOOD") {
          msg = err.message;
          synthesis.speak(msg, lang);
        }

        setError(msg);
        setState("error");
        setStep("understood", { active: false });
        setStep("action_done", { active: false });
      } finally {
        isBusyRef.current = false;
      }
    },
    [lang, synthesis, setStep]
  );

  // Watch for final speech recognition result
  useEffect(() => {
    if (recognition.finalTranscript && listeningRef.current) {
      recognition.stop();
      listeningRef.current = false;
      micLevel.stop();
      runPipeline(recognition.finalTranscript, false);
    }
  }, [recognition.finalTranscript]); // eslint-disable-line

  // Watch for recognition errors
  useEffect(() => {
    if (recognition.state === "error" && recognition.error) {
      setError(recognition.error);
      setState("error");
      listeningRef.current = false;
      micLevel.stop();
    }
  }, [recognition.state, recognition.error]); // eslint-disable-line

  // Cancel speech if user starts talking
  useEffect(() => {
    if (recognition.state === "listening" && synthesis.speaking) {
      synthesis.cancel();
    }
  }, [recognition.state]); // eslint-disable-line

  const startListening = useCallback(() => {
    if (isBusyRef.current && state !== "idle" && state !== "error") return;
    isBusyRef.current = false;
    setError(null);
    setState("listening");
    setTranscript("");
    setIsTyped(false);
    setActions([]);
    setReplyText("");
    setSteps(resetSteps());
    synthesis.cancel();
    recognition.reset();
    recognition.start();
    micLevel.start();
    listeningRef.current = true;
  }, [state, recognition, synthesis, micLevel]);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    recognition.stop();
    micLevel.stop();
    const captured = (recognition.finalTranscript + " " + recognition.interimTranscript).trim();
    if (captured) {
      runPipeline(captured, false);
    } else {
      setState("idle");
    }
  }, [recognition, micLevel, runPipeline]);

  const submitText = useCallback(
    (text: string) => {
      if (isBusyRef.current) return;
      recognition.stop();
      micLevel.stop();
      listeningRef.current = false;
      runPipeline(text, true);
    },
    [recognition, micLevel, runPipeline]
  );

  const cancelAll = useCallback(() => {
    isBusyRef.current = false;
    listeningRef.current = false;
    recognition.stop();
    synthesis.cancel();
    micLevel.stop();
    setState("idle");
    setError(null);
    setSteps(resetSteps());
  }, [recognition, synthesis, micLevel]);

  const undoAction = useCallback(async (action: Action) => {
    const client = getClient();
    const data = action.data as any;
    if (action.type === "expense_logged" && data?.id) {
      await client.deleteExpense(data.id);
    } else if ((action.type === "task_created" || action.type === "reminder_set") && data?.id) {
      await client.deleteTask(data.id);
    }
    setActions((prev) => prev.filter((a) => a.id !== action.id));
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    let spaceHeld = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Escape") { cancelAll(); return; }
      if (e.code === "Space" && !spaceHeld && e.target === document.body) {
        e.preventDefault();
        spaceHeld = true;
        startListening();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && spaceHeld) {
        e.preventDefault();
        spaceHeld = false;
        if (listeningRef.current) stopListening();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [cancelAll, startListening, stopListening]);

  return {
    state,
    lang,
    setLang,
    transcript,
    interimTranscript: recognition.interimTranscript,
    isTyped,
    steps,
    actions,
    replyText,
    currentWordIndex: synthesis.currentWordIndex,
    micLevel: micLevel.level,
    error,
    permissionDenied: recognition.permissionDenied,
    speechSupported: recognition.supported,
    muted: synthesis.muted,
    setMuted: synthesis.setMuted,
    startListening,
    stopListening,
    submitText,
    cancelAll,
    undoAction,
  };
}
