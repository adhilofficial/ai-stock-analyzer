import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Check,
  CheckCheck,
  Gauge,
  Inbox,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppShell from
  "../components/layout/AppShell";

import useAutoRefresh from
  "../hooks/useAutoRefresh";

import {
  loadAlertCenterData,
} from "../services/alertCenter";

import {
  ALERT_CENTER_STATE_KEY,
  ALERT_CENTER_UPDATED_EVENT,
  dismissAlert,
  getActiveAlerts,
  isAlertRead,
  markAlertRead,
  markAllAlertsRead,
  readAlertCenterCache,
  readAlertCenterState,
  restoreDismissedAlerts,
} from "../utils/alertStorage";

import "../styles/dashboard.css";
import "../styles/dashboard-v2.css";
import "../styles/alerts.css";

const CATEGORY_OPTIONS = [
  ["all", "All categories"],
  ["market", "Market"],
  ["risk", "Market risk"],
  ["sector", "Sectors"],
  ["technical", "Technical"],
  ["volume", "Volume"],
  ["watchlist", "Watchlist"],
  ["portfolio", "Portfolio"],
];

const SEVERITY_OPTIONS = [
  ["all", "All severities"],
  ["critical", "Critical"],
  ["high", "High"],
  ["moderate", "Moderate"],
  ["information", "Information"],
];

const STATUS_OPTIONS = [
  ["all", "All alerts"],
  ["unread", "Unread"],
  ["read", "Read"],
  ["personalized", "Personalized"],
];

function cleanText(value) {
  return String(value ?? "").trim();
}

function formatTimestamp(value) {
  if (!value) {
    return "Not refreshed yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return cleanText(value) || "Unknown";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function getAlertVisual(alert) {
  const category = cleanText(alert?.category).toLowerCase();
  const type = cleanText(alert?.type).toLowerCase();

  if (category === "portfolio") {
    return {
      Icon: BriefcaseBusiness,
      label: "Portfolio",
    };
  }

  if (category === "watchlist") {
    return {
      Icon: Bookmark,
      label: "Watchlist",
    };
  }

  if (category === "volume" || type.includes("volume")) {
    return {
      Icon: BarChart3,
      label: "Volume",
    };
  }

  if (category === "technical") {
    return {
      Icon: Activity,
      label: "Technical",
    };
  }

  if (category === "risk") {
    return {
      Icon: ShieldAlert,
      label: "Risk",
    };
  }

  if (category === "sector") {
    return {
      Icon: Gauge,
      label: "Sector",
    };
  }

  if (alert?.personalized) {
    return {
      Icon: Sparkles,
      label: "Personalized",
    };
  }

  return {
    Icon: Bell,
    label: "Market",
  };
}

function AlertSummaryCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "",
}) {
  return (
    <article className={`exa-alert-summary-card ${tone}`}>
      <span className="exa-alert-summary-icon">
        <Icon size={17} />
      </span>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </article>
  );
}

