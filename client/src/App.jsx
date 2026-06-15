import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import LoadingScreen from "./components/ui/LoadingScreen";
import { useAuth } from "./hooks/useAuth";
import AuthCallbackPage from "./pages/AuthCallbackPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import SettingsPage from "./pages/SettingsPage";
import Privacy from "./pages/Privacy";


const ProtectedRoute = ({ children }) => {
  const { accessToken, bootstrapping } = useAuth();
  const location = useLocation();

  if (bootstrapping) {
    return <LoadingScreen label="Restoring your session..." />;
  }

  return accessToken ? children : <Navigate to="/login" replace state={{ from: location }} />;
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
      <Route path="*" element={<NotFoundPage />} />
      <Route path="/privacy" element={<Privacy />} />
    </Routes>
  );
}
