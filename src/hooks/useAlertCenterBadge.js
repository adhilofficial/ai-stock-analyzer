import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getMarketAlerts,
} from "../services/dashboardApi";

import {
  ALERT_CENTER_CACHE_KEY,
  ALERT_CENTER_STATE_KEY,
  ALERT_CENTER_UPDATED_EVENT,
  getActiveAlerts,
  getUnreadAlertCount,
  isAlertRead,
  markAlertRead,
  markAllAlertsRead,
  mergeAlertCenterCache,
  readAlertCenterCache,
  readAlertCenterState,
} from "../utils/alertStorage";

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

  const refreshCount = useCallback(() => {
    setSnapshot(getAlertSnapshot());
  }, []);

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

    function handleStorage(event) {
      if (
        event.key ===
          ALERT_CENTER_STATE_KEY ||
        event.key ===
          ALERT_CENTER_CACHE_KEY
      ) {
        refreshCount();
      }
    }

    window.addEventListener(
      ALERT_CENTER_UPDATED_EVENT,
      handleAlertUpdate,
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
        "storage",
        handleStorage,
      );
    };
  }, [refreshCount]);

  useEffect(() => {
    const cache = readAlertCenterCache();

    if (cacheIsFresh(cache.fetchedAt)) {
      return undefined;
    }

    const controller = new AbortController();

    async function loadBadgeAlerts() {
      try {
        const data = await getMarketAlerts({
          limit: 20,
          signal: controller.signal,
        });

        mergeAlertCenterCache(data.alerts, {
          fetchedAt: data.fetchedAt,
          source: data.source,
        });

        refreshCount();
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.warn(
            "Unable to refresh alert badge:",
            error,
          );
        }
      }
    }

    loadBadgeAlerts();

    return () => {
      controller.abort();
    };
  }, [refreshCount]);

  return {
    unreadCount: snapshot.unreadCount,
    previewAlerts: snapshot.previewAlerts,
    refreshCount,
    markAlertAsRead,
    markAllPreviewAlertsRead,
  };
}