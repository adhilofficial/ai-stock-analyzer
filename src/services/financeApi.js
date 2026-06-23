const configuredApiUrl =
  import.meta.env.VITE_API_BASE_URL
    ?.trim()
    .replace(/\/$/, "");

const isLocalBrowser =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

const API_BASE_URL =
  configuredApiUrl ||
  (isLocalBrowser
    ? "http://localhost:3001"
    : "");

async function readResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  const rawText = await response.text();

  if (!contentType.includes("application/json")) {
    console.error("Expected JSON but received:", {
      url: response.url,
      status: response.status,
      contentType,
      response: rawText.slice(0, 300),
    });

    throw new Error(
      `The API returned ${response.status} instead of JSON. Check that the backend is running and that Vercel is not rewriting API requests.`,
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
    const error = new Error(
      data?.error?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`,
    );

    error.status = response.status;
    error.code = data?.error?.code;

    throw error;
  }

  return data;
}

export async function searchStocks(query) {
  const response = await fetch(
    `${API_BASE_URL}/api/stocks/search?q=${encodeURIComponent(
      query,
    )}`,
  );

  return readResponse(response);
}

export async function getStockData(
  symbol,
  range = "1d",
) {
  const response = await fetch(
    `${API_BASE_URL}/api/stocks/${encodeURIComponent(
      symbol,
    )}?range=${encodeURIComponent(range)}`,
  );

  return readResponse(response);
}

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
      }),
    },
  );

  const data = await readResponse(response);

  const rawAiText =
    data?.content?.[0]?.text || "";

  if (!rawAiText) {
    throw new Error(
      "The AI summary response was empty.",
    );
  }

  const cleanedText = rawAiText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  let parsedAnalysis;

  try {
    parsedAnalysis = JSON.parse(cleanedText);
  } catch {
    console.error(
      "Invalid Gemini response:",
      cleanedText,
    );

    throw new Error(
      "The AI returned an invalid analysis format.",
    );
  }

  return {
    ...parsedAnalysis,
    aiSummaryCached: Boolean(
      data.aiSummaryCached,
    ),
  };
}