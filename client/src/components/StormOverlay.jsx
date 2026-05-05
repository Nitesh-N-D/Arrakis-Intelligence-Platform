import { AnimatePresence, motion } from "framer-motion";

export default function StormOverlay({ level }) {
  const active = level && level !== "CALM";

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 overflow-hidden bg-orange-500/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.38),transparent_45%)]"
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.55, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <div className="absolute right-8 top-8 rounded-full border border-orange-300/30 bg-black/50 px-5 py-3 text-sm uppercase tracking-[0.35em] text-orange-100">
            {level}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
