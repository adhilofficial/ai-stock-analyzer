const PRIMARY_GEMINI_MODEL =
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash-lite";

const FALLBACK_GEMINI_MODEL =
  process.env.GEMINI_FALLBACK_MODEL ||
  "gemini-2.5-flash";

const GEMINI_MODELS = [
  ...new Set([
    PRIMARY_GEMINI_MODEL,
    FALLBACK_GEMINI_MODEL,
  ]),
];

const AI_CACHE_DURATION = 30 * 60 * 1000;
const MAX_ATTEMPTS_PER_MODEL = 2;
const REQUEST_TIMEOUT_MS = 25_000;
const CACHE_VERSION = "v3";

const RETRYABLE_HTTP_STATUSES = new Set([
  500,
  502,
  503,
  504,
]);

const aiSummaryCache =
  globalThis.__exaAiSummaryCache ||
  new Map();

globalThis.__exaAiSummaryCache =
  aiSummaryCache;

const inFlightAnalyses =
  globalThis.__exaInFlightAnalyses ||
  new Map();

globalThis.__exaInFlightAnalyses =
  inFlightAnalyses;

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,

  properties: {
    signal: {
      type: "string",
      enum: [
        "BUY",
        "SELL",
        "NEUTRAL",
        "WATCH",
      ],
    },

    confidenceScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },

    riskLevel: {
      type: "string",
      enum: [
        "Low",
        "Moderate",
        "High",
      ],
    },

    summary: {
      type: "string",
    },

    keyThemes: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "string",
      },
    },

    growthDrivers: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "string",
      },
    },

    keyRisks: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: {
        type: "string",
      },
    },

    fundamentalScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },

    momentumScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },

    valuationScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },

    sentimentScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },
  },

  required: [
    "signal",
    "confidenceScore",
    "riskLevel",
    "summary",
    "keyThemes",
    "growthDrivers",
    "keyRisks",
    "fundamentalScore",
    "momentumScore",
    "valuationScore",
    "sentimentScore",
  ],
};

const SYSTEM_PROMPT = `
You are the AI research engine for Litses,
an Indian financial-market research platform.

You will receive verified stock-market data retrieved
from Yahoo Finance.

Use the supplied information only for educational
financial research.

Never invent or modify these supplied values:

- Company name
- Stock symbol
- Exchange
- Current market price
- Previous close
- Daily price change
- Daily percentage change
- Market capitalisation
- P/E ratio
- 52-week low
- 52-week high
- Trading volume
- Sector
- Industry

Provide an objective assessment based only on the
available verified data.

Signal definitions:

BUY:
The supplied information shows broadly favourable
fundamental, momentum, valuation and risk conditions.

SELL:
The supplied information shows materially negative
conditions or unusually high risk.

NEUTRAL:
The positive and negative factors are balanced.

WATCH:
The information is incomplete, mixed, uncertain, or
requires monitoring before forming a stronger view.

Scoring rules:

- All scores must be whole numbers between 0 and 100.
- A higher fundamental score means stronger fundamentals.
- A higher momentum score means stronger positive momentum.
- A higher valuation score means a more attractive valuation.
- A higher sentiment score means more positive sentiment.
- Confidence measures confidence in the research assessment,
  not the probability of making a profit.

The summary must contain two or three concise sentences.

Do not promise returns.
Do not provide personalised investment advice.
Do not instruct the user to invest a particular amount.
Do not claim that any outcome is guaranteed.

Return only the requested structured JSON.
`;

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function safeNumber(
  value,
  fallback = 0,
) {
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

function nullableNumber(value) {
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

function clampScore(value) {
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        safeNumber(value),
      ),
    ),
  );
}

function cleanString(
  value,
  fallback = "",
) {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value.trim();

  return cleaned || fallback;
}

function cleanArray(
  value,
  maximum,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item) =>
        typeof item === "string" &&
        item.trim(),
    )
    .map((item) => item.trim())
    .slice(0, maximum);
}

function normalizeSignal(value) {
  const signal = String(
    value || "",
  ).toUpperCase();

  const allowedSignals = new Set([
    "BUY",
    "SELL",
    "NEUTRAL",
    "WATCH",
  ]);

  return allowedSignals.has(signal)
    ? signal
    : "WATCH";
}

function normalizeRiskLevel(value) {
  const normalized = String(
    value || "",
  ).toLowerCase();

  if (normalized === "low") {
    return "Low";
  }

  if (normalized === "high") {
    return "High";
  }

  return "Moderate";
}

