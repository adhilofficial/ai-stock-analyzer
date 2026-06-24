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

import "../styles/dashboard.css";

export default function Dashboard() {
  const navigate =
    useNavigate();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

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

        <article className="exa-dashboard-card exa-next-card">
          <p className="exa-card-eyebrow">
            BUILDING NEXT
          </p>

          <h2>Dashboard Roadmap</h2>

          <div className="exa-roadmap-list">
            <div>
              <span>01</span>

              <p>
                Market breadth and
                advance-decline ratio
              </p>
            </div>

            <div>
              <span>02</span>

              <p>
                Sector performance
                heatmap
              </p>
            </div>

            <div>
              <span>03</span>

              <p>
                Watchlist and market
                movers
              </p>
            </div>
          </div>
        </article>
      </section>

      <p className="exa-dashboard-note">
        The values displayed during this
        development stage are demonstration
        data. Live market information will be
        connected after the interface is
        completed.
      </p>
    </main>
  );
}