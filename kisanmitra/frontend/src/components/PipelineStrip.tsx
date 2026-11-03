import React from "react";
import { Mic, Brain, Zap, Volume2 } from "lucide-react";
import type { PipelineStep } from "../types/contract";

const ICONS = {
  voice_in: Mic,
  understood: Brain,
  action_done: Zap,
  voice_out: Volume2,
};

interface PipelineStripProps {
  steps: PipelineStep[];
}

export function PipelineStrip({ steps }: PipelineStripProps) {
  return (
    <div className="pipeline-strip" role="group" aria-label="Processing pipeline">
      {steps.map((step, i) => {
        const Icon = ICONS[step.key];
        return (
          <React.Fragment key={step.key}>
            <div
              className={`pipeline-step
                ${step.active ? "step-active" : ""}
                ${step.done ? "step-done" : ""}
                ${!step.active && !step.done ? "step-idle" : ""}
              `}
              aria-label={`${step.label}${step.done ? " — done" : step.active ? " — in progress" : ""}`}
            >
              <div className="step-icon-wrap">
                {step.active && <div className="step-pulse" aria-hidden="true" />}
                <Icon size={14} className="step-icon" aria-hidden="true" />
              </div>
              <span className="step-label">{step.label}</span>
              {step.done && step.ms !== undefined && (
                <span className="step-ms">{step.ms}ms</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`pipeline-connector ${steps[i + 1].done || steps[i + 1].active ? "connector-lit" : ""}`} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
