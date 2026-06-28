import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  loadAlertCenterData,
} from "../services/alertCenter";

import {
  ALERT_CENTER_CACHE_KEY,
  ALERT_CENTER_STATE_KEY,
  ALERT_CENTER_UPDATED_EVENT,
  getActiveAlerts,
  getUnreadAlertCount,
  isAlertRead,
  markAlertRead,
  markAllAlertsRead,
  readAlertCenterCache,
  readAlertCenterState,
} from "../utils/alertStorage";

import {
  CUSTOM_ALERT_RULES_STORAGE_KEY,
  CUSTOM_ALERT_RULES_UPDATED_EVENT,
} from "../utils/customAlertRules";

const CACHE_MAX_AGE_MS = 5 * 60 * 1000;
const PREVIEW_ALERT_LIMIT = 5;

function alertTimestamp(alert) {
  const timestamp = new Date(
    alert?.occurredAt ||
      alert?.fetchedAt ||
      0,
  ).getTime();

  return Number.isFinite(timestamp)
    ? timestamp
    : 0;
}

function getAlertSnapshot() {
  const cache = readAlertCenterCache();
  const state = readAlertCenterState();
  const activeAlerts = getActiveAlerts(
    cache.alerts,
    state,
  );

  const previewAlerts = [...activeAlerts]
    .sort((first, second) => {
      const firstRead = isAlertRead(first?.id, state);
      const secondRead = isAlertRead(second?.id, state);

      if (firstRead !== secondRead) {
        return firstRead ? 1 : -1;
      }

      return (
        alertTimestamp(second) -
        alertTimestamp(first)
      );
    })
    .slice(0, PREVIEW_ALERT_LIMIT)
    .map((alert) => ({
      ...alert,
      isRead: isAlertRead(alert?.id, state),
    }));

  return {
    unreadCount: getUnreadAlertCount(
      cache.alerts,
      state,
    ),
    previewAlerts,
  };
}

function cacheIsFresh(fetchedAt) {
  const timestamp = new Date(
    fetchedAt || "",
  ).getTime();

  return (
    Number.isFinite(timestamp) &&
    Date.now() - timestamp <
      CACHE_MAX_AGE_MS
  );
}

export default function useAlertCenterBadge() {
  const [snapshot, setSnapshot] = useState(
    getAlertSnapshot,
  );

  const activeRequestRef = useRef(null);

  const refreshCount = useCallback(() => {
    setSnapshot(getAlertSnapshot());
  }, []);

  const refreshAllAlerts = useCallback(
    async ({ refresh = false } = {}) => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }

      const controller = new AbortController();
      activeRequestRef.current = controller;

      try {
        await loadAlertCenterData({
          refresh,
          signal: controller.signal,
        });
        refreshCount();
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.warn(
            "Unable to refresh alert badge:",
            error,
          );
        }
      } finally {
        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
        }
      }
    },
    [refreshCount],
  );

  const markAlertAsRead = useCallback(
    (alertId) => {
      markAlertRead(alertId, true);
      refreshCount();
    },
    [refreshCount],
  );

  const markAllPreviewAlertsRead = useCallback(
    () => {
      const cache = readAlertCenterCache();

      markAllAlertsRead(cache.alerts);
      refreshCount();
    },
    [refreshCount],
  );

  useEffect(() => {
    function handleAlertUpdate() {
      refreshCount();
    }

    function handleRuleUpdate(event) {
      refreshCount();

      if (event?.detail?.reason !== "evaluation") {
        refreshAllAlerts({ refresh: true });
      }
    }

    function handleStorage(event) {
      if (
        event.key ===
          ALERT_CENTER_STATE_KEY ||
        event.key ===
          ALERT_CENTER_CACHE_KEY
      ) {
        refreshCount();
      }

      if (event.key === CUSTOM_ALERT_RULES_STORAGE_KEY) {
        refreshAllAlerts({ refresh: true });
      }
    }

    window.addEventListener(
      ALERT_CENTER_UPDATED_EVENT,
      handleAlertUpdate,
    );
    window.addEventListener(
      CUSTOM_ALERT_RULES_UPDATED_EVENT,
      handleRuleUpdate,
    );
    window.addEventListener(
      "storage",
      handleStorage,
    );

    return () => {
      window.removeEventListener(
        ALERT_CENTER_UPDATED_EVENT,
        handleAlertUpdate,
      );
      window.removeEventListener(
        CUSTOM_ALERT_RULES_UPDATED_EVENT,
        handleRuleUpdate,
      );
      window.removeEventListener(
        "storage",
        handleStorage,
      );
    };
  }, [refreshAllAlerts, refreshCount]);

  useEffect(() => {
    const cache = readAlertCenterCache();

    if (!cacheIsFresh(cache.fetchedAt)) {
      refreshAllAlerts();
    }

    return () => {
      activeRequestRef.current?.abort();
      activeRequestRef.current = null;
    };
  }, [refreshAllAlerts]);

  return {
    unreadCount: snapshot.unreadCount,
    previewAlerts: snapshot.previewAlerts,
    refreshCount,
    refreshAllAlerts,
    markAlertAsRead,
    markAllPreviewAlertsRead,
  };
}