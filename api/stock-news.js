

import yahooFinance from "./_lib/yahooFinance.js";

const newsCache = new Map();

const CACHE_DURATION =
  3 * 60 * 1000;

const FILTER_VERSION =
  "strict-company-news-v3";

const LEGAL_COMPANY_WORDS =
  new Set([
    "limited",
    "ltd",
    "plc",
    "inc",
    "incorporated",
    "corporation",
    "corp",
    "company",
    "co",
    "group",
    "holdings",
    "holding",
    "enterprises",
  ]);

const CONNECTOR_WORDS =
  new Set([
    "and",
    "of",
    "the",
    "for",
    "in",
    "on",
    "at",
    "private",
    "public",
  ]);

const GENERIC_BRAND_WORDS =
  new Set([
    "bank",
    "state",
    "national",
    "indian",
    "india",
    "asian",
    "power",
    "financial",
    "general",
    "global",
    "new",
    "united",
  ]);

function cleanText(
  value,
  fallback = "",
) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  return text || fallback;
}

function normalizeForMatching(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTicker(value) {
  return cleanText(value)
    .toUpperCase()
    .replace(/\s+/g, "");
}

function removeExchangeSuffix(
  ticker,
) {
  return normalizeTicker(ticker)
    .replace(/\.(NS|BO)$/i, "");
}

function containsWholeTerm(
  text,
  term,
) {
  const normalizedText =
    normalizeForMatching(text);

  const normalizedTerm =
    normalizeForMatching(term);

  if (
    !normalizedText ||
    !normalizedTerm
  ) {
    return false;
  }

  return (
    ` ${normalizedText} `.includes(
      ` ${normalizedTerm} `,
    )
  );
}

function safeUrl(value) {
  if (!value) {
    return "";
  }

  try {
    const url =
      new URL(String(value));

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return "";
    }

    return url.toString();
  } catch {
    return "";
  }
}

function normalizePublishedDate(
  value,
) {
  if (!value) {
    return null;
  }

  let normalizedValue = value;

  if (
    typeof normalizedValue ===
      "number" &&
    normalizedValue <
      1_000_000_000_000
  ) {
    normalizedValue *= 1000;
  }

  const date =
    new Date(normalizedValue);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return null;
  }

  return date.toISOString();
}

function getThumbnail(newsItem) {
  const resolutions =
    newsItem?.thumbnail
      ?.resolutions;

  if (
    Array.isArray(resolutions)
  ) {
    const validImage =
      resolutions.find(
        (resolution) =>
          safeUrl(
            resolution?.url,
          ),
      );

    if (validImage?.url) {
      return safeUrl(
        validImage.url,
      );
    }
  }

  return safeUrl(
    newsItem?.thumbnail
      ?.originalUrl ||
      newsItem?.thumbnail?.url,
  );
}

function getCompanyIdentity(
  company,
) {
  const allWords =
    normalizeForMatching(company)
      .split(" ")
      .filter(Boolean);

  const meaningfulWords =
    allWords.filter(
      (word) =>
        !LEGAL_COMPANY_WORDS.has(
          word,
        ) &&
        !CONNECTOR_WORDS.has(
          word,
        ),
    );

  const corePhrase =
    meaningfulWords.join(" ");

  const acronym =
    meaningfulWords
      .map((word) =>
        word.charAt(0),
      )
      .join("");

  const primaryBrand =
    meaningfulWords[0] || "";

  return {
    meaningfulWords,
    corePhrase,
    acronym,
    primaryBrand,
  };
}

function getRelatedTickers(
  newsItem,
) {
  if (
    !Array.isArray(
      newsItem?.relatedTickers,
    )
  ) {
    return [];
  }

  return newsItem.relatedTickers
    .map(normalizeTicker)
    .filter(Boolean);
}

function evaluateNewsRelevance({
  newsItem,
  symbol,
  companyIdentity,
}) {
  const title = cleanText(
    newsItem?.title,
  );

  if (!title) {
    return {
      relevant: false,
      score: 0,
    };
  }

  const normalizedSymbol =
    normalizeTicker(symbol);

  const baseSymbol =
    removeExchangeSuffix(
      normalizedSymbol,
    );

  const relatedTickers =
    getRelatedTickers(
      newsItem,
    );

  const tickerMatch =
    relatedTickers.some(
      (ticker) => {
        const tickerBase =
          removeExchangeSuffix(
            ticker,
          );

        return (
          ticker ===
            normalizedSymbol ||
          tickerBase ===
            baseSymbol
        );
      },
    );

  const exactCompanyMatch =
    companyIdentity
      .corePhrase &&
    normalizeForMatching(
      title,
    ).includes(
      companyIdentity
        .corePhrase,
    );

  const acronymMatch =
    companyIdentity.acronym
      .length >= 3 &&
    containsWholeTerm(
      title,
      companyIdentity.acronym,
    );

  const primaryBrand =
    companyIdentity
      .primaryBrand;

  const distinctiveBrandMatch =
    primaryBrand.length >= 4 &&
    !GENERIC_BRAND_WORDS.has(
      primaryBrand,
    ) &&
    containsWholeTerm(
      title,
      primaryBrand,
    );

  const matchingCompanyWords =
    companyIdentity
      .meaningfulWords
      .filter(
        (word) =>
          word.length >= 4 &&
          containsWholeTerm(
            title,
            word,
          ),
      );

  const multipleWordMatch =
    matchingCompanyWords
      .length >= 2;

  /*
   * An article must satisfy at
   * least one strong condition.
   *
   * Recency alone never makes an
   * article relevant.
   */
  const relevant =
    tickerMatch ||
    exactCompanyMatch ||
    acronymMatch ||
    distinctiveBrandMatch ||
    multipleWordMatch;

  let score = 0;

  if (tickerMatch) {
    score += 100;
  }

  if (exactCompanyMatch) {
    score += 80;
  }

  if (acronymMatch) {
    score += 65;
  }

  if (
    distinctiveBrandMatch
  ) {
    score += 55;
  }

  if (multipleWordMatch) {
    score += 45;
  }

  score +=
    matchingCompanyWords
      .length * 5;

  return {
    relevant,
    score,
  };
}

