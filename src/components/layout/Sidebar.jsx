import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  ChartCandlestick,
  CircleDollarSign,
  Gauge,
  LayoutDashboard,
  LineChart,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

import { NavLink } from "react-router-dom";

import ExaBrandLogo from "./ExaBrandLogo";

const NAVIGATION_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Stock Analysis",
    path: "/analyze",
    icon: ChartCandlestick,
  },
  {
    label: "Stock Screener",
    path: "/screener",
    icon: BarChart3,
  },
  {
    label: "Portfolio",
    path: "/portfolio",
    icon: BriefcaseBusiness,
  },
  {
    label: "Market Pulse",
    path: "/market-pulse",
    icon: Gauge,
  },
  {
    label: "AI Research",
    path: "/research",
    icon: Sparkles,
  },
  {
    label: "Alerts",
    path: "/alerts",
    icon: Bell,
  },
  {
    label: "Learn",
    path: "/learn",
    icon: BookOpen,
  },
];

export default function Sidebar({
  isOpen = false,
  onClose,
}) {
  function closeSidebar() {
    if (typeof onClose === "function") {
      onClose();
    }
  }

  return (
    <>
      <button
        type="button"
        className={
          isOpen
            ? "exa-sidebar-overlay visible"
            : "exa-sidebar-overlay"
        }
        aria-label="Close navigation"
        onClick={closeSidebar}
      />

      <aside
        className={
          isOpen
            ? "exa-sidebar open"
            : "exa-sidebar"
        }
      >
        <div className="exa-sidebar-brand">
          <NavLink
            to="/dashboard"
            className="exa-brand-link"
            onClick={closeSidebar}
            aria-label="Open EXA Dashboard"
          >
            <ExaBrandLogo />
          </NavLink>

          <button
            type="button"
            className="exa-sidebar-close"
            aria-label="Close navigation"
            onClick={closeSidebar}
          >
            <X size={19} />
          </button>
        </div>

        <nav
          className="exa-sidebar-navigation"
          aria-label="Primary navigation"
        >
          <p className="exa-sidebar-section-label">
            WORKSPACE
          </p>

          {NAVIGATION_ITEMS.map(
            ({
              label,
              path,
              icon: Icon,
            }) => (
              <NavLink
                key={path}
                to={path}
                onClick={closeSidebar}
                className={({ isActive }) =>
                  isActive
                    ? "exa-sidebar-link active"
                    : "exa-sidebar-link"
                }
              >
                <Icon
                  size={17}
                  strokeWidth={1.8}
                />

                <span>{label}</span>
              </NavLink>
            ),
          )}
        </nav>

        <div className="exa-sidebar-bottom">
          <NavLink
            to="/settings"
            className="exa-sidebar-link"
            onClick={closeSidebar}
          >
            <Settings
              size={17}
              strokeWidth={1.8}
            />

            <span>Settings</span>
          </NavLink>

          <div className="exa-upgrade-card">
            <div className="exa-upgrade-heading">
              <span className="exa-upgrade-icon">
                <CircleDollarSign size={18} />
              </span>

              <strong>EXA Pro</strong>
            </div>

            <p>
              Unlock advanced AI research,
              portfolio analytics and premium
              market insights.
            </p>

            <button type="button">
              <LineChart size={15} />
              Explore Pro
            </button>
          </div>

          <p className="exa-sidebar-disclaimer">
            Educational market research platform.
          </p>
        </div>
      </aside>
    </>
  );
}
