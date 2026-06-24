import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  dashboardMockData,
} from "../data/dashboardMockData";

import {
  getDashboardMarketData,
  getMarketBreadth,
  getMarketMovers,
  getWatchlistQuotes,
} from "../services/dashboardApi";

import useDashboardStorage from
  "../hooks/useDashboardStorage";

import MarketIndexCard from
  "../components/dashboard/MarketIndexCard";

import MarketPulse from
  "../components/dashboard/MarketPulse";

import MarketBreadth from
  "../components/dashboard/MarketBreadth";

import SectorPerformance from
  "../components/dashboard/SectorPerformance";

import WatchlistCard from
  "../components/dashboard/WatchlistCard";

import MarketMovers from
  "../components/dashboard/MarketMovers";

import ImportantAlerts from
  "../components/dashboard/ImportantAlerts";

import RecentAnalyses from
  "../components/dashboard/RecentAnalyses";

import "../styles/dashboard.css";

function getAiView(signal) {
  const normalizedSignal =
    String(signal || "")
      .trim()
      .toUpperCase();

  if (
    normalizedSignal === "BUY" ||
    normalizedSignal === "POSITIVE"
  ) {
    return "Positive";
  }

  if (
    normalizedSignal === "SELL" ||
    normalizedSignal === "NEGATIVE"
  ) {
    return "Negative";
  }

  if (
    normalizedSignal === "WATCH"
  ) {
    return "Watch";
  }

  if (
    normalizedSignal === "NEUTRAL"
  ) {
    return "Neutral";
  }

  return "Not analyzed";
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    liveMarketData,
    setLiveMarketData,
  ] = useState(null);

  const [
    liveWatchlistQuotes,
    setLiveWatchlistQuotes,
  ] = useState([]);

  const [
    liveMarketMovers,
    setLiveMarketMovers,
  ] = useState(null);

  const [
    liveMarketBreadth,
    setLiveMarketBreadth,
  ] = useState(null);

  const [
    marketLoading,
    setMarketLoading,
  ] = useState(true);

  const [
    marketRefreshing,
    setMarketRefreshing,
  ] = useState(false);

  const [
    marketError,
    setMarketError,
  ] = useState("");

  const [
    watchlistLoading,
    setWatchlistLoading,
  ] = useState(true);

  const [
    watchlistError,
    setWatchlistError,
  ] = useState("");

  const [
    moversLoading,
    setMoversLoading,
  ] = useState(true);

  const [
    moversError,
    setMoversError,
  ] = useState("");

  const [
    breadthLoading,
    setBreadthLoading,
  ] = useState(true);

  const [
    breadthError,
    setBreadthError,
  ] = useState("");

  const {
    watchlistSymbols,
    recentAnalyses,
    removeSymbol,
    restoreDefaultWatchlist,
    clearAnalyses,
  } = useDashboardStorage();

  const loadMarketData =
    useCallback(
      async ({
        refresh = false,
        signal,
      } = {}) => {
        if (refresh) {
          setMarketRefreshing(true);
        } else {
          setMarketLoading(true);
        }

        setMarketError("");

        try {
          const data =
            await getDashboardMarketData({
              refresh,
              signal,
            });

          setLiveMarketData(data);
        } catch (caughtError) {
          if (
            caughtError?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "Dashboard market data error:",
            caughtError,
          );

          setMarketError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load live market data.",
          );
        } finally {
          if (!signal?.aborted) {
            setMarketLoading(false);
            setMarketRefreshing(false);
          }
        }
      },
      [],
    );

  const loadWatchlistData =
    useCallback(
      async ({
        refresh = false,
        signal,
      } = {}) => {
        if (
          watchlistSymbols.length === 0
        ) {
          setLiveWatchlistQuotes([]);
          setWatchlistLoading(false);
          setWatchlistError("");
          return;
        }

        setWatchlistLoading(true);
        setWatchlistError("");

        try {
          const data =
            await getWatchlistQuotes({
              symbols:
                watchlistSymbols,
              refresh,
              signal,
            });

          setLiveWatchlistQuotes(
            Array.isArray(data.quotes)
              ? data.quotes
              : [],
          );
        } catch (caughtError) {
          if (
            caughtError?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "Watchlist quote error:",
            caughtError,
          );

          setWatchlistError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load live watchlist prices.",
          );

          setLiveWatchlistQuotes([]);
        } finally {
          if (!signal?.aborted) {
            setWatchlistLoading(false);
          }
        }
      },
      [watchlistSymbols],
    );

  const loadMarketMoversData =
    useCallback(
      async ({
        refresh = false,
        signal,
      } = {}) => {
        setMoversLoading(true);
        setMoversError("");

        try {
          const data =
            await getMarketMovers({
              refresh,
              signal,
            });

          setLiveMarketMovers(
            data?.movers || null,
          );
        } catch (caughtError) {
          if (
            caughtError?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "Market Movers error:",
            caughtError,
          );

          setMoversError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load live market movers.",
          );

          setLiveMarketMovers(null);
        } finally {
          if (!signal?.aborted) {
            setMoversLoading(false);
          }
        }
      },
      [],
    );

  const loadMarketBreadthData =
    useCallback(
      async ({
        refresh = false,
        signal,
      } = {}) => {
        setBreadthLoading(true);
        setBreadthError("");

        try {
          const data =
            await getMarketBreadth({
              refresh,
              signal,
            });

          setLiveMarketBreadth(
            data?.breadth || null,
          );
        } catch (caughtError) {
          if (
            caughtError?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "Market breadth error:",
            caughtError,
          );

          setBreadthError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load live market breadth.",
          );

          setLiveMarketBreadth(null);
        } finally {
          if (!signal?.aborted) {
            setBreadthLoading(false);
          }
        }
      },
      [],
    );

  useEffect(() => {
    const controller =
      new AbortController();

    loadMarketData({
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadMarketData]);

  useEffect(() => {
    const controller =
      new AbortController();

    loadWatchlistData({
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadWatchlistData]);

  useEffect(() => {
    const controller =
      new AbortController();

    loadMarketMoversData({
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadMarketMoversData]);

  useEffect(() => {
    const controller =
      new AbortController();

    loadMarketBreadthData({
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadMarketBreadthData]);

  const watchlist =
    useMemo(() => {
      const mockStockMap =
        new Map(
          dashboardMockData
            .watchlist
            .map((stock) => [
              String(
                stock.symbol,
              ).toUpperCase(),
              stock,
            ]),
        );

      const liveQuoteMap =
        new Map(
          liveWatchlistQuotes.map(
            (quote) => [
              String(
                quote.symbol,
              ).toUpperCase(),
              quote,
            ],
          ),
        );

      const recentAnalysisMap =
        new Map(
          recentAnalyses.map(
            (analysis) => [
              String(
                analysis.symbol,
              ).toUpperCase(),
              analysis,
            ],
          ),
        );

      return watchlistSymbols.map(
        (savedSymbol) => {
          const symbol =
            String(savedSymbol)
              .toUpperCase();

          const mockStock =
            mockStockMap.get(
              symbol,
            );

          const liveQuote =
            liveQuoteMap.get(
              symbol,
            );

          const savedAnalysis =
            recentAnalysisMap.get(
              symbol,
            );

          return {
            symbol,

            name:
              liveQuote?.name ||
              mockStock?.name ||
              symbol,

            price:
              liveQuote?.price ??
              null,

            change:
              liveQuote?.change ??
              null,

            changePercent:
              liveQuote
                ?.changePercent ??
              null,

            marketState:
              liveQuote
                ?.marketState ||
              "UNKNOWN",

            exaScore:
              savedAnalysis?.score ??
              null,

            aiView:
              savedAnalysis
                ? getAiView(
                    savedAnalysis.signal,
                  )
                : "Not analyzed",
          };
        },
      );
    }, [
      watchlistSymbols,
      liveWatchlistQuotes,
      recentAnalyses,
    ]);

  const liveIndicesAvailable =
    Array.isArray(
      liveMarketData?.indices,
    ) &&
    liveMarketData.indices.length > 0;

  const liveSectorsAvailable =
    Array.isArray(
      liveMarketData?.sectors,
    ) &&
    liveMarketData.sectors.length > 0;

  const liveMoversAvailable =
    Boolean(
      Array.isArray(
        liveMarketMovers?.gainers,
      ) &&
        liveMarketMovers.gainers
          .length > 0,
    ) ||
    Boolean(
      Array.isArray(
        liveMarketMovers?.losers,
      ) &&
        liveMarketMovers.losers
          .length > 0,
    ) ||
    Boolean(
      Array.isArray(
        liveMarketMovers?.active,
      ) &&
        liveMarketMovers.active
          .length > 0,
    );

  const liveBreadthAvailable =
    Boolean(
      liveMarketBreadth &&
        Number.isFinite(
          Number(
            liveMarketBreadth.totalStocks,
          ),
        ) &&
        Number(
          liveMarketBreadth.totalStocks,
        ) > 0,
    );

  const marketStatus =
    liveMarketData?.marketStatus ||
    dashboardMockData.marketStatus;

  const indices =
    liveIndicesAvailable
      ? liveMarketData.indices
      : dashboardMockData.indices;

  const sectors =
    liveSectorsAvailable
      ? liveMarketData.sectors
      : dashboardMockData.sectors;

  const marketMovers =
    liveMoversAvailable
      ? liveMarketMovers
      : dashboardMockData.movers;

  const marketBreadth =
    liveBreadthAvailable
      ? liveMarketBreadth
      : dashboardMockData.breadth;

  const usingLiveCoreData =
    liveIndicesAvailable &&
    liveSectorsAvailable;

  function handleSearch(event) {
    event.preventDefault();

    const cleanedQuery =
      searchQuery.trim();

    if (!cleanedQuery) {
      return;
    }

    navigate(
      `/analyze?query=${encodeURIComponent(
        cleanedQuery,
      )}`,
    );
  }

  function handleAnalyze(symbol) {
    if (!symbol) {
      return;
    }

    navigate(
      `/analyze?symbol=${encodeURIComponent(
        symbol,
      )}`,
    );
  }

  function handleRemoveFromWatchlist(
    symbol,
  ) {
    if (!symbol) {
      return;
    }

    removeSymbol(symbol);
  }

  function handleRestoreWatchlist() {
    restoreDefaultWatchlist();
  }

  function handleRefreshMarketData() {
    if (marketRefreshing) {
      return;
    }

    loadMarketData({
      refresh: true,
    });

    loadWatchlistData({
      refresh: true,
    });

    loadMarketMoversData({
      refresh: true,
    });

    loadMarketBreadthData({
      refresh: true,
    });
  }

  function getMarketDataLabel() {
    if (marketLoading) {
      return "Loading live data";
    }

    if (marketError) {
      return "Demo fallback";
    }

    if (
      liveMarketData?.cached
    ) {
      return "Live · cached";
    }

    return "Live data";
  }

  return (
    <main className="exa-dashboard-page">
      <section className="exa-dashboard-header">
        <div>
          <p className="exa-dashboard-eyebrow">
            EXA NEXUS
          </p>

          <h1>
            Market Dashboard
          </h1>

          <p className="exa-dashboard-subtitle">
            Indian market overview,
            sentiment and research
            intelligence.
          </p>
        </div>

        <div className="exa-market-status">
          <span
            className={
              marketStatus.isOpen
                ? "status-dot open"
                : "status-dot closed"
            }
          />

          <div>
            <strong>
              {marketStatus.label}
            </strong>

            <small>
              Updated{" "}
              {marketStatus.lastUpdated}
            </small>
          </div>
        </div>
      </section>

      <form
        className="exa-dashboard-search"
        onSubmit={handleSearch}
      >
        <span
          className="exa-search-icon"
          aria-hidden="true"
        >
          ⌕
        </span>

        <input
          type="search"
          value={searchQuery}
          onChange={(event) =>
            setSearchQuery(
              event.target.value,
            )
          }
          placeholder="Search stocks, sectors or themes..."
          aria-label="Search stocks, sectors or themes"
        />

        <button type="submit">
          Analyze
        </button>
      </form>

      {marketError && (
        <div className="exa-market-api-notice error">
          <strong>
            Live data unavailable:
          </strong>{" "}
          {marketError} Demo index data is being shown temporarily.
        </div>
      )}

      <section className="exa-index-section">
        <div className="exa-section-heading">
          <div>
            <p>
              MARKET OVERVIEW
            </p>

            <h2>
              Indian indices
            </h2>
          </div>

          <div className="exa-market-data-controls">
            <span
              className={
                marketError
                  ? "exa-market-data-badge fallback"
                  : "exa-market-data-badge live"
              }
            >
              {getMarketDataLabel()}
            </span>

            <button
              type="button"
              className="exa-market-refresh-button"
              onClick={
                handleRefreshMarketData
              }
              disabled={
                marketLoading ||
                marketRefreshing
              }
            >
              {marketRefreshing
                ? "Refreshing..."
                : "Refresh"}
            </button>
          </div>
        </div>

        <div className="exa-index-grid">
          {indices.map((index) => (
            <MarketIndexCard
              key={index.ticker}
              index={index}
            />
          ))}
        </div>
      </section>

      <section className="exa-dashboard-main-grid">
        <div className="exa-pulse-grid-item">
  <MarketPulse
    data={dashboardMockData.marketPulse}
    breadth={marketBreadth}
    indices={indices}
    sectors={sectors}
    loading={
      marketLoading ||
      breadthLoading
    }
    error={
      marketError ||
      breadthError
    }
  />
</div>

        <div className="exa-breadth-grid-item">
          <MarketBreadth
            data={marketBreadth}
          />

          {breadthLoading && (
            <div className="exa-watchlist-live-status loading">
              Loading live market breadth...
            </div>
          )}

          {breadthError && (
            <div className="exa-watchlist-live-status error">
              Live market breadth could not be loaded. Temporary fallback data is displayed.
            </div>
          )}
        </div>

        <div className="exa-sector-grid-item">
          <SectorPerformance
            sectors={sectors}
          />
        </div>
      </section>

      <section className="exa-stage3-grid">
        <div className="exa-watchlist-grid-item">
          <WatchlistCard
            stocks={watchlist}
            onAnalyze={handleAnalyze}
            onRemove={
              handleRemoveFromWatchlist
            }
          />

          {watchlistLoading && (
            <div className="exa-watchlist-live-status loading">
              Loading live watchlist prices...
            </div>
          )}

          {watchlistError && (
            <div className="exa-watchlist-live-status error">
              {watchlistError}
            </div>
          )}

          {watchlist.length === 0 && (
            <button
              type="button"
              className="exa-restore-watchlist"
              onClick={
                handleRestoreWatchlist
              }
            >
              Restore default watchlist
            </button>
          )}
        </div>

        <div className="exa-alerts-grid-item">
          <ImportantAlerts
            alerts={
              dashboardMockData
                .alerts
            }
            onAnalyze={handleAnalyze}
          />
        </div>

        <div className="exa-movers-grid-item">
          <MarketMovers
            movers={marketMovers}
            onAnalyze={handleAnalyze}
            loading={moversLoading}
            error={moversError}
            status={
              liveMoversAvailable
                ? "live"
                : "fallback"
            }
          />
        </div>

        <div className="exa-recent-grid-item">
          <RecentAnalyses
            analyses={
              recentAnalyses
            }
            onAnalyze={handleAnalyze}
            onClear={clearAnalyses}
          />
        </div>
      </section>

      <p className="exa-dashboard-note">
        {usingLiveCoreData
          ? "Indian indices and sectors are loaded live from Yahoo Finance."
          : "Some index or sector values are using fallback data because live data is unavailable."}{" "}
        Watchlist prices, Market Movers and Market Breadth are requested from Yahoo Finance.
        Market Pulse and Important Alerts remain development-stage indicators.
        EXA scores appear only after a successful AI analysis.
      </p>
    </main>
  );
}