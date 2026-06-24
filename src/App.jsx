import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Navbar from
  "./components/Navbar";

import Dashboard from
  "./pages/Dashboard";

import Analyze from
  "./pages/Analyze";

import ComingSoon from
  "./pages/ComingSoon";

function AppRoutes() {
  const location =
    useLocation();

  const usesNewDashboardShell =
    location.pathname ===
      "/dashboard" ||
    location.pathname === "/";

  return (
    <>
      {!usesNewDashboardShell && (
        <Navbar />
      )}

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
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}