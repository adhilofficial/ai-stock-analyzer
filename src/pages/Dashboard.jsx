
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ExternalLink,
  LoaderCircle,
  Search,
  X,
} from "lucide-react";

import {
  dashboardMockData,
} from "../data/dashboardMockData";

import {
  getDashboardMarketData,
  getMarketAlerts,
  getMarketBreadth,
  getMarketMovers,
  getMarketNews,
  getWatchlistQuotes,
} from "../services/dashboardApi";

import {
  searchStocks,
} from "../services/financeApi";

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

import useAutoRefresh from "../hooks/useAutoRefresh";


/*
 * Original component styles must load first.
 * Premium V2 overrides must load second.
 */
import "../styles/dashboard.css";
import "../styles/dashboard-v2.css";


const DASHBOARD_POPULAR_STOCKS = [
  {
    symbol: "RELIANCE.NS",
    name: "Reliance Industries Limited",
    exchange: "NSE",
    currency: "INR",
    logoDomain: "ril.com",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=RELIANCE",
    companyUrl:
      "https://www.ril.com",
  },
  {
    symbol: "HDFCBANK.NS",
    name: "HDFC Bank Limited",
    exchange: "NSE",
    currency: "INR",
    logoDomain: "hdfcbank.com",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=HDFCBANK",
    companyUrl:
      "https://www.hdfcbank.com",
  },
  {
    symbol: "INFY.NS",
    name: "Infosys Limited",
    exchange: "NSE",
    currency: "INR",
    logoDomain: "infosys.com",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=INFY",
    companyUrl:
      "https://www.infosys.com",
  },
  {
    symbol: "TCS.NS",
    name: "Tata Consultancy Services Limited",
    exchange: "NSE",
    currency: "INR",
    logoDomain: "tcs.com",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=TCS",
    companyUrl:
      "https://www.tcs.com",
  },
  {
    symbol: "ICICIBANK.NS",
    name: "ICICI Bank Limited",
    exchange: "NSE",
    currency: "INR",
    logoDomain: "icicibank.com",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=ICICIBANK",
    companyUrl:
      "https://www.icicibank.com",
  },
  {
    symbol: "SBIN.NS",
    name: "State Bank of India",
    exchange: "NSE",
    currency: "INR",
    logoDomain: "sbi.co.in",
    nseUrl:
      "https://www.nseindia.com/get-quotes/equity?symbol=SBIN",
    companyUrl:
      "https://sbi.co.in",
  },
];

