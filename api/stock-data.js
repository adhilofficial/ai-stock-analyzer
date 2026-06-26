import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const RANGE_MAP = {
  "1d": {
    days: 5,
    interval: "5m",
  },
  "1w": {
    days: 14,
    interval: "30m",
  },
  "1m": {
    days: 35,
    interval: "1d",
  },
  "1y": {
    days: 370,
    interval: "1d",
  },
  "5y": {
    days: 365 * 5 + 10,
    interval: "1wk",
  },
  max: {
    days: 365 * 20,
    interval: "1mo",
  },
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const symbol =
      typeof req.query.symbol === "string"
        ? req.query.symbol.trim().toUpperCase()
        : "";

    const requestedRange =
      typeof req.query.range === "string"
        ? req.query.range.toLowerCase()
        : "1y";

    if (!symbol) {
      return res.status(400).json({
        error: "Stock symbol is required",
      });
    }

    const rangeConfig = RANGE_MAP[requestedRange] || RANGE_MAP["1y"];

    const period1 = new Date(
      Date.now() - rangeConfig.days * DAY_IN_MS
    );

    console.log("Fetching stock data:", {
      symbol,
      requestedRange,
      period1,
      interval: rangeConfig.interval,
    });

    const [quote, chartResult] = await Promise.all([
      yahooFinance.quote(symbol),

      yahooFinance.chart(symbol, {
        period1,
        period2: new Date(),
        interval: rangeConfig.interval,
        return: "array",
      }),
    ]);

    const chart = (chartResult?.quotes || [])
      .filter((item) => {
        return item.date && item.close !== null && item.close !== undefined;
      })
      .map((item) => ({
        date: item.date,
        open: item.open ?? null,
        high: item.high ?? null,
        low: item.low ?? null,
        close: item.close ?? null,
        volume: item.volume ?? null,
      }));

    if (!quote) {
      return res.status(404).json({
        error: `No stock information found for ${symbol}`,
      });
    }

    return res.status(200).json({
      symbol: quote.symbol || symbol,

      company:
        quote.longName ||
        quote.shortName ||
        quote.displayName ||
        symbol,

      currency: quote.currency || "INR",

      exchange:
        quote.fullExchangeName ||
        quote.exchange ||
        null,

      price: quote.regularMarketPrice ?? null,

      changeAbs: quote.regularMarketChange ?? null,

      changePercent:
        quote.regularMarketChangePercent ?? null,

      previousClose:
        quote.regularMarketPreviousClose ?? null,

      open: quote.regularMarketOpen ?? null,

      dayHigh: quote.regularMarketDayHigh ?? null,

      dayLow: quote.regularMarketDayLow ?? null,

      marketCap: quote.marketCap ?? null,

      peRatio: quote.trailingPE ?? null,

      forwardPE: quote.forwardPE ?? null,

      week52Low: quote.fiftyTwoWeekLow ?? null,

      week52High: quote.fiftyTwoWeekHigh ?? null,

      volume: quote.regularMarketVolume ?? null,

      averageVolume:
        quote.averageDailyVolume3Month ?? null,

      chart,

      range: requestedRange,

      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("STOCK DATA API ERROR");
    console.error(error);

    return res.status(500).json({
      error: "Failed to fetch stock data",
      details:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}