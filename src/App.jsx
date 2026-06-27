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

import AppShell from
  "./components/layout/AppShell";

const Dashboard = lazy(() =>
  import("./pages/Dashboard"),
);

const Analyze = lazy(() =>
  import("./pages/Analyze"),
);

const ComingSoon = lazy(() =>
  import("./pages/ComingSoon"),
);
import Screener from "./pages/Screener";

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
        background: "#050914",
        color: "#a8b3cf",
        fontFamily:
          "Inter, system-ui, sans-serif",
      }}
    >
      Loading EXA...
    </div>
  );
}

/*
 * All unfinished routes use the same
 * premium sidebar and topbar as Dashboard.
 */
function PremiumComingSoon() {
  return (
    <AppShell>
      <ComingSoon />
    </AppShell>
  );
}

function AppRoutes() {
  return (
    <Suspense
      fallback={<PageLoader />}
    >
      <Routes>
        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/analyze"
          element={<Analyze />}
        />

        <Route
          path="/portfolio"
          element={
            <PremiumComingSoon />
          }
        />

        <Route
  path="/screener"
  element={<Screener />}
/>

        <Route
          path="/market-pulse"
          element={
            <PremiumComingSoon />
          }
        />

        <Route
          path="/research"
          element={
            <PremiumComingSoon />
          }
        />

        <Route
          path="/alerts"
          element={
            <PremiumComingSoon />
          }
        />

        <Route
          path="/learn"
          element={
            <PremiumComingSoon />
          }
        />

        <Route
          path="/settings"
          element={
            <PremiumComingSoon />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />
      </Routes>
    </Suspense>
  );
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