const DASHBOARD_ANALYZER_STYLES = `
  .exa-dashboard-research-search {
    position: relative;
    z-index: 10;
    margin-bottom: 18px;
    padding: 16px;
    border: 1px solid rgba(96, 165, 250, 0.16);
    border-radius: 18px;
    background:
      linear-gradient(
        145deg,
        rgba(14, 28, 51, 0.98),
        rgba(7, 18, 35, 0.99)
      );
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.18);
  }

  .exa-dashboard-search-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 12px;
  }

  .exa-dashboard-search-heading p {
    margin: 0 0 4px;
    color: #60a5fa;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .exa-dashboard-search-heading h2 {
    margin: 0;
    color: #f8fafc;
    font-size: 17px;
  }

  .exa-dashboard-search-heading span {
    color: #64748b;
    font-size: 12px;
  }

  .exa-dashboard-search-form {
    position: relative;
  }

  .exa-dashboard-search-box {
    position: relative;
    display: flex;
    align-items: center;
    min-height: 52px;
    border: 1px solid rgba(96, 165, 250, 0.2);
    border-radius: 14px;
    background: rgba(5, 16, 31, 0.9);
  }

  .exa-dashboard-search-box:focus-within {
    border-color: rgba(96, 165, 250, 0.58);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .exa-dashboard-search-box > svg {
    position: absolute;
    left: 16px;
    color: #64748b;
    pointer-events: none;
  }

  .exa-dashboard-search-input {
    width: 100%;
    height: 50px;
    padding: 0 104px 0 46px;
    border: 0;
    outline: 0;
    color: #f8fafc;
    background: transparent;
    font: inherit;
    font-size: 14px;
  }

  .exa-dashboard-search-input::placeholder {
    color: #64748b;
  }

  .exa-dashboard-search-clear {
    position: absolute;
    right: 52px;
    width: 32px;
    height: 32px;
    border: 0;
    border-radius: 9px;
    color: #64748b;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .exa-dashboard-search-clear:hover {
    color: #e2e8f0;
    background: rgba(148, 163, 184, 0.08);
  }

  .exa-dashboard-search-submit {
    position: absolute;
    right: 7px;
    width: 38px;
    height: 38px;
    border: 1px solid rgba(96, 165, 250, 0.24);
    border-radius: 11px;
    color: #dbeafe;
    background:
      linear-gradient(
        135deg,
        rgba(37, 99, 235, 0.96),
        rgba(79, 70, 229, 0.96)
      );
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .exa-dashboard-search-submit:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  .exa-dashboard-suggestions {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    left: 0;
    z-index: 500;
    max-height: 430px;
    padding: 7px;
    overflow-y: auto;
    border: 1px solid rgba(96, 165, 250, 0.2);
    border-radius: 14px;
    background: rgba(7, 17, 31, 0.99);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(18px);
  }

  .exa-dashboard-suggestion-title {
    padding: 8px 10px 6px;
    color: #60a5fa;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .exa-dashboard-suggestion {
    padding: 9px;
    border-radius: 11px;
    transition: background 0.16s ease;
  }

  .exa-dashboard-suggestion:hover,
  .exa-dashboard-suggestion.active {
    background: rgba(37, 99, 235, 0.14);
  }

  .exa-dashboard-suggestion-main {
    width: 100%;
    padding: 0;
    border: 0;
    color: inherit;
    background: transparent;
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
    align-items: center;
    gap: 11px;
    text-align: left;
    cursor: pointer;
  }

  .exa-dashboard-company-logo {
    overflow: hidden;
    border-radius: 50%;
    background: #1e293b;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .exa-dashboard-company-logo img {
    width: 70%;
    height: 70%;
    object-fit: contain;
  }

  .exa-dashboard-company-logo span {
    color: #93c5fd;
    font-weight: 800;
  }

  .exa-dashboard-suggestion-copy {
    min-width: 0;
  }

  .exa-dashboard-suggestion-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-dashboard-suggestion-copy span {
    display: block;
    margin-top: 3px;
    overflow: hidden;
    color: #64748b;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-dashboard-suggestion-price {
    min-width: 100px;
    text-align: right;
  }

  .exa-dashboard-suggestion-price strong {
    display: block;
    color: #f8fafc;
    font-size: 12px;
    white-space: nowrap;
  }

  .exa-dashboard-suggestion-price span {
    display: block;
    margin-top: 3px;
    font-size: 11px;
    font-weight: 800;
  }

  .exa-dashboard-suggestion-price .positive {
    color: #22c55e;
  }

  .exa-dashboard-suggestion-price .negative {
    color: #ef4444;
  }

  .exa-dashboard-suggestion-links {
    margin: 7px 0 0 51px;
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .exa-dashboard-suggestion-links a {
    padding: 4px 7px;
    border: 1px solid rgba(96, 165, 250, 0.16);
    border-radius: 7px;
    color: #93c5fd;
    font-size: 10px;
    font-weight: 700;
    text-decoration: none;
  }

  .exa-dashboard-suggestion-links a:hover {
    border-color: rgba(96, 165, 250, 0.42);
    color: #ffffff;
    background: rgba(37, 99, 235, 0.12);
  }

  .exa-dashboard-suggestion-status {
    min-height: 60px;
    padding: 12px;
    color: #94a3b8;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .exa-dashboard-recent-section {
    margin: 0 0 18px;
    padding: 18px;
    border: 1px solid rgba(96, 165, 250, 0.14);
    border-radius: 18px;
    background: rgba(10, 24, 43, 0.86);
  }

  .exa-dashboard-recent-header {
    margin-bottom: 14px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .exa-dashboard-recent-header p {
    margin: 0 0 4px;
    color: #60a5fa;
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .exa-dashboard-recent-header h2 {
    margin: 0;
    color: #f8fafc;
    font-size: 17px;
  }

  .exa-dashboard-recent-header button {
    border: 0;
    color: #93c5fd;
    background: transparent;
    font-size: 12px;
    cursor: pointer;
  }

  .exa-dashboard-recent-grid {
    display: grid;
    grid-template-columns:
      repeat(auto-fit, minmax(230px, 1fr));
    gap: 12px;
  }

  .exa-dashboard-recent-card {
    min-width: 0;
    padding: 14px;
    border: 1px solid #1e293b;
    border-radius: 14px;
    background:
      linear-gradient(
        145deg,
        rgba(16, 26, 48, 0.98),
        rgba(9, 22, 39, 0.98)
      );
  }

  .exa-dashboard-recent-top {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exa-dashboard-recent-copy {
    min-width: 0;
    flex: 1;
  }

  .exa-dashboard-recent-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-dashboard-recent-copy span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 11px;
  }

  .exa-dashboard-recent-move {
    font-size: 11px;
    font-weight: 800;
  }

  .exa-dashboard-recent-move.positive {
    color: #22c55e;
  }

  .exa-dashboard-recent-move.negative {
    color: #ef4444;
  }

  .exa-dashboard-recent-price {
    margin-top: 12px;
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
  }

  .exa-dashboard-recent-price strong {
    color: #f8fafc;
    font-size: 18px;
  }

  .exa-dashboard-recent-price span {
    color: #64748b;
    font-size: 10px;
  }

  .exa-dashboard-recent-scores {
    margin-top: 12px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 7px;
  }

  .exa-dashboard-recent-score {
    min-width: 0;
    padding: 8px;
    border: 1px solid rgba(148, 163, 184, 0.1);
    border-radius: 9px;
    background: rgba(15, 30, 54, 0.62);
  }

  .exa-dashboard-recent-score span {
    display: block;
    color: #64748b;
    font-size: 9px;
  }

  .exa-dashboard-recent-score strong {
    display: block;
    margin-top: 3px;
    overflow: hidden;
    color: #dbeafe;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-dashboard-recent-action {
    width: 100%;
    margin-top: 12px;
    padding: 9px 11px;
    border: 1px solid rgba(96, 165, 250, 0.2);
    border-radius: 10px;
    color: #bfdbfe;
    background: rgba(37, 99, 235, 0.1);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 11px;
    font-weight: 750;
  }

  .exa-dashboard-recent-action:hover {
    color: #ffffff;
    border-color: rgba(96, 165, 250, 0.44);
    background: rgba(37, 99, 235, 0.2);
  }

  .exa-dashboard-recent-empty {
    padding: 22px;
    border: 1px dashed rgba(96, 165, 250, 0.2);
    border-radius: 13px;
    color: #94a3b8;
    text-align: center;
    font-size: 12px;
  }

  .exa-dashboard-recent-empty button {
    margin-top: 10px;
    padding: 8px 12px;
    border: 1px solid rgba(96, 165, 250, 0.22);
    border-radius: 9px;
    color: #bfdbfe;
    background: rgba(37, 99, 235, 0.12);
    cursor: pointer;
  }


  .exa-dashboard-top-search {
    position: relative;
    width: min(620px, 52vw);
    min-width: 280px;
  }

  .exa-dashboard-top-search .exa-dashboard-search-form {
    width: 100%;
  }

  .exa-dashboard-top-search .exa-dashboard-search-box {
    min-height: 44px;
    border-radius: 12px;
  }

  .exa-dashboard-top-search .exa-dashboard-search-input {
    height: 42px;
    padding-right: 96px;
    font-size: 12px;
  }

  .exa-dashboard-top-search .exa-dashboard-search-submit {
    width: 34px;
    height: 34px;
    right: 5px;
  }

  .exa-dashboard-top-search .exa-dashboard-search-clear {
    right: 46px;
  }

  .exa-dashboard-top-search .exa-dashboard-suggestions {
    top: calc(100% + 10px);
    min-width: min(760px, 78vw);
  }

  .exa-topbar-custom-search {
    width: 100%;
    max-width: 680px;
  }

  @media (max-width: 700px) {
    .exa-dashboard-search-heading {
      align-items: flex-start;
      flex-direction: column;
      gap: 5px;
    }

    .exa-dashboard-search-heading span {
      display: none;
    }

    .exa-dashboard-suggestion-main {
      grid-template-columns: 38px minmax(0, 1fr) auto;
    }

    .exa-dashboard-suggestion-price {
      min-width: 82px;
    }

    .exa-dashboard-recent-scores {
      grid-template-columns: repeat(2, 1fr);
    }

    .exa-dashboard-top-search {
      width: min(100%, 360px);
      min-width: 0;
    }

    .exa-dashboard-top-search .exa-dashboard-suggestions {
      right: -90px;
      left: 0;
      min-width: min(92vw, 520px);
    }
  }
`;