export default function Alerts() {
  const navigate = useNavigate();

  const cachedData = readAlertCenterCache();

  const [alerts, setAlerts] = useState(cachedData.alerts);
  const [metadata, setMetadata] = useState({
    fetchedAt: cachedData.fetchedAt,
    source: cachedData.source,
    watchlistCount: 0,
    portfolioCount: 0,
    personalizedCount: cachedData.alerts.filter(
      (alert) => alert.personalized,
    ).length,
    partialFailure: false,
  });
  const [alertState, setAlertState] = useState(
    readAlertCenterState,
  );
  const [loading, setLoading] = useState(
    cachedData.alerts.length === 0,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadAlerts = useCallback(
    async ({ refresh = false, signal } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const data = await loadAlertCenterData({
          refresh,
          signal,
        });

        setAlerts(data.alerts);
        setMetadata(data);
      } catch (caughtError) {
        if (caughtError?.name === "AbortError") {
          return;
        }

        console.error("Alert-center loading error:", caughtError);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load market alerts.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const controller = new AbortController();

    loadAlerts({
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadAlerts]);

  useAutoRefresh(
    () => {
      loadAlerts({
        refresh: true,
      });
    },
    5 * 60 * 1000,
  );

  useEffect(() => {
    function handleAlertCenterUpdate() {
      setAlertState(readAlertCenterState());
    }

    function handleStorage(event) {
      if (event.key === ALERT_CENTER_STATE_KEY) {
        setAlertState(readAlertCenterState());
      }
    }

    window.addEventListener(
      ALERT_CENTER_UPDATED_EVENT,
      handleAlertCenterUpdate,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        ALERT_CENTER_UPDATED_EVENT,
        handleAlertCenterUpdate,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const activeAlerts = useMemo(
    () => getActiveAlerts(alerts, alertState),
    [alerts, alertState],
  );

  const unreadCount = useMemo(
    () =>
      activeAlerts.filter(
        (alert) => !isAlertRead(alert.id, alertState),
      ).length,
    [activeAlerts, alertState],
  );

  const highPriorityCount = useMemo(
    () =>
      activeAlerts.filter((alert) =>
        ["critical", "high"].includes(alert.severity),
      ).length,
    [activeAlerts],
  );

  const personalizedCount = useMemo(
    () => activeAlerts.filter((alert) => alert.personalized).length,
    [activeAlerts],
  );

  const filteredAlerts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activeAlerts.filter((alert) => {
      if (
        categoryFilter !== "all" &&
        alert.category !== categoryFilter
      ) {
        return false;
      }

      if (
        severityFilter !== "all" &&
        alert.severity !== severityFilter
      ) {
        return false;
      }

      const read = isAlertRead(alert.id, alertState);

      if (statusFilter === "unread" && read) {
        return false;
      }

      if (statusFilter === "read" && !read) {
        return false;
      }

      if (statusFilter === "personalized" && !alert.personalized) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        alert.title,
        alert.message,
        alert.symbol,
        alert.category,
        alert.severity,
        alert.source,
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    activeAlerts,
    alertState,
    categoryFilter,
    searchQuery,
    severityFilter,
    statusFilter,
  ]);

  function refreshAlertState() {
    setAlertState(readAlertCenterState());
  }

  function handleToggleRead(alert) {
    const currentlyRead = isAlertRead(alert.id, alertState);
    markAlertRead(alert.id, !currentlyRead);
    refreshAlertState();
  }

  function handleMarkAllRead() {
    markAllAlertsRead(activeAlerts);
    refreshAlertState();
  }

  function handleDismiss(alert) {
    dismissAlert(alert.id);
    refreshAlertState();
  }

  function handleRestoreDismissed() {
    restoreDismissedAlerts();
    refreshAlertState();
  }

  function handleOpenAnalysis(alert) {
    if (!alert.symbol) {
      return;
    }

    markAlertRead(alert.id, true);
    navigate(
      `/analyze?query=${encodeURIComponent(alert.symbol)}`,
    );
  }

  const dismissedCount = alertState.dismissedIds.length;

  return (
    <AppShell>
      <main className="exa-alert-page">
        <div className="exa-alert-container">
          <header className="exa-alert-page-header">
            <div>
              <p className="exa-alert-eyebrow">
                EXA INTELLIGENCE
              </p>

              <h1>Smart Alerts</h1>

              <p className="exa-alert-subtitle">
                Live market activity combined with your watchlist and
                portfolio exposure. Alerts are educational indicators,
                not personalized buy or sell recommendations.
              </p>
            </div>

            <div className="exa-alert-header-actions">
              {dismissedCount > 0 && (
                <button
                  type="button"
                  className="exa-alert-secondary-button"
                  onClick={handleRestoreDismissed}
                >
                  <RotateCcw size={15} />
                  Restore dismissed ({dismissedCount})
                </button>
              )}

              <button
                type="button"
                className="exa-alert-secondary-button"
                onClick={handleMarkAllRead}
                disabled={unreadCount === 0}
              >
                <CheckCheck size={15} />
                Mark all read
              </button>

              <button
                type="button"
                className="exa-alert-refresh-button"
                onClick={() =>
                  loadAlerts({
                    refresh: true,
                  })
                }
                disabled={refreshing}
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "spinning" : ""}
                />
                {refreshing ? "Refreshing" : "Refresh"}
              </button>
            </div>
          </header>

          <section className="exa-alert-summary-grid">
            <AlertSummaryCard
              icon={Bell}
              label="Active alerts"
              value={activeAlerts.length}
              note="After dismissed alerts are removed"
            />

            <AlertSummaryCard
              icon={Inbox}
              label="Unread"
              value={unreadCount}
              note="Synced with the topbar badge"
              tone="information"
            />

            <AlertSummaryCard
              icon={ShieldAlert}
              label="High priority"
              value={highPriorityCount}
              note="High and critical severity"
              tone="danger"
            />

            <AlertSummaryCard
              icon={Sparkles}
              label="Personalized"
              value={personalizedCount}
              note={`${metadata.watchlistCount || 0} watchlist · ${
                metadata.portfolioCount || 0
              } portfolio symbols`}
              tone="personalized"
            />
          </section>

          <section className="exa-alert-toolbar">
            <label className="exa-alert-search">
              <Search size={16} />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search title, company, symbol or category"
                aria-label="Search alerts"
              />
            </label>

            <div className="exa-alert-filter-group">
              <SlidersHorizontal size={15} />

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(event.target.value)
                }
                aria-label="Filter alerts by category"
              >
                {CATEGORY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(event.target.value)
                }
                aria-label="Filter alerts by severity"
              >
                {SEVERITY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                aria-label="Filter alerts by status"
              >
                {STATUS_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <div className="exa-alert-meta-row">
            <span>
              Showing {filteredAlerts.length} of {activeAlerts.length}
            </span>

            <span>
              Updated {formatTimestamp(metadata.fetchedAt)}
              {metadata.source ? ` · ${metadata.source}` : ""}
            </span>
          </div>

          {metadata.partialFailure && (
            <div className="exa-alert-notice warning">
              Some personalized data sources were unavailable. The
              available alert sources are still displayed.
            </div>
          )}

          {error && (
            <div className="exa-alert-notice error">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="exa-alert-loading-state">
              <LoaderCircle className="spinning" size={28} />
              <strong>Building your alert center</strong>
              <span>
                Checking the market, watchlist, portfolio and Screener
                snapshot.
              </span>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="exa-alert-empty-state">
              <Inbox size={30} />
              <strong>No matching alerts</strong>
              <span>
                Change the filters or refresh to check the latest market
                activity.
              </span>
            </div>
          ) : (
            <section className="exa-alert-list" aria-live="polite">
              {filteredAlerts.map((alert) => {
                const { Icon, label } = getAlertVisual(alert);
                const read = isAlertRead(alert.id, alertState);

                return (
                  <article
                    key={alert.id}
                    className={`exa-alert-card severity-${
                      alert.severity
                    } ${read ? "read" : "unread"}`}
                  >
                    <div className="exa-alert-card-icon">
                      <Icon size={20} />
                    </div>

                    <div className="exa-alert-card-content">
                      <div className="exa-alert-card-topline">
                        <div className="exa-alert-badges">
                          <span
                            className={`exa-alert-severity severity-${
                              alert.severity
                            }`}
                          >
                            {alert.severity}
                          </span>

                          <span className="exa-alert-category">
                            {label}
                          </span>

                          {alert.personalized && (
                            <span className="exa-alert-personalized">
                              <Sparkles size={11} />
                              Personalized
                            </span>
                          )}

                          {!read && (
                            <span className="exa-alert-unread-label">
                              New
                            </span>
                          )}
                        </div>

                        <span className="exa-alert-time">
                          {alert.time || "Latest update"}
                        </span>
                      </div>

                      <h2>{alert.title}</h2>
                      <p>{alert.message}</p>

                      <div className="exa-alert-card-footer">
                        <span>
                          {alert.symbol || alert.source || "EXA market intelligence"}
                        </span>

                        <div className="exa-alert-card-actions">
                          <button
                            type="button"
                            className="exa-alert-icon-action"
                            onClick={() => handleToggleRead(alert)}
                            title={read ? "Mark unread" : "Mark read"}
                            aria-label={read ? "Mark alert unread" : "Mark alert read"}
                          >
                            {read ? <Bell size={14} /> : <Check size={14} />}
                          </button>

                          <button
                            type="button"
                            className="exa-alert-icon-action danger"
                            onClick={() => handleDismiss(alert)}
                            title="Dismiss alert"
                            aria-label="Dismiss alert"
                          >
                            <Trash2 size={14} />
                          </button>

                          {alert.symbol && (
                            <button
                              type="button"
                              className="exa-alert-analyze-button"
                              onClick={() => handleOpenAnalysis(alert)}
                            >
                              Analyze
                              <ArrowRight size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          )}
        </div>
      </main>
    </AppShell>
  );
}