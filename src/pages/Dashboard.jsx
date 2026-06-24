
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  dashboardMockData,
} from "../data/dashboardMockData";

import {
  getDashboardMarketData,
  getMarketAlerts,
  getMarketBreadth,
  getMarketMovers,
  getWatchlistQuotes,
} from "../services/dashboardApi";

import AppShell from "../components/layout/AppShell";

import useDashboardStorage from "../hooks/useDashboardStorage";

import DashboardRightRail from
  "../components/dashboard/DashboardRightRail";

import DashboardStats from
  "../components/dashboard/DashboardStats";

import MarketBreadth from
  "../components/dashboard/MarketBreadth";

import MarketIndexCard from
  "../components/dashboard/MarketIndexCard";

import MarketMovers from
  "../components/dashboard/MarketMovers";

import MarketPulse from
  "../components/dashboard/MarketPulse";

import PremiumMarketOverview from
  "../components/dashboard/PremiumMarketOverview";

import SectorPerformance from
  "../components/dashboard/SectorPerformance";

/*
 * Original component styles must load first.
 * Premium V2 overrides must load second.
 */
import "../styles/dashboard.css";
import "../styles/dashboard-v2.css";

function getAiView(signal) {
  const normalizedSignal = String(
    signal || "",
  )
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

  if (normalizedSignal === "WATCH") {
    return "Watch";
  }

  if (normalizedSignal === "NEUTRAL") {
    return "Neutral";
  }

  return "Not analyzed";
}

function isAbortError(error) {
  return error?.name === "AbortError";
}

