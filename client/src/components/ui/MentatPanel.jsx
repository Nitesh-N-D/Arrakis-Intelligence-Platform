import { useState } from "react";
import Button from "./Button";
import Card from "./Card";
import EmptyState from "./EmptyState";

export default function MentatPanel({ analysis, loading, onRefresh }) {
  const [question, setQuestion] = useState("");

  return (
    <Card>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.34em] text-white/45">Mentat</div>
          <div className="mt-3 font-display text-3xl text-white">Behavioral co-pilot</div>
          <p className="mt-2 text-sm leading-6 text-white/58">
            Ask Mentat for your next best action, the safest focus schedule, and your highest-risk behavioral leak.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button disabled={loading} onClick={() => onRefresh(question)}>
            {loading ? "Consulting..." : "Refresh insight"}
          </Button>
        </div>
      </div>

      <div className="mt-5 rounded-card border border-border-subtle bg-black/20 p-4">
        <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">
          Ask Mentat
        </label>
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
            placeholder="What should I optimize tomorrow morning?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
          <Button className="md:min-w-[9rem]" disabled={loading} onClick={() => onRefresh(question)}>
            Send
          </Button>
        </div>
      </div>

      {!analysis && !loading ? (
        <div className="mt-5">
          <EmptyState
            compact
            title="Mentat has not spoken yet"
            description="Run your first analysis to generate behavioral guidance from spice, storm, streak, and roadmap signals."
            actionLabel="Generate insight"
            onAction={() => onRefresh(question)}
          />
        </div>
      ) : null}

      {analysis ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <div className="rounded-card border border-border-subtle bg-white/4 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-white/45">Summary</div>
              <div className="mt-3 text-sm leading-7 text-white/74">{analysis.summary}</div>
            </div>
            <div className="rounded-card border border-border-subtle bg-white/4 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-white/45">Next best action</div>
              <div className="mt-3 text-base font-semibold text-amber-100">{analysis.nextBestAction}</div>
            </div>
            <div className="rounded-card border border-border-subtle bg-white/4 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-white/45">Recommendations</div>
              <div className="mt-3 space-y-2">
                {(analysis.dailyRecommendations || []).map((item) => (
                  <div key={item} className="rounded-button border border-white/8 bg-white/5 px-3 py-2 text-sm text-white/70">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-card border border-border-subtle bg-white/4 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-white/45">Focus schedule</div>
              <div className="mt-3 text-sm text-white/72">
                <div>Start: {analysis.focusSchedule?.recommendedStartHour || "09:00"}</div>
                <div className="mt-2">
                  Primary session: {analysis.focusSchedule?.recommendedPrimarySession || 25} minutes
                </div>
                <div className="mt-2">
                  Recovery: {analysis.focusSchedule?.recommendedRecoveryWindow || "Use short resets."}
                </div>
              </div>
            </div>
            <div className="rounded-card border border-border-subtle bg-white/4 p-4">
              <div className="text-xs uppercase tracking-[0.28em] text-white/45">Warnings</div>
              <div className="mt-3 space-y-2">
                {(analysis.warnings || []).length ? (
                  analysis.warnings.map((item) => (
                    <div key={item} className="rounded-button border border-red-300/18 bg-red-500/10 px-3 py-2 text-sm text-red-100">
                      {item}
                    </div>
                  ))
                ) : (
                  <div className="rounded-button border border-white/8 bg-white/5 px-3 py-2 text-sm text-white/70">
                    No urgent warnings. Maintain current discipline safeguards.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
