import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "../components/GlassCard";
import MetricCard from "../components/MetricCard";
import PrescienceDashboard from "../components/PrescienceDashboard";
import RankBadge from "../components/RankBadge";
import SpiceMeter from "../components/SpiceMeter";
import StormOverlay from "../components/StormOverlay";
import { FocusTrendChart, StormTrendChart } from "../components/TrendCharts";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import { platformService } from "../services/platformService";

const emptySkillAnalysis = { completion: 0, missingSkills: [], roadmap: [] };

export default function DashboardPage() {
  const { user, accessToken, setUser, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [prescience, setPrescience] = useState(null);
  const [stormState, setStormState] = useState(null);
  const [harvestLoading, setHarvestLoading] = useState(false);
  const [stormLoading, setStormLoading] = useState(false);
  const socket = useSocket(accessToken);

  useEffect(() => {
    const load = async () => {
      const [dashboardResponse, prescienceResponse] = await Promise.all([
        platformService.dashboard(),
        platformService.prescience()
      ]);
      setDashboard(dashboardResponse.data);
      setStormState(dashboardResponse.data.analytics.stormState);
      setPrescience(prescienceResponse.data);
    };

    load().catch(console.error);
  }, []);

  useEffect(() => {
    if (!socket) return undefined;

    socket.on("storm:update", setStormState);
    socket.on("analytics:update", setDashboard);
    socket.on("rank:update", (payload) => {
      setUser((current) =>
        current
          ? { ...current, currentRank: payload.currentRank, totalSpice: payload.totalSpice }
          : current
      );
    });

    return () => {
      socket.off("storm:update", setStormState);
      socket.off("analytics:update", setDashboard);
      socket.off("rank:update");
    };
  }, [socket, setUser]);

  const simulateHarvest = async (duration, type) => {
    setHarvestLoading(true);
    try {
      await platformService.harvestSpice({
        duration,
        type,
        productivityScore: duration === 50 ? 87 : 76,
        notes: duration === 50 ? "Deep architecture session" : "Pomodoro execution sprint"
      });
    } finally {
      setHarvestLoading(false);
    }
  };

  const simulateStorm = async () => {
    setStormLoading(true);
    try {
      await platformService.logStorm({
        appName: "YouTube",
        duration: 40,
        severity: "high",
        metadata: { device: "desktop", category: "video" }
      });
    } finally {
      setStormLoading(false);
    }
  };

  const skillAnalysis = dashboard?.analytics.skillAnalysis || emptySkillAnalysis;
  const operative = dashboard?.operative || user;

  return (
    <div className="min-h-screen p-6 md:p-10">
      <StormOverlay
        active={Boolean(stormState?.stormModeActive)}
        escalationLevel={stormState?.escalationLevel || "calm"}
      />
      <div className="mx-auto max-w-7xl">
        <motion.div
          className="mb-8 flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-storm-grid p-8 md:flex-row md:items-end md:justify-between"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-sm uppercase tracking-[0.45em] text-white/50">Prescience Engine</p>
            <h1 className="mt-4 font-display text-5xl text-amber-100 md:text-6xl">
              Arrakis Intelligence Platform
            </h1>
            <p className="mt-4 max-w-2xl text-white/65">
              Skill disciplines, storm resistance, and spice harvest analytics for every operative.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <RankBadge rank={operative?.rank || operative?.currentRank || "Outworlder"} />
            <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80" onClick={logout}>
              Logout
            </button>
          </div>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Spice"
            value={operative?.totalSpice || 0}
            accent="text-amber-200"
            detail="Accumulated focus capital from completed harvest sessions."
          />
          <MetricCard
            label="Streak"
            value={`${operative?.focusStreak || 0} days`}
            accent="text-orange-300"
            detail="Consecutive days with meaningful deep work."
          />
          <MetricCard
            label="Skill Completion"
            value={`${skillAnalysis.completion}%`}
            accent="text-amber-100"
            detail="Weighted role-alignment across required disciplines."
          />
          <MetricCard
            label="Weekly Score"
            value={dashboard?.analytics.weeklyProductivityScore || 0}
            accent="text-orange-200"
            detail="Trailing productivity score from all completed sessions."
          />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <GlassCard>
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/50">Spice Engine</p>
                <h2 className="mt-2 font-display text-3xl text-amber-100">Harvest control center</h2>
              </div>
              <SpiceMeter totalSpice={operative?.totalSpice || 0} />
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-3 font-semibold text-black"
                disabled={harvestLoading}
                onClick={() => simulateHarvest(25, "pomodoro-25")}
              >
                Harvest 25
              </button>
              <button
                className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-5 py-3 font-semibold text-amber-100"
                disabled={harvestLoading}
                onClick={() => simulateHarvest(50, "deep-50")}
              >
                Harvest 50
              </button>
              <button
                className="rounded-2xl border border-orange-300/20 bg-orange-500/10 px-5 py-3 font-semibold text-orange-100"
                disabled={stormLoading}
                onClick={simulateStorm}
              >
                Trigger Storm Event
              </button>
            </div>
          </GlassCard>

          <GlassCard>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Discipline Map</p>
            <h2 className="mt-2 font-display text-3xl text-amber-100">{user?.targetRole || "Target Role"}</h2>
            <div className="mt-5 space-y-3">
              {skillAnalysis.missingSkills.slice(0, 4).map((skill) => (
                <div key={skill.name} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{skill.name}</span>
                    <span className="text-sm text-orange-200">Priority {skill.priorityScore}</span>
                  </div>
                  <div className="mt-2 text-sm text-white/55">Difficulty: {skill.difficulty}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <FocusTrendChart data={dashboard?.analytics.focusTrend || []} />
          <StormTrendChart data={dashboard?.analytics.distractionTrend || []} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <PrescienceDashboard analysis={prescience} />
          <GlassCard>
            <p className="text-sm uppercase tracking-[0.3em] text-white/50">Ascension Roadmap</p>
            <h2 className="mt-2 font-display text-3xl text-amber-100">Priority learning path</h2>
            <div className="mt-6 space-y-4">
              {skillAnalysis.roadmap.map((step) => (
                <div key={step.phase} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm uppercase tracking-[0.25em] text-orange-200">
                      Phase {step.phase}
                    </span>
                    <span className="text-sm text-white/50">{step.estimatedWeeks} weeks</span>
                  </div>
                  <div className="mt-2 text-lg font-semibold text-amber-50">{step.discipline}</div>
                  <div className="mt-1 text-sm text-white/60">{step.milestone}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
