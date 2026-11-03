import React from "react";
import { Wifi, WifiOff } from "lucide-react";

interface StatusPillProps {
  mockMode: boolean;
  connected?: boolean;
}

export function StatusPill({ mockMode, connected }: StatusPillProps) {
  if (mockMode) {
    return (
      <div className="status-pill status-demo" role="status" aria-label="Demo mode active">
        <span className="status-dot status-dot-demo" aria-hidden="true" />
        Demo mode: simulated
      </div>
    );
  }

  if (connected === false) {
    return (
      <div className="status-pill status-error" role="status" aria-label="Backend not connected">
        <WifiOff size={11} aria-hidden="true" />
        Backend offline
      </div>
    );
  }

  return (
    <div className="status-pill status-connected" role="status" aria-label="Backend connected">
      <Wifi size={11} aria-hidden="true" />
      Backend connected
    </div>
  );
}
