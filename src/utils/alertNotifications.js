export const ALERT_HISTORY_STORAGE_KEY =
  "exa-alert-history-v1";

export const ALERT_NOTIFICATION_PREFERENCES_KEY =
  "exa-alert-notification-preferences-v1";

export const ALERT_NOTIFICATION_UPDATED_EVENT =
  "exa:alert-notifications-updated";

const MAX_HISTORY_ITEMS = 300;
const MAX_NOTIFIED_IDS = 500;

const DEFAULT_PREFERENCES = {
  browserNotifications: false,
  soundEnabled: false,
  notifiedIds: [],
  updatedAt: null,
};

function hasBrowserStorage() {
  return (
    typeof window !== "undefined" &&
    typeof window.localStorage !== "undefined"
  );
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function safeNumber(value, fallback = null) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function uniqueIds(values, limit = MAX_NOTIFIED_IDS) {
  return [
    ...new Set(
      (Array.isArray(values) ? values : [])
        .map(cleanText)
        .filter(Boolean),
    ),
  ].slice(-limit);
}

function dispatchNotificationUpdate(detail = {}) {
  if (
    typeof window === "undefined" ||
    typeof window.dispatchEvent !== "function"
  ) {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(ALERT_NOTIFICATION_UPDATED_EVENT, {
      detail,
    }),
  );
}

function dayKey(value) {
  const date = new Date(value || Date.now());

  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
}

function getHistoryKind(alert) {
  if (
    cleanText(alert?.type).toLowerCase() === "custom-rule" ||
    cleanText(alert?.category).toLowerCase() === "custom"
  ) {
    return "custom";
  }

  return alert?.personalized
    ? "personalized"
    : "market";
}

function createHistoryId(alert) {
  const alertId = cleanText(alert?.id);
  const kind = getHistoryKind(alert);

  if (!alertId) {
    return "";
  }

  if (kind === "custom") {
    return alertId;
  }

  return `${alertId}-${dayKey(
    alert?.occurredAt || alert?.fetchedAt,
  )}`;
}

export function normalizeAlertHistoryEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const alertId = cleanText(entry.alertId || entry.id);
  const historyId = cleanText(
    entry.historyId || createHistoryId({ ...entry, id: alertId }),
  );

  if (!alertId || !historyId) {
    return null;
  }

  const kind = ["custom", "market", "personalized"].includes(
    entry.kind,
  )
    ? entry.kind
    : getHistoryKind(entry);

  const occurredAt =
    cleanText(entry.occurredAt || entry.fetchedAt) ||
    new Date().toISOString();

  return {
    historyId,
    alertId,
    type: cleanText(entry.type) || "market-alert",
    kind,
    category: cleanText(entry.category) || "market",
    severity: cleanText(entry.severity) || "information",
    title: cleanText(entry.title) || "Market alert",
    message:
      cleanText(entry.message || entry.description) ||
      "New market activity was detected.",
    symbol: cleanText(entry.symbol || entry.ticker).toUpperCase(),
    source: cleanText(entry.source) || "EXA alert center",
    occurredAt,
    recordedAt:
      cleanText(entry.recordedAt) || new Date().toISOString(),
    personalized: Boolean(entry.personalized),
    isRead: Boolean(entry.isRead),
    readAt: cleanText(entry.readAt) || null,
    currentValue: safeNumber(
      entry.currentValue ?? entry.metrics?.currentValue,
    ),
    targetValue: safeNumber(
      entry.targetValue ?? entry.metrics?.targetValue,
    ),
    targetLabel: cleanText(
      entry.targetLabel || entry.metrics?.targetLabel,
    ),
    condition: cleanText(
      entry.condition || entry.metrics?.condition,
    ),
  };
}

export function readAlertHistory() {
  if (!hasBrowserStorage()) {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(
      ALERT_HISTORY_STORAGE_KEY,
    );

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);

    return (Array.isArray(parsed) ? parsed : [])
      .map(normalizeAlertHistoryEntry)
      .filter(Boolean)
      .slice(0, MAX_HISTORY_ITEMS);
  } catch (error) {
    console.error("Unable to read EXA alert history:", error);
    return [];
  }
}

