import { AnimatePresence, motion } from "framer-motion";
import Button from "./Button";

export default function MobileMenu({ open, onClose, sections = [], onNavigate }) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 bg-black/70 px-4 py-5 xl:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-panel mx-auto max-w-md px-5 py-5"
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.34em] text-white/45">Navigation</div>
                <div className="mt-2 font-display text-2xl text-white">Command menu</div>
              </div>
              <Button onClick={onClose} variant="ghost">
                Close
              </Button>
            </div>

            <div className="mt-5 grid gap-3">
              {sections.map((section) => (
                <button
                  key={section.href}
                  className="rounded-card border border-border-subtle bg-white/4 px-4 py-3 text-left transition hover:border-orange-300/20 hover:bg-white/8"
                  onClick={() => {
                    onNavigate?.(section.href);
                    onClose();
                  }}
                  type="button"
                >
                  <div className="text-sm font-semibold text-white">{section.label}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.28em] text-white/40">
                    {section.eyebrow}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
