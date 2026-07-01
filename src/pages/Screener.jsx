import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookmarkPlus,
  Check,
  ExternalLink,
  Filter,
  FolderOpen,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Save,
  Scale,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import { useLocation, useNavigate } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import SnapshotFreshnessBanner from "../components/data/SnapshotFreshnessBanner";
import CompanyLogo from "../components/common/CompanyLogo";
import "../styles/dashboard.css";
import "../styles/dashboard-v2.css";
import "../styles/snapshot-freshness.css";

const DEFAULT_FILTERS = {
  sector: "All",
  trend: "All",

  minPrice: "",
  maxPrice: "",

  minPe: "",
  maxPe: "",

  minRevenueGrowth: "",
  minRoe: "",
  minProfitMargin: "",

  maxDebtToEquity: "",

  minRsi: "",
  maxRsi: "",

  maxDistanceFromHigh: "",
};

const PRESETS = [
  {
    id: "all",
    label: "All stocks",
    description: "Clear every active screener filter.",
  },

  {
    id: "quality-growth",
    label: "Quality growth",
    description: "Growth, profitability and controlled debt.",
  },

  {
    id: "low-debt",
    label: "Low debt",
    description: "Companies with lower debt-to-equity.",
  },

  {
    id: "high-roe",
    label: "High ROE",
    description: "Return on equity of at least 15%.",
  },

  {
    id: "positive-momentum",
    label: "Positive momentum",
    description: "Bullish price and moving-average alignment.",
  },

  {
    id: "near-high",
    label: "Near 52-week high",
    description: "Trading within 10% of the annual high.",
  },

  {
    id: "value",
    label: "Value screen",
    description: "Moderate P/E with profitability controls.",
  },

  {
    id: "oversold",
    label: "Oversold",
    description: "RSI at or below 35.",
  },
];

const SORT_OPTIONS = [
  {
    value: "marketCap-desc",
    label: "Market cap: High to low",
  },

  {
    value: "changePercent-desc",
    label: "Daily change: High to low",
  },

  {
    value: "changePercent-asc",
    label: "Daily change: Low to high",
  },

  {
    value: "revenueGrowthPercent-desc",
    label: "Revenue growth: High to low",
  },

  {
    value: "returnOnEquityPercent-desc",
    label: "ROE: High to low",
  },

  {
    value: "peRatio-asc",
    label: "P/E: Low to high",
  },

  {
    value: "debtToEquity-asc",
    label: "Debt-to-equity: Low to high",
  },

  {
    value: "rsi-desc",
    label: "RSI: High to low",
  },

  {
    value: "rsi-asc",
    label: "RSI: Low to high",
  },

  {
    value: "distanceFrom52WeekHigh-asc",
    label: "Nearest 52-week high",
  },

  {
    value: "name-asc",
    label: "Company name: A to Z",
  },
];

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_SORT_VALUE = "marketCap-desc";

const SAVED_SCREENS_STORAGE_KEY = "exa-screener-saved-screens-v1";

const MAX_SAVED_SCREENS = 20;

const COMPARE_SELECTION_STORAGE_KEY =
  "exa-screener-compare-selection-v1";

const MAX_COMPARE_STOCKS = 5;

const ALLOWED_PAGE_SIZES = new Set([5, 10, 15]);

const VALID_SORT_VALUES = new Set(SORT_OPTIONS.map((option) => option.value));

const VALID_PRESET_IDS = new Set(PRESETS.map((preset) => preset.id));

const FILTER_URL_KEYS = {
  sector: "sector",
  trend: "trend",
  minPrice: "minPrice",
  maxPrice: "maxPrice",
  minPe: "minPe",
  maxPe: "maxPe",
  minRevenueGrowth: "minRevenueGrowth",
  minRoe: "minRoe",
  minProfitMargin: "minProfitMargin",
  maxDebtToEquity: "maxDebtToEquity",
  minRsi: "minRsi",
  maxRsi: "maxRsi",
  maxDistanceFromHigh: "maxDistanceFromHigh",
};

function parsePositiveInteger(value, fallback) {
  const number = Number(value);

  if (!Number.isFinite(number) || number < 1) {
    return fallback;
  }

  return Math.trunc(number);
}

function filtersAreDefault(filters) {
  return Object.entries(DEFAULT_FILTERS).every(
    ([key, defaultValue]) =>
      String(filters?.[key] ?? defaultValue) === String(defaultValue),
  );
}

function parseScreenerUrlState(search) {
  const parameters = new URLSearchParams(search);

  const requestedPage = parsePositiveInteger(
    parameters.get("page"),
    DEFAULT_PAGE,
  );

  const requestedPageSize = parsePositiveInteger(
    parameters.get("limit"),
    DEFAULT_PAGE_SIZE,
  );

  const pageSize = ALLOWED_PAGE_SIZES.has(requestedPageSize)
    ? requestedPageSize
    : DEFAULT_PAGE_SIZE;

  const requestedSort = String(
    parameters.get("sort") || DEFAULT_SORT_VALUE,
  ).trim();

  const sortValue = VALID_SORT_VALUES.has(requestedSort)
    ? requestedSort
    : DEFAULT_SORT_VALUE;

  const searchQuery = String(
    parameters.get("q") || parameters.get("search") || "",
  ).trim();

  const filters = {
    ...DEFAULT_FILTERS,
  };

  Object.entries(FILTER_URL_KEYS).forEach(([filterKey, urlKey]) => {
    const value = parameters.get(urlKey);

    if (value !== null && value !== "") {
      filters[filterKey] = value;
    }
  });

  const requestedPreset = String(parameters.get("preset") || "").trim();

  let activePreset = "all";

  if (requestedPreset && VALID_PRESET_IDS.has(requestedPreset)) {
    activePreset = requestedPreset;
  } else if (
    searchQuery ||
    !filtersAreDefault(filters) ||
    sortValue !== DEFAULT_SORT_VALUE
  ) {
    activePreset = "custom";
  }

  return {
    page: requestedPage,
    pageSize,
    searchQuery,
    debouncedSearch: searchQuery,
    filters,
    activePreset,
    sortValue,
  };
}

function buildScreenerSearchParams({
  page,
  pageSize,
  searchQuery,
  filters,
  activePreset,
  sortValue,
}) {
  const parameters = new URLSearchParams();

  if (page > DEFAULT_PAGE) {
    parameters.set("page", String(page));
  }

  if (pageSize !== DEFAULT_PAGE_SIZE) {
    parameters.set("limit", String(pageSize));
  }

  const normalizedSearch = String(searchQuery || "").trim();

  if (normalizedSearch) {
    parameters.set("q", normalizedSearch);
  }

  Object.entries(FILTER_URL_KEYS).forEach(([filterKey, urlKey]) => {
    const value = String(filters?.[filterKey] ?? "").trim();

    const defaultValue = String(DEFAULT_FILTERS[filterKey] ?? "");

    if (value && value !== "All" && value !== defaultValue) {
      parameters.set(urlKey, value);
    }
  });

  if (sortValue && sortValue !== DEFAULT_SORT_VALUE) {
    parameters.set("sort", sortValue);
  }

  if (activePreset && activePreset !== "all" && activePreset !== "custom") {
    parameters.set("preset", activePreset);
  }

  return parameters;
}

function normalizeSavedScreen(screen) {
  if (!screen || typeof screen !== "object") {
    return null;
  }

  const id = String(screen.id || "").trim();

  const name = String(screen.name || "").trim();

  if (!id || !name) {
    return null;
  }

  const normalizedFilters = {
    ...DEFAULT_FILTERS,
  };

  Object.keys(DEFAULT_FILTERS).forEach((key) => {
    const value = screen.filters?.[key];

    if (value !== null && value !== undefined) {
      normalizedFilters[key] = String(value);
    }
  });

  const requestedPageSize = parsePositiveInteger(
    screen.pageSize,
    DEFAULT_PAGE_SIZE,
  );

  const pageSize = ALLOWED_PAGE_SIZES.has(requestedPageSize)
    ? requestedPageSize
    : DEFAULT_PAGE_SIZE;

  const requestedSort = String(screen.sortValue || DEFAULT_SORT_VALUE).trim();

  const sortValue = VALID_SORT_VALUES.has(requestedSort)
    ? requestedSort
    : DEFAULT_SORT_VALUE;

  const requestedPreset = String(screen.activePreset || "custom").trim();

  const activePreset =
    requestedPreset === "custom" || VALID_PRESET_IDS.has(requestedPreset)
      ? requestedPreset
      : "custom";

  const createdAt = String(screen.createdAt || new Date().toISOString());

  const updatedAt = String(screen.updatedAt || createdAt);

  return {
    id,
    name: name.slice(0, 50),
    createdAt,
    updatedAt,
    searchQuery: String(screen.searchQuery || "").trim(),
    filters: normalizedFilters,
    activePreset,
    sortValue,
    pageSize,
  };
}

