import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/ui/AuthShell";
import Button from "../components/ui/Button";
import GoogleButton from "../components/ui/GoogleButton";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser, setAccessToken, setRefreshToken } = useAuth();
  const [form, setForm] = useState({ email: "paul@arrakis.ai", password: "Arrakis@123" });
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleError = useMemo(() => {
    const value = searchParams.get("error");
    return value === "google_auth_failed"
      ? "Google sign-in was not completed. Please try again."
      : "";
  }, [searchParams]);

  const submit = async (event) => {
    event.preventDefault();

    try {
      const response = await authService.login(form);
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);
      navigate("/");
    } catch (loginError) {
      setError(loginError.message || "Unable to login");
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
      eyebrow="Operative access"
      title="Enter the Arrakis intelligence grid"
      description="Restore your focus state, leaderboard rank, and live prescience insights from any device."
      footer={
        <>
          New operative?{" "}
          <Link className="text-amber-200 transition hover:text-white" to="/register">
            Create an account
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={submit}>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Email</label>
          <input
            className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
            placeholder="operative@arrakis.ai"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
          />
        </div>
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Password</label>
          <input
            className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
          />
        </div>
        {error || googleError ? (
          <div className="rounded-card border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error || googleError}
          </div>
        ) : null}
        <Button className="w-full" type="submit">
          Login
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