function formatDashboardPrice(
  value,
  currency = "INR",
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "Price unavailable";
  }

  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency:
          currency || "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(number);
  } catch {
    return number.toFixed(2);
  }
}

function formatDashboardChange(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "";
  }

  return `${number >= 0 ? "+" : ""}${number.toFixed(2)}%`;
}

function DashboardCompanyLogo({
  domain,
  name,
  size = 40,
}) {
  const [failed, setFailed] =
    useState(false);

  useEffect(() => {
    setFailed(false);
  }, [domain]);

  const logoKey =
    import.meta.env.VITE_LOGO_KEY;

  const showImage =
    Boolean(
      domain &&
      logoKey &&
      !failed,
    );

  return (
    <div
      className="exa-dashboard-company-logo"
      style={{
        width: size,
        height: size,
        background:
          showImage
            ? "#ffffff"
            : "#1e293b",
      }}
    >
      {showImage ? (
        <img
          src={`https://img.logo.dev/${domain}?token=${logoKey}&size=128&format=webp`}
          alt={name || "Company logo"}
          onError={() =>
            setFailed(true)
          }
        />
      ) : (
        <span
          style={{
            fontSize:
              Math.max(
                12,
                size * 0.34,
              ),
          }}
        >
          {name
            ?.charAt(0)
            ?.toUpperCase() ||
            "?"}
        </span>
      )}
    </div>
  );
}

