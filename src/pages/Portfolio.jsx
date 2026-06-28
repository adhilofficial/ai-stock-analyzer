import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Download,
  Edit3,
  History,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  TrendingDown,
  TrendingUp,
  WalletCards,
  X,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import AppShell from
  "../components/layout/AppShell";

import SnapshotFreshnessBanner from
  "../components/data/SnapshotFreshnessBanner";

import {
  buildPortfolioPositions,
  normalizePortfolioTransaction,
  PORTFOLIO_TRANSACTION_STORAGE_KEY,
  PORTFOLIO_UPDATED_EVENT,
  readPortfolioTransactions,
  validatePortfolioTransactions,
  writePortfolioTransactions,
} from "../utils/portfolioStorage";

import "../styles/dashboard.css";
import "../styles/dashboard-v2.css";

const MAX_TRANSACTIONS = 2000;
const SYMBOL_BATCH_SIZE = 5;

const SORT_OPTIONS = [
  {
    value: "currentValue-desc",
    label: "Current value: High to low",
  },
  {
    value: "profitLoss-desc",
    label: "Unrealized P/L: High to low",
  },
  {
    value: "totalProfitLoss-desc",
    label: "Total P/L: High to low",
  },
  {
    value: "returnPercent-desc",
    label: "Return: High to low",
  },
  {
    value: "dayChangeValue-desc",
    label: "Session change: High to low",
  },
  {
    value: "name-asc",
    label: "Company: A to Z",
  },
];

