import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlassCard from "../components/GlassCard";
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

  const submit = async (event) => {
    event.preventDefault();
    try {
      const response = await authService.register(form);
      setUser(response.data.user);
      setAccessToken(response.data.accessToken);
      setRefreshToken(response.data.refreshToken);
      navigate("/");
    } catch (err) {
      setError(err.message || "Unable to register");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <GlassCard className="w-full max-w-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">Operative Onboarding</p>
        <h1 className="mt-4 font-display text-5xl text-amber-100">Claim Your Spice Path</h1>
        <form className="mt-8 grid gap-4" onSubmit={submit}>
          <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3" value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })}>
            <option>AI Systems Engineer</option>
            <option>Product Engineering Lead</option>
          </select>
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-3 font-semibold text-black">
            Register
          </button>
        </form>
        <p className="mt-6 text-sm text-white/60">
          Already in the sietch? <Link className="text-amber-200" to="/login">Login</Link>
        </p>
      </GlassCard>
    </div>
  );
}
