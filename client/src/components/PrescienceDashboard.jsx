import GlassCard from "./GlassCard";

export default function PrescienceDashboard({ analysis }) {
  if (!analysis) return null;

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">Prescience Engine</p>
          <h3 className="mt-2 font-display text-3xl text-amber-100">
            Burnout risk {analysis.burnoutRisk}%
          </h3>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-right text-sm text-white/70">
          <div>Focus avg: {analysis.averages.focusMinutes} min</div>
          <div>Storm avg: {analysis.averages.distractionMinutes} min</div>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        {analysis.recommendations.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
            {item}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
