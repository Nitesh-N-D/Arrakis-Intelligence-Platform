import { useEffect, useState } from "react";
import { cx } from "../../utils/cx";
import Button from "../ui/Button";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";
import { EVIDENCE_MAX, EVIDENCE_MIN, EVIDENCE_PER_PHASE, NOTES_MAX, masteryChecklist } from "./roadmapModel.js";

const statusStyles = {
  active: "border-[#F59E0B]/40 bg-[#F59E0B]/10 text-[#F59E0B]",
  done: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
  skipped: "border-white/10 bg-white/5 text-white/60",
  locked: "border-white/10 bg-white/5 text-white/50"
};
const statusLabel = { active: "In progress", done: "Mastered", skipped: "Skipped", locked: "Up next" };


function CheckRow({ checked, disabled, label, onChange }) {
  return (
    <label className={cx("flex items-start gap-3 rounded-button border border-white/8 bg-white/5 px-3 py-2 text-sm", disabled ? "text-white/55" : "cursor-pointer text-white/80 hover:border-white/15")}>
      <input
        checked={checked}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#F59E0B]"
        disabled={disabled}
        type="checkbox"
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={checked ? "line-through decoration-white/30" : undefined}>{label}</span>
    </label>
  );
}

function PhaseDetail({ phase, busy, onUpdate, onAddEvidence, onRemoveEvidence, onComplete }) {
  const id = String(phase._id);
  const active = phase.status === "active";
  const [notes, setNotes] = useState(phase.notes || "");
  const [evidence, setEvidence] = useState({ summary: "", url: "" });
  useEffect(() => setNotes(phase.notes || ""), [phase.notes]);
  const checklist = masteryChecklist(phase);
  const completed = new Set(phase.completedTasks || []);
  const confirmed = new Set(phase.assessmentConfirmed || []);
  const bookmarked = new Set(phase.bookmarkedResources || []);
  const summaryLength = evidence.summary.trim().length;

  return (
    <div className="mt-4 grid gap-5 border-t border-white/8 pt-4">
      {phase.why ? <p className="text-sm leading-6 text-white/65"><span className="font-semibold text-white">Why it matters: </span>{phase.why}</p> : null}

      {phase.objectives?.length ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">Objectives</h4>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/70">
            {phase.objectives.map((objective) => <li key={objective}>{objective}</li>)}
          </ul>
        </div>
      ) : null}

      {phase.prerequisites?.length ? (
        <p className="text-sm text-white/60"><span className="font-semibold text-white">Before you start: </span>{phase.prerequisites.join("; ")}</p>
      ) : null}

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">
          Tasks <span className="normal-case tracking-normal">({checklist.tasks.done}/{checklist.tasks.total})</span>
        </h4>
        <div className="mt-2 space-y-2">
          {phase.tasks.map((task, index) => (
            <CheckRow
              key={task}
              checked={completed.has(index)}
              disabled={!active || busy}
              label={task}
              onChange={(done) => onUpdate(id, { task: { index, done } })}
            />
          ))}
        </div>
      </div>

      {phase.exercises?.length ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">Practical exercise</h4>
          <ul className="mt-2 space-y-1 text-sm text-white/70">{phase.exercises.map((exercise) => <li key={exercise}>{exercise}</li>)}</ul>
        </div>
      ) : null}

      {phase.resources?.length ? (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">Resources</h4>
          <ul className="mt-2 space-y-2">
            {phase.resources.map((resource) => {
              const saved = bookmarked.has(resource.url);
              return (
                <li key={resource.url} className="flex items-center justify-between gap-3 rounded-button border border-white/8 bg-white/5 px-3 py-2 text-sm">
                  <a className="min-w-0 truncate text-white/80 underline-offset-4 hover:text-white hover:underline" href={resource.url} rel="noopener noreferrer" target="_blank">
                    {resource.title}
                  </a>
                  <button
                    aria-label={saved ? `Remove bookmark for ${resource.title}` : `Bookmark ${resource.title}`}
                    aria-pressed={saved}
                    className={cx("focus-ring shrink-0 rounded-full px-2 text-base", saved ? "text-[#F59E0B]" : "text-white/40 hover:text-white")}
                    disabled={busy}
                    type="button"
                    onClick={() => onUpdate(id, { bookmark: { url: resource.url, bookmarked: !saved } })}
                  >
                    {saved ? "★" : "☆"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">
          Evidence <span className="normal-case tracking-normal">({checklist.evidence.done})</span>
        </h4>
        {phase.evidence?.length ? (
          <ul className="mt-2 space-y-2">
            {phase.evidence.map((entry) => (
              <li key={entry._id} className="rounded-button border border-white/8 bg-white/5 px-3 py-2 text-sm text-white/75">
                <p className="whitespace-pre-line">{entry.summary}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-white/45">
                  {entry.url ? <a className="text-[#F59E0B] hover:underline" href={entry.url} rel="noopener noreferrer nofollow" target="_blank">Open link</a> : null}
                  {entry.submittedAt ? <span>{new Date(entry.submittedAt).toLocaleDateString()}</span> : null}
                  {active ? (
                    <button className="focus-ring text-white/50 hover:text-red-200" disabled={busy} type="button" onClick={() => onRemoveEvidence(id, entry._id)}>Remove</button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
        {active && (phase.evidence?.length || 0) < EVIDENCE_PER_PHASE ? (
          <form
            className="mt-3 grid gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const ok = await onAddEvidence(id, { summary: evidence.summary.trim(), url: evidence.url.trim() });
              if (ok) setEvidence({ summary: "", url: "" });
            }}
          >
            <label className="sr-only" htmlFor={`evidence-summary-${id}`}>What did you build or learn?</label>
            <textarea
              className="focus-ring min-h-20 w-full rounded-button border border-border-subtle bg-black/20 px-3 py-2 text-sm"
              id={`evidence-summary-${id}`}
              maxLength={EVIDENCE_MAX}
              placeholder="What did you build or learn? Describe the result and one decision you made."
              value={evidence.summary}
              onChange={(event) => setEvidence((current) => ({ ...current, summary: event.target.value }))}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="sr-only" htmlFor={`evidence-url-${id}`}>Link (optional)</label>
              <input
                className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-3 py-2 text-sm"
                id={`evidence-url-${id}`}
                placeholder="https://github.com/you/project (optional)"
                type="url"
                value={evidence.url}
                onChange={(event) => setEvidence((current) => ({ ...current, url: event.target.value }))}
              />
              <Button className="shrink-0 py-2" disabled={busy || summaryLength < EVIDENCE_MIN} type="submit" variant="secondary">Add evidence</Button>
            </div>
            <p className="text-xs text-white/45">
              {summaryLength < EVIDENCE_MIN ? `${EVIDENCE_MIN - summaryLength} more characters needed.` : "Ready to add."} Links are stored as you enter them; no files are uploaded.
            </p>
          </form>
        ) : null}
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">
          Self-assessment <span className="normal-case tracking-normal">({checklist.assessment.done}/{checklist.assessment.total})</span>
        </h4>
        <div className="mt-2 space-y-2">
          {(phase.assessmentCriteria || []).map((criterion, index) => (
            <CheckRow
              key={criterion}
              checked={confirmed.has(index)}
              disabled={!active || busy}
              label={criterion}
              onChange={(value) => onUpdate(id, { assessment: { index, confirmed: value } })}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]" htmlFor={`notes-${id}`}>Notes</label>
        <textarea
          className="focus-ring mt-2 min-h-24 w-full rounded-button border border-border-subtle bg-black/20 px-3 py-2 text-sm"
          id={`notes-${id}`}
          maxLength={NOTES_MAX}
          placeholder="Private notes for this phase"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <div className="mt-2 flex items-center justify-between text-xs text-white/45">
          <span>{notes.length}/{NOTES_MAX}</span>
          <Button className="py-2" disabled={busy || notes === (phase.notes || "")} variant="ghost" onClick={() => onUpdate(id, { notes })}>Save notes</Button>
        </div>
      </div>

      {active ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-sm text-white/70">
            {checklist.ready
              ? "Everything is in place. Marking this phase mastered raises your recorded skill level and unlocks the next phase."
              : "To mark this phase mastered: finish every task, add at least one piece of evidence and confirm each self-assessment point."}
          </p>
          <Button className="mt-3" disabled={busy || !checklist.ready} onClick={() => onComplete(id)}>
            Mark {phase.skill} mastered
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Roadmap phases with tasks, resources, notes, bookmarks, evidence and mastery checks. */
export default function RoadmapPanel({ roadmap, busy, onUpdate, onAddEvidence, onRemoveEvidence, onComplete }) {
  const phases = roadmap?.phases || [];
  const activeId = phases.find((phase) => phase.status === "active")?._id;
  const [openId, setOpenId] = useState(activeId ? String(activeId) : null);
  useEffect(() => { if (activeId) setOpenId(String(activeId)); }, [activeId]);
  const done = phases.filter((phase) => phase.status === "done").length;

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.34em] text-white/45">Ascension System</div>
          <div className="mt-3 font-display text-3xl text-white">Roadmap phases</div>
          {roadmap?.targetRole ? <div className="mt-1 text-sm text-[#A1A1AA]">{roadmap.targetRole} · {done}/{phases.length} mastered</div> : null}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {phases.length ? (
          phases.map((phase) => {
            const id = String(phase._id);
            const expanded = openId === id;
            return (
              <div key={id} className={cx("rounded-card border bg-black/20 p-4", phase.status === "active" ? "border-[#F59E0B]/30" : "border-border-subtle")}>
                <button
                  aria-controls={`phase-detail-${id}`}
                  aria-expanded={expanded}
                  className="focus-ring flex w-full items-center justify-between gap-3 text-left"
                  type="button"
                  onClick={() => setOpenId(expanded ? null : id)}
                >
                  <div className="min-w-0">
                    <div className="text-xs uppercase tracking-[0.28em] text-white/45">
                      Phase {phase.phaseNumber}{phase.fromRole ? ` · from ${phase.fromRole}` : ""}
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">{phase.skill}</div>
                    <div className="mt-1 text-sm text-white/55">~{phase.durationWeeks} weeks · {phase.difficulty}</div>
                  </div>
                  <span className={cx("shrink-0 rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em]", statusStyles[phase.status] || statusStyles.locked)}>
                    {statusLabel[phase.status] || phase.status}
                  </span>
                </button>
                {expanded ? (
                  <div id={`phase-detail-${id}`}>
                    <PhaseDetail
                      busy={busy}
                      phase={phase}
                      onAddEvidence={onAddEvidence}
                      onComplete={onComplete}
                      onRemoveEvidence={onRemoveEvidence}
                      onUpdate={onUpdate}
                    />
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <EmptyState
            compact
            description="No roadmap phases remain. Choose a new target career or raise your target level when you are ready for the next climb."
            title="Ascension path complete"
          />
        )}
      </div>

      {roadmap?.history?.length ? (
        <details className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-white">Roadmap history ({roadmap.history.length})</summary>
          <ul className="mt-3 space-y-2 text-sm text-white/65">
            {roadmap.history.slice().reverse().map((entry) => (
              <li key={entry._id || entry.archivedAt}>
                <span className="text-white">{entry.targetRole}</span> · {new Date(entry.archivedAt).toLocaleDateString()} ·{" "}
                {entry.phases.map((phase) => phase.skill).join(", ")} (notes and evidence kept)
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </Card>
  );
}
