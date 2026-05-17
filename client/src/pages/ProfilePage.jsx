import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Navbar from "../components/ui/Navbar";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import Toast from "../components/ui/Toast";
import UserAvatar from "../components/ui/UserAvatar";
import { useAuth } from "../hooks/useAuth";
import { platformService } from "../services/platformService";

const serializeSkills = (skills = []) =>
  skills.map((skill) => `${skill.name}:${skill.level}`).join("\n");

const parseSkills = (value) =>
  value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, rawLevel] = line.split(":");
      return {
        name: String(name || "").trim(),
        level: Number(rawLevel || 1)
      };
    })
    .filter((skill) => skill.name)
    .map((skill) => ({
      name: skill.name,
      level: Math.max(1, Math.min(5, Number.isFinite(skill.level) ? skill.level : 1))
    }));

export default function ProfilePage() {
  const navigate = useNavigate();
  const { logout, setUser, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: "", type: "info" });
  const [form, setForm] = useState({
    name: "",
    avatarUrl: "",
    bio: "",
    targetRole: "AI Systems Engineer",
    skillsText: ""
  });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    document.title = "Profile | Arrakis Intelligence Platform";
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await platformService.profile();
        setProfile(response.data);
        setForm({
          name: response.data.name || "",
          avatarUrl: response.data.avatarUrl || "",
          bio: response.data.bio || "",
          targetRole: response.data.targetRole || "AI Systems Engineer",
          skillsText: serializeSkills(response.data.skills || [])
        });
      } catch (error) {
        setToast({ open: true, message: error.message || "Unable to load profile.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadProfile().catch(() => {});
  }, []);

  const stats = useMemo(
    () => [
      { label: "Total Spice", value: profile?.totalSpice || user?.totalSpice || 0 },
      { label: "Current Rank", value: profile?.currentRank || user?.currentRank || "Outworlder" },
      { label: "Focus Streak", value: `${profile?.focusStreak || user?.focusStreak || 0} days` }
    ],
    [profile, user]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await platformService.updateProfile({
        name: form.name,
        avatarUrl: form.avatarUrl,
        bio: form.bio,
        targetRole: form.targetRole,
        skills: parseSkills(form.skillsText)
      });
      setProfile(response.data);
      setUser((current) => (current ? { ...current, ...response.data } : response.data));
      setToast({ open: true, message: "Profile updated successfully.", type: "success" });
    } catch (error) {
      setToast({ open: true, message: error.message || "Unable to save profile.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast({ open: false, message: "", type: "info" }), 2200);
    }
  };

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <Toast {...toast} />
      <div className="mx-auto max-w-[92rem]">
        <Navbar
          billingPlan={user?.billing?.plan || "free"}
          onBilling={() => navigate("/pricing")}
          onLogout={logout}
          onMenu={() => {}}
          onProfile={() => navigate("/profile")}
          onSettings={() => navigate("/settings")}
          onUpgrade={() => navigate("/pricing")}
          operative={profile || user}
        />

        {loading ? (
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Card><SkeletonLoader className="h-64 w-full" /></Card>
            <Card><SkeletonLoader className="h-64 w-full" /></Card>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <div className="text-xs uppercase tracking-[0.34em] text-white/45">Operative identity</div>
              <div className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <UserAvatar avatarUrl={form.avatarUrl} className="h-24 w-24" name={form.name} />
                <div>
                  <div className="font-display text-3xl text-white">{form.name || "Operative"}</div>
                  <div className="mt-2 text-sm text-white/58">{profile?.email || user?.email}</div>
                  <div className="mt-2 text-sm text-white/58">Provider: {profile?.provider || user?.provider || "local"}</div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-card border border-border-subtle bg-white/4 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.24em] text-white/45">{item.label}</div>
                    <div className="mt-2 text-lg font-semibold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="text-xs uppercase tracking-[0.34em] text-white/45">Profile editor</div>
              <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Name</label>
                    <input className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Avatar URL</label>
                    <input className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" value={form.avatarUrl} onChange={(event) => setForm((current) => ({ ...current, avatarUrl: event.target.value }))} />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Target Role</label>
                  <input className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" value={form.targetRole} onChange={(event) => setForm((current) => ({ ...current, targetRole: event.target.value }))} />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Bio</label>
                  <textarea className="focus-ring min-h-28 w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Skills</label>
                  <textarea
                    className="focus-ring min-h-40 w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
                    placeholder="React:4&#10;Node.js:4&#10;System Design:3"
                    value={form.skillsText}
                    onChange={(event) => setForm((current) => ({ ...current, skillsText: event.target.value }))}
                  />
                  <div className="mt-2 text-xs text-white/45">Use one skill per line in the format skill:level.</div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button onClick={() => navigate("/settings")} type="button" variant="secondary">
                    Open Settings
                  </Button>
                  <Button disabled={saving} type="submit">
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
