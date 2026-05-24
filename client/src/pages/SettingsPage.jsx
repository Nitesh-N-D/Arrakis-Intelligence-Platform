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
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Focus duration preference</label>
                  <select className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" value={form.focusDurationPreference} onChange={(event) => setForm((current) => ({ ...current, focusDurationPreference: event.target.value }))}>
                    <option value="25">25 minutes</option>
                    <option value="50">50 minutes</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Storm warning threshold (minutes)</label>
                  <input className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" min="15" type="number" value={form.stormWarningMinutes} onChange={(event) => setForm((current) => ({ ...current, stormWarningMinutes: event.target.value }))} />
                </div>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Blocked sites</label>
                  <textarea className="focus-ring min-h-40 w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" placeholder="facebook.com&#10;instagram.com" value={form.blockedSitesText} onChange={(event) => setForm((current) => ({ ...current, blockedSitesText: event.target.value }))} />
                  <div className="mt-2 text-xs text-white/45">One host per line or separate entries with commas.</div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Override window (minutes)</label>
                    <input className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" min="1" type="number" value={form.extensionOverrideMinutes} onChange={(event) => setForm((current) => ({ ...current, extensionOverrideMinutes: event.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Theme</label>
                    <select className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3" value={form.theme} onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value }))}>
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
      </div>
    </div>
  );
}
