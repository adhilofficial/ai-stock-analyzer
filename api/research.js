const PRIMARY_GEMINI_MODEL =
  process.env.GEMINI_RESEARCH_MODEL ||
  process.env.GEMINI_MODEL ||
  "gemini-2.5-flash";

const FALLBACK_GEMINI_MODEL =
  process.env.GEMINI_FALLBACK_MODEL ||
  "gemini-2.5-flash-lite";

const GEMINI_MODELS = [
  ...new Set([
    PRIMARY_GEMINI_MODEL,
    FALLBACK_GEMINI_MODEL,
  ]),
];

const REQUEST_TIMEOUT_MS = 35_000;
const CACHE_DURATION_MS = 45 * 60 * 1000;
const CACHE_VERSION = "research-v1";

const researchCache =
  globalThis.__exaResearchCache ||
  new Map();

globalThis.__exaResearchCache =
  researchCache;

const inFlightResearch =
  globalThis.__exaInFlightResearch ||
  new Map();

globalThis.__exaInFlightResearch =
  inFlightResearch;

const RETRYABLE_STATUSES = new Set([
  500,
  502,
  503,
  504,
]);

const REPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    researchStance: {
      type: "string",
      enum: [
        "Positive",
        "Balanced",
        "Cautious",
        "Watch",
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
    executiveSummary: {
      type: "string",
    },
    businessOverview: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: {
          type: "string",
        },
        strengths: {
          type: "array",
          maxItems: 4,
          items: {
            type: "string",
          },
        },
        dependencies: {
          type: "array",
          maxItems: 4,
          items: {
            type: "string",
          },
        },
      },
      required: [
        "summary",
        "strengths",
        "dependencies",
      ],
    },
    industryPosition: {
      type: "object",
      additionalProperties: false,
      properties: {
        summary: {
          type: "string",
        },
        competitiveAdvantages: {
          type: "array",
          maxItems: 4,
          items: {
            type: "string",
          },
        },
        challenges: {
          type: "array",
          maxItems: 4,
          items: {
            type: "string",
          },
        },
      },
      required: [
        "summary",
        "competitiveAdvantages",
        "challenges",
      ],
    },
    fundamentalAnalysis: {
      type: "object",
      additionalProperties: false,
      properties: {
        score: {
          type: "integer",
          minimum: 0,
          maximum: 100,
        },
        summary: {
          type: "string",
        },
        positives: {
          type: "array",
          maxItems: 5,
          items: {
            type: "string",
          },
        },
        concerns: {
          type: "array",
          maxItems: 5,
          items: {
            type: "string",
          },
        },
      },
      required: [
        "score",
        "summary",
        "positives",
        "concerns",
      ],
    },
    valuationAnalysis: {
      type: "object",
      additionalProperties: false,
      properties: {
        score: {
          type: "integer",
          minimum: 0,
          maximum: 100,
        },
        summary: {
          type: "string",
        },
        interpretation: {
          type: "string",
        },
        positives: {
          type: "array",
          maxItems: 4,
          items: {
            type: "string",
          },
        },
        concerns: {
          type: "array",
          maxItems: 4,
          items: {
            type: "string",
          },
        },
      },
      required: [
        "score",
        "summary",
        "interpretation",
        "positives",
        "concerns",
      ],
    },
    technicalAnalysis: {
      type: "object",
      additionalProperties: false,
      properties: {
        score: {
          type: "integer",
          minimum: 0,
          maximum: 100,
        },
        trend: {
          type: "string",
          enum: [
            "Uptrend",
            "Sideways",
            "Downtrend",
            "Insufficient data",
          ],
        },
        summary: {
          type: "string",
        },
        supportNote: {
          type: "string",
        },
        resistanceNote: {
          type: "string",
        },
      },
      required: [
        "score",
        "trend",
        "summary",
        "supportNote",
        "resistanceNote",
      ],
    },
    growthDrivers: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
          },
          detail: {
            type: "string",
          },
          horizon: {
            type: "string",
            enum: [
              "Near term",
              "Medium term",
              "Long term",
            ],
          },
        },
        required: [
          "title",
          "detail",
          "horizon",
        ],
      },
    },
    keyRisks: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: {
            type: "string",
          },
          detail: {
            type: "string",
          },
          severity: {
            type: "string",
            enum: [
              "Low",
              "Moderate",
              "High",
            ],
          },
        },
        required: [
          "title",
          "detail",
          "severity",
        ],
      },
    },
    scenarios: {
      type: "object",
      additionalProperties: false,
      properties: {
        bull: {
          type: "object",
          additionalProperties: false,
          properties: {
            thesis: {
              type: "string",
            },
            conditions: {
              type: "array",
              maxItems: 4,
              items: {
                type: "string",
              },
            },
          },
          required: [
            "thesis",
            "conditions",
          ],
        },
        base: {
          type: "object",
          additionalProperties: false,
          properties: {
            thesis: {
              type: "string",
            },
            conditions: {
              type: "array",
              maxItems: 4,
              items: {
                type: "string",
              },
            },
          },
          required: [
            "thesis",
            "conditions",
          ],
        },
        bear: {
          type: "object",
          additionalProperties: false,
          properties: {
            thesis: {
              type: "string",
            },
            conditions: {
              type: "array",
              maxItems: 4,
              items: {
                type: "string",
              },
            },
          },
          required: [
            "thesis",
            "conditions",
          ],
        },
      },
      required: [
        "bull",
        "base",
        "bear",
      ],
    },
    watchItems: {
      type: "array",
      maxItems: 6,
      items: {
        type: "string",
      },
    },
    conclusion: {
      type: "string",
    },
  },
  required: [
    "researchStance",
    "confidenceScore",
    "riskLevel",
    "executiveSummary",
    "businessOverview",
    "industryPosition",
    "fundamentalAnalysis",
    "valuationAnalysis",
    "technicalAnalysis",
    "growthDrivers",
    "keyRisks",
    "scenarios",
    "watchItems",
    "conclusion",
  ],
};

