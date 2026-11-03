import { useState, useRef, useCallback, useEffect } from "react";
import type { Language } from "../types/contract";

export interface SpeechSynthesisHook {
  speaking: boolean;
  currentWordIndex: number;
  speak: (text: string, lang: Language) => void;
  cancel: () => void;
  muted: boolean;
  setMuted: (v: boolean) => void;
}

function pickVoice(lang: Language): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  // Try exact match first, then language prefix
  return (
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith(lang.split("-")[0])) ??
    null
  );
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [speaking, setSpeaking] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [muted, setMuted] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesLoadedRef = useRef(false);

  // Voices load asynchronously in Chrome
  useEffect(() => {
    const loadVoices = () => { voicesLoadedRef.current = true; };
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    window.speechSynthesis.getVoices(); // trigger load
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setCurrentWordIndex(-1);
    utteranceRef.current = null;
  }, []);

  const speak = useCallback(
    (text: string, lang: Language) => {
      if (muted || !text.trim()) return;
      cancel();

      // Small delay so cancel() flushes
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voice = pickVoice(lang);
        if (voice) utterance.voice = voice;

        utterance.onstart = () => setSpeaking(true);
        utterance.onend = () => {
          setSpeaking(false);
          setCurrentWordIndex(-1);
        };
        utterance.onerror = () => {
          setSpeaking(false);
          setCurrentWordIndex(-1);
        };
        utterance.onboundary = (event) => {
          if (event.name === "word") {
            // Count word index from char position
            const wordsUpTo = text.substring(0, event.charIndex).split(/\s+/).length - 1;
            setCurrentWordIndex(wordsUpTo);
          }
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }, 80);
    },
    [muted, cancel]
  );

  // Cleanup on unmount
  useEffect(() => () => cancel(), [cancel]);

  return { speaking, currentWordIndex, speak, cancel, muted, setMuted };
}
