import { useState } from "react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { platformService } from "../../services/platformService";

const categoryLabel = { career: "Career", academic: "Academic", project: "Project", personal: "Personal" };

/** Personal goals with milestones. Progress comes only from milestones the user ticks off. */
export default function GoalsPanel({ data, onChanged }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("career");
  const [deadline, setDeadline] = useState("");
  const [milestones, setMilestones] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await onChanged?.();
    } catch (actionError) {
      setError(actionError.message || "That change could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const create = (event) => {
    event.preventDefault();
    if (title.trim().length < 2) return;
    run(async () => {
      await platformService.createGoal({
        title: title.trim(),
        category,
        ...(deadline ? { deadline } : {}),
        milestones: milestones.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 20).map((line) => ({ title: line }))
      });
      setTitle("");
      setDeadline("");
      setMilestones("");
    });
  };

  const goals = data?.goals || [];

  return (
    <Card interactive={false}>
      <div className="text-xs uppercase tracking-[0.34em] text-white/45">Goals</div>
      <h2 className="mt-2 font-display text-3xl text-white">What you're building toward</h2>
      {data?.summary ? (
        <p className="mt-2 text-sm text-white/60">{data.summary.active} active · {data.summary.completed} completed{data.summary.overdue ? ` · ${data.summary.overdue} past deadline` : ""}</p>
      ) : null}

      <form className="mt-5 grid gap-3" onSubmit={create}>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="grid gap-1 text-sm text-white/70" htmlFor="goal-title">
            Goal
            <input id="goal-title" className="focus-ring rounded-button border border-border-subtle bg-black/30 px-3 py-2 text-white" maxLength={120} placeholder="e.g. Land a frontend internship" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm text-white/70" htmlFor="goal-category">
            Type
            <select id="goal-category" className="focus-ring rounded-button border border-border-subtle bg-black/30 px-3 py-2 text-white" value={category} onChange={(event) => setCategory(event.target.value)}>
              {Object.entries(categoryLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm text-white/70" htmlFor="goal-deadline">
            Deadline
            <input id="goal-deadline" className="focus-ring rounded-button border border-border-subtle bg-black/30 px-3 py-2 text-white" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} />
          </label>
        </div>
        <label className="grid gap-1 text-sm text-white/70" htmlFor="goal-milestones">
          Milestones (one per line, optional)
          <textarea id="goal-milestones" className="focus-ring min-h-20 rounded-button border border-border-subtle bg-black/30 px-3 py-2 text-white" maxLength={3000} value={milestones} onChange={(event) => setMilestones(event.target.value)} />
        </label>
        <div><Button type="submit" disabled={busy || title.trim().length < 2}>Add goal</Button></div>
      </form>

      {error ? <div className="mt-4 rounded-card border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">{error}</div> : null}

      <div className="mt-5 grid gap-3">
        {goals.length === 0 ? <p className="text-sm text-white/55">No goals yet. Goals connect your daily missions to something bigger.</p> : null}
        {goals.map((goal) => (
          <article key={goal.id} className="rounded-card border border-border-subtle bg-white/4 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="break-words font-semibold text-white">{goal.title}</h3>
                <p className="text-xs text-white/50">
                  {categoryLabel[goal.category] || goal.category} · {goal.status}
                  {goal.daysLeft !== null && goal.status === "active" ? ` · ${goal.overdue ? `${Math.abs(goal.daysLeft)} days past deadline` : `${goal.daysLeft} days left`}` : ""}
                </p>
              </div>
              <span className="text-sm text-amber-100">{goal.progress}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-label={`${goal.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={goal.progress}>
              <div className="h-full bg-amber-300/80" style={{ width: `${goal.progress}%` }} />
            </div>
            {goal.milestones.length ? (
              <ul className="mt-3 grid gap-1">
                {goal.milestones.map((milestone) => (
                  <li key={milestone.id}>
                    <label className="flex items-start gap-2 text-sm text-white/75">
                      <input type="checkbox" checked={milestone.done} disabled={busy} onChange={(event) => run(() => platformService.toggleGoalMilestone(goal.id, milestone.id, event.target.checked))} />
                      <span className={milestone.done ? "line-through text-white/50" : ""}>{milestone.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {goal.status === "active" ? (
                <Button variant="secondary" disabled={busy} onClick={() => run(() => platformService.updateGoal(goal.id, { status: "completed" }))}>Mark complete</Button>
              ) : (
                <Button variant="secondary" disabled={busy} onClick={() => run(() => platformService.updateGoal(goal.id, { status: "active" }))}>Reactivate</Button>
              )}
              <Button variant="ghost" disabled={busy} onClick={() => run(() => platformService.updateGoal(goal.id, { sharedWithTeam: !goal.sharedWithTeam }))}>
                {goal.sharedWithTeam ? "Stop sharing with team" : "Share with team"}
              </Button>
              <Button variant="danger" disabled={busy} onClick={() => { if (window.confirm(`Delete the goal "${goal.title}"? Linked missions are kept.`)) run(() => platformService.deleteGoal(goal.id)); }}>Delete</Button>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