function DashboardSuggestionList({
  title,
  suggestions,
  loading,
  activeIndex,
  onActivate,
  onSelect,
}) {
  return (
    <div
      className="exa-dashboard-suggestions"
      role="listbox"
      aria-label="Dashboard stock suggestions"
    >
      <div className="exa-dashboard-suggestion-title">
        {title}
      </div>

      {loading && (
        <div className="exa-dashboard-suggestion-status">
          <LoaderCircle
            size={17}
            className="exa-analyze-spinner"
          />
          Searching stocks…
        </div>
      )}

      {!loading &&
        suggestions.map(
          (suggestion, index) => {
            const change =
              Number(
                suggestion.changePercent,
              );

            const hasChange =
              Number.isFinite(change);

            const externalLinks = [
              {
                label: "Website",
                url:
                  suggestion.companyUrl ||
                  suggestion.website,
              },
              {
                label: "NSE",
                url: suggestion.nseUrl,
              },
              {
                label: "BSE",
                url: suggestion.bseUrl,
              },
            ].filter(
              (link) =>
                Boolean(link.url),
            );

            return (
              <div
                key={suggestion.symbol}
                role="option"
                aria-selected={
                  activeIndex === index
                }
                className={`exa-dashboard-suggestion ${
                  activeIndex === index
                    ? "active"
                    : ""
                }`}
                onMouseEnter={() =>
                  onActivate(index)
                }
              >
                <button
                  type="button"
                  className="exa-dashboard-suggestion-main"
                  onMouseDown={(event) =>
                    event.preventDefault()
                  }
                  onClick={() =>
                    onSelect(suggestion)
                  }
                >
                  <DashboardCompanyLogo
                    domain={
                      suggestion.logoDomain
                    }
                    name={suggestion.name}
                    size={40}
                  />

                  <div className="exa-dashboard-suggestion-copy">
                    <strong>
                      {suggestion.name}
                    </strong>

                    <span>
                      {suggestion.symbol}
                      {suggestion.exchange
                        ? ` · ${suggestion.exchange}`
                        : ""}
                    </span>
                  </div>

                  <div className="exa-dashboard-suggestion-price">
                    <strong>
                      {formatDashboardPrice(
                        suggestion.price,
                        suggestion.currency,
                      )}
                    </strong>

                    {hasChange && (
                      <span
                        className={
                          change >= 0
                            ? "positive"
                            : "negative"
                        }
                      >
                        {formatDashboardChange(
                          change,
                        )}
                      </span>
                    )}
                  </div>
                </button>

                {externalLinks.length >
                  0 && (
                  <div className="exa-dashboard-suggestion-links">
                    {externalLinks.map(
                      (link) => (
                        <a
                          key={link.label}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          onMouseDown={(
                            event,
                          ) =>
                            event.preventDefault()
                          }
                          onClick={(
                            event,
                          ) =>
                            event.stopPropagation()
                          }
                        >
                          {link.label}
                          <ExternalLink
                            size={9}
                            style={{
                              marginLeft: 4,
                            }}
                          />
                        </a>
                      ),
                    )}
                  </div>
                )}
              </div>
            );
          },
        )}

      {!loading &&
        suggestions.length === 0 && (
          <div className="exa-dashboard-suggestion-status">
            No matching Indian stocks found.
          </div>
        )}
    </div>
  );
}


