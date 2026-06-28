import {
  getMarketAlerts,
  getWatchlistQuotes,
} from "./dashboardApi";

import {
  getSavedWatchlistSymbols,
} from "../utils/dashboardStorage";

import {
  buildPortfolioPositions,
  readPortfolioTransactions,
} from "../utils/portfolioStorage";

import {
  writeAlertCenterCache,
} from "../utils/alertStorage";

import {
  applyCustomAlertEvaluations,
  formatCustomAlertRule,
  formatCustomAlertTarget,
  getCustomAlertCondition,
  readCustomAlertRules,
} from "../utils/customAlertRules";

const MAX_PERSONALIZED_SYMBOLS = 25;
const MAX_ALERTS = 120;
const MAX_CUSTOM_RULE_SYMBOLS = 20;

const SEVERITY_RANK = {
  critical: 4,
  high: 3,
  moderate: 2,
  information: 1,
};

function cleanText(value) {
  return String(value ?? "").trim();
}

function safeNumber(value, fallback = null) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function normalizeSymbol(value) {
  return cleanText(value).toUpperCase();
}

function normalizeSeverity(value, alert = {}) {
  const severity = cleanText(value).toLowerCase();

  if (
    severity === "critical" ||
    severity === "high" ||
    severity === "moderate" ||
    severity === "information"
  ) {
    return severity;
  }

  if (severity === "danger") {
    const text = `${alert?.type || ""} ${alert?.title || ""}`
      .toLowerCase();

    return text.includes("vix") || text.includes("risk")
      ? "critical"
      : "high";
  }

  if (severity === "warning") {
    return "moderate";
  }

  return "information";
}

function inferCategory(alert) {
  const text = `${alert?.category || ""} ${alert?.type || ""} ${
    alert?.title || ""
  }`.toLowerCase();

  if (text.includes("portfolio")) {
    return "portfolio";
  }

  if (text.includes("watchlist")) {
    return "watchlist";
  }

  if (text.includes("volume")) {
    return "volume";
  }

  if (
    text.includes("rsi") ||
    text.includes("momentum") ||
    text.includes("trend")
  ) {
    return "technical";
  }

  if (
    text.includes("risk") ||
    text.includes("vix") ||
    text.includes("breadth")
  ) {
    return "risk";
  }

  if (text.includes("sector")) {
    return "sector";
  }

  return "market";
}

function normalizeMarketAlert(alert, fetchedAt) {
  const type = cleanText(alert?.type) || "market-alert";
  const symbol = normalizeSymbol(alert?.symbol || alert?.ticker);
  const id =
    cleanText(alert?.id) ||
    `${type}-${symbol || cleanText(alert?.title) || "item"}`;

  return {
    id,
    type,
    category: inferCategory(alert),
    severity: normalizeSeverity(alert?.severity, alert),
    title: cleanText(alert?.title) || "Market alert",
    message:
      cleanText(alert?.message || alert?.description) ||
      "New market activity has been detected.",
    symbol,
    time: cleanText(alert?.time),
    occurredAt: cleanText(alert?.occurredAt) || fetchedAt || null,
    fetchedAt: fetchedAt || null,
    source: "Live Indian market activity",
    personalized: false,
  };
}

function createPersonalizedAlert({
  id,
  type,
  category,
  severity,
  title,
  message,
  symbol,
  fetchedAt,
  source,
  metrics = {},
}) {
  return {
    id,
    type,
    category,
    severity,
    title,
    message,
    symbol: normalizeSymbol(symbol),
    time: "Latest session",
    occurredAt: fetchedAt || new Date().toISOString(),
    fetchedAt: fetchedAt || new Date().toISOString(),
    source,
    personalized: true,
    metrics,
  };
}

function splitIntoChunks(values, size) {
  const chunks = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}

async function readJson(response) {
  const text = await response.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}

