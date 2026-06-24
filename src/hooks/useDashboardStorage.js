import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  WATCHLIST_STORAGE_KEY,
  RECENT_ANALYSES_STORAGE_KEY,
  WATCHLIST_UPDATED_EVENT,
  RECENT_ANALYSES_UPDATED_EVENT,
  getSavedWatchlistSymbols,
  getRecentAnalyses,
  addWatchlistSymbol,
  removeWatchlistSymbol,
  resetWatchlist,
  clearRecentAnalyses,
} from "../utils/dashboardStorage";

export default function useDashboardStorage() {
  const [
    watchlistSymbols,
    setWatchlistSymbols,
  ] = useState(() =>
    getSavedWatchlistSymbols(),
  );

  const [
    recentAnalyses,
    setRecentAnalyses,
  ] = useState(() =>
    getRecentAnalyses(),
  );

  const refreshWatchlist =
    useCallback(() => {
      setWatchlistSymbols(
        getSavedWatchlistSymbols(),
      );
    }, []);

  const refreshRecentAnalyses =
    useCallback(() => {
      setRecentAnalyses(
        getRecentAnalyses(),
      );
    }, []);

  useEffect(() => {
    function handleStorage(event) {
      if (
        event.key ===
        WATCHLIST_STORAGE_KEY
      ) {
        refreshWatchlist();
      }

      if (
        event.key ===
        RECENT_ANALYSES_STORAGE_KEY
      ) {
        refreshRecentAnalyses();
      }
    }

    window.addEventListener(
      "storage",
      handleStorage,
    );

    window.addEventListener(
      WATCHLIST_UPDATED_EVENT,
      refreshWatchlist,
    );

    window.addEventListener(
      RECENT_ANALYSES_UPDATED_EVENT,
      refreshRecentAnalyses,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage,
      );

      window.removeEventListener(
        WATCHLIST_UPDATED_EVENT,
        refreshWatchlist,
      );

      window.removeEventListener(
        RECENT_ANALYSES_UPDATED_EVENT,
        refreshRecentAnalyses,
      );
    };
  }, [
    refreshWatchlist,
    refreshRecentAnalyses,
  ]);

  const addSymbol =
    useCallback((symbol) => {
      const updatedSymbols =
        addWatchlistSymbol(symbol);

      setWatchlistSymbols(
        updatedSymbols,
      );

      return updatedSymbols;
    }, []);

  const removeSymbol =
    useCallback((symbol) => {
      const updatedSymbols =
        removeWatchlistSymbol(
          symbol,
        );

      setWatchlistSymbols(
        updatedSymbols,
      );

      return updatedSymbols;
    }, []);

  const restoreDefaultWatchlist =
    useCallback(() => {
      const updatedSymbols =
        resetWatchlist();

      setWatchlistSymbols(
        updatedSymbols,
      );

      return updatedSymbols;
    }, []);

  const clearAnalyses =
    useCallback(() => {
      clearRecentAnalyses();
      setRecentAnalyses([]);
    }, []);

  return {
    watchlistSymbols,
    recentAnalyses,
    addSymbol,
    removeSymbol,
    restoreDefaultWatchlist,
    clearAnalyses,
    refreshWatchlist,
    refreshRecentAnalyses,
  };
}