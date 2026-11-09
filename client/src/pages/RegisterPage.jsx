import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import CareerPreferences from "../components/career/CareerPreferences";
import CareerRoleSelector from "../components/career/CareerRoleSelector";
import { emptySelection, selectionTitle, toCareerPayload, validateSelection } from "../components/career/careerSelectorModel";
import AuthShell from "../components/ui/AuthShell";
import Button from "../components/ui/Button";
import GoogleButton from "../components/ui/GoogleButton";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, setAccessToken } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [career, setCareer] = useState(emptySelection);
  const [careerErrors, setCareerErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    document.title = "Register | Arrakis Intelligence Platform";
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const errors = validateSelection(career);
    setCareerErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      // `targetRole` is kept for older API versions; the server derives it from `career`.
      const response = await authService.register({ ...form, targetRole: selectionTitle(career), career: toCareerPayload(career) });
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (registerError) {
      setError(registerError.message || "Unable to register");
    } finally {
      setSubmitting(false);
    }
  };

  const startGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");

    try {
      const response = await authService.googleUrl();
      if (!response.data?.enabled) {
        throw new Error("Google OAuth is not configured for this environment.");
      }

      window.location.href = response.data.url || authService.googleStartUrl();
    } catch (googleAuthError) {
      setError(googleAuthError.message || "Unable to start Google sign-in");
      setGoogleLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Operative onboarding"
      title="Claim your spice path and begin ascension"
      description="Create your identity, choose your target discipline, and let the system enforce your next meaningful progression."
      footer={
        <>
          Already in the sietch?{" "}
          <Link className="text-amber-200 transition hover:text-white" to="/login">
            Login
          </Link>
        </>
      }
    >
      <form className="grid gap-4" onSubmit={submit}>
        <div>
          <label htmlFor="register-name" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Name</label>
          <input
            id="register-name"
            className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
            autoComplete="name"
            required
            placeholder="Paul Atreides"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </div>
        <div>
          <label htmlFor="register-email" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Email</label>
          <input
            id="register-email"
            className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
            autoComplete="email"
            required
            type="email"
            placeholder="operative@arrakis.ai"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </div>
        <div>
          <label htmlFor="register-password" className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Password</label>
          <input
            id="register-password"
            className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
            autoComplete="new-password"
            required
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </div>
        <CareerRoleSelector
          errors={careerErrors}
          idPrefix="register-career"
          value={career}
          onChange={(next) => { setCareer(next); setCareerErrors({}); }}
        />
        {career.roleId ? (
          <details className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
            <summary className="cursor-pointer text-sm font-semibold text-white">Tune your plan (optional)</summary>
            <div className="mt-4">
              <CareerPreferences idPrefix="register-pref" selection={career} onChange={setCareer} />
            </div>
          </details>
        ) : null}
        {error ? (
          <div className="rounded-card border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        <Button className="w-full" disabled={submitting} type="submit">
          {submitting ? "Creating account..." : "Register"}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-white/35">
        <div className="h-px flex-1 bg-white/10" />
        or continue
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <GoogleButton disabled={googleLoading} onClick={startGoogleSignIn} />
    </AuthShell>
  );
}