const PORTFOLIO_STYLES = `
  .exa-portfolio-page {
    min-height: 100vh;
    padding: 28px;
    color: #e2e8f0;
  }

  .exa-portfolio-container {
    width: 100%;
    max-width: 1540px;
    margin: 0 auto;
  }

  .exa-portfolio-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 18px;
  }

  .exa-portfolio-eyebrow {
    margin: 0 0 7px;
    color: #60a5fa;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .exa-portfolio-header h1 {
    margin: 0;
    color: #f8fafc;
    font-size: clamp(28px, 4vw, 40px);
    line-height: 1.1;
  }

  .exa-portfolio-subtitle {
    max-width: 760px;
    margin: 10px 0 0;
    color: #94a3b8;
    font-size: 13px;
    line-height: 1.7;
  }

  .exa-portfolio-header-actions {
    display: flex;
    align-items: center;
    gap: 9px;
    flex-shrink: 0;
  }

  .exa-portfolio-button {
    min-height: 40px;
    padding: 9px 13px;
    border: 1px solid #29405f;
    border-radius: 11px;
    color: #cbd5e1;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 7px;
    cursor: pointer;
    font-size: 10px;
    font-weight: 800;
    white-space: nowrap;
  }

  .exa-portfolio-button.primary {
    border-color: rgba(96, 165, 250, 0.36);
    color: #eff6ff;
    background:
      linear-gradient(
        135deg,
        #2563eb,
        #4f46e5
      );
  }

  .exa-portfolio-button.danger {
    border-color: rgba(244, 63, 94, 0.24);
    color: #fda4af;
    background: rgba(244, 63, 94, 0.08);
  }

  .exa-portfolio-button:disabled {
    cursor: not-allowed;
    opacity: 0.48;
  }

  .exa-portfolio-spinner {
    animation: exaPortfolioSpin 0.9s linear infinite;
  }

  @keyframes exaPortfolioSpin {
    to {
      transform: rotate(360deg);
    }
  }

  .exa-portfolio-summary-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin: 16px 0;
  }

  .exa-portfolio-summary-card {
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

  .exa-portfolio-summary-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .exa-portfolio-summary-icon {
    width: 31px;
    height: 31px;
    border: 1px solid #29405f;
    border-radius: 9px;
    color: #93c5fd;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .exa-portfolio-summary-card span {
    color: #64748b;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.07em;
    text-transform: uppercase;
  }

  .exa-portfolio-summary-card strong {
    display: block;
    margin-top: 12px;
    color: #f8fafc;
    font-size: 20px;
  }

  .exa-portfolio-summary-card small {
    display: block;
    margin-top: 5px;
    color: #64748b;
    font-size: 9px;
    line-height: 1.45;
  }

  .exa-portfolio-positive {
    color: #4ade80 !important;
  }

  .exa-portfolio-negative {
    color: #fb7185 !important;
  }

  .exa-portfolio-toolbar {
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

  .exa-portfolio-toolbar-search {
    position: relative;
    flex: 1 1 260px;
  }

  .exa-portfolio-toolbar-search svg {
    position: absolute;
    top: 50%;
    left: 12px;
    transform: translateY(-50%);
    color: #64748b;
    pointer-events: none;
  }

  .exa-portfolio-toolbar-search input,
  .exa-portfolio-toolbar select {
    width: 100%;
    min-height: 40px;
    border: 1px solid #1e3350;
    border-radius: 10px;
    outline: none;
    color: #e2e8f0;
    background: #101e34;
    font-size: 10px;
  }

  .exa-portfolio-toolbar-search input {
    padding: 9px 12px 9px 37px;
  }

  .exa-portfolio-toolbar select {
    width: auto;
    min-width: 210px;
    padding: 8px 12px;
  }

  .exa-portfolio-toolbar input:focus,
  .exa-portfolio-toolbar select:focus {
    border-color: rgba(96, 165, 250, 0.65);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .exa-portfolio-count {
    color: #64748b;
    font-size: 10px;
    white-space: nowrap;
  }

  .exa-portfolio-notice {
    padding: 10px 13px;
    margin-top: 12px;
    border: 1px solid rgba(96, 165, 250, 0.18);
    border-radius: 11px;
    color: #cbd5e1;
    background: rgba(30, 64, 175, 0.07);
    font-size: 10px;
    line-height: 1.6;
  }

  .exa-portfolio-table-card {
    margin-top: 14px;
    overflow: hidden;
    border: 1px solid #1e3350;
    border-radius: 16px;
    background: #0a1628;
  }

  .exa-portfolio-table-scroll {
    overflow-x: auto;
  }

  .exa-portfolio-table {
    width: 100%;
    min-width: 1220px;
    border-collapse: collapse;
  }

  .exa-portfolio-table th {
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

  .exa-portfolio-table td {
    padding: 13px 12px;
    border-bottom: 1px solid #152844;
    color: #cbd5e1;
    font-size: 10px;
    vertical-align: middle;
    white-space: nowrap;
  }

  .exa-portfolio-table tbody tr:last-child td {
    border-bottom: 0;
  }

  .exa-portfolio-table tbody tr:hover {
    background: rgba(30, 64, 175, 0.06);
  }

  .exa-portfolio-company {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exa-portfolio-logo {
    width: 38px;
    height: 38px;
    overflow: hidden;
    border: 1px solid #29405f;
    border-radius: 50%;
    color: #93c5fd;
    background: #17263d;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 800;
  }

  .exa-portfolio-logo img {
    width: 72%;
    height: 72%;
    object-fit: contain;
  }

  .exa-portfolio-company-copy {
    min-width: 0;
    max-width: 200px;
  }

  .exa-portfolio-company-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 11px;
    text-overflow: ellipsis;
  }

  .exa-portfolio-company-copy span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 9px;
  }

  .exa-portfolio-row-actions {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .exa-portfolio-icon-button {
    width: 31px;
    height: 31px;
    border: 1px solid #29405f;
    border-radius: 8px;
    color: #94a3b8;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .exa-portfolio-icon-button.danger {
    border-color: rgba(244, 63, 94, 0.18);
    color: #fda4af;
    background: rgba(244, 63, 94, 0.06);
  }

  .exa-portfolio-analyze {
    min-height: 31px;
    padding: 6px 9px;
    border: 1px solid rgba(96, 165, 250, 0.28);
    border-radius: 8px;
    color: #bfdbfe;
    background: rgba(37, 99, 235, 0.11);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    cursor: pointer;
    font-size: 9px;
    font-weight: 800;
  }

  .exa-portfolio-state {
    padding: 62px 20px;
    color: #94a3b8;
    text-align: center;
  }

  .exa-portfolio-state strong {
    display: block;
    margin-top: 12px;
    color: #f8fafc;
    font-size: 15px;
  }

  .exa-portfolio-state p {
    max-width: 500px;
    margin: 8px auto 0;
    font-size: 10px;
    line-height: 1.7;
  }

  .exa-portfolio-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 2000;
    padding: 18px;
    background: rgba(2, 6, 23, 0.78);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .exa-portfolio-modal {
    width: min(560px, 100%);
    max-height: calc(100vh - 36px);
    overflow-y: auto;
    border: 1px solid #29405f;
    border-radius: 18px;
    background: #081426;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
  }

  .exa-portfolio-modal-header {
    padding: 17px;
    border-bottom: 1px solid #1e3350;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 14px;
  }

  .exa-portfolio-modal-header h2 {
    margin: 0;
    color: #f8fafc;
    font-size: 17px;
  }

  .exa-portfolio-modal-header p {
    margin: 5px 0 0;
    color: #64748b;
    font-size: 9px;
    line-height: 1.5;
  }

  .exa-portfolio-modal-close {
    width: 31px;
    height: 31px;
    border: 1px solid #29405f;
    border-radius: 8px;
    color: #94a3b8;
    background: #101e34;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex-shrink: 0;
  }

  .exa-portfolio-modal-body {
    padding: 17px;
  }

  .exa-portfolio-field {
    margin-top: 13px;
  }

  .exa-portfolio-field:first-child {
    margin-top: 0;
  }

  .exa-portfolio-field label {
    display: block;
    margin-bottom: 7px;
    color: #94a3b8;
    font-size: 10px;
    font-weight: 800;
  }

  .exa-portfolio-field input,
  .exa-portfolio-field textarea {
    width: 100%;
    border: 1px solid #1e3350;
    border-radius: 10px;
    outline: none;
    color: #e2e8f0;
    background: #101e34;
    font-size: 11px;
  }

  .exa-portfolio-field input {
    min-height: 41px;
    padding: 9px 11px;
  }

  .exa-portfolio-field textarea {
    min-height: 82px;
    padding: 10px 11px;
    resize: vertical;
  }

  .exa-portfolio-field input:focus,
  .exa-portfolio-field textarea:focus {
    border-color: rgba(96, 165, 250, 0.65);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .exa-portfolio-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 11px;
  }

  .exa-portfolio-stock-search {
    position: relative;
  }

  .exa-portfolio-search-results {
    margin-top: 8px;
    max-height: 250px;
    overflow-y: auto;
    border: 1px solid #1e3350;
    border-radius: 11px;
    background: #0a1628;
  }

  .exa-portfolio-search-state {
    padding: 14px 12px;
    color: #94a3b8;
    font-size: 10px;
    line-height: 1.6;
    text-align: center;
  }

  .exa-portfolio-search-state.error {
    color: #fda4af;
  }

  .exa-portfolio-search-result {
    width: 100%;
    padding: 10px;
    border: 0;
    border-bottom: 1px solid #172a45;
    color: #cbd5e1;
    background: transparent;
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-align: left;
  }

  .exa-portfolio-search-result:last-child {
    border-bottom: 0;
  }

  .exa-portfolio-search-result:hover {
    background: rgba(37, 99, 235, 0.09);
  }

  .exa-portfolio-search-result-copy {
    min-width: 0;
    flex: 1;
  }

  .exa-portfolio-search-result-copy strong {
    display: block;
    overflow: hidden;
    color: #f8fafc;
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-portfolio-search-result-copy span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-portfolio-selected-stock {
    padding: 11px;
    margin-top: 8px;
    border: 1px solid rgba(34, 197, 94, 0.2);
    border-radius: 11px;
    background: rgba(34, 197, 94, 0.06);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exa-portfolio-selected-stock-copy {
    min-width: 0;
    flex: 1;
  }

  .exa-portfolio-selected-stock-copy strong {
    display: block;
    color: #f8fafc;
    font-size: 10px;
  }

  .exa-portfolio-selected-stock-copy span {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-portfolio-form-message {
    padding: 9px 10px;
    margin-top: 12px;
    border-radius: 9px;
    font-size: 9px;
    line-height: 1.5;
  }

  .exa-portfolio-form-message.error {
    border: 1px solid rgba(244, 63, 94, 0.2);
    color: #fda4af;
    background: rgba(244, 63, 94, 0.07);
  }

  .exa-portfolio-form-message.success {
    border: 1px solid rgba(34, 197, 94, 0.2);
    color: #86efac;
    background: rgba(34, 197, 94, 0.07);
  }

  .exa-portfolio-modal-actions {
    padding: 14px 17px 17px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
  }

  @media (max-width: 1180px) {
    .exa-portfolio-summary-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (max-width: 760px) {
    .exa-portfolio-page {
      padding: 18px 12px 28px;
    }

    .exa-portfolio-header {
      flex-direction: column;
    }

    .exa-portfolio-header-actions {
      width: 100%;
    }

    .exa-portfolio-header-actions .exa-portfolio-button {
      flex: 1;
    }

    .exa-portfolio-summary-grid {
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .exa-portfolio-toolbar {
      align-items: stretch;
    }

    .exa-portfolio-toolbar select {
      width: 100%;
    }

    .exa-portfolio-form-grid {
      grid-template-columns: 1fr;
      gap: 0;
    }
  }

  @media (max-width: 460px) {
    .exa-portfolio-summary-grid {
      grid-template-columns: 1fr;
    }
  }

  .exa-portfolio-summary-grid.phase-8c {
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }

  .exa-portfolio-notice.success {
    border-color: rgba(34, 197, 94, 0.24);
    color: #bbf7d0;
    background: rgba(34, 197, 94, 0.07);
  }

  .exa-portfolio-notice.warning {
    border-color: rgba(245, 158, 11, 0.26);
    color: #fcd34d;
    background: rgba(245, 158, 11, 0.07);
  }

  .exa-portfolio-section-header {
    margin-top: 24px;
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
  }

  .exa-portfolio-section-header p {
    margin: 0 0 5px;
    color: #60a5fa;
    font-size: 9px;
    font-weight: 800;
    letter-spacing: 0.12em;
  }

  .exa-portfolio-section-header h2 {
    margin: 0;
    color: #f8fafc;
    font-size: 18px;
  }

  .exa-portfolio-section-header > span {
    color: #64748b;
    font-size: 10px;
  }

  .exa-portfolio-section-header.transaction-heading {
    margin-top: 30px;
  }

  .exa-portfolio-table.holdings-table {
    min-width: 1480px;
  }

  .exa-portfolio-table.transaction-table {
    min-width: 1260px;
  }

  .exa-portfolio-table td small {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-portfolio-company.compact .exa-portfolio-logo {
    width: 31px;
    height: 31px;
    font-size: 11px;
  }

  .exa-portfolio-mini-action {
    min-height: 31px;
    padding: 6px 9px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 9px;
    font-weight: 800;
  }

  .exa-portfolio-mini-action.buy {
    border: 1px solid rgba(34, 197, 94, 0.25);
    color: #86efac;
    background: rgba(34, 197, 94, 0.08);
  }

  .exa-portfolio-mini-action.sell {
    border: 1px solid rgba(244, 63, 94, 0.25);
    color: #fda4af;
    background: rgba(244, 63, 94, 0.08);
  }

  .exa-transaction-badge {
    display: inline-flex;
    min-width: 48px;
    min-height: 25px;
    padding: 5px 8px;
    border-radius: 999px;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .exa-transaction-badge.buy {
    border: 1px solid rgba(34, 197, 94, 0.22);
    color: #86efac;
    background: rgba(34, 197, 94, 0.08);
  }

  .exa-transaction-badge.sell {
    border: 1px solid rgba(244, 63, 94, 0.22);
    color: #fda4af;
    background: rgba(244, 63, 94, 0.08);
  }

  .exa-transaction-note {
    display: block;
    max-width: 220px;
    overflow: hidden;
    color: #94a3b8;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-transaction-type-picker {
    padding: 4px;
    border: 1px solid #1e3350;
    border-radius: 11px;
    background: #0a1628;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px;
  }

  .exa-transaction-type-picker button {
    min-height: 38px;
    border: 1px solid transparent;
    border-radius: 8px;
    color: #64748b;
    background: transparent;
    cursor: pointer;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.08em;
  }

  .exa-transaction-type-picker button.active.buy {
    border-color: rgba(34, 197, 94, 0.25);
    color: #86efac;
    background: rgba(34, 197, 94, 0.1);
  }

  .exa-transaction-type-picker button.active.sell {
    border-color: rgba(244, 63, 94, 0.25);
    color: #fda4af;
    background: rgba(244, 63, 94, 0.1);
  }

  .exa-available-quantity {
    padding: 9px 11px;
    margin-top: 11px;
    border: 1px solid rgba(96, 165, 250, 0.18);
    border-radius: 9px;
    color: #94a3b8;
    background: rgba(37, 99, 235, 0.06);
    font-size: 9px;
  }

  .exa-available-quantity strong {
    color: #bfdbfe;
  }

  .exa-transaction-preview {
    padding: 11px;
    margin-top: 13px;
    border: 1px solid #1e3350;
    border-radius: 10px;
    background: #0a1628;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .exa-transaction-preview span {
    color: #64748b;
    font-size: 9px;
    font-weight: 700;
  }

  .exa-transaction-preview strong {
    color: #f8fafc;
    font-size: 12px;
  }

  @media (max-width: 1450px) {
    .exa-portfolio-summary-grid.phase-8c {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
  }

  @media (max-width: 900px) {
    .exa-portfolio-summary-grid.phase-8c {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 460px) {
    .exa-portfolio-summary-grid.phase-8c {
      grid-template-columns: 1fr;
    }

    .exa-portfolio-section-header {
      align-items: stretch;
      flex-direction: column;
    }
  }

`;

