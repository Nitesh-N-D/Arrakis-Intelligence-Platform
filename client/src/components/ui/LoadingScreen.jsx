import { motion } from "framer-motion";

export default function LoadingScreen({ label = "Loading Arrakis systems...", compact = false }) {
  return (
    <div
      className={`flex items-center justify-center ${
        compact ? "min-h-[14rem]" : "min-h-screen px-6"
      }`}
    >
      <div className="glass-panel flex flex-col items-center gap-4 px-8 py-8 text-center">
        <motion.div
          className="h-14 w-14 rounded-full border-4 border-white/10 border-t-orange-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
        <div>
          <div className="text-xs uppercase tracking-[0.34em] text-white/45">Prescience Engine</div>
          <div className="mt-2 text-lg font-semibold text-white">{label}</div>
        </div>
      </div>
    </div>
  );
}
