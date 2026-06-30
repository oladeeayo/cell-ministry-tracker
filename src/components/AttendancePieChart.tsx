"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Props {
  present: number;
  absent: number;
}

const COLORS = ["#0d9488", "#f1f5f9"];

export default function AttendancePieChart({ present, absent }: Props) {
  const data = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
  ];

  if (present === 0 && absent === 0) return null;

  return (
    <div className="card">
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 text-center">Attendance Breakdown</h3>
      <p className="text-xs text-slate-400 mb-2 text-center">Present vs Absent</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" stroke="none">
            {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Legend iconType="circle" iconSize={8} formatter={(v: string) => <span className="text-xs text-slate-600">{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