function fundamentalLabel(score) {
  if (score >= 70) {
    return "Strong";
  }

  if (score >= 40) {
    return "Moderate";
  }

  return "Weak";
}

function momentumLabel(score) {
  if (score >= 70) {
    return "Positive";
  }

  if (score >= 40) {
    return "Neutral";
  }

  return "Negative";
}

function valuationLabel(score) {
  if (score >= 70) {
    return "Attractive";
  }

  if (score >= 40) {
    return "Fair";
  }

  return "Expensive";
}

function sentimentLabel(score) {
  if (score >= 70) {
    return "Positive";
  }

  if (score >= 40) {
    return "Neutral";
  }

  return "Negative";
}

function displayTicker(symbol) {
  const normalizedSymbol = String(
    symbol || "",
  ).toUpperCase();

  if (
    normalizedSymbol.endsWith(".NS")
  ) {
    return `NSE:${normalizedSymbol.replace(
      ".NS",
      "",
    )}`;
  }

  if (
    normalizedSymbol.endsWith(".BO")
  ) {
    return `BSE:${normalizedSymbol.replace(
      ".BO",
      "",
    )}`;
  }

  return normalizedSymbol || "N/A";
}

function getLogoDomain(stockData) {
  if (stockData?.logoDomain) {
    return stockData.logoDomain;
  }

  if (!stockData?.website) {
    return "";
  }

  try {
    return new URL(
      stockData.website,
    ).hostname.replace(
      /^www\./,
      "",
    );
  } catch {
    return "";
  }
}

function createMarketContext(
  stockData,
) {
  return {
    company:
      stockData.name || null,

    symbol:
      stockData.symbol || null,

    exchange:
      stockData.exchange || null,

    currency:
      stockData.currency || null,

    marketState:
      stockData.marketState || null,

    price:
      nullableNumber(
        stockData.price,
      ),

    previousClose:
      nullableNumber(
        stockData.previousClose,
      ),

    change:
      nullableNumber(
        stockData.change,
      ),

    changePercent:
      nullableNumber(
        stockData.changePercent,
      ),

    marketCap:
      nullableNumber(
        stockData.marketCap,
      ),

    peRatioTTM:
      nullableNumber(
        stockData.peRatioTTM,
      ),

    fiftyTwoWeekLow:
      nullableNumber(
        stockData.fiftyTwoWeekLow,
      ),

    fiftyTwoWeekHigh:
      nullableNumber(
        stockData.fiftyTwoWeekHigh,
      ),

    volume:
      nullableNumber(
        stockData.volume,
      ),

    sector:
      stockData.sector || null,

    industry:
      stockData.industry || null,

    businessSummary:
      typeof stockData.businessSummary ===
      "string"
        ? stockData.businessSummary.slice(
            0,
            4000,
          )
        : null,
  };
}

function normalizeAiAnalysis(
  aiAnalysis,
) {
  const fundamentalScoreValue =
    clampScore(
      aiAnalysis.fundamentalScore,
    );

  const momentumScoreValue =
    clampScore(
      aiAnalysis.momentumScore,
    );

  const valuationScoreValue =
    clampScore(
      aiAnalysis.valuationScore,
    );

  const sentimentScoreValue =
    clampScore(
      aiAnalysis.sentimentScore,
    );

  return {
    signal:
      normalizeSignal(
        aiAnalysis.signal,
      ),

    confidenceScore:
      clampScore(
        aiAnalysis.confidenceScore,
      ),

    riskLevel:
      normalizeRiskLevel(
        aiAnalysis.riskLevel,
      ),

    summary:
      cleanString(
        aiAnalysis.summary,
        "The AI research summary is currently unavailable.",
      ),

    keyThemes:
      cleanArray(
        aiAnalysis.keyThemes,
        3,
      ),

    growthDrivers:
      cleanArray(
        aiAnalysis.growthDrivers,
        4,
      ),

    keyRisks:
      cleanArray(
        aiAnalysis.keyRisks,
        4,
      ),

    fundamentalScore:
      fundamentalScoreValue,

    fundamentalLabel:
      fundamentalLabel(
        fundamentalScoreValue,
      ),

    momentumScore:
      momentumScoreValue,

    momentumLabel:
      momentumLabel(
        momentumScoreValue,
      ),

    valuationScore:
      valuationScoreValue,

    valuationLabel:
      valuationLabel(
        valuationScoreValue,
      ),

    sentimentScore:
      sentimentScoreValue,

    sentimentLabel:
      sentimentLabel(
        sentimentScoreValue,
      ),
  };
}

