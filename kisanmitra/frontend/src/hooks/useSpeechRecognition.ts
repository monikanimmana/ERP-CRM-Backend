import { useState, useRef, useCallback, useEffect } from "react";
import type { Language } from "../types/contract";

export type RecognitionState = "idle" | "listening" | "error";

export interface SpeechRecognitionHook {
  state: RecognitionState;
  interimTranscript: string;
  finalTranscript: string;
  error: string | null;
  supported: boolean;
  permissionDenied: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

// Browser compatibility shim
const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

export function useSpeechRecognition(lang: Language): SpeechRecognitionHook {
  const [state, setState] = useState<RecognitionState>("idle");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const recognitionRef = useRef<any>(null);
  const shouldRestartRef = useRef(false);
  const supported = !!SR;

  const stop = useCallback(() => {
    shouldRestartRef.current = false;
    recognitionRef.current?.stop();
    setState("idle");
  }, []);

  const start = useCallback(() => {
    if (!SR) return;
    setError(null);
    setInterimTranscript("");
    setFinalTranscript("");

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SR();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState("listening");
    };

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) setInterimTranscript(interim);
      if (final) {
        setFinalTranscript((prev) => prev + " " + final);
        setInterimTranscript("");
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        setPermissionDenied(true);
        setError("Microphone access was denied. Please allow mic access in your browser settings.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Try speaking louder or closer to the mic.");
      } else if (event.error === "network") {
        setError("Network error during speech recognition.");
      } else {
        setError(`Recognition error: ${event.error}`);
      }
      setState("error");
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        // Auto-restart for continuous listening
        recognition.start();
      } else {
        setState("idle");
      }
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;

    try {
      recognition.start();
    } catch (e) {
      setError("Failed to start speech recognition.");
      setState("error");
    }
  }, [lang]);

  const reset = useCallback(() => {
    stop();
    setInterimTranscript("");
    setFinalTranscript("");
    setError(null);
    setPermissionDenied(false);
  }, [stop]);

  // Restart when language changes while listening
  useEffect(() => {
    if (state === "listening") {
      stop();
      start();
    }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      recognitionRef.current?.abort();
    };
  }, []);

  return {
    state,
    interimTranscript,
    finalTranscript,
    error,
    supported,
    permissionDenied,
    start,
    stop,
    reset,
  };
}
