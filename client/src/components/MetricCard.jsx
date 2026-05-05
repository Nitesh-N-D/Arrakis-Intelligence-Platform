import { motion } from "framer-motion";
import GlassCard from "./GlassCard";

export default function MetricCard({ label, value, accent, detail }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="min-h-[140px]">
        <p className="text-sm uppercase tracking-[0.25em] text-white/50">{label}</p>
        <p className={`mt-4 font-display text-4xl ${accent}`}>{value}</p>
        <p className="mt-3 text-sm text-white/60">{detail}</p>
      </GlassCard>
    </motion.div>
  );
}
