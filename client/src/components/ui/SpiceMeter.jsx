import { motion } from "framer-motion";

const getReserveProgress = (totalSpice) => {
  if (totalSpice <= 0) return 0;
  const cycle = totalSpice % 100;
  return cycle === 0 ? 100 : cycle;
};

export default function SpiceMeter({ totalSpice = 0 }) {
  const progress = getReserveProgress(totalSpice);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.34em] text-white/45">Spice reserve</div>
          <div className="mt-2 text-3xl font-semibold text-white">{totalSpice}</div>
        </div>
        <div className="text-right text-xs text-white/50">
          <div>Cycle charge</div>
          <div>{progress}%</div>
        </div>
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 shadow-glow"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", stiffness: 110, damping: 20 }}
        />
      </div>
      <div className="mt-2 text-sm text-white/55">
        Focus harvest converts completed sessions into persistent behavioral capital.
      </div>
    </div>
  );
}
