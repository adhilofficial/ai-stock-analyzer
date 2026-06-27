import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";

import path from "node:path";
import process from "node:process";

import yahooFinance from
  "../api/_lib/yahooFinance.js";

import withRetry from
  "../api/_lib/withRetry.js";

/*
|--------------------------------------------------------------------------
| File locations
|--------------------------------------------------------------------------
*/

const DATA_DIRECTORY = path.join(
  process.cwd(),
  "data",
);

const UNIVERSE_FILE = path.join(
  DATA_DIRECTORY,
  "screener-universe.json",
);

const OUTPUT_FILE = path.join(
  DATA_DIRECTORY,
  "screener-snapshot.json",
);

/*
|--------------------------------------------------------------------------
| Request configuration
|--------------------------------------------------------------------------
*/

const DETAIL_CONCURRENCY = 3;
const QUOTE_BATCH_SIZE = 25;
const CHART_LOOKBACK_DAYS = 220;

/*
|--------------------------------------------------------------------------
| General helpers
|--------------------------------------------------------------------------
*/

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeSymbol(value) {
  return cleanText(value)
    .toUpperCase();
}

function safeNumber(value) {
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

function roundNumber(
  value,
  decimalPlaces = 2,
) {
  const number = safeNumber(value);

  if (number === null) {
    return null;
  }

  return Number(
    number.toFixed(decimalPlaces),
  );
}

function percentageValue(value) {
  const number = safeNumber(value);

  if (number === null) {
    return null;
  }

  /*
   * Yahoo normally returns:
   * 0.15 = 15%
   *
   * This also supports providers that
   * already return 15.
   */
  if (Math.abs(number) <= 2) {
    return roundNumber(
      number * 100,
      2,
    );
  }

  return roundNumber(number, 2);
}

function daysAgo(days) {
  return new Date(
    Date.now() -
      days *
        24 *
        60 *
        60 *
        1000,
  );
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

/*
|--------------------------------------------------------------------------
| Controlled concurrency
|--------------------------------------------------------------------------
*/

async function mapWithConcurrency(
  items,
  concurrency,
  callback,
) {
  const results = new Array(
    items.length,
  );

  let nextIndex = 0;

  async function worker() {
    while (
      nextIndex < items.length
    ) {
      const currentIndex =
        nextIndex;

      nextIndex += 1;

      try {
        results[currentIndex] =
          await callback(
            items[currentIndex],
            currentIndex,
          );
      } catch (error) {
        results[currentIndex] = {
          success: false,
          error,
        };
      }
    }
  }

  const workerCount = Math.min(
    Math.max(concurrency, 1),
    items.length,
  );

  await Promise.all(
    Array.from(
      {
        length: workerCount,
      },
      () => worker(),
    ),
  );

  return results;
}

/*
|--------------------------------------------------------------------------
| Technical calculations
|--------------------------------------------------------------------------
*/

function calculateSma(
  prices,
  period,
) {
  if (
    !Array.isArray(prices) ||
    prices.length < period
  ) {
    return null;
  }

  const selectedPrices =
    prices.slice(-period);

  if (
    selectedPrices.some(
      (price) =>
        !Number.isFinite(
          Number(price),
        ),
    )
  ) {
    return null;
  }

  const total =
    selectedPrices.reduce(
      (sum, price) =>
        sum + Number(price),
      0,
    );

  return roundNumber(
    total / period,
    2,
  );
}

function calculateRsi(
  prices,
  period = 14,
) {
  if (
    !Array.isArray(prices) ||
    prices.length <= period
  ) {
    return null;
  }

  const validPrices = prices
    .map(Number)
    .filter(Number.isFinite);

  if (
    validPrices.length <= period
  ) {
    return null;
  }

  let totalGain = 0;
  let totalLoss = 0;

  for (
    let index = 1;
    index <= period;
    index += 1
  ) {
    const change =
      validPrices[index] -
      validPrices[index - 1];

    if (change > 0) {
      totalGain += change;
    } else {
      totalLoss += Math.abs(
        change,
      );
    }
  }

  let averageGain =
    totalGain / period;

  let averageLoss =
    totalLoss / period;

  for (
    let index = period + 1;
    index < validPrices.length;
    index += 1
  ) {
    const change =
      validPrices[index] -
      validPrices[index - 1];

    const gain =
      change > 0
        ? change
        : 0;

    const loss =
      change < 0
        ? Math.abs(change)
        : 0;

    averageGain =
      (
        averageGain *
          (period - 1) +
        gain
      ) / period;

    averageLoss =
      (
        averageLoss *
          (period - 1) +
        loss
      ) / period;
  }

  if (
    averageGain === 0 &&
    averageLoss === 0
  ) {
    return 50;
  }

  if (averageLoss === 0) {
    return 100;
  }

  const relativeStrength =
    averageGain /
    averageLoss;

  return roundNumber(
    100 -
      100 /
        (
          1 +
          relativeStrength
        ),
    2,
  );
}

function getRsiStatus(rsi) {
  const value = safeNumber(rsi);

  if (value === null) {
    return "Unavailable";
  }

  if (value >= 70) {
    return "Overbought";
  }

  if (value <= 30) {
    return "Oversold";
  }

  if (value >= 55) {
    return "Positive";
  }

  if (value <= 45) {
    return "Weak";
  }

  return "Neutral";
}

function getTrend({
  price,
  sma20,
  sma50,
}) {
  const currentPrice =
    safeNumber(price);

  const shortAverage =
    safeNumber(sma20);

  const longAverage =
    safeNumber(sma50);

  if (
    currentPrice === null ||
    shortAverage === null ||
    longAverage === null
  ) {
    return "Unavailable";
  }

  if (
    currentPrice >
      shortAverage &&
    shortAverage >
      longAverage
  ) {
    return "Bullish";
  }

  if (
    currentPrice <
      shortAverage &&
    shortAverage <
      longAverage
  ) {
    return "Bearish";
  }

  if (
    currentPrice >
    longAverage
  ) {
    return "Positive";
  }

  if (
    currentPrice <
    longAverage
  ) {
    return "Negative";
  }

  return "Sideways";
}

function getPriceVsSmaStatus(
  price,
  sma,
) {
  const currentPrice =
    safeNumber(price);

  const average =
    safeNumber(sma);

  if (
    currentPrice === null ||
    average === null
  ) {
    return "Unavailable";
  }

  if (
    currentPrice > average
  ) {
    return "Above";
  }

  if (
    currentPrice < average
  ) {
    return "Below";
  }

  return "Equal";
}

/*
|--------------------------------------------------------------------------
| Read screener universe
|--------------------------------------------------------------------------
*/

async function readUniverse() {
  let fileText;

  try {
    fileText = await readFile(
      UNIVERSE_FILE,
      "utf8",
    );
  } catch {
    throw new Error(
      "data/screener-universe.json was not found. Run npm run build:screener-universe first.",
    );
  }

  const universe =
    JSON.parse(fileText);

  if (!Array.isArray(universe)) {
    throw new Error(
      "data/screener-universe.json must contain an array.",
    );
  }

  return universe;
}

/*
|--------------------------------------------------------------------------
| Fetch live quotes in batches
|--------------------------------------------------------------------------
*/

async function fetchQuoteMap(
  symbols,
) {
  const quoteMap = new Map();

  const batches =
    splitIntoChunks(
      symbols,
      QUOTE_BATCH_SIZE,
    );

  for (
    let index = 0;
    index < batches.length;
    index += 1
  ) {
    const batch =
      batches[index];

    console.log(
      `Loading quote batch ${index + 1}/${batches.length}...`,
    );

    try {
      const result =
        await withRetry(
          () =>
            yahooFinance.quote(
              batch,
            ),
          {
            attempts: 3,
            delayMs: 700,
            label:
              `Screener quote batch ${index + 1}`,
          },
        );

      const quotes =
        Array.isArray(result)
          ? result
          : result
            ? [result]
            : [];

      quotes.forEach(
        (quote) => {
          if (!quote?.symbol) {
            return;
          }

          quoteMap.set(
            normalizeSymbol(
              quote.symbol,
            ),
            quote,
          );
        },
      );
    } catch (error) {
      console.warn(
        `Quote batch ${index + 1} failed:`,
        error instanceof Error
          ? error.message
          : error,
      );
    }
  }

  /*
   * Retry quotes that were missing from
   * the batch responses.
   */
  const missingSymbols =
    symbols.filter(
      (symbol) =>
        !quoteMap.has(
          normalizeSymbol(symbol),
        ),
    );

  if (
    missingSymbols.length > 0
  ) {
    console.log(
      `Retrying ${missingSymbols.length} missing quotes individually...`,
    );

    await mapWithConcurrency(
      missingSymbols,
      DETAIL_CONCURRENCY,
      async (symbol) => {
        const quote =
          await withRetry(
            () =>
              yahooFinance.quote(
                symbol,
              ),
            {
              attempts: 2,
              delayMs: 500,
              label:
                `Screener quote ${symbol}`,
            },
          );

        if (quote?.symbol) {
          quoteMap.set(
            normalizeSymbol(
              quote.symbol,
            ),
            quote,
          );
        }

        return quote;
      },
    );
  }

  return quoteMap;
}

/*
|--------------------------------------------------------------------------
| Fetch fundamentals and chart history
|--------------------------------------------------------------------------
*/

async function fetchDetails(symbol) {
  const normalizedSymbol =
    normalizeSymbol(symbol);

  const [
    summaryResult,
    chartResult,
  ] = await Promise.allSettled([
    withRetry(
      () =>
        yahooFinance.quoteSummary(
          normalizedSymbol,
          {
            modules: [
              "assetProfile",
              "financialData",
              "defaultKeyStatistics",
              "summaryDetail",
            ],
          },
        ),
      {
        attempts: 2,
        delayMs: 650,
        label:
          `Screener fundamentals ${normalizedSymbol}`,
      },
    ),

    withRetry(
      () =>
        yahooFinance.chart(
          normalizedSymbol,
          {
            period1: daysAgo(
              CHART_LOOKBACK_DAYS,
            ),

            period2:
              new Date(),

            interval: "1d",
          },
        ),
      {
        attempts: 2,
        delayMs: 650,
        label:
          `Screener chart ${normalizedSymbol}`,
      },
    ),
  ]);

  const summary =
    summaryResult.status ===
    "fulfilled"
      ? summaryResult.value || {}
      : {};

  const profile =
    summary.assetProfile || {};

  const financialData =
    summary.financialData || {};

  const keyStatistics =
    summary.defaultKeyStatistics ||
    {};

  const summaryDetail =
    summary.summaryDetail || {};

  const chartQuotes =
    chartResult.status ===
      "fulfilled" &&
    Array.isArray(
      chartResult.value?.quotes,
    )
      ? chartResult.value.quotes
      : [];

  const closes = chartQuotes
    .filter(
      (item) =>
        item?.date &&
        Number.isFinite(
          Number(item?.close),
        ),
    )
    .sort(
      (first, second) =>
        new Date(
          first.date,
        ).getTime() -
        new Date(
          second.date,
        ).getTime(),
    )
    .map((item) =>
      Number(item.close),
    );

  const sma20 =
    calculateSma(
      closes,
      20,
    );

  const sma50 =
    calculateSma(
      closes,
      50,
    );

  const rsi =
    calculateRsi(
      closes,
      14,
    );

  return {
    sector:
      cleanText(
        profile.sector,
      ) || null,

    industry:
      cleanText(
        profile.industry,
      ) || null,

    revenueGrowth:
      safeNumber(
        financialData.revenueGrowth,
      ),

    revenueGrowthPercent:
      percentageValue(
        financialData.revenueGrowth,
      ),

    earningsGrowth:
      safeNumber(
        financialData.earningsGrowth,
      ),

    earningsGrowthPercent:
      percentageValue(
        financialData.earningsGrowth,
      ),

    returnOnEquity:
      safeNumber(
        financialData.returnOnEquity,
      ),

    returnOnEquityPercent:
      percentageValue(
        financialData.returnOnEquity,
      ),

    debtToEquity:
      safeNumber(
        financialData.debtToEquity,
      ),

    currentRatio:
      safeNumber(
        financialData.currentRatio,
      ),

    profitMargins:
      safeNumber(
        financialData.profitMargins,
      ),

    profitMarginsPercent:
      percentageValue(
        financialData.profitMargins,
      ),

    totalRevenue:
      safeNumber(
        financialData.totalRevenue,
      ),

    totalCash:
      safeNumber(
        financialData.totalCash,
      ),

    totalDebt:
      safeNumber(
        financialData.totalDebt,
      ),

    freeCashflow:
      safeNumber(
        financialData.freeCashflow,
      ),

    priceToBook:
      safeNumber(
        keyStatistics.priceToBook,
      ),

    trailingEps:
      safeNumber(
        keyStatistics.trailingEps,
      ),

    forwardEps:
      safeNumber(
        keyStatistics.forwardEps,
      ),

    dividendYield:
      safeNumber(
        summaryDetail.dividendYield,
      ),

    sma20,
    sma50,
    rsi,

    rsiStatus:
      getRsiStatus(rsi),

    chartPoints:
      closes.length,

    financialDataAvailable:
      summaryResult.status ===
      "fulfilled",

    technicalDataAvailable:
      chartResult.status ===
      "fulfilled",
  };
}

/*
|--------------------------------------------------------------------------
| Build one complete snapshot row
|--------------------------------------------------------------------------
*/

function buildSnapshotRow(
  stock,
  quote,
  details,
) {
  const price =
    safeNumber(
      quote?.regularMarketPrice,
    );

  const week52High =
    safeNumber(
      quote?.fiftyTwoWeekHigh,
    );

  const week52Low =
    safeNumber(
      quote?.fiftyTwoWeekLow,
    );

  const sma20 =
    safeNumber(
      details?.sma20,
    );

  const sma50 =
    safeNumber(
      details?.sma50,
    );

  const rsi =
    safeNumber(
      details?.rsi,
    );

  let distanceFrom52WeekHigh =
    null;

  if (
    price !== null &&
    week52High !== null &&
    week52High > 0
  ) {
    distanceFrom52WeekHigh =
      roundNumber(
        (
          (
            week52High -
            price
          ) /
          week52High
        ) *
          100,
        2,
      );
  }

  return {
    symbol:
      quote?.symbol ||
      stock.symbol ||
      stock.yahooSymbol,

    name:
      quote?.longName ||
      quote?.shortName ||
      stock.name ||
      stock.symbol,

    exchange:
      stock.exchange ||
      quote?.fullExchangeName ||
      quote?.exchange ||
      "NSE",

    currency:
      quote?.currency ||
      "INR",

    marketState:
      quote?.marketState ||
      null,

    price,

    previousClose:
      safeNumber(
        quote
          ?.regularMarketPreviousClose,
      ),

    change:
      safeNumber(
        quote?.regularMarketChange,
      ),

    changePercent:
      safeNumber(
        quote
          ?.regularMarketChangePercent,
      ),

    marketCap:
      safeNumber(
        quote?.marketCap,
      ),

    peRatio:
      safeNumber(
        quote?.trailingPE,
      ),

    forwardPE:
      safeNumber(
        quote?.forwardPE,
      ),

    priceToBook:
      safeNumber(
        quote?.priceToBook ??
          details?.priceToBook,
      ),

    week52Low,
    week52High,
    distanceFrom52WeekHigh,

    volume:
      safeNumber(
        quote
          ?.regularMarketVolume ??
          quote?.volume,
      ),

    averageVolume:
      safeNumber(
        quote
          ?.averageDailyVolume3Month,
      ),

    sector:
      details?.sector ||
      "Not available",

    industry:
      details?.industry ||
      "Not available",

    revenueGrowth:
      details
        ?.revenueGrowth ??
      null,

    revenueGrowthPercent:
      details
        ?.revenueGrowthPercent ??
      null,

    earningsGrowth:
      details
        ?.earningsGrowth ??
      null,

    earningsGrowthPercent:
      details
        ?.earningsGrowthPercent ??
      null,

    returnOnEquity:
      details
        ?.returnOnEquity ??
      null,

    returnOnEquityPercent:
      details
        ?.returnOnEquityPercent ??
      null,

    debtToEquity:
      details
        ?.debtToEquity ??
      null,

    currentRatio:
      details
        ?.currentRatio ??
      null,

    profitMargins:
      details
        ?.profitMargins ??
      null,

    profitMarginsPercent:
      details
        ?.profitMarginsPercent ??
      null,

    totalRevenue:
      details
        ?.totalRevenue ??
      null,

    totalCash:
      details
        ?.totalCash ??
      null,

    totalDebt:
      details
        ?.totalDebt ??
      null,

    freeCashflow:
      details
        ?.freeCashflow ??
      null,

    dividendYield:
      safeNumber(
        quote?.dividendYield ??
          details?.dividendYield,
      ),

    trailingEps:
      details
        ?.trailingEps ??
      null,

    forwardEps:
      details
        ?.forwardEps ??
      null,

    rsi,

    rsiStatus:
      details?.rsiStatus ||
      "Unavailable",

    sma20,
    sma50,

    priceVsSma20:
      getPriceVsSmaStatus(
        price,
        sma20,
      ),

    priceVsSma50:
      getPriceVsSmaStatus(
        price,
        sma50,
      ),

    trend:
      getTrend({
        price,
        sma20,
        sma50,
      }),

    chartPoints:
      details?.chartPoints ??
      0,

    financialDataAvailable:
      Boolean(
        details
          ?.financialDataAvailable,
      ),

    technicalDataAvailable:
      Boolean(
        details
          ?.technicalDataAvailable,
      ),

    logoDomain:
      stock.logoDomain ||
      "",

    companyUrl:
      stock.companyUrl ||
      "",

    nseUrl:
      stock.nseUrl ||
      "",

    bseUrl:
      stock.bseUrl ||
      "",

    nseSymbol:
      stock.nseSymbol ||
      "",

    bseCode:
      stock.bseCode ||
      "",

    isin:
      stock.isin ||
      "",

    universeRank:
      stock.universeRank ??
      null,

    source:
      "Yahoo Finance",
  };
}

/*
|--------------------------------------------------------------------------
| Main builder
|--------------------------------------------------------------------------
*/

async function main() {
  console.log(
    "Reading screener universe...",
  );

  const universe =
    await readUniverse();

  const symbols = universe
    .map(
      (stock) =>
        stock.symbol ||
        stock.yahooSymbol,
    )
    .filter(Boolean)
    .map(normalizeSymbol);

  console.log(
    `Building snapshot for ${symbols.length} stocks...`,
  );

  /*
   * Step 1:
   * Fetch current quotes in batches.
   */
  const quoteMap =
    await fetchQuoteMap(
      symbols,
    );

  let completed = 0;

  /*
   * Step 2:
   * Fetch financial and technical
   * details with controlled concurrency.
   */
  const results =
    await mapWithConcurrency(
      universe,
      DETAIL_CONCURRENCY,
      async (stock) => {
        const symbol =
          normalizeSymbol(
            stock.symbol ||
              stock.yahooSymbol,
          );

        const quote =
          quoteMap.get(symbol);

        if (!quote) {
          console.warn(
            `Skipping ${symbol}: quote unavailable.`,
          );

          return null;
        }

        let details = {};

        try {
          details =
            await fetchDetails(
              symbol,
            );
        } catch (error) {
          console.warn(
            `Details unavailable for ${symbol}:`,
            error instanceof Error
              ? error.message
              : error,
          );
        }

        completed += 1;

        console.log(
          `[${completed}/${universe.length}] ${symbol}`,
        );

        return buildSnapshotRow(
          stock,
          quote,
          details,
        );
      },
    );

  const stocks =
    results.filter(
      (item) =>
        item &&
        item.success !== false,
    );

  const sectors = [
    ...new Set(
      stocks
        .map(
          (stock) =>
            stock.sector,
        )
        .filter(
          (sector) =>
            sector &&
            sector !==
              "Not available",
        ),
    ),
  ].sort(
    (first, second) =>
      first.localeCompare(
        second,
      ),
  );

  const snapshot = {
    version: 1,

    generatedAt:
      new Date().toISOString(),

    source:
      "Yahoo Finance",

    universeCount:
      universe.length,

    stockCount:
      stocks.length,

    sectors,

    stocks,
  };

  await mkdir(
    DATA_DIRECTORY,
    {
      recursive: true,
    },
  );

  await writeFile(
    OUTPUT_FILE,
    `${JSON.stringify(
      snapshot,
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log("");

  console.log(
    `Created ${stocks.length} screener snapshot records.`,
  );

  console.log(
    `Saved: ${OUTPUT_FILE}`,
  );

  if (
    stocks.length <
    universe.length
  ) {
    console.warn(
      `${
        universe.length -
        stocks.length
      } stocks were skipped because live quote data was unavailable.`,
    );
  }
}

main().catch(
  (error) => {
    console.error(
      "Screener snapshot build failed:",
      error instanceof Error
        ? error.message
        : error,
    );

    process.exitCode = 1;
  },
);