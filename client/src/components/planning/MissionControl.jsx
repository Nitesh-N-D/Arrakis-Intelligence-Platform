import { useCallback, useEffect, useState } from "react";
import { cx } from "../../utils/cx";
import Button from "../ui/Button";
import Card from "../ui/Card";
import { platformService } from "../../services/platformService";

const TITLE_MAX = 140;

/**
 * Daily Mission Control: today's missions, up to three priorities, planned focus, and an
 * explicit (never automatic) choice to bring unfinished work forward from earlier days.
 */
export default function MissionControl({ goals = [], onMissionsChange, refreshKey = 0 }) {
  const [board, setBoard] = useState(null);
  const [title, setTitle] = useState("");
  const [planned, setPlanned] = useState("");
  const [priority, setPriority] = useState(false);
  const [goalId, setGoalId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await platformService.missions();
      setBoard(response.data);
      onMissionsChange?.(response.data.missions);
      setError("");
    } catch (loadError) {
      setError(loadError.message || "Could not load today's missions.");
    }
  }, [onMissionsChange]);

  useEffect(() => { load(); }, [load, refreshKey]);

  const run = async (action) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
    } catch (actionError) {
      setError(actionError.message || "That change could not be saved.");
    } finally {
      setBusy(false);
    }
  };

  const add = (event) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    run(async () => {
      await platformService.createMission({
        title: trimmed,
        priority,
        ...(planned ? { plannedFocusMinutes: Number(planned) } : {}),
        ...(goalId ? { goalId } : {})
      });
      setTitle("");
      setPlanned("");
      setPriority(false);
      setGoalId("");
    });
  };

  const missions = board?.missions || [];
  const summary = board?.summary;
  const priorityCount = missions.filter((mission) => mission.priority && mission.status !== "dropped").length;
  const priorityLimit = board?.limits?.priorities || 3;
  const carry = board?.carryForward;

  return (
    <Card interactive={false}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.34em] text-white/45">Mission Control</div>
          <h2 className="mt-2 font-display text-3xl text-white">Today's plan</h2>
        </div>
        {summary ? (
          <p className="text-sm text-white/60" aria-live="polite">
            {summary.done} of {summary.total} done · {summary.completedMinutes}/{summary.plannedMinutes || 0} focus min
          </p>
        ) : null}
      </div>

      {summary?.total ? (
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8" role="progressbar" aria-label="Missions completed today" aria-valuemin={0} aria-valuemax={100} aria-valuenow={summary.progress}>
          <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-300" style={{ width: `${summary.progress}%` }} />
        </div>
      ) : null}

      {carry?.count ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-amber-300/20 bg-amber-300/8 px-4 py-3 text-sm text-amber-50">
          <span>{carry.count} unfinished mission{carry.count === 1 ? "" : "s"} from earlier days. Bring them into today?</span>
          <Button variant="secondary" disabled={busy} onClick={() => run(() => platformService.carryForwardMissions(carry.items.map((item) => item.id)))}>
            Carry forward
          </Button>
        </div>
      ) : null}

      <form className="mt-5 grid gap-3" onSubmit={add}>
        <label className="grid gap-1 text-sm text-white/70" htmlFor="mission-title">
          New mission
          <input
            id="mission-title"
            className="focus-ring rounded-button border border-border-subtle bg-black/30 px-3 py-2 text-white"
            maxLength={TITLE_MAX}
            placeholder="e.g. Finish chapter 3 exercises"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-sm text-white/70" htmlFor="mission-planned">
            Planned focus (min)
            <input
              id="mission-planned"
              className="focus-ring w-28 rounded-button border border-border-subtle bg-black/30 px-3 py-2 text-white"
              inputMode="numeric"
              max={480}
              min={0}
              type="number"
              value={planned}
              onChange={(event) => setPlanned(event.target.value)}
            />
          </label>
          {goals.length ? (
            <label className="grid gap-1 text-sm text-white/70" htmlFor="mission-goal">
              Goal
              <select id="mission-goal" className="focus-ring rounded-button border border-border-subtle bg-black/30 px-3 py-2 text-white" value={goalId} onChange={(event) => setGoalId(event.target.value)}>
                <option value="">None</option>
                {goals.filter((goal) => goal.status === "active").map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
              </select>
            </label>
          ) : null}
          <label className="flex items-center gap-2 pb-2 text-sm text-white/70">
            <input type="checkbox" checked={priority} disabled={!priority && priorityCount >= priorityLimit} onChange={(event) => setPriority(event.target.checked)} />
            Priority ({priorityCount}/{priorityLimit})
          </label>
          <Button type="submit" disabled={busy || !title.trim()}>Add</Button>
        </div>
      </form>

      {error ? <div className="mt-4 rounded-card border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">{error}</div> : null}

      <ul className="mt-5 grid gap-2" aria-label="Today's missions">
        {missions.length === 0 ? <li className="text-sm text-white/55">No missions yet. Add one small, specific task to start the day.</li> : null}
        {missions.map((mission) => (
          <li key={mission.id} className={cx("flex flex-wrap items-center gap-3 rounded-card border px-4 py-3 text-sm", mission.status === "done" ? "border-emerald-300/20 bg-emerald-500/8" : mission.status === "dropped" ? "border-white/5 bg-white/3 opacity-60" : "border-border-subtle bg-white/4")}>
            <input
              aria-label={`Mark ${mission.title} as ${mission.status === "done" ? "not done" : "done"}`}
              type="checkbox"
              checked={mission.status === "done"}
              disabled={busy || mission.status === "dropped"}
              onChange={(event) => run(() => platformService.updateMission(mission.id, { status: event.target.checked ? "done" : "todo" }))}
            />
            <span className={cx("min-w-0 flex-1 break-words text-white", mission.status === "done" && "line-through text-white/60")}>
              {mission.priority ? <span className="mr-1 text-amber-200" aria-label="Priority">★</span> : null}
              {mission.title}
              {mission.carryCount ? <span className="ml-2 text-xs text-white/45">carried {mission.carryCount}×</span> : null}
            </span>
            <span className="text-xs text-white/50">{mission.completedFocusMinutes}/{mission.plannedFocusMinutes || 0} min</span>
            <button
              className="focus-ring rounded-button px-2 py-1 text-xs text-white/60 hover:text-white"
              type="button"
              disabled={busy || (!mission.priority && priorityCount >= priorityLimit)}
              onClick={() => run(() => platformService.updateMission(mission.id, { priority: !mission.priority }))}
            >
              {mission.priority ? "Unstar" : "Star"}
            </button>
            <button
              className="focus-ring rounded-button px-2 py-1 text-xs text-white/60 hover:text-white"
              type="button"
              disabled={busy}
              onClick={() => run(() => (mission.status === "dropped"
                ? platformService.updateMission(mission.id, { status: "todo" })
                : platformService.updateMission(mission.id, { status: "dropped" })))}
            >
              {mission.status === "dropped" ? "Restore" : "Drop"}
            </button>
            <button className="focus-ring rounded-button px-2 py-1 text-xs text-red-200/80 hover:text-red-100" type="button" disabled={busy} onClick={() => run(() => platformService.deleteMission(mission.id))}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
