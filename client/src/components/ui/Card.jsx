import { motion } from "framer-motion";
import { cx } from "../../utils/cx";

export default function Card({ children, className, interactive = true, ...props }) {
  return (
    <motion.section
      className={cx(
        "glass-panel relative overflow-hidden p-5 md:p-6",
        interactive && "transition-transform duration-300 hover:-translate-y-1 hover:shadow-glow",
        className
      )}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      {...props}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
      {children}
    </motion.section>
  );
}
