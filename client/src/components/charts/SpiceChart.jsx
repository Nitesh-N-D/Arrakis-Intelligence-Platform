import {
  Area,
  AreaChart,
  CartesianGrid,
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

export default function SpiceChart({ data = [] }) {
  return (
    <ChartShell
      eyebrow="Analytics Engine"
      title="Spice Harvest Trend"
      description="Daily focus output converted into compounding behavioral capital."
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="spiceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="_id" tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.62)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="totalSpice"
            stroke="#fbbf24"
            strokeWidth={3}
            fill="url(#spiceFill)"
            activeDot={{ r: 5, stroke: "#f97316", strokeWidth: 2, fill: "#fef3c7" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
