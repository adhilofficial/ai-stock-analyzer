
/*
 * Local development uses the Express server on port 3001.
 * Vercel production uses the same website domain.
 */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
    ?.trim()
    .replace(/\/$/, "") || "";

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
    data = rawText ? JSON.parse(rawText) : {};
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
    error.code = data?.error?.code || "";

    throw error;
  }

  return data;
}

/*
 * Correct deployed function:
 * api/stock-search.js
 */
export async function searchStocks(query) {
  const url =
    `${API_BASE_URL}/api/stock-search` +
    `?q=${encodeURIComponent(query)}`;

  const response = await fetch(url);

  const data = await readResponse(response);

  /*
   * The new API returns an array directly.
   * These alternatives also protect against
   * older wrapped API response formats.
   */
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
 * Correct deployed function:
 * api/stock-data.js
 */
export async function getStockData(
  symbol,
  range = "1d",
) {
  const url =
    `${API_BASE_URL}/api/stock-data` +
    `?symbol=${encodeURIComponent(symbol)}` +
    `&range=${encodeURIComponent(range)}`;

  const response = await fetch(url);
  const data = await readResponse(response);

  /*
   * The corrected API returns the stock object directly.
   * The other cases support any older response shape.
   */
  if (data?.symbol) {
    return data;
  }

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
 * Correct deployed function:
 * api/analyze.js
 */
export async function getAiAnalysis(stockData) {
  const response = await fetch(
    `${API_BASE_URL}/api/analyze`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        symbol: stockData.symbol,

        messages: [
          {
            content: `Analyze ${
              stockData.name || stockData.symbol
            }`,
          },
        ],

        stockData,
      }),
    },
  );

  const data = await readResponse(response);

  /*
   * Handle a friendly AI-unavailable response.
   */
  if (data?.aiUnavailable) {
    throw new Error(
      data?.error?.message ||
        "The AI summary is temporarily unavailable.",
    );
  }

  /*
   * Format 1:
   * API returns the analysis object directly.
   */
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    data.summary
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
   * API returns { analysis: {...} }
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
   * API returns { result: {...} }
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
   * API returns { data: {...} }
   */
  if (
    data?.data &&
    typeof data.data === "object" &&
    data.data.summary
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
   * Your Express-style response:
   * { content: [{ type: "text", text: "..." }] }
   */
  const rawAiText =
    data?.content?.[0]?.text ||
    data?.text ||
    data?.candidates?.[0]?.content?.parts?.[0]
      ?.text ||
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

  /*
   * The AI text may already be an object.
   */
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

  const cleanedText = String(rawAiText)
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
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