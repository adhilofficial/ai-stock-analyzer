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

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  try {
    const query = String(
      getQueryValue(req.query?.q),
    ).trim();

    if (!query) {
      return res.status(400).json({
        error: "Please enter a company name or stock symbol.",
      });
    }

    const yahooFinance = await getYahooFinance();

    const searchResult = await yahooFinance.search(query, {
      quotesCount: 10,
      newsCount: 0,
    });

    const stocks = (searchResult?.quotes || [])
      .filter(
        (item) =>
          item?.symbol &&
          item?.quoteType === "EQUITY",
      )
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
          item.quoteType ||
          null,
      }));

    return res.status(200).json({
      stocks,
    });
  } catch (error) {
    console.error("Stock search function error:", error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Unable to search for stocks.",
    });
  }
}