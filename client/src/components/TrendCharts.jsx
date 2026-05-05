import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import GlassCard from "./GlassCard";

export function FocusTrendChart({ data }) {
  return (
    <GlassCard>
      <h3 className="font-display text-2xl text-amber-100">Spice Harvest Trend</h3>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="spiceFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="_id" stroke="#ffffff80" />
            <YAxis stroke="#ffffff80" />
            <Tooltip />
            <Area type="monotone" dataKey="totalSpice" stroke="#f6c453" fill="url(#spiceFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}

export function StormTrendChart({ data }) {
  return (
    <GlassCard>
      <h3 className="font-display text-2xl text-orange-100">Storm Pressure Trend</h3>
      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="_id" stroke="#ffffff80" />
            <YAxis stroke="#ffffff80" />
            <Tooltip />
            <Line type="monotone" dataKey="totalMinutes" stroke="#f97316" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
}
