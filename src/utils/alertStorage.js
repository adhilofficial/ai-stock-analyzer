export const ALERT_CENTER_STATE_KEY =
  "exa-alert-center-state-v1";

export const ALERT_CENTER_CACHE_KEY =
  "exa-alert-center-cache-v1";

export const ALERT_CENTER_UPDATED_EVENT =
  "exa:alert-center-updated";

const MAX_STORED_IDS = 1000;
const MAX_CACHED_ALERTS = 120;

function hasBrowserStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function uniqueIds(values) {
  return [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .map(cleanText)
        .filter(Boolean),
    ),
  ].slice(-MAX_STORED_IDS);
}

function dispatchAlertCenterUpdate(detail = {}) {
  if (
    typeof window === "undefined" ||
    typeof window.dispatchEvent !== "function"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(ALERT_CENTER_UPDATED_EVENT, {
      detail,
    }),
  );
}

export function normalizeAlertId(value) {
  return cleanText(value);
}

export function normalizeCachedAlert(alert) {
  if (!alert || typeof alert !== "object") {
    return null;
  }

  const id = normalizeAlertId(
    alert.id ||
      `${alert.type || "alert"}-${
        alert.symbol || alert.title || "item"
      }`,
  );

  if (!id) {
    return null;
  }

  return {
    ...alert,
    id,
    type: cleanText(alert.type) || "market-alert",
    category: cleanText(alert.category) || "market",
    severity: cleanText(alert.severity) || "information",
    title: cleanText(alert.title) || "Market alert",
    message:
      cleanText(alert.message || alert.description) ||
      "New market activity has been detected.",
    symbol: cleanText(alert.symbol || alert.ticker).toUpperCase(),
    source: cleanText(alert.source) || "Litses alert center",
    occurredAt:
      cleanText(alert.occurredAt || alert.createdAt) || null,
    fetchedAt: cleanText(alert.fetchedAt) || null,
    time: cleanText(alert.time),
    personalized: Boolean(alert.personalized),
  };
}

export function readAlertCenterState() {
  if (!hasBrowserStorage()) {
    return {
      readIds: [],
      dismissedIds: [],
      updatedAt: null,
    };
  }

  try {
    const rawValue = window.localStorage.getItem(
      ALERT_CENTER_STATE_KEY,
    );

    if (!rawValue) {
      return {
        readIds: [],
        dismissedIds: [],
        updatedAt: null,
      };
    }

    const parsed = JSON.parse(rawValue);

    return {
      readIds: uniqueIds(parsed?.readIds),
      dismissedIds: uniqueIds(parsed?.dismissedIds),
      updatedAt: cleanText(parsed?.updatedAt) || null,
    };
  } catch (error) {
    console.error("Unable to read Litses alert state:", error);

    return {
      readIds: [],
      dismissedIds: [],
      updatedAt: null,
    };
  }
}

export function writeAlertCenterState(nextState) {
  const normalized = {
    readIds: uniqueIds(nextState?.readIds),
    dismissedIds: uniqueIds(nextState?.dismissedIds),
    updatedAt: new Date().toISOString(),
  };

  if (!hasBrowserStorage()) {
    return normalized;
  }

  try {
    window.localStorage.setItem(
      ALERT_CENTER_STATE_KEY,
      JSON.stringify(normalized),
    );

    dispatchAlertCenterUpdate({
      reason: "state",
      state: normalized,
    });
  } catch (error) {
    console.error("Unable to save Litses alert state:", error);
  }

  return normalized;
}

export function markAlertRead(alertId, isRead = true) {
  const id = normalizeAlertId(alertId);
  const state = readAlertCenterState();

  if (!id) {
    return state;
  }

  const nextReadIds = new Set(state.readIds);

  if (isRead) {
    nextReadIds.add(id);
  } else {
    nextReadIds.delete(id);
  }

  return writeAlertCenterState({
    ...state,
    readIds: [...nextReadIds],
  });
}

export function markAllAlertsRead(alerts) {
  const state = readAlertCenterState();
  const nextReadIds = new Set(state.readIds);

  (Array.isArray(alerts) ? alerts : []).forEach((alert) => {
    const id = normalizeAlertId(alert?.id);

    if (id) {
      nextReadIds.add(id);
    }
  });

  return writeAlertCenterState({
    ...state,
    readIds: [...nextReadIds],
  });
}

