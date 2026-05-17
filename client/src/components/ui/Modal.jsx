import { AnimatePresence, motion } from "framer-motion";

export default function Modal({ open, title, description, children, onClose }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          aria-modal="true"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          onClick={onClose}
        >
          <motion.div
            className="glass-panel w-full max-w-lg p-6"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="text-xs uppercase tracking-[0.3em] text-white/45">Confirmation</div>
            <h2 className="mt-3 font-display text-3xl text-white">{title}</h2>
            {description ? <p className="mt-3 text-sm leading-6 text-white/62">{description}</p> : null}
            <div className="mt-6">{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