const SYSTEM_PROMPT = `
You are the research engine for Litses, an Indian equity-market education and research platform.

You receive verified market and company data collected from Yahoo Finance. Build a structured research report using only the supplied information and cautious, clearly labelled inference.

Rules:
- Never invent financial figures, events, management commentary, market share, target prices or future results.
- When the supplied data is insufficient, explicitly say that the information is unavailable or that the conclusion is limited.
- Do not provide personalised investment advice.
- Do not tell the user to buy, sell, hold or invest a specific amount.
- Do not promise returns or imply certainty.
- Research stance means the overall quality of the available evidence, not a trading recommendation.
- Scenario analysis must describe conditions, not price targets.
- Support and resistance notes must be based only on supplied 52-week levels and chart statistics.
- Scores must be whole numbers from 0 to 100 and must reflect the quality of the available evidence.
- Keep the report concise, analytical and understandable to a retail investor.

Return only valid JSON matching the requested schema.
`;

function safeNumber(
  value,
  fallback = null,
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

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function clampScore(value) {
  return Math.min(
    100,
    Math.max(
      0,
      Math.round(
        safeNumber(value, 0),
      ),
    ),
  );
}

function cleanList(value, limit = 6) {
  return (Array.isArray(value) ? value : [])
    .map(cleanText)
    .filter(Boolean)
    .slice(0, limit);
}

function movingAverage(values, period) {
  if (
    !Array.isArray(values) ||
    values.length < period
  ) {
    return null;
  }

  const recent = values.slice(-period);
  const total = recent.reduce(
    (sum, value) =>
      sum + safeNumber(value, 0),
    0,
  );

  return total / recent.length;
}

function percentageChange(first, last) {
  const start = safeNumber(first);
  const end = safeNumber(last);

  if (
    start === null ||
    end === null ||
    start === 0
  ) {
    return null;
  }

  return ((end - start) / start) * 100;
}

function distancePercent(price, reference) {
  const current = safeNumber(price);
  const level = safeNumber(reference);

  if (
    current === null ||
    level === null ||
    level === 0
  ) {
    return null;
  }

  return ((current - level) / level) * 100;
}

function createChartSummary(stockData) {
  const chart = (
    Array.isArray(stockData?.chart)
      ? stockData.chart
      : []
  )
    .map((item) => ({
      date: item?.date || null,
      close: safeNumber(item?.close),
      high: safeNumber(item?.high),
      low: safeNumber(item?.low),
      volume: safeNumber(item?.volume),
    }))
    .filter(
      (item) =>
        item.close !== null,
    );

  const closes = chart.map(
    (item) => item.close,
  );

  const recent30 = chart.slice(-30);
  const recent90 = chart.slice(-90);

  const recentHighs = recent30
    .map((item) => item.high)
    .filter(
      (value) => value !== null,
    );

  const recentLows = recent30
    .map((item) => item.low)
    .filter(
      (value) => value !== null,
    );

  const volumes = recent30
    .map((item) => item.volume)
    .filter(
      (value) => value !== null,
    );

  return {
    observations: chart.length,
    firstDate:
      chart[0]?.date || null,
    lastDate:
      chart[chart.length - 1]?.date ||
      null,
    periodChangePercent:
      percentageChange(
        closes[0],
        closes[closes.length - 1],
      ),
    recent90DayChangePercent:
      percentageChange(
        recent90[0]?.close,
        recent90[recent90.length - 1]
          ?.close,
      ),
    movingAverage20:
      movingAverage(closes, 20),
    movingAverage50:
      movingAverage(closes, 50),
    recent30High:
      recentHighs.length
        ? Math.max(...recentHighs)
        : null,
    recent30Low:
      recentLows.length
        ? Math.min(...recentLows)
        : null,
    recent30AverageVolume:
      volumes.length
        ? volumes.reduce(
            (sum, value) =>
              sum + value,
            0,
          ) / volumes.length
        : null,
  };
}

function createResearchContext(stockData) {
  const chartSummary =
    createChartSummary(stockData);

  const price =
    safeNumber(stockData.price);

  return {
    company: {
      name:
        cleanText(
          stockData.name ||
            stockData.company,
        ) || stockData.symbol,
      symbol:
        cleanText(stockData.symbol),
      exchange:
        cleanText(stockData.exchange),
      currency:
        cleanText(stockData.currency) ||
        "INR",
      sector:
        cleanText(stockData.sector) ||
        "Unavailable",
      industry:
        cleanText(stockData.industry) ||
        "Unavailable",
      businessSummary:
        cleanText(
          stockData.businessSummary,
        ) || "Unavailable",
      employees:
        safeNumber(stockData.employees),
    },
    marketSnapshot: {
      price,
      previousClose:
        safeNumber(
          stockData.previousClose,
        ),
      change:
        safeNumber(
          stockData.change ??
            stockData.changeAbs,
        ),
      changePercent:
        safeNumber(
          stockData.changePercent,
        ),
      marketCap:
        safeNumber(stockData.marketCap),
      peRatioTTM:
        safeNumber(
          stockData.peRatioTTM ??
            stockData.peRatio,
        ),
      forwardPE:
        safeNumber(stockData.forwardPE),
      priceToBook:
        safeNumber(stockData.priceToBook),
      pegRatio:
        safeNumber(stockData.pegRatio),
      fiftyTwoWeekLow:
        safeNumber(
          stockData.fiftyTwoWeekLow ??
            stockData.week52Low,
        ),
      fiftyTwoWeekHigh:
        safeNumber(
          stockData.fiftyTwoWeekHigh ??
            stockData.week52High,
        ),
      distanceFrom52WeekLowPercent:
        distancePercent(
          price,
          stockData.fiftyTwoWeekLow ??
            stockData.week52Low,
        ),
      distanceFrom52WeekHighPercent:
        distancePercent(
          price,
          stockData.fiftyTwoWeekHigh ??
            stockData.week52High,
        ),
      volume:
        safeNumber(stockData.volume),
      averageVolume:
        safeNumber(
          stockData.averageVolume,
        ),
      marketState:
        cleanText(stockData.marketState),
      lastUpdated:
        stockData.lastUpdated || null,
    },
    fundamentals: {
      enterpriseValue:
        safeNumber(
          stockData.enterpriseValue,
        ),
      trailingEps:
        safeNumber(stockData.trailingEps),
      forwardEps:
        safeNumber(stockData.forwardEps),
      totalRevenue:
        safeNumber(stockData.totalRevenue),
      revenueGrowth:
        safeNumber(stockData.revenueGrowth),
      earningsGrowth:
        safeNumber(stockData.earningsGrowth),
      profitMargins:
        safeNumber(stockData.profitMargins),
      returnOnEquity:
        safeNumber(stockData.returnOnEquity),
      totalCash:
        safeNumber(stockData.totalCash),
      totalDebt:
        safeNumber(stockData.totalDebt),
      debtToEquity:
        safeNumber(stockData.debtToEquity),
      currentRatio:
        safeNumber(stockData.currentRatio),
      freeCashflow:
        safeNumber(stockData.freeCashflow),
      dividendYield:
        safeNumber(stockData.dividendYield),
    },
    chartSummary,
    dataSource:
      cleanText(stockData.source) ||
      "Yahoo Finance",
  };
}

function normalizeAnalysisBlock(
  value,
  defaults,
) {
  return {
    ...defaults,
    ...(value &&
    typeof value === "object"
      ? value
      : {}),
  };
}

function normalizeScenario(value) {
  return {
    thesis:
      cleanText(value?.thesis) ||
      "The available data is insufficient for a detailed scenario.",
    conditions:
      cleanList(value?.conditions, 4),
  };
}

function normalizeReport(raw) {
  const businessOverview =
    normalizeAnalysisBlock(
      raw?.businessOverview,
      {
        summary:
          "Business information is limited in the available data.",
        strengths: [],
        dependencies: [],
      },
    );

  const industryPosition =
    normalizeAnalysisBlock(
      raw?.industryPosition,
      {
        summary:
          "Industry-position information is limited in the available data.",
        competitiveAdvantages: [],
        challenges: [],
      },
    );

  const fundamentalAnalysis =
    normalizeAnalysisBlock(
      raw?.fundamentalAnalysis,
      {
        score: 0,
        summary:
          "Fundamental assessment is limited by the available data.",
        positives: [],
        concerns: [],
      },
    );

  const valuationAnalysis =
    normalizeAnalysisBlock(
      raw?.valuationAnalysis,
      {
        score: 0,
        summary:
          "Valuation assessment is limited by the available data.",
        interpretation:
          "A reliable valuation conclusion requires broader peer and historical context.",
        positives: [],
        concerns: [],
      },
    );

  const technicalAnalysis =
    normalizeAnalysisBlock(
      raw?.technicalAnalysis,
      {
        score: 0,
        trend: "Insufficient data",
        summary:
          "Technical assessment is limited by the available chart data.",
        supportNote:
          "Support cannot be established reliably from the available data.",
        resistanceNote:
          "Resistance cannot be established reliably from the available data.",
      },
    );

  return {
    researchStance: [
      "Positive",
      "Balanced",
      "Cautious",
      "Watch",
    ].includes(raw?.researchStance)
      ? raw.researchStance
      : "Watch",
    confidenceScore:
      clampScore(raw?.confidenceScore),
    riskLevel: [
      "Low",
      "Moderate",
      "High",
    ].includes(raw?.riskLevel)
      ? raw.riskLevel
      : "Moderate",
    executiveSummary:
      cleanText(raw?.executiveSummary) ||
      "The available verified data supports only a limited research assessment.",
    businessOverview: {
      summary:
        cleanText(
          businessOverview.summary,
        ),
      strengths:
        cleanList(
          businessOverview.strengths,
          4,
        ),
      dependencies:
        cleanList(
          businessOverview.dependencies,
          4,
        ),
    },
    industryPosition: {
      summary:
        cleanText(
          industryPosition.summary,
        ),
      competitiveAdvantages:
        cleanList(
          industryPosition.competitiveAdvantages,
          4,
        ),
      challenges:
        cleanList(
          industryPosition.challenges,
          4,
        ),
    },
    fundamentalAnalysis: {
      score:
        clampScore(
          fundamentalAnalysis.score,
        ),
      summary:
        cleanText(
          fundamentalAnalysis.summary,
        ),
      positives:
        cleanList(
          fundamentalAnalysis.positives,
          5,
        ),
      concerns:
        cleanList(
          fundamentalAnalysis.concerns,
          5,
        ),
    },
    valuationAnalysis: {
      score:
        clampScore(
          valuationAnalysis.score,
        ),
      summary:
        cleanText(
          valuationAnalysis.summary,
        ),
      interpretation:
        cleanText(
          valuationAnalysis.interpretation,
        ),
      positives:
        cleanList(
          valuationAnalysis.positives,
          4,
        ),
      concerns:
        cleanList(
          valuationAnalysis.concerns,
          4,
        ),
    },
    technicalAnalysis: {
      score:
        clampScore(
          technicalAnalysis.score,
        ),
      trend: [
        "Uptrend",
        "Sideways",
        "Downtrend",
        "Insufficient data",
      ].includes(
        technicalAnalysis.trend,
      )
        ? technicalAnalysis.trend
        : "Insufficient data",
      summary:
        cleanText(
          technicalAnalysis.summary,
        ),
      supportNote:
        cleanText(
          technicalAnalysis.supportNote,
        ),
      resistanceNote:
        cleanText(
          technicalAnalysis.resistanceNote,
        ),
    },
    growthDrivers: (
      Array.isArray(raw?.growthDrivers)
        ? raw.growthDrivers
        : []
    )
      .map((item) => ({
        title:
          cleanText(item?.title),
        detail:
          cleanText(item?.detail),
        horizon: [
          "Near term",
          "Medium term",
          "Long term",
        ].includes(item?.horizon)
          ? item.horizon
          : "Medium term",
      }))
      .filter(
        (item) =>
          item.title && item.detail,
      )
      .slice(0, 5),
    keyRisks: (
      Array.isArray(raw?.keyRisks)
        ? raw.keyRisks
        : []
    )
      .map((item) => ({
        title:
          cleanText(item?.title),
        detail:
          cleanText(item?.detail),
        severity: [
          "Low",
          "Moderate",
          "High",
        ].includes(item?.severity)
          ? item.severity
          : "Moderate",
      }))
      .filter(
        (item) =>
          item.title && item.detail,
      )
      .slice(0, 5),
    scenarios: {
      bull:
        normalizeScenario(
          raw?.scenarios?.bull,
        ),
      base:
        normalizeScenario(
          raw?.scenarios?.base,
        ),
      bear:
        normalizeScenario(
          raw?.scenarios?.bear,
        ),
    },
    watchItems:
      cleanList(raw?.watchItems, 6),
    conclusion:
      cleanText(raw?.conclusion) ||
      "Continue monitoring verified financial and market information before forming a stronger view.",
  };
}

function createRequestBody(context) {
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
              "Create a Litses structured equity research report from this verified data:\n\n" +
              JSON.stringify(
                context,
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
        REPORT_SCHEMA,
      temperature: 0.2,
      maxOutputTokens: 6500,
    },
  };
}

