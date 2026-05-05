import { useEffect, useRef, useState } from "react";

const SESSION_TYPES = {
  25: "pomodoro-25",
  50: "deep-50"
};

export function useFocusTimer({ onComplete }) {
  const [mode, setMode] = useState("idle");
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [harvesting, setHarvesting] = useState(false);
  const endTimeRef = useRef(null);
  const completionRef = useRef(false);

  useEffect(() => {
    if (mode !== "running") return undefined;

    const interval = setInterval(() => {
      const nextRemaining = Math.max(0, endTimeRef.current - Date.now());
      setRemainingMs(nextRemaining);

      if (nextRemaining === 0 && !completionRef.current) {
        completionRef.current = true;
        clearInterval(interval);
        setMode("completed");
        setHarvesting(true);
        setMessage("Harvest complete. Banking spice...");
        Promise.resolve(
          onComplete({
            duration: durationMinutes,
            type: SESSION_TYPES[durationMinutes] || "custom"
          })
        )
          .then(() => {
            setMessage(`Harvest complete. +${durationMinutes >= 50 ? 25 : 10} spice secured.`);
            setError("");
          })
          .catch((completionError) => {
            setError(completionError?.message || "Unable to store completed focus session.");
            setMessage("");
          })
          .finally(() => {
            setHarvesting(false);
          });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [mode, durationMinutes, onComplete]);

  const start = (minutes) => {
    if (harvesting) return;
    const durationMs = minutes * 60 * 1000;
    completionRef.current = false;
    endTimeRef.current = Date.now() + durationMs;
    setDurationMinutes(minutes);
    setRemainingMs(durationMs);
    setMode("running");
    setMessage("");
    setError("");
  };

  const pause = () => {
    if (mode !== "running") return;
    setRemainingMs(Math.max(0, endTimeRef.current - Date.now()));
    setMode("paused");
  };

  const resume = () => {
    if (mode !== "paused") return;
    endTimeRef.current = Date.now() + remainingMs;
    setMode("running");
  };

  const reset = () => {
    completionRef.current = false;
    endTimeRef.current = null;
    setMode("idle");
    setDurationMinutes(0);
    setRemainingMs(0);
    setMessage("");
    setError("");
    setHarvesting(false);
  };

  const progress =
    durationMinutes > 0
      ? Math.max(0, Math.min(100, ((durationMinutes * 60 * 1000 - remainingMs) / (durationMinutes * 60 * 1000)) * 100))
      : 0;

  return {
    mode,
    durationMinutes,
    remainingMs,
    progress,
    message,
    error,
    harvesting,
    canStart: (mode === "idle" || mode === "completed") && !harvesting,
    start,
    pause,
    resume,
    reset
  };
}
