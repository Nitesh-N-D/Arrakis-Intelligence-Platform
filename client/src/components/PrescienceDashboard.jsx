import GlassCard from "./GlassCard";

export default function PrescienceDashboard({ analysis }) {
  if (!analysis) return null;

  return (
    <GlassCard>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm uppercase tracking-[0.3em] text-white/45">Prescience Engine</div>
          <div className="mt-3 font-display text-3xl text-amber-100">
            {analysis.riskBand} · {analysis.burnoutRisk}%
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/65">
          <div>Focus avg: {analysis.averages.focusMinutes} min</div>
          <div>Storm avg: {analysis.averages.distractionMinutes} min</div>
          <div>Streak: {analysis.averages.streak} days</div>
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
