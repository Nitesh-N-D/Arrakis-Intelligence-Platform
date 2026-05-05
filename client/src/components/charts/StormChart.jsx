import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import ChartShell from "./ChartShell";

const tooltipStyle = {
  backgroundColor: "rgba(17,17,17,0.95)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "14px",
  color: "#fff"
};

export default function StormChart({ data = [] }) {
  return (
    <ChartShell
      eyebrow="Storm Engine"
      title="Storm Pressure Trend"
      description="Daily distraction load reveals how much pressure your system is absorbing."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="_id" tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line
            type="monotone"
            dataKey="totalMinutes"
            stroke="#f97316"
            strokeWidth={3}
            dot={{ r: 3.5, fill: "#f97316", stroke: "#fdba74", strokeWidth: 1.5 }}
            activeDot={{ r: 6, fill: "#fff7ed", stroke: "#f97316", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
