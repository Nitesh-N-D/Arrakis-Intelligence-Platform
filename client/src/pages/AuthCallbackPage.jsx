import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/ui/AuthShell";
import Card from "../components/ui/Card";
import { useAuth } from "../hooks/useAuth";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAccessToken, setRefreshToken } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");

    if (accessToken) {
      setAccessToken(accessToken);
      setRefreshToken(null);
      navigate("/", { replace: true });
      return;
    }

    navigate("/login?error=google_auth_failed", { replace: true });
  }, [navigate, searchParams, setAccessToken, setRefreshToken]);

  return (
    <AuthShell
      eyebrow="Google OAuth"
      title="Binding your Arrakis identity"
      description="The prescience layer is securing your access tokens and restoring your operative state."
      footer="You will be redirected automatically."
    >
      <Card interactive={false} className="bg-white/4 text-center">
        <div className="text-sm uppercase tracking-[0.32em] text-white/45">Redirecting</div>
        <div className="mt-3 font-display text-3xl text-white">Completing authentication...</div>
      </Card>
    </AuthShell>
  );
}