function DashboardSearchControl({
  query,
  setQuery,
  open,
  setOpen,
  loading,
  activeIndex,
  setActiveIndex,
  suggestions,
  onKeyDown,
  onSubmit,
  onSelect,

  source,
  activeSource,
  setActiveSource,

  compact = false,
}) {
  const isActive =
    open &&
    activeSource === source;

  function activateSearch() {
    setActiveSource(source);
    setOpen(true);
    setActiveIndex(-1);
  }

  return (
    <div
      className={
        compact
          ? "exa-dashboard-top-search"
          : undefined
      }
    >
      <form
        className="exa-dashboard-search-form"
        onSubmit={onSubmit}
      >
        <div className="exa-dashboard-search-box">
          <Search size={18} />

          <input
            type="search"
            value={query}
            onChange={(event) => {
              setActiveSource(source);
              setQuery(event.target.value);
              setOpen(true);
              setActiveIndex(-1);
            }}
            onFocus={activateSearch}
            onBlur={() => {
              window.setTimeout(() => {
                setActiveSource(
                  (currentSource) =>
                    currentSource === source
                      ? null
                      : currentSource,
                );

                setOpen(false);
                setActiveIndex(-1);
              }, 180);
            }}
            onKeyDown={onKeyDown}
            placeholder={
              compact
                ? "Search NSE/BSE stocks..."
                : "Search Reliance, HDFC, TCS or any NSE/BSE stock..."
            }
            className="exa-dashboard-search-input"
            autoComplete="off"
            aria-label="Search NSE and BSE stocks"
            aria-expanded={isActive}
          />

          {query && (
            <button
              type="button"
              className="exa-dashboard-search-clear"
              onMouseDown={(event) => {
                event.preventDefault();
              }}
              onClick={() => {
                setActiveSource(source);
                setQuery("");
                setActiveIndex(-1);
                setOpen(true);
              }}
              aria-label="Clear stock search"
            >
              <X size={16} />
            </button>
          )}

          <button
            type="submit"
            className="exa-dashboard-search-submit"
            disabled={loading}
            aria-label="Open stock analysis"
          >
            {loading ? (
              <LoaderCircle
                size={18}
                className="exa-analyze-spinner"
              />
            ) : (
              <Search size={18} />
            )}
          </button>
        </div>

        {isActive && (
          <DashboardSuggestionList
            title={
              query.trim()
                ? "Matching stocks"
                : "Popular stocks"
            }
            suggestions={suggestions}
            loading={loading}
            activeIndex={activeIndex}
            onActivate={setActiveIndex}
            onSelect={onSelect}
          />
        )}
      </form>
    </div>
  );
}

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

  const suggestionRequestRef =
    useRef(0);

  const searchSectionRef =
    useRef(null);

  const [
    dashboardSearchQuery,
    setDashboardSearchQuery,
  ] = useState("");

  const [
    dashboardSuggestions,
    setDashboardSuggestions,
  ] = useState([]);

  const [
    dashboardSearchOpen,
    setDashboardSearchOpen,
  ] = useState(false);

  const [
    dashboardSearchLoading,
    setDashboardSearchLoading,
  ] = useState(false);

  const [
    dashboardActiveSuggestionIndex,
    setDashboardActiveSuggestionIndex,
  ] = useState(-1);

  const [
    showFloatingSearch,
    setShowFloatingSearch,
  ] = useState(false);
  const [
    activeSearchSurface,
    setActiveSearchSurface,
  ] = useState(null);

  const [
    popularSuggestions,
    setPopularSuggestions,
  ] = useState(
    DASHBOARD_POPULAR_STOCKS,
  );

  const [
    popularSuggestionsLoading,
    setPopularSuggestionsLoading,
  ] = useState(true);

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
  liveMarketNews,
  setLiveMarketNews,
] = useState([]);

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

  const [
  newsLoading,
  setNewsLoading,
] = useState(true);

