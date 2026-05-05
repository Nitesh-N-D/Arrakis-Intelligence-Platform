import { motion } from "framer-motion";
import GlassCard from "./GlassCard";

export default function MetricCard({ label, value, detail, accent = "text-amber-200" }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="min-h-[140px]">
        <div className="text-sm uppercase tracking-[0.28em] text-white/45">{label}</div>
        <div className={`mt-4 font-display text-4xl ${accent}`}>{value}</div>
        <div className="mt-3 text-sm text-white/60">{detail}</div>
      </GlassCard>
    </motion.div>
  );
}
