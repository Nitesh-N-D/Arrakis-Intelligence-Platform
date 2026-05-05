import { AnimatePresence, motion } from "framer-motion";
import GlassCard from "./GlassCard";

const formatTime = (remainingMs) => {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.max(0, totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
};

export default function FocusTimerPanel({ timer }) {
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timer.progress / 100) * circumference;

  return (
    <GlassCard>
      <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.32em] text-white/45">Spice System</div>
          <div className="mt-3 font-display text-3xl text-amber-100">Focus harvest timer</div>
          <div className="mt-3 max-w-md text-sm text-white/62">
            Launch a real 25 or 50 minute session, pause if needed, and auto-bank spice when the harvest completes.
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-3 font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!timer.canStart}
              onClick={() => timer.start(25)}
            >
              Harvest 25
            </button>
            <button
              className="rounded-2xl border border-amber-300/20 bg-amber-200/10 px-5 py-3 font-semibold text-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={!timer.canStart}
              onClick={() => timer.start(50)}
            >
              Harvest 50
            </button>
            <button
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={timer.mode !== "running"}
              onClick={timer.pause}
            >
              Pause
            </button>
            <button
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white/80 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={timer.mode !== "paused"}
              onClick={timer.resume}
            >
              Resume
            </button>
            <button
              className="rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-semibold text-white/80"
              onClick={timer.reset}
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mx-auto flex flex-col items-center">
          <div className="relative h-52 w-52">
            <svg className="h-52 w-52 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="14" fill="none" />
              <circle
                cx="100"
                cy="100"
                r={radius}
                stroke="url(#timerGradient)"
                strokeWidth="14"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f6c453" />
                  <stop offset="100%" stopColor="#f97316" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xs uppercase tracking-[0.34em] text-white/45">{timer.mode}</div>
              <div className="mt-3 font-display text-5xl text-amber-50">
                {formatTime(timer.remainingMs)}
              </div>
              <div className="mt-2 text-sm text-white/55">
                {timer.durationMinutes ? `${timer.durationMinutes} minute session` : "Choose a harvest"}
              </div>
            </div>
          </div>
          <AnimatePresence mode="wait">
            {timer.message ? (
              <motion.div
                key={timer.message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm text-amber-100"
              >
                {timer.message}
              </motion.div>
            ) : null}
          </AnimatePresence>
          {timer.error ? (
            <div className="mt-4 rounded-2xl border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {timer.error}
            </div>
          ) : null}
          {timer.harvesting ? <div className="mt-3 text-sm text-white/55">Persisting completed session...</div> : null}
        </div>
      </div>
    </GlassCard>
  );
}
