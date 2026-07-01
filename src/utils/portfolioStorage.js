const LEGACY_PORTFOLIO_STORAGE_KEY =
  "exa-portfolio-holdings-v1";

export const PORTFOLIO_TRANSACTION_STORAGE_KEY =
  "exa-portfolio-transactions-v1";

const PORTFOLIO_MIGRATION_KEY =
  "exa-portfolio-transactions-migration-v1";

export const PORTFOLIO_UPDATED_EVENT =
  "exa:portfolio-updated";

const EPSILON = 1e-8;
const MAX_TRANSACTIONS = 2000;

function cleanText(value) {
  return String(value ?? "").trim();
}


function normalizePortfolioSymbol(value) {
  const symbol = cleanText(value).toUpperCase();

  if (
    !symbol ||
    !/^[A-Z0-9.^&=_-]+$/.test(symbol)
  ) {
    return "";
  }

  return symbol;
}

function safePositiveNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number > 0
    ? number
    : null;
}

function safeNonNegativeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : null;
}

function createId(prefix = "transaction") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

function normalizeDate(value) {
  const text = cleanText(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const parsed = new Date(text);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }

  return parsed.toISOString().slice(0, 10);
}

function transactionSortValue(transaction) {
  return `${transaction.tradeDate || ""}|${
    transaction.createdAt || ""
  }|${transaction.id || ""}`;
}

export function normalizePortfolioHolding(holding) {
  if (!holding || typeof holding !== "object") {
    return null;
  }

  const symbol = normalizePortfolioSymbol(holding.symbol);
  const quantity = safePositiveNumber(holding.quantity);
  const averagePrice = safeNonNegativeNumber(
    holding.averagePrice,
  );

  if (!symbol || quantity === null || averagePrice === null) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: cleanText(holding.id) || createId("holding"),
    symbol,
    name: cleanText(holding.name) || symbol,
    sector:
      cleanText(holding.sector) || "Sector unavailable",
    logoDomain: cleanText(holding.logoDomain),
    quantity,
    averagePrice,
    notes: cleanText(holding.notes).slice(0, 240),
    createdAt: cleanText(holding.createdAt) || now,
    updatedAt: cleanText(holding.updatedAt) || now,
  };
}

export function readPortfolioHoldings() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(
      LEGACY_PORTFOLIO_STORAGE_KEY,
    );

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const seenIds = new Set();

    return parsed
      .map(normalizePortfolioHolding)
      .filter((holding) => {
        if (!holding || seenIds.has(holding.id)) {
          return false;
        }

        seenIds.add(holding.id);
        return true;
      })
      .slice(0, 100);
  } catch (error) {
    console.error("Unable to read portfolio holdings:", error);
    return [];
  }
}

export function writePortfolioHoldings(holdings) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const normalized = (Array.isArray(holdings) ? holdings : [])
      .map(normalizePortfolioHolding)
      .filter(Boolean)
      .slice(0, 100);

    window.localStorage.setItem(
      LEGACY_PORTFOLIO_STORAGE_KEY,
      JSON.stringify(normalized),
    );

    return true;
  } catch (error) {
    console.error("Unable to save portfolio holdings:", error);
    return false;
  }
}

export function normalizePortfolioTransaction(transaction) {
  if (!transaction || typeof transaction !== "object") {
    return null;
  }

  const type = cleanText(transaction.type).toUpperCase();
  const symbol = normalizePortfolioSymbol(transaction.symbol);
  const quantity = safePositiveNumber(transaction.quantity);
  const price = safeNonNegativeNumber(transaction.price);
  const charges = safeNonNegativeNumber(
    transaction.charges ?? 0,
  );

  if (
    !["BUY", "SELL"].includes(type) ||
    !symbol ||
    quantity === null ||
    price === null ||
    charges === null
  ) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: cleanText(transaction.id) || createId(),
    type,
    symbol,
    name: cleanText(transaction.name) || symbol,
    sector:
      cleanText(transaction.sector) || "Sector unavailable",
    logoDomain: cleanText(transaction.logoDomain),
    quantity,
    price,
    charges,
    tradeDate: normalizeDate(
      transaction.tradeDate || transaction.date,
    ),
    notes: cleanText(transaction.notes).slice(0, 240),
    migratedFromHolding: Boolean(
      transaction.migratedFromHolding,
    ),
    createdAt: cleanText(transaction.createdAt) || now,
    updatedAt: cleanText(transaction.updatedAt) || now,
  };
}