export function dismissAlert(alertId) {
  const id = normalizeAlertId(alertId);
  const state = readAlertCenterState();

  if (!id) {
    return state;
  }

  return writeAlertCenterState({
    ...state,
    dismissedIds: [...state.dismissedIds, id],
  });
}

export function restoreDismissedAlerts() {
  const state = readAlertCenterState();

  return writeAlertCenterState({
    ...state,
    dismissedIds: [],
  });
}

export function isAlertRead(alertId, state = readAlertCenterState()) {
  const id = normalizeAlertId(alertId);

  return Boolean(id && state.readIds.includes(id));
}

export function isAlertDismissed(
  alertId,
  state = readAlertCenterState(),
) {
  const id = normalizeAlertId(alertId);

  return Boolean(id && state.dismissedIds.includes(id));
}

export function readAlertCenterCache() {
  if (!hasBrowserStorage()) {
    return {
      alerts: [],
      fetchedAt: null,
      source: "",
    };
  }

  try {
    const rawValue = window.localStorage.getItem(
      ALERT_CENTER_CACHE_KEY,
    );

    if (!rawValue) {
      return {
        alerts: [],
        fetchedAt: null,
        source: "",
      };
    }

    const parsed = JSON.parse(rawValue);

    return {
      alerts: (Array.isArray(parsed?.alerts) ? parsed.alerts : [])
        .map(normalizeCachedAlert)
        .filter(Boolean)
        .slice(0, MAX_CACHED_ALERTS),
      fetchedAt: cleanText(parsed?.fetchedAt) || null,
      source: cleanText(parsed?.source),
    };
  } catch (error) {
    console.error("Unable to read Litses alert cache:", error);

    return {
      alerts: [],
      fetchedAt: null,
      source: "",
    };
  }
}

export function writeAlertCenterCache({
  alerts,
  fetchedAt,
  source,
}) {
  const seenIds = new Set();

  const normalizedAlerts = (
    Array.isArray(alerts) ? alerts : []
  )
    .map(normalizeCachedAlert)
    .filter((alert) => {
      if (!alert || seenIds.has(alert.id)) {
        return false;
      }

      seenIds.add(alert.id);
      return true;
    })
    .slice(0, MAX_CACHED_ALERTS);

  const payload = {
    alerts: normalizedAlerts,
    fetchedAt: cleanText(fetchedAt) || new Date().toISOString(),
    source: cleanText(source) || "Litses alert center",
  };

  if (hasBrowserStorage()) {
    try {
      window.localStorage.setItem(
        ALERT_CENTER_CACHE_KEY,
        JSON.stringify(payload),
      );

      dispatchAlertCenterUpdate({
        reason: "cache",
        cache: payload,
      });
    } catch (error) {
      console.error("Unable to save Litses alert cache:", error);
    }
  }

  return payload;
}

export function mergeAlertCenterCache(alerts, metadata = {}) {
  const current = readAlertCenterCache();
  const incoming = (Array.isArray(alerts) ? alerts : [])
    .map(normalizeCachedAlert)
    .filter(Boolean);

  const incomingIds = new Set(incoming.map((alert) => alert.id));

  return writeAlertCenterCache({
    alerts: [
      ...incoming,
      ...current.alerts.filter(
        (alert) => !incomingIds.has(alert.id),
      ),
    ],
    fetchedAt:
      metadata.fetchedAt || current.fetchedAt || new Date().toISOString(),
    source: metadata.source || current.source || "Litses alert center",
  });
}

export function getActiveAlerts(
  alerts,
  state = readAlertCenterState(),
) {
  const dismissed = new Set(state.dismissedIds);

  return (Array.isArray(alerts) ? alerts : []).filter(
    (alert) => !dismissed.has(normalizeAlertId(alert?.id)),
  );
}

export function getUnreadAlertCount(
  alerts,
  state = readAlertCenterState(),
) {
  const readIds = new Set(state.readIds);

  return getActiveAlerts(alerts, state).reduce(
    (count, alert) =>
      readIds.has(normalizeAlertId(alert?.id))
        ? count
        : count + 1,
    0,
  );
}