function cleanText(value) {
  return String(value ?? "").trim();
}

function numericValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function formatNumber(
  value,
  digits = 2,
) {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits:
        digits,
    },
  ).format(number);
}

function formatCurrency(
  value,
  digits = 2,
) {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      maximumFractionDigits:
        digits,
    },
  ).format(number);
}

function formatPercent(value) {
  const number = numericValue(value);

  if (number === null) {
    return "N/A";
  }

  const sign =
    number > 0 ? "+" : "";

  return `${sign}${number.toFixed(
    2,
  )}%`;
}

function splitIntoChunks(
  items,
  chunkSize,
) {
  const chunks = [];

  for (
    let index = 0;
    index < items.length;
    index += chunkSize
  ) {
    chunks.push(
      items.slice(
        index,
        index + chunkSize,
      ),
    );
  }

  return chunks;
}

function getApiErrorMessage(
  value,
  fallback,
) {
  if (
    typeof value === "string" &&
    value.trim()
  ) {
    return value.trim();
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const nested =
      value.message ||
      value.error ||
      value.details;

    if (
      typeof nested === "string" &&
      nested.trim()
    ) {
      return nested.trim();
    }
  }

  return fallback;
}

async function fetchJson(
  url,
  signal,
) {
  const response = await fetch(
    url,
    {
      method: "GET",
      headers: {
        Accept:
          "application/json",
      },
      signal,
    },
  );

  const contentType =
    response.headers.get(
      "content-type",
    ) || "";

  if (
    !contentType.includes(
      "application/json",
    )
  ) {
    throw new Error(
      "The market-data API returned a non-JSON response.",
    );
  }

  const data = await response.json();

  if (
    !response.ok ||
    data?.success !== true
  ) {
    throw new Error(
      getApiErrorMessage(
        data?.error,
        "Unable to load portfolio market data.",
      ),
    );
  }

  return data;
}

async function searchPortfolioCompanies(
  query,
  signal,
) {
  const response = await fetch(
    `/api/stock-search?q=${encodeURIComponent(
      query,
    )}`,
    {
      method: "GET",
      headers: {
        Accept:
          "application/json",
      },
      signal,
    },
  );

  const contentType =
    response.headers.get(
      "content-type",
    ) || "";

  if (
    !contentType.includes(
      "application/json",
    )
  ) {
    throw new Error(
      "The stock-search API returned a non-JSON response.",
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        data?.error,
        "Unable to search companies.",
      ),
    );
  }

  const rawResults =
    Array.isArray(data)
      ? data
      : Array.isArray(data?.stocks)
        ? data.stocks
        : Array.isArray(data?.results)
          ? data.results
          : [];

  const seen = new Set();

  return rawResults
    .filter((stock) => {
      const symbol = cleanText(
        stock?.symbol,
      ).toUpperCase();

      const quoteType = cleanText(
        stock?.quoteType ||
          stock?.type,
      ).toUpperCase();

      const isIndianEquity =
        symbol.endsWith(".NS") ||
        symbol.endsWith(".BO");

      const isEquity =
        !quoteType ||
        quoteType.includes(
          "EQUITY",
        );

      if (
        !symbol ||
        !isIndianEquity ||
        !isEquity ||
        seen.has(symbol)
      ) {
        return false;
      }

      seen.add(symbol);
      return true;
    })
    .sort((first, second) => {
      const firstSymbol =
        cleanText(
          first?.symbol,
        ).toUpperCase();

      const secondSymbol =
        cleanText(
          second?.symbol,
        ).toUpperCase();

      const firstRank =
        firstSymbol.endsWith(
          ".NS",
        )
          ? 0
          : 1;

      const secondRank =
        secondSymbol.endsWith(
          ".NS",
        )
          ? 0
          : 1;

      return firstRank - secondRank;
    })
    .slice(0, 10)
    .map((stock) => ({
      symbol:
        cleanText(
          stock?.symbol,
        ).toUpperCase(),

      name:
        cleanText(
          stock?.name ||
            stock?.longname ||
            stock?.shortname,
        ) ||
        cleanText(
          stock?.symbol,
        ),

      sector:
        cleanText(
          stock?.sector,
        ) ||
        "Sector loads after selection",

      logoDomain:
        cleanText(
          stock?.logoDomain,
        ),

      exchange:
        cleanText(
          stock?.exchange,
        ),
    }));
}

async function fetchSingleSymbol(
  symbol,
  signal,
) {
  const baseSymbol = cleanText(
    symbol,
  )
    .toUpperCase()
    .replace(
      /\.(NS|BO)$/i,
      "",
    );

  const parameters =
    new URLSearchParams({
      q: baseSymbol,
      page: "1",
      limit: "50",
      sort: "marketCap-desc",
    });

  const data = await fetchJson(
    `/api/screener?${parameters.toString()}`,
    signal,
  );

  const normalizedTarget =
    cleanText(symbol).toUpperCase();

  const exactStock = (
    Array.isArray(data?.stocks)
      ? data.stocks
      : []
  ).find((stock) => {
    const candidates = [
      stock?.symbol,
      stock?.yahooSymbol,
      stock?.nseSymbol,
      stock?.nseSymbol
        ? `${stock.nseSymbol}.NS`
        : "",
      stock?.bseCode
        ? `${stock.bseCode}.BO`
        : "",
    ]
      .map((value) =>
        cleanText(value).toUpperCase(),
      )
      .filter(Boolean);

    return candidates.includes(
      normalizedTarget,
    );
  });

  return {
    stock: exactStock || null,
    generatedAt:
      data?.generatedAt || null,
    source:
      data?.source ||
      "Screener snapshot",
  };
}

function getDomainFromWebsite(
  website,
) {
  const value = cleanText(website);

  if (!value) {
    return "";
  }

  try {
    return new URL(
      value.startsWith("http")
        ? value
        : `https://${value}`,
    ).hostname.replace(
      /^www\./i,
      "",
    );
  } catch {
    return "";
  }
}

async function fetchLivePortfolioStock(
  symbol,
  signal,
) {
  const normalizedSymbol =
    cleanText(symbol).toUpperCase();

  const parameters =
    new URLSearchParams({
      symbol: normalizedSymbol,
      range: "1d",
    });

  const response = await fetch(
    `/api/stock-data?${parameters.toString()}`,
    {
      method: "GET",
      headers: {
        Accept:
          "application/json",
      },
      signal,
    },
  );

  const contentType =
    response.headers.get(
      "content-type",
    ) || "";

  if (
    !contentType.includes(
      "application/json",
    )
  ) {
    throw new Error(
      `Live market data for ${normalizedSymbol} returned a non-JSON response.`,
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        data?.error,
        `Live market data is unavailable for ${normalizedSymbol}.`,
      ),
    );
  }

  if (!data?.symbol) {
    return {
      stock: null,
      generatedAt: null,
      source:
        data?.source ||
        "Yahoo Finance",
    };
  }

  const resolvedSymbol =
    cleanText(data.symbol)
      .toUpperCase() ||
    normalizedSymbol;

  const baseNseSymbol =
    resolvedSymbol.endsWith(".NS")
      ? resolvedSymbol.replace(
          /\.NS$/i,
          "",
        )
      : "";

  return {
    stock: {
      symbol: resolvedSymbol,
      yahooSymbol: resolvedSymbol,
      name:
        cleanText(
          data.name ||
            data.company,
        ) || resolvedSymbol,
      exchange:
        cleanText(data.exchange),
      currency:
        cleanText(data.currency) ||
        "INR",
      marketState:
        cleanText(data.marketState),
      price: data.price ?? null,
      previousClose:
        data.previousClose ?? null,
      change: data.change ?? null,
      changePercent:
        data.changePercent ?? null,
      marketCap:
        data.marketCap ?? null,
      peRatio:
        data.peRatio ??
        data.peRatioTTM ??
        null,
      forwardPE:
        data.forwardPE ?? null,
      week52Low:
        data.week52Low ??
        data.fiftyTwoWeekLow ??
        null,
      week52High:
        data.week52High ??
        data.fiftyTwoWeekHigh ??
        null,
      volume: data.volume ?? null,
      averageVolume:
        data.averageVolume ?? null,
      sector:
        cleanText(data.sector) ||
        "Sector unavailable",
      industry:
        cleanText(data.industry),
      website:
        cleanText(data.website),
      logoDomain:
        getDomainFromWebsite(
          data.website,
        ),
      nseSymbol: baseNseSymbol,
      nseUrl:
        baseNseSymbol
          ? `https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(
              baseNseSymbol,
            )}`
          : "",
      source:
        data.source ||
        "Yahoo Finance",
      lastUpdated:
        data.lastUpdated ||
        new Date().toISOString(),
    },
    generatedAt:
      data.lastUpdated ||
      new Date().toISOString(),
    source:
      data.source ||
      "Yahoo Finance live fallback",
  };
}