function migrateLegacyHoldings() {
  if (typeof window === "undefined") {
    return [];
  }

  const migrationStatus = window.localStorage.getItem(
    PORTFOLIO_MIGRATION_KEY,
  );

  if (migrationStatus === "complete") {
    return [];
  }

  const legacyHoldings = readPortfolioHoldings();

  const migrated = legacyHoldings
    .map((holding) =>
      normalizePortfolioTransaction({
        type: "BUY",
        symbol: holding.symbol,
        name: holding.name,
        sector: holding.sector,
        logoDomain: holding.logoDomain,
        quantity: holding.quantity,
        price: holding.averagePrice,
        charges: 0,
        tradeDate: holding.createdAt,
        notes: holding.notes,
        migratedFromHolding: true,
        createdAt: holding.createdAt,
        updatedAt: holding.updatedAt,
      }),
    )
    .filter(Boolean);

  window.localStorage.setItem(
    PORTFOLIO_MIGRATION_KEY,
    "complete",
  );

  if (migrated.length > 0) {
    window.localStorage.setItem(
      PORTFOLIO_TRANSACTION_STORAGE_KEY,
      JSON.stringify(migrated),
    );
  }

  return migrated;
}

export function readPortfolioTransactions() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(
      PORTFOLIO_TRANSACTION_STORAGE_KEY,
    );

    if (!rawValue) {
      return migrateLegacyHoldings();
    }

    const parsed = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return migrateLegacyHoldings();
    }

    const seenIds = new Set();

    const normalized = parsed
      .map(normalizePortfolioTransaction)
      .filter((transaction) => {
        if (!transaction || seenIds.has(transaction.id)) {
          return false;
        }

        seenIds.add(transaction.id);
        return true;
      })
      .slice(0, MAX_TRANSACTIONS);

    window.localStorage.setItem(
      PORTFOLIO_MIGRATION_KEY,
      "complete",
    );

    return normalized;
  } catch (error) {
    console.error("Unable to read portfolio transactions:", error);
    return migrateLegacyHoldings();
  }
}

export function validatePortfolioTransactions(transactions) {
  const input = Array.isArray(transactions)
    ? transactions
    : [];

  if (input.length > MAX_TRANSACTIONS) {
    return {
      valid: false,
      message: `A portfolio can store up to ${MAX_TRANSACTIONS} transactions.`,
    };
  }

  const normalized = input
    .map(normalizePortfolioTransaction);

  if (normalized.some((transaction) => !transaction)) {
    return {
      valid: false,
      message:
        "One or more portfolio transactions contain invalid fields.",
    };
  }

  const transactionIds = new Set();

  for (const transaction of normalized) {
    if (transactionIds.has(transaction.id)) {
      return {
        valid: false,
        transactionId: transaction.id,
        message:
          "Duplicate portfolio transaction identifiers were detected.",
      };
    }

    transactionIds.add(transaction.id);
  }

  normalized.sort((first, second) =>
    transactionSortValue(first).localeCompare(
      transactionSortValue(second),
    ),
  );

  const quantities = new Map();

  for (const transaction of normalized) {
    const currentQuantity = quantities.get(transaction.symbol) || 0;

    if (transaction.type === "BUY") {
      quantities.set(
        transaction.symbol,
        currentQuantity + transaction.quantity,
      );
      continue;
    }

    if (transaction.quantity > currentQuantity + EPSILON) {
      return {
        valid: false,
        transactionId: transaction.id,
        symbol: transaction.symbol,
        message: `The ${transaction.type.toLowerCase()} transaction for ${transaction.symbol} exceeds the available quantity on ${transaction.tradeDate}. Available: ${currentQuantity.toFixed(4)}.`,
      };
    }

    quantities.set(
      transaction.symbol,
      Math.max(0, currentQuantity - transaction.quantity),
    );
  }

  return {
    valid: true,
    message: "",
  };
}

