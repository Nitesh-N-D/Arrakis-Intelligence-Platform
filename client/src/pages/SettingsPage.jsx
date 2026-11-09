import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import ExtensionStatusCard from "../components/extension/ExtensionStatusCard";
import Card from "../components/ui/Card";
import Navbar from "../components/ui/Navbar";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import Toast from "../components/ui/Toast";
import { useAuth } from "../hooks/useAuth";
import { platformService } from "../services/platformService";

const formatBlockedSites = (blockedSites = []) => blockedSites.join("\n");

/** Parses "25, 50" into valid preset minutes (1-240). The server re-validates. */
const parsePresets = (text) => [...new Set(String(text || "").split(/[\s,]+/).filter(Boolean).map(Number).filter((value) => Number.isInteger(value) && value >= 1 && value <= 240))].slice(0, 6);

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout, setUser, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ confirmationEmail: "", password: "", confirmationText: "" });
  const [toast, setToast] = useState({ open: false, message: "", type: "info" });
  const [form, setForm] = useState({
    focusDurationPreference: 50,
    stormWarningMinutes: 60,
    blockedSitesText: "",
    strictBlockMode: false,
    extensionOverrideMinutes: 5,
    theme: "dark",
    desktopNotificationsEnabled: true,
    stormAlarmEnabled: true,
    weeklyDigestEnabled: true,
    focusPresetsText: "25, 50",
    breakMinutes: 5,
    longBreakMinutes: 15,
    blockingPolicy: "always",
    trackingPaused: false,
    teamSharing: "summary",
    dataRetentionDays: 0,
    dailyBriefingEnabled: true
  });

  useEffect(() => {
    document.title = "Settings | Arrakis Intelligence Platform";
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await platformService.profile();
        const preferences = response.data.preferences || {};
        setForm({
          focusDurationPreference: preferences.focusDurationPreference || 50,
          stormWarningMinutes: preferences.stormWarningMinutes || 60,
          blockedSitesText: formatBlockedSites(preferences.blockedSites || []),
          strictBlockMode: Boolean(preferences.strictBlockMode),
          extensionOverrideMinutes: preferences.extensionOverrideMinutes || 5,
          theme: preferences.theme || "dark",
          desktopNotificationsEnabled: preferences.desktopNotificationsEnabled ?? true,
          stormAlarmEnabled: preferences.stormAlarmEnabled ?? true,
          weeklyDigestEnabled: preferences.weeklyDigestEnabled ?? true,
          focusPresetsText: (preferences.focusPresets || [25, 50]).join(", "),
          breakMinutes: preferences.breakMinutes ?? 5,
          longBreakMinutes: preferences.longBreakMinutes ?? 15,
          blockingPolicy: preferences.blockingPolicy || "always",
          trackingPaused: Boolean(preferences.trackingPaused),
          teamSharing: preferences.teamSharing || "summary",
          dataRetentionDays: preferences.dataRetentionDays ?? 0,
          dailyBriefingEnabled: preferences.dailyBriefingEnabled ?? true
        });
      } catch (error) {
        setToast({ open: true, message: error.message || "Unable to load settings.", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    loadProfile().catch(() => {});
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const response = await platformService.updateSettings({
        focusDurationPreference: Number(form.focusDurationPreference),
        stormWarningMinutes: Number(form.stormWarningMinutes),
        blockedSites: form.blockedSitesText,
        strictBlockMode: form.strictBlockMode,
        extensionOverrideMinutes: Number(form.extensionOverrideMinutes),
        theme: form.theme,
        desktopNotificationsEnabled: form.desktopNotificationsEnabled,
        stormAlarmEnabled: form.stormAlarmEnabled,
        weeklyDigestEnabled: form.weeklyDigestEnabled,
        focusPresets: parsePresets(form.focusPresetsText),
        breakMinutes: Number(form.breakMinutes),
        longBreakMinutes: Number(form.longBreakMinutes),
        blockingPolicy: form.blockingPolicy,
        trackingPaused: form.trackingPaused,
        teamSharing: form.teamSharing,
        dataRetentionDays: Number(form.dataRetentionDays),
        dailyBriefingEnabled: form.dailyBriefingEnabled
      });
      setUser((current) => (current ? { ...current, preferences: response.data.preferences } : current));
      setToast({ open: true, message: "Settings updated successfully.", type: "success" });
    } catch (error) {
      setToast({ open: true, message: error.message || "Unable to save settings.", type: "error" });
    } finally {
      setSaving(false);
      setTimeout(() => setToast({ open: false, message: "", type: "info" }), 2200);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await platformService.exportAccount();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: "application/json" });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = "arrakis-account-data.json";
      link.click();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
    } catch (error) {
      setToast({ open: true, message: error.message || "Unable to export account data.", type: "error" });
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    setDeleting(true);
    try {
      await platformService.deleteAccount(deleteForm);
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setToast({ open: true, message: error.message || "Unable to delete this account.", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <Toast {...toast} />
      <div className="mx-auto max-w-[92rem]">
        <Navbar
          onLogout={logout}
          onMenu={() => {}}
          onProfile={() => navigate("/profile")}
          onSettings={() => navigate("/settings")}
          operative={user}
        />

        {loading ? (
          <Card><SkeletonLoader className="h-80 w-full" /></Card>
        ) : (
          <Card>
            <div className="text-xs uppercase tracking-[0.34em] text-white/45">System controls</div>
            <div className="mt-3 font-display text-3xl text-white">Preferences and blocker policy</div>
            <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label htmlFor="settings-focus-duration" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Focus duration preference</label>
                  <select id="settings-focus-duration" className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" value={form.focusDurationPreference} onChange={(event) => setForm((current) => ({ ...current, focusDurationPreference: event.target.value }))}>
                    {[...new Set([...parsePresets(form.focusPresetsText), Number(form.focusDurationPreference)])].filter(Boolean).sort((a, b) => a - b).map((minutes) => (
                      <option key={minutes} value={minutes}>{minutes} minutes</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="settings-storm-threshold" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Storm warning threshold (minutes)</label>
                  <input id="settings-storm-threshold" className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" min="15" type="number" value={form.stormWarningMinutes} onChange={(event) => setForm((current) => ({ ...current, stormWarningMinutes: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label htmlFor="settings-blocked-sites" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Blocked sites</label>
                  <textarea id="settings-blocked-sites" className="focus-ring min-h-40 w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" placeholder="facebook.com&#10;instagram.com" value={form.blockedSitesText} onChange={(event) => setForm((current) => ({ ...current, blockedSitesText: event.target.value }))} />
                  <div className="mt-2 text-xs text-white/45">One host per line or separate entries with commas.</div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="settings-override-window" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Override window (minutes)</label>
                    <input id="settings-override-window" className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" min="1" type="number" value={form.extensionOverrideMinutes} onChange={(event) => setForm((current) => ({ ...current, extensionOverrideMinutes: event.target.value }))} />
                  </div>
                  <div>
                    <label htmlFor="settings-theme" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Theme</label>
                    <select id="settings-theme" className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" value={form.theme} onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value }))}>
                      <option value="dark">Dark</option>
                      <option value="system">System</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <div>
                  <label htmlFor="settings-focus-presets" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Focus presets (minutes)</label>
                  <input id="settings-focus-presets" className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" placeholder="25, 50" value={form.focusPresetsText} onChange={(event) => setForm((current) => ({ ...current, focusPresetsText: event.target.value }))} />
                  <div className="mt-2 text-xs text-white/45">Up to 6 durations between 1 and 240 minutes, separated by commas.</div>
                </div>
                <div>
                  <label htmlFor="settings-break" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Short break (minutes)</label>
                  <input id="settings-break" className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" max="60" min="1" type="number" value={form.breakMinutes} onChange={(event) => setForm((current) => ({ ...current, breakMinutes: event.target.value }))} />
                </div>
                <div>
                  <label htmlFor="settings-long-break" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Long break (minutes)</label>
                  <input id="settings-long-break" className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" max="120" min="1" type="number" value={form.longBreakMinutes} onChange={(event) => setForm((current) => ({ ...current, longBreakMinutes: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <div>
                  <label htmlFor="settings-blocking-policy" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">When the extension blocks sites</label>
                  <select id="settings-blocking-policy" className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" value={form.blockingPolicy} onChange={(event) => setForm((current) => ({ ...current, blockingPolicy: event.target.value }))}>
                    <option value="always">Always</option>
                    <option value="focus-only">Only during focus sessions</option>
                    <option value="off">Never (tracking only)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="settings-team-sharing" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Team sharing</label>
                  <select id="settings-team-sharing" className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" value={form.teamSharing} onChange={(event) => setForm((current) => ({ ...current, teamSharing: event.target.value }))}>
                    <option value="summary">Share weekly totals with my team</option>
                    <option value="none">Share nothing with my team</option>
                  </select>
                  <div className="mt-2 text-xs text-white/45">Teammates never see site names or mission text.</div>
                </div>
                <div>
                  <label htmlFor="settings-retention" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Keep activity history</label>
                  <select id="settings-retention" className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" value={form.dataRetentionDays} onChange={(event) => setForm((current) => ({ ...current, dataRetentionDays: event.target.value }))}>
                    <option value="0">Until I delete it</option>
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">1 year</option>
                  </select>
                  <div className="mt-2 text-xs text-white/45">Older focus and distraction records are removed automatically.</div>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Strict block mode", "strictBlockMode"],
                  ["Desktop notifications", "desktopNotificationsEnabled"],
                  ["Storm alarm", "stormAlarmEnabled"],
                  ["Weekly digest", "weeklyDigestEnabled"],
                  ["Daily briefing", "dailyBriefingEnabled"],
                  ["Pause activity tracking", "trackingPaused"]
                ].map(([label, key]) => (
                  <label key={key} className="flex items-center justify-between rounded-card border border-border-subtle bg-white/4 px-4 py-3 text-sm text-white/72">
                    <span>{label}</span>
                    <input checked={Boolean(form[key])} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.checked }))} type="checkbox" />
                  </label>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button onClick={() => navigate("/profile")} type="button" variant="secondary">
                  Open Profile
                </Button>
                <Button disabled={saving} type="submit">
                  {saving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {!loading ? <ExtensionStatusCard userId={user?.id} /> : null}

        {!loading ? (
          <Card className="mt-5">
            <div className="text-xs uppercase tracking-[0.34em] text-white/45">Account data</div>
            <h2 className="mt-3 font-display text-2xl text-white">Export or delete your data</h2>
            <p className="mt-2 max-w-3xl text-sm text-white/60">An export includes your profile, focus-session history, distraction records, and roadmap. Deletion removes those records, revokes refresh tokens, and removes you from your team. If you own a team, ownership transfers to its oldest remaining member.</p>
            <Button className="mt-4" disabled={exporting} onClick={handleExport} type="button" variant="secondary">
              {exporting ? "Preparing export..." : "Download my data"}
            </Button>
            <details className="mt-6 rounded-card border border-red-300/20 bg-red-500/5 p-4">
              <summary className="cursor-pointer text-sm font-semibold text-red-100">Delete my account and personal data</summary>
              <form className="mt-4 grid max-w-xl gap-4" onSubmit={handleDeleteAccount}>
                <p className="text-sm text-white/65">This action is permanent. Sign in again first if your current session is more than five minutes old.</p>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/55" htmlFor="delete-account-email">Account email</label>
                  <input autoComplete="email" className="focus-ring w-full rounded-button border border-border-subtle bg-black/30 px-4 py-3" id="delete-account-email" onChange={(event) => setDeleteForm((current) => ({ ...current, confirmationEmail: event.target.value }))} required type="email" value={deleteForm.confirmationEmail} />
                </div>
                {user?.provider === "local" ? (
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/55" htmlFor="delete-account-password">Current password</label>
                    <input autoComplete="current-password" className="focus-ring w-full rounded-button border border-border-subtle bg-black/30 px-4 py-3" id="delete-account-password" onChange={(event) => setDeleteForm((current) => ({ ...current, password: event.target.value }))} required type="password" value={deleteForm.password} />
                  </div>
                ) : null}
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/55" htmlFor="delete-account-confirmation">Type DELETE MY ACCOUNT</label>
                  <input autoComplete="off" className="focus-ring w-full rounded-button border border-border-subtle bg-black/30 px-4 py-3" id="delete-account-confirmation" onChange={(event) => setDeleteForm((current) => ({ ...current, confirmationText: event.target.value }))} required value={deleteForm.confirmationText} />
                </div>
                <Button disabled={deleting} type="submit" variant="danger">
                  {deleting ? "Deleting account..." : "Permanently delete account"}
                </Button>
              </form>
            </details>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
