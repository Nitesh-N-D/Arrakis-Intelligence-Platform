import { useEffect, useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { platformService } from "../../services/platformService";

const confidenceLabel = { low: "Low confidence", medium: "Medium confidence", high: "High confidence" };

const formatChange = (value) => {
  if (value === null || value === undefined) return "new";
  if (value === 0) return "no change";
  return `${value > 0 ? "+" : ""}${value}%`;
};

function ProductiveHours({ hours }) {
  const max = Math.max(1, ...hours.map((hour) => hour.minutes));
  const total = hours.reduce((sum, hour) => sum + hour.minutes, 0);
  if (!total) return <p className="text-sm text-white/55">Complete a few focus sessions to see which hours work best for you.</p>;
  return (
    <figure>
      <div className="flex h-28 items-end gap-[3px]" aria-hidden="true">
        {hours.map((hour) => (
          <div key={hour.hour} className="flex-1 rounded-t bg-amber-300/70" style={{ height: `${Math.max(2, (hour.minutes / max) * 100)}%`, opacity: hour.minutes ? 1 : 0.15 }} title={`${String(hour.hour).padStart(2, "0")}:00 · ${hour.minutes} min`} />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-white/40" aria-hidden="true"><span>00</span><span>06</span><span>12</span><span>18</span><span>23</span></div>
      <figcaption className="sr-only">
        Completed focus minutes by starting hour: {hours.filter((hour) => hour.minutes).map((hour) => `${hour.hour}:00 ${hour.minutes} minutes`).join(", ")}.
      </figcaption>
    </figure>
  );
}

/** Explainable behaviour insights and the weekly review. Every insight shows the evidence behind it. */
export default function InsightsPanel({ refreshKey = 0, onBlockSite }) {
  const [behavior, setBehavior] = useState(null);
  const [review, setReview] = useState(null);
  const [tab, setTab] = useState("patterns");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([platformService.behavior(), platformService.weeklyReview()])
      .then(([behaviorResponse, reviewResponse]) => {
        if (cancelled) return;
        setBehavior(behaviorResponse.data);
        setReview(reviewResponse.data);
        setError("");
      })
      .catch((loadError) => { if (!cancelled) setError(loadError.message || "Insights are unavailable right now."); });
    return () => { cancelled = true; };
  }, [refreshKey]);

  return (
    <Card interactive={false}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.34em] text-white/45">Insights</div>
          <h2 className="mt-2 font-display text-3xl text-white">Your patterns</h2>
        </div>
        <div className="flex gap-2" role="tablist" aria-label="Insight views">
          {[["patterns", "Patterns"], ["week", "Weekly review"]].map(([id, label]) => (
            <button key={id} id={`insights-tab-${id}`} role="tab" aria-selected={tab === id} aria-controls={`insights-panel-${id}`} type="button"
              className={`focus-ring rounded-button px-3 py-1.5 text-sm ${tab === id ? "bg-white/12 text-white" : "text-white/60 hover:text-white"}`}
              onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error ? <div className="mt-4 rounded-card border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">{error}</div> : null}
      {!behavior && !error ? <p className="mt-4 text-sm text-white/55">Loading insights…</p> : null}

      {behavior && tab === "patterns" ? (
        <div id="insights-panel-patterns" role="tabpanel" aria-labelledby="insights-tab-patterns" className="mt-5 grid gap-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-card border border-border-subtle bg-white/4 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">Focus this week</div>
              <div className="mt-1 text-xl font-semibold text-white">{behavior.weekly.thisWeek.focusMinutes} min</div>
              <div className="text-xs text-white/50">vs last week: {formatChange(behavior.weekly.change.focusMinutes)}</div>
            </div>
            <div className="rounded-card border border-border-subtle bg-white/4 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">Sessions finished</div>
              <div className="mt-1 text-xl font-semibold text-white">{behavior.sessionSuccess.rate === null ? "—" : `${behavior.sessionSuccess.rate}%`}</div>
              <div className="text-xs text-white/50">{behavior.sessionSuccess.completed} completed · {behavior.sessionSuccess.abandoned} stopped early</div>
            </div>
            <div className="rounded-card border border-border-subtle bg-white/4 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">Active days</div>
              <div className="mt-1 text-xl font-semibold text-white">{behavior.consistency.activeDays}/{behavior.consistency.windowDays}</div>
              <div className="text-xs text-white/50">days with completed focus</div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white/80">When you focus best</h3>
            <div className="mt-2"><ProductiveHours hours={behavior.productiveHours} /></div>
          </div>

          <ul className="grid gap-3">
            {behavior.insights.map((insight) => (
              <li key={insight.id} className="rounded-card border border-border-subtle bg-white/4 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-white">{insight.title}</h3>
                  <span className="text-xs text-white/45">{confidenceLabel[insight.confidence] || insight.confidence}</span>
                </div>
                <p className="mt-1 text-sm text-white/70">{insight.detail}</p>
                {insight.evidence?.length ? (
                  <details className="mt-2 text-xs text-white/55">
                    <summary className="cursor-pointer">Why am I seeing this?</summary>
                    <ul className="mt-1 list-disc pl-5">{insight.evidence.map((line) => <li key={line}>{line}</li>)}</ul>
                  </details>
                ) : null}
                {insight.action?.type === "block-site" && onBlockSite ? (
                  <Button className="mt-3" variant="secondary" onClick={() => onBlockSite(insight.action.site)}>Add {insight.action.site} to block list</Button>
                ) : null}
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/45">{behavior.disclaimer}</p>
        </div>
      ) : null}

      {review && tab === "week" ? (
        <div id="insights-panel-week" role="tabpanel" aria-labelledby="insights-tab-week" className="mt-5 grid gap-4">
          <p className="text-sm text-white/55">{review.period.from} to {review.period.to}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-card border border-border-subtle bg-white/4 px-4 py-3 text-sm text-white/70">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">Focus</div>
              <div className="mt-1 text-lg text-white">{review.focus.minutes} min in {review.focus.sessions} sessions</div>
              <div className="text-xs">Previous week: {review.focus.previousMinutes} min ({formatChange(review.focus.changePercent)})</div>
            </div>
            <div className="rounded-card border border-border-subtle bg-white/4 px-4 py-3 text-sm text-white/70">
              <div className="text-xs uppercase tracking-[0.2em] text-white/45">Distractions</div>
              <div className="mt-1 text-lg text-white">{review.distractions.minutes} min</div>
              <div className="text-xs">Previous week: {review.distractions.previousMinutes} min ({formatChange(review.distractions.changePercent)})</div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/80">Highlights</h3>
            <ul className="mt-2 list-disc pl-5 text-sm text-white/70">{review.highlights.map((line) => <li key={line}>{line}</li>)}</ul>
          </div>
          {review.nextWeek.length ? (
            <div>
              <h3 className="text-sm font-semibold text-white/80">Ideas for next week</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-white/70">{review.nextWeek.map((line) => <li key={line}>{line}</li>)}</ul>
            </div>
          ) : null}
          <p className="text-xs text-white/45">{review.disclaimer}</p>
        </div>
      ) : null}
    </Card>
  );
}
