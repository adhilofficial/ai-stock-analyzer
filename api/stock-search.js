import YahooFinance from "yahoo-finance2";

import yahooFinance from "./_lib/yahooFinance.js";

export default async function handler(req, res) {
  // Allow only GET requests
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only GET requests are allowed.",
      },
    });
  }

  try {
    const query = String(
      req.query?.q ||
        req.query?.query ||
        "",
    ).trim();

    if (!query) {
      return res.status(400).json({
        error: {
          code: "SEARCH_QUERY_REQUIRED",
          message:
            "Please enter a company name or stock symbol.",
        },
      });
    }

    console.log("Searching Yahoo Finance for:", query);

    /*
     * First Yahoo search.
     * yahoo-finance2 search() returns an object
     * containing a quotes array.
     */
    let searchResult =
      await yahooFinance.search(query, {
        quotesCount: 20,
        newsCount: 0,
      });

    let quotes = Array.isArray(searchResult?.quotes)
      ? searchResult.quotes
      : [];

    /*
     * When a normal company-name search returns nothing,
     * retry with India/NSE added.
     */
    if (quotes.length === 0) {
      searchResult = await yahooFinance.search(
        `${query} NSE India`,
        {
          quotesCount: 20,
          newsCount: 0,
        },
      );

      quotes = Array.isArray(searchResult?.quotes)
        ? searchResult.quotes
        : [];
    }

    const supportedTypes = new Set([
      "EQUITY",
      "ETF",
      "MUTUALFUND",
      "INDEX",
      "CRYPTOCURRENCY",
    ]);

    const stocks = quotes
      .filter((item) => {
        return (
          item?.symbol &&
          (!item.quoteType ||
            supportedTypes.has(item.quoteType))
        );
      })
      .map((item) => ({
        symbol: item.symbol,

        name:
          item.longname ||
          item.shortname ||
          item.name ||
          item.symbol,

        exchange:
          item.exchDisp ||
          item.exchange ||
          null,

        quoteType:
          item.quoteType || null,

        type:
          item.typeDisp ||
          item.quoteType ||
          null,
      }))
      .sort((first, second) => {
        /*
         * Prefer NSE results, then BSE,
         * then all other markets.
         */
        const getPriority = (stock) => {
          if (stock.symbol?.endsWith(".NS")) {
            return 0;
          }

          if (stock.symbol?.endsWith(".BO")) {
            return 1;
          }

          return 2;
        };

        return (
          getPriority(first) -
          getPriority(second)
        );
      });

    console.log(
      `Yahoo returned ${stocks.length} results for "${query}"`,
    );

    return res.status(200).json(stocks);
  } catch (error) {
    console.error(
      "Yahoo Finance search failed:",
      error,
    );

    return res.status(500).json({
      error: {
        code: "STOCK_SEARCH_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Unable to search Yahoo Finance.",
      },
    });
  }
}