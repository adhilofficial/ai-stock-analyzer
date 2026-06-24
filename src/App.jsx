import {
  lazy,
  Suspense,
} from "react";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import ErrorBoundary from
  "./components/ErrorBoundary";

import Navbar from
  "./components/Navbar";

const Dashboard = lazy(() =>
  import("./pages/Dashboard"),
);

const Analyze = lazy(() =>
  import("./pages/Analyze"),
);

const ComingSoon = lazy(() =>
  import("./pages/ComingSoon"),
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

function AppRoutes() {
  const location =
    useLocation();

  const usesNewDashboardShell =
    location.pathname === "/" ||
    location.pathname.startsWith(
      "/dashboard",
    );

  return (
    <>
      {!usesNewDashboardShell && (
        <Navbar />
      )}

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
            path="/screener"
            element={<ComingSoon />}
          />

          <Route
            path="/portfolio"
            element={<ComingSoon />}
          />

          <Route
            path="/market-pulse"
            element={<ComingSoon />}
          />

          <Route
            path="/research"
            element={<ComingSoon />}
          />

          <Route
            path="/alerts"
            element={<ComingSoon />}
          />

          <Route
            path="/learn"
            element={<ComingSoon />}
          />

          <Route
            path="/settings"
            element={<ComingSoon />}
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
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

