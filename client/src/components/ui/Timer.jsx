import { useState } from "react";
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

export default function Timer({ timer, presets = [25, 50], missions = [] }) {
  const [missionId, setMissionId] = useState("");
  const openMissions = missions.filter((mission) => mission.status === "todo");
  const startPreset = (minutes) => timer.start(minutes, { missionId: missionId || undefined });
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
            Start a session using your presets, pause when needed, and spice is banked when the server confirms completion. Change presets in Settings.
          </p>
          {openMissions.length ? (
            <label className="mt-5 grid gap-1 text-sm text-white/70">
              <span>Focus on a mission (optional)</span>
              <select
                className="focus-ring rounded-button border border-border-subtle bg-black/30 px-3 py-2 text-white"
                disabled={!timer.canStart}
                value={missionId}
                onChange={(event) => setMissionId(event.target.value)}
              >
                <option value="">No specific mission</option>
                {openMissions.map((mission) => (
                  <option key={mission.id} value={mission.id}>{mission.priority ? "★ " : ""}{mission.title}</option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            {presets.map((minutes, index) => (
              <Button key={minutes} variant={index === 0 ? "primary" : "secondary"} disabled={!timer.canStart} onClick={() => startPreset(minutes)}>
                Focus {minutes}
              </Button>
            ))}
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