async function fetchPortfolioStock(
  symbol,
  signal,
) {
  const snapshotResult =
    await fetchSingleSymbol(
      symbol,
      signal,
    );

  if (snapshotResult.stock) {
    return {
      ...snapshotResult,
      usedLiveFallback: false,
    };
  }

  const liveResult =
    await fetchLivePortfolioStock(
      symbol,
      signal,
    );

  return {
    ...liveResult,
    usedLiveFallback:
      Boolean(liveResult.stock),
  };
}

async function fetchPortfolioStocks(
  symbols,
  signal,
) {
  const uniqueSymbols = [
    ...new Set(
      symbols
        .map((symbol) =>
          cleanText(symbol)
            .toUpperCase(),
        )
        .filter(Boolean),
    ),
  ];

  const chunks = splitIntoChunks(
    uniqueSymbols,
    SYMBOL_BATCH_SIZE,
  );

  const stocks = [];
  const missingSymbols = [];
  let generatedAt = null;
  let usedLiveFallback = false;

  for (const chunk of chunks) {
    const results =
      await Promise.allSettled(
        chunk.map((symbol) =>
          fetchPortfolioStock(
            symbol,
            signal,
          ),
        ),
      );

    results.forEach(
      (result, index) => {
        const symbol = chunk[index];

        if (
          result.status ===
          "rejected"
        ) {
          if (
            result.reason?.name ===
            "AbortError"
          ) {
            throw result.reason;
          }

          console.warn(
            `Portfolio data unavailable for ${symbol}:`,
            result.reason,
          );

          missingSymbols.push(symbol);
          return;
        }

        if (result.value?.stock) {
          stocks.push(
            result.value.stock,
          );
          generatedAt =
            generatedAt ||
            result.value.generatedAt ||
            null;
          usedLiveFallback =
            usedLiveFallback ||
            Boolean(
              result.value
                .usedLiveFallback,
            );
          return;
        }

        missingSymbols.push(symbol);
      },
    );
  }

  return {
    stocks,
    generatedAt,
    source: usedLiveFallback
      ? "Screener snapshot + Yahoo Finance live fallback"
      : "Screener snapshot",
    missingSymbols,
  };
}

function compareRows(
  first,
  second,
  sortValue,
) {
  const separatorIndex =
    sortValue.lastIndexOf("-");

  const key =
    sortValue.slice(
      0,
      separatorIndex,
    );

  const direction =
    sortValue.slice(
      separatorIndex + 1,
    );

  const firstValue =
    first?.[key];

  const secondValue =
    second?.[key];

  if (
    typeof firstValue === "string" ||
    typeof secondValue === "string"
  ) {
    const result =
      String(firstValue || "")
        .localeCompare(
          String(secondValue || ""),
          "en-IN",
          {
            sensitivity: "base",
          },
        );

    return direction === "asc"
      ? result
      : -result;
  }

  const firstNumber =
    numericValue(firstValue);

  const secondNumber =
    numericValue(secondValue);

  if (
    firstNumber === null &&
    secondNumber === null
  ) {
    return 0;
  }

  if (firstNumber === null) {
    return 1;
  }

  if (secondNumber === null) {
    return -1;
  }

  return direction === "asc"
    ? firstNumber - secondNumber
    : secondNumber - firstNumber;
}

