const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
)
  .trim()
  .replace(/\/$/, "");

async function readResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  const rawText = await response.text();

  if (!contentType.includes("application/json")) {
    console.error("Expected JSON but received:", {
      url: response.url,
      status: response.status,
      contentType,
      response: rawText.slice(0, 500),
    });

    throw new Error(
      `The API returned ${response.status} instead of JSON.`,
    );
  }

  let data;

  try {
    data = rawText
      ? JSON.parse(rawText)
      : {};
  } catch {
    throw new Error(
      "The server returned malformed JSON.",
    );
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      (typeof data?.error === "string"
        ? data.error
        : "") ||
      `Request failed with status ${response.status}.`;

    const error = new Error(message);

    error.status = response.status;
    error.code =
      data?.error?.code || "";

    error.retryAfter =
      data?.retryAfter || null;

    throw error;
  }

  return data;
}

/*
 * Searches stocks through:
 * api/stock-search.js
 */
export async function searchStocks(query) {
  const cleanedQuery =
    String(query || "").trim();

  if (!cleanedQuery) {
    return [];
  }

  const url =
    `${API_BASE_URL}/api/stock-search` +
    `?q=${encodeURIComponent(cleanedQuery)}`;

  const response = await fetch(url);
  const data = await readResponse(response);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.stocks)) {
    return data.stocks;
  }

  if (Array.isArray(data?.quotes)) {
    return data.quotes;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  console.error(
    "Unexpected stock-search response:",
    data,
  );

  return [];
}

/*
 * Loads current price, metrics and chart through:
 * api/stock-data.js
 */
export async function getStockData(
  symbol,
  range = "1d",
) {
  const cleanedSymbol =
    String(symbol || "").trim();

  if (!cleanedSymbol) {
    throw new Error(
      "A stock symbol is required.",
    );
  }

  const cleanedRange =
    String(range || "1d").trim();

  const url =
    `${API_BASE_URL}/api/stock-data` +
    `?symbol=${encodeURIComponent(cleanedSymbol)}` +
    `&range=${encodeURIComponent(cleanedRange)}`;

  const response = await fetch(url);
  const data = await readResponse(response);

  // Current API format
  if (data?.symbol) {
    return data;
  }

  // Compatibility with older API formats
  if (data?.stockData?.symbol) {
    return data.stockData;
  }

  if (data?.data?.symbol) {
    return data.data;
  }

  console.error(
    "Incomplete stock-data response:",
    data,
  );

  throw new Error(
    "Yahoo Finance returned incomplete stock data.",
  );
}

/*
 * Loads Gemini analysis through:
 * api/analyze.js
 */
export async function getAiAnalysis(
  stockData,
) {
  if (
    !stockData?.symbol ||
    !stockData?.name
  ) {
    throw new Error(
      "Valid stock data is required for AI analysis.",
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/analyze`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        stockData,
      }),
    },
  );

  const data = await readResponse(response);

  if (data?.aiUnavailable) {
    throw new Error(
      data?.error?.message ||
        "The AI summary is temporarily unavailable.",
    );
  }

  /*
   * Format 1:
   * The result is returned at the top level.
   */
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    typeof data.summary === "string"
  ) {
    return {
      ...data,

      aiSummaryCached: Boolean(
        data.aiSummaryCached,
      ),
    };
  }

  /*
   * Format 2:
   * { analysis: {...} }
   */
  if (
    data?.analysis &&
    typeof data.analysis === "object"
  ) {
    return {
      ...data.analysis,

      aiSummaryCached: Boolean(
        data.aiSummaryCached,
      ),
    };
  }

  /*
   * Format 3:
   * { result: {...} }
   */
  if (
    data?.result &&
    typeof data.result === "object"
  ) {
    return {
      ...data.result,

      aiSummaryCached: Boolean(
        data.aiSummaryCached,
      ),
    };
  }

  /*
   * Format 4:
   * { data: {...} }
   */
  if (
    data?.data &&
    typeof data.data === "object" &&
    typeof data.data.summary === "string"
  ) {
    return {
      ...data.data,

      aiSummaryCached: Boolean(
        data.aiSummaryCached,
      ),
    };
  }

  /*
   * Format 5:
   * { content: [{ text: "{...}" }] }
   */
  const rawAiText =
    data?.content?.[0]?.text ||
    data?.text ||
    data?.candidates?.[0]
      ?.content?.parts?.[0]?.text ||
    "";

  if (!rawAiText) {
    console.error(
      "Unexpected /api/analyze response:",
      data,
    );

    throw new Error(
      data?.error?.message ||
        "The AI endpoint returned no summary.",
    );
  }

  if (
    typeof rawAiText === "object" &&
    rawAiText !== null
  ) {
    return {
      ...rawAiText,

      aiSummaryCached: Boolean(
        data.aiSummaryCached,
      ),
    };
  }

  const cleanedText =
    String(rawAiText)
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

  try {
    const parsedAnalysis =
      JSON.parse(cleanedText);

    return {
      ...parsedAnalysis,

      aiSummaryCached: Boolean(
        data.aiSummaryCached,
      ),
    };
  } catch {
    console.error(
      "Invalid Gemini response:",
      cleanedText,
    );

    throw new Error(
      "The AI returned an invalid analysis format.",
    );
  }
}