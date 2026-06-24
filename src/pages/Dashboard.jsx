import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  dashboardMockData,
} from "../data/dashboardMockData";

import MarketIndexCard from "../components/dashboard/MarketIndexCard";
import MarketPulse from "../components/dashboard/MarketPulse";
import MarketBreadth from "../components/dashboard/MarketBreadth";
import SectorPerformance from "../components/dashboard/SectorPerformance";
import WatchlistCard from "../components/dashboard/WatchlistCard";
import MarketMovers from "../components/dashboard/MarketMovers";
import ImportantAlerts from "../components/dashboard/ImportantAlerts";

import "../styles/dashboard.css";

export default function Dashboard() {
  const navigate =
    useNavigate();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    watchlist,
    setWatchlist,
  ] = useState(
    dashboardMockData.watchlist,
  );

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

    setWatchlist(
      (currentStocks) =>
        currentStocks.filter(
          (stock) =>
            stock.symbol !== symbol,
        ),
    );
  }

  return (
    <main className="exa-dashboard-page">
      <section className="exa-dashboard-header">
        <div>
          <p className="exa-dashboard-eyebrow">
            EXA NEXUS
          </p>

          <h1>Market Dashboard</h1>

          <p className="exa-dashboard-subtitle">
            Indian market overview,
            sentiment and research
            intelligence.
          </p>
        </div>

        <div className="exa-market-status">
          <span
            className={
              dashboardMockData
                .marketStatus.isOpen
                ? "status-dot open"
                : "status-dot closed"
            }
          />

          <div>
            <strong>
              {
                dashboardMockData
                  .marketStatus.label
              }
            </strong>

            <small>
              Updated{" "}
              {
                dashboardMockData
                  .marketStatus
                  .lastUpdated
              }
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

      <section className="exa-index-section">
        <div className="exa-section-heading">
          <div>
            <p>MARKET OVERVIEW</p>
            <h2>Indian indices</h2>
          </div>

          <span>Demo data</span>
        </div>

        <div className="exa-index-grid">
          {dashboardMockData.indices.map(
            (index) => (
              <MarketIndexCard
                key={index.ticker}
                index={index}
              />
            ),
          )}
        </div>
      </section>

      <section className="exa-dashboard-main-grid">
        <div className="exa-pulse-grid-item">
          <MarketPulse
            data={
              dashboardMockData
                .marketPulse
            }
          />
        </div>

        <div className="exa-breadth-grid-item">
          <MarketBreadth
            data={
              dashboardMockData
                .breadth
            }
          />
        </div>

        <div className="exa-sector-grid-item">
          <SectorPerformance
            sectors={
              dashboardMockData
                .sectors
            }
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
        </div>

        <div className="exa-alerts-grid-item">
          <ImportantAlerts
            alerts={
              dashboardMockData.alerts
            }
            onAnalyze={handleAnalyze}
          />
        </div>

        <div className="exa-movers-grid-item">
          <MarketMovers
            movers={
              dashboardMockData.movers
            }
            onAnalyze={handleAnalyze}
          />
        </div>
      </section>

      <p className="exa-dashboard-note">
        Values displayed during this
        development stage are demonstration
        data. Live Yahoo Finance information
        will be connected after the dashboard
        interface is verified.
      </p>
    </main>
  );
}