function CompanyLogo({
  domain,
  name,
  className = "exa-portfolio-logo",
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  const logoKey =
    import.meta.env
      .VITE_LOGO_KEY;

  const showImage = Boolean(
    domain &&
      logoKey &&
      !failed,
  );

  return (
    <span className={className}>
      {showImage ? (
        <img
          src={`https://img.logo.dev/${domain}?token=${logoKey}&size=128&format=webp`}
          alt=""
          loading="lazy"
          onError={() =>
            setFailed(true)
          }
        />
      ) : (
        cleanText(name || "?")
          .charAt(0)
          .toUpperCase()
      )}
    </span>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  note,
  tone = "",
}) {
  return (
    <article className="exa-portfolio-summary-card">
      <div className="exa-portfolio-summary-top">
        <span>{label}</span>

        <span className="exa-portfolio-summary-icon">
          <Icon size={15} />
        </span>
      </div>

      <strong className={tone}>
        {value}
      </strong>

      <small>{note}</small>
    </article>
  );
}

function formatTradeDate(value) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return cleanText(value) || "N/A";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function createEmptyTransactionForm({
  type = "BUY",
  stock = null,
} = {}) {
  return {
    type,
    query: stock?.name || stock?.symbol || "",
    selectedStock: stock,
    quantity: "",
    price:
      numericValue(stock?.price) === null
        ? ""
        : String(stock.price),
    charges: "0",
    tradeDate: new Date().toISOString().slice(0, 10),
    notes: "",
  };
}

function getTransactionCashFlow(transaction) {
  const gross = transaction.quantity * transaction.price;

  return transaction.type === "BUY"
    ? -(gross + transaction.charges)
    : gross - transaction.charges;
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

export default function Portfolio() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState(() =>
    readPortfolioTransactions(),
  );
  const [marketStocks, setMarketStocks] = useState([]);
  const [marketMetadata, setMarketMetadata] = useState({
    generatedAt: null,
    source: "Yahoo Finance",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [unavailableSymbols, setUnavailableSymbols] = useState([]);

  const [holdingSearch, setHoldingSearch] = useState("");
  const [sortValue, setSortValue] = useState("currentValue-desc");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [form, setForm] = useState(() => createEmptyTransactionForm());
  const [formMessage, setFormMessage] = useState({
    type: "",
    text: "",
  });
  const [stockSearchResults, setStockSearchResults] = useState([]);
  const [stockSearchLoading, setStockSearchLoading] = useState(false);
  const [stockSearchError, setStockSearchError] = useState("");
  const stockSearchRequestRef = useRef(0);

  const allPositions = useMemo(
    () => buildPortfolioPositions(transactions),
    [transactions],
  );

  const openPositions = useMemo(
    () => allPositions.filter((position) => position.quantity > 0),
    [allPositions],
  );

  const holdingSymbols = useMemo(
    () => openPositions.map((position) => position.symbol),
    [openPositions],
  );

  const loadPortfolioData = useCallback(
    async ({ refresh = false, signal } = {}) => {
      if (holdingSymbols.length === 0) {
        setMarketStocks([]);
        setUnavailableSymbols([]);
        setLoading(false);
        setRefreshing(false);
        setError("");
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const data = await fetchPortfolioStocks(holdingSymbols, signal);

        setMarketStocks(data.stocks);
        setUnavailableSymbols(
          Array.isArray(data?.missingSymbols) ? data.missingSymbols : [],
        );
        setMarketMetadata({
          generatedAt: data.generatedAt,
          source: data.source,
        });
      } catch (caughtError) {
        if (caughtError?.name === "AbortError") {
          return;
        }

        console.error("Portfolio market-data error:", caughtError);
        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load portfolio market data.",
        );
        setMarketStocks([]);
        setUnavailableSymbols(holdingSymbols);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [holdingSymbols],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadPortfolioData({ signal: controller.signal });

    return () => controller.abort();
  }, [loadPortfolioData]);

  useEffect(() => {
    function handlePortfolioUpdate(event) {
      if (Array.isArray(event?.detail)) {
        setTransactions(event.detail);
      }
    }

    function handleStorage(event) {
      if (event.key === PORTFOLIO_TRANSACTION_STORAGE_KEY) {
        setTransactions(readPortfolioTransactions());
      }
    }

    window.addEventListener(
      PORTFOLIO_UPDATED_EVENT,
      handlePortfolioUpdate,
    );
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(
        PORTFOLIO_UPDATED_EVENT,
        handlePortfolioUpdate,
      );
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  useEffect(() => {
    if (
      !modalOpen ||
      editingTransaction ||
      form.selectedStock
    ) {
      setStockSearchResults([]);
      setStockSearchLoading(false);
      setStockSearchError("");
      return;
    }

    const query = cleanText(form.query);

    if (query.length < 2) {
      setStockSearchResults([]);
      setStockSearchLoading(false);
      setStockSearchError("");
      return;
    }

    const requestId = stockSearchRequestRef.current + 1;
    stockSearchRequestRef.current = requestId;
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      setStockSearchLoading(true);
      setStockSearchError("");

      try {
        const results = await searchPortfolioCompanies(
          query,
          controller.signal,
        );

        if (stockSearchRequestRef.current !== requestId) {
          return;
        }

        setStockSearchResults(results);
      } catch (caughtError) {
        if (caughtError?.name === "AbortError") {
          return;
        }

        if (stockSearchRequestRef.current !== requestId) {
          return;
        }

        setStockSearchError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to search companies.",
        );
        setStockSearchResults([]);
      } finally {
        if (stockSearchRequestRef.current === requestId) {
          setStockSearchLoading(false);
        }
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    modalOpen,
    editingTransaction,
    form.query,
    form.selectedStock,
  ]);

  const marketStockMap = useMemo(
    () =>
      new Map(
        marketStocks.map((stock) => [
          cleanText(stock?.symbol).toUpperCase(),
          stock,
        ]),
      ),
    [marketStocks],
  );

  const rows = useMemo(
    () =>
      openPositions.map((position) => {
        const quote = marketStockMap.get(position.symbol) || null;
        const price = numericValue(quote?.price);
        const investedValue = position.quantity * position.averagePrice;
        const currentValue =
          price === null ? null : position.quantity * price;
        const profitLoss =
          currentValue === null ? null : currentValue - investedValue;
        const returnPercent =
          profitLoss === null || investedValue <= 0
            ? null
            : (profitLoss / investedValue) * 100;
        const dayChangeValue =
          numericValue(quote?.change) === null
            ? null
            : position.quantity * Number(quote.change);
        const totalProfitLoss =
          profitLoss === null
            ? null
            : profitLoss + position.realizedProfitLoss;

        return {
          ...position,
          name: cleanText(quote?.name) || position.name,
          sector: cleanText(quote?.sector) || position.sector,
          logoDomain:
            cleanText(quote?.logoDomain) || position.logoDomain,
          quote,
          price,
          investedValue,
          currentValue,
          profitLoss,
          returnPercent,
          dayChangeValue,
          totalProfitLoss,
          changePercent: numericValue(quote?.changePercent),
        };
      }),
    [openPositions, marketStockMap],
  );

  const isMarketOpen = rows.some(
    (row) =>
      String(row.quote?.marketState || "").toUpperCase() === "REGULAR",
  );
  const dayMovementLabel = isMarketOpen ? "Today" : "Last session";
  const dayMovementNote = isMarketOpen
    ? "Estimated live change across holdings"
    : "Change from the latest completed trading session";

  const filteredRows = useMemo(() => {
    const query = cleanText(holdingSearch).toLowerCase();
    const filtered = query
      ? rows.filter((row) =>
          [row.name, row.symbol, row.sector]
            .join(" ")
            .toLowerCase()
            .includes(query),
        )
      : rows;

    return [...filtered].sort((first, second) =>
      compareRows(first, second, sortValue),
    );
  }, [rows, holdingSearch, sortValue]);

  const filteredTransactions = useMemo(() => {
    const query = cleanText(transactionSearch).toLowerCase();

    return [...transactions]
      .filter((transaction) => {
        const matchesType =
          transactionTypeFilter === "ALL" ||
          transaction.type === transactionTypeFilter;
        const matchesSearch =
          !query ||
          [
            transaction.name,
            transaction.symbol,
            transaction.notes,
            transaction.tradeDate,
          ]
            .join(" ")
            .toLowerCase()
            .includes(query);

        return matchesType && matchesSearch;
      })
      .sort((first, second) => {
        const firstKey = `${first.tradeDate}|${first.createdAt}`;
        const secondKey = `${second.tradeDate}|${second.createdAt}`;
        return secondKey.localeCompare(firstKey);
      });
  }, [transactions, transactionSearch, transactionTypeFilter]);

  const totals = useMemo(() => {
    const investedValue = rows.reduce(
      (sum, row) => sum + row.investedValue,
      0,
    );
    const currentRows = rows.filter((row) => row.currentValue !== null);
    const currentValue = currentRows.reduce(
      (sum, row) => sum + row.currentValue,
      0,
    );
    const quotedInvestedValue = currentRows.reduce(
      (sum, row) => sum + row.investedValue,
      0,
    );
    const unrealizedProfitLoss =
      currentRows.length === 0
        ? null
        : currentValue - quotedInvestedValue;
    const returnPercent =
      unrealizedProfitLoss === null || quotedInvestedValue <= 0
        ? null
        : (unrealizedProfitLoss / quotedInvestedValue) * 100;
    const realizedProfitLoss = allPositions.reduce(
      (sum, position) => sum + position.realizedProfitLoss,
      0,
    );
    const totalProfitLoss =
      unrealizedProfitLoss === null
        ? allPositions.length > 0
          ? realizedProfitLoss
          : null
        : unrealizedProfitLoss + realizedProfitLoss;
    const dayChangeRows = rows.filter(
      (row) => row.dayChangeValue !== null,
    );
    const dayChangeValue =
      dayChangeRows.length === 0
        ? null
        : dayChangeRows.reduce(
            (sum, row) => sum + row.dayChangeValue,
            0,
          );

    return {
      investedValue,
      currentValue: currentRows.length === 0 ? null : currentValue,
      unrealizedProfitLoss,
      returnPercent,
      realizedProfitLoss,
      totalProfitLoss,
      dayChangeValue,
    };
  }, [rows, allPositions]);

  const availableQuantity = useMemo(() => {
    const symbol = form.selectedStock?.symbol;

    if (!symbol) {
      return 0;
    }

    const otherTransactions = editingTransaction
      ? transactions.filter(
          (transaction) => transaction.id !== editingTransaction.id,
        )
      : transactions;
    const relevantTransactions = otherTransactions.filter(
      (transaction) =>
        !form.tradeDate || transaction.tradeDate <= form.tradeDate,
    );
    const position = buildPortfolioPositions(relevantTransactions).find(
      (item) => item.symbol === symbol,
    );

    return position?.quantity || 0;
  }, [form.selectedStock, transactions, editingTransaction]);

  function persistTransactions(nextTransactions, errorTarget = "form") {
    const validation = validatePortfolioTransactions(nextTransactions);

    if (!validation.valid) {
      if (errorTarget === "form") {
        setFormMessage({ type: "error", text: validation.message });
      } else {
        window.alert(validation.message);
      }
      return false;
    }

    const success = writePortfolioTransactions(nextTransactions);

    if (!success) {
      const message = "Portfolio transactions could not be saved in this browser.";
      if (errorTarget === "form") {
        setFormMessage({ type: "error", text: message });
      } else {
        window.alert(message);
      }
      return false;
    }

    setTransactions(nextTransactions);
    return true;
  }

  function openAddTransaction({ stock = null, type = "BUY" } = {}) {
    setEditingTransaction(null);
    setForm(createEmptyTransactionForm({ type, stock }));
    setFormMessage({ type: "", text: "" });
    setStockSearchResults([]);
    setModalOpen(true);
  }

  function openEditTransaction(transaction) {
    setEditingTransaction(transaction);
    setForm({
      type: transaction.type,
      query: transaction.name,
      selectedStock: {
        symbol: transaction.symbol,
        name: transaction.name,
        sector: transaction.sector,
        logoDomain: transaction.logoDomain,
      },
      quantity: String(transaction.quantity),
      price: String(transaction.price),
      charges: String(transaction.charges || 0),
      tradeDate: transaction.tradeDate,
      notes: transaction.notes || "",
    });
    setFormMessage({ type: "", text: "" });
    setStockSearchResults([]);
    setModalOpen(true);
  }

  function closeModal() {
    stockSearchRequestRef.current += 1;
    setModalOpen(false);
    setEditingTransaction(null);
    setForm(createEmptyTransactionForm());
    setFormMessage({ type: "", text: "" });
    setStockSearchResults([]);
    setStockSearchLoading(false);
    setStockSearchError("");
  }

  function selectStock(stock) {
    setForm((current) => ({
      ...current,
      query: stock?.name || stock?.symbol || "",
      selectedStock: {
        symbol: cleanText(stock?.symbol).toUpperCase(),
        name:
          cleanText(stock?.name) || cleanText(stock?.symbol),
        sector:
          cleanText(stock?.sector) || "Sector unavailable",
        logoDomain: cleanText(stock?.logoDomain),
      },
    }));
    setStockSearchResults([]);
    setStockSearchError("");
    setFormMessage({ type: "", text: "" });
  }

  function clearSelectedStock() {
    if (editingTransaction) {
      return;
    }

    setForm((current) => ({
      ...current,
      query: "",
      selectedStock: null,
    }));
  }

  function submitTransaction(event) {
    event.preventDefault();

    const selectedStock = form.selectedStock;
    const quantity = numericValue(form.quantity);
    const price = numericValue(form.price);
    const charges = numericValue(form.charges || 0);

    if (!selectedStock?.symbol) {
      setFormMessage({
        type: "error",
        text: "Search and select a company first.",
      });
      return;
    }

    if (quantity === null || quantity <= 0) {
      setFormMessage({
        type: "error",
        text: "Quantity must be greater than zero.",
      });
      return;
    }

    if (price === null || price < 0) {
      setFormMessage({
        type: "error",
        text: "Transaction price must be zero or higher.",
      });
      return;
    }

    if (charges === null || charges < 0) {
      setFormMessage({
        type: "error",
        text: "Brokerage and charges must be zero or higher.",
      });
      return;
    }

    if (!form.tradeDate) {
      setFormMessage({
        type: "error",
        text: "Select the transaction date.",
      });
      return;
    }

    const now = new Date().toISOString();
    const normalized = normalizePortfolioTransaction({
      id: editingTransaction?.id,
      type: form.type,
      symbol: selectedStock.symbol,
      name: selectedStock.name,
      sector: selectedStock.sector,
      logoDomain: selectedStock.logoDomain,
      quantity,
      price,
      charges,
      tradeDate: form.tradeDate,
      notes: form.notes,
      migratedFromHolding: editingTransaction?.migratedFromHolding,
      createdAt: editingTransaction?.createdAt,
      updatedAt: now,
    });

    if (!normalized) {
      setFormMessage({
        type: "error",
        text: "The transaction details are invalid.",
      });
      return;
    }

    if (!editingTransaction && transactions.length >= MAX_TRANSACTIONS) {
      setFormMessage({
        type: "error",
        text: `You can store up to ${MAX_TRANSACTIONS} transactions.`,
      });
      return;
    }

    const nextTransactions = editingTransaction
      ? transactions.map((transaction) =>
          transaction.id === editingTransaction.id
            ? normalized
            : transaction,
        )
      : [normalized, ...transactions];

    if (persistTransactions(nextTransactions)) {
      closeModal();
    }
  }

  function deleteTransaction(transaction) {
    const confirmed = window.confirm(
      `Delete this ${transaction.type.toLowerCase()} transaction for ${transaction.name}?`,
    );

    if (!confirmed) {
      return;
    }

    const nextTransactions = transactions.filter(
      (item) => item.id !== transaction.id,
    );

    persistTransactions(nextTransactions, "alert");
  }

  function exportTransactionsCsv() {
    if (transactions.length === 0) {
      return;
    }

    const headers = [
      "Date",
      "Type",
      "Symbol",
      "Company",
      "Quantity",
      "Price",
      "Charges",
      "Gross Value",
      "Net Cash Flow",
      "Notes",
    ];
    const rowsForCsv = [...transactions]
      .sort((first, second) =>
        `${first.tradeDate}|${first.createdAt}`.localeCompare(
          `${second.tradeDate}|${second.createdAt}`,
        ),
      )
      .map((transaction) => {
        const gross = transaction.quantity * transaction.price;
        return [
          transaction.tradeDate,
          transaction.type,
          transaction.symbol,
          transaction.name,
          transaction.quantity,
          transaction.price,
          transaction.charges,
          gross,
          getTransactionCashFlow(transaction),
          transaction.notes,
        ];
      });
    const csv = [headers, ...rowsForCsv]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `exa-portfolio-transactions-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function openAnalysis(symbol) {
    navigate(`/analyze?symbol=${encodeURIComponent(symbol)}`);
  }

  return (
    <AppShell>
      <style>{PORTFOLIO_STYLES}</style>

      <main className="exa-portfolio-page">
        <div className="exa-portfolio-container">
          <section className="exa-portfolio-header">
            <div>
              <p className="exa-portfolio-eyebrow">EXA PORTFOLIO</p>
              <h1>Portfolio Tracker</h1>
              <p className="exa-portfolio-subtitle">
                Record buy and sell transactions, track weighted average cost,
                current value, realized profit, unrealized profit and complete
                portfolio performance. Data stays in this browser and is not
                connected to a broker or demat account.
              </p>
            </div>

            <div className="exa-portfolio-header-actions">
              <button
                type="button"
                className="exa-portfolio-button"
                disabled={refreshing || openPositions.length === 0}
                onClick={() => loadPortfolioData({ refresh: true })}
              >
                {refreshing ? (
                  <LoaderCircle size={14} className="exa-portfolio-spinner" />
                ) : (
                  <RefreshCw size={14} />
                )}
                {refreshing ? "Reloading" : "Reload values"}
              </button>

              <button
                type="button"
                className="exa-portfolio-button primary"
                onClick={() => openAddTransaction()}
              >
                <Plus size={14} />
                Add transaction
              </button>
            </div>
          </section>

          {marketMetadata.generatedAt && (
            <SnapshotFreshnessBanner
              generatedAt={marketMetadata.generatedAt}
              source={marketMetadata.source}
            />
          )}

          <section className="exa-portfolio-summary-grid phase-8c">
            <SummaryCard
              icon={BriefcaseBusiness}
              label="Holdings"
              value={openPositions.length}
              note={`${transactions.length} total transactions`}
            />
            <SummaryCard
              icon={WalletCards}
              label="Invested value"
              value={formatCurrency(totals.investedValue, 0)}
              note="Open-position weighted cost"
            />
            <SummaryCard
              icon={CircleDollarSign}
              label="Current value"
              value={formatCurrency(totals.currentValue, 0)}
              note={
                totals.currentValue === null
                  ? "Market price unavailable"
                  : "Based on available market prices"
              }
            />
            <SummaryCard
              icon={
                totals.unrealizedProfitLoss !== null &&
                totals.unrealizedProfitLoss < 0
                  ? TrendingDown
                  : TrendingUp
              }
              label="Unrealized P/L"
              value={formatCurrency(totals.unrealizedProfitLoss, 0)}
              note={formatPercent(totals.returnPercent)}
              tone={
                totals.unrealizedProfitLoss === null
                  ? ""
                  : totals.unrealizedProfitLoss >= 0
                    ? "exa-portfolio-positive"
                    : "exa-portfolio-negative"
              }
            />
            <SummaryCard
              icon={
                totals.realizedProfitLoss < 0 ? TrendingDown : TrendingUp
              }
              label="Realized P/L"
              value={formatCurrency(totals.realizedProfitLoss, 0)}
              note="Completed sell transactions"
              tone={
                totals.realizedProfitLoss >= 0
                  ? "exa-portfolio-positive"
                  : "exa-portfolio-negative"
              }
            />
            <SummaryCard
              icon={
                totals.totalProfitLoss !== null && totals.totalProfitLoss < 0
                  ? TrendingDown
                  : TrendingUp
              }
              label="Total P/L"
              value={formatCurrency(totals.totalProfitLoss, 0)}
              note="Realized + unrealized performance"
              tone={
                totals.totalProfitLoss === null
                  ? ""
                  : totals.totalProfitLoss >= 0
                    ? "exa-portfolio-positive"
                    : "exa-portfolio-negative"
              }
            />
            <SummaryCard
              icon={BarChart3}
              label={dayMovementLabel}
              value={formatCurrency(totals.dayChangeValue, 0)}
              note={dayMovementNote}
              tone={
                totals.dayChangeValue === null
                  ? ""
                  : totals.dayChangeValue >= 0
                    ? "exa-portfolio-positive"
                    : "exa-portfolio-negative"
              }
            />
          </section>

          {transactions.some((transaction) => transaction.migratedFromHolding) && (
            <div className="exa-portfolio-notice success">
              Your existing holdings were safely converted into opening BUY
              transactions. You can now add future buys and sells without
              re-entering those positions.
            </div>
          )}

          <div className="exa-portfolio-notice">
            Weighted average cost includes entered buy-side charges. Realized
            P/L uses the weighted-average cost method. Taxes, dividends,
            corporate actions and broker reconciliation are not included.
          </div>

          {unavailableSymbols.length > 0 && (
            <div className="exa-portfolio-notice warning">
              Current market values could not be loaded for:{" "}
              {unavailableSymbols.join(", ")}. Those holdings remain saved and
              display N/A until market data becomes available.
            </div>
          )}

          <section className="exa-portfolio-section-header">
            <div>
              <p>OPEN POSITIONS</p>
              <h2>Current holdings</h2>
            </div>
            <span>{filteredRows.length} visible</span>
          </section>

          <section className="exa-portfolio-toolbar">
            <div className="exa-portfolio-toolbar-search">
              <Search size={15} />
              <input
                type="search"
                value={holdingSearch}
                onChange={(event) => setHoldingSearch(event.target.value)}
                placeholder="Search holdings by company, symbol or sector"
                aria-label="Search portfolio holdings"
              />
            </div>

            <select
              value={sortValue}
              onChange={(event) => setSortValue(event.target.value)}
              aria-label="Sort portfolio"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <span className="exa-portfolio-count">
              {filteredRows.length} of {openPositions.length} holdings
            </span>
          </section>

          <section className="exa-portfolio-table-card">
            {loading ? (
              <div className="exa-portfolio-state">
                <LoaderCircle size={30} className="exa-portfolio-spinner" />
                <strong>Loading portfolio values</strong>
                <p>Matching open positions with current market data.</p>
              </div>
            ) : error ? (
              <div className="exa-portfolio-state">
                <AlertCircle size={30} color="#fb7185" />
                <strong>Portfolio values unavailable</strong>
                <p>{error}</p>
                <button
                  type="button"
                  className="exa-portfolio-button"
                  style={{ marginTop: 14 }}
                  onClick={() => loadPortfolioData({ refresh: true })}
                >
                  <RefreshCw size={13} />
                  Try again
                </button>
              </div>
            ) : openPositions.length === 0 ? (
              <div className="exa-portfolio-state">
                <BriefcaseBusiness size={31} color="#60a5fa" />
                <strong>No open positions</strong>
                <p>
                  Record your first BUY transaction to create a portfolio
                  holding.
                </p>
                <button
                  type="button"
                  className="exa-portfolio-button primary"
                  style={{ marginTop: 14 }}
                  onClick={() => openAddTransaction()}
                >
                  <Plus size={13} />
                  Record first buy
                </button>
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="exa-portfolio-state">
                <Search size={30} color="#60a5fa" />
                <strong>No matching holdings</strong>
                <p>Change the search text to see your open positions.</p>
              </div>
            ) : (
              <div className="exa-portfolio-table-scroll">
                <table className="exa-portfolio-table holdings-table">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Quantity</th>
                      <th>Average cost</th>
                      <th>Current price</th>
                      <th>Invested value</th>
                      <th>Current value</th>
                      <th>Unrealized P/L</th>
                      <th>Realized P/L</th>
                      <th>Total P/L</th>
                      <th>{dayMovementLabel}</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.symbol}>
                        <td>
                          <div className="exa-portfolio-company">
                            <CompanyLogo
                              domain={row.logoDomain}
                              name={row.name}
                            />
                            <div className="exa-portfolio-company-copy">
                              <strong title={row.name}>{row.name}</strong>
                              <span>
                                {row.symbol} · {row.sector}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>{formatNumber(row.quantity, 4)}</td>
                        <td>{formatCurrency(row.averagePrice)}</td>
                        <td>{formatCurrency(row.price)}</td>
                        <td>{formatCurrency(row.investedValue, 0)}</td>
                        <td>{formatCurrency(row.currentValue, 0)}</td>
                        <td
                          className={
                            row.profitLoss === null
                              ? ""
                              : row.profitLoss >= 0
                                ? "exa-portfolio-positive"
                                : "exa-portfolio-negative"
                          }
                        >
                          <div>{formatCurrency(row.profitLoss, 0)}</div>
                          <small>{formatPercent(row.returnPercent)}</small>
                        </td>
                        <td
                          className={
                            row.realizedProfitLoss >= 0
                              ? "exa-portfolio-positive"
                              : "exa-portfolio-negative"
                          }
                        >
                          {formatCurrency(row.realizedProfitLoss, 0)}
                        </td>
                        <td
                          className={
                            row.totalProfitLoss === null
                              ? ""
                              : row.totalProfitLoss >= 0
                                ? "exa-portfolio-positive"
                                : "exa-portfolio-negative"
                          }
                        >
                          {formatCurrency(row.totalProfitLoss, 0)}
                        </td>
                        <td
                          className={
                            row.dayChangeValue === null
                              ? ""
                              : row.dayChangeValue >= 0
                                ? "exa-portfolio-positive"
                                : "exa-portfolio-negative"
                          }
                        >
                          <div>{formatCurrency(row.dayChangeValue, 0)}</div>
                          <small>{formatPercent(row.changePercent)}</small>
                        </td>
                        <td>
                          <div className="exa-portfolio-row-actions">
                            <button
                              type="button"
                              className="exa-portfolio-mini-action buy"
                              onClick={() =>
                                openAddTransaction({
                                  type: "BUY",
                                  stock: {
                                    symbol: row.symbol,
                                    name: row.name,
                                    sector: row.sector,
                                    logoDomain: row.logoDomain,
                                    price: row.price,
                                  },
                                })
                              }
                            >
                              Buy
                            </button>
                            <button
                              type="button"
                              className="exa-portfolio-mini-action sell"
                              onClick={() =>
                                openAddTransaction({
                                  type: "SELL",
                                  stock: {
                                    symbol: row.symbol,
                                    name: row.name,
                                    sector: row.sector,
                                    logoDomain: row.logoDomain,
                                    price: row.price,
                                  },
                                })
                              }
                            >
                              Sell
                            </button>
                            <button
                              type="button"
                              className="exa-portfolio-analyze"
                              onClick={() => openAnalysis(row.symbol)}
                            >
                              Analyze
                              <ArrowRight size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="exa-portfolio-section-header transaction-heading">
            <div>
              <p>LEDGER</p>
              <h2>Transaction history</h2>
            </div>
            <button
              type="button"
              className="exa-portfolio-button"
              disabled={transactions.length === 0}
              onClick={exportTransactionsCsv}
            >
              <Download size={14} />
              Export CSV
            </button>
          </section>

          <section className="exa-portfolio-toolbar">
            <div className="exa-portfolio-toolbar-search">
              <Search size={15} />
              <input
                type="search"
                value={transactionSearch}
                onChange={(event) =>
                  setTransactionSearch(event.target.value)
                }
                placeholder="Search transactions by company, symbol, date or notes"
                aria-label="Search portfolio transactions"
              />
            </div>
            <select
              value={transactionTypeFilter}
              onChange={(event) =>
                setTransactionTypeFilter(event.target.value)
              }
              aria-label="Filter transaction type"
            >
              <option value="ALL">All transaction types</option>
              <option value="BUY">Buy transactions</option>
              <option value="SELL">Sell transactions</option>
            </select>
            <span className="exa-portfolio-count">
              {filteredTransactions.length} of {transactions.length} transactions
            </span>
          </section>

          <section className="exa-portfolio-table-card transaction-card">
            {transactions.length === 0 ? (
              <div className="exa-portfolio-state">
                <History size={31} color="#60a5fa" />
                <strong>No transaction history</strong>
                <p>Your recorded buys and sells will appear here.</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="exa-portfolio-state">
                <Search size={30} color="#60a5fa" />
                <strong>No matching transactions</strong>
                <p>Change the search text or transaction-type filter.</p>
              </div>
            ) : (
              <div className="exa-portfolio-table-scroll">
                <table className="exa-portfolio-table transaction-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Company</th>
                      <th>Quantity</th>
                      <th>Price</th>
                      <th>Charges</th>
                      <th>Gross value</th>
                      <th>Net cash flow</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((transaction) => {
                      const gross = transaction.quantity * transaction.price;
                      const cashFlow = getTransactionCashFlow(transaction);

                      return (
                        <tr key={transaction.id}>
                          <td>{formatTradeDate(transaction.tradeDate)}</td>
                          <td>
                            <span
                              className={`exa-transaction-badge ${transaction.type.toLowerCase()}`}
                            >
                              {transaction.type}
                            </span>
                          </td>
                          <td>
                            <div className="exa-portfolio-company compact">
                              <CompanyLogo
                                domain={transaction.logoDomain}
                                name={transaction.name}
                              />
                              <div className="exa-portfolio-company-copy">
                                <strong title={transaction.name}>
                                  {transaction.name}
                                </strong>
                                <span>{transaction.symbol}</span>
                              </div>
                            </div>
                          </td>
                          <td>{formatNumber(transaction.quantity, 4)}</td>
                          <td>{formatCurrency(transaction.price)}</td>
                          <td>{formatCurrency(transaction.charges)}</td>
                          <td>{formatCurrency(gross, 0)}</td>
                          <td
                            className={
                              cashFlow >= 0
                                ? "exa-portfolio-positive"
                                : "exa-portfolio-negative"
                            }
                          >
                            {formatCurrency(cashFlow, 0)}
                          </td>
                          <td>
                            <span className="exa-transaction-note" title={transaction.notes}>
                              {transaction.notes || "—"}
                            </span>
                          </td>
                          <td>
                            <div className="exa-portfolio-row-actions">
                              <button
                                type="button"
                                className="exa-portfolio-icon-button"
                                onClick={() => openEditTransaction(transaction)}
                                aria-label={`Edit ${transaction.type.toLowerCase()} transaction`}
                                title="Edit transaction"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                type="button"
                                className="exa-portfolio-icon-button danger"
                                onClick={() => deleteTransaction(transaction)}
                                aria-label={`Delete ${transaction.type.toLowerCase()} transaction`}
                                title="Delete transaction"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      {modalOpen && (
        <div
          className="exa-portfolio-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="exa-portfolio-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="portfolio-transaction-title"
          >
            <div className="exa-portfolio-modal-header">
              <div>
                <h2 id="portfolio-transaction-title">
                  {editingTransaction
                    ? "Edit transaction"
                    : "Add portfolio transaction"}
                </h2>
                <p>
                  Record the actual trade details. Holdings and profit/loss are
                  recalculated automatically.
                </p>
              </div>
              <button
                type="button"
                className="exa-portfolio-modal-close"
                onClick={closeModal}
                aria-label="Close transaction form"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={submitTransaction}>
              <div className="exa-portfolio-modal-body">
                <div className="exa-transaction-type-picker">
                  <button
                    type="button"
                    className={form.type === "BUY" ? "active buy" : ""}
                    onClick={() =>
                      setForm((current) => ({ ...current, type: "BUY" }))
                    }
                  >
                    BUY
                  </button>
                  <button
                    type="button"
                    className={form.type === "SELL" ? "active sell" : ""}
                    onClick={() =>
                      setForm((current) => ({ ...current, type: "SELL" }))
                    }
                  >
                    SELL
                  </button>
                </div>

                <div className="exa-portfolio-field">
                  <label>Company</label>
                  {form.selectedStock ? (
                    <div className="exa-portfolio-selected-stock">
                      <CompanyLogo
                        domain={form.selectedStock.logoDomain}
                        name={form.selectedStock.name}
                      />
                      <div className="exa-portfolio-selected-stock-copy">
                        <strong>{form.selectedStock.name}</strong>
                        <span>
                          {form.selectedStock.symbol} ·{" "}
                          {form.selectedStock.sector}
                        </span>
                      </div>
                      {!editingTransaction && (
                        <button
                          type="button"
                          className="exa-portfolio-icon-button"
                          onClick={clearSelectedStock}
                          aria-label="Change selected company"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="exa-portfolio-stock-search">
                      <input
                        type="search"
                        value={form.query}
                        onChange={(event) => {
                          setForm((current) => ({
                            ...current,
                            query: event.target.value,
                          }));
                          setFormMessage({ type: "", text: "" });
                        }}
                        placeholder="Search Reliance, TCS, HDFC Bank..."
                        autoComplete="off"
                      />

                      {cleanText(form.query).length >= 2 && (
                        <div className="exa-portfolio-search-results">
                          {stockSearchLoading ? (
                            <div className="exa-portfolio-search-state">
                              <LoaderCircle
                                size={15}
                                className="exa-portfolio-spinner"
                              />
                              <div style={{ marginTop: 7 }}>
                                Searching companies...
                              </div>
                            </div>
                          ) : stockSearchError ? (
                            <div className="exa-portfolio-search-state error">
                              {stockSearchError}
                            </div>
                          ) : stockSearchResults.length === 0 ? (
                            <div className="exa-portfolio-search-state">
                              No matching NSE or BSE companies found. Try a
                              company name or ticker such as RELIANCE or TCS.
                            </div>
                          ) : (
                            stockSearchResults.map((stock) => (
                              <button
                                key={stock.symbol}
                                type="button"
                                className="exa-portfolio-search-result"
                                onClick={() => selectStock(stock)}
                              >
                                <CompanyLogo
                                  domain={stock.logoDomain}
                                  name={stock.name}
                                />
                                <div className="exa-portfolio-search-result-copy">
                                  <strong>{stock.name}</strong>
                                  <span>
                                    {stock.symbol} · {stock.sector}
                                  </span>
                                </div>
                                <Check size={13} color="#60a5fa" />
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {form.type === "SELL" && form.selectedStock && (
                  <div className="exa-available-quantity">
                    Available quantity before this transaction:{" "}
                    <strong>{formatNumber(availableQuantity, 4)}</strong>
                  </div>
                )}

                <div className="exa-portfolio-form-grid">
                  <div className="exa-portfolio-field">
                    <label htmlFor="portfolio-transaction-quantity">
                      Quantity
                    </label>
                    <input
                      id="portfolio-transaction-quantity"
                      type="number"
                      min="0"
                      step="any"
                      value={form.quantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          quantity: event.target.value,
                        }))
                      }
                      placeholder="Example: 10"
                    />
                  </div>
                  <div className="exa-portfolio-field">
                    <label htmlFor="portfolio-transaction-price">
                      Price per share
                    </label>
                    <input
                      id="portfolio-transaction-price"
                      type="number"
                      min="0"
                      step="any"
                      value={form.price}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          price: event.target.value,
                        }))
                      }
                      placeholder="Example: 1450"
                    />
                  </div>
                </div>

                <div className="exa-portfolio-form-grid">
                  <div className="exa-portfolio-field">
                    <label htmlFor="portfolio-transaction-charges">
                      Brokerage and charges
                    </label>
                    <input
                      id="portfolio-transaction-charges"
                      type="number"
                      min="0"
                      step="any"
                      value={form.charges}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          charges: event.target.value,
                        }))
                      }
                      placeholder="Example: 25"
                    />
                  </div>
                  <div className="exa-portfolio-field">
                    <label htmlFor="portfolio-transaction-date">
                      Transaction date
                    </label>
                    <input
                      id="portfolio-transaction-date"
                      type="date"
                      value={form.tradeDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          tradeDate: event.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="exa-portfolio-field">
                  <label htmlFor="portfolio-transaction-notes">
                    Notes — optional
                  </label>
                  <textarea
                    id="portfolio-transaction-notes"
                    value={form.notes}
                    maxLength={240}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Broker reference, reason for the trade or personal notes"
                  />
                </div>

                {numericValue(form.quantity) !== null &&
                  numericValue(form.price) !== null && (
                    <div className="exa-transaction-preview">
                      <span>Estimated gross value</span>
                      <strong>
                        {formatCurrency(
                          Number(form.quantity) * Number(form.price),
                          0,
                        )}
                      </strong>
                    </div>
                  )}

                {formMessage.text && (
                  <div
                    className={`exa-portfolio-form-message ${formMessage.type}`}
                    role="status"
                  >
                    {formMessage.text}
                  </div>
                )}
              </div>

              <div className="exa-portfolio-modal-actions">
                <button
                  type="button"
                  className="exa-portfolio-button"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`exa-portfolio-button primary ${form.type.toLowerCase()}`}
                >
                  {editingTransaction ? <Edit3 size={13} /> : <Plus size={13} />}
                  {editingTransaction
                    ? "Save transaction"
                    : `Record ${form.type.toLowerCase()}`}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppShell>
  );
}