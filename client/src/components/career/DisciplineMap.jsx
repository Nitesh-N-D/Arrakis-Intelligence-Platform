import { Link } from "react-router-dom";
import { cx } from "../../utils/cx";
import Card from "../ui/Card";
import EmptyState from "../ui/EmptyState";

const bandStyles = {
  high: { label: "Focus first", className: "border-[#F97316]/35 bg-[#F97316]/12 text-[#F97316]" },
  medium: { label: "Next up", className: "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]" },
  low: { label: "Later", className: "border-white/10 bg-white/[0.04] text-[#A1A1AA]" }
};

function LevelBar({ current, expected }) {
  return (
    <div aria-hidden="true" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((level) => (
        <span
          key={level}
          className={cx(
            "h-1.5 w-6 rounded-full",
            level <= current ? "bg-[#F59E0B]" : level <= expected ? "bg-white/20" : "bg-white/[0.06]"
          )}
        />
      ))}
    </div>
  );
}

/** Skill gaps for the user's career, grouped by priority band rather than raw scores. */
export default function DisciplineMap({ analysis }) {
  const items = analysis?.disciplineMap || [];
  const timeline = analysis?.timeline;
  const career = analysis?.career;

  return (
    <Card>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.34em] text-white/45">Discipline Map</div>
          <div className="mt-3 font-display text-3xl text-white">Skill intelligence</div>
          {career?.title ? (
            <div className="mt-1 text-sm text-[#A1A1AA]">
              For <span className="text-white">{career.title}</span>
              {career.isCustom ? " (custom)" : ""} · <Link className="text-[#F59E0B] hover:underline" to="/profile">change</Link>
            </div>
          ) : null}
        </div>
        <div
          className="rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-100"
          title={`About ${analysis?.completion || 0}% of the weighted skill targets, based on your self-assessed levels.`}
        >
          {analysis?.readiness || "Getting started"} · ~{analysis?.completion || 0}%
        </div>
      </div>

      {timeline && timeline.fit !== "unset" ? (
        <p className={cx("mt-4 rounded-xl border px-3 py-2 text-sm", timeline.fit === "fits" ? "border-emerald-300/20 text-emerald-100" : "border-[#F97316]/25 text-orange-100")}>
          About {timeline.estimatedWeeks} weeks of focused study for a {timeline.targetMonths}-month goal. {timeline.note}
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        {analysis?.needsSkills ? (
          <EmptyState
            compact
            description="Your custom career has no skills yet. Add the skills it needs on your profile to get a gap analysis and roadmap."
            title="Add skills to your career"
          />
        ) : items.length ? (
          items.map((skill) => {
            const band = bandStyles[skill.priorityBand] || bandStyles.medium;
            return (
              <div key={skill.skill} className="rounded-card border border-border-subtle bg-white/4 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold text-white">{skill.skill}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/55">
                      <LevelBar current={skill.currentLevel} expected={skill.expectedLevel} />
                      <span>{skill.currentLabel} → {skill.expectedLabel}</span>
                    </div>
                  </div>
                  <span className={cx("rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]", band.className)}>
                    {band.label}
                  </span>
                </div>
                {skill.why ? <p className="mt-3 text-sm leading-6 text-white/60">{skill.why}</p> : null}
                <div className="mt-2 text-xs text-white/45">
                  ~{skill.durationWeeks} week{skill.durationWeeks === 1 ? "" : "s"} · {skill.difficulty} · {skill.priority || "important"} skill
                </div>
              </div>
            );
          })
        ) : (
          <EmptyState
            compact
            description="Your recorded skills meet the targets for this career. Raise your target level on your profile for a further challenge."
            title="Skill profile aligned"
          />
        )}
      </div>

      {analysis?.practicalProjects?.length ? (
        <div className="mt-5">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A1A1AA]">Practical projects</div>
          <ul className="mt-2 space-y-2">
            {analysis.practicalProjects.map((project) => (
              <li key={project.skill} className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white/75">
                <span className="font-semibold text-white">{project.skill}:</span> {project.project}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Card>
  );
}