export function writePortfolioTransactions(transactions) {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const input = Array.isArray(transactions)
      ? transactions
      : [];

    const validation = validatePortfolioTransactions(input);

    if (!validation.valid) {
      console.error(
        "Unable to save invalid portfolio transaction ledger:",
        validation.message,
      );
      return false;
    }

    const normalized = input
      .map(normalizePortfolioTransaction)
      .filter(Boolean);

    window.localStorage.setItem(
      PORTFOLIO_TRANSACTION_STORAGE_KEY,
      JSON.stringify(normalized),
    );

    window.localStorage.setItem(
      PORTFOLIO_MIGRATION_KEY,
      "complete",
    );

    window.dispatchEvent(
      new CustomEvent(PORTFOLIO_UPDATED_EVENT, {
        detail: normalized,
      }),
    );

    return true;
  } catch (error) {
    console.error("Unable to save portfolio transactions:", error);
    return false;
  }
}

export function buildPortfolioPositions(transactions) {
  const normalized = (Array.isArray(transactions) ? transactions : [])
    .map(normalizePortfolioTransaction)
    .filter(Boolean)
    .sort((first, second) =>
      transactionSortValue(first).localeCompare(
        transactionSortValue(second),
      ),
    );

  const positions = new Map();

  for (const transaction of normalized) {
    const current = positions.get(transaction.symbol) || {
      symbol: transaction.symbol,
      name: transaction.name,
      sector: transaction.sector,
      logoDomain: transaction.logoDomain,
      quantity: 0,
      averagePrice: 0,
      realizedProfitLoss: 0,
      totalBuyQuantity: 0,
      totalSellQuantity: 0,
      transactionCount: 0,
      firstTradeDate: transaction.tradeDate,
      lastTradeDate: transaction.tradeDate,
      notes: "",
    };

    current.name = transaction.name || current.name;
    current.sector = transaction.sector || current.sector;
    current.logoDomain =
      transaction.logoDomain || current.logoDomain;
    current.transactionCount += 1;
    current.lastTradeDate = transaction.tradeDate;
    current.notes = transaction.notes || current.notes;

    if (transaction.type === "BUY") {
      const existingCost = current.quantity * current.averagePrice;
      const addedCost =
        transaction.quantity * transaction.price +
        transaction.charges;
      const nextQuantity = current.quantity + transaction.quantity;

      current.quantity = nextQuantity;
      current.averagePrice =
        nextQuantity > EPSILON
          ? (existingCost + addedCost) / nextQuantity
          : 0;
      current.totalBuyQuantity += transaction.quantity;
    } else {
      const sellQuantity = Math.min(
        transaction.quantity,
        current.quantity,
      );
      const proceeds =
        sellQuantity * transaction.price - transaction.charges;
      const costBasis = sellQuantity * current.averagePrice;

      current.realizedProfitLoss += proceeds - costBasis;
      current.quantity = Math.max(
        0,
        current.quantity - sellQuantity,
      );
      current.totalSellQuantity += sellQuantity;

      if (current.quantity <= EPSILON) {
        current.quantity = 0;
        current.averagePrice = 0;
      }
    }

    positions.set(transaction.symbol, current);
  }

  return [...positions.values()].sort((first, second) =>
    first.name.localeCompare(second.name, "en-IN", {
      sensitivity: "base",
    }),
  );
}