export async function searchAlertRuleStocks(
  query,
  { signal } = {},
) {
  const cleanedQuery = cleanText(query);

  if (cleanedQuery.length < 2) {
    return [];
  }

  const parameters = new URLSearchParams({
    q: cleanedQuery,
  });

  const response = await fetch(
    `/api/stock-search?${parameters}`,
    {
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  const data = await readJson(response);

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        "Unable to search Indian stocks.",
    );
  }

  return (Array.isArray(data) ? data : [])
    .filter((stock) => stock?.symbol)
    .slice(0, 8);
}

async function fetchScreenerChunk(symbols, signal) {
  if (symbols.length === 0) {
    return [];
  }

  if (symbols.length === 1) {
    const requested = symbols[0];
    const baseSymbol = requested.replace(/\.(NS|BO)$/i, "");
    const parameters = new URLSearchParams({
      q: baseSymbol,
      page: "1",
      limit: "20",
      sort: "marketCap-desc",
    });

    const response = await fetch(`/api/screener?${parameters}`, {
      headers: {
        Accept: "application/json",
      },
      signal,
    });

    const data = await readJson(response);
    const stocks = Array.isArray(data?.stocks) ? data.stocks : [];

    const exact = stocks.find((stock) => {
      const values = [
        stock?.symbol,
        stock?.yahooSymbol,
        stock?.nseSymbol,
        stock?.nseSymbol ? `${stock.nseSymbol}.NS` : "",
      ]
        .map(normalizeSymbol)
        .filter(Boolean);

      return values.includes(requested);
    });

    return exact ? [exact] : [];
  }

  const parameters = new URLSearchParams({
    symbols: symbols.join(","),
  });

  const response = await fetch(`/api/screener?${parameters}`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  const data = await readJson(response);

  return Array.isArray(data?.stocks) ? data.stocks : [];
}

async function fetchScreenerStocks(symbols, signal) {
  const chunks = splitIntoChunks(symbols, 5);
  const results = await Promise.allSettled(
    chunks.map((chunk) => fetchScreenerChunk(chunk, signal)),
  );

  const stocks = [];
  const seen = new Set();

  results.forEach((result) => {
    if (result.status !== "fulfilled") {
      if (result.reason?.name !== "AbortError") {
        console.warn("Personalized Screener data unavailable:", result.reason);
      }
      return;
    }

    result.value.forEach((stock) => {
      const symbol = normalizeSymbol(
        stock?.symbol || stock?.yahooSymbol || stock?.nseSymbol,
      );

      if (!symbol || seen.has(symbol)) {
        return;
      }

      seen.add(symbol);
      stocks.push(stock);
    });
  });

  return stocks;
}

function getPortfolioPositions() {
  try {
    return buildPortfolioPositions(readPortfolioTransactions()).filter(
      (position) => safeNumber(position?.quantity, 0) > 0,
    );
  } catch (error) {
    console.warn("Unable to read portfolio positions for alerts:", error);
    return [];
  }
}

function derivePriceAlerts({
  quotes,
  watchlistSet,
  portfolioMap,
  fetchedAt,
}) {
  const alerts = [];

  quotes.forEach((quote) => {
    const symbol = normalizeSymbol(quote?.symbol);
    const changePercent = safeNumber(quote?.changePercent, 0);
    const price = safeNumber(quote?.price);
    const inPortfolio = portfolioMap.has(symbol);
    const inWatchlist = watchlistSet.has(symbol);

    if (!symbol || (!inPortfolio && !inWatchlist)) {
      return;
    }

    if (Math.abs(changePercent) >= 2.5) {
      const scope = inPortfolio ? "Portfolio" : "Watchlist";
      const category = inPortfolio ? "portfolio" : "watchlist";
      const severity =
        Math.abs(changePercent) >= 6
          ? "critical"
          : Math.abs(changePercent) >= 4
            ? "high"
            : "moderate";

      alerts.push(
        createPersonalizedAlert({
          id: `${category}-price-${symbol}`,
          type: "price-move",
          category,
          severity,
          title: `${scope} price movement`,
          message: `${quote?.name || symbol} moved ${
            changePercent >= 0 ? "+" : ""
          }${changePercent.toFixed(2)}% in the latest session${
            price === null ? "." : ` and is trading near ₹${price.toLocaleString("en-IN")}.`
          }`,
          symbol,
          fetchedAt,
          source: `${scope} monitoring`,
          metrics: {
            changePercent,
            price,
          },
        }),
      );
    }

    if (inPortfolio && price !== null) {
      const position = portfolioMap.get(symbol);
      const averagePrice = safeNumber(position?.averagePrice);

      if (averagePrice && averagePrice > 0) {
        const returnPercent = ((price - averagePrice) / averagePrice) * 100;

        if (returnPercent >= 15 || returnPercent <= -10) {
          alerts.push(
            createPersonalizedAlert({
              id: `portfolio-return-${symbol}`,
              type: "portfolio-return",
              category: "portfolio",
              severity:
                Math.abs(returnPercent) >= 25 ? "high" : "moderate",
              title:
                returnPercent >= 0
                  ? "Portfolio gain milestone"
                  : "Portfolio drawdown alert",
              message: `${position?.name || quote?.name || symbol} is ${
                returnPercent >= 0 ? "up" : "down"
              } ${Math.abs(returnPercent).toFixed(
                1,
              )}% from your weighted average price.`,
              symbol,
              fetchedAt,
              source: "Portfolio monitoring",
              metrics: {
                returnPercent,
                price,
                averagePrice,
              },
            }),
          );
        }
      }
    }
  });

  return alerts;
}

function deriveScreenerAlerts({
  stocks,
  watchlistSet,
  portfolioMap,
  fetchedAt,
}) {
  const alerts = [];

  stocks.forEach((stock) => {
    const symbol = normalizeSymbol(
      stock?.symbol || stock?.yahooSymbol || stock?.nseSymbol,
    );

    const inPortfolio = portfolioMap.has(symbol);
    const inWatchlist = watchlistSet.has(symbol);

    if (!symbol || (!inPortfolio && !inWatchlist)) {
      return;
    }

    const category = inPortfolio ? "portfolio" : "watchlist";
    const scope = inPortfolio ? "Portfolio" : "Watchlist";
    const name = cleanText(stock?.name) || symbol;
    const rsi = safeNumber(stock?.rsi);
    const distanceFromHigh = safeNumber(stock?.distanceFrom52WeekHigh);
    const price = safeNumber(stock?.price);
    const week52Low = safeNumber(
      stock?.week52Low || stock?.fiftyTwoWeekLow,
    );
    const volume = safeNumber(stock?.volume);
    const averageVolume = safeNumber(stock?.averageVolume);

    if (rsi !== null && (rsi >= 70 || rsi <= 30)) {
      alerts.push(
        createPersonalizedAlert({
          id: `${category}-rsi-${symbol}-${rsi >= 70 ? "high" : "low"}`,
          type: "rsi",
          category: "technical",
          severity: rsi >= 80 || rsi <= 20 ? "high" : "moderate",
          title: rsi >= 70 ? "RSI overbought condition" : "RSI oversold condition",
          message: `${name} has an RSI of ${rsi.toFixed(
            1,
          )}. It is part of your ${scope.toLowerCase()}.`,
          symbol,
          fetchedAt,
          source: `${scope} technical monitoring`,
          metrics: {
            rsi,
          },
        }),
      );
    }

    if (distanceFromHigh !== null && distanceFromHigh <= 3) {
      alerts.push(
        createPersonalizedAlert({
          id: `${category}-52w-high-${symbol}`,
          type: "52-week-high",
          category,
          severity: distanceFromHigh <= 1 ? "high" : "information",
          title: "Near 52-week high",
          message: `${name} is approximately ${Math.max(
            0,
            distanceFromHigh,
          ).toFixed(1)}% below its 52-week high.`,
          symbol,
          fetchedAt,
          source: `${scope} range monitoring`,
          metrics: {
            distanceFromHigh,
          },
        }),
      );
    }

    if (price !== null && week52Low !== null && week52Low > 0) {
      const distanceFromLow = ((price - week52Low) / week52Low) * 100;

      if (distanceFromLow <= 5) {
        alerts.push(
          createPersonalizedAlert({
            id: `${category}-52w-low-${symbol}`,
            type: "52-week-low",
            category,
            severity: distanceFromLow <= 2 ? "high" : "moderate",
            title: "Near 52-week low",
            message: `${name} is approximately ${Math.max(
              0,
              distanceFromLow,
            ).toFixed(1)}% above its 52-week low.`,
            symbol,
            fetchedAt,
            source: `${scope} range monitoring`,
            metrics: {
              distanceFromLow,
            },
          }),
        );
      }
    }

    if (volume && averageVolume && averageVolume > 0) {
      const volumeRatio = volume / averageVolume;

      if (volumeRatio >= 1.5) {
        alerts.push(
          createPersonalizedAlert({
            id: `${category}-volume-${symbol}`,
            type: "volume",
            category: "volume",
            severity: volumeRatio >= 2.5 ? "high" : "moderate",
            title: "Unusual trading volume",
            message: `${name} volume is ${volumeRatio.toFixed(
              1,
            )}× its recent average.`,
            symbol,
            fetchedAt,
            source: `${scope} volume monitoring`,
            metrics: {
              volumeRatio,
            },
          }),
        );
      }
    }
  });

  return alerts;
}

function calculateRsi(chart, period = 14) {
  const closes = (Array.isArray(chart) ? chart : [])
    .map((item) => safeNumber(item?.close))
    .filter((value) => value !== null);

  if (closes.length <= period) {
    return null;
  }

  const recent = closes.slice(-(period + 1));
  let gains = 0;
  let losses = 0;

  for (let index = 1; index < recent.length; index += 1) {
    const change = recent[index] - recent[index - 1];

    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  const averageGain = gains / period;
  const averageLoss = losses / period;

  if (averageLoss === 0) {
    return averageGain === 0 ? 50 : 100;
  }

  const relativeStrength = averageGain / averageLoss;
  return 100 - 100 / (1 + relativeStrength);
}

async function fetchCustomRuleStockData(symbol, signal) {
  const parameters = new URLSearchParams({
    symbol,
    range: "1m",
  });

  const response = await fetch(
    `/api/stock-data?${parameters}`,
    {
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  const data = await readJson(response);

  if (!response.ok || !data?.symbol) {
    throw new Error(
      data?.error?.message ||
        `Unable to evaluate ${symbol}.`,
    );
  }

  const price = safeNumber(data.price);
  const week52High = safeNumber(
    data.week52High ?? data.fiftyTwoWeekHigh,
  );
  const week52Low = safeNumber(
    data.week52Low ?? data.fiftyTwoWeekLow,
  );
  const volume = safeNumber(data.volume);
  const averageVolume = safeNumber(data.averageVolume);

  return {
    ...data,
    symbol: normalizeSymbol(data.symbol || symbol),
    price,
    changePercent: safeNumber(data.changePercent),
    rsi: calculateRsi(data.chart),
    volumeRatio:
      volume !== null &&
      averageVolume !== null &&
      averageVolume > 0
        ? volume / averageVolume
        : null,
    distanceFrom52WeekHigh:
      price !== null && week52High !== null && week52High > 0
        ? Math.max(0, ((week52High - price) / week52High) * 100)
        : null,
    distanceFrom52WeekLow:
      price !== null && week52Low !== null && week52Low > 0
        ? Math.max(0, ((price - week52Low) / week52Low) * 100)
        : null,
    week52High,
    week52Low,
  };
}

function evaluateCustomRule(rule, stock) {
  const target = safeNumber(rule?.targetValue);

  if (target === null) {
    return { triggered: false, value: null };
  }

  const values = {
    price_above: safeNumber(stock?.price),
    price_below: safeNumber(stock?.price),
    change_above: safeNumber(stock?.changePercent),
    change_below: safeNumber(stock?.changePercent),
    rsi_above: safeNumber(stock?.rsi),
    rsi_below: safeNumber(stock?.rsi),
    volume_spike: safeNumber(stock?.volumeRatio),
    near_52w_high: safeNumber(stock?.distanceFrom52WeekHigh),
    near_52w_low: safeNumber(stock?.distanceFrom52WeekLow),
  };

  const value = values[rule?.condition] ?? null;

  if (value === null) {
    return { triggered: false, value: null };
  }

  const triggeredByCondition = {
    price_above: value >= target,
    price_below: value <= target,
    change_above: value >= target,
    change_below: value <= target,
    rsi_above: value >= target,
    rsi_below: value <= target,
    volume_spike: value >= target,
    near_52w_high: value <= target,
    near_52w_low: value <= target,
  };

  return {
    triggered: Boolean(triggeredByCondition[rule?.condition]),
    value,
  };
}

function formatRuleCurrentValue(rule, metrics = {}) {
  const value = safeNumber(metrics.currentValue ?? rule?.lastValue);

  if (value === null) {
    return "latest available data";
  }

  const condition = getCustomAlertCondition(rule?.condition);

  if (condition.category === "price") {
    return `₹${value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    })}`;
  }

  if (condition.value === "volume_spike") {
    return `${value.toFixed(1)}× average volume`;
  }

  if (condition.category === "change" || condition.category === "range") {
    return `${value.toFixed(1)}%`;
  }

  return value.toFixed(1);
}

function getCustomRuleSeverity(rule, value) {
  const condition = rule?.condition;
  const numericValue = Math.abs(safeNumber(value, 0));

  if (condition === "change_above" || condition === "change_below") {
    return numericValue >= 7 ? "critical" : numericValue >= 4 ? "high" : "moderate";
  }

  if (condition === "rsi_above" || condition === "rsi_below") {
    return numericValue >= 80 || numericValue <= 20 ? "high" : "moderate";
  }

  if (condition === "volume_spike") {
    return numericValue >= 3 ? "high" : "moderate";
  }

  return "moderate";
}

function createCustomRuleAlert(rule, fetchedAt) {
  const condition = getCustomAlertCondition(rule?.condition);
  const metrics = rule?.lastMetrics || {};
  const currentValue = formatRuleCurrentValue(rule, metrics);

  return createPersonalizedAlert({
    id: `custom-rule-${rule.id}-${Math.max(1, safeNumber(rule.triggerCount, 1))}`,
    type: "custom-rule",
    category:
      condition.category === "technical"
        ? "technical"
        : condition.category === "volume"
          ? "volume"
          : "custom",
    severity: getCustomRuleSeverity(rule, rule.lastValue),
    title: `${rule.companyName || rule.symbol} custom alert triggered`,
    message: `${formatCustomAlertRule(rule)}. The latest measured value is ${currentValue}.`,
    symbol: rule.symbol,
    fetchedAt:
      rule.lastTriggeredAt ||
      fetchedAt ||
      new Date().toISOString(),
    source: "Custom alert rule",
    metrics: {
      ...metrics,
      ruleId: rule.id,
      targetValue: rule.targetValue,
      currentValue: rule.lastValue,
      condition: rule.condition,
      targetLabel: formatCustomAlertTarget(rule),
    },
  });
}

async function evaluateCustomAlertRules(signal) {
  const rules = readCustomAlertRules();
  const triggeredRules = rules.filter(
    (rule) => rule.status === "triggered",
  );
  const activeRules = rules.filter(
    (rule) => rule.status === "active",
  );

  const symbols = [
    ...new Set(activeRules.map((rule) => rule.symbol)),
  ].slice(0, MAX_CUSTOM_RULE_SYMBOLS);

  const results = await Promise.allSettled(
    symbols.map((symbol) =>
      fetchCustomRuleStockData(symbol, signal),
    ),
  );

  const stockMap = new Map();
  let failedSymbols = 0;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      stockMap.set(symbols[index], result.value);
    } else if (result.reason?.name !== "AbortError") {
      failedSymbols += 1;
      console.warn(
        `Unable to evaluate custom alert for ${symbols[index]}:`,
        result.reason,
      );
    }
  });

  const now = new Date().toISOString();
  const evaluations = [];
  const newlyTriggered = [];

  activeRules.forEach((rule) => {
    const stock = stockMap.get(rule.symbol);

    if (!stock) {
      return;
    }

    const evaluation = evaluateCustomRule(rule, stock);
    const lastMetrics = {
      price: safeNumber(stock.price),
      changePercent: safeNumber(stock.changePercent),
      rsi: safeNumber(stock.rsi),
      volumeRatio: safeNumber(stock.volumeRatio),
      distanceFrom52WeekHigh: safeNumber(stock.distanceFrom52WeekHigh),
      distanceFrom52WeekLow: safeNumber(stock.distanceFrom52WeekLow),
      marketState: cleanText(stock.marketState),
      currentValue: evaluation.value,
    };

    const nextRule = {
      id: rule.id,
      lastEvaluatedAt: now,
      lastValue: evaluation.value,
      lastMetrics,
    };

    if (evaluation.triggered) {
      nextRule.status = "triggered";
      nextRule.lastTriggeredAt = now;
      nextRule.triggerCount = safeNumber(rule.triggerCount, 0) + 1;
      newlyTriggered.push({
        ...rule,
        ...nextRule,
      });
    }

    evaluations.push(nextRule);
  });

  const updatedRules = applyCustomAlertEvaluations(evaluations);
  const triggeredById = new Map(
    [...triggeredRules, ...newlyTriggered].map((rule) => [
      rule.id,
      updatedRules.find((item) => item.id === rule.id) || rule,
    ]),
  );

  return {
    alerts: [...triggeredById.values()].map((rule) =>
      createCustomRuleAlert(rule, now),
    ),
    rules: updatedRules,
    activeCount: updatedRules.filter((rule) => rule.status === "active").length,
    pausedCount: updatedRules.filter((rule) => rule.status === "paused").length,
    triggeredCount: updatedRules.filter((rule) => rule.status === "triggered").length,
    failedSymbols,
  };
}

function dedupeAndSortAlerts(alerts) {
  const byId = new Map();

  alerts.forEach((alert) => {
    if (!alert?.id) {
      return;
    }

    const existing = byId.get(alert.id);

    if (
      !existing ||
      (SEVERITY_RANK[alert.severity] || 0) >
        (SEVERITY_RANK[existing.severity] || 0)
    ) {
      byId.set(alert.id, alert);
    }
  });

  return [...byId.values()]
    .sort((first, second) => {
      const severityDifference =
        (SEVERITY_RANK[second.severity] || 0) -
        (SEVERITY_RANK[first.severity] || 0);

      if (severityDifference !== 0) {
        return severityDifference;
      }

      if (first.personalized !== second.personalized) {
        return first.personalized ? -1 : 1;
      }

      return first.title.localeCompare(second.title, "en-IN", {
        sensitivity: "base",
      });
    })
    .slice(0, MAX_ALERTS);
}

export async function loadAlertCenterData({
  refresh = false,
  signal,
} = {}) {
  const watchlistSymbols = getSavedWatchlistSymbols();
  const positions = getPortfolioPositions();
  const portfolioMap = new Map(
    positions.map((position) => [
      normalizeSymbol(position.symbol),
      position,
    ]),
  );
  const watchlistSet = new Set(watchlistSymbols.map(normalizeSymbol));

  const personalizedSymbols = [
    ...new Set([
      ...watchlistSet,
      ...portfolioMap.keys(),
    ]),
  ].slice(0, MAX_PERSONALIZED_SYMBOLS);

  const [
    marketResult,
    quoteResult,
    screenerResult,
    customRulesResult,
  ] = await Promise.allSettled([
    getMarketAlerts({
      refresh,
      limit: 30,
      signal,
    }),
    getWatchlistQuotes({
      symbols: personalizedSymbols,
      refresh,
      signal,
    }),
    fetchScreenerStocks(personalizedSymbols, signal),
    evaluateCustomAlertRules(signal),
  ]);

  if (
    marketResult.status === "rejected" &&
    quoteResult.status === "rejected" &&
    screenerResult.status === "rejected" &&
    customRulesResult.status === "rejected"
  ) {
    const error =
      marketResult.reason ||
      quoteResult.reason ||
      screenerResult.reason ||
      customRulesResult.reason;

    throw error instanceof Error
      ? error
      : new Error("Unable to load alert-center data.");
  }

  const marketData =
    marketResult.status === "fulfilled"
      ? marketResult.value
      : {
          alerts: [],
          fetchedAt: new Date().toISOString(),
          source: "",
        };

  const quoteData =
    quoteResult.status === "fulfilled"
      ? quoteResult.value
      : {
          quotes: [],
          fetchedAt: marketData.fetchedAt,
        };

  const screenerStocks =
    screenerResult.status === "fulfilled"
      ? screenerResult.value
      : [];

  const customRulesData =
    customRulesResult.status === "fulfilled"
      ? customRulesResult.value
      : {
          alerts: [],
          rules: readCustomAlertRules(),
          activeCount: 0,
          pausedCount: 0,
          triggeredCount: 0,
          failedSymbols: 0,
        };

  const fetchedAt =
    marketData.fetchedAt ||
    quoteData.fetchedAt ||
    new Date().toISOString();

  const marketAlerts = (Array.isArray(marketData.alerts)
    ? marketData.alerts
    : []
  ).map((alert) => normalizeMarketAlert(alert, fetchedAt));

  const personalizedAlerts = [
    ...derivePriceAlerts({
      quotes: Array.isArray(quoteData.quotes) ? quoteData.quotes : [],
      watchlistSet,
      portfolioMap,
      fetchedAt,
    }),
    ...deriveScreenerAlerts({
      stocks: screenerStocks,
      watchlistSet,
      portfolioMap,
      fetchedAt,
    }),
  ];

  const customRuleAlerts = Array.isArray(customRulesData.alerts)
    ? customRulesData.alerts
    : [];

  const alerts = dedupeAndSortAlerts([
    ...customRuleAlerts,
    ...personalizedAlerts,
    ...marketAlerts,
  ]);

  const sourceParts = [
    marketResult.status === "fulfilled" ? "live market alerts" : "",
    quoteResult.status === "fulfilled" ? "watchlist quotes" : "",
    screenerResult.status === "fulfilled" ? "screener snapshot" : "",
    customRulesData.rules?.length ? "custom rules" : "",
  ].filter(Boolean);

  const source =
    sourceParts.length > 0
      ? sourceParts.join(" + ")
      : "EXA alert center";

  writeAlertCenterCache({
    alerts,
    fetchedAt,
    source,
  });

  return {
    alerts,
    fetchedAt,
    source,
    cached: Boolean(marketData.cached),
    watchlistCount: watchlistSet.size,
    portfolioCount: portfolioMap.size,
    personalizedCount:
      personalizedAlerts.length + customRuleAlerts.length,
    customRuleCount: customRulesData.rules?.length || 0,
    customRuleActiveCount: customRulesData.activeCount || 0,
    customRulePausedCount: customRulesData.pausedCount || 0,
    customRuleTriggeredCount: customRulesData.triggeredCount || 0,
    unavailableSymbols: Array.isArray(quoteData.unavailableSymbols)
      ? quoteData.unavailableSymbols
      : [],
    partialFailure:
      marketResult.status === "rejected" ||
      quoteResult.status === "rejected" ||
      screenerResult.status === "rejected" ||
      customRulesResult.status === "rejected" ||
      customRulesData.failedSymbols > 0,
  };
}