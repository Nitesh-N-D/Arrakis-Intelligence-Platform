import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CareerChangeDialog from "../components/career/CareerChangeDialog";
import CareerPreferences from "../components/career/CareerPreferences";
import CareerRoleSelector from "../components/career/CareerRoleSelector";
import { selectionFromCareer, toCareerPayload, validateSelection } from "../components/career/careerSelectorModel";
import AuthShell from "../components/ui/AuthShell";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { platformService } from "../services/platformService";

export const ONBOARDING_DEFER_KEY = "arrakis:career-onboarding-deferred";

/**
 * Career chooser. New accounts without a career (Google sign-ups) are sent here once; any signed-in
 * user can come back from the dashboard to pick a catalogue role or type their own.
 */
export default function CareerOnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const changing = Boolean(user?.career && !user.career.selectionPending && (user.career.roleId || user.career.title));
  const [step, setStep] = useState(1);
  const [selection, setSelection] = useState(() => (changing ? selectionFromCareer(user.career) : selectionFromCareer(null)));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [impact, setImpact] = useState(null);

  useEffect(() => {
    document.title = "Choose your career | Arrakis Intelligence Platform";
  }, []);

  const save = async (confirm = false) => {
    setBusy(true);
    setError("");
    try {
      const response = await platformService.updateCareer(toCareerPayload(selection), confirm);
      const career = response.data.career;
      setUser((current) => (current ? { ...current, targetRole: career.title, career } : current));
      navigate("/", { replace: true });
    } catch (saveError) {
      if (saveError.statusCode === 409) {
        const preview = await platformService.previewCareer(toCareerPayload(selection)).catch(() => null);
        setImpact(preview?.data?.impact || null);
      } else {
        setError(saveError.message || "Could not save your career. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    const found = validateSelection(selection);
    setErrors(found);
    if (Object.keys(found).length === 0) setStep(2);
  };

  const defer = () => {
    try { sessionStorage.setItem(ONBOARDING_DEFER_KEY, "1"); } catch (_error) { /* storage unavailable */ }
    navigate("/", { replace: true });
  };

  return (
    <AuthShell
      description={changing
        ? `You're currently working toward ${user.career.title}. Search the catalogue or type any role to switch. Your roadmap is rebuilt only after you confirm.`
        : "Pick the career you are working toward, or type your own if it isn't listed. Your roadmap, skill gaps and daily missions are built from it, and you can change it at any time."}
      eyebrow={`Step ${step} of 2`}
      footer={(
        <button className="focus-ring text-sm text-white/60 underline-offset-4 hover:text-white hover:underline" type="button" onClick={defer}>
          {changing ? "Keep my current career" : "Decide later"}
        </button>
      )}
      title={step === 1 ? (changing ? "Change your career" : "What are you working toward?") : "Tune your plan"}
    >
      <div className="grid gap-5">
        {step === 1 ? (
          <CareerRoleSelector errors={errors} idPrefix="onboarding-career" value={selection} onChange={(value) => { setSelection(value); setErrors({}); }} />
        ) : (
          <CareerPreferences idPrefix="onboarding-pref" selection={selection} onChange={setSelection} />
        )}
        {error ? <div className="rounded-card border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100" role="alert">{error}</div> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {step === 2 ? <Button variant="secondary" onClick={() => setStep(1)}>Back</Button> : <span />}
          {step === 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button disabled={busy} onClick={() => save(false)}>{busy ? "Building your roadmap..." : "Build my roadmap"}</Button>
          )}
        </div>
        <p className="text-xs text-white/45">Level and timeline are optional. Skip them and we use sensible defaults.</p>
      </div>
      <CareerChangeDialog
        busy={busy}
        impact={impact}
        open={Boolean(impact)}
        onCancel={() => setImpact(null)}
        onConfirm={() => { setImpact(null); save(true); }}
      />
    </AuthShell>
  );
}
