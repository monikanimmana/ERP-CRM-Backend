import React, { useEffect, useRef } from "react";
import type { PipelineState } from "../types/contract";

interface OrbProps {
  state: PipelineState;
  micLevel: number; // 0–1
  onClick: () => void;
}

const THINKING_MESSAGES = ["Understanding…", "Picking actions…", "Processing…", "Almost there…"];

export function Orb({ state, micLevel, onClick }: OrbProps) {
  const msgRef = useRef(0);
  const [msgIndex, setMsgIndex] = React.useState(0);

  useEffect(() => {
    if (state !== "thinking") return;
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % THINKING_MESSAGES.length);
    }, 900);
    return () => clearInterval(interval);
  }, [state]);

  const isListening = state === "listening";
  const isThinking = state === "thinking";
  const isActing = state === "acting";
  const isSpeaking = state === "speaking";
  const isError = state === "error";
  const isIdle = state === "idle";

  // Scale rings based on mic level when listening
  const ringScale = 1 + micLevel * 0.5;
  const ringOpacity = 0.3 + micLevel * 0.7;

  return (
    <div className="orb-container" role="button" tabIndex={0} onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={
        isIdle ? "Tap to start listening" :
        isListening ? "Listening — tap to stop" :
        isThinking ? "Processing…" :
        isSpeaking ? "Speaking" :
        isError ? "Error — tap to retry" :
        "Processing"
      }
    >
      {/* Outer ambient rings */}
      <div className={`orb-ring orb-ring-1 ${isListening ? "ring-active" : ""} ${isError ? "ring-error" : ""}`}
        style={isListening ? { transform: `scale(${ringScale})`, opacity: ringOpacity } : {}}
      />
      <div className={`orb-ring orb-ring-2 ${isListening ? "ring-active" : ""} ${isError ? "ring-error" : ""}`}
        style={isListening ? { transform: `scale(${ringScale * 1.1})`, opacity: ringOpacity * 0.6 } : {}}
      />
      {isSpeaking && <div className="orb-ring orb-ring-3 ring-speaking" />}
      {isSpeaking && <div className="orb-ring orb-ring-4 ring-speaking ring-speaking-delay" />}

      {/* Main orb */}
      <div className={`orb-core
        ${isIdle ? "orb-idle" : ""}
        ${isListening ? "orb-listening" : ""}
        ${isThinking ? "orb-thinking" : ""}
        ${isActing ? "orb-acting" : ""}
        ${isSpeaking ? "orb-speaking" : ""}
        ${isError ? "orb-error" : ""}
      `}>
        {/* State-specific inner content */}
        {isIdle && (
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="currentColor" opacity="0.9"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        )}

        {isListening && (
          <div className="sound-bars" aria-hidden="true">
            {[0.4, 0.7, 1, 0.7, 0.4, 0.6, 0.9, 0.6].map((base, i) => (
              <div
                key={i}
                className="sound-bar"
                style={{
                  height: `${(base * 0.4 + micLevel * 0.6) * 28 + 4}px`,
                  animationDelay: `${i * 80}ms`,
                }}
              />
            ))}
          </div>
        )}

        {isThinking && (
          <div className="thinking-dots" aria-hidden="true">
            <div className="dot" style={{ animationDelay: "0ms" }} />
            <div className="dot" style={{ animationDelay: "200ms" }} />
            <div className="dot" style={{ animationDelay: "400ms" }} />
          </div>
        )}

        {isActing && (
          <div className="acting-check" aria-hidden="true">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <path d="M4 12l5 5L20 7" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                className="check-draw" />
            </svg>
          </div>
        )}

        {isSpeaking && (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" opacity="0.9"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="speaker-wave1"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="speaker-wave2"/>
          </svg>
        )}

        {isError && (
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" stroke="#F87171" strokeWidth="1.5"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="#F87171" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1" fill="#F87171"/>
          </svg>
        )}
      </div>

      {/* Thinking label */}
      {isThinking && (
        <div className="orb-label" aria-live="polite">
          {THINKING_MESSAGES[msgIndex]}
        </div>
      )}
    </div>
  );
}