function readSavedScreens() {
  if (typeof window === "undefined") {
    return {
      screens: [],
      error: "",
    };
  }

  try {
    const rawValue = window.localStorage.getItem(SAVED_SCREENS_STORAGE_KEY);

    if (!rawValue) {
      return {
        screens: [],
        error: "",
      };
    }

    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      throw new Error("Saved screen data is not an array.");
    }

    const screens = parsed
      .map(normalizeSavedScreen)
      .filter(Boolean)
      .sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime(),
      )
      .slice(0, MAX_SAVED_SCREENS);

    return {
      screens,
      error: "",
    };
  } catch (error) {
    console.error("Unable to read saved screener screens:", error);

    return {
      screens: [],
      error: "Saved screens could not be loaded from this browser.",
    };
  }
}

function writeSavedScreens(screens) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    window.localStorage.setItem(
      SAVED_SCREENS_STORAGE_KEY,
      JSON.stringify(screens),
    );

    return true;
  } catch (error) {
    console.error("Unable to save screener screens:", error);

    return false;
  }
}

function createSavedScreenId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `screen-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatSavedScreenDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently saved";
  }

  try {
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function describeSavedScreen(screen) {
  const parts = [];

  if (screen.searchQuery) {
    parts.push(`Search: ${screen.searchQuery}`);
  }

  if (screen.filters?.sector && screen.filters.sector !== "All") {
    parts.push(screen.filters.sector);
  }

  if (screen.filters?.trend && screen.filters.trend !== "All") {
    parts.push(`${screen.filters.trend} trend`);
  }

  if (screen.filters?.minRoe) {
    parts.push(`ROE ≥ ${screen.filters.minRoe}%`);
  }

  if (screen.filters?.maxPe) {
    parts.push(`P/E ≤ ${screen.filters.maxPe}`);
  }

  const activeFilterCount = Object.entries(screen.filters || {}).filter(
    ([key, value]) =>
      String(value || "").trim() &&
      String(value) !== String(DEFAULT_FILTERS[key] || "") &&
      value !== "All",
  ).length;

  const representedFilterCount = [
    screen.filters?.sector !== "All" && screen.filters?.sector,
    screen.filters?.trend !== "All" && screen.filters?.trend,
    screen.filters?.minRoe,
    screen.filters?.maxPe,
  ].filter(Boolean).length;

  const additionalFilters = Math.max(
    activeFilterCount - representedFilterCount,
    0,
  );

  if (additionalFilters > 0) {
    parts.push(`+${additionalFilters} more`);
  }

  if (parts.length === 0) {
    return "All stocks with the selected sorting and page size.";
  }

  return parts.slice(0, 5).join(" · ");
}


function normalizeCompareStock(stock) {
  const symbol = String(stock?.symbol || "")
    .trim()
    .toUpperCase();

  if (!symbol) {
    return null;
  }

  return {
    symbol,
    name: String(stock?.name || symbol).trim(),
    sector: String(stock?.sector || "Sector unavailable").trim(),
    logoDomain: String(stock?.logoDomain || "").trim(),
    website: String(stock?.website || "").trim(),
  };
}

function readCompareSelection() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.sessionStorage.getItem(
      COMPARE_SELECTION_STORAGE_KEY,
    );

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const seen = new Set();

    return parsed
      .map(normalizeCompareStock)
      .filter((stock) => {
        if (!stock || seen.has(stock.symbol)) {
          return false;
        }

        seen.add(stock.symbol);
        return true;
      })
      .slice(0, MAX_COMPARE_STOCKS);
  } catch (error) {
    console.error("Unable to restore compare selection:", error);
    return [];
  }
}

function writeCompareSelection(stocks) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      COMPARE_SELECTION_STORAGE_KEY,
      JSON.stringify(stocks),
    );
  } catch (error) {
    console.error("Unable to save compare selection:", error);
  }
}

const SCREENER_STYLES = `
  .exa-screener-page {
    min-height: 100vh;
    padding: 28px;
    color: #e2e8f0;
  }

  .exa-screener-page.compare-active {
    padding-bottom: 145px;
  }

  .exa-screener-container {
    width: 100%;
    max-width: 1540px;
    margin: 0 auto;
  }

  .exa-screener-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 22px;
  }

  .exa-screener-eyebrow {
    margin: 0 0 7px;
    color: #60a5fa;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .exa-screener-header h1 {
    margin: 0;
    color: #f8fafc;
    font-size: clamp(27px, 4vw, 40px);
    line-height: 1.1;
  }

  .exa-screener-subtitle {
    max-width: 720px;
    margin: 10px 0 0;
    color: #94a3b8;
    font-size: 13px;
    line-height: 1.7;
  }

  .exa-screener-header-controls {
    display: flex;
    min-width: 190px;
    flex-direction: column;
    align-items: flex-end;
    justify-content: flex-start;
    gap: 12px;
  }

  .exa-screener-refresh {
    min-height: 40px;
    padding: 9px 13px;
    border: 1px solid rgba(96, 165, 250, 0.28);
    border-radius: 11px;
    color: #bfdbfe;
    background: rgba(37, 99, 235, 0.1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 750;
    white-space: nowrap;
  }

  .exa-screener-refresh:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  .exa-screener-spinner {
    animation: exaScreenerSpin 0.9s linear infinite;
  }

  @keyframes exaScreenerSpin {
    to {
      transform: rotate(360deg);
    }
  }

  .exa-screener-summary-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 16px;
  }

  .exa-screener-summary-card {
    min-width: 0;
    padding: 16px;
    border: 1px solid #1e3350;
    border-radius: 15px;
    background:
      linear-gradient(
        145deg,
        rgba(14, 29, 50, 0.98),
        rgba(8, 20, 37, 0.98)
      );
  }

  .exa-screener-summary-card span {
    color: #64748b;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .exa-screener-summary-card strong {
    display: block;
    margin-top: 7px;
    color: #f8fafc;
    font-size: 22px;
  }

  .exa-screener-summary-card small {
    display: block;
    margin-top: 5px;
    color: #64748b;
    font-size: 10px;
  }

  .exa-screener-layout {
    display: grid;
    grid-template-columns: 285px minmax(0, 1fr);
    align-items: start;
    gap: 16px;
  }

  .exa-screener-sidebar {
    position: sticky;
    top: 86px;
    padding: 16px;
    border: 1px solid #1e3350;
    border-radius: 16px;
    background: #0a1628;
  }

  .exa-screener-panel-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 14px;
  }

  .exa-screener-panel-heading div {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .exa-screener-panel-heading h2 {
    margin: 0;
    color: #f8fafc;
    font-size: 15px;
  }

  .exa-screener-reset {
    padding: 5px 7px;
    border: 0;
    border-radius: 8px;
    color: #94a3b8;
    background: transparent;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-size: 10px;
  }

  .exa-screener-filter-group {
    padding-top: 13px;
    margin-top: 13px;
    border-top: 1px solid #172a45;
  }

  .exa-screener-filter-group:first-of-type {
    padding-top: 0;
    margin-top: 0;
    border-top: 0;
  }

  .exa-screener-filter-label {
    display: block;
    margin-bottom: 7px;
    color: #94a3b8;
    font-size: 10px;
    font-weight: 750;
  }

  .exa-screener-input,
  .exa-screener-select {
    width: 100%;
    min-height: 38px;
    padding: 8px 10px;
    border: 1px solid #1e3350;
    border-radius: 9px;
    outline: none;
    color: #e2e8f0;
    background: #0f1d32;
    font-size: 11px;
  }

  .exa-screener-input:focus,
  .exa-screener-select:focus {
    border-color: rgba(96, 165, 250, 0.65);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .exa-screener-select option {
    background: #0f1d32;
  }

  .exa-screener-range-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .exa-screener-main {
    min-width: 0;
  }

  .exa-screener-presets {
    padding: 15px;
    border: 1px solid #1e3350;
    border-radius: 16px;
    background: #0a1628;
  }

  .exa-screener-presets-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 11px;
    color: #f8fafc;
    font-size: 13px;
    font-weight: 750;
  }

  .exa-screener-preset-list {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 3px;
  }

  .exa-screener-preset-button {
    min-width: 132px;
    padding: 10px 11px;
    border: 1px solid #1e3350;
    border-radius: 11px;
    color: #94a3b8;
    background: #101e34;
    cursor: pointer;
    text-align: left;
  }

  .exa-screener-preset-button.active {
    border-color: rgba(96, 165, 250, 0.55);
    color: #ffffff;
    background: rgba(37, 99, 235, 0.17);
  }

  .exa-screener-preset-button strong {
    display: block;
    font-size: 10px;
  }

  .exa-screener-preset-button small {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 9px;
    line-height: 1.45;
  }

  .exa-saved-screens-panel {
    padding: 15px;
    margin-top: 14px;
    border: 1px solid #1e3350;
    border-radius: 16px;
    background: #0a1628;
  }

  .exa-saved-screens-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
    margin-bottom: 12px;
  }

  .exa-saved-screens-heading-main {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    min-width: 0;
  }

  .exa-saved-screens-heading h2 {
    margin: 0;
    color: #f8fafc;
    font-size: 13px;
  }

  .exa-saved-screens-heading p {
    margin: 4px 0 0;
    color: #64748b;
    font-size: 9px;
    line-height: 1.5;
  }

  .exa-saved-screens-count {
    flex-shrink: 0;
    padding: 4px 7px;
    border: 1px solid #1e3350;
    border-radius: 999px;
    color: #93c5fd;
    background: #101e34;
    font-size: 9px;
    font-weight: 800;
  }

  .exa-saved-screen-form {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
  }

  .exa-saved-screen-name-input {
    width: 100%;
    min-height: 40px;
    padding: 9px 11px;
    border: 1px solid #1e3350;
    border-radius: 10px;
    outline: none;
    color: #e2e8f0;
    background: #101e34;
    font-size: 11px;
  }

  .exa-saved-screen-name-input:focus {
    border-color: rgba(96, 165, 250, 0.65);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .exa-saved-screen-save-button {
    min-height: 40px;
    padding: 8px 13px;
    border: 1px solid rgba(96, 165, 250, 0.32);
    border-radius: 10px;
    color: #dbeafe;
    background: linear-gradient(
      135deg,
      rgba(37, 99, 235, 0.9),
      rgba(79, 70, 229, 0.9)
    );
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
  }

  .exa-saved-screen-save-button:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .exa-saved-screen-status {
    margin-top: 9px;
    padding: 8px 10px;
    border-radius: 9px;
    font-size: 9px;
    line-height: 1.5;
  }

  .exa-saved-screen-status.success {
    border: 1px solid rgba(34, 197, 94, 0.2);
    color: #86efac;
    background: rgba(34, 197, 94, 0.08);
  }

  .exa-saved-screen-status.error {
    border: 1px solid rgba(244, 63, 94, 0.2);
    color: #fda4af;
    background: rgba(244, 63, 94, 0.08);
  }

  .exa-saved-screen-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 8px;
    max-height: 330px;
    overflow-y: auto;
    margin-top: 12px;
    padding-right: 2px;
  }

  .exa-saved-screen-card {
    min-width: 0;
    padding: 11px;
    border: 1px solid #1e3350;
    border-radius: 11px;
    background: #101e34;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .exa-saved-screen-copy {
    min-width: 0;
  }

  .exa-saved-screen-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-saved-screen-copy p {
    display: -webkit-box;
    overflow: hidden;
    margin: 4px 0 0;
    color: #94a3b8;
    font-size: 8px;
    line-height: 1.45;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .exa-saved-screen-copy small {
    display: block;
    margin-top: 5px;
    color: #475569;
    font-size: 8px;
  }

  .exa-saved-screen-actions {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
  }

  .exa-saved-screen-open,
  .exa-saved-screen-delete {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .exa-saved-screen-open {
    border: 1px solid rgba(96, 165, 250, 0.28);
    color: #bfdbfe;
    background: rgba(37, 99, 235, 0.11);
  }

  .exa-saved-screen-delete {
    border: 1px solid rgba(244, 63, 94, 0.2);
    color: #fda4af;
    background: rgba(244, 63, 94, 0.07);
  }

  .exa-saved-screen-empty {
    margin-top: 12px;
    padding: 14px;
    border: 1px dashed #1e3350;
    border-radius: 10px;
    color: #64748b;
    background: rgba(15, 29, 50, 0.45);
    font-size: 9px;
    line-height: 1.6;
    text-align: center;
  }

  .exa-screener-table tbody tr.compare-selected {
    background: rgba(37, 99, 235, 0.08);
  }

  .exa-screener-compare-cell {
    width: 58px;
    text-align: center !important;
  }

  .exa-screener-compare-toggle {
    width: 29px;
    height: 29px;
    border: 1px solid #29405f;
    border-radius: 8px;
    color: #64748b;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition:
      border-color 160ms ease,
      color 160ms ease,
      background 160ms ease,
      transform 160ms ease;
  }

  .exa-screener-compare-toggle:hover {
    border-color: rgba(96, 165, 250, 0.55);
    color: #bfdbfe;
    transform: translateY(-1px);
  }

  .exa-screener-compare-toggle.selected {
    border-color: rgba(34, 211, 238, 0.45);
    color: #ecfeff;
    background: linear-gradient(
      135deg,
      rgba(37, 99, 235, 0.92),
      rgba(79, 70, 229, 0.92)
    );
  }

  .exa-compare-tray {
    position: fixed;
    right: 24px;
    bottom: 22px;
    left: calc(var(--sidebar-width, 250px) + 24px);
    z-index: 70;
    max-width: 1180px;
    margin: 0 auto;
    padding: 13px 14px;
    border: 1px solid rgba(96, 165, 250, 0.35);
    border-radius: 16px;
    background:
      linear-gradient(
        145deg,
        rgba(11, 27, 48, 0.98),
        rgba(6, 17, 32, 0.98)
      );
    box-shadow:
      0 20px 60px rgba(2, 8, 23, 0.52),
      0 0 0 1px rgba(37, 99, 235, 0.05);
    backdrop-filter: blur(16px);
  }

  .exa-compare-tray-main {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .exa-compare-tray-title {
    min-width: 132px;
    flex-shrink: 0;
  }

  .exa-compare-tray-title strong {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #f8fafc;
    font-size: 11px;
  }

  .exa-compare-tray-title small {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-compare-tray-stocks {
    display: flex;
    align-items: center;
    gap: 7px;
    min-width: 0;
    flex: 1;
    overflow-x: auto;
    padding: 2px 0;
  }

  .exa-compare-chip {
    min-width: 0;
    max-width: 190px;
    padding: 7px 8px;
    border: 1px solid #203754;
    border-radius: 10px;
    background: #101e34;
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
  }

  .exa-compare-chip-logo {
    width: 30px !important;
    height: 30px !important;
    flex: 0 0 30px;
  }

  .exa-compare-chip-copy {
    min-width: 0;
  }

  .exa-compare-chip-copy strong {
    display: block;
    overflow: hidden;
    color: #e2e8f0;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-compare-chip-copy small {
    display: block;
    margin-top: 2px;
    color: #64748b;
    font-size: 7px;
  }

  .exa-compare-chip-remove {
    width: 23px;
    height: 23px;
    margin-left: auto;
    border: 0;
    border-radius: 7px;
    color: #94a3b8;
    background: transparent;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .exa-compare-chip-remove:hover {
    color: #fda4af;
    background: rgba(244, 63, 94, 0.08);
  }

  .exa-compare-tray-actions {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
  }

  .exa-compare-clear,
  .exa-compare-open {
    min-height: 36px;
    padding: 8px 11px;
    border-radius: 10px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: pointer;
    font-size: 9px;
    font-weight: 800;
    white-space: nowrap;
  }

  .exa-compare-clear {
    border: 1px solid #29405f;
    color: #94a3b8;
    background: #101e34;
  }

  .exa-compare-open {
    border: 1px solid rgba(96, 165, 250, 0.38);
    color: #ffffff;
    background: linear-gradient(
      135deg,
      #2563eb,
      #4f46e5
    );
  }

  .exa-compare-open:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  .exa-compare-tray-message {
    margin: 8px 0 0;
    color: #fbbf24;
    font-size: 8px;
  }

  .exa-screener-toolbar {
    padding: 14px;
    margin-top: 14px;
    border: 1px solid #1e3350;
    border-radius: 15px;
    background: #0a1628;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .exa-screener-search {
    position: relative;
    flex: 1 1 260px;
  }

  .exa-screener-search svg {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    color: #64748b;
    pointer-events: none;
  }

  .exa-screener-search input {
    width: 100%;
    min-height: 40px;
    padding: 9px 12px 9px 37px;
    border: 1px solid #1e3350;
    border-radius: 10px;
    outline: none;
    color: #e2e8f0;
    background: #101e34;
    font-size: 11px;
  }

  .exa-screener-toolbar-select {
    min-height: 40px;
    padding: 8px 32px 8px 10px;
    border: 1px solid #1e3350;
    border-radius: 10px;
    outline: none;
    color: #cbd5e1;
    background: #101e34;
    font-size: 10px;
  }

  .exa-screener-result-count {
    color: #64748b;
    font-size: 10px;
    white-space: nowrap;
  }

  .exa-screener-notice {
    padding: 10px 13px;
    margin-top: 12px;
    border: 1px solid rgba(234, 179, 8, 0.2);
    border-radius: 11px;
    color: #cbd5e1;
    background: rgba(113, 63, 18, 0.1);
    font-size: 10px;
    line-height: 1.6;
  }

  .exa-screener-table-card {
    min-width: 0;
    margin-top: 14px;
    overflow: hidden;
    border: 1px solid #1e3350;
    border-radius: 16px;
    background: #0a1628;
  }

  .exa-screener-table-scroll {
    overflow-x: auto;
  }

  .exa-screener-table {
    width: 100%;
    min-width: 1180px;
    border-collapse: collapse;
  }

  .exa-screener-table th {
    padding: 12px;
    border-bottom: 1px solid #1e3350;
    color: #64748b;
    background: #0d1a2e;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-align: left;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .exa-screener-table td {
    padding: 13px 12px;
    border-bottom: 1px solid #152844;
    color: #cbd5e1;
    font-size: 10px;
    vertical-align: middle;
    white-space: nowrap;
  }

  .exa-screener-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .exa-screener-table tbody tr:hover {
    background: rgba(30, 64, 175, 0.06);
  }

  .exa-screener-company {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exa-screener-company-logo {
    width: 36px;
    height: 36px;
    overflow: hidden;
    border: 1px solid #263b57;
    border-radius: 50%;
    color: #93c5fd;
    background: #17263d;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 800;
  }

  .exa-screener-company-logo img {
    width: 72%;
    height: 72%;
    object-fit: contain;
  }

  .exa-screener-company-copy {
    min-width: 0;
    max-width: 190px;
  }

  .exa-screener-company-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-screener-company-copy span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 9px;
  }

  .exa-screener-positive {
    color: #22c55e !important;
  }

  .exa-screener-negative {
    color: #fb7185 !important;
  }

  .exa-screener-neutral {
    color: #eab308 !important;
  }

  .exa-screener-trend {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 8px;
    border: 1px solid #1e3350;
    border-radius: 999px;
    font-size: 9px;
    font-weight: 800;
  }

  .exa-screener-trend.bullish,
  .exa-screener-trend.positive {
    border-color: rgba(34, 197, 94, 0.26);
    color: #4ade80;
    background: rgba(34, 197, 94, 0.09);
  }

  .exa-screener-trend.bearish,
  .exa-screener-trend.negative {
    border-color: rgba(244, 63, 94, 0.26);
    color: #fb7185;
    background: rgba(244, 63, 94, 0.09);
  }

  .exa-screener-trend.sideways,
  .exa-screener-trend.unavailable {
    color: #94a3b8;
    background: rgba(100, 116, 139, 0.08);
  }

  .exa-screener-action {
    min-height: 32px;
    padding: 6px 10px;
    border: 1px solid rgba(96, 165, 250, 0.3);
    border-radius: 8px;
    color: #bfdbfe;
    background: rgba(37, 99, 235, 0.12);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-size: 9px;
    font-weight: 800;
  }

  .exa-screener-link {
    width: 29px;
    height: 29px;
    border: 1px solid #1e3350;
    border-radius: 8px;
    color: #94a3b8;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
  }

  .exa-screener-row-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .exa-screener-state {
    padding: 54px 20px;
    color: #94a3b8;
    text-align: center;
  }

  .exa-screener-state strong {
    display: block;
    margin-top: 11px;
    color: #f8fafc;
    font-size: 14px;
  }

  .exa-screener-state p {
    max-width: 440px;
    margin: 7px auto 0;
    font-size: 10px;
    line-height: 1.65;
  }

  .exa-screener-pagination {
    padding: 13px 15px;
    border-top: 1px solid #1e3350;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .exa-screener-pagination-info {
    color: #64748b;
    font-size: 10px;
  }

  .exa-screener-pagination-actions {
    display: flex;
    align-items: center;
    gap: 7px;
  }

  .exa-screener-page-button {
    min-height: 33px;
    padding: 6px 10px;
    border: 1px solid #1e3350;
    border-radius: 8px;
    color: #cbd5e1;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-size: 9px;
    font-weight: 750;
  }

  .exa-screener-page-button:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  @media (max-width: 900px) {
    .exa-compare-tray {
      right: 12px;
      bottom: 12px;
      left: 12px;
    }

    .exa-compare-tray-main {
      align-items: stretch;
      flex-direction: column;
    }

    .exa-compare-tray-title {
      min-width: 0;
    }

    .exa-compare-tray-actions {
      width: 100%;
    }

    .exa-compare-clear,
    .exa-compare-open {
      flex: 1;
    }
  }

  @media (max-width: 1100px) {
    .exa-screener-summary-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .exa-screener-layout {
      grid-template-columns: 1fr;
    }

    .exa-screener-sidebar {
      position: static;
    }

    .exa-screener-sidebar-fields {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .exa-screener-filter-group {
      padding-top: 0;
      margin-top: 0;
      border-top: 0;
    }
  }

  @media (max-width: 720px) {
    .exa-screener-page {
      padding: 18px 12px 28px;
    }

    .exa-screener-header {
      flex-direction: column;
    }

    .exa-screener-header-controls {
      width: 100%;
      min-width: 0;
      align-items: flex-start;
    }

    .exa-screener-refresh {
      width: 100%;
    }

    .exa-screener-summary-grid {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .exa-screener-summary-card {
      padding: 13px;
    }

    .exa-screener-summary-card strong {
      font-size: 18px;
    }

    .exa-screener-sidebar-fields {
      grid-template-columns: 1fr 1fr;
    }

    .exa-saved-screen-form {
      grid-template-columns: 1fr;
    }

    .exa-saved-screen-save-button {
      width: 100%;
    }

    .exa-saved-screen-list {
      grid-template-columns: 1fr;
    }

    .exa-screener-toolbar {
      align-items: stretch;
    }

    .exa-screener-toolbar-select {
      width: 100%;
    }

    .exa-screener-pagination {
      flex-direction: column;
    }

    .exa-screener-pagination-actions {
      width: 100%;
    }

    .exa-screener-page-button {
      flex: 1;
      justify-content: center;
    }
  }

  @media (max-width: 460px) {
    .exa-screener-summary-grid,
    .exa-screener-sidebar-fields {
      grid-template-columns: 1fr;
    }
  }

  .exa-screener-company-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
}

.exa-company-logo {
  overflow: hidden;
  flex: 0 0 auto;

  border: 1px solid rgba(96, 165, 250, 0.2);
  border-radius: 50%;

  background: #13243d;

  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.exa-company-logo img {
  width: 74%;
  height: 74%;
  object-fit: contain;
}

.exa-company-logo span {
  color: #93c5fd;
  font-size: 15px;
  font-weight: 850;
}

.exa-screener-company-copy {
  min-width: 0;
}

.exa-screener-company-copy strong {
  display: block;
  overflow: hidden;

  color: #f8fafc;
  font-size: 12px;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.exa-screener-company-copy span {
  display: block;
  margin-top: 5px;

  overflow: hidden;

  color: #607795;
  font-size: 9px;

  text-overflow: ellipsis;
  white-space: nowrap;
}
`;

function numericValue(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, digits = 2) {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
  }).format(number);
}

function formatPrice(value, currency = "INR") {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }).format(number);
  } catch {
    return formatNumber(number, 2);
  }
}

function formatMarketCap(value) {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  if (Math.abs(number) >= 1_00_00_000) {
    return `₹${(number / 1_00_00_000).toFixed(0)} Cr`;
  }

  if (Math.abs(number) >= 1_00_000) {
    return `₹${(number / 1_00_000).toFixed(1)} L`;
  }

  return `₹${formatNumber(number, 0)}`;
}

function formatPercent(value) {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  return `${number.toFixed(2)}%`;
}

function SummaryCard({ label, value, note }) {
  return (
    <article className="exa-screener-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function NumberInput({ value, onChange, placeholder }) {
  return (
    <input
      type="number"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="exa-screener-input"
      inputMode="decimal"
    />
  );
}

export default function Screener() {
  const location = useLocation();

  const navigate = useNavigate();

  const initialUrlStateRef = useRef(null);

  if (initialUrlStateRef.current === null) {
    initialUrlStateRef.current = parseScreenerUrlState(location.search);
  }

  const initialUrlState = initialUrlStateRef.current;

  const lastHandledSearchRef = useRef(location.search);

  const skipNextUrlWriteRef = useRef(false);

  const [stocks, setStocks] = useState([]);

  const [apiData, setApiData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [page, setPage] = useState(initialUrlState.page);

  const [pageSize, setPageSize] = useState(initialUrlState.pageSize);

  const [searchQuery, setSearchQuery] = useState(initialUrlState.searchQuery);

  const [debouncedSearch, setDebouncedSearch] = useState(
    initialUrlState.debouncedSearch,
  );

  const [filters, setFilters] = useState(initialUrlState.filters);

  const [activePreset, setActivePreset] = useState(
    initialUrlState.activePreset,
  );

  const [sortValue, setSortValue] = useState(initialUrlState.sortValue);

  const [savedScreens, setSavedScreens] = useState([]);

  const [savedScreenName, setSavedScreenName] = useState("");

  const [savedScreenMessage, setSavedScreenMessage] = useState("");

  const [savedScreenError, setSavedScreenError] = useState("");

  const [selectedCompareStocks, setSelectedCompareStocks] = useState(() =>
    readCompareSelection(),
  );

  const [compareMessage, setCompareMessage] = useState("");

  const loadScreener = useCallback(
    async ({ refresh = false, signal } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const parameters = new URLSearchParams({
          page: String(page),

          limit: String(pageSize),

          sort: sortValue,
        });

        function addParameter(key, value) {
          if (
            value === null ||
            value === undefined ||
            value === "" ||
            value === "All"
          ) {
            return;
          }

          parameters.set(key, String(value));
        }

        addParameter("q", debouncedSearch);

        addParameter("sector", filters.sector);

        addParameter("trend", filters.trend);

        addParameter("minPrice", filters.minPrice);

        addParameter("maxPrice", filters.maxPrice);

        addParameter("minPe", filters.minPe);

        addParameter("maxPe", filters.maxPe);

        addParameter("minRevenueGrowth", filters.minRevenueGrowth);

        addParameter("minRoe", filters.minRoe);

        addParameter("minProfitMargin", filters.minProfitMargin);

        addParameter("maxDebtToEquity", filters.maxDebtToEquity);

        addParameter("minRsi", filters.minRsi);

        addParameter("maxRsi", filters.maxRsi);

        addParameter("maxDistanceFromHigh", filters.maxDistanceFromHigh);

        if (refresh) {
          parameters.set("refresh", "1");
        }

        const response = await fetch(`/api/screener?${parameters.toString()}`, {
          method: "GET",

          headers: {
            Accept: "application/json",
          },

          signal,
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            "The Screener API returned a non-JSON response. Restart Vercel development mode.",
          );
        }

        const data = await response.json();

        if (!response.ok || data?.success !== true) {
          throw new Error(data?.error || "Unable to load screener data.");
        }

        setApiData(data);

        setStocks(Array.isArray(data?.stocks) ? data.stocks : []);

        if (Number.isFinite(Number(data?.page)) && Number(data.page) !== page) {
          setPage(Number(data.page));
        }
      } catch (caughtError) {
        if (caughtError?.name === "AbortError") {
          return;
        }

        console.error("Screener loading error:", caughtError);

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load the stock screener.",
        );

        if (!refresh) {
          setStocks([]);
          setApiData(null);
        }
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [page, pageSize, debouncedSearch, filters, sortValue],
  );

  useEffect(() => {
    const result = readSavedScreens();

    setSavedScreens(result.screens);

    if (result.error) {
      setSavedScreenError(result.error);
    }
  }, []);

  useEffect(() => {
    if (!savedScreenMessage && !savedScreenError) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setSavedScreenMessage("");
      setSavedScreenError("");
    }, 4500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [savedScreenMessage, savedScreenError]);

  useEffect(() => {
    writeCompareSelection(selectedCompareStocks);
  }, [selectedCompareStocks]);

  useEffect(() => {
    if (!compareMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setCompareMessage("");
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [compareMessage]);

  useEffect(() => {
    const controller = new AbortController();

    loadScreener({
      signal: controller.signal,
    });

    return () => {
      controller.abort();
    };
  }, [loadScreener]);

  useEffect(() => {
    const normalizedSearch = searchQuery.trim();

    if (normalizedSearch === debouncedSearch) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setPage(1);

      setDebouncedSearch(normalizedSearch);
    }, 450);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchQuery, debouncedSearch]);

  /*
   * Restore screener state when the
   * user uses browser Back/Forward or
   * opens a shared screener URL.
   */
  useEffect(() => {
    if (location.search === lastHandledSearchRef.current) {
      return;
    }

    lastHandledSearchRef.current = location.search;

    const nextState = parseScreenerUrlState(location.search);

    skipNextUrlWriteRef.current = true;

    setPage(nextState.page);
    setPageSize(nextState.pageSize);
    setSearchQuery(nextState.searchQuery);
    setDebouncedSearch(nextState.debouncedSearch);
    setFilters(nextState.filters);
    setActivePreset(nextState.activePreset);
    setSortValue(nextState.sortValue);
  }, [location.search]);

  /*
   * Keep the visible page URL in sync
   * with the active screener state.
   * Default values are omitted so the
   * shared URL stays clean.
   */
  useEffect(() => {
    if (skipNextUrlWriteRef.current) {
      skipNextUrlWriteRef.current = false;

      return;
    }

    const nextParameters = buildScreenerSearchParams({
      page,
      pageSize,
      searchQuery: debouncedSearch,
      filters,
      activePreset,
      sortValue,
    });

    const nextQuery = nextParameters.toString();

    const nextSearch = nextQuery ? `?${nextQuery}` : "";

    if (nextSearch === location.search) {
      return;
    }

    lastHandledSearchRef.current = nextSearch;

    navigate(
      {
        pathname: location.pathname,
        search: nextSearch,
      },
      {
        replace: true,
      },
    );
  }, [
    page,
    pageSize,
    debouncedSearch,
    filters,
    activePreset,
    sortValue,
    location.pathname,
    location.search,
    navigate,
  ]);

  const availableSectors = useMemo(() => {
    const sectors = Array.isArray(apiData?.sectors) ? apiData.sectors : [];

    return [
      "All",
      ...sectors.filter((sector) => sector && sector !== "Not available"),
    ];
  }, [apiData]);

  function updateFilter(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));

    setActivePreset("custom");

    setPage(1);
  }

  function resetFilters() {
    setFilters({
      ...DEFAULT_FILTERS,
    });

    setSearchQuery("");
    setDebouncedSearch("");

    setActivePreset("all");

    setSortValue(DEFAULT_SORT_VALUE);

    setPage(1);
  }

  function applyPreset(presetId) {
    setSearchQuery("");
    setDebouncedSearch("");

    setActivePreset(presetId);

    setPage(1);

    switch (presetId) {
      case "quality-growth":
        setFilters({
          ...DEFAULT_FILTERS,

          minRevenueGrowth: "10",

          minRoe: "15",

          minProfitMargin: "10",

          maxDebtToEquity: "100",
        });

        setSortValue("revenueGrowthPercent-desc");

        break;

      case "low-debt":
        setFilters({
          ...DEFAULT_FILTERS,

          maxDebtToEquity: "50",
        });

        setSortValue("debtToEquity-asc");

        break;

      case "high-roe":
        setFilters({
          ...DEFAULT_FILTERS,

          minRoe: "15",
        });

        setSortValue("returnOnEquityPercent-desc");

        break;

      case "positive-momentum":
        setFilters({
          ...DEFAULT_FILTERS,

          trend: "Bullish",

          minRsi: "50",

          maxRsi: "70",
        });

        setSortValue("rsi-desc");

        break;

      case "near-high":
        setFilters({
          ...DEFAULT_FILTERS,

          maxDistanceFromHigh: "10",
        });

        setSortValue("distanceFrom52WeekHigh-asc");

        break;

      case "value":
        setFilters({
          ...DEFAULT_FILTERS,

          minPe: "1",

          maxPe: "25",

          minRoe: "10",

          maxDebtToEquity: "100",
        });

        setSortValue("peRatio-asc");

        break;

      case "oversold":
        setFilters({
          ...DEFAULT_FILTERS,

          maxRsi: "35",
        });

        setSortValue("rsi-asc");

        break;

      default:
        setFilters({
          ...DEFAULT_FILTERS,
        });

        setSortValue("marketCap-desc");

        break;
    }
  }

  function persistSavedScreens(nextScreens) {
    setSavedScreens(nextScreens);

    const saved = writeSavedScreens(nextScreens);

    if (!saved) {
      setSavedScreenError(
        "This browser did not allow EXA to save the screen locally.",
      );

      return false;
    }

    setSavedScreenError("");
    return true;
  }

  function saveCurrentScreen(event) {
    event.preventDefault();

    const name = savedScreenName.trim().replace(/\s+/g, " ").slice(0, 50);

    if (name.length < 2) {
      setSavedScreenMessage("");
      setSavedScreenError("Enter a screen name with at least two characters.");
      return;
    }

    const now = new Date().toISOString();

    const existingScreen = savedScreens.find(
      (screen) => screen.name.toLowerCase() === name.toLowerCase(),
    );

    const nextScreen = {
      id: existingScreen?.id || createSavedScreenId(),
      name,
      createdAt: existingScreen?.createdAt || now,
      updatedAt: now,
      searchQuery: searchQuery.trim(),
      filters: {
        ...DEFAULT_FILTERS,
        ...filters,
      },
      activePreset,
      sortValue,
      pageSize,
    };

    const nextScreens = [
      nextScreen,
      ...savedScreens.filter((screen) => screen.id !== nextScreen.id),
    ].slice(0, MAX_SAVED_SCREENS);

    if (!persistSavedScreens(nextScreens)) {
      return;
    }

    setSavedScreenName("");
    setSavedScreenMessage(
      existingScreen ? `Updated “${name}”.` : `Saved “${name}”.`,
    );
  }

  function openSavedScreen(savedScreen) {
    const screen = normalizeSavedScreen(savedScreen);

    if (!screen) {
      setSavedScreenMessage("");
      setSavedScreenError(
        "This saved screen is invalid and could not be opened.",
      );
      return;
    }

    setPage(1);
    setPageSize(screen.pageSize);
    setSearchQuery(screen.searchQuery);
    setDebouncedSearch(screen.searchQuery);
    setFilters({
      ...DEFAULT_FILTERS,
      ...screen.filters,
    });
    setActivePreset(screen.activePreset);
    setSortValue(screen.sortValue);

    setSavedScreenError("");
    setSavedScreenMessage(`Opened “${screen.name}”.`);
  }

  function deleteSavedScreen(screenId, screenName) {
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`Delete the saved screen “${screenName}”?`);

    if (!confirmed) {
      return;
    }

    const nextScreens = savedScreens.filter((screen) => screen.id !== screenId);

    if (!persistSavedScreens(nextScreens)) {
      return;
    }

    setSavedScreenMessage(`Deleted “${screenName}”.`);
  }

  function isStockSelectedForCompare(symbol) {
    const normalizedSymbol = String(symbol || "")
      .trim()
      .toUpperCase();

    return selectedCompareStocks.some(
      (stock) => stock.symbol === normalizedSymbol,
    );
  }

  function toggleCompareStock(stock) {
    const normalizedStock = normalizeCompareStock(stock);

    if (!normalizedStock) {
      return;
    }

    setCompareMessage("");

    setSelectedCompareStocks((current) => {
      const alreadySelected = current.some(
        (item) => item.symbol === normalizedStock.symbol,
      );

      if (alreadySelected) {
        return current.filter(
          (item) => item.symbol !== normalizedStock.symbol,
        );
      }

      if (current.length >= MAX_COMPARE_STOCKS) {
        setCompareMessage(
          `You can compare up to ${MAX_COMPARE_STOCKS} companies at one time.`,
        );

        return current;
      }

      return [...current, normalizedStock];
    });
  }

  function removeCompareStock(symbol) {
    const normalizedSymbol = String(symbol || "")
      .trim()
      .toUpperCase();

    setSelectedCompareStocks((current) =>
      current.filter((stock) => stock.symbol !== normalizedSymbol),
    );
  }

  function clearCompareSelection() {
    setSelectedCompareStocks([]);
    setCompareMessage("");
  }

  function openComparison() {
    if (selectedCompareStocks.length < 2) {
      setCompareMessage("Select at least two companies to compare.");
      return;
    }

    const symbols = selectedCompareStocks
      .map((stock) => stock.symbol)
      .join(",");

    navigate(
      `/compare?symbols=${encodeURIComponent(symbols)}`,
    );
  }

  const visibleStocks = stocks;

  const matchingCount = Number(apiData?.matchingStocks ?? stocks.length);

  const bullishCount = stocks.filter(
    (stock) => stock?.trend === "Bullish",
  ).length;

  const positiveChangeCount = stocks.filter(
    (stock) => Number(stock?.changePercent) > 0,
  ).length;

  const averageRsi = (() => {
    const values = stocks
      .map((stock) => numericValue(stock?.rsi))
      .filter((value) => value !== null);

    if (values.length === 0) {
      return "N/A";
    }

    return (
      values.reduce((sum, value) => sum + value, 0) / values.length
    ).toFixed(1);
  })();

  function openAnalysis(symbol) {
    if (!symbol) {
      return;
    }

    navigate(`/analyze?symbol=${encodeURIComponent(symbol)}`);
  }

  return (
    <AppShell>
      <style>{SCREENER_STYLES}</style>

      <main
        className={
          selectedCompareStocks.length > 0
            ? "exa-screener-page compare-active"
            : "exa-screener-page"
        }
      >
        <div className="exa-screener-container">
          <section className="exa-screener-header">
            <div>
              <p className="exa-screener-eyebrow">EXA NEXUS</p>

              <h1>Stock Screener</h1>

              <p className="exa-screener-subtitle">
                Discover Indian equities using live market data, fundamental
                indicators and technical conditions. Screener results are
                educational research filters, not Buy or Sell recommendations.
              </p>
            </div>

            <div className="exa-screener-header-controls">
              <SnapshotFreshnessBanner
                generatedAt={
                  apiData?.generatedAt ||
                  apiData?.fetchedAt
                }
                loading={loading}
                error={error}
              />

              <button
                type="button"
                className="exa-screener-refresh"
                disabled={loading || refreshing}
                onClick={() =>
                  loadScreener({
                    refresh: true,
                  })
                }
              >
                {refreshing ? (
                  <LoaderCircle
                    size={15}
                    className="exa-screener-spinner"
                  />
                ) : (
                  <RefreshCw size={15} />
                )}

                {refreshing ? "Reloading" : "Reload results"}
              </button>
            </div>
          </section>

          <section className="exa-screener-summary-grid">
            <SummaryCard
              label="Universe"
              value={apiData?.totalStocks ?? "—"}
              note="Complete snapshot universe"
            />

            <SummaryCard
              label="Matching stocks"
              value={matchingCount}
              note={`${stocks.length} shown on this page`}
            />

            <SummaryCard
              label="Bullish trends"
              value={apiData?.trendSummary?.Bullish ?? bullishCount}
              note="Price > SMA20 > SMA50"
            />

            <SummaryCard
              label="Average RSI"
              value={averageRsi}
              note={`${positiveChangeCount} positive on this page`}
            />
          </section>

          <section className="exa-screener-layout">
            <aside className="exa-screener-sidebar">
              <div className="exa-screener-panel-heading">
                <div>
                  <SlidersHorizontal size={16} color="#60a5fa" />

                  <h2>Filters</h2>
                </div>

                <button
                  type="button"
                  className="exa-screener-reset"
                  onClick={resetFilters}
                >
                  <RotateCcw size={12} />
                  Reset
                </button>
              </div>

              <div className="exa-screener-sidebar-fields">
                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">Sector</label>

                  <select
                    className="exa-screener-select"
                    value={filters.sector}
                    onChange={(event) =>
                      updateFilter("sector", event.target.value)
                    }
                  >
                    {availableSectors.map((sector) => (
                      <option key={sector} value={sector}>
                        {sector === "All" ? "All sectors" : sector}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Technical trend
                  </label>

                  <select
                    className="exa-screener-select"
                    value={filters.trend}
                    onChange={(event) =>
                      updateFilter("trend", event.target.value)
                    }
                  >
                    {[
                      "All",
                      "Bullish",
                      "Positive",
                      "Sideways",
                      "Negative",
                      "Bearish",
                    ].map((trend) => (
                      <option key={trend} value={trend}>
                        {trend === "All" ? "All trends" : trend}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Price range
                  </label>

                  <div className="exa-screener-range-row">
                    <NumberInput
                      value={filters.minPrice}
                      onChange={(value) => updateFilter("minPrice", value)}
                      placeholder="Min ₹"
                    />

                    <NumberInput
                      value={filters.maxPrice}
                      onChange={(value) => updateFilter("maxPrice", value)}
                      placeholder="Max ₹"
                    />
                  </div>
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">P/E range</label>

                  <div className="exa-screener-range-row">
                    <NumberInput
                      value={filters.minPe}
                      onChange={(value) => updateFilter("minPe", value)}
                      placeholder="Min"
                    />

                    <NumberInput
                      value={filters.maxPe}
                      onChange={(value) => updateFilter("maxPe", value)}
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Minimum revenue growth %
                  </label>

                  <NumberInput
                    value={filters.minRevenueGrowth}
                    onChange={(value) =>
                      updateFilter("minRevenueGrowth", value)
                    }
                    placeholder="Example: 10"
                  />
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Minimum ROE %
                  </label>

                  <NumberInput
                    value={filters.minRoe}
                    onChange={(value) => updateFilter("minRoe", value)}
                    placeholder="Example: 15"
                  />
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Minimum profit margin %
                  </label>

                  <NumberInput
                    value={filters.minProfitMargin}
                    onChange={(value) => updateFilter("minProfitMargin", value)}
                    placeholder="Example: 10"
                  />
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Maximum debt-to-equity
                  </label>

                  <NumberInput
                    value={filters.maxDebtToEquity}
                    onChange={(value) => updateFilter("maxDebtToEquity", value)}
                    placeholder="Example: 100"
                  />
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">RSI range</label>

                  <div className="exa-screener-range-row">
                    <NumberInput
                      value={filters.minRsi}
                      onChange={(value) => updateFilter("minRsi", value)}
                      placeholder="Min"
                    />

                    <NumberInput
                      value={filters.maxRsi}
                      onChange={(value) => updateFilter("maxRsi", value)}
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div className="exa-screener-filter-group">
                  <label className="exa-screener-filter-label">
                    Maximum distance from 52W high %
                  </label>

                  <NumberInput
                    value={filters.maxDistanceFromHigh}
                    onChange={(value) =>
                      updateFilter("maxDistanceFromHigh", value)
                    }
                    placeholder="Example: 10"
                  />
                </div>
              </div>
            </aside>

            <div className="exa-screener-main">
              <section className="exa-screener-presets">
                <div className="exa-screener-presets-title">
                  <Sparkles size={15} color="#60a5fa" />
                  Quick screen presets
                </div>

                <div className="exa-screener-preset-list">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      className={
                        activePreset === preset.id
                          ? "exa-screener-preset-button active"
                          : "exa-screener-preset-button"
                      }
                      onClick={() => applyPreset(preset.id)}
                    >
                      <strong>{preset.label}</strong>

                      <small>{preset.description}</small>
                    </button>
                  ))}
                </div>
              </section>

              <section className="exa-saved-screens-panel">
                <div className="exa-saved-screens-heading">
                  <div className="exa-saved-screens-heading-main">
                    <BookmarkPlus size={16} color="#60a5fa" />

                    <div>
                      <h2>Saved screens</h2>

                      <p>
                        Save the current search, filters, sorting and page size
                        in this browser.
                      </p>
                    </div>
                  </div>

                  <span className="exa-saved-screens-count">
                    {savedScreens.length}/{MAX_SAVED_SCREENS}
                  </span>
                </div>

                <form
                  className="exa-saved-screen-form"
                  onSubmit={saveCurrentScreen}
                >
                  <input
                    type="text"
                    value={savedScreenName}
                    onChange={(event) => setSavedScreenName(event.target.value)}
                    maxLength={50}
                    placeholder="Name this screen, for example High ROE Banks"
                    className="exa-saved-screen-name-input"
                    aria-label="Saved screen name"
                  />

                  <button
                    type="submit"
                    className="exa-saved-screen-save-button"
                    disabled={savedScreenName.trim().length < 2}
                  >
                    <Save size={13} />
                    Save current screen
                  </button>
                </form>

                {savedScreenMessage && (
                  <div
                    className="exa-saved-screen-status success"
                    role="status"
                    aria-live="polite"
                  >
                    {savedScreenMessage}
                  </div>
                )}

                {savedScreenError && (
                  <div className="exa-saved-screen-status error" role="alert">
                    {savedScreenError}
                  </div>
                )}

                {savedScreens.length > 0 ? (
                  <div className="exa-saved-screen-list">
                    {savedScreens.map((screen) => (
                      <article
                        key={screen.id}
                        className="exa-saved-screen-card"
                      >
                        <div className="exa-saved-screen-copy">
                          <strong title={screen.name}>{screen.name}</strong>

                          <p>{describeSavedScreen(screen)}</p>

                          <small>
                            Updated {formatSavedScreenDate(screen.updatedAt)}
                          </small>
                        </div>

                        <div className="exa-saved-screen-actions">
                          <button
                            type="button"
                            className="exa-saved-screen-open"
                            onClick={() => openSavedScreen(screen)}
                            title={`Open ${screen.name}`}
                            aria-label={`Open saved screen ${screen.name}`}
                          >
                            <FolderOpen size={13} />
                          </button>

                          <button
                            type="button"
                            className="exa-saved-screen-delete"
                            onClick={() =>
                              deleteSavedScreen(screen.id, screen.name)
                            }
                            title={`Delete ${screen.name}`}
                            aria-label={`Delete saved screen ${screen.name}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="exa-saved-screen-empty">
                    No saved screens yet. Configure the screener, enter a name
                    and save it for quick access later.
                  </div>
                )}
              </section>

              <section className="exa-screener-toolbar">
                <div className="exa-screener-search">
                  <Search size={15} />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search the complete universe by company or symbol"
                    aria-label="Search screener stocks"
                  />
                </div>

                <select
                  className="exa-screener-toolbar-select"
                  value={sortValue}
                  onChange={(event) => {
                    setSortValue(event.target.value);

                    setActivePreset("custom");

                    setPage(1);
                  }}
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                <select
                  className="exa-screener-toolbar-select"
                  value={pageSize}
                  onChange={(event) => {
                    setPageSize(Number(event.target.value));

                    setPage(1);
                  }}
                >
                  <option value={5}>5 stocks</option>

                  <option value={10}>10 stocks</option>

                  <option value={15}>15 stocks</option>
                </select>

                <span className="exa-screener-result-count">
                  {matchingCount} matching
                </span>
              </section>

              <div className="exa-screener-notice">
                Search, filters, presets and sorting apply to the complete
                screener universe. The page URL can be shared, while saved
                screens are stored locally in this browser.
              </div>

              <section className="exa-screener-table-card">
                {loading ? (
                  <div className="exa-screener-state">
                    <LoaderCircle size={28} className="exa-screener-spinner" />

                    <strong>Loading screener data</strong>

                    <p>
                      Loading the generated market snapshot and applying
                      full-universe filters.
                    </p>
                  </div>
                ) : error ? (
                  <div className="exa-screener-state">
                    <AlertCircle size={27} color="#fb7185" />

                    <strong>Screener unavailable</strong>

                    <p>{error}</p>

                    <button
                      type="button"
                      className="exa-screener-refresh"
                      style={{
                        marginTop: 14,
                      }}
                      onClick={() =>
                        loadScreener({
                          refresh: true,
                        })
                      }
                    >
                      <RefreshCw size={14} />
                      Try again
                    </button>
                  </div>
                ) : visibleStocks.length === 0 ? (
                  <div className="exa-screener-state">
                    <Filter size={27} color="#60a5fa" />

                    <strong>No matching stocks</strong>

                    <p>
                      Change the current filters, select another preset or move
                      to another screener page.
                    </p>

                    <button
                      type="button"
                      className="exa-screener-refresh"
                      style={{
                        marginTop: 14,
                      }}
                      onClick={resetFilters}
                    >
                      <RotateCcw size={14} />
                      Reset filters
                    </button>
                  </div>
                ) : (
                  <div className="exa-screener-table-scroll">
                    <table className="exa-screener-table">
                      <thead>
                        <tr>
                          <th className="exa-screener-compare-cell">
                            Compare
                          </th>

                          <th>Company</th>

                          <th>Price</th>

                          <th>Change</th>

                          <th>Market cap</th>

                          <th>P/E</th>

                          <th>Revenue growth</th>

                          <th>ROE</th>

                          <th>Debt/equity</th>

                          <th>RSI</th>

                          <th>Trend</th>

                          <th>52W high distance</th>

                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {visibleStocks.map((stock) => {
                          const change = Number(stock?.changePercent) || 0;

                          const trendClass = String(
                            stock?.trend || "unavailable",
                          )
                            .toLowerCase()
                            .replace(/\s+/g, "-");

                          const selectedForCompare =
                            isStockSelectedForCompare(stock.symbol);

                          return (
                            <tr
                              key={stock.symbol}
                              className={
                                selectedForCompare
                                  ? "compare-selected"
                                  : ""
                              }
                            >
                              <td className="exa-screener-compare-cell">
                                <button
                                  type="button"
                                  className={
                                    selectedForCompare
                                      ? "exa-screener-compare-toggle selected"
                                      : "exa-screener-compare-toggle"
                                  }
                                  aria-pressed={selectedForCompare}
                                  aria-label={
                                    selectedForCompare
                                      ? `Remove ${stock.name} from comparison`
                                      : `Add ${stock.name} to comparison`
                                  }
                                  title={
                                    selectedForCompare
                                      ? "Remove from comparison"
                                      : "Add to comparison"
                                  }
                                  onClick={() => toggleCompareStock(stock)}
                                >
                                  {selectedForCompare ? (
                                    <Check size={14} />
                                  ) : (
                                    <Scale size={13} />
                                  )}
                                </button>
                              </td>

                              <td>
                                <div className="exa-screener-company">
                                  <CompanyLogo
                                    symbol={stock.symbol}
                                    name={stock.name}
                                    logoDomain={stock.logoDomain}
                                    website={stock.website}
                                    size={40}
                                    className="exa-screener-company-logo"
                                  />

                                  <div className="exa-screener-company-copy">
                                    <strong title={stock.name}>
                                      {stock.name}
                                    </strong>

                                    <span>
                                      {stock.symbol} · {stock.sector}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td>
                                {formatPrice(stock.price, stock.currency)}
                              </td>

                              <td
                                className={
                                  change > 0
                                    ? "exa-screener-positive"
                                    : change < 0
                                      ? "exa-screener-negative"
                                      : "exa-screener-neutral"
                                }
                              >
                                {change > 0 ? "+" : ""}
                                {formatPercent(change)}
                              </td>

                              <td>{formatMarketCap(stock.marketCap)}</td>

                              <td>{formatNumber(stock.peRatio, 2)}</td>

                              <td
                                className={
                                  Number(stock.revenueGrowthPercent) > 0
                                    ? "exa-screener-positive"
                                    : Number(stock.revenueGrowthPercent) < 0
                                      ? "exa-screener-negative"
                                      : ""
                                }
                              >
                                {formatPercent(stock.revenueGrowthPercent)}
                              </td>

                              <td>
                                {formatPercent(stock.returnOnEquityPercent)}
                              </td>

                              <td>{formatNumber(stock.debtToEquity, 2)}</td>

                              <td>
                                <strong
                                  className={
                                    Number(stock.rsi) >= 70
                                      ? "exa-screener-negative"
                                      : Number(stock.rsi) <= 30
                                        ? "exa-screener-positive"
                                        : ""
                                  }
                                >
                                  {formatNumber(stock.rsi, 1)}
                                </strong>

                                <div
                                  style={{
                                    marginTop: 3,
                                    color: "#64748b",
                                    fontSize: 8,
                                  }}
                                >
                                  {stock.rsiStatus}
                                </div>
                              </td>

                              <td>
                                <span
                                  className={`exa-screener-trend ${trendClass}`}
                                >
                                  {["Bullish", "Positive"].includes(
                                    stock.trend,
                                  ) ? (
                                    <TrendingUp size={11} />
                                  ) : ["Bearish", "Negative"].includes(
                                      stock.trend,
                                    ) ? (
                                    <TrendingDown size={11} />
                                  ) : (
                                    <BarChart3 size={11} />
                                  )}

                                  {stock.trend}
                                </span>
                              </td>

                              <td>
                                {formatPercent(stock.distanceFrom52WeekHigh)}
                              </td>

                              <td>
                                <div className="exa-screener-row-actions">
                                  <button
                                    type="button"
                                    className="exa-screener-action"
                                    onClick={() => openAnalysis(stock.symbol)}
                                  >
                                    Analyze
                                    <ArrowRight size={11} />
                                  </button>

                                  {stock.nseUrl && (
                                    <a
                                      className="exa-screener-link"
                                      href={stock.nseUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Open NSE"
                                      aria-label="Open NSE"
                                    >
                                      <ExternalLink size={11} />
                                    </a>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="exa-screener-pagination">
                  <span className="exa-screener-pagination-info">
                    Page {apiData?.page || page} of {apiData?.totalPages || 1}
                    {" · "}
                    {matchingCount} matching stocks
                    {" · "}
                    Snapshot data
                  </span>

                  <div className="exa-screener-pagination-actions">
                    <button
                      type="button"
                      className="exa-screener-page-button"
                      disabled={loading || page <= 1}
                      onClick={() =>
                        setPage((current) => Math.max(current - 1, 1))
                      }
                    >
                      <ArrowLeft size={12} />
                      Previous
                    </button>

                    <button
                      type="button"
                      className="exa-screener-page-button"
                      disabled={loading || page >= (apiData?.totalPages || 1)}
                      onClick={() => setPage((current) => current + 1)}
                    >
                      Next
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>

        {selectedCompareStocks.length > 0 && (
          <section
            className="exa-compare-tray"
            aria-label="Selected companies for comparison"
          >
            <div className="exa-compare-tray-main">
              <div className="exa-compare-tray-title">
                <strong>
                  <Scale size={15} />
                  Compare stocks
                </strong>

                <small>
                  {selectedCompareStocks.length}/{MAX_COMPARE_STOCKS} selected
                </small>
              </div>

              <div className="exa-compare-tray-stocks">
                {selectedCompareStocks.map((stock) => (
                  <div
                    key={stock.symbol}
                    className="exa-compare-chip"
                  >
                    <CompanyLogo
                      symbol={stock.symbol}
                      name={stock.name}
                      logoDomain={stock.logoDomain}
                      website={stock.website}
                      size={30}
                      className="exa-compare-chip-logo"
                    />

                    <div className="exa-compare-chip-copy">
                      <strong title={stock.name}>
                        {stock.name}
                      </strong>

                      <small>{stock.symbol}</small>
                    </div>

                    <button
                      type="button"
                      className="exa-compare-chip-remove"
                      onClick={() =>
                        removeCompareStock(stock.symbol)
                      }
                      aria-label={`Remove ${stock.name}`}
                      title="Remove"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="exa-compare-tray-actions">
                <button
                  type="button"
                  className="exa-compare-clear"
                  onClick={clearCompareSelection}
                >
                  Clear
                </button>

                <button
                  type="button"
                  className="exa-compare-open"
                  disabled={selectedCompareStocks.length < 2}
                  onClick={openComparison}
                >
                  <Scale size={13} />
                  Compare {selectedCompareStocks.length}
                </button>
              </div>
            </div>

            {compareMessage && (
              <p className="exa-compare-tray-message" role="status">
                {compareMessage}
              </p>
            )}
          </section>
        )}
      </main>
    </AppShell>
  );
}