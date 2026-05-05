import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import SpiceChart from "../components/charts/SpiceChart";
import StormChart from "../components/charts/StormChart";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import RankBadge from "../components/ui/RankBadge";
import SpiceMeter from "../components/ui/SpiceMeter";
import StatCard from "../components/ui/StatCard";
import StormOverlay from "../components/ui/StormOverlay";
import Timer from "../components/ui/Timer";
import { useAuth } from "../hooks/useAuth";
import { useFocusTimer } from "../hooks/useFocusTimer";
import { useSocket } from "../hooks/useSocket";
import { platformService } from "../services/platformService";

const emptyDashboard = {
  operative: null,
  leaderboard: { topUsers: [], topTeams: [] },
  analytics: {
    summary: {
      focusSessionsCount: 0,
      distractionEventsCount: 0
    },
    focusTrend: [],
    distractionTrend: [],
    skillAnalysis: { completion: 0, disciplineMap: [] },
    stormState: { stormLevel: "CALM", totalMinutes: 0, nextThreshold: 60 },
    weeklyProductivityScore: 0,
    roadmap: { phases: [] },
    leaderboard: { topUsers: [], topTeams: [] }
  }
};

const normalizeDashboard = (payload = emptyDashboard) => ({
  ...emptyDashboard,
  ...payload,
  leaderboard:
    payload.leaderboard || payload.analytics?.leaderboard || emptyDashboard.leaderboard,
  analytics: {
    ...emptyDashboard.analytics,
    ...(payload.analytics || {}),
    summary: {
      ...emptyDashboard.analytics.summary,
      ...(payload.analytics?.summary || {})
    },
    skillAnalysis: {
      ...emptyDashboard.analytics.skillAnalysis,
      ...(payload.analytics?.skillAnalysis || {})
    },
    stormState: {
      ...emptyDashboard.analytics.stormState,
      ...(payload.analytics?.stormState || {})
    },
    roadmap: payload.analytics?.roadmap || emptyDashboard.analytics.roadmap,
    leaderboard:
      payload.analytics?.leaderboard || payload.leaderboard || emptyDashboard.analytics.leaderboard
  }
});

const stormDefaults = {
  appName: "YouTube",
  duration: 30,
  severity: "medium"
};

