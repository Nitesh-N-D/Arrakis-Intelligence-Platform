import { motion } from "framer-motion";
import { cx } from "../../utils/cx";

const variants = {
  primary:
    "bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 text-black shadow-glow hover:brightness-105",
  secondary:
    "border border-border-subtle bg-white/5 text-white hover:border-orange-300/30 hover:bg-white/8",
  ghost: "border border-transparent bg-transparent text-white/72 hover:bg-white/5 hover:text-white"
};

export default function Button({
  children,
  className,
  variant = "primary",
  type = "button",
  disabled = false,
  ...props
}) {
  return (
    <motion.button
      type={type}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={cx(
        "focus-ring inline-flex items-center justify-center gap-2 rounded-button px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
