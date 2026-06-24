const API_BASE_URL = String(
  import.meta.env.VITE_API_BASE_URL || "",
).replace(/\/+$/, "");

function buildApiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function readJsonResponse(response) {
  const responseText = await response.text();

  if (!responseText) {
    return {};
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error(
      "The server returned an invalid JSON response.",
    );
  }
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

function normalizeMarketStatus(marketStatus) {
  return {
    isOpen: Boolean(
      marketStatus?.isOpen,
    ),

    label:
      marketStatus?.label ||
      "Market status unavailable",

    marketState:
      marketStatus?.marketState ||
      "UNKNOWN",

    lastUpdated:
      marketStatus?.lastUpdated ||
      "Unavailable",
  };
}

function normalizeIndex(index) {
  return {
    symbol:
      index?.symbol ||
      index?.ticker ||
      "Unknown",

    ticker:
      index?.ticker ||
      index?.symbol ||
      "",

    value: safeNumber(
      index?.value,
    ),

    change: safeNumber(
      index?.change,
      0,
    ),

    changePercent: safeNumber(
      index?.changePercent,
      0,
    ),

    previousClose: safeNumber(
      index?.previousClose,
    ),

    dayHigh: safeNumber(
      index?.dayHigh,
    ),

    dayLow: safeNumber(
      index?.dayLow,
    ),

    currency:
      index?.currency ||
      "INR",

    marketState:
      index?.marketState ||
      "UNKNOWN",

    trend:
      Array.isArray(index?.trend)
        ? index.trend
            .map(Number)
            .filter(Number.isFinite)
        : [],
  };
}

function normalizeSector(sector) {
  return {
    name:
      sector?.name ||
      sector?.shortName ||
      "Unknown sector",

    shortName:
      sector?.shortName ||
      sector?.name ||
      "Unknown",

    symbol:
      sector?.symbol ||
      "",

    value: safeNumber(
      sector?.value,
    ),

    change: safeNumber(
      sector?.change,
      0,
    ),

    changePercent: safeNumber(
      sector?.changePercent,
      0,
    ),

    previousClose: safeNumber(
      sector?.previousClose,
    ),

    marketState:
      sector?.marketState ||
      "UNKNOWN",
  };
}

function normalizeWatchlistQuote(quote) {
  return {
    symbol: String(
      quote?.symbol || "",
    ).toUpperCase(),

    name:
      quote?.name ||
      quote?.symbol ||
      "Unknown company",

    price: safeNumber(
      quote?.price,
    ),

    change: safeNumber(
      quote?.change,
      0,
    ),

    changePercent: safeNumber(
      quote?.changePercent,
      0,
    ),

    previousClose: safeNumber(
      quote?.previousClose,
    ),

    dayHigh: safeNumber(
      quote?.dayHigh,
    ),

    dayLow: safeNumber(
      quote?.dayLow,
    ),

    volume: safeNumber(
      quote?.volume,
    ),

    marketCap: safeNumber(
      quote?.marketCap,
    ),

    currency:
      quote?.currency ||
      "INR",

    exchange:
      quote?.exchange ||
      "NSE",

    marketState:
      quote?.marketState ||
      "UNKNOWN",
  };
}

function normalizeMarketMover(stock) {
  return {
    symbol: String(
      stock?.symbol || "",
    ).toUpperCase(),

    name:
      stock?.name ||
      stock?.symbol ||
      "Unknown company",

    price: safeNumber(
      stock?.price,
    ),

    change: safeNumber(
      stock?.change,
      0,
    ),

    changePercent: safeNumber(
      stock?.changePercent,
      0,
    ),

    previousClose: safeNumber(
      stock?.previousClose,
    ),

    volume: safeNumber(
      stock?.volume,
      0,
    ),

    averageVolume: safeNumber(
      stock?.averageVolume,
      0,
    ),

    marketCap: safeNumber(
      stock?.marketCap,
    ),

    marketState:
      stock?.marketState ||
      "UNKNOWN",

    currency:
      stock?.currency ||
      "INR",
  };
}

function normalizeMarketBreadth(breadth) {
  return {
    advancing: safeNumber(
      breadth?.advancing,
      0,
    ),

    declining: safeNumber(
      breadth?.declining,
      0,
    ),

    unchanged: safeNumber(
      breadth?.unchanged,
      0,
    ),

    advanceDeclineRatio: safeNumber(
      breadth?.advanceDeclineRatio,
      0,
    ),

    advancingPercent: safeNumber(
      breadth?.advancingPercent,
      0,
    ),

    decliningPercent: safeNumber(
      breadth?.decliningPercent,
      0,
    ),

    above50DMA: safeNumber(
      breadth?.above50DMA,
      0,
    ),

    above50DMACount: safeNumber(
      breadth?.above50DMACount,
      0,
    ),

    below50DMACount: safeNumber(
      breadth?.below50DMACount,
      0,
    ),

    dmaCoverage: safeNumber(
      breadth?.dmaCoverage,
      0,
    ),

    week52Highs: safeNumber(
      breadth?.week52Highs,
      0,
    ),

    week52Lows: safeNumber(
      breadth?.week52Lows,
      0,
    ),

    week52Coverage: safeNumber(
      breadth?.week52Coverage,
      0,
    ),

    totalStocks: safeNumber(
      breadth?.totalStocks,
      0,
    ),

    scope:
      breadth?.scope ||
      "Tracked NSE stock universe",
  };
}

export async function getDashboardMarketData({
  refresh = false,
  signal,
} = {}) {
  const refreshQuery =
    refresh ? "?refresh=1" : "";

  const response = await fetch(
    buildApiUrl(
      `/api/dashboard-market${refreshQuery}`,
    ),
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const data =
    await readJsonResponse(response);

  if (
    !response.ok ||
    data?.success !== true
  ) {
    throw new Error(
      data?.error ||
        `Unable to load dashboard market data. Server returned ${response.status}.`,
    );
  }

  return {
    success: true,

    source:
      data?.source ||
      "Yahoo Finance",

    fetchedAt:
      data?.fetchedAt ||
      new Date().toISOString(),

    cached:
      Boolean(data?.cached),

    marketStatus:
      normalizeMarketStatus(
        data?.marketStatus,
      ),

    indices:
      Array.isArray(data?.indices)
        ? data.indices.map(
            normalizeIndex,
          )
        : [],

    sectors:
      Array.isArray(data?.sectors)
        ? data.sectors.map(
            normalizeSector,
          )
        : [],

    unavailableSymbols:
      Array.isArray(
        data?.unavailableSymbols,
      )
        ? data.unavailableSymbols
        : [],
  };
}

export async function getWatchlistQuotes({
  symbols = [],
  refresh = false,
  signal,
} = {}) {
  const cleanedSymbols = [
    ...new Set(
      (
        Array.isArray(symbols)
          ? symbols
          : []
      )
        .map((symbol) =>
          String(symbol || "")
            .trim()
            .toUpperCase(),
        )
        .filter(Boolean),
    ),
  ];

  if (
    cleanedSymbols.length === 0
  ) {
    return {
      success: true,
      quotes: [],
      unavailableSymbols: [],
      source: "Yahoo Finance",
      cached: false,
    };
  }

  const parameters =
    new URLSearchParams();

  parameters.set(
    "symbols",
    cleanedSymbols.join(","),
  );

  if (refresh) {
    parameters.set(
      "refresh",
      "1",
    );
  }

  const response = await fetch(
    buildApiUrl(
      `/api/watchlist-quotes?${parameters.toString()}`,
    ),
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const data =
    await readJsonResponse(response);

  if (
    !response.ok ||
    data?.success !== true
  ) {
    throw new Error(
      data?.error ||
        `Unable to load live watchlist prices. Server returned ${response.status}.`,
    );
  }

  return {
    success: true,

    source:
      data?.source ||
      "Yahoo Finance",

    fetchedAt:
      data?.fetchedAt ||
      new Date().toISOString(),

    cached:
      Boolean(data?.cached),

    requestedSymbols:
      Array.isArray(
        data?.requestedSymbols,
      )
        ? data.requestedSymbols
        : cleanedSymbols,

    quotes:
      Array.isArray(data?.quotes)
        ? data.quotes.map(
            normalizeWatchlistQuote,
          )
        : [],

    unavailableSymbols:
      Array.isArray(
        data?.unavailableSymbols,
      )
        ? data.unavailableSymbols
        : [],
  };
}

export async function getMarketMovers({
  refresh = false,
  signal,
} = {}) {
  const refreshQuery =
    refresh ? "?refresh=1" : "";

  const response = await fetch(
    buildApiUrl(
      `/api/market-movers${refreshQuery}`,
    ),
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const data =
    await readJsonResponse(response);

  if (
    !response.ok ||
    data?.success !== true
  ) {
    throw new Error(
      data?.error ||
        `Unable to load live market movers. Server returned ${response.status}.`,
    );
  }

  const movers =
    data?.movers &&
    typeof data.movers === "object"
      ? data.movers
      : {};

  return {
    success: true,

    source:
      data?.source ||
      "Yahoo Finance",

    universe:
      data?.universe ||
      "Selected liquid NSE stocks",

    fetchedAt:
      data?.fetchedAt ||
      new Date().toISOString(),

    cached:
      Boolean(data?.cached),

    totalQuotes:
      safeNumber(
        data?.totalQuotes,
        0,
      ),

    movers: {
      gainers:
        Array.isArray(
          movers?.gainers,
        )
          ? movers.gainers.map(
              normalizeMarketMover,
            )
          : [],

      losers:
        Array.isArray(
          movers?.losers,
        )
          ? movers.losers.map(
              normalizeMarketMover,
            )
          : [],

      active:
        Array.isArray(
          movers?.active,
        )
          ? movers.active.map(
              normalizeMarketMover,
            )
          : [],
    },

    unavailableSymbols:
      Array.isArray(
        data?.unavailableSymbols,
      )
        ? data.unavailableSymbols
        : [],
  };
}

export async function getMarketBreadth({
  refresh = false,
  signal,
} = {}) {
  const refreshQuery =
    refresh ? "?refresh=1" : "";

  const response = await fetch(
    buildApiUrl(
      `/api/market-breadth${refreshQuery}`,
    ),
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const data =
    await readJsonResponse(response);

  if (
    !response.ok ||
    data?.success !== true
  ) {
    throw new Error(
      data?.error ||
        `Unable to load live market breadth. Server returned ${response.status}.`,
    );
  }

  return {
    success: true,

    source:
      data?.source ||
      "Yahoo Finance",

    universe:
      data?.universe ||
      "Selected liquid NSE stocks",

    fetchedAt:
      data?.fetchedAt ||
      new Date().toISOString(),

    cached:
      Boolean(data?.cached),

    breadth:
      normalizeMarketBreadth(
        data?.breadth,
      ),

    totalRequested:
      safeNumber(
        data?.totalRequested,
        0,
      ),

    totalReceived:
      safeNumber(
        data?.totalReceived,
        0,
      ),

    unavailableSymbols:
      Array.isArray(
        data?.unavailableSymbols,
      )
        ? data.unavailableSymbols
        : [],
  };
}
function normalizeMarketAlert(alert) {
  return {
    id:
      alert?.id ||
      `${alert?.type || "alert"}-${alert?.symbol || Date.now()}`,

    type:
      alert?.type ||
      "market-alert",

    title:
      alert?.title ||
      "Market Alert",

    message:
      alert?.message ||
      alert?.description ||
      "Unusual market activity has been detected.",

    symbol: String(
      alert?.symbol || "",
    ).toUpperCase(),

    time:
      alert?.time ||
      "",

    severity:
      alert?.severity ||
      "information",
  };
}

export async function getMarketAlerts({
  refresh = false,
  signal,
} = {}) {
  const refreshQuery =
    refresh ? "?refresh=1" : "";

  const response = await fetch(
    buildApiUrl(
      `/api/market-alerts${refreshQuery}`,
    ),
    {
      method: "GET",

      headers: {
        Accept: "application/json",
      },

      signal,
    },
  );

  const data =
    await readJsonResponse(response);

  if (
    !response.ok ||
    data?.success !== true
  ) {
    throw new Error(
      data?.error ||
        `Unable to load live market alerts. Server returned ${response.status}.`,
    );
  }

  return {
    success: true,

    source:
      data?.source ||
      "Yahoo Finance",

    universe:
      data?.universe ||
      "Selected liquid NSE stocks",

    fetchedAt:
      data?.fetchedAt ||
      new Date().toISOString(),

    cached:
      Boolean(data?.cached),

    alerts:
      Array.isArray(data?.alerts)
        ? data.alerts.map(
            normalizeMarketAlert,
          )
        : [],

    alertCount:
      safeNumber(
        data?.alertCount,
        0,
      ),

    candidateCount:
      safeNumber(
        data?.candidateCount,
        0,
      ),

    summary:
      data?.summary &&
      typeof data.summary ===
        "object"
        ? data.summary
        : {},

    unavailableSymbols:
      Array.isArray(
        data?.unavailableSymbols,
      )
        ? data.unavailableSymbols
        : [],
  };
}


function normalizeMarketNewsArticle(article) {
  return {
    id:
      article?.id ||
      article?.url ||
      article?.title ||
      `news-${Date.now()}`,

    title:
      String(
        article?.title ||
          "Market update",
      ).trim(),

    summary:
      String(
        article?.summary || "",
      ).trim(),

    source:
      String(
        article?.source ||
          "Yahoo Finance",
      ).trim(),

    url:
      String(
        article?.url || "",
      ).trim(),

    imageUrl:
      String(
        article?.imageUrl || "",
      ).trim(),

    publishedAt:
      article?.publishedAt || null,

    relatedTickers:
      Array.isArray(
        article?.relatedTickers,
      )
        ? article.relatedTickers
        : [],

    type:
      String(
        article?.type ||
          "STORY",
      ).trim(),
  };
}

export async function getMarketNews({
  refresh = false,
  signal,
} = {}) {
  const refreshQuery =
    refresh ? "?refresh=1" : "";

  const response = await fetch(
    buildApiUrl(
      `/api/market-news${refreshQuery}`,
    ),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    },
  );

  const data =
    await readJsonResponse(response);

  if (
    !response.ok ||
    data?.success !== true
  ) {
    throw new Error(
      data?.error ||
        `Unable to load market news. Server returned ${response.status}.`,
    );
  }

  return {
    success: true,

    source:
      data?.source ||
      "Yahoo Finance",

    region:
      data?.region ||
      "India",

    cached:
      Boolean(data?.cached),

    fetchedAt:
      data?.fetchedAt ||
      new Date().toISOString(),

    articleCount:
      Number.isFinite(
        Number(
          data?.articleCount,
        ),
      )
        ? Number(
            data.articleCount,
          )
        : 0,

    warning:
      String(
        data?.warning || "",
      ).trim(),

    articles:
      Array.isArray(
        data?.articles,
      )
        ? data.articles.map(
            normalizeMarketNewsArticle,
          )
        : [],
  };
}
