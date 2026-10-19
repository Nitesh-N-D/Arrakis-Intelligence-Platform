import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_TYPES = { 25: "pomodoro-25", 50: "deep-50" };

export function useFocusTimer({ onStart, onComplete, onPause, onResume, onReset, onRecover }) {
  const [mode, setMode] = useState("idle");
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [remainingMs, setRemainingMs] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [harvesting, setHarvesting] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const endTimeRef = useRef(null);
  const completionRef = useRef(false);

  const complete = useCallback(async (id, duration) => {
    if (completionRef.current || !id) return;
    completionRef.current = true;
    setMode("completed");
    setHarvesting(true);
    setMessage("Harvest complete. Banking spice...");
    try {
      await onComplete({ sessionId: id, duration });
      setMessage(`Harvest complete. +${duration >= 50 ? 25 : 10} spice secured.`);
      setError("");
    } catch (completionError) {
      setError(completionError?.message || "Unable to store completed focus session.");
      setMessage("");
    } finally {
      setHarvesting(false);
    }
  }, [onComplete]);

  useEffect(() => {
    let mounted = true;
    Promise.resolve(onRecover?.()).then((response) => {
      const session = response?.data?.session;
      if (!mounted || !session) return;
      const duration = Number(session.duration);
      const id = session._id || session.id;
      const remaining = session.status === "paused"
        ? Number(session.remainingMs || 0)
        : Math.max(0, new Date(session.startedAt).getTime() + duration * 60_000 - Date.now());
      setSessionId(id);
      setDurationMinutes(duration);
      setRemainingMs(remaining);
      endTimeRef.current = Date.now() + remaining;
      setMode(session.status === "paused" ? "paused" : "running");
      setMessage("Recovered your active focus session.");
    }).catch(() => {});
    return () => { mounted = false; };
  }, [onRecover]);

  useEffect(() => {
    if (mode !== "running") return undefined;
    const tick = () => {
      const next = Math.max(0, endTimeRef.current - Date.now());
      setRemainingMs(next);
      if (next === 0) {
        clearInterval(interval);
        complete(sessionId, durationMinutes);
      }
    };
    const interval = setInterval(tick, 250);
    tick();
    return () => clearInterval(interval);
  }, [mode, durationMinutes, sessionId, complete]);

  const start = async (minutes) => {
    if (harvesting || !SESSION_TYPES[minutes]) return;
    setHarvesting(true);
    setError("");
    try {
      const session = await onStart({ duration: minutes, type: SESSION_TYPES[minutes] });
      const id = session?._id || session?.id;
      if (!id || !session.startedAt) throw new Error("The server did not confirm the focus session start.");
      completionRef.current = false;
      const remaining = Math.max(0, new Date(session.startedAt).getTime() + minutes * 60_000 - Date.now());
      setSessionId(id);
      setDurationMinutes(minutes);
      setRemainingMs(remaining);
      endTimeRef.current = Date.now() + remaining;
      setMode("running");
      setMessage("");
    } catch (startError) {
      setError(startError?.message || "Unable to start focus session.");
    } finally {
      setHarvesting(false);
    }
  };

  const pause = async () => {
    if (mode !== "running" || !sessionId) return;
    try {
      const response = await onPause(sessionId);
      const remaining = Number(response?.data?.session?.remainingMs ?? Math.max(0, endTimeRef.current - Date.now()));
      setRemainingMs(remaining);
      setMode("paused");
    } catch (pauseError) { setError(pauseError?.message || "Unable to pause focus session."); }
  };

  const resume = async () => {
    if (mode !== "paused" || !sessionId) return;
    try {
      const response = await onResume(sessionId);
      const session = response?.data?.session;
      const remaining = Math.max(0, new Date(session?.startedAt).getTime() + durationMinutes * 60_000 - Date.now());
      endTimeRef.current = Date.now() + remaining;
      setRemainingMs(remaining);
      setMode("running");
    } catch (resumeError) { setError(resumeError?.message || "Unable to resume focus session."); }
  };

  const reset = async () => {
    try {
      if (sessionId) await onReset(sessionId);
      completionRef.current = false;
      endTimeRef.current = null;
      setSessionId(null);
      setMode("idle");
      setDurationMinutes(0);
      setRemainingMs(0);
      setMessage("");
      setError("");
    } catch (resetError) { setError(resetError?.message || "Unable to reset focus session."); }
  };

  const retryCompletion = () => {
    completionRef.current = false;
    complete(sessionId, durationMinutes);
  };

  const progress = durationMinutes > 0
    ? Math.max(0, Math.min(100, ((durationMinutes * 60_000 - remainingMs) / (durationMinutes * 60_000)) * 100)) : 0;

  return { mode, durationMinutes, remainingMs, progress, message, error, harvesting,
    canStart: (mode === "idle" || mode === "completed") && !harvesting,
    start, pause, resume, reset, retryCompletion };
}
