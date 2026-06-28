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
  Clock3,
  Gauge,
  Inbox,
  LoaderCircle,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  X,
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
  searchAlertRuleStocks,
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

import {
  CUSTOM_ALERT_CONDITIONS,
  CUSTOM_ALERT_RULES_STORAGE_KEY,
  CUSTOM_ALERT_RULES_UPDATED_EVENT,
  deleteCustomAlertRule,
  formatCustomAlertTarget,
  getCustomAlertCondition,
  readCustomAlertRules,
  setCustomAlertRuleStatus,
  upsertCustomAlertRule,
} from "../utils/customAlertRules";

import "../styles/dashboard.css";
import "../styles/dashboard-v2.css";
import "../styles/alerts.css";

const CATEGORY_OPTIONS = [
  ["all", "All categories"],
  ["custom", "Custom rules"],
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

function formatCompactTimestamp(value) {
  if (!value) {
    return "Not checked yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not checked yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function getAlertVisual(alert) {
  const category = cleanText(alert?.category).toLowerCase();
  const type = cleanText(alert?.type).toLowerCase();

  if (type === "custom-rule" || category === "custom") {
    return {
      Icon: Target,
      label: "Custom rule",
    };
  }

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

function RuleStatusBadge({ status }) {
  const normalized = ["active", "paused", "triggered"].includes(status)
    ? status
    : "active";

  return (
    <span className={`exa-rule-status ${normalized}`}>
      {normalized}
    </span>
  );
}

function CustomRuleCard({
  rule,
  onEdit,
  onDelete,
  onStatusChange,
  onAnalyze,
}) {
  const status = rule.status || "active";
  const condition = getCustomAlertCondition(rule.condition);

  return (
    <article className={`exa-custom-rule-card status-${status}`}>
      <div className="exa-custom-rule-card-top">
        <span className="exa-custom-rule-icon">
          <Target size={17} />
        </span>

        <div className="exa-custom-rule-company">
          <strong>{rule.companyName || rule.symbol}</strong>
          <span>
            {rule.symbol}
            {rule.exchange ? ` · ${rule.exchange}` : ""}
          </span>
        </div>

        <RuleStatusBadge status={status} />
      </div>

      <div className="exa-custom-rule-condition">
        <span>{condition.shortLabel}</span>
        <strong>{formatCustomAlertTarget(rule)}</strong>
      </div>

      <div className="exa-custom-rule-meta">
        <span>
          <Clock3 size={12} />
          {status === "triggered"
            ? `Triggered ${formatCompactTimestamp(rule.lastTriggeredAt)}`
            : `Checked ${formatCompactTimestamp(rule.lastEvaluatedAt)}`}
        </span>

        {rule.lastValue !== null && rule.lastValue !== undefined && (
          <span>Latest value: {Number(rule.lastValue).toFixed(2)}</span>
        )}
      </div>

      <div className="exa-custom-rule-actions">
        <button
          type="button"
          onClick={() => onEdit(rule)}
          title="Edit rule"
        >
          <Pencil size={13} />
          Edit
        </button>

        {status === "active" ? (
          <button
            type="button"
            onClick={() => onStatusChange(rule, "paused")}
          >
            <Pause size={13} />
            Pause
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onStatusChange(rule, "active")}
          >
            {status === "triggered" ? (
              <RotateCcw size={13} />
            ) : (
              <Play size={13} />
            )}
            {status === "triggered" ? "Re-arm" : "Resume"}
          </button>
        )}

        <button
          type="button"
          onClick={() => onAnalyze(rule.symbol)}
          title="Analyze stock"
        >
          <ArrowRight size={13} />
          Analyze
        </button>

        <button
          type="button"
          className="danger"
          onClick={() => onDelete(rule)}
          title="Delete rule"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </article>
  );
}

function createEmptyRuleForm() {
  const condition = CUSTOM_ALERT_CONDITIONS[0];

  return {
    searchQuery: "",
    symbol: "",
    companyName: "",
    exchange: "NSE",
    condition: condition.value,
    targetValue: String(condition.defaultValue),
  };
}

function RuleEditorModal({
  open,
  editingRule,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(createEmptyRuleForm);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const selectedCondition = useMemo(
    () => getCustomAlertCondition(form.condition),
    [form.condition],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    if (editingRule) {
      setForm({
        searchQuery: editingRule.companyName || editingRule.symbol,
        symbol: editingRule.symbol,
        companyName: editingRule.companyName || editingRule.symbol,
        exchange: editingRule.exchange || "NSE",
        condition: editingRule.condition,
        targetValue: String(editingRule.targetValue),
      });
    } else {
      setForm(createEmptyRuleForm());
    }

    setResults([]);
    setError("");
  }, [editingRule, open]);

  useEffect(() => {
    if (!open || form.symbol || form.searchQuery.trim().length < 2) {
      setResults([]);
      setSearching(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearching(true);
      setError("");

      try {
        const stocks = await searchAlertRuleStocks(
          form.searchQuery,
          { signal: controller.signal },
        );
        setResults(stocks);
      } catch (caughtError) {
        if (caughtError?.name !== "AbortError") {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to search stocks.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 280);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [form.searchQuery, form.symbol, open]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  function handleSearchChange(event) {
    const value = event.target.value;

    setForm((current) => ({
      ...current,
      searchQuery: value,
      symbol: "",
      companyName: "",
    }));
  }

  function selectStock(stock) {
    setForm((current) => ({
      ...current,
      searchQuery: stock.name || stock.company || stock.symbol,
      symbol: cleanText(stock.symbol).toUpperCase(),
      companyName: stock.name || stock.company || stock.symbol,
      exchange: stock.exchange || "NSE",
    }));
    setResults([]);
    setError("");
  }

  function handleConditionChange(event) {
    const condition = getCustomAlertCondition(event.target.value);

    setForm((current) => ({
      ...current,
      condition: condition.value,
      targetValue: String(condition.defaultValue),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const targetValue = Number(form.targetValue);

    if (!form.symbol) {
      setError("Select a company from the search results.");
      return;
    }

    if (!Number.isFinite(targetValue)) {
      setError("Enter a valid target value.");
      return;
    }

    if (
      selectedCondition.min !== undefined &&
      targetValue < selectedCondition.min
    ) {
      setError(`The minimum value is ${selectedCondition.min}.`);
      return;
    }

    if (
      selectedCondition.max !== undefined &&
      targetValue > selectedCondition.max
    ) {
      setError(`The maximum value is ${selectedCondition.max}.`);
      return;
    }

    setSaving(true);

    try {
      const rules = upsertCustomAlertRule({
        id: editingRule?.id,
        symbol: form.symbol,
        companyName: form.companyName,
        exchange: form.exchange,
        condition: form.condition,
        targetValue,
        status: editingRule?.status === "paused" ? "paused" : "active",
        createdAt: editingRule?.createdAt,
        lastTriggeredAt: null,
        lastEvaluatedAt: null,
        lastValue: null,
        lastMetrics: {},
        triggerCount: editingRule?.triggerCount || 0,
      });

      onSaved(rules);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to save the alert rule.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="exa-rule-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="exa-rule-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exa-rule-modal-title"
      >
        <header className="exa-rule-modal-header">
          <div>
            <p>CUSTOM MONITORING</p>
            <h2 id="exa-rule-modal-title">
              {editingRule ? "Edit alert rule" : "Create alert rule"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close alert-rule editor"
          >
            <X size={18} />
          </button>
        </header>

        <form className="exa-rule-form" onSubmit={handleSubmit}>
          <label className="exa-rule-field">
            <span>Company or NSE/BSE symbol</span>

            <div className="exa-rule-stock-search">
              <Search size={16} />
              <input
                type="search"
                value={form.searchQuery}
                onChange={handleSearchChange}
                placeholder="Search Reliance, TCS, HDFC Bank..."
                autoComplete="off"
              />

              {searching && (
                <LoaderCircle size={16} className="spinning" />
              )}
            </div>

            {form.symbol && (
              <div className="exa-rule-selected-stock">
                <div>
                  <strong>{form.companyName}</strong>
                  <span>{form.symbol}</span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      searchQuery: "",
                      symbol: "",
                      companyName: "",
                    }))
                  }
                >
                  Change
                </button>
              </div>
            )}

            {results.length > 0 && (
              <div className="exa-rule-search-results">
                {results.map((stock) => (
                  <button
                    type="button"
                    key={stock.symbol}
                    onClick={() => selectStock(stock)}
                  >
                    <div>
                      <strong>
                        {stock.name || stock.company || stock.symbol}
                      </strong>
                      <span>
                        {stock.symbol}
                        {stock.exchange ? ` · ${stock.exchange}` : ""}
                      </span>
                    </div>
                    <ArrowRight size={14} />
                  </button>
                ))}
              </div>
            )}
          </label>

          <div className="exa-rule-form-grid">
            <label className="exa-rule-field">
              <span>Condition</span>
              <select
                value={form.condition}
                onChange={handleConditionChange}
              >
                {CUSTOM_ALERT_CONDITIONS.map((condition) => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="exa-rule-field">
              <span>Target value</span>
              <div className="exa-rule-target-input">
                {selectedCondition.unit === "₹" && <b>₹</b>}
                <input
                  type="number"
                  value={form.targetValue}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      targetValue: event.target.value,
                    }))
                  }
                  min={selectedCondition.min}
                  max={selectedCondition.max}
                  step={selectedCondition.step}
                />
                {selectedCondition.unit &&
                  selectedCondition.unit !== "₹" && (
                    <b>{selectedCondition.unit}</b>
                  )}
              </div>
            </label>
          </div>

          <div className="exa-rule-preview">
            <Target size={17} />
            <div>
              <span>Rule preview</span>
              <strong>
                {form.companyName || "Selected stock"}: {selectedCondition.shortLabel}{" "}
                {form.targetValue || selectedCondition.defaultValue}
                {selectedCondition.unit === "₹"
                  ? " INR"
                  : selectedCondition.unit}
              </strong>
            </div>
          </div>

          {error && (
            <div className="exa-rule-form-error">
              <ShieldAlert size={15} />
              {error}
            </div>
          )}

          <footer className="exa-rule-modal-actions">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary"
              disabled={saving}
            >
              {saving ? (
                <LoaderCircle size={15} className="spinning" />
              ) : (
                <Target size={15} />
              )}
              {editingRule ? "Save changes" : "Create alert"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

export default function Alerts() {
  const navigate = useNavigate();

  const cachedData = readAlertCenterCache();

  const [alerts, setAlerts] = useState(cachedData.alerts);
  const [rules, setRules] = useState(readCustomAlertRules);
  const [metadata, setMetadata] = useState({
    fetchedAt: cachedData.fetchedAt,
    source: cachedData.source,
    watchlistCount: 0,
    portfolioCount: 0,
    personalizedCount: cachedData.alerts.filter(
      (alert) => alert.personalized,
    ).length,
    customRuleCount: readCustomAlertRules().length,
    customRuleActiveCount: 0,
    customRulePausedCount: 0,
    customRuleTriggeredCount: 0,
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

  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

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
        setRules(readCustomAlertRules());
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

    function handleRulesUpdate() {
      setRules(readCustomAlertRules());
    }

    function handleStorage(event) {
      if (event.key === ALERT_CENTER_STATE_KEY) {
        setAlertState(readAlertCenterState());
      }

      if (event.key === CUSTOM_ALERT_RULES_STORAGE_KEY) {
        setRules(readCustomAlertRules());
      }
    }

    window.addEventListener(
      ALERT_CENTER_UPDATED_EVENT,
      handleAlertCenterUpdate,
    );
    window.addEventListener(
      CUSTOM_ALERT_RULES_UPDATED_EVENT,
      handleRulesUpdate,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        ALERT_CENTER_UPDATED_EVENT,
        handleAlertCenterUpdate,
      );
      window.removeEventListener(
        CUSTOM_ALERT_RULES_UPDATED_EVENT,
        handleRulesUpdate,
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

  const ruleCounts = useMemo(
    () => ({
      active: rules.filter((rule) => rule.status === "active").length,
      paused: rules.filter((rule) => rule.status === "paused").length,
      triggered: rules.filter((rule) => rule.status === "triggered").length,
    }),
    [rules],
  );

  const filteredAlerts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return activeAlerts.filter((alert) => {
      if (
        categoryFilter !== "all" &&
        alert.category !== categoryFilter &&
        !(categoryFilter === "custom" && alert.type === "custom-rule")
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

  function openCreateRule() {
    setEditingRule(null);
    setRuleEditorOpen(true);
  }

  function openEditRule(rule) {
    setEditingRule(rule);
    setRuleEditorOpen(true);
  }

  function closeRuleEditor() {
    setRuleEditorOpen(false);
    setEditingRule(null);
  }

  function handleRuleSaved(nextRules) {
    setRules(nextRules);
    closeRuleEditor();
    loadAlerts({ refresh: true });
  }

  function handleRuleStatusChange(rule, nextStatus) {
    const nextRules = setCustomAlertRuleStatus(rule.id, nextStatus);
    setRules(nextRules);
    loadAlerts({ refresh: true });
  }

  function handleDeleteRule(rule) {
    const confirmed = window.confirm(
      `Delete the alert rule for ${rule.companyName || rule.symbol}?`,
    );

    if (!confirmed) {
      return;
    }

    const nextRules = deleteCustomAlertRule(rule.id);
    setRules(nextRules);
    loadAlerts({ refresh: true });
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
                Live market activity combined with your watchlist,
                portfolio and custom stock-monitoring rules. Alerts are
                educational indicators, not personalized buy or sell
                recommendations.
              </p>
            </div>

            <div className="exa-alert-header-actions">
              <button
                type="button"
                className="exa-alert-create-button"
                onClick={openCreateRule}
              >
                <Plus size={15} />
                Create alert
              </button>

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
              icon={Target}
              label="Custom rules"
              value={rules.length}
              note={`${ruleCounts.active} active · ${ruleCounts.triggered} triggered · ${ruleCounts.paused} paused`}
              tone="personalized"
            />
          </section>

          <section className="exa-custom-rules-panel">
            <header className="exa-custom-rules-header">
              <div>
                <p>MY MONITORING RULES</p>
                <h2>Custom alert rules</h2>
                <span>
                  Rules are checked against the latest available Yahoo
                  Finance data when EXA refreshes.
                </span>
              </div>

              <button type="button" onClick={openCreateRule}>
                <Plus size={15} />
                New rule
              </button>
            </header>

            {rules.length === 0 ? (
              <div className="exa-custom-rules-empty">
                <Target size={25} />
                <div>
                  <strong>No custom rules yet</strong>
                  <span>
                    Create a price, daily-change, RSI, volume or 52-week
                    range alert for any NSE/BSE stock.
                  </span>
                </div>
                <button type="button" onClick={openCreateRule}>
                  Create your first alert
                </button>
              </div>
            ) : (
              <div className="exa-custom-rules-grid">
                {rules.map((rule) => (
                  <CustomRuleCard
                    key={rule.id}
                    rule={rule}
                    onEdit={openEditRule}
                    onDelete={handleDeleteRule}
                    onStatusChange={handleRuleStatusChange}
                    onAnalyze={(symbol) =>
                      navigate(
                        `/analyze?query=${encodeURIComponent(symbol)}`,
                      )
                    }
                  />
                ))}
              </div>
            )}
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
              Some personalized or custom-rule data sources were
              unavailable. The available alert sources are still
              displayed.
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
                Checking the market, watchlist, portfolio, custom rules
                and Screener snapshot.
              </span>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="exa-alert-empty-state">
              <Inbox size={30} />
              <strong>No matching alerts</strong>
              <span>
                Change the filters, create a custom rule or refresh to
                check the latest market activity.
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
                          {alert.symbol ||
                            alert.source ||
                            "EXA market intelligence"}
                        </span>

                        <div className="exa-alert-card-actions">
                          <button
                            type="button"
                            className="exa-alert-icon-action"
                            onClick={() => handleToggleRead(alert)}
                            title={read ? "Mark unread" : "Mark read"}
                            aria-label={
                              read ? "Mark alert unread" : "Mark alert read"
                            }
                          >
                            {read ? (
                              <Bell size={14} />
                            ) : (
                              <Check size={14} />
                            )}
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

      <RuleEditorModal
        open={ruleEditorOpen}
        editingRule={editingRule}
        onClose={closeRuleEditor}
        onSaved={handleRuleSaved}
      />
    </AppShell>
  );
}