import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/ui/AuthShell";
import Card from "../components/ui/Card";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAccessToken, setUser } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const completeGoogleAuth = async () => {
      try {
        if (searchParams.get("auth") !== "success") {
          throw new Error("Google sign-in did not complete successfully.");
        }

        const refreshResponse = await authService.refresh();
        const accessToken = refreshResponse.data?.accessToken || null;

        if (!accessToken) {
          throw new Error("No access token was issued for this session.");
        }

        setAccessToken(accessToken);
        const meResponse = await authService.me();
        setUser(meResponse.data);
        navigate("/", { replace: true });
      } catch (_error) {
        setError("Google sign-in could not be completed. Please try again.");
        setTimeout(() => {
          navigate("/login?error=google_auth_failed", { replace: true });
        }, 1500);
      }
    };

    completeGoogleAuth().catch(() => {});
  }, [navigate, searchParams, setAccessToken, setUser]);

  return (
    <AuthShell
      eyebrow="Google OAuth"
      title="Binding your Arrakis identity"
      description="The prescience layer is securing your session and restoring your operative state."
      footer="You will be redirected automatically."
    >
      <Card interactive={false} className="bg-white/4 text-center">
        <div className="text-sm uppercase tracking-[0.32em] text-white/45">Redirecting</div>
        <div className="mt-3 font-display text-3xl text-white">Completing authentication...</div>
        {error ? <div className="mt-4 text-sm text-red-100">{error}</div> : null}
      </Card>
    </AuthShell>
  );
}