function normalizeNewsItem(
  newsItem,
  index,
) {
  const title = cleanText(
    newsItem?.title,
    "Market update",
  );

  const link = safeUrl(
    newsItem?.link ||
      newsItem?.url,
  );

  return {
    id:
      cleanText(
        newsItem?.uuid,
      ) ||
      link ||
      `${title}-${index}`,

    title,

    publisher: cleanText(
      newsItem?.publisher ||
        newsItem?.provider,
      "Market News",
    ),

    link,

    thumbnail:
      getThumbnail(newsItem),

    publishedAt:
      normalizePublishedDate(
        newsItem
          ?.providerPublishTime ||
          newsItem?.publishedAt ||
          newsItem?.pubDate,
      ),

    type: cleanText(
      newsItem?.type,
      "STORY",
    ),

    relatedTickers:
      getRelatedTickers(
        newsItem,
      ),
  };
}

async function searchYahooNews(
  query,
) {
  const cleanedQuery =
    cleanText(query);

  if (!cleanedQuery) {
    return [];
  }

  const result =
    await yahooFinance.search(
      cleanedQuery,
      {
        quotesCount: 0,

        newsCount: 30,

        /*
         * Fuzzy search caused Yahoo
         * to return unrelated global
         * financial news.
         */
        enableFuzzyQuery: false,
      },
    );

  return Array.isArray(
    result?.news,
  )
    ? result.news
    : [];
}

export default async function handler(
  request,
  response,
) {
  /*
   * Disable CDN caching while the
   * strict news filter is being used.
   */
  response.setHeader(
    "Cache-Control",
    "no-store, max-age=0",
  );

  if (
    request.method !== "GET"
  ) {
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

        news: [],
      });
  }

  const symbol = cleanText(
    request.query?.symbol,
  ).toUpperCase();

  const company = cleanText(
    request.query?.company,
  );

  const forceRefresh =
    String(
      request.query?.refresh ||
        "",
    ) === "1";

  if (!symbol && !company) {
    return response
      .status(400)
      .json({
        success: false,

        error:
          "A stock symbol or company name is required.",

        news: [],
      });
  }

  const companyIdentity =
    getCompanyIdentity(company);

  const baseSymbol =
    removeExchangeSuffix(
      symbol,
    );

  const cacheKey = [
    FILTER_VERSION,
    symbol,
    company.toLowerCase(),
  ].join(":");

  const cachedResult =
    newsCache.get(cacheKey);

  if (
    !forceRefresh &&
    cachedResult &&
    Date.now() -
      cachedResult.createdAt <
      CACHE_DURATION
  ) {
    return response
      .status(200)
      .json({
        ...cachedResult.data,
        cached: true,
      });
  }

  try {
    /*
     * Search only focused company
     * queries. Do not search broad
     * market keywords.
     */
    const queries = [
      symbol,
      companyIdentity
        .corePhrase,
      baseSymbol,
    ]
      .map(cleanText)
      .filter(Boolean);

    const uniqueQueries = [
      ...new Set(queries),
    ];

    const searchResults =
      await Promise.allSettled(
        uniqueQueries.map(
          searchYahooNews,
        ),
      );

    const yahooNews =
      searchResults.flatMap(
        (result) =>
          result.status ===
          "fulfilled"
            ? result.value
            : [],
      );

    const relevantItems =
      yahooNews
        .map((newsItem) => {
          const relevance =
            evaluateNewsRelevance({
              newsItem,
              symbol,
              companyIdentity,
            });

          return {
            newsItem,
            ...relevance,
          };
        })
        .filter(
          (item) =>
            item.relevant,
        )
        .sort(
          (first, second) => {
            if (
              second.score !==
              first.score
            ) {
              return (
                second.score -
                first.score
              );
            }

            const firstDate =
              normalizePublishedDate(
                first.newsItem
                  ?.providerPublishTime,
              );

            const secondDate =
              normalizePublishedDate(
                second.newsItem
                  ?.providerPublishTime,
              );

            return (
              new Date(
                secondDate || 0,
              ).getTime() -
              new Date(
                firstDate || 0,
              ).getTime()
            );
          },
        );

    const seenItems =
      new Set();

    const news = relevantItems
      .map(
        (
          { newsItem },
          index,
        ) =>
          normalizeNewsItem(
            newsItem,
            index,
          ),
      )
      .filter((item) => {
        if (
          !item.title ||
          !item.link
        ) {
          return false;
        }

        const duplicateKey =
          normalizeForMatching(
            item.title,
          );

        if (
          seenItems.has(
            duplicateKey,
          )
        ) {
          return false;
        }

        seenItems.add(
          duplicateKey,
        );

        return true;
      })
      .slice(0, 7);

    const data = {
      success: true,

      symbol,

      company:
        company ||
        baseSymbol ||
        symbol,

      source:
        "Yahoo Finance",

      filter:
        "Strict company relevance",

      fetchedAt:
        new Date().toISOString(),

      cached: false,

      news,
    };

    newsCache.set(cacheKey, {
      createdAt: Date.now(),
      data,
    });

    return response
      .status(200)
      .json(data);
  } catch (error) {
    console.error(
      "Stock news API error:",
      error,
    );

    return response
      .status(500)
      .json({
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Unable to load stock-related news.",

        news: [],
      });
  }
}
