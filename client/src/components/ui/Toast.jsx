import { AnimatePresence, motion } from "framer-motion";

const variants = {
  error: "border-red-300/20 bg-red-500/10 text-red-100",
  success: "border-emerald-300/20 bg-emerald-500/10 text-emerald-100",
  info: "border-amber-300/15 bg-amber-300/10 text-amber-50"
};

export default function Toast({ open, message, type = "info" }) {
  return (
    <AnimatePresence>
      {open && message ? (
        <motion.div
          className={`fixed right-4 top-4 z-[80] max-w-sm rounded-card border px-4 py-3 text-sm shadow-card ${variants[type]}`}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
