const PORTFOLIO_STORAGE_KEY =
  "exa-portfolio-holdings-v1";

export const PORTFOLIO_UPDATED_EVENT =
  "exa:portfolio-updated";

function cleanText(value) {
  return String(value ?? "").trim();
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

function createHoldingId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `holding-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`;
}

export function normalizePortfolioHolding(
  holding,
) {
  if (
    !holding ||
    typeof holding !== "object"
  ) {
    return null;
  }

  const symbol = cleanText(
    holding.symbol,
  ).toUpperCase();

  const quantity = safePositiveNumber(
    holding.quantity,
  );

  const averagePrice =
    safeNonNegativeNumber(
      holding.averagePrice,
    );

  if (
    !symbol ||
    quantity === null ||
    averagePrice === null
  ) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id:
      cleanText(holding.id) ||
      createHoldingId(),

    symbol,

    name:
      cleanText(holding.name) ||
      symbol,

    sector:
      cleanText(holding.sector) ||
      "Sector unavailable",

    logoDomain:
      cleanText(
        holding.logoDomain,
      ),

    quantity,

    averagePrice,

    notes:
      cleanText(holding.notes)
        .slice(0, 240),

    createdAt:
      cleanText(
        holding.createdAt,
      ) || now,

    updatedAt:
      cleanText(
        holding.updatedAt,
      ) || now,
  };
}

export function readPortfolioHoldings() {
  if (
    typeof window === "undefined"
  ) {
    return [];
  }

  try {
    const rawValue =
      window.localStorage.getItem(
        PORTFOLIO_STORAGE_KEY,
      );

    if (!rawValue) {
      return [];
    }

    const parsed =
      JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const seenIds = new Set();

    return parsed
      .map(
        normalizePortfolioHolding,
      )
      .filter((holding) => {
        if (
          !holding ||
          seenIds.has(holding.id)
        ) {
          return false;
        }

        seenIds.add(holding.id);
        return true;
      })
      .slice(0, 100);
  } catch (error) {
    console.error(
      "Unable to read portfolio holdings:",
      error,
    );

    return [];
  }
}

export function writePortfolioHoldings(
  holdings,
) {
  if (
    typeof window === "undefined"
  ) {
    return false;
  }

  try {
    const normalized = (
      Array.isArray(holdings)
        ? holdings
        : []
    )
      .map(
        normalizePortfolioHolding,
      )
      .filter(Boolean)
      .slice(0, 100);

    window.localStorage.setItem(
      PORTFOLIO_STORAGE_KEY,
      JSON.stringify(normalized),
    );

    window.dispatchEvent(
      new CustomEvent(
        PORTFOLIO_UPDATED_EVENT,
        {
          detail: normalized,
        },
      ),
    );

    return true;
  } catch (error) {
    console.error(
      "Unable to save portfolio holdings:",
      error,
    );

    return false;
  }
}