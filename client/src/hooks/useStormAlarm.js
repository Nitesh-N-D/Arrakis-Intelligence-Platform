import { useEffect, useRef } from "react";

const activeStormLevels = new Set(["DUST", "SANDSTORM", "SPICE STORM"]);

export function useStormAlarm(level) {
  const audioContextRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!activeStormLevels.has(level)) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (audioContextRef.current?.state === "running") {
        audioContextRef.current.suspend().catch(() => {});
      }

      return undefined;
    }

    const playAlarm = async () => {
      try {
        if (!audioContextRef.current) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (!AudioContextClass) {
            return;
          }
          audioContextRef.current = new AudioContextClass();
        }

        const context = audioContextRef.current;
        if (context.state === "suspended") {
          await context.resume();
        }

        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sawtooth";
        oscillator.frequency.value = level === "SPICE STORM" ? 740 : 560;
        gain.gain.setValueAtTime(0.0001, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.03, context.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.28);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.3);
      } catch (_error) {
        // Browsers can block autoplay until user interaction; we fail silently here.
      }
    };

    playAlarm();
    intervalRef.current = window.setInterval(
      playAlarm,
      level === "SPICE STORM" ? 1800 : 2600
    );

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [level]);
}
