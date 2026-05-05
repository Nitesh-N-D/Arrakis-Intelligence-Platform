import { AnimatePresence, motion } from "framer-motion";
import Button from "./Button";
import Card from "./Card";

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

export default function Timer({ timer }) {
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timer.progress / 100) * circumference;
  const isComplete = timer.mode === "completed" && !timer.error;

  return (
    <Card className="bg-gradient-to-br from-white/6 via-white/4 to-orange-500/8">
      <div className="flex flex-col gap-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-lg">
          <div className="text-xs uppercase tracking-[0.34em] text-white/45">Spice System</div>
          <h2 className="mt-3 font-display text-3xl text-white md:text-4xl">Focus harvest timer</h2>
          <p className="mt-3 text-sm leading-6 text-white/60">
            Launch a real 25 or 50 minute session, pause when needed, and auto-bank spice on completion.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled={!timer.canStart} onClick={() => timer.start(25)}>
              Harvest 25
            </Button>
            <Button variant="secondary" disabled={!timer.canStart} onClick={() => timer.start(50)}>
              Harvest 50
            </Button>
            <Button variant="ghost" disabled={timer.mode !== "running"} onClick={timer.pause}>
              Pause
            </Button>
            <Button variant="ghost" disabled={timer.mode !== "paused"} onClick={timer.resume}>
              Resume
            </Button>
            <Button variant="ghost" onClick={timer.reset}>
              Reset
            </Button>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-[280px] flex-col items-center">
          <motion.div
            className="relative h-56 w-56"
            animate={isComplete ? { scale: [1, 1.03, 1] } : { scale: 1 }}
            transition={isComplete ? { repeat: 2, duration: 0.5 } : undefined}
          >
            <svg className="h-56 w-56 -rotate-90" viewBox="0 0 220 220">
              <circle cx="110" cy="110" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="16" fill="none" />
              <circle
                cx="110"
                cy="110"
                r={radius}
                stroke="url(#timerGradient)"
                strokeWidth="16"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
              />
              <defs>
                <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#facc15" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xs uppercase tracking-[0.34em] text-white/45">{timer.mode}</div>
              <div className="mt-3 font-display text-5xl text-sand">{formatTime(timer.remainingMs)}</div>
              <div className="mt-2 text-sm text-white/55">
                {timer.durationMinutes ? `${timer.durationMinutes} minute session` : "Choose a harvest"}
              </div>
            </div>
          </motion.div>

          <div className="mt-5 w-full text-center">
            <AnimatePresence mode="wait">
              {timer.message ? (
                <motion.div
                  key={timer.message}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="rounded-card border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50"
                >
                  {timer.message}
                </motion.div>
              ) : null}
            </AnimatePresence>

            {timer.error ? (
              <div className="mt-3 rounded-card border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                {timer.error}
              </div>
            ) : null}

            {timer.harvesting ? <div className="mt-3 text-sm text-white/55">Persisting completed session...</div> : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
