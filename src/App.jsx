import {
  lazy,
  Suspense,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ErrorBoundary from
  "./components/ErrorBoundary";

import NetworkStatusBanner from
  "./components/NetworkStatusBanner";

import ProtectedRoute from
  "./components/ProtectedRoute";

import AppShell from
  "./components/layout/AppShell";

import { useAuth } from
  "./context/AuthContext";

import Screener from "./pages/Screener";
import Compare from "./pages/Compare";
import Portfolio from "./pages/Portfolio";

const Dashboard = lazy(() =>
  import("./pages/Dashboard")
);

const Analyze = lazy(() =>
  import("./pages/Analyze")
);

const MarketPulse = lazy(() =>
  import("./pages/MarketPulse")
);

const ComingSoon = lazy(() =>
  import("./pages/ComingSoon")
);

const Alerts = lazy(() =>
  import("./pages/Alerts")
);

const AIResearch = lazy(() =>
  import("./pages/AIResearch")
);

const Disclaimer = lazy(() =>
  import("./pages/Disclaimer")
);

const Methodology = lazy(() =>
  import("./pages/Methodology")
);

const About = lazy(() =>
  import("./pages/About")
);

const Login = lazy(() =>
  import("./pages/Login")
);
const ForgotPassword = lazy(() =>
  import("./pages/ForgotPassword")
);
const ResetPassword = lazy(() =>
  import("./pages/ResetPassword")
);

function PageLoader() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "radial-gradient(circle at top, var(--exa-primary-soft) 0%, var(--exa-background) 62%)",
        color: "var(--exa-text-secondary)",
        fontFamily:
          "Inter, system-ui, sans-serif",
      }}
    >
      Loading Litses...
    </div>
  );
}

function PremiumComingSoon() {
  return (
    <AppShell>
      <ComingSoon />
    </AppShell>
  );
}

function AppRoutes() {
  const {
    user,
    loading,
  } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to={
                user
                  ? "/dashboard"
                  : "/login"
              }
              replace
            />
          }
        />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to="/dashboard"
                replace
              />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analyze"
          element={
            <ProtectedRoute>
              <Analyze />
            </ProtectedRoute>
          }
        />

        <Route
          path="/portfolio"
          element={
            <ProtectedRoute>
              <Portfolio />
            </ProtectedRoute>
          }
        />

        <Route
          path="/screener"
          element={
            <ProtectedRoute>
              <Screener />
            </ProtectedRoute>
          }
        />

        <Route
          path="/market-pulse"
          element={
            <ProtectedRoute>
              <MarketPulse />
            </ProtectedRoute>
          }
        />

        <Route
          path="/research"
          element={
            <ProtectedRoute>
              <AIResearch />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <Alerts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/learn"
          element={
            <ProtectedRoute>
              <PremiumComingSoon />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PremiumComingSoon />
            </ProtectedRoute>
          }
        />

        <Route
          path="/compare"
          element={
            <ProtectedRoute>
              <Compare />
            </ProtectedRoute>
          }
        />

        {/* Public information pages */}

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/disclaimer"
          element={<Disclaimer />}
        />

        <Route
          path="/methodology"
          element={<Methodology />}
        />

        <Route
          path="*"
          element={
            <Navigate
              to={
                user
                  ? "/dashboard"
                  : "/login"
              }
              replace
            />
               }
        />

        <Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>
      </Routes>
    </Suspense>
  );
  <Route
  path="/reset-password"
  element={<ResetPassword />}
/>
}

export default function App() {
  return (
    <ErrorBoundary>
      <NetworkStatusBanner />

      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
