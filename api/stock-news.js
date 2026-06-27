import yahooFinance from "./_lib/yahooFinance.js";
import withRetry from "./_lib/withRetry.js";

const newsCache = new Map();
const CACHE_DURATION_MS = 5 * 60 * 1000;
const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 40;

const POSITIVE_TERMS = [
  "beats",
  "beat estimates",
  "surges",
  "jumps",
  "rises",
  "gains",
  "growth",
  "record profit",
  "strong results",
  "upgrade",
  "upgraded",
  "outperform",
  "expansion",
  "wins order",
  "order win",
  "dividend",
  "recovery",
  "improves",
  "positive",
  "bullish",
];

const NEGATIVE_TERMS = [
  "misses",
  "missed estimates",
  "falls",
  "drops",
  "declines",
  "loss",
  "weak results",
  "downgrade",
  "downgraded",
  "underperform",
  "fraud",
  "probe",
  "investigation",
  "penalty",
  "default",
  "warning",
  "cuts guidance",
  "negative",
  "bearish",
];

function cleanText(value, fallback = "") {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

function safeUrl(value) {
  if (!value) return "";

  try {
    const url = new URL(String(value));

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function normalizePublishedDate(value) {
  if (!value) return null;

  let normalizedValue = value;

  if (
    typeof normalizedValue === "number" &&
    normalizedValue < 1_000_000_000_000
  ) {
    normalizedValue *= 1000;
  }

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime())
    ? null
    : date.toISOString();
}

function getThumbnail(item) {
  const resolutions = item?.thumbnail?.resolutions;

  if (Array.isArray(resolutions)) {
    const image = [...resolutions]
      .reverse()
      .find((entry) => safeUrl(entry?.url));

    if (image?.url) {
      return safeUrl(image.url);
    }
  }

  return safeUrl(
    item?.thumbnail?.originalUrl ||
      item?.thumbnail?.url,
  );
}

function getSummary(item) {
  return cleanText(
    item?.summary ||
      item?.description ||
      item?.content ||
      item?.snippet ||
      "",
  );
}

function classifySentiment(title, summary) {
  const searchable = `${title} ${summary}`.toLowerCase();

  const positiveScore = POSITIVE_TERMS.reduce(
    (score, term) =>
      searchable.includes(term) ? score + 1 : score,
    0,
  );

  const negativeScore = NEGATIVE_TERMS.reduce(
    (score, term) =>
      searchable.includes(term) ? score + 1 : score,
    0,
  );

  if (positiveScore > negativeScore) {
    return "Positive";
  }

  if (negativeScore > positiveScore) {
    return "Negative";
  }

  return "Neutral";
}

function normalizeNewsItem(item, index) {
  const title = cleanText(item?.title, "Market update");
  const summary = getSummary(item);
  const link = safeUrl(item?.link || item?.url);

  return {
    id:
      cleanText(item?.uuid) ||
      link ||
      `${title}-${index}`,
    title,
    summary,
    publisher: cleanText(
      item?.publisher || item?.provider,
      "Market News",
    ),
    link,
    thumbnail: getThumbnail(item),
    publishedAt: normalizePublishedDate(
      item?.providerPublishTime ||
        item?.publishedAt ||
        item?.pubDate,
    ),
    relatedTickers: Array.isArray(item?.relatedTickers)
      ? item.relatedTickers
          .map((ticker) => cleanText(ticker).toUpperCase())
          .filter(Boolean)
      : [],
    sentiment: classifySentiment(title, summary),
  };
}

function relevanceScore(item, symbol, company) {
  let score = 0;

  const normalizedSymbol = cleanText(symbol).toUpperCase();
  const baseSymbol = normalizedSymbol.replace(/\.(NS|BO)$/i, "");
  const title = cleanText(item?.title).toLowerCase();

  const relatedTickers = Array.isArray(item?.relatedTickers)
    ? item.relatedTickers.map((ticker) =>
        cleanText(ticker).toUpperCase(),
      )
    : [];

  if (normalizedSymbol && relatedTickers.includes(normalizedSymbol)) {
    score += 20;
  }

  if (
    baseSymbol &&
    relatedTickers.some(
      (ticker) =>
        ticker.replace(/\.(NS|BO)$/i, "") === baseSymbol,
    )
  ) {
    score += 14;
  }

  if (
    baseSymbol &&
    title.includes(baseSymbol.toLowerCase())
  ) {
    score += 8;
  }

  cleanText(company)
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length >= 4)
    .slice(0, 5)
    .forEach((word) => {
      if (title.includes(word)) {
        score += 3;
      }
    });

  return score;
}

function getPublishedTime(item) {
  const value = normalizePublishedDate(
    item?.providerPublishTime ||
      item?.publishedAt ||
      item?.pubDate,
  );

  return value ? new Date(value).getTime() : 0;
}

async function searchNews(query) {
  if (!query) return [];

  const result = await withRetry(
    () =>
      yahooFinance.search(query, {
        quotesCount: 0,
        newsCount: MAX_LIMIT,
      }),
    {
      attempts: 3,
      delayMs: 500,
      label: `Stock news "${query}"`,
    },
  );

  return Array.isArray(result?.news)
    ? result.news
    : [];
}

function getQueryValue(request, key) {
  const value = request.query?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function handler(request, response) {
  response.setHeader(
    "Cache-Control",
    "s-maxage=300, stale-while-revalidate=600",
  );

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");

    return response.status(405).json({
      success: false,
      error: "Method not allowed.",
    });
  }

  const symbol = cleanText(
    getQueryValue(request, "symbol"),
  ).toUpperCase();

  const company = cleanText(
    getQueryValue(request, "company"),
  );

  const requestedLimit = Number(
    getQueryValue(request, "limit"),
  );

  const limit = Number.isFinite(requestedLimit)
    ? Math.min(
        Math.max(Math.trunc(requestedLimit), 1),
        MAX_LIMIT,
      )
    : DEFAULT_LIMIT;

  const forceRefresh =
    String(getQueryValue(request, "refresh") || "") === "1";

  if (!symbol && !company) {
    return response.status(400).json({
      success: false,
      error: "A stock symbol or company name is required.",
    });
  }

  const cacheKey = `${symbol}:${company.toLowerCase()}`;
  const cached = newsCache.get(cacheKey);

  if (
    !forceRefresh &&
    cached &&
    Date.now() - cached.createdAt < CACHE_DURATION_MS
  ) {
    return response.status(200).json({
      ...cached.data,
      news: cached.data.news.slice(0, limit),
      cached: true,
    });
  }

  try {
    const cleanedSymbol = symbol.replace(/\.(NS|BO)$/i, "");
    const primaryQuery = company || cleanedSymbol || symbol;

    let items = await searchNews(primaryQuery);

    if (
      items.length < 8 &&
      symbol &&
      primaryQuery !== symbol
    ) {
      try {
        const fallbackItems = await searchNews(symbol);
        items = [...items, ...fallbackItems];
      } catch (fallbackError) {
        console.warn(
          "Ticker news fallback failed:",
          fallbackError instanceof Error
            ? fallbackError.message
            : fallbackError,
        );
      }
    }

    const seen = new Set();

    const normalizedNews = items
      .map((item) => ({
        item,
        relevance: relevanceScore(item, symbol, company),
        publishedTime: getPublishedTime(item),
      }))
      .sort((first, second) => {
        if (first.relevance !== second.relevance) {
          return second.relevance - first.relevance;
        }

        return second.publishedTime - first.publishedTime;
      })
      .map(({ item }) => item)
      .map(normalizeNewsItem)
      .filter((item) => {
        if (!item.title || !item.link) {
          return false;
        }

        const key = `${item.title.toLowerCase()}|${item.link}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      })
      .slice(0, MAX_LIMIT);

    const sentimentSummary = normalizedNews.reduce(
      (summary, item) => {
        summary[item.sentiment] += 1;
        return summary;
      },
      { Positive: 0, Neutral: 0, Negative: 0 },
    );

    const data = {
      success: true,
      symbol,
      company: company || cleanedSymbol || symbol,
      source: "Yahoo Finance",
      fetchedAt: new Date().toISOString(),
      cached: false,
      sentimentSummary,
      news: normalizedNews,
    };

    newsCache.set(cacheKey, {
      createdAt: Date.now(),
      data,
    });

    return response.status(200).json({
      ...data,
      news: normalizedNews.slice(0, limit),
    });
  } catch (error) {
    console.error("Stock news error:", error);

    return response.status(500).json({
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to load stock-related news.",
      news: [],
    });
  }
}