const [
  newsError,
  setNewsError,
] = useState("");

  const {
    watchlistSymbols = [],
    recentAnalyses = [],
    removeSymbol,
  } = useDashboardStorage();



  useEffect(() => {
  let animationFrameId = null;

  function updateFloatingSearch() {
    if (animationFrameId !== null) {
      return;
    }

    animationFrameId =
      window.requestAnimationFrame(
        () => {
          animationFrameId = null;

          const searchElement =
            searchSectionRef.current;

          if (!searchElement) {
            setShowFloatingSearch(
              false,
            );

            return;
          }

          const searchRect =
            searchElement.getBoundingClientRect();

          /*
           * Show the compact Topbar search only
           * after the main search input has fully
           * moved above the Topbar.
           */
          const shouldShowFloating =
            searchRect.bottom <= 84;

          setShowFloatingSearch(
            shouldShowFloating,
          );
        },
      );
  }

  updateFloatingSearch();

  /*
   * Capture scroll events from both window
   * and nested scrolling containers.
   */
  document.addEventListener(
    "scroll",
    updateFloatingSearch,
    true,
  );

  window.addEventListener(
    "resize",
    updateFloatingSearch,
  );

  return () => {
    document.removeEventListener(
      "scroll",
      updateFloatingSearch,
      true,
    );

    window.removeEventListener(
      "resize",
      updateFloatingSearch,
    );

    if (
      animationFrameId !== null
    ) {
      window.cancelAnimationFrame(
        animationFrameId,
      );
    }
  };
}, []);

  /*
 * Close the current dropdown whenever
 * the search changes between the main
 * page and the floating Topbar.
 */