function buildResult(
  stockData,
  aiAnalysis,
) {
  return {
    company:
      stockData.name ||
      stockData.symbol,

    symbol:
      stockData.symbol,

    ticker:
      displayTicker(
        stockData.symbol,
      ),

    sector:
      stockData.sector ||
      "N/A",

    industry:
      stockData.industry ||
      "N/A",

    logoDomain:
      getLogoDomain(
        stockData,
      ),

    price:
      nullableNumber(
        stockData.price,
      ),

    changeAbs:
      nullableNumber(
        stockData.change,
      ) ?? 0,

    changePercent:
      nullableNumber(
        stockData.changePercent,
      ) ?? 0,

    marketCap:
      nullableNumber(
        stockData.marketCap,
      ),

    peRatio:
      nullableNumber(
        stockData.peRatioTTM,
      ),

    week52Low:
      nullableNumber(
        stockData.fiftyTwoWeekLow,
      ),

    week52High:
      nullableNumber(
        stockData.fiftyTwoWeekHigh,
      ),

    volume:
      nullableNumber(
        stockData.volume,
      ),

    chart:
      Array.isArray(
        stockData.chart,
      )
        ? stockData.chart
        : [],

    source:
      stockData.source ||
      "Yahoo Finance",

    lastUpdated:
      stockData.lastUpdated ||
      null,

    ...aiAnalysis,
  };
}

function createSuccessPayload(
  result,
  cached,
  modelUsed,
) {
  return {
    ...result,

    result,

    analysis: result,

    content: [
      {
        type: "text",
        text: JSON.stringify(
          result,
        ),
      },
    ],

    aiSummaryCached:
      cached,

    modelUsed,
  };
}

function parseJsonSafely(
  rawText,
) {
  try {
    return rawText
      ? JSON.parse(rawText)
      : {};
  } catch {
    return {};
  }
}

function extractRetryAfter(data) {
  const details = Array.isArray(
    data?.error?.details,
  )
    ? data.error.details
    : [];

  for (const detail of details) {
    if (
      typeof detail?.retryDelay ===
      "string"
    ) {
      const seconds =
        Number.parseFloat(
          detail.retryDelay,
        );

      if (
        Number.isFinite(seconds)
      ) {
        return Math.max(
          1,
          Math.ceil(seconds),
        );
      }
    }
  }

  const message = String(
    data?.error?.message || "",
  );

  const match = message.match(
    /retry in ([\d.]+)s/i,
  );

  if (match) {
    return Math.max(
      1,
      Math.ceil(
        Number(match[1]),
      ),
    );
  }

  return 15;
}

function createGeminiRequestBody(
  marketContext,
) {
  return {
    systemInstruction: {
      parts: [
        {
          text: SYSTEM_PROMPT,
        },
      ],
    },

    contents: [
      {
        role: "user",

        parts: [
          {
            text:
              "Analyze this verified Yahoo Finance data:\n\n" +
              JSON.stringify(
                marketContext,
                null,
                2,
              ),
          },
        ],
      },
    ],

    generationConfig: {
      responseMimeType:
        "application/json",

      responseJsonSchema:
        ANALYSIS_SCHEMA,

      temperature: 0.2,

      maxOutputTokens: 1500,
    },
  };
}

async function requestGeminiOnce({
  model,
  apiKey,
  requestBody,
}) {
  const controller =
    new AbortController();

  const timeout = setTimeout(
    () => {
      controller.abort();
    },
    REQUEST_TIMEOUT_MS,
  );

  const url =
    "https://generativelanguage.googleapis.com/" +
    `v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent`;

  try {
    const response =
      await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "x-goog-api-key":
            apiKey,
        },

        body:
          JSON.stringify(
            requestBody,
          ),

        signal:
          controller.signal,
      });

    const rawText =
      await response.text();

    const data =
      parseJsonSafely(
        rawText,
      );

    return {
      ok: response.ok,
      status: response.status,
      data,
      rawText,
      model,
      networkError: null,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: {},
      rawText: "",
      model,

      networkError:
        error instanceof Error
          ? error.message
          : "Gemini network request failed.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function requestGeminiWithRetry({
  apiKey,
  requestBody,
}) {
  let lastResult = null;

  for (
    const model of GEMINI_MODELS
  ) {
    for (
      let attempt = 1;
      attempt <=
      MAX_ATTEMPTS_PER_MODEL;
      attempt += 1
    ) {
      const result =
        await requestGeminiOnce({
          model,
          apiKey,
          requestBody,
        });

      lastResult = result;

      if (result.ok) {
        return result;
      }

      if (
        result.status === 429
      ) {
        return result;
      }

      const retryable =
        result.status === 0 ||
        RETRYABLE_HTTP_STATUSES.has(
          result.status,
        );

      if (!retryable) {
        return result;
      }

      const hasAnotherAttempt =
        attempt <
        MAX_ATTEMPTS_PER_MODEL;

      const hasAnotherModel =
        model !==
        GEMINI_MODELS[
          GEMINI_MODELS.length - 1
        ];

      if (
        !hasAnotherAttempt &&
        !hasAnotherModel
      ) {
        return result;
      }

      const delay =
        750 *
          2 ** (attempt - 1) +
        Math.floor(
          Math.random() * 350,
        );

      console.warn(
        `Gemini ${model} returned ${
          result.status ||
          "NETWORK_ERROR"
        }. Retrying after ${delay}ms.`,
      );

      await wait(delay);
    }
  }

  return lastResult;
}