export default function Dashboard() {
  const navigate = useNavigate();

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
    liveMarketAlerts,
    setLiveMarketAlerts,
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

  const [
    alertsLoading,
    setAlertsLoading,
  ] = useState(true);

  const [
    alertsError,
    setAlertsError,
  ] = useState("");

  const {
    watchlistSymbols = [],
    recentAnalyses = [],
    removeSymbol,
    clearAnalyses,
  } = useDashboardStorage();

  const loadMarketData = useCallback(
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
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        console.error(
          "Dashboard market data error:",
          error,
        );

        setMarketError(
          error instanceof Error
            ? error.message
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

  const loadWatchlistData = useCallback(
    async ({
      refresh = false,
      signal,
    } = {}) => {
      if (watchlistSymbols.length === 0) {
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
            symbols: watchlistSymbols,
            refresh,
            signal,
          });

        setLiveWatchlistQuotes(
          Array.isArray(data?.quotes)
            ? data.quotes
            : [],
        );
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        console.error(
          "Watchlist quote error:",
          error,
        );

        setWatchlistError(
          error instanceof Error
            ? error.message
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
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          console.error(
            "Market Movers error:",
            error,
          );

          setMoversError(
            error instanceof Error
              ? error.message
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
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          console.error(
            "Market breadth error:",
            error,
          );

          setBreadthError(
            error instanceof Error
              ? error.message
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

  const loadMarketAlertsData =
    useCallback(
      async ({
        refresh = false,
        signal,
      } = {}) => {
        setAlertsLoading(true);
        setAlertsError("");

        try {
          const data =
            await getMarketAlerts({
              refresh,
              signal,
            });

          setLiveMarketAlerts(
            Array.isArray(data?.alerts)
              ? data.alerts
              : [],
          );
        } catch (error) {
          if (isAbortError(error)) {
            return;
          }

          console.error(
            "Market alerts error:",
            error,
          );

          setAlertsError(
            error instanceof Error
              ? error.message
              : "Unable to load live market alerts.",
          );

          setLiveMarketAlerts(null);
        } finally {
          if (!signal?.aborted) {
            setAlertsLoading(false);
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

  useEffect(() => {
    const controller =
      new AbortController();

    loadMarketAlertsData({
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadMarketAlertsData]);

  const watchlist = useMemo(() => {
    const mockStockMap = new Map(
      dashboardMockData.watchlist.map(
        (stock) => [
          String(
            stock.symbol,
          ).toUpperCase(),
          stock,
        ],
      ),
    );

    const liveQuoteMap = new Map(
      liveWatchlistQuotes.map(
        (quote) => [
          String(
            quote.symbol,
          ).toUpperCase(),
          quote,
        ],
      ),
    );

    const recentAnalysisMap = new Map(
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
        const symbol = String(
          savedSymbol,
        ).toUpperCase();

        const mockStock =
          mockStockMap.get(symbol);

        const liveQuote =
          liveQuoteMap.get(symbol);

        const savedAnalysis =
          recentAnalysisMap.get(symbol);

        return {
          symbol,

          name:
            liveQuote?.name ||
            savedAnalysis?.company ||
            mockStock?.name ||
            symbol,

          logoDomain:
            savedAnalysis?.logoDomain ||
            mockStock?.logoDomain ||
            "",

          price:
            liveQuote?.price ?? null,

          change:
            liveQuote?.change ?? null,

          changePercent:
            liveQuote?.changePercent ??
            null,

          marketState:
            liveQuote?.marketState ||
            "UNKNOWN",

          exaScore:
            savedAnalysis?.score ??
            savedAnalysis
              ?.confidenceScore ??
            null,

          aiView: savedAnalysis
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
      liveMarketMovers &&
        (
          liveMarketMovers
            .gainers?.length ||
          liveMarketMovers
            .losers?.length ||
          liveMarketMovers
            .active?.length
        ),
    );

  const liveBreadthAvailable =
    Boolean(
      liveMarketBreadth &&
        Number(
          liveMarketBreadth.totalStocks,
        ) > 0,
    );

  const liveAlertsAvailable =
    Array.isArray(
      liveMarketAlerts,
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

  const importantAlerts =
    liveAlertsAvailable
      ? liveMarketAlerts
      : dashboardMockData.alerts;

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

  function handleOpenWatchlist() {
    navigate("/analyze");
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

    loadMarketAlertsData({
      refresh: true,
    });
  }

  function getMarketDataLabel() {
    if (marketLoading) {
      return "Loading live data";
    }

    if (marketError) {
      return "Fallback data";
    }

    if (liveMarketData?.cached) {
      return "Live · cached";
    }

    return "Live data";
  }

  return (
    <AppShell>
      <main className="exa-dashboard-page exa-dashboard-v2">
        <section className="exa-dashboard-header">
          <div>
            <p className="exa-dashboard-eyebrow">
              EXA NEXUS
            </p>

            <h1>Dashboard</h1>

            <p className="exa-dashboard-subtitle">
              Your Indian market overview,
              AI research and investment
              intelligence.
            </p>
          </div>

          <div className="exa-v2-heading-actions">
            {[
              "1D",
              "1W",
              "1M",
              "3M",
              "1Y",
            ].map((period) => (
              <button
                key={period}
                type="button"
                className={
                  period === "1D"
                    ? "exa-v2-timeframe-button active"
                    : "exa-v2-timeframe-button"
                }
              >
                {period}
              </button>
            ))}

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
        </section>

        <DashboardStats
          marketStatus={marketStatus}
          indices={indices}
          breadth={marketBreadth}
          sectors={sectors}
          alerts={importantAlerts}
          loading={
            marketLoading ||
            breadthLoading ||
            alertsLoading
          }
        />

        <section className="exa-dashboard-workspace">
          <div className="exa-dashboard-primary-column">
            {marketError && (
              <div className="exa-market-api-notice error">
                <strong>
                  Live data unavailable:
                </strong>{" "}
                {marketError}
              </div>
            )}

            <PremiumMarketOverview
              indices={indices}
              breadth={marketBreadth}
              sectors={sectors}
              alerts={importantAlerts}
              marketStatus={marketStatus}
              loading={
                marketLoading ||
                breadthLoading
              }
              onOpenAnalyze={() =>
                navigate("/analyze")
              }
            />

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

                <span
                  className={
                    marketError
                      ? "exa-market-data-badge fallback"
                      : "exa-market-data-badge live"
                  }
                >
                  {getMarketDataLabel()}
                </span>
              </div>

              <div className="exa-index-grid">
                {indices.map((index) => (
                  <MarketIndexCard
                    key={
                      index.ticker ||
                      index.symbol
                    }
                    index={index}
                  />
                ))}
              </div>
            </section>

            <section className="exa-dashboard-main-grid">
              <div className="exa-pulse-grid-item">
                <MarketPulse
                  data={
                    dashboardMockData
                      .marketPulse
                  }
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
                    Live market breadth is
                    temporarily unavailable.
                  </div>
                )}
              </div>

              <div className="exa-sector-grid-item">
                <SectorPerformance
                  sectors={sectors}
                />
              </div>
            </section>

            <section className="exa-main-movers-section">
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
            </section>
          </div>

          <DashboardRightRail
            watchlist={watchlist}
            alerts={importantAlerts}
            recentAnalyses={
              recentAnalyses
            }
            watchlistLoading={
              watchlistLoading
            }
            watchlistError={
              watchlistError
            }
            alertsLoading={
              alertsLoading
            }
            alertsError={
              alertsError
            }
            onAnalyze={handleAnalyze}
            onRemoveStock={
              removeSymbol
            }
            onClearAnalyses={
              clearAnalyses
            }
            onViewWatchlist={
              handleOpenWatchlist
            }
          />
        </section>

        <p className="exa-dashboard-note">
          Live market prices are provided
          through Yahoo Finance. EXA Market
          Pulse and Important Alerts are
          generated from live market data.
          Information is provided for
          educational research and does not
          represent investment advice.
        </p>
      </main>
    </AppShell>
  );
}