function parseJsonSafely(value) {
  try {
    return value
      ? JSON.parse(value)
      : {};
  } catch {
    return {};
  }
}

async function requestGeminiOnce({
  model,
  apiKey,
  requestBody,
}) {
  const controller =
    new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  const url =
    "https://generativelanguage.googleapis.com/" +
    `v1beta/models/${encodeURIComponent(
      model,
    )}:generateContent`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(
        requestBody,
      ),
      signal: controller.signal,
    });

    const rawText =
      await response.text();

    return {
      ok: response.ok,
      status: response.status,
      data:
        parseJsonSafely(rawText),
      rawText,
      model,
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
          : "Gemini request failed.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function requestGemini({
  apiKey,
  requestBody,
}) {
  let lastResult = null;

  for (const model of GEMINI_MODELS) {
    for (
      let attempt = 1;
      attempt <= 2;
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

      if (result.status === 429) {
        return result;
      }

      const retryable =
        result.status === 0 ||
        RETRYABLE_STATUSES.has(
          result.status,
        );

      if (!retryable) {
        return result;
      }

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            700 * attempt,
          ),
      );
    }
  }

  return lastResult;
}

function extractGeneratedText(data) {
  const parts =
    data?.candidates?.[0]
      ?.content?.parts;

  if (!Array.isArray(parts)) {
    return "";
  }

  return parts
    .map((part) => part?.text || "")
    .join("")
    .trim();
}