useEffect(() => {
  setDashboardSearchOpen(false);

  setDashboardActiveSuggestionIndex(
    -1,
  );

  setActiveSearchSurface(null);
}, [showFloatingSearch]);

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadPopularPrices() {
      setPopularSuggestionsLoading(true);

      try {
        const data =
          await getWatchlistQuotes({
            symbols:
              DASHBOARD_POPULAR_STOCKS.map(
                (stock) =>
                  stock.symbol,
              ),
            signal: controller.signal,
          });

        if (controller.signal.aborted) {
          return;
        }

        const quotes =
          Array.isArray(data?.quotes)
            ? data.quotes
            : [];

        const quoteMap =
          new Map(
            quotes.map((quote) => [
              String(
                quote.symbol || "",
              ).toUpperCase(),
              quote,
            ]),
          );

        setPopularSuggestions(
          DASHBOARD_POPULAR_STOCKS.map(
            (stock) => {
              const quote =
                quoteMap.get(
                  stock.symbol.toUpperCase(),
                );

              return {
                ...stock,
                name:
                  quote?.name ||
                  stock.name,
                price:
                  quote?.price ??
                  null,
                change:
                  quote?.change ??
                  null,
                changePercent:
                  quote?.changePercent ??
                  null,
                currency:
                  quote?.currency ||
                  stock.currency ||
                  "INR",
                marketState:
                  quote?.marketState ||
                  null,
              };
            },
          ),
        );
      } catch (error) {
        if (
          error?.name !==
          "AbortError"
        ) {
          console.warn(
            "Popular stock prices unavailable:",
            error,
          );
        }

        setPopularSuggestions(
          DASHBOARD_POPULAR_STOCKS,
        );
      } finally {
        if (
          !controller.signal.aborted
        ) {
          setPopularSuggestionsLoading(
            false,
          );
        }
      }
    }

    loadPopularPrices();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const searchText =
      dashboardSearchQuery.trim();

    if (!searchText) {
      suggestionRequestRef.current += 1;
      setDashboardSuggestions([]);
      setDashboardSearchLoading(false);
      setDashboardActiveSuggestionIndex(-1);
      return undefined;
    }

    const requestId =
      suggestionRequestRef.current + 1;

    suggestionRequestRef.current =
      requestId;

    const timeoutId =
      window.setTimeout(
        async () => {
          setDashboardSearchLoading(true);

          try {
            const results =
              await searchStocks(
                searchText,
              );

            if (
              requestId !==
              suggestionRequestRef.current
            ) {
              return;
            }

            setDashboardSuggestions(
              Array.isArray(results)
                ? results
                    .filter(
                      (item) =>
                        item?.symbol &&
                        item?.name,
                    )
                    .slice(0, 8)
                : [],
            );
          } catch (error) {
            if (
              requestId !==
              suggestionRequestRef.current
            ) {
              return;
            }

            console.warn(
              "Dashboard stock suggestions unavailable:",
              error,
            );

            setDashboardSuggestions([]);
          } finally {
            if (
              requestId ===
              suggestionRequestRef.current
            ) {
              setDashboardSearchLoading(false);
            }
          }
        },
        320,
      );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dashboardSearchQuery]);

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

