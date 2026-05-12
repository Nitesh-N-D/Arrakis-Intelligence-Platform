import { AnimatePresence, motion } from "framer-motion";

const stormDescriptions = {
  DUST: "Light turbulence detected. Contain the first distraction before it compounds.",
  SANDSTORM: "Behavioral pressure is rising. Reclaim control before the discipline loop breaks.",
  "SPICE STORM": "Critical distraction zone. Your focus economy is under direct threat."
};

const stormOpacity = {
  DUST: "from-orange-500/18",
  SANDSTORM: "from-orange-500/24",
  "SPICE STORM": "from-red-500/30"
};

export default function StormOverlay({ level = "CALM" }) {
  const active = level && level !== "CALM";

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key={level}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-40 flex items-start justify-center px-6 pt-8"
        >
          <motion.div
            animate={{ scale: [0.98, 1.02, 0.98] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            className={`absolute inset-0 bg-gradient-to-b ${stormOpacity[level] || "from-orange-500/18"} via-transparent to-transparent`}
          />
          <motion.div
            initial={{ y: -12 }}
            animate={{ y: 0 }}
            className="glass-panel max-w-xl border-orange-300/25 bg-orange-500/10 px-5 py-4 shadow-glow"
          >
            <div className="text-xs uppercase tracking-[0.35em] text-orange-100/70">Storm Mode</div>
            <div className="mt-2 text-lg font-semibold text-orange-50">{level}</div>
            <div className="mt-1 text-sm text-orange-100/72">{stormDescriptions[level]}</div>
            <div className="mt-2 text-xs uppercase tracking-[0.28em] text-orange-100/60">
              Alarm engaged until pressure returns to calm
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
