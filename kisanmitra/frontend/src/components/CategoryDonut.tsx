import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { CategoryTotal } from "../types/contract";

const COLORS = ["#7C5CFF", "#22D3EE", "#34D399", "#FBBF24", "#F87171", "#A78BFA", "#6EE7B7", "#FCD34D"];

interface CategoryDonutProps {
  data: CategoryTotal[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    return (
      <div className="donut-tooltip">
        <span className="donut-tooltip-label">{payload[0].name}</span>
        <span className="donut-tooltip-value">₹{payload[0].value.toLocaleString("en-IN")}</span>
      </div>
    );
  }
  return null;
};

export function CategoryDonut({ data }: CategoryDonutProps) {
  if (!data.length) {
    return (
      <div className="chart-empty">
        <p>No expenses yet</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  return (
    <div className="category-donut">
      <div className="donut-total-label">Total · ₹{total.toLocaleString("en-IN")}</div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="total"
            nameKey="category"
            animationBegin={0}
            animationDuration={600}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconSize={8}
            iconType="circle"
            formatter={(value) => <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