function getErrorMessage(result) {
  return (
    result?.data?.error?.message ||
    result?.networkError ||
    "The AI research service is temporarily unavailable."
  );
}

export default async function handler(
  req,
  res,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");

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
      !(
        stockData?.name ||
        stockData?.company
      )
    ) {
      return res.status(400).json({
        error: {
          code:
            "STOCK_DATA_REQUIRED",
          message:
            "Verified stock data is required before generating research.",
        },
      });
    }

    const context =
      createResearchContext(
        stockData,
      );

    const cacheKey = [
      CACHE_VERSION,
      context.company.symbol,
      context.marketSnapshot.lastUpdated ||
        "latest",
    ].join(":");

    const cached =
      researchCache.get(cacheKey);

    if (
      cached &&
      Date.now() - cached.createdAt <
        CACHE_DURATION_MS
    ) {
      return res.status(200).json({
        success: true,
        report: cached.report,
        verifiedData: context,
        generatedAt:
          cached.generatedAt,
        modelUsed:
          cached.modelUsed,
        cached: true,
      });
    }

    let researchPromise =
      inFlightResearch.get(cacheKey);

    if (!researchPromise) {
      researchPromise =
        requestGemini({
          apiKey,
          requestBody:
            createRequestBody(context),
        });

      inFlightResearch.set(
        cacheKey,
        researchPromise,
      );
    }

    let geminiResult;

    try {
      geminiResult =
        await researchPromise;
    } finally {
      inFlightResearch.delete(
        cacheKey,
      );
    }

    if (!geminiResult?.ok) {
      const status =
        geminiResult?.status === 429
          ? 429
          : geminiResult?.status >= 400 &&
              geminiResult?.status < 500
            ? 502
            : 503;

      return res.status(status).json({
        error: {
          code:
            geminiResult?.status === 429
              ? "GEMINI_LIMIT_REACHED"
              : "GEMINI_RESEARCH_FAILED",
          message:
            geminiResult?.status === 429
              ? "The Gemini usage limit was reached. Try again later."
              : getErrorMessage(
                  geminiResult,
                ),
        },
        aiUnavailable: true,
      });
    }

    const generatedText =
      extractGeneratedText(
        geminiResult.data,
      );

    const parsed =
      parseJsonSafely(
        generatedText,
      );

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      return res.status(502).json({
        error: {
          code:
            "INVALID_AI_RESPONSE",
          message:
            "The AI returned an incomplete research report. Please retry.",
        },
        aiUnavailable: true,
      });
    }

    const report =
      normalizeReport(parsed);

    const generatedAt =
      new Date().toISOString();

    researchCache.set(cacheKey, {
      report,
      generatedAt,
      modelUsed:
        geminiResult.model,
      createdAt: Date.now(),
    });

    return res.status(200).json({
      success: true,
      report,
      verifiedData: context,
      generatedAt,
      modelUsed:
        geminiResult.model,
      cached: false,
    });
  } catch (error) {
    console.error(
      "AI research generation failed:",
      error,
    );

    return res.status(500).json({
      error: {
        code:
          "RESEARCH_GENERATION_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Unable to generate the research report.",
      },
      aiUnavailable: true,
    });
  }
}
