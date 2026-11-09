import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoadingScreen from "./components/ui/LoadingScreen";
import { useAuth } from "./hooks/useAuth";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import CareerOnboardingPage, { ONBOARDING_DEFER_KEY } from "./pages/CareerOnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";
import Privacy from "./pages/Privacy";

const ONBOARDING_PATH = "/onboarding/career";

const onboardingDeferred = () => {
  try {
    return sessionStorage.getItem(ONBOARDING_DEFER_KEY) === "1";
  } catch (_error) {
    return false;
  }
};

const ProtectedRoute = ({ children }) => {
  const { accessToken, bootstrapping, user } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return <LoadingScreen label="Restoring your session..." />;
  }

  if (!accessToken) return <Navigate to="/login" replace state={{ from: location }} />;

  // New accounts that have not chosen a career (Google sign-ups) see career onboarding once.
  // Existing accounts never carry this flag, so they are not interrupted.
  if (user?.career?.selectionPending && location.pathname !== ONBOARDING_PATH && !onboardingDeferred()) {
    return <Navigate to={ONBOARDING_PATH} replace />;
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const { accessToken, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return <LoadingScreen label="Restoring your session..." />;
  }

  if (accessToken) {
    const fallback = location.state?.from?.pathname || "/";
    return <Navigate to={fallback} replace />;
  }

  return children;
};

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route
        path={ONBOARDING_PATH}
        element={
          <ProtectedRoute>
            <CareerOnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
