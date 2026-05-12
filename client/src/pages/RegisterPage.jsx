import { useState } from "react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthShell from "../components/ui/AuthShell";
import Button from "../components/ui/Button";
import GoogleButton from "../components/ui/GoogleButton";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setUser, setAccessToken, setRefreshToken } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    targetRole: "AI Systems Engineer"
  });
  const [error, setError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    document.title = "Register | Arrakis Intelligence Platform";
  }, []);

  const submit = async (event) => {
    event.preventDefault();

    try {
      const response = await authService.register(form);
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);
      navigate("/");
    } catch (registerError) {
      setError(registerError.message || "Unable to register");
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
          <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Name</label>
          <input
            className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
            placeholder="Paul Atreides"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
        </div>
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
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.28em] text-white/45">Target role</label>
          <select
            className="focus-ring w-full rounded-button border border-border-subtle bg-black/20 px-4 py-3"
            value={form.targetRole}
            onChange={(event) => setForm({ ...form, targetRole: event.target.value })}
          >
            <option>AI Systems Engineer</option>
            <option>Product Engineering Lead</option>
          </select>
        </div>
        {error ? (
          <div className="rounded-card border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        <Button className="w-full" type="submit">
          Register
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
