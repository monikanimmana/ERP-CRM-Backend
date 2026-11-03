import React, { useEffect, useRef, useState } from "react";
import { TrendingUp, Calendar, CalendarDays } from "lucide-react";

interface StatCardsProps {
  today: number;
  week: number;
  month: number;
}

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;
    if (from === target) return;

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return value;
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: any; color: string;
}) {
  const animated = useCountUp(value);
  return (
    <div className="stat-card">
      <div className="stat-card-icon" style={{ color }} aria-hidden="true">
        <Icon size={18} />
      </div>
      <div className="stat-card-content">
        <p className="stat-label">{label}</p>
        <p className="stat-value" aria-label={`${label}: ${value} rupees`}>
          ₹{animated.toLocaleString("en-IN")}
        </p>
      </div>
    </div>
  );
}

export function StatCards({ today, week, month }: StatCardsProps) {
  return (
    <div className="stat-cards">
      <StatCard label="Today" value={today} icon={TrendingUp} color="#34D399" />
      <StatCard label="This Week" value={week} icon={Calendar} color="#7C5CFF" />
      <StatCard label="This Month" value={month} icon={CalendarDays} color="#22D3EE" />
    </div>
  );
}
