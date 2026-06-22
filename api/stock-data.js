let yahooFinancePromise;

async function getYahooFinance() {
  if (!yahooFinancePromise) {
    yahooFinancePromise = import("yahoo-finance2").then(
      ({ default: YahooFinance }) => new YahooFinance(),
    );
  }

  return yahooFinancePromise;
}

function getQueryValue(value) {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function daysAgo(days) {
  return new Date(
    Date.now() - days * 24 * 60 * 60 * 1000,
  );
}

function getChartOptions(range = "1y") {
  const now = new Date();

  const options = {
    "1d": {
      period1: daysAgo(5),
      period2: now,
      interval: "5m",
    },

    "1w": {
      period1: daysAgo(10),
      period2: now,
      interval: "30m",
    },

    "1m": {
      period1: daysAgo(35),
      period2: now,
      interval: "1d",
    },

    "1y": {
      period1: daysAgo(370),
      period2: now,
      interval: "1d",
    },

    "5y": {
      period1: daysAgo(365 * 5 + 10),
      period2: now,
      interval: "1wk",
    },

    max: {
      period1: new Date("1980-01-01"),
      period2: now,
      interval: "1mo",
    },
  };

  return options[range] || options["1y"];
}

function getDomain(url) {
  if (!url) {
    return "";
  }

  try {
    const completeUrl = url.startsWith("http")
      ? url
      : `https://${url}`;

    return new URL(completeUrl).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  try {
    const symbol = String(
      getQueryValue(req.query?.symbol),
    )
      .trim()
      .toUpperCase();

    const range = String(
      getQueryValue(req.query?.range) || "1y",
    ).toLowerCase();

    if (!symbol) {
      return res.status(400).json({
        error: "Stock symbol is required.",
      });
    }

    const yahooFinance = await getYahooFinance();

    const quote = await yahooFinance.quote(symbol);

    if (!quote) {
      return res.status(404).json({
        error: "Yahoo Finance did not return stock data.",
      });
    }

    const [profileResult, chartResult] =
      await Promise.allSettled([
        yahooFinance.quoteSummary(symbol, {
          modules: ["assetProfile"],
        }),

        yahooFinance.chart(
          symbol,
          getChartOptions(range),
        ),
      ]);

    const profile =
      profileResult.status === "fulfilled"
        ? profileResult.value?.assetProfile || {}
        : {};

    if (profileResult.status === "rejected") {
      console.warn(
        "Profile request failed:",
        profileResult.reason,
      );
    }

    const chart =
      chartResult.status === "fulfilled"
        ? (chartResult.value?.quotes || [])
            .filter(
              (item) =>
                item?.date &&
                item?.close !== null &&
                item?.close !== undefined,
            )
            .map((item) => ({
              date:
                item.date instanceof Date
                  ? item.date.toISOString()
                  : String(item.date),

              open: item.open ?? null,
              high: item.high ?? null,
              low: item.low ?? null,
              close: item.close ?? null,
              volume: item.volume ?? null,
            }))
        : [];

    if (chartResult.status === "rejected") {
      console.warn(
        "Chart request failed:",
        chartResult.reason,
      );
    }

    const website =
      profile.website ||
      profile.irWebsite ||
      "";

    const stock = {
      symbol:
        quote.symbol ||
        symbol,

      name:
        quote.longName ||
        quote.shortName ||
        quote.symbol ||
        symbol,

      exchange:
        quote.fullExchangeName ||
        quote.exchange ||
        null,

      currency:
        quote.currency ||
        "INR",

      marketState:
        quote.marketState ||
        null,

      price:
        quote.regularMarketPrice ??
        null,

      previousClose:
        quote.regularMarketPreviousClose ??
        null,

      change:
        quote.regularMarketChange ??
        null,

      changePercent:
        quote.regularMarketChangePercent ??
        null,

      marketCap:
        quote.marketCap ??
        null,

      peRatioTTM:
        quote.trailingPE ??
        null,

      fiftyTwoWeekLow:
        quote.fiftyTwoWeekLow ??
        null,

      fiftyTwoWeekHigh:
        quote.fiftyTwoWeekHigh ??
        null,

      volume:
        quote.regularMarketVolume ??
        quote.volume ??
        null,

      dayOpen:
        quote.regularMarketOpen ??
        null,

      dayHigh:
        quote.regularMarketDayHigh ??
        null,

      dayLow:
        quote.regularMarketDayLow ??
        null,

      sector:
        profile.sector ||
        null,

      industry:
        profile.industry ||
        null,

      businessSummary:
        profile.longBusinessSummary ||
        null,

      website,

      logoDomain:
        getDomain(website),

      lastUpdated:
        quote.regularMarketTime instanceof Date
          ? quote.regularMarketTime.toISOString()
          : quote.regularMarketTime ||
            new Date().toISOString(),

      source:
        "Yahoo Finance",

      range,

      chart,
    };

    return res.status(200).json({
      stock,
    });
  } catch (error) {
    console.error("Stock-data function error:", error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to retrieve stock data.",
    });
  }
}