function getProviderCode(result) {
  return (
    result?.data?.error?.status ||
    (
      result?.status === 503
        ? "UNAVAILABLE"
        : "GEMINI_API_ERROR"
    )
  );
}

function getProviderMessage(
  result,
) {
  return (
    result?.data?.error?.message ||
    result?.networkError ||
    `Gemini request failed with status ${
      result?.status ||
      "unknown"
    }.`
  );
}

async function generateAnalysis({
  apiKey,
  marketContext,
}) {
  const requestBody =
    createGeminiRequestBody(
      marketContext,
    );

  return requestGeminiWithRetry({
    apiKey,
    requestBody,
  });
}

export default async function handler(
  req,
  res,
) {
  if (
    req.method !== "POST"
  ) {
    res.setHeader(
      "Allow",
      "POST",
    );

    return res.status(405).json({
      error: {
        code:
          "METHOD_NOT_ALLOWED",

        message:
          "Only POST requests are allowed.",
      },
    });
  }

  try {
    const apiKey =
      process.env.GEMINI_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: {
          code:
            "GEMINI_KEY_MISSING",

          message:
            "The Gemini API key is not configured on the server.",
        },

        aiUnavailable: true,
      });
    }

    const stockData =
      req.body?.stockData;

    if (
      !stockData?.symbol ||
      !stockData?.name
    ) {
      return res.status(400).json({
        error: {
          code:
            "STOCK_DATA_REQUIRED",

          message:
            "Verified Yahoo Finance stock data is required.",
        },

        aiUnavailable: true,
      });
    }

    const normalizedSymbol =
      String(
        stockData.symbol,
      ).toUpperCase();

    const cacheKey = [
      CACHE_VERSION,
      normalizedSymbol,
    ].join(":");

    const cachedItem =
      aiSummaryCache.get(
        cacheKey,
      );

    if (
      cachedItem &&
      Date.now() -
        cachedItem.createdAt <
        AI_CACHE_DURATION
    ) {
      const cachedResult =
        buildResult(
          stockData,
          cachedItem.analysis,
        );

      return res.status(200).json(
        createSuccessPayload(
          cachedResult,
          true,
          cachedItem.modelUsed,
        ),
      );
    }

    const marketContext =
      createMarketContext(
        stockData,
      );

    let analysisPromise =
      inFlightAnalyses.get(
        cacheKey,
      );

    if (!analysisPromise) {
      analysisPromise =
        generateAnalysis({
          apiKey,
          marketContext,
        });

      inFlightAnalyses.set(
        cacheKey,
        analysisPromise,
      );
    }

    let geminiResult;

    try {
      geminiResult =
        await analysisPromise;
    } finally {
      inFlightAnalyses.delete(
        cacheKey,
      );
    }

    if (!geminiResult) {
      return res.status(503).json({
        error: {
          code:
            "GEMINI_UNAVAILABLE",

          message:
            "The AI service is temporarily unavailable. Live Yahoo Finance data is still available.",
        },

        aiUnavailable: true,
      });
    }

    if (
      geminiResult.status === 429
    ) {
      const retryAfter =
        extractRetryAfter(
          geminiResult.data,
        );

      res.setHeader(
        "Retry-After",
        String(retryAfter),
      );

      return res.status(429).json({
        error: {
          code:
            "AI_RATE_LIMIT",

          message:
            `The Gemini quota or rate limit was reached. ` +
            `Live Yahoo Finance data is still available. ` +
            `Please retry in approximately ${retryAfter} seconds.`,
        },

        aiUnavailable: true,

        retryAfter,
      });
    }

    if (!geminiResult.ok) {
      const providerCode =
        getProviderCode(
          geminiResult,
        );

      const providerMessage =
        getProviderMessage(
          geminiResult,
        );

      console.error(
        "Gemini API failure:",
        {
          httpStatus:
            geminiResult.status,

          providerCode,

          providerMessage,

          model:
            geminiResult.model,

          details:
            geminiResult.data
              ?.error
              ?.details || [],
        },
      );

      const status =
        geminiResult.status >= 400
          ? geminiResult.status
          : 502;

      let publicMessage =
        "The AI summary is temporarily unavailable. Live Yahoo Finance data is still available.";

      if (
        providerCode ===
          "UNAVAILABLE" ||
        status === 503
      ) {
        publicMessage =
          "Gemini is temporarily overloaded. Live Yahoo Finance data is still available. Please try again shortly.";
      } else if (
        providerCode ===
        "PERMISSION_DENIED"
      ) {
        publicMessage =
          "The Gemini API key does not have permission to use this model.";
      } else if (
        providerCode ===
        "FAILED_PRECONDITION"
      ) {
        publicMessage =
          "Gemini billing or regional availability must be configured for this project.";
      } else if (
        providerCode ===
        "INVALID_ARGUMENT"
      ) {
        publicMessage =
          "Gemini rejected the analysis request. Check the model and structured-output settings.";
      } else if (
        providerCode ===
        "NOT_FOUND"
      ) {
        publicMessage =
          `The Gemini model "${geminiResult.model}" was not found or is unavailable for this API version.`;
      }

      return res
        .status(status)
        .json({
          error: {
            code:
              providerCode,

            message:
              publicMessage,
          },

          aiUnavailable: true,

          debug:
            process.env.NODE_ENV !==
            "production"
              ? {
                  httpStatus:
                    geminiResult.status,

                  providerCode,

                  providerMessage,

                  model:
                    geminiResult.model,
                }
              : undefined,
        });
    }

    const candidate =
      geminiResult.data
        ?.candidates?.[0];

    const text =
      candidate?.content?.parts
        ?.map(
          (part) =>
            part?.text || "",
        )
        .join("")
        .trim() || "";

    if (!text) {
      console.error(
        "Gemini returned no candidate text:",
        {
          model:
            geminiResult.model,

          promptFeedback:
            geminiResult.data
              ?.promptFeedback,

          finishReason:
            candidate?.finishReason,

          safetyRatings:
            candidate?.safetyRatings,
        },
      );

      return res.status(502).json({
        error: {
          code:
            "EMPTY_GEMINI_RESPONSE",

          message:
            "The AI provider returned no analysis. Live Yahoo Finance data is still available.",
        },

        aiUnavailable: true,
      });
    }

    const cleanText =
      text
        .replace(
          /^```json\s*/i,
          "",
        )
        .replace(
          /^```\s*/i,
          "",
        )
        .replace(
          /\s*```$/i,
          "",
        )
        .trim();

    let parsedAnalysis;

    try {
      parsedAnalysis =
        JSON.parse(
          cleanText,
        );
    } catch {
      console.error(
        "Invalid Gemini JSON:",
        cleanText,
      );

      return res.status(502).json({
        error: {
          code:
            "INVALID_AI_JSON",

          message:
            "The AI provider returned an invalid analysis format.",
        },

        aiUnavailable: true,
      });
    }

    const normalizedAnalysis =
      normalizeAiAnalysis(
        parsedAnalysis,
      );

    aiSummaryCache.set(
      cacheKey,
      {
        analysis:
          normalizedAnalysis,

        modelUsed:
          geminiResult.model,

        createdAt:
          Date.now(),
      },
    );

    const result =
      buildResult(
        stockData,
        normalizedAnalysis,
      );

    return res.status(200).json(
      createSuccessPayload(
        result,
        false,
        geminiResult.model,
      ),
    );
  } catch (error) {
    console.error(
      "Analyze function error:",
      error,
    );

    return res.status(500).json({
      error: {
        code:
          "ANALYZE_FUNCTION_ERROR",

        message:
          "The AI summary is temporarily unavailable. Live Yahoo Finance data is still available.",
      },

      aiUnavailable: true,

      debug:
        process.env.NODE_ENV !==
        "production"
          ? {
              message:
                error instanceof Error
                  ? error.message
                  : String(error),
            }
          : undefined,
    });
  }
}
