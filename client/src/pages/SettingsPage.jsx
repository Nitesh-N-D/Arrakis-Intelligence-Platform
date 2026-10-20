import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Navbar from "../components/ui/Navbar";
import SkeletonLoader from "../components/ui/SkeletonLoader";
import Toast from "../components/ui/Toast";
import { useAuth } from "../hooks/useAuth";
import { platformService } from "../services/platformService";

const formatBlockedSites = (blockedSites = []) => blockedSites.join("\n");

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
    weeklyDigestEnabled: true
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
          weeklyDigestEnabled: preferences.weeklyDigestEnabled ?? true
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
        weeklyDigestEnabled: form.weeklyDigestEnabled
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
                    <option value="25">25 minutes</option>
                    <option value="50">50 minutes</option>
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

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Strict block mode", "strictBlockMode"],
                  ["Desktop notifications", "desktopNotificationsEnabled"],
                  ["Storm alarm", "stormAlarmEnabled"],
                  ["Weekly digest", "weeklyDigestEnabled"]
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
