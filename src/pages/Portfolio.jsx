import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  CircleDollarSign,
  Download,
  Edit3,
  History,
  Layers3,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  WalletCards,
  X,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  useNavigate,
} from "react-router-dom";

import AppShell from
  "../components/layout/AppShell";

import CompanyLogo from
  "../components/common/CompanyLogo";

import DataStatusBadge from
  "../components/data/DataStatusBadge";

import DataTimestamp from
  "../components/data/DataTimestamp";

import {
  getPortfolioQuotes,
} from "../services/portfolioApi";

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

const PORTFOLIO_CHART_COLORS = [
  "#60a5fa",
  "#818cf8",
  "#22c55e",
  "#f59e0b",
  "#f43f5e",
  "#14b8a6",
  "#a78bfa",
  "#38bdf8",
];

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


  .exa-portfolio-header-side {
    display: flex;
    min-width: 270px;
    flex-direction: column;
    align-items: flex-end;
    gap: 12px;
  }

  .exa-portfolio-market-status {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }

  .exa-portfolio-quote-state {
    display: block;
    margin-top: 4px;
    font-size: 8px;
    font-weight: 750;
    letter-spacing: 0.03em;
  }

  .exa-portfolio-quote-state.live {
    color: #4ade80;
  }

  .exa-portfolio-quote-state.closed {
    color: #fbbf24;
  }

  .exa-portfolio-quote-state.unavailable {
    color: #fb7185;
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

  .exa-portfolio-analytics {
    margin-top: 28px;
  }

  .exa-analytics-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 14px;
  }

  .exa-analytics-heading p {
    margin: 0 0 5px;
    color: #60a5fa;
    font-size: 9px;
    font-weight: 900;
    letter-spacing: 0.13em;
  }

  .exa-analytics-heading h2 {
    margin: 0;
    color: #f8fafc;
    font-size: 20px;
  }

  .exa-diversification-badge {
    min-width: 150px;
    padding: 10px 12px;
    border: 1px solid #29405f;
    border-radius: 12px;
    background: #0b1729;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .exa-diversification-badge > strong {
    width: 42px;
    height: 42px;
    border: 4px solid rgba(96, 165, 250, 0.26);
    border-radius: 50%;
    color: #bfdbfe;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
  }

  .exa-diversification-badge span {
    display: block;
    color: #e2e8f0;
    font-size: 10px;
    font-weight: 800;
  }

  .exa-diversification-badge small {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-risk-overview-grid {
    display: grid;
    grid-template-columns: 1.25fr repeat(5, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 12px;
  }

  .exa-risk-panel,
  .exa-analytics-metric,
  .exa-analytics-card,
  .exa-performance-list-card,
  .exa-cashflow-card {
    min-width: 0;
    border: 1px solid #1e3350;
    border-radius: 15px;
    background:
      linear-gradient(
        145deg,
        rgba(14, 29, 50, 0.98),
        rgba(8, 20, 37, 0.98)
      );
  }

  .exa-risk-panel {
    padding: 16px;
  }

  .exa-risk-panel-top {
    display: flex;
    align-items: center;
    gap: 9px;
  }

  .exa-risk-panel-top svg {
    color: #60a5fa;
  }

  .exa-risk-panel-top strong {
    color: #f8fafc;
    font-size: 12px;
  }

  .exa-risk-panel > p {
    margin: 9px 0 0;
    color: #94a3b8;
    font-size: 9px;
    line-height: 1.6;
  }

  .exa-risk-meter {
    height: 7px;
    margin-top: 13px;
    border-radius: 999px;
    background: #14243a;
    overflow: hidden;
  }

  .exa-risk-meter span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #2563eb, #22c55e);
  }

  .exa-analytics-metric {
    padding: 15px;
  }

  .exa-analytics-metric svg {
    color: #60a5fa;
  }

  .exa-analytics-metric span {
    display: block;
    margin-top: 10px;
    color: #64748b;
    font-size: 8px;
    font-weight: 800;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .exa-analytics-metric strong {
    display: block;
    margin-top: 6px;
    overflow: hidden;
    color: #f8fafc;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-analytics-metric small {
    display: block;
    margin-top: 4px;
    color: #94a3b8;
    font-size: 8px;
  }

  .exa-risk-warning-list {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 12px;
  }

  .exa-risk-warning {
    padding: 11px 12px;
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-radius: 11px;
    color: #fcd34d;
    background: rgba(245, 158, 11, 0.06);
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 9px;
    line-height: 1.5;
  }

  .exa-risk-warning.healthy {
    border-color: rgba(34, 197, 94, 0.2);
    color: #bbf7d0;
    background: rgba(34, 197, 94, 0.06);
  }

  .exa-analytics-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .exa-analytics-card {
    padding: 16px;
  }

  .exa-analytics-card.wide {
    grid-column: 1 / -1;
  }

  .exa-analytics-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
  }

  .exa-analytics-card-header strong {
    display: block;
    color: #f8fafc;
    font-size: 12px;
  }

  .exa-analytics-card-header span {
    display: block;
    margin-top: 4px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-analytics-card-header svg {
    color: #60a5fa;
    flex-shrink: 0;
  }

  .exa-chart-shell {
    width: 100%;
    height: 290px;
    min-width: 0;
  }

  .exa-chart-shell.compact {
    height: 250px;
  }

  .exa-allocation-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(180px, 0.8fr);
    gap: 14px;
    align-items: center;
  }

  .exa-allocation-legend {
    max-height: 250px;
    padding-right: 4px;
    overflow-y: auto;
  }

  .exa-allocation-legend-row {
    padding: 8px 0;
    border-bottom: 1px solid rgba(41, 64, 95, 0.55);
    display: grid;
    grid-template-columns: 9px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
  }

  .exa-allocation-legend-row:last-child {
    border-bottom: 0;
  }

  .exa-allocation-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .exa-allocation-legend-row strong {
    overflow: hidden;
    color: #cbd5e1;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-allocation-legend-row span {
    color: #93c5fd;
    font-size: 9px;
    font-weight: 800;
  }

  .exa-performance-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    margin-top: 12px;
  }

  .exa-performance-list-card {
    padding: 15px;
  }

  .exa-performance-list-card > strong {
    display: flex;
    align-items: center;
    gap: 7px;
    color: #f8fafc;
    font-size: 11px;
  }

  .exa-performance-list-card > strong svg {
    color: #60a5fa;
  }

  .exa-performance-row {
    padding: 10px 0;
    border-bottom: 1px solid rgba(41, 64, 95, 0.55);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .exa-performance-row:last-child {
    border-bottom: 0;
  }

  .exa-performance-row div {
    min-width: 0;
  }

  .exa-performance-row div strong {
    display: block;
    overflow: hidden;
    color: #cbd5e1;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .exa-performance-row div small {
    display: block;
    margin-top: 3px;
    color: #64748b;
    font-size: 8px;
  }

  .exa-performance-row > strong {
    flex-shrink: 0;
    font-size: 10px;
  }

  .exa-cashflow-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .exa-cashflow-card {
    padding: 14px;
  }

  .exa-cashflow-card span {
    display: block;
    color: #64748b;
    font-size: 8px;
    font-weight: 800;
    text-transform: uppercase;
  }

  .exa-cashflow-card strong {
    display: block;
    margin-top: 7px;
    color: #f8fafc;
    font-size: 14px;
  }

  .exa-cashflow-card small {
    display: block;
    margin-top: 4px;
    color: #94a3b8;
    font-size: 8px;
  }

  .exa-analytics-empty {
    min-height: 220px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #64748b;
    text-align: center;
    font-size: 9px;
  }

  .exa-analytics-empty strong {
    margin-top: 8px;
    color: #cbd5e1;
    font-size: 11px;
  }

  .exa-recharts-tooltip {
    padding: 9px 10px;
    border: 1px solid #29405f;
    border-radius: 9px;
    color: #e2e8f0;
    background: #0b1729;
    font-size: 9px;
    box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
  }

  @media (max-width: 1180px) {
    .exa-risk-overview-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .exa-risk-panel {
      grid-column: span 2;
    }
  }

  @media (max-width: 900px) {
    .exa-analytics-grid,
    .exa-performance-grid {
      grid-template-columns: 1fr;
    }

    .exa-analytics-card.wide {
      grid-column: auto;
    }

    .exa-risk-warning-list {
      grid-template-columns: 1fr;
    }

    .exa-cashflow-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 700px) {
    .exa-analytics-heading {
      align-items: stretch;
      flex-direction: column;
    }

    .exa-diversification-badge {
      width: 100%;
    }

    .exa-risk-overview-grid {
      grid-template-columns: 1fr 1fr;
    }

    .exa-risk-panel {
      grid-column: 1 / -1;
    }

    .exa-allocation-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 460px) {
    .exa-risk-overview-grid,
    .exa-cashflow-grid {
      grid-template-columns: 1fr;
    }

    .exa-chart-shell {
      height: 250px;
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

async function fetchPortfolioStocks(
  symbols,
  signal,
  refresh = false,
) {
  const data = await getPortfolioQuotes({
    symbols,
    refresh,
    signal,
  });

  return {
    stocks: data.quotes.map((quote) => ({
      ...quote,
      source: "Market data",
    })),
    generatedAt: data.fetchedAt,
    source: "Market data",
    cached: Boolean(data.cached),
    partial: Boolean(data.partial),
    warning: data.warning || "",
    missingSymbols: data.unavailableSymbols,
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

function truncateChartLabel(value, maximumLength = 16) {
  const text = cleanText(value);

  if (text.length <= maximumLength) {
    return text;
  }

  return `${text.slice(0, Math.max(1, maximumLength - 1))}…`;
}

function formatCompactCurrency(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "₹0";
  }

  const absolute = Math.abs(number);
  const sign = number < 0 ? "-" : "";

  if (absolute >= 10000000) {
    return `${sign}₹${(absolute / 10000000).toFixed(1)}Cr`;
  }

  if (absolute >= 100000) {
    return `${sign}₹${(absolute / 100000).toFixed(1)}L`;
  }

  if (absolute >= 1000) {
    return `${sign}₹${(absolute / 1000).toFixed(1)}K`;
  }

  return `${sign}₹${absolute.toFixed(0)}`;
}

function PortfolioChartTooltip({
  active,
  payload,
  label,
  valueType = "currency",
}) {
  if (!active || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return (
    <div className="exa-recharts-tooltip">
      {label && <strong>{label}</strong>}
      {payload.map((entry) => (
        <div key={`${entry.dataKey}-${entry.name}`}>
          {entry.name}: {
            valueType === "percent"
              ? formatPercent(entry.value)
              : formatCurrency(entry.value, 0)
          }
        </div>
      ))}
    </div>
  );
}

export default function Portfolio() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState(() =>
    readPortfolioTransactions(),
  );
  const [marketStocks, setMarketStocks] = useState([]);
  const [marketMetadata, setMarketMetadata] = useState({
    generatedAt: null,
    source: "Market data",
    cached: false,
    partial: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
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
        setMarketMetadata({
          generatedAt: null,
          source: "Market data",
          cached: false,
          partial: false,
        });
        setLoading(false);
        setRefreshing(false);
        setError("");
        setWarning("");
        return;
      }

      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");
      setWarning("");

      try {
        const data = await fetchPortfolioStocks(
          holdingSymbols,
          signal,
          refresh,
        );

        setMarketStocks(data.stocks);

        const missingSymbols = Array.isArray(
          data?.missingSymbols,
        )
          ? data.missingSymbols
          : [];

        setUnavailableSymbols(missingSymbols);
        setMarketMetadata({
          generatedAt: data.generatedAt,
          source: "Market data",
          cached: Boolean(data.cached),
          partial:
            Boolean(data.partial) ||
            missingSymbols.length > 0,
        });

        if (data.warning) {
          setWarning(data.warning);
        }
      } catch (caughtError) {
        if (caughtError?.name === "AbortError") {
          return;
        }

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load portfolio market data.";

        if (refresh) {
          setWarning(
            "The latest refresh failed. Previously loaded portfolio values remain visible.",
          );
          setMarketMetadata((current) => ({
            ...current,
            partial: true,
          }));
        } else {
          setError(message);
          setMarketStocks([]);
          setUnavailableSymbols(holdingSymbols);
        }
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
          quoteStatus:
            price === null
              ? "unavailable"
              : String(
                    quote?.marketState || "",
                  ).toUpperCase() === "REGULAR"
                ? "live"
                : "closed",
          quoteLabel:
            price === null
              ? "Quote unavailable"
              : String(
                    quote?.marketState || "",
                  ).toUpperCase() === "REGULAR"
                ? "Market open"
                : "Latest close",
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


  const portfolioMarketPresentation = useMemo(() => {
    if (loading && marketStocks.length === 0) {
      return {
        status: "loading",
        label: "Loading values",
        fallbackText: "Fetching portfolio quotes",
      };
    }

    if (error && marketStocks.length === 0) {
      return {
        status: "unavailable",
        label: "Values unavailable",
        fallbackText: "Portfolio quotes unavailable",
      };
    }

    if (
      warning ||
      marketMetadata.partial ||
      unavailableSymbols.length > 0
    ) {
      return {
        status: "delayed",
        label: "Partial update",
        fallbackText: "Some holding quotes are unavailable",
      };
    }

    if (marketMetadata.cached) {
      return {
        status: "cached",
        label: "Cached values",
        fallbackText: "Cached quote time unavailable",
      };
    }

    if (isMarketOpen) {
      return {
        status: "live",
        label: "Market open",
        fallbackText: "Current quote time unavailable",
      };
    }

    return {
      status: "delayed",
      label: "Market closed",
      fallbackText: "Latest session time unavailable",
    };
  }, [
    loading,
    error,
    warning,
    marketStocks.length,
    marketMetadata.partial,
    marketMetadata.cached,
    unavailableSymbols.length,
    isMarketOpen,
  ]);

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

  const portfolioAnalytics = useMemo(() => {
    const rowMap = new Map(
      rows.map((row) => [row.symbol, row]),
    );

    const allocationRows = rows
      .map((row) => ({
        ...row,
        allocationValue:
          row.currentValue === null
            ? row.investedValue
            : row.currentValue,
      }))
      .filter((row) => row.allocationValue > 0);

    const allocationTotal = allocationRows.reduce(
      (sum, row) => sum + row.allocationValue,
      0,
    );

    const companyAllocation = [...allocationRows]
      .sort(
        (first, second) =>
          second.allocationValue - first.allocationValue,
      )
      .map((row) => ({
        name: row.name,
        symbol: row.symbol,
        value: row.allocationValue,
        percentage:
          allocationTotal > 0
            ? (row.allocationValue / allocationTotal) * 100
            : 0,
      }));

    const sectorMap = new Map();

    allocationRows.forEach((row) => {
      const sector = cleanText(row.sector) || "Unclassified";
      sectorMap.set(
        sector,
        (sectorMap.get(sector) || 0) + row.allocationValue,
      );
    });

    const sectorAllocation = [...sectorMap.entries()]
      .map(([name, value]) => ({
        name,
        chartName: truncateChartLabel(name, 18),
        value,
        percentage:
          allocationTotal > 0 ? (value / allocationTotal) * 100 : 0,
      }))
      .sort((first, second) => second.value - first.value);

    const valueComparison = [...allocationRows]
      .sort(
        (first, second) =>
          second.allocationValue - first.allocationValue,
      )
      .slice(0, 10)
      .map((row) => ({
        name: truncateChartLabel(row.name, 13),
        symbol: row.symbol,
        invested: row.investedValue,
        current:
          row.currentValue === null
            ? row.investedValue
            : row.currentValue,
      }));

    const performanceRows = rows
      .filter((row) => row.returnPercent !== null)
      .sort(
        (first, second) =>
          second.returnPercent - first.returnPercent,
      );

    const topPerformers = performanceRows.slice(0, 3);
    const worstPerformers = [...performanceRows]
      .sort(
        (first, second) =>
          first.returnPercent - second.returnPercent,
      )
      .slice(0, 3);

    const profitLossContribution = allPositions
      .map((position) => {
        const row = rowMap.get(position.symbol);
        const unrealized = row?.profitLoss ?? 0;
        const contribution =
          position.realizedProfitLoss + unrealized;

        return {
          name: truncateChartLabel(position.name, 15),
          fullName: position.name,
          symbol: position.symbol,
          contribution,
        };
      })
      .filter((item) => Math.abs(item.contribution) > 0.005)
      .sort(
        (first, second) =>
          Math.abs(second.contribution) -
          Math.abs(first.contribution),
      )
      .slice(0, 10);

    const profitLossBreakdown = [
      {
        name: "Realized",
        profitLoss: totals.realizedProfitLoss,
      },
      {
        name: "Unrealized",
        profitLoss: totals.unrealizedProfitLoss ?? 0,
      },
    ];

    const cashFlow = transactions.reduce(
      (summary, transaction) => {
        const gross = transaction.quantity * transaction.price;

        if (transaction.type === "BUY") {
          summary.buyOutflow += gross + transaction.charges;
          summary.buyCount += 1;
        } else {
          summary.sellInflow += gross - transaction.charges;
          summary.sellCount += 1;
        }

        summary.totalCharges += transaction.charges;
        return summary;
      },
      {
        buyOutflow: 0,
        sellInflow: 0,
        totalCharges: 0,
        buyCount: 0,
        sellCount: 0,
      },
    );

    cashFlow.netCashInvested =
      cashFlow.buyOutflow - cashFlow.sellInflow;

    const totalReturnPercent =
      totals.totalProfitLoss === null || cashFlow.netCashInvested <= 0
        ? null
        : (totals.totalProfitLoss / cashFlow.netCashInvested) * 100;

    const companyWeights = companyAllocation.map(
      (item) => item.percentage / 100,
    );
    const sectorWeights = sectorAllocation.map(
      (item) => item.percentage / 100,
    );
    const companyCount = companyWeights.length;
    const sectorCount = sectorWeights.length;
    const companyHhi = companyWeights.reduce(
      (sum, weight) => sum + weight * weight,
      0,
    );
    const sectorHhi = sectorWeights.reduce(
      (sum, weight) => sum + weight * weight,
      0,
    );
    const companyBalance =
      companyCount <= 1
        ? 0
        : ((1 - companyHhi) / (1 - 1 / companyCount)) * 100;
    const sectorBalance =
      sectorCount <= 1
        ? 0
        : ((1 - sectorHhi) / (1 - 1 / sectorCount)) * 100;
    const breadthScore = Math.min(100, (companyCount / 8) * 100);
    const diversificationScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          companyBalance * 0.5 +
            sectorBalance * 0.3 +
            breadthScore * 0.2,
        ),
      ),
    );

    const largestPositions = companyAllocation.slice(0, 5);
    const topPosition = companyAllocation[0] || null;
    const topSector = sectorAllocation[0] || null;
    const topThreeWeight = companyAllocation
      .slice(0, 3)
      .reduce((sum, item) => sum + item.percentage, 0);
    const warnings = [];

    if (companyCount > 0 && companyCount < 3) {
      warnings.push(
        "The portfolio has fewer than three open holdings, so company-specific risk is high.",
      );
    }

    if (topPosition?.percentage >= 35) {
      warnings.push(
        `${topPosition.name} represents ${topPosition.percentage.toFixed(1)}% of portfolio value.`,
      );
    }

    if (topThreeWeight >= 75 && companyCount > 3) {
      warnings.push(
        `The three largest holdings represent ${topThreeWeight.toFixed(1)}% of portfolio value.`,
      );
    }

    if (topSector?.percentage >= 50) {
      warnings.push(
        `${topSector.name} represents ${topSector.percentage.toFixed(1)}% of portfolio value.`,
      );
    }

    const quoteCoverage =
      rows.length === 0
        ? 0
        : (
            rows.filter((row) => row.currentValue !== null).length /
            rows.length
          ) * 100;

    return {
      allocationTotal,
      companyAllocation,
      sectorAllocation,
      valueComparison,
      topPerformers,
      worstPerformers,
      largestPositions,
      profitLossContribution,
      profitLossBreakdown,
      cashFlow,
      totalReturnPercent,
      diversificationScore,
      diversificationLabel:
        diversificationScore >= 75
          ? "Well diversified"
          : diversificationScore >= 50
            ? "Moderately diversified"
            : "Concentrated",
      topPosition,
      topSector,
      topThreeWeight,
      warnings,
      quoteCoverage,
      winners: performanceRows.filter(
        (row) => row.returnPercent >= 0,
      ).length,
      losers: performanceRows.filter(
        (row) => row.returnPercent < 0,
      ).length,
    };
  }, [rows, allPositions, transactions, totals]);

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

            <div className="exa-portfolio-header-side">
              {openPositions.length > 0 && (
                <div className="exa-portfolio-market-status">
                  <DataStatusBadge
                    status={portfolioMarketPresentation.status}
                    label={portfolioMarketPresentation.label}
                    compact
                  />

                  <DataTimestamp
                    value={marketMetadata.generatedAt}
                    source="Market data"
                    fallbackText={
                      portfolioMarketPresentation.fallbackText
                    }
                    compact
                  />
                </div>
              )}

              <div className="exa-portfolio-header-actions">
                <button
                  type="button"
                  className="exa-portfolio-button"
                  disabled={refreshing || openPositions.length === 0}
                  onClick={() => loadPortfolioData({ refresh: true })}
                >
                  {refreshing ? (
                    <LoaderCircle
                      size={14}
                      className="exa-portfolio-spinner"
                    />
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
            </div>
          </section>

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

          {warning && (
            <div className="exa-portfolio-notice warning">
              {warning}
            </div>
          )}

          {unavailableSymbols.length > 0 && (
            <div className="exa-portfolio-notice warning">
              Current market values could not be loaded for:{" "}
              {unavailableSymbols.join(", ")}. Those holdings remain saved and
              display N/A until market data becomes available.
            </div>
          )}

          <section className="exa-portfolio-analytics">
            <div className="exa-analytics-heading">
              <div>
                <p>PORTFOLIO INTELLIGENCE</p>
                <h2>Allocation, risk and performance</h2>
              </div>

              <div className="exa-diversification-badge">
                <strong>{portfolioAnalytics.diversificationScore}</strong>
                <div>
                  <span>{portfolioAnalytics.diversificationLabel}</span>
                  <small>Diversification score out of 100</small>
                </div>
              </div>
            </div>

            <div className="exa-risk-overview-grid">
              <article className="exa-risk-panel">
                <div className="exa-risk-panel-top">
                  <ShieldCheck size={17} />
                  <strong>Concentration assessment</strong>
                </div>
                <p>
                  The score combines company balance, sector balance and the
                  number of open holdings. It is a portfolio-structure indicator,
                  not an investment recommendation.
                </p>
                <div className="exa-risk-meter">
                  <span
                    style={{
                      width: `${portfolioAnalytics.diversificationScore}%`,
                    }}
                  />
                </div>
              </article>

              <article className="exa-analytics-metric">
                <Target size={16} />
                <span>Largest holding</span>
                <strong>
                  {portfolioAnalytics.topPosition?.name || "No holdings"}
                </strong>
                <small>
                  {portfolioAnalytics.topPosition
                    ? `${portfolioAnalytics.topPosition.percentage.toFixed(1)}% of value`
                    : "Add a BUY transaction"}
                </small>
              </article>

              <article className="exa-analytics-metric">
                <Layers3 size={16} />
                <span>Largest sector</span>
                <strong>
                  {portfolioAnalytics.topSector?.name || "No sectors"}
                </strong>
                <small>
                  {portfolioAnalytics.topSector
                    ? `${portfolioAnalytics.topSector.percentage.toFixed(1)}% of value`
                    : "Sector data unavailable"}
                </small>
              </article>

              <article className="exa-analytics-metric">
                <Activity size={16} />
                <span>Market-data coverage</span>
                <strong>
                  {portfolioAnalytics.quoteCoverage.toFixed(0)}%
                </strong>
                <small>Open holdings with a current quote</small>
              </article>

              <article className="exa-analytics-metric">
                <Trophy size={16} />
                <span>Winners / losers</span>
                <strong>
                  {portfolioAnalytics.winners} / {portfolioAnalytics.losers}
                </strong>
                <small>Based on unrealized return</small>
              </article>

              <article className="exa-analytics-metric">
                <CircleDollarSign size={16} />
                <span>Total portfolio return</span>
                <strong
                  className={
                    portfolioAnalytics.totalReturnPercent === null
                      ? ""
                      : portfolioAnalytics.totalReturnPercent >= 0
                        ? "exa-portfolio-positive"
                        : "exa-portfolio-negative"
                  }
                >
                  {formatPercent(portfolioAnalytics.totalReturnPercent)}
                </strong>
                <small>Total P/L divided by net cash invested</small>
              </article>
            </div>

            <div className="exa-risk-warning-list">
              {portfolioAnalytics.warnings.length > 0 ? (
                portfolioAnalytics.warnings.map((warning) => (
                  <div key={warning} className="exa-risk-warning">
                    <AlertTriangle size={14} />
                    <span>{warning}</span>
                  </div>
                ))
              ) : (
                <div className="exa-risk-warning healthy">
                  <ShieldCheck size={14} />
                  <span>
                    No major company or sector concentration warning was
                    detected under the current thresholds.
                  </span>
                </div>
              )}
            </div>

            <div className="exa-analytics-grid">
              <article className="exa-analytics-card">
                <div className="exa-analytics-card-header">
                  <div>
                    <strong>Company allocation</strong>
                    <span>Current value, or invested value when quote is unavailable</span>
                  </div>
                  <Target size={16} />
                </div>

                {portfolioAnalytics.companyAllocation.length === 0 ? (
                  <div className="exa-analytics-empty">
                    <BriefcaseBusiness size={28} />
                    <strong>No allocation data yet</strong>
                    <span>Record a BUY transaction to create a holding.</span>
                  </div>
                ) : (
                  <div className="exa-allocation-layout">
                    <div className="exa-chart-shell compact">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={portfolioAnalytics.companyAllocation}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="58%"
                            outerRadius="88%"
                            paddingAngle={2}
                            stroke="none"
                          >
                            {portfolioAnalytics.companyAllocation.map(
                              (item, index) => (
                                <Cell
                                  key={item.symbol}
                                  fill={
                                    PORTFOLIO_CHART_COLORS[
                                      index % PORTFOLIO_CHART_COLORS.length
                                    ]
                                  }
                                />
                              ),
                            )}
                          </Pie>
                          <Tooltip
                            content={<PortfolioChartTooltip />}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="exa-allocation-legend">
                      {portfolioAnalytics.companyAllocation
                        .slice(0, 8)
                        .map((item, index) => (
                          <div
                            key={item.symbol}
                            className="exa-allocation-legend-row"
                          >
                            <span
                              className="exa-allocation-dot"
                              style={{
                                background:
                                  PORTFOLIO_CHART_COLORS[
                                    index % PORTFOLIO_CHART_COLORS.length
                                  ],
                              }}
                            />
                            <strong title={item.name}>{item.name}</strong>
                            <span>{item.percentage.toFixed(1)}%</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </article>

              <article className="exa-analytics-card">
                <div className="exa-analytics-card-header">
                  <div>
                    <strong>Sector allocation</strong>
                    <span>Portfolio value grouped by available sector classification</span>
                  </div>
                  <Layers3 size={16} />
                </div>

                {portfolioAnalytics.sectorAllocation.length === 0 ? (
                  <div className="exa-analytics-empty">
                    <Layers3 size={28} />
                    <strong>No sector allocation yet</strong>
                  </div>
                ) : (
                  <div className="exa-chart-shell compact">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={portfolioAnalytics.sectorAllocation.slice(0, 8)}
                        layout="vertical"
                        margin={{ top: 4, right: 12, bottom: 4, left: 12 }}
                      >
                        <CartesianGrid
                          stroke="rgba(100,116,139,0.13)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tickFormatter={formatCompactCurrency}
                          tick={{ fill: "#64748b", fontSize: 8 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="chartName"
                          width={92}
                          tick={{ fill: "#94a3b8", fontSize: 8 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<PortfolioChartTooltip />} />
                        <Bar
                          dataKey="value"
                          name="Value"
                          fill="#60a5fa"
                          radius={[0, 5, 5, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="exa-analytics-card wide">
                <div className="exa-analytics-card-header">
                  <div>
                    <strong>Invested versus current value</strong>
                    <span>Largest holdings by portfolio value, up to ten companies</span>
                  </div>
                  <BarChart3 size={16} />
                </div>

                {portfolioAnalytics.valueComparison.length === 0 ? (
                  <div className="exa-analytics-empty">
                    <BarChart3 size={28} />
                    <strong>No value comparison available</strong>
                  </div>
                ) : (
                  <div className="exa-chart-shell">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={portfolioAnalytics.valueComparison}
                        margin={{ top: 8, right: 12, bottom: 38, left: 4 }}
                      >
                        <CartesianGrid
                          stroke="rgba(100,116,139,0.13)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="name"
                          angle={-25}
                          textAnchor="end"
                          interval={0}
                          height={56}
                          tick={{ fill: "#64748b", fontSize: 8 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={formatCompactCurrency}
                          tick={{ fill: "#64748b", fontSize: 8 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<PortfolioChartTooltip />} />
                        <Bar
                          dataKey="invested"
                          name="Invested"
                          fill="#64748b"
                          radius={[5, 5, 0, 0]}
                        />
                        <Bar
                          dataKey="current"
                          name="Current"
                          fill="#60a5fa"
                          radius={[5, 5, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="exa-analytics-card">
                <div className="exa-analytics-card-header">
                  <div>
                    <strong>Profit/loss contribution</strong>
                    <span>Realized plus unrealized contribution by company</span>
                  </div>
                  <TrendingUp size={16} />
                </div>

                {portfolioAnalytics.profitLossContribution.length === 0 ? (
                  <div className="exa-analytics-empty">
                    <Activity size={28} />
                    <strong>No profit/loss contribution yet</strong>
                  </div>
                ) : (
                  <div className="exa-chart-shell compact">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={portfolioAnalytics.profitLossContribution}
                        layout="vertical"
                        margin={{ top: 4, right: 12, bottom: 4, left: 12 }}
                      >
                        <CartesianGrid
                          stroke="rgba(100,116,139,0.13)"
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          tickFormatter={formatCompactCurrency}
                          tick={{ fill: "#64748b", fontSize: 8 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={96}
                          tick={{ fill: "#94a3b8", fontSize: 8 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<PortfolioChartTooltip />} />
                        <Bar
                          dataKey="contribution"
                          name="Contribution"
                          radius={[5, 5, 5, 5]}
                        >
                          {portfolioAnalytics.profitLossContribution.map(
                            (item) => (
                              <Cell
                                key={item.symbol}
                                fill={
                                  item.contribution >= 0
                                    ? "#22c55e"
                                    : "#f43f5e"
                                }
                              />
                            ),
                          )}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="exa-analytics-card">
                <div className="exa-analytics-card-header">
                  <div>
                    <strong>Realized versus unrealized P/L</strong>
                    <span>Signed portfolio performance components</span>
                  </div>
                  <Activity size={16} />
                </div>

                <div className="exa-chart-shell compact">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={portfolioAnalytics.profitLossBreakdown}
                      margin={{ top: 12, right: 12, bottom: 8, left: 4 }}
                    >
                      <CartesianGrid
                        stroke="rgba(100,116,139,0.13)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#94a3b8", fontSize: 9 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={formatCompactCurrency}
                        tick={{ fill: "#64748b", fontSize: 8 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<PortfolioChartTooltip />} />
                      <Bar
                        dataKey="profitLoss"
                        name="P/L"
                        radius={[6, 6, 0, 0]}
                      >
                        {portfolioAnalytics.profitLossBreakdown.map(
                          (item) => (
                            <Cell
                              key={item.name}
                              fill={
                                item.profitLoss >= 0
                                  ? "#22c55e"
                                  : "#f43f5e"
                              }
                            />
                          ),
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </article>
            </div>

            <div className="exa-performance-grid">
              <article className="exa-performance-list-card">
                <strong>
                  <TrendingUp size={14} />
                  Top performers
                </strong>
                {portfolioAnalytics.topPerformers.length === 0 ? (
                  <div className="exa-analytics-empty">No quoted holdings</div>
                ) : (
                  portfolioAnalytics.topPerformers.map((row) => (
                    <div key={row.symbol} className="exa-performance-row">
                      <div>
                        <strong title={row.name}>{row.name}</strong>
                        <small>{row.symbol}</small>
                      </div>
                      <strong
                        className={
                          row.returnPercent >= 0
                            ? "exa-portfolio-positive"
                            : "exa-portfolio-negative"
                        }
                      >
                        {formatPercent(row.returnPercent)}
                      </strong>
                    </div>
                  ))
                )}
              </article>

              <article className="exa-performance-list-card">
                <strong>
                  <TrendingDown size={14} />
                  Weakest performers
                </strong>
                {portfolioAnalytics.worstPerformers.length === 0 ? (
                  <div className="exa-analytics-empty">No quoted holdings</div>
                ) : (
                  portfolioAnalytics.worstPerformers.map((row) => (
                    <div key={row.symbol} className="exa-performance-row">
                      <div>
                        <strong title={row.name}>{row.name}</strong>
                        <small>{row.symbol}</small>
                      </div>
                      <strong
                        className={
                          row.returnPercent >= 0
                            ? "exa-portfolio-positive"
                            : "exa-portfolio-negative"
                        }
                      >
                        {formatPercent(row.returnPercent)}
                      </strong>
                    </div>
                  ))
                )}
              </article>

              <article className="exa-performance-list-card">
                <strong>
                  <Target size={14} />
                  Largest positions
                </strong>
                {portfolioAnalytics.largestPositions.length === 0 ? (
                  <div className="exa-analytics-empty">No open positions</div>
                ) : (
                  portfolioAnalytics.largestPositions.map((item) => (
                    <div key={item.symbol} className="exa-performance-row">
                      <div>
                        <strong title={item.name}>{item.name}</strong>
                        <small>{formatCurrency(item.value, 0)}</small>
                      </div>
                      <strong>{item.percentage.toFixed(1)}%</strong>
                    </div>
                  ))
                )}
              </article>
            </div>

            <div className="exa-analytics-card wide" style={{ marginTop: 12 }}>
              <div className="exa-analytics-card-header">
                <div>
                  <strong>Transaction cash-flow summary</strong>
                  <span>Gross BUY outflows, SELL inflows and entered charges</span>
                </div>
                <WalletCards size={16} />
              </div>

              <div className="exa-cashflow-grid">
                <article className="exa-cashflow-card">
                  <span>BUY outflow</span>
                  <strong>
                    {formatCurrency(portfolioAnalytics.cashFlow.buyOutflow, 0)}
                  </strong>
                  <small>
                    {portfolioAnalytics.cashFlow.buyCount} BUY transactions
                  </small>
                </article>
                <article className="exa-cashflow-card">
                  <span>SELL inflow</span>
                  <strong>
                    {formatCurrency(portfolioAnalytics.cashFlow.sellInflow, 0)}
                  </strong>
                  <small>
                    {portfolioAnalytics.cashFlow.sellCount} SELL transactions
                  </small>
                </article>
                <article className="exa-cashflow-card">
                  <span>Net cash invested</span>
                  <strong>
                    {formatCurrency(
                      portfolioAnalytics.cashFlow.netCashInvested,
                      0,
                    )}
                  </strong>
                  <small>BUY outflow minus SELL inflow</small>
                </article>
                <article className="exa-cashflow-card">
                  <span>Total charges</span>
                  <strong>
                    {formatCurrency(
                      portfolioAnalytics.cashFlow.totalCharges,
                      0,
                    )}
                  </strong>
                  <small>All entered brokerage and charges</small>
                </article>
              </div>
            </div>
          </section>

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
                              symbol={row.symbol}
                              name={row.name}
                              logoDomain={row.logoDomain}
                              size={36}
                              className="exa-portfolio-logo"
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
                        <td>
                          <div>{formatCurrency(row.price)}</div>
                          <small
                            className={`exa-portfolio-quote-state ${row.quoteStatus}`}
                          >
                            {row.quoteLabel}
                          </small>
                        </td>
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
                                symbol={transaction.symbol}
                                name={transaction.name}
                                logoDomain={transaction.logoDomain}
                                size={32}
                                className="exa-portfolio-logo"
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
                        symbol={form.selectedStock.symbol}
                        name={form.selectedStock.name}
                        logoDomain={form.selectedStock.logoDomain}
                        size={36}
                        className="exa-portfolio-logo"
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
                                  symbol={stock.symbol}
                                  name={stock.name}
                                  logoDomain={stock.logoDomain}
                                  size={36}
                                  className="exa-portfolio-logo"
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