export default function DashboardPage() {
  const { user, accessToken, setUser, logout } = useAuth();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [prescience, setPrescience] = useState(null);
  const [stormForm, setStormForm] = useState(stormDefaults);
  const [stormSubmitting, setStormSubmitting] = useState(false);
  const [roadmapSubmitting, setRoadmapSubmitting] = useState(null);
  const [teamForm, setTeamForm] = useState({ createName: "", joinName: "" });
  const [teamSubmitting, setTeamSubmitting] = useState("");
  const socket = useSocket(accessToken);

  const refreshData = useCallback(async () => {
    const [dashboardResponse, prescienceResponse] = await Promise.all([
      platformService.dashboard(),
      platformService.prescience()
    ]);

    setDashboard(normalizeDashboard(dashboardResponse.data));
    setPrescience(prescienceResponse.data);
  }, []);

  useEffect(() => {
    refreshData().catch(console.error);
  }, [refreshData]);

  useEffect(() => {
    if (!socket) return undefined;

    socket.on("spice:update", (payload) => {
      setDashboard((current) =>
        normalizeDashboard({
          ...current,
          operative: current.operative
            ? {
                ...current.operative,
                totalSpice: payload.totalSpice,
                rank: payload.currentRank
              }
            : current.operative
        })
      );
      setUser((currentUser) =>
        currentUser
          ? { ...currentUser, totalSpice: payload.totalSpice, currentRank: payload.currentRank }
          : currentUser
      );
    });

    socket.on("streak:update", (payload) => {
      setDashboard((current) =>
        normalizeDashboard({
          ...current,
          operative: current.operative
            ? {
                ...current.operative,
                focusStreak: payload.focusStreak
              }
            : current.operative
        })
      );
      setUser((currentUser) =>
        currentUser ? { ...currentUser, focusStreak: payload.focusStreak } : currentUser
      );
    });

    socket.on("storm:update", (payload) => {
      setDashboard((current) =>
        normalizeDashboard({
          ...current,
          analytics: {
            ...current.analytics,
            stormState: payload
          }
        })
      );
    });

    socket.on("leaderboard:update", (payload) => {
      setDashboard((current) =>
        normalizeDashboard({
          ...current,
          leaderboard: payload,
          analytics: {
            ...current.analytics,
            leaderboard: payload
          }
        })
      );
    });

    socket.on("analytics:update", (payload) => {
      setDashboard((current) =>
        normalizeDashboard({
          ...current,
          ...payload,
          leaderboard: current.leaderboard
        })
      );
    });

    return () => {
      socket.off("spice:update");
      socket.off("streak:update");
      socket.off("storm:update");
      socket.off("leaderboard:update");
      socket.off("analytics:update");
    };
  }, [socket, setUser]);

  const handleTimerComplete = useCallback(
    async ({ duration, type }) => {
      await platformService.harvestSpice({
        duration,
        type,
        notes: duration === 50 ? "Deep focus harvest" : "Pomodoro harvest"
      });
      await refreshData();
    },
    [refreshData]
  );

  const timer = useFocusTimer({ onComplete: handleTimerComplete });

  const handleStormLog = async (event) => {
    event.preventDefault();
    setStormSubmitting(true);

    try {
      await platformService.logStorm({
        ...stormForm,
        duration: Number(stormForm.duration),
        metadata: {
          device: "desktop",
          category: "manual"
        }
      });
      setStormForm(stormDefaults);
      await refreshData();
    } finally {
      setStormSubmitting(false);
    }
  };

  const completeRoadmapPhase = async (phaseId) => {
    setRoadmapSubmitting(phaseId);
    try {
      await platformService.completeRoadmapPhase(phaseId);
      await refreshData();
    } finally {
      setRoadmapSubmitting(null);
    }
  };

  const createTeam = async (event) => {
    event.preventDefault();
    setTeamSubmitting("create");

    try {
      const response = await platformService.createTeam({ name: teamForm.createName });
      setUser((current) => (current ? { ...current, team: response.data.operative.team } : current));
      setTeamForm((current) => ({ ...current, createName: "" }));
      await refreshData();
    } finally {
      setTeamSubmitting("");
    }
  };

  const joinTeam = async (event) => {
    event.preventDefault();
    setTeamSubmitting("join");

    try {
      const response = await platformService.joinTeam({ name: teamForm.joinName });
      setUser((current) => (current ? { ...current, team: response.data.operative.team } : current));
      setTeamForm((current) => ({ ...current, joinName: "" }));
      await refreshData();
    } finally {
      setTeamSubmitting("");
    }
  };

  const operative = dashboard.operative || user;
  const leaderboard = dashboard.leaderboard || dashboard.analytics.leaderboard;
  const roadmap = dashboard.analytics.roadmap;
  const activePhase = roadmap?.phases?.find((phase) => phase.status === "active");
  const skillAnalysis = dashboard.analytics.skillAnalysis;
  const stormState = dashboard.analytics.stormState;
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <StormOverlay level={stormState?.stormLevel} />
      <div className="mx-auto max-w-7xl space-y-5">
        <motion.section
          className="rounded-[2rem] border border-border-subtle bg-dune-hero p-8 shadow-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.38em] text-white/45">
                Behavioral Intelligence System
              </div>
              <h1 className="mt-4 font-display text-5xl leading-tight text-white md:text-6xl">
                {greeting}, {operative?.name?.split(" ")[0] || "Operative"}
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-white/62">
                The prescience engine is watching your focus economy, storm pressure, ascension phases,
                and leaderboard position in real time.
              </p>
            </div>

            <div className="flex flex-col items-start gap-4 xl:items-end">
              <RankBadge rank={operative?.rank || operative?.currentRank || "Outworlder"} />
              <div className="rounded-full border border-amber-300/15 bg-white/5 px-4 py-2 text-sm text-white/70">
                Streak: <span className="font-semibold text-amber-100">{operative?.focusStreak || 0} days</span>
              </div>
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </motion.section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Spice"
            value={operative?.totalSpice || 0}
            detail="All completed harvest output stored as persistent focus capital."
          />
          <StatCard
            label="Focus Sessions"
            value={dashboard.analytics.summary.focusSessionsCount}
            detail="Completed session count across the operative timeline."
            accent="text-amber-200"
          />
          <StatCard
            label="Distraction Time"
            value={stormState?.totalMinutes || 0}
            valueSuffix="min"
            detail="Total distraction minutes logged inside the current storm cycle."
            accent="text-orange-300"
          />
          <StatCard
            label="Weekly Score"
            value={dashboard.analytics.weeklyProductivityScore}
            detail="Prescience-weighted productivity score over the last seven days."
            accent="text-white"
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <Timer timer={timer} />

          <Card>
            <div className="text-xs uppercase tracking-[0.34em] text-white/45">Operative State</div>
            <div className="mt-3 flex flex-col gap-6">
              <div>
                <div className="font-display text-3xl text-white">{operative?.targetRole || "Target Role"}</div>
                <div className="mt-2 text-sm text-white/58">
                  Current storm band: <span className="text-amber-100">{stormState?.stormLevel || "CALM"}</span>
                </div>
              </div>

              <SpiceMeter totalSpice={operative?.totalSpice || 0} />

              <div className="rounded-card border border-border-subtle bg-white/4 p-4 text-sm text-white/62">
                <div>Distraction events logged: {dashboard.analytics.summary.distractionEventsCount}</div>
                <div className="mt-2">
                  Next threshold: {stormState?.nextThreshold ? `${stormState.nextThreshold} minutes` : "Maximum pressure reached"}
                </div>
                <div className="mt-2">
                  Team: <span className="text-amber-100">{operative?.team?.name || user?.team?.name || "Unaffiliated"}</span>
                </div>
              </div>

              <form className="grid gap-3" onSubmit={handleStormLog}>
                <div className="text-xs uppercase tracking-[0.3em] text-white/45">Manual storm logging</div>
                <input
                  className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
                  placeholder="App or site"
                  value={stormForm.appName}
                  onChange={(event) => setStormForm({ ...stormForm, appName: event.target.value })}
                />
                <input
                  className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
                  type="number"
                  min="1"
                  placeholder="Duration in minutes"
                  value={stormForm.duration}
                  onChange={(event) => setStormForm({ ...stormForm, duration: event.target.value })}
                />
                <select
                  className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
                  value={stormForm.severity}
                  onChange={(event) => setStormForm({ ...stormForm, severity: event.target.value })}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                </select>
                <Button className="w-full" disabled={stormSubmitting} type="submit">
                  {stormSubmitting ? "Logging..." : "Log Distraction"}
                </Button>
              </form>
            </div>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="grid gap-5">
            <SpiceChart data={dashboard.analytics.focusTrend} />
            <StormChart data={dashboard.analytics.distractionTrend} />
          </div>

          <div className="grid gap-5">
            <Card>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.34em] text-white/45">Discipline Map</div>
                  <div className="mt-3 font-display text-3xl text-white">Skill intelligence</div>
                </div>
                <div className="rounded-full border border-amber-300/15 bg-amber-300/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-amber-100">
                  {skillAnalysis?.completion || 0}% aligned
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {skillAnalysis?.disciplineMap?.length ? (
                  skillAnalysis.disciplineMap.map((skill) => (
                    <div key={skill.skill} className="rounded-card border border-border-subtle bg-white/4 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-lg font-semibold text-white">{skill.skill}</div>
                          <div className="mt-1 text-sm text-white/55">
                            {skill.status} · level {skill.currentLevel}/5 · {skill.difficulty}
                          </div>
                        </div>
                        <div className="rounded-full border border-orange-300/18 bg-orange-500/12 px-3 py-1 text-xs uppercase tracking-[0.22em] text-orange-100">
                          priority {skill.priorityScore}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-white/58">
                        Recommended duration: {skill.durationWeeks} weeks
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-card border border-border-subtle bg-white/4 p-4 text-sm text-white/62">
                    Your current skill profile already satisfies the selected role matrix.
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.34em] text-white/45">Ascension System</div>
                  <div className="mt-3 font-display text-3xl text-white">Roadmap phases</div>
                </div>
                {activePhase ? (
                  <Button
                    variant="secondary"
                    disabled={roadmapSubmitting === activePhase._id}
                    onClick={() => completeRoadmapPhase(activePhase._id)}
                  >
                    {roadmapSubmitting === activePhase._id ? "Completing..." : `Mark ${activePhase.skill} done`}
                  </Button>
                ) : null}
              </div>

              <div className="mt-6 space-y-4">
                {roadmap?.phases?.length ? (
                  roadmap.phases.map((phase) => (
                    <div key={phase._id} className="rounded-card border border-border-subtle bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.28em] text-white/45">
                            Phase {phase.phaseNumber}
                          </div>
                          <div className="mt-2 text-lg font-semibold text-white">{phase.skill}</div>
                        </div>
                        <div className="rounded-full border border-border-subtle bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.28em] text-white/70">
                          {phase.status}
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-white/58">
                        {phase.durationWeeks} weeks · {phase.difficulty} difficulty
                      </div>
                      <div className="mt-3 space-y-2">
                        {phase.tasks.map((task) => (
                          <div key={task} className="rounded-button border border-white/8 bg-white/5 px-3 py-2 text-sm text-white/68">
                            {task}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-card border border-border-subtle bg-white/4 p-4 text-sm text-white/62">
                    No roadmap phases remain. The operative has completed the available ascension path.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <Card>
            <div className="text-xs uppercase tracking-[0.34em] text-white/45">Prescience Engine</div>
            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="font-display text-3xl text-white">
                  {prescience?.riskBand || "STABLE"} · {prescience?.burnoutRisk || 0}%
                </div>
                <div className="mt-2 text-sm text-white/58">
                  Burnout prediction based on focus volume, storm load, and streak durability.
                </div>
              </div>
              <div className="rounded-card border border-border-subtle bg-white/4 px-4 py-3 text-sm text-white/62">
                <div>Focus avg: {prescience?.averages?.focusMinutes || 0} min</div>
                <div>Storm avg: {prescience?.averages?.distractionMinutes || 0} min</div>
                <div>Streak: {prescience?.averages?.streak || 0} days</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {(prescience?.recommendations || []).map((item) => (
                <div key={item} className="rounded-card border border-border-subtle bg-white/4 px-4 py-3 text-sm text-white/70">
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-5">
            <Card>
              <div className="text-xs uppercase tracking-[0.34em] text-white/45">Leaderboard</div>
              <div className="mt-3 font-display text-3xl text-white">Top operatives</div>
              <div className="mt-5 space-y-3">
                {(leaderboard?.topUsers || []).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-card border border-border-subtle bg-white/4 px-4 py-3">
                    <div>
                      <div className="text-sm text-white/45">#{entry.rank}</div>
                      <div className="font-semibold text-white">{entry.name}</div>
                      <div className="text-sm text-white/55">
                        {entry.currentRank} · streak {entry.focusStreak}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-amber-100">{entry.totalSpice}</div>
                      <div className="text-xs uppercase tracking-[0.22em] text-white/45">spice</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="text-xs uppercase tracking-[0.34em] text-white/45">Team Arena</div>
              <div className="mt-3 font-display text-3xl text-white">Squads and competition</div>
              <div className="mt-5 space-y-3">
                {(leaderboard?.topTeams || []).map((team) => (
                  <div key={team.id} className="rounded-card border border-border-subtle bg-white/4 px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-white/45">#{team.rank}</div>
                        <div className="font-semibold text-white">{team.name}</div>
                      </div>
                      <div className="text-right text-sm text-white/58">
                        <div>{team.totalSpice} spice</div>
                        <div>{team.totalStreak} streak</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <form className="space-y-3" onSubmit={createTeam}>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/45">Create team</div>
                  <input
                    className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
                    placeholder="Sietch Name"
                    value={teamForm.createName}
                    onChange={(event) =>
                      setTeamForm((current) => ({ ...current, createName: event.target.value }))
                    }
                  />
                  <Button className="w-full" disabled={teamSubmitting === "create"} type="submit">
                    {teamSubmitting === "create" ? "Creating..." : "Create Team"}
                  </Button>
                </form>

                <form className="space-y-3" onSubmit={joinTeam}>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/45">Join team</div>
                  <input
                    className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
                    placeholder="Existing Team Name"
                    value={teamForm.joinName}
                    onChange={(event) =>
                      setTeamForm((current) => ({ ...current, joinName: event.target.value }))
                    }
                  />
                  <Button variant="secondary" className="w-full" disabled={teamSubmitting === "join"} type="submit">
                    {teamSubmitting === "join" ? "Joining..." : "Join Team"}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
