import React from "react";
import { Sparkles } from "lucide-react";

const CHIPS = [
  "Spent 250 rupees on lunch and remind me to submit the form on Friday",
  "Add 120 for auto rickshaw and 80 for chai",
  "How much have I spent this week?",
  "Remind me to call mom tomorrow at 6 PM",
  "Email me today's summary",
  "Aaj canteen mein 90 rupaye kharch hue",
];

interface TryChipsProps {
  onSelect: (text: string) => void;
  disabled?: boolean;
}

export function TryChips({ onSelect, disabled }: TryChipsProps) {
  return (
    <div className="try-chips-wrap">
      <div className="try-chips-label">
        <Sparkles size={12} aria-hidden="true" />
        Try saying
      </div>
      <div className="try-chips">
        {CHIPS.map((chip) => (
          <button
            key={chip}
            className="try-chip"
            onClick={() => onSelect(chip)}
            disabled={disabled}
            aria-label={`Try: ${chip}`}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