export function writeAlertHistory(
  history,
  { reason = "history", silent = false } = {},
) {
  const seenIds = new Set();

  const normalized = (Array.isArray(history) ? history : [])
    .map(normalizeAlertHistoryEntry)
    .filter((entry) => {
      if (!entry || seenIds.has(entry.historyId)) {
        return false;
      }

      seenIds.add(entry.historyId);
      return true;
    })
    .sort(
      (first, second) =>
        new Date(second.occurredAt).getTime() -
        new Date(first.occurredAt).getTime(),
    )
    .slice(0, MAX_HISTORY_ITEMS);

  if (hasBrowserStorage()) {
    try {
      window.localStorage.setItem(
        ALERT_HISTORY_STORAGE_KEY,
        JSON.stringify(normalized),
      );
    } catch (error) {
      console.error("Unable to save EXA alert history:", error);
    }
  }

  if (!silent) {
    dispatchNotificationUpdate({
      reason,
      history: normalized,
    });
  }

  return normalized;
}

export function readNotificationPreferences() {
  if (!hasBrowserStorage()) {
    return { ...DEFAULT_PREFERENCES };
  }

  try {
    const rawValue = window.localStorage.getItem(
      ALERT_NOTIFICATION_PREFERENCES_KEY,
    );

    if (!rawValue) {
      return { ...DEFAULT_PREFERENCES };
    }

    const parsed = JSON.parse(rawValue);

    return {
      browserNotifications: Boolean(parsed?.browserNotifications),
      soundEnabled: Boolean(parsed?.soundEnabled),
      notifiedIds: uniqueIds(parsed?.notifiedIds),
      updatedAt: cleanText(parsed?.updatedAt) || null,
    };
  } catch (error) {
    console.error("Unable to read notification preferences:", error);
    return { ...DEFAULT_PREFERENCES };
  }
}

export function writeNotificationPreferences(
  nextPreferences,
  { reason = "preferences", silent = false } = {},
) {
  const current = readNotificationPreferences();
  const normalized = {
    browserNotifications: Boolean(
      nextPreferences?.browserNotifications ??
        current.browserNotifications,
    ),
    soundEnabled: Boolean(
      nextPreferences?.soundEnabled ?? current.soundEnabled,
    ),
    notifiedIds: uniqueIds(
      nextPreferences?.notifiedIds ?? current.notifiedIds,
    ),
    updatedAt: new Date().toISOString(),
  };

  if (hasBrowserStorage()) {
    try {
      window.localStorage.setItem(
        ALERT_NOTIFICATION_PREFERENCES_KEY,
        JSON.stringify(normalized),
      );
    } catch (error) {
      console.error("Unable to save notification preferences:", error);
    }
  }

  if (!silent) {
    dispatchNotificationUpdate({
      reason,
      preferences: normalized,
    });
  }

  return normalized;
}

export function getBrowserNotificationStatus() {
  const supported =
    typeof window !== "undefined" &&
    "Notification" in window;

  const secureContext =
    typeof window !== "undefined" &&
    (window.isSecureContext ||
      ["localhost", "127.0.0.1"].includes(
        window.location?.hostname,
      ));

  return {
    supported,
    secureContext,
    permission: supported
      ? window.Notification.permission
      : "unsupported",
  };
}

export async function requestBrowserNotificationPermission() {
  const status = getBrowserNotificationStatus();

  if (!status.supported) {
    throw new Error(
      "Browser notifications are not supported on this device.",
    );
  }

  if (!status.secureContext) {
    throw new Error(
      "Browser notifications require HTTPS or localhost.",
    );
  }

  const permission =
    status.permission === "granted"
      ? "granted"
      : await window.Notification.requestPermission();

  writeNotificationPreferences({
    browserNotifications: permission === "granted",
  });

  return getBrowserNotificationStatus();
}

export function playNotificationSound() {
  if (typeof window === "undefined") {
    return false;
  }

  const AudioContextClass =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContextClass) {
    return false;
  }

  try {
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(740, now);
    oscillator.frequency.exponentialRampToValueAtTime(980, now + 0.12);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.22);

    oscillator.addEventListener("ended", () => {
      context.close().catch(() => {});
    });

    return true;
  } catch (error) {
    console.warn("Unable to play notification sound:", error);
    return false;
  }
}

function showBrowserNotifications(entries) {
  const status = getBrowserNotificationStatus();
  const preferences = readNotificationPreferences();

  if (
    !status.supported ||
    status.permission !== "granted" ||
    !preferences.browserNotifications
  ) {
    return [];
  }

  const alreadyNotified = new Set(preferences.notifiedIds);
  const notifiedNow = [];

  entries.forEach((entry) => {
    if (
      entry.kind !== "custom" ||
      alreadyNotified.has(entry.alertId)
    ) {
      return;
    }

    try {
      const notification = new window.Notification(
        entry.symbol
          ? `EXA Alert · ${entry.symbol}`
          : "EXA custom alert triggered",
        {
          body: entry.message,
          tag: `exa-${entry.alertId}`,
          renotify: false,
        },
      );

      notification.onclick = () => {
        markAlertHistoryRead(entry.historyId, true);
        window.focus();
        window.location.assign("/alerts");
        notification.close();
      };

      alreadyNotified.add(entry.alertId);
      notifiedNow.push(entry.alertId);
    } catch (error) {
      console.warn("Unable to display browser notification:", error);
    }
  });

  if (notifiedNow.length > 0) {
    writeNotificationPreferences(
      {
        ...preferences,
        notifiedIds: [...alreadyNotified],
      },
      {
        reason: "notified",
        silent: true,
      },
    );

    if (preferences.soundEnabled) {
      playNotificationSound();
    }
  }

  return notifiedNow;
}

export function syncAlertHistory(
  alerts,
  { notifyAlertIds = [] } = {},
) {
  const current = readAlertHistory();
  const existingIds = new Set(
    current.map((entry) => entry.historyId),
  );
  const now = new Date().toISOString();
  const added = [];

  (Array.isArray(alerts) ? alerts : []).forEach((alert) => {
    const historyId = createHistoryId(alert);

    if (!historyId || existingIds.has(historyId)) {
      return;
    }

    const entry = normalizeAlertHistoryEntry({
      ...alert,
      historyId,
      alertId: cleanText(alert?.id),
      recordedAt: now,
      isRead: false,
      currentValue: alert?.metrics?.currentValue,
      targetValue: alert?.metrics?.targetValue,
      targetLabel: alert?.metrics?.targetLabel,
      condition: alert?.metrics?.condition,
    });

    if (!entry) {
      return;
    }

    existingIds.add(historyId);
    added.push(entry);
  });

  const history =
    added.length > 0
      ? writeAlertHistory([...added, ...current], {
          reason: "sync",
        })
      : current;

  const notifySet = new Set(
    (Array.isArray(notifyAlertIds) ? notifyAlertIds : [])
      .map(cleanText)
      .filter(Boolean),
  );

  const notificationEntries = added.filter((entry) =>
    notifySet.has(entry.alertId),
  );

  showBrowserNotifications(notificationEntries);

  return {
    history,
    added,
  };
}

export function markAlertHistoryRead(historyId, isRead = true) {
  const id = cleanText(historyId);
  const now = new Date().toISOString();

  const nextHistory = readAlertHistory().map((entry) =>
    entry.historyId === id
      ? {
          ...entry,
          isRead: Boolean(isRead),
          readAt: isRead ? now : null,
        }
      : entry,
  );

  return writeAlertHistory(nextHistory, {
    reason: isRead ? "read" : "unread",
  });
}

export function markAllAlertHistoryRead() {
  const now = new Date().toISOString();
  const nextHistory = readAlertHistory().map((entry) => ({
    ...entry,
    isRead: true,
    readAt: entry.readAt || now,
  }));

  return writeAlertHistory(nextHistory, {
    reason: "read-all",
  });
}

export function deleteAlertHistoryEntry(historyId) {
  const id = cleanText(historyId);

  return writeAlertHistory(
    readAlertHistory().filter(
      (entry) => entry.historyId !== id,
    ),
    {
      reason: "delete-history",
    },
  );
}

export function clearAlertHistory() {
  return writeAlertHistory([], {
    reason: "clear-history",
  });
}

export function getUnreadAlertHistoryCount(
  history = readAlertHistory(),
) {
  return (Array.isArray(history) ? history : []).filter(
    (entry) => !entry.isRead,
  ).length;
}