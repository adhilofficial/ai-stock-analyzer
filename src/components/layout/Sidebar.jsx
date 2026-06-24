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

import {
  NavLink,
} from "react-router-dom";

const NAVIGATION_ITEMS = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Analyze",
    path: "/analyze",
    icon: ChartCandlestick,
  },
  {
    label: "Screener",
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
    label: "Research",
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
        onClick={onClose}
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
            onClick={onClose}
          >
            <div className="exa-brand-word">
              EXA
            </div>

            <span>
              AI Stock Analyzer
            </span>
          </NavLink>

          <button
            type="button"
            className="exa-sidebar-close"
            aria-label="Close navigation"
            onClick={onClose}
          >
            <X size={20} />
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
                onClick={onClose}
                className={({
                  isActive,
                }) =>
                  isActive
                    ? "exa-sidebar-link active"
                    : "exa-sidebar-link"
                }
              >
                <Icon
                  size={18}
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
            onClick={onClose}
          >
            <Settings
              size={18}
              strokeWidth={1.8}
            />

            <span>Settings</span>
          </NavLink>

          <div className="exa-upgrade-card">
            <div className="exa-upgrade-icon">
              <CircleDollarSign
                size={20}
              />
            </div>

            <strong>
              EXA Pro
            </strong>

            <p>
              Unlock advanced AI research,
              portfolio analytics and
              premium insights.
            </p>

            <button type="button">
              <LineChart size={16} />
              Explore Pro
            </button>
          </div>

          <p className="exa-sidebar-disclaimer">
            Market intelligence for
            educational research.
          </p>
        </div>
      </aside>
    </>
  );
}