const loadMarketNewsData =
  useCallback(
    async ({
      refresh = false,
      signal,
    } = {}) => {
      setNewsLoading(true);
      setNewsError("");

      try {
        const data =
          await getMarketNews({
            refresh,
            signal,
          });

        setLiveMarketNews(
          Array.isArray(data?.articles)
            ? data.articles
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
          "Market news error:",
          caughtError,
        );

        setNewsError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load live market news.",
        );

        setLiveMarketNews([]);
      } finally {
        if (!signal?.aborted) {
          setNewsLoading(false);
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

  loadMarketNewsData({
    signal: controller.signal,
  });

  return () =>
    controller.abort();
}, [loadMarketNewsData]);

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


  const visibleDashboardSuggestions =
    dashboardSearchQuery.trim()
      ? dashboardSuggestions
      : popularSuggestions;

  const activeSearchLoading =
    dashboardSearchQuery.trim()
      ? dashboardSearchLoading
      : popularSuggestionsLoading;

  function closeDashboardSearch() {
    suggestionRequestRef.current += 1;
    setDashboardSearchOpen(false);
    setDashboardSearchLoading(false);
    setDashboardActiveSuggestionIndex(-1);
    setActiveSearchSurface(null);
  }

  function openStockAnalysis(
    symbol,
  ) {
    if (!symbol) {
      navigate("/analyze");
      return;
    }

    navigate(
      `/analyze?symbol=${encodeURIComponent(
        symbol,
      )}`,
    );
  }

  function selectDashboardSuggestion(
    suggestion,
  ) {
    if (!suggestion?.symbol) {
      return;
    }

    closeDashboardSearch();
    setDashboardSearchQuery("");
    openStockAnalysis(
      suggestion.symbol,
    );
  }

  function handleDashboardSearchSubmit(
    event,
  ) {
    event.preventDefault();

    if (
      dashboardActiveSuggestionIndex >= 0 &&
      visibleDashboardSuggestions[
        dashboardActiveSuggestionIndex
      ]
    ) {
      selectDashboardSuggestion(
        visibleDashboardSuggestions[
          dashboardActiveSuggestionIndex
        ],
      );

      return;
    }

    const firstSuggestion =
      visibleDashboardSuggestions[0];

    if (
      dashboardSearchQuery.trim() &&
      firstSuggestion?.symbol
    ) {
      selectDashboardSuggestion(
        firstSuggestion,
      );

      return;
    }

    if (dashboardSearchQuery.trim()) {
      closeDashboardSearch();

      navigate(
        `/analyze?query=${encodeURIComponent(
          dashboardSearchQuery.trim(),
        )}`,
      );
    }
  }

  function handleDashboardSearchKeyDown(
    event,
  ) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDashboardSearch();
      return;
    }

    if (
      !dashboardSearchOpen ||
      visibleDashboardSuggestions.length ===
        0
    ) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();

      setDashboardActiveSuggestionIndex(
        (current) =>
          current >=
          visibleDashboardSuggestions.length -
            1
            ? 0
            : current + 1,
      );

      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      setDashboardActiveSuggestionIndex(
        (current) =>
          current <= 0
            ? visibleDashboardSuggestions.length -
              1
            : current - 1,
      );

      return;
    }

    if (
      event.key === "Enter" &&
      dashboardActiveSuggestionIndex >=
        0
    ) {
      event.preventDefault();

      selectDashboardSuggestion(
        visibleDashboardSuggestions[
          dashboardActiveSuggestionIndex
        ],
      );
    }
  }

  function handleAnalyze(symbol) {
    openStockAnalysis(symbol);
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

    loadMarketNewsData({
  refresh: true,
    });
  }

  useAutoRefresh(
  handleRefreshMarketData,
  5 * 60 * 1000,
);

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
    <AppShell
      hideDefaultSearch
      topSearch={
        showFloatingSearch ? (
          <DashboardSearchControl
            query={dashboardSearchQuery}
            setQuery={
              setDashboardSearchQuery
            }
            open={
              dashboardSearchOpen
            }
            setOpen={
              setDashboardSearchOpen
            }
            loading={
              activeSearchLoading
            }
            activeIndex={
              dashboardActiveSuggestionIndex
            }
            setActiveIndex={
              setDashboardActiveSuggestionIndex
            }
            suggestions={
              visibleDashboardSuggestions
            }
            onKeyDown={
              handleDashboardSearchKeyDown
            }
            onSubmit={
              handleDashboardSearchSubmit
            }
            onSelect={
              selectDashboardSuggestion
            }
            source="floating"
            activeSource={
              activeSearchSurface
            }
            setActiveSource={
              setActiveSearchSurface
            }
            compact
          />
        ) : null
      }
    >
      <style>{DASHBOARD_ANALYZER_STYLES}</style>

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
        <section className="exa-dashboard-research-search">
          <div className="exa-dashboard-search-heading">
            <div>
              <p>STOCK RESEARCH</p>
              <h2>
                Search the complete NSE and BSE universe
              </h2>
            </div>

            <span>
              Open live prices, fundamentals and technicals
            </span>
          </div>

          <div ref={searchSectionRef}>
            <DashboardSearchControl
              query={dashboardSearchQuery}
              setQuery={
                setDashboardSearchQuery
              }
              open={
                dashboardSearchOpen
              }
              setOpen={
                setDashboardSearchOpen
              }
              loading={
                activeSearchLoading
              }
              activeIndex={
                dashboardActiveSuggestionIndex
              }
              setActiveIndex={
                setDashboardActiveSuggestionIndex
              }
              suggestions={
                visibleDashboardSuggestions
              }
              onKeyDown={
                handleDashboardSearchKeyDown
              }
              onSubmit={
                handleDashboardSearchSubmit
              }
              onSelect={
                selectDashboardSuggestion
              }
              source="main"
              activeSource={
                activeSearchSurface
              }
              setActiveSource={
                setActiveSearchSurface
              }
            />
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
            onViewWatchlist={
              handleOpenWatchlist
            }
            
            newsArticles={
            liveMarketNews
            }
            newsLoading={
            newsLoading
            }
            newsError={
         newsError
          }

          />
        </section>

        
      </main>
    </AppShell>
  );
}