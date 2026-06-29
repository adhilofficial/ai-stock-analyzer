import {
  BarChart3,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChartCandlestick,
  CircleDollarSign,
  Gauge,
  LayoutDashboard,
  LineChart,
  Settings,
  Sparkles,
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
  {
    label: "About",
    path: "/about",
    icon: Building2,
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

  function handleNavigationClick() {
    if (
      typeof window !== "undefined" &&
      window.innerWidth <= 900
    ) {
      closeSidebar();
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
        aria-label="Application sidebar"
      >
        <div className="exa-sidebar-brand">
          <NavLink
            to="/dashboard"
            className="exa-brand-link"
            onClick={handleNavigationClick}
            aria-label="Open Markets by exa dashboard"
          >
            <ExaBrandLogo showTagline />
          </NavLink>
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
                end={path === "/dashboard"}
                onClick={handleNavigationClick}
                className={({ isActive }) =>
                  isActive
                    ? "exa-sidebar-link active"
                    : "exa-sidebar-link"
                }
              >
                <Icon
                  size={19}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />

                <span>{label}</span>
              </NavLink>
            ),
          )}
        </nav>

        <div className="exa-sidebar-bottom">
          <NavLink
            to="/settings"
            onClick={handleNavigationClick}
            className={({ isActive }) =>
              isActive
                ? "exa-sidebar-link active"
                : "exa-sidebar-link"
            }
          >
            <Settings
              size={19}
              strokeWidth={1.8}
              aria-hidden="true"
            />

            <span>Settings</span>
          </NavLink>

          <div className="exa-upgrade-card">
            <div className="exa-upgrade-heading">
              <span className="exa-upgrade-icon">
                <CircleDollarSign
                  size={18}
                  aria-hidden="true"
                />
              </span>

              <strong>EXA Pro</strong>
            </div>

            <p>
              Unlock advanced AI research,
              portfolio analytics and premium
              market insights.
            </p>

            <button type="button">
              <LineChart
                size={15}
                aria-hidden="true"
              />
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