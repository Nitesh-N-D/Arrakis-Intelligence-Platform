import { motion } from "framer-motion";
import Card from "./Card";

export default function StatCard({ label, value, detail, accent, valueSuffix }) {
  return (
    <Card className="h-full">
      <div className="text-xs uppercase tracking-[0.34em] text-white/45">{label}</div>
      <motion.div
        className={`mt-4 text-3xl font-semibold text-white ${accent || ""}`}
        initial={{ opacity: 0.7, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {value}
        {valueSuffix ? <span className="ml-2 text-lg text-white/55">{valueSuffix}</span> : null}
      </motion.div>
      <div className="mt-3 text-sm leading-6 text-white/55">{detail}</div>
    </Card>
  );
}
