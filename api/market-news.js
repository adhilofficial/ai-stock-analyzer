import YahooFinance from "yahoo-finance2";

import yahooFinance from "./_lib/yahooFinance.js";
    

const NEWS_QUERIES = [
  "NIFTY 50",
  "Sensex",
  "RELIANCE.NS",
  "HDFCBANK.NS",
  "INFY.NS",
  "TCS.NS",
  "ICICIBANK.NS",
  "Indian stock market",
];

const CACHE_DURATION_MS = 5 * 60 * 1000;

let newsCache = {
  expiresAt: 0,
  articles: [],
  fetchedAt: null,
};

function createArticleId(article, index = 0) {
  return (
    article?.uuid ||
    article?.link ||
    article?.url ||
    `${article?.title || "article"}-${index}`
  );
}

function normalizePublishTime(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString();
  }

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

function getThumbnailUrl(article) {
  const resolutions =
    article?.thumbnail?.resolutions;

  if (
    Array.isArray(resolutions) &&
    resolutions.length > 0
  ) {
    const validImages = resolutions
      .filter(
        (image) =>
          typeof image?.url === "string" &&
          image.url.trim(),
      )
      .sort(
        (first, second) =>
          Number(second?.width || 0) -
          Number(first?.width || 0),
      );

    return validImages[0]?.url || "";
  }

  if (
    typeof article?.thumbnail?.url ===
    "string"
  ) {
    return article.thumbnail.url;
  }

  return "";
}

function normalizeArticle(
  article,
  index = 0,
) {
  const title = String(
    article?.title || "",
  ).trim();

  const url = String(
    article?.link ||
      article?.url ||
      "",
  ).trim();

  return {
    id: createArticleId(
      article,
      index,
    ),

    title,

    summary: String(
      article?.summary ||
        article?.description ||
        "",
    ).trim(),

    source: String(
      article?.publisher ||
        article?.provider?.displayName ||
        "Yahoo Finance",
    ).trim(),

    url,

    imageUrl:
      getThumbnailUrl(article),

    publishedAt:
      normalizePublishTime(
        article?.providerPublishTime ||
          article?.publishedAt ||
          article?.pubDate,
      ),

    relatedTickers: Array.isArray(
      article?.relatedTickers,
    )
      ? article.relatedTickers
          .map((ticker) =>
            String(
              ticker,
            ).toUpperCase(),
          )
          .filter(Boolean)
      : [],

    type: String(
      article?.type || "STORY",
    ).trim(),
  };
}

function removeDuplicateArticles(
  articles,
) {
  const seen = new Set();

  return articles.filter(
    (article) => {
      const key = String(
        article?.url ||
          article?.title ||
          article?.id ||
          "",
      )
        .trim()
        .toLowerCase();

      if (
        !key ||
        seen.has(key)
      ) {
        return false;
      }

      seen.add(key);
      return true;
    },
  );
}

function sortNewestFirst(
  articles,
) {
  return [...articles].sort(
    (first, second) => {
      const firstTime =
        first?.publishedAt
          ? new Date(
              first.publishedAt,
            ).getTime()
          : 0;

      const secondTime =
        second?.publishedAt
          ? new Date(
              second.publishedAt,
            ).getTime()
          : 0;

      return (
        secondTime -
        firstTime
      );
    },
  );
}

async function searchWithLibrary(
  query,
) {
  try {
    const result =
      await yahooFinance.search(
        query,
        {
          quotesCount: 1,
          newsCount: 10,
          enableFuzzyQuery: true,
        },
      );

    return Array.isArray(
      result?.news,
    )
      ? result.news
      : [];
  } catch (error) {
    console.warn(
      `Yahoo library news search failed for "${query}":`,
      error instanceof Error
        ? error.message
        : error,
    );

    return [];
  }
}

async function searchDirectly(
  query,
) {
  const parameters =
    new URLSearchParams({
      q: query,
      quotesCount: "1",
      newsCount: "10",
      enableFuzzyQuery: "true",
      region: "IN",
      lang: "en-IN",
    });

  const url =
    `https://query2.finance.yahoo.com/v1/finance/search?${parameters.toString()}`;

  try {
    const response = await fetch(
      url,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
          "User-Agent":
            "Mozilla/5.0 EXA-Market-News/1.0",
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Yahoo returned ${response.status}.`,
      );
    }

    const data =
      await response.json();

    return Array.isArray(
      data?.news,
    )
      ? data.news
      : [];
  } catch (error) {
    console.warn(
      `Direct Yahoo news search failed for "${query}":`,
      error instanceof Error
        ? error.message
        : error,
    );

    return [];
  }
}

async function loadIndianMarketNews() {
  const libraryResults =
    await Promise.allSettled(
      NEWS_QUERIES.map(
        searchWithLibrary,
      ),
    );

  let rawArticles =
    libraryResults.flatMap(
      (result) =>
        result.status ===
        "fulfilled"
          ? result.value
          : [],
    );

  /*
   * When the package returns no news,
   * retry through Yahoo's underlying
   * search endpoint.
   */
  if (rawArticles.length === 0) {
    const directResults =
      await Promise.allSettled(
        NEWS_QUERIES.map(
          searchDirectly,
        ),
      );

    rawArticles =
      directResults.flatMap(
        (result) =>
          result.status ===
          "fulfilled"
            ? result.value
            : [],
      );
  }

  const normalizedArticles =
    rawArticles
      .map(normalizeArticle)
      .filter(
        (article) =>
          article.title &&
          article.url,
      );

  return sortNewestFirst(
    removeDuplicateArticles(
      normalizedArticles,
    ),
  ).slice(0, 12);
}

export default async function handler(
  request,
  response,
) {
  if (request.method !== "GET") {
    response.setHeader(
      "Allow",
      "GET",
    );

    return response
      .status(405)
      .json({
        success: false,
        error:
          "Method not allowed.",
      });
  }

  try {
    const forceRefresh =
      request.query?.refresh ===
      "1";

    const cacheIsValid =
      !forceRefresh &&
      newsCache.articles.length >
        0 &&
      Date.now() <
        newsCache.expiresAt;

    if (cacheIsValid) {
      response.setHeader(
        "Cache-Control",
        "public, s-maxage=300, stale-while-revalidate=600",
      );

      return response
        .status(200)
        .json({
          success: true,
          source:
            "Yahoo Finance",
          region: "India",
          cached: true,
          fetchedAt:
            newsCache.fetchedAt,
          articleCount:
            newsCache.articles
              .length,
          articles:
            newsCache.articles,
        });
    }

    const articles =
      await loadIndianMarketNews();

    const fetchedAt =
      new Date().toISOString();

    /*
     * Return success even when Yahoo
     * temporarily provides no news.
     * The frontend will then display
     * the educational fallback stories.
     */
    if (articles.length === 0) {
      return response
        .status(200)
        .json({
          success: true,
          source:
            "Yahoo Finance",
          region: "India",
          cached: false,
          fetchedAt,
          articleCount: 0,
          articles: [],
          warning:
            "Yahoo Finance returned no current articles. Fallback content may be displayed.",
        });
    }

    newsCache = {
      articles,
      fetchedAt,
      expiresAt:
        Date.now() +
        CACHE_DURATION_MS,
    };

    response.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );

    return response
      .status(200)
      .json({
        success: true,
        source:
          "Yahoo Finance",
        region: "India",
        cached: false,
        fetchedAt,
        articleCount:
          articles.length,
        articles,
      });
  } catch (error) {
    console.error(
      "Market news API error:",
      error,
    );

    return response
      .status(500)
      .json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load Indian market news.",
        articles: [],
      });
  }
}