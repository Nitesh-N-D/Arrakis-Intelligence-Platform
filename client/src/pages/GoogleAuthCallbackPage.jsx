import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AuthShell from "../components/ui/AuthShell";
import Button from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

export default function GoogleAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAccessToken, setRefreshToken, setUser } = useAuth();
  const [status, setStatus] = useState("Verifying Google identity with Arrakis...");
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("Google did not return an authorization code.");
      setStatus("");
      return;
    }

    authService
      .googleCallback(code)
      .then((response) => {
        setUser(response.data.user);
        setAccessToken(response.data.accessToken);
        setRefreshToken(response.data.refreshToken);
        navigate("/", { replace: true });
      })
      .catch((callbackError) => {
        setError(
          callbackError.message ||
            "Unable to complete Google login. Confirm that GOOGLE_REDIRECT_URI matches the frontend callback URL."
        );
        setStatus("");
      });
  }, [navigate, searchParams, setAccessToken, setRefreshToken, setUser]);

  return (
    <AuthShell
      eyebrow="Google Federation"
      title="Authorizing your Arrakis operative profile"
      description="We are sealing the OAuth handshake and loading your behavioral intelligence workspace."
    >
      <div className="text-sm uppercase tracking-[0.3em] text-white/45">OAuth callback</div>
      <div className="mt-4 font-display text-4xl text-white">
        {error ? "Access interrupted" : "Identity handshake in progress"}
      </div>
      {status ? <div className="mt-4 text-white/60">{status}</div> : null}
      {error ? <div className="mt-6 rounded-card border border-red-300/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      {error ? (
        <Button className="mt-6" variant="secondary" onClick={() => navigate("/login")}>
          Return to login
        </Button>
      ) : null}
    </AuthShell>
  );
}
