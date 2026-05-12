import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import EmptyState from "../components/ui/EmptyState";
import LoadingScreen from "../components/ui/LoadingScreen";
import MentatPanel from "../components/ui/MentatPanel";
import MobileMenu from "../components/ui/MobileMenu";
import Navbar from "../components/ui/Navbar";
import Sidebar from "../components/ui/Sidebar";
import SpiceMeter from "../components/ui/SpiceMeter";
import StatCard from "../components/ui/StatCard";
import StormOverlay from "../components/ui/StormOverlay";
import Timer from "../components/ui/Timer";
import { useAuth } from "../hooks/useAuth";
import { useFocusTimer } from "../hooks/useFocusTimer";
import { useSocket } from "../hooks/useSocket";
import { useStormAlarm } from "../hooks/useStormAlarm";
import { platformService } from "../services/platformService";

const SpiceChart = lazy(() => import("../components/charts/SpiceChart"));
const StormChart = lazy(() => import("../components/charts/StormChart"));

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
    performanceSignals: {
      productivityScore: 0,
      focusEfficiency: 0,
      distractionRatio: 0,
      totalFocusMinutes: 0,
      totalDistractionMinutes: 0
    },
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
    performanceSignals: {
      ...emptyDashboard.analytics.performanceSignals,
      ...(payload.analytics?.performanceSignals || {})
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

const dashboardSections = [
  { href: "#harvest", label: "Harvest", eyebrow: "Timer" },
  { href: "#analytics", label: "Analytics", eyebrow: "Trends" },
  { href: "#skills", label: "Discipline Map", eyebrow: "Skills" },
  { href: "#roadmap", label: "Ascension", eyebrow: "Roadmap" },
  { href: "#prescience", label: "Prescience", eyebrow: "Prediction" },
  { href: "#mentat", label: "Mentat", eyebrow: "AI" }
];

const safeScrollTo = (href) => {
  const target = document.querySelector(href);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const buildChecklist = (operative, dashboard, prescience, billingPlan) => [
  {
    label: "Complete your first harvest",
    done: dashboard.analytics.summary.focusSessionsCount > 0
  },
  {
    label: "Log or sync one distraction event",
    done: dashboard.analytics.summary.distractionEventsCount > 0
  },
  {
    label: "Advance the current roadmap phase",
    done: (dashboard.analytics.roadmap?.phases || []).some((phase) => phase.status === "done")
  },
  {
    label: "Reach a stable burnout band",
    done: prescience?.riskBand === "STABLE"
  },
  {
    label: "Unlock full Mentat guidance",
    done: billingPlan === "pro"
  }
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, accessToken, setUser, logout } = useAuth();
  const [dashboard, setDashboard] = useState(emptyDashboard);
  const [prescience, setPrescience] = useState(null);
  const [billingStatus, setBillingStatus] = useState(user?.billing || { plan: "free", status: "inactive" });
  const [mentat, setMentat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [stormForm, setStormForm] = useState(stormDefaults);
  const [stormSubmitting, setStormSubmitting] = useState(false);
  const [roadmapSubmitting, setRoadmapSubmitting] = useState(null);
  const [teamForm, setTeamForm] = useState({ createName: "", joinName: "" });
  const [teamSubmitting, setTeamSubmitting] = useState("");
  const [mentatLoading, setMentatLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const socket = useSocket(accessToken);

  const refreshData = useCallback(async () => {
    const [dashboardResponse, prescienceResponse, billingResponse] = await Promise.all([
      platformService.dashboard(),
      platformService.prescience(),
      platformService.billingStatus()
    ]);

    setDashboard(normalizeDashboard(dashboardResponse.data));
    setPrescience(prescienceResponse.data);
    setBillingStatus(billingResponse.data || { plan: "free", status: "inactive" });
    setUser((current) =>
      current
        ? {
            ...current,
            billing: billingResponse.data || current.billing,
            preferences:
              dashboardResponse.data?.operative?.preferences || current.preferences
          }
        : current
    );
  }, [setUser]);

  const refreshMentat = useCallback(async (question = "") => {
    setMentatLoading(true);
    setActionError("");
    try {
      const response = await platformService.mentatAnalyze({
        question: question || "Give me the best guidance for today."
      });
      setMentat(response.data);
    } catch (mentatError) {
      setActionError(mentatError.message || "Mentat could not complete analysis.");
    } finally {
      setMentatLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Dashboard | Arrakis Intelligence Platform";
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        await refreshData();
      } catch (loadError) {
        setError(loadError.message || "Unable to load your Arrakis dashboard.");
      } finally {
        setLoading(false);
      }
    };

    load().catch(() => {});
  }, [refreshData]);

  useEffect(() => {
    if (!loading && !mentat && !error) {
      refreshMentat().catch(() => {});
    }
  }, [loading, mentat, error, refreshMentat]);

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
      await refreshMentat("Recalculate my next best move after the latest focus session.");
    },
    [refreshData, refreshMentat]
  );

  const timer = useFocusTimer({ onComplete: handleTimerComplete });
  const stormLevel = dashboard.analytics.stormState?.stormLevel || "CALM";
  useStormAlarm(stormLevel);

  const handleStormLog = async (event) => {
    event.preventDefault();
    setStormSubmitting(true);
    setActionError("");

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
      await refreshMentat("A distraction event just happened. What should I do next?");
    } catch (stormError) {
      setActionError(stormError.message || "Unable to log the distraction event.");
    } finally {
      setStormSubmitting(false);
    }
  };

  const completeRoadmapPhase = async (phaseId) => {
    setRoadmapSubmitting(phaseId);
    setActionError("");
    try {
      await platformService.completeRoadmapPhase(phaseId);
      await refreshData();
      await refreshMentat("A roadmap phase was completed. What discipline should I reinforce next?");
    } catch (roadmapError) {
      setActionError(roadmapError.message || "Unable to complete the roadmap phase.");
    } finally {
      setRoadmapSubmitting(null);
    }
  };

  const createTeam = async (event) => {
    event.preventDefault();
    setTeamSubmitting("create");
    setActionError("");

    try {
      const response = await platformService.createTeam({ name: teamForm.createName });
      setUser((current) => (current ? { ...current, team: response.data.operative.team } : current));
      setTeamForm((current) => ({ ...current, createName: "" }));
      await refreshData();
    } catch (teamError) {
      setActionError(teamError.message || "Unable to create the team.");
    } finally {
      setTeamSubmitting("");
    }
  };

  const joinTeam = async (event) => {
    event.preventDefault();
    setTeamSubmitting("join");
    setActionError("");

    try {
      const response = await platformService.joinTeam({ name: teamForm.joinName });
      setUser((current) => (current ? { ...current, team: response.data.operative.team } : current));
      setTeamForm((current) => ({ ...current, joinName: "" }));
      await refreshData();
    } catch (teamError) {
      setActionError(teamError.message || "Unable to join the team.");
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
  const performanceSignals = dashboard.analytics.performanceSignals;
  const checklist = useMemo(
    () => buildChecklist(operative, dashboard, prescience, billingStatus?.plan || "free"),
    [operative, dashboard, prescience, billingStatus?.plan]
  );

  if (loading) {
    return <LoadingScreen label="Restoring your Arrakis command center..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <EmptyState
            title="Dashboard failed to initialize"
            description={error}
            actionLabel="Retry"
            onAction={() => {
              setError("");
              setLoading(true);
              refreshData()
                .then(() => setLoading(false))
                .catch((loadError) => {
                  setError(loadError.message || "Unable to load your Arrakis dashboard.");
                  setLoading(false);
                });
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <StormOverlay level={stormLevel} />
      <MobileMenu
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onNavigate={safeScrollTo}
        plan={billingStatus?.plan || "free"}
        sections={dashboardSections}
      />

      <div className="mx-auto max-w-[96rem] xl:grid xl:grid-cols-[18rem_minmax(0,1fr)] xl:gap-6">
        <Sidebar plan={billingStatus?.plan || "free"} sections={dashboardSections} />

        <main className="min-w-0">
          <Navbar
            billingPlan={billingStatus?.plan || "free"}
            onLogout={logout}
            onMenu={() => setMobileMenuOpen(true)}
            onUpgrade={() => navigate("/pricing")}
            operative={operative}
          />

          <motion.section
            className="rounded-[2rem] border border-border-subtle bg-dune-hero p-6 shadow-card md:p-8"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.38em] text-white/45">
                  Behavioral Intelligence System
                </div>
                <h1 className="mt-4 font-display text-4xl leading-tight text-white md:text-6xl">
                  {getGreeting()}, {operative?.name?.split(" ")[0] || "Operative"}
                </h1>
                <p className="mt-4 max-w-3xl text-base leading-7 text-white/62">
                  Track spice, pressure, roadmap state, and team competition from one live operating surface.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[24rem]">
                <div className="rounded-card border border-border-subtle bg-white/5 px-4 py-3 text-sm text-white/72">
                  <div className="text-xs uppercase tracking-[0.28em] text-white/45">Current streak</div>
                  <div className="mt-2 text-2xl font-semibold text-amber-100">
                    {operative?.focusStreak || 0} days
                  </div>
                </div>
                <div className="rounded-card border border-border-subtle bg-white/5 px-4 py-3 text-sm text-white/72">
                  <div className="text-xs uppercase tracking-[0.28em] text-white/45">Burnout band</div>
                  <div className="mt-2 text-2xl font-semibold text-white">
                    {prescience?.riskBand || "STABLE"}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {actionError ? (
            <div className="mt-5 rounded-card border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {actionError}
            </div>
          ) : null}

          <div className="mt-5 grid gap-5 md:grid-cols-2 2xl:grid-cols-4">
            <StatCard
              label="Total Spice"
              value={operative?.totalSpice || 0}
              detail="Persistent focus capital accrued from completed harvests."
            />
            <StatCard
              label="Focus Sessions"
              value={dashboard.analytics.summary.focusSessionsCount}
              detail="Completed sessions stored in the behavioral ledger."
              accent="text-amber-200"
            />
            <StatCard
              label="Distraction Time"
              value={stormState?.totalMinutes || 0}
              valueSuffix="min"
              detail="Minutes of storm pressure recorded in the active cycle."
              accent="text-orange-300"
            />
            <StatCard
              label="Productivity Score"
              value={performanceSignals.productivityScore}
              detail="Composite of efficiency, cadence, and execution quality."
              accent="text-white"
            />
          </div>

          <div className="mt-5 grid gap-5 2xl:grid-cols-[1.05fr_0.95fr]">
            <div className="grid gap-5">
              <section id="harvest">
                <Timer timer={timer} />
              </section>

              <Card>
                <div className="text-xs uppercase tracking-[0.34em] text-white/45">Onboarding Flow</div>
                <div className="mt-3 font-display text-3xl text-white">Behavioral progression checklist</div>
                <div className="mt-5 grid gap-3">
                  {checklist.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-card border px-4 py-3 text-sm ${
                        item.done
                          ? "border-emerald-300/20 bg-emerald-500/10 text-emerald-100"
                          : "border-border-subtle bg-white/4 text-white/70"
                      }`}
                    >
                      {item.done ? "Done | " : "Next | "}
                      {item.label}
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            <div className="grid gap-5">
              <Card>
                <div className="text-xs uppercase tracking-[0.34em] text-white/45">Operative State</div>
                <div className="mt-3 flex flex-col gap-6">
                  <div>
                    <div className="font-display text-3xl text-white">
                      {operative?.targetRole || "Target Role"}
                    </div>
                    <div className="mt-2 text-sm text-white/58">
                      Current storm band:{" "}
                      <span className="text-amber-100">{stormState?.stormLevel || "CALM"}</span>
                    </div>
                  </div>

                  <SpiceMeter totalSpice={operative?.totalSpice || 0} />

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-card border border-border-subtle bg-white/4 px-4 py-3 text-sm text-white/65">
                      <div className="text-xs uppercase tracking-[0.24em] text-white/45">Efficiency</div>
                      <div className="mt-2 text-xl font-semibold text-white">
                        {performanceSignals.focusEfficiency}%
                      </div>
                    </div>
                    <div className="rounded-card border border-border-subtle bg-white/4 px-4 py-3 text-sm text-white/65">
                      <div className="text-xs uppercase tracking-[0.24em] text-white/45">Distraction ratio</div>
                      <div className="mt-2 text-xl font-semibold text-white">
                        {Math.round((performanceSignals.distractionRatio || 0) * 100)}%
                      </div>
                    </div>
                    <div className="rounded-card border border-border-subtle bg-white/4 px-4 py-3 text-sm text-white/65">
                      <div className="text-xs uppercase tracking-[0.24em] text-white/45">Team</div>
                      <div className="mt-2 text-xl font-semibold text-white">
                        {operative?.team?.name || user?.team?.name || "Solo"}
                      </div>
                    </div>
                  </div>

                  {billingStatus?.plan !== "pro" ? (
                    <div className="rounded-card border border-amber-300/15 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
                      Free tier active. Upgrade to unlock full Mentat guidance, strict blocking, and richer analytics.
                    </div>
                  ) : null}
                </div>
              </Card>

              <Card>
                <div className="text-xs uppercase tracking-[0.3em] text-white/45">Manual storm logging</div>
                <form className="mt-4 grid gap-3" onSubmit={handleStormLog}>
                  <input
                    className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
                    placeholder="App or site"
                    value={stormForm.appName}
                    onChange={(event) => setStormForm({ ...stormForm, appName: event.target.value })}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
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
                  </div>
                  <Button className="w-full" disabled={stormSubmitting} type="submit">
                    {stormSubmitting ? "Logging..." : "Log Distraction"}
                  </Button>
                </form>
              </Card>
            </div>
          </div>

          <section id="analytics" className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-5">
              <Suspense fallback={<LoadingScreen compact label="Loading spice trend..." />}>
                <SpiceChart data={dashboard.analytics.focusTrend} />
              </Suspense>
              <Suspense fallback={<LoadingScreen compact label="Loading storm trend..." />}>
                <StormChart data={dashboard.analytics.distractionTrend} />
              </Suspense>
            </div>

            <div className="grid gap-5">
              <section id="skills">
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
                                {skill.status} | level {skill.currentLevel}/5 | {skill.difficulty}
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
                      <EmptyState
                        compact
                        title="Skill profile aligned"
                        description="Your current skill profile already satisfies the selected role matrix."
                      />
                    )}
                  </div>
                </Card>
              </section>

              <section id="roadmap">
                <Card>
                  <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
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
                        {roadmapSubmitting === activePhase._id
                          ? "Completing..."
                          : `Mark ${activePhase.skill} done`}
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
                            {phase.durationWeeks} weeks | {phase.difficulty} difficulty
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
                      <EmptyState
                        compact
                        title="Ascension path complete"
                        description="No roadmap phases remain. Choose a new target role when you are ready for the next climb."
                      />
                    )}
                  </div>
                </Card>
              </section>
            </div>
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <section id="prescience">
              <Card>
                <div className="text-xs uppercase tracking-[0.34em] text-white/45">Prescience Engine</div>
                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="font-display text-3xl text-white">
                      {prescience?.riskBand || "STABLE"} | {prescience?.burnoutRisk || 0}%
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
            </section>

            <div className="grid gap-5">
              <Card>
                <div className="text-xs uppercase tracking-[0.34em] text-white/45">Leaderboard</div>
                <div className="mt-3 font-display text-3xl text-white">Top operatives</div>
                <div className="mt-5 space-y-3">
                  {(leaderboard?.topUsers || []).length ? (
                    (leaderboard.topUsers || []).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between rounded-card border border-border-subtle bg-white/4 px-4 py-3">
                        <div>
                          <div className="text-sm text-white/45">#{entry.rank}</div>
                          <div className="font-semibold text-white">{entry.name}</div>
                          <div className="text-sm text-white/55">
                            {entry.currentRank} | streak {entry.focusStreak}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-semibold text-amber-100">{entry.totalSpice}</div>
                          <div className="text-xs uppercase tracking-[0.22em] text-white/45">spice</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      compact
                      title="No leaderboard entries yet"
                      description="The leaderboard will populate once operatives begin harvesting focus."
                    />
                  )}
                </div>
              </Card>

              <Card>
                <div className="text-xs uppercase tracking-[0.34em] text-white/45">Team Arena</div>
                <div className="mt-3 font-display text-3xl text-white">Squads and competition</div>
                <div className="mt-5 space-y-3">
                  {(leaderboard?.topTeams || []).length ? (
                    (leaderboard.topTeams || []).map((team) => (
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
                    ))
                  ) : (
                    <EmptyState
                      compact
                      title="No teams ranked yet"
                      description="Create the first sietch to activate team competition."
                    />
                  )}
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <form className="space-y-3" onSubmit={createTeam}>
                    <div className="text-xs uppercase tracking-[0.28em] text-white/45">Create team</div>
                    <input
                      className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
                      placeholder="Sietch name"
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
                      placeholder="Existing team name"
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

          <section id="mentat" className="mt-5">
            <MentatPanel
              analysis={mentat}
              loading={mentatLoading}
              onRefresh={(question) => refreshMentat(question)}
              onUpgrade={() => navigate("/pricing")}
              plan={billingStatus?.plan || "free"}
            />
          </section>
        </main>
      </div>
    </div>
  );
}
