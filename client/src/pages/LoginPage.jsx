import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setAccessToken, setRefreshToken } = useAuth();
  const [form, setForm] = useState({ email: "paul@arrakis.ai", password: "Arrakis@123" });
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await authService.login(form);
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <GlassCard className="w-full max-w-lg">
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Arrakis Intelligence Platform</p>
        <h1 className="mt-4 font-display text-5xl text-amber-100">Enter the Sietch</h1>
        <form className="mt-8 space-y-4" onSubmit={submit}>
          <input className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 font-semibold text-black">
            Login
          </button>
        </form>
        <p className="mt-6 text-sm text-white/60">
          New operative? <Link className="text-amber-200" to="/register">Create an account</Link>
        </p>
      </GlassCard>
    </div>
  );
}
