import React from "react";
import { Volume2 } from "lucide-react";

interface ReplyBubbleProps {
  text: string;
  speaking: boolean;
  currentWordIndex: number;
}

export function ReplyBubble({ text, speaking, currentWordIndex }: ReplyBubbleProps) {
  if (!text) return null;

  const words = text.split(/\s+/);

  return (
    <div
      className={`reply-bubble ${speaking ? "bubble-speaking" : "bubble-done"}`}
      aria-live="polite"
      aria-label={`Reply: ${text}`}
    >
      <div className="reply-icon-wrap">
        <Volume2 size={14} className={speaking ? "reply-icon-active" : ""} aria-hidden="true" />
      </div>
      <p className="reply-text">
        {words.map((word, i) => (
          <span
            key={i}
            className={`reply-word ${i === currentWordIndex && speaking ? "word-highlight" : ""} ${i < currentWordIndex && speaking ? "word-spoken" : ""}`}
          >
            {word}{" "}
          </span>
        ))}
      </p>
    </div>
  );
}
