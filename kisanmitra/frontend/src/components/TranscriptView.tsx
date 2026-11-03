import React, { useEffect, useRef } from "react";
import { Keyboard } from "lucide-react";

interface TranscriptViewProps {
  finalTranscript: string;
  interimTranscript: string;
  isTyped: boolean;
  placeholder?: string;
}

export function TranscriptView({
  finalTranscript,
  interimTranscript,
  isTyped,
  placeholder = "Start speaking or type below…",
}: TranscriptViewProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [finalTranscript, interimTranscript]);

  const hasContent = finalTranscript || interimTranscript;

  return (
    <div
      className="transcript-view"
      ref={ref}
      aria-live="polite"
      aria-label="Live transcript"
      role="log"
    >
      {!hasContent && (
        <span className="transcript-placeholder">{placeholder}</span>
      )}
      {finalTranscript && (
        <span className="transcript-final">
          {finalTranscript}
          {isTyped && (
            <span className="typed-tag">
              <Keyboard size={10} />
              typed
            </span>
          )}
        </span>
      )}
      {interimTranscript && (
        <span className="transcript-interim"> {interimTranscript}</span>
      )}
    </div>
  );
}
