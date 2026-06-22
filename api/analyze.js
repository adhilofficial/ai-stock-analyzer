const SYSTEM_PROMPT = `You are the AI research engine for EXA NEXUS, an Indian financial-market research platform.

You will receive verified stock-market data retrieved from Yahoo Finance.

Use the supplied data to provide an educational research assessment.

Do not invent or modify the supplied market price, price change, market capitalization, P/E ratio, 52-week range, volume, company name or stock symbol.

Respond only with a valid JSON object in this exact format:

{
  "signal": "BUY",
  "confidenceScore": 75,
  "riskLevel": "Moderate",
  "summary": "Two or three sentence educational research summary.",
  "keyThemes": [
    "Theme 1",
    "Theme 2",
    "Theme 3"
  ],
  "growthDrivers": [
    "Growth driver 1",
    "Growth driver 2",
    "Growth driver 3",
    "Growth driver 4"
  ],
  "keyRisks": [
    "Risk 1",
    "Risk 2",
    "Risk 3",
    "Risk 4"
  ],
  "fundamentalScore": 70,
  "momentumScore": 65,
  "valuationScore": 55,
  "sentimentScore": 60
}

Rules:

signal must be one of:
BUY, SELL, NEUTRAL, WATCH

riskLevel must be one of:
Low, Moderate, High

All scores must be whole numbers between 0 and 100.

The analysis is educational research, not guaranteed financial advice.

Respond only with JSON.
Do not include markdown.
Do not include backticks.
Do not add text before or after the JSON.`;

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}

function clampScore(value) {
  return Math.min(
    100,
    Math.max(0, Math.round(safeNumber(value)))
  );
}

function scoreLabel(score) {
  if (score >= 70) return "Strong";
  if (score >= 40) return "Neutral";
  return "Weak";
}

function sentimentLabel(score) {
  if (score >= 70) return "Positive";
  if (score >= 40) return "Neutral";
  return "Negative";
}

function formatMarketCap(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "N/A";
  }

  const crore = amount / 10000000;

  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(crore)} Cr`;
}

function formatVolume(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "N/A";
  }

  if (amount >= 10000000) {
    return `${(amount / 10000000).toFixed(
      2
    )} Cr`;
  }

  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(
      2
    )} L`;
  }

  return new Intl.NumberFormat(
    "en-IN"
  ).format(amount);
}

function cleanArray(value, maximum = 4) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item) =>
        typeof item === "string" &&
        item.trim()
    )
    .map((item) => item.trim())
    .slice(0, maximum);
}

function displayTicker(symbol) {
  if (symbol?.endsWith(".NS")) {
    return `NSE:${symbol.replace(
      ".NS",
      ""
    )}`;
  }

  if (symbol?.endsWith(".BO")) {
    return `BSE:${symbol.replace(
      ".BO",
      ""
    )}`;
  }

  return symbol || "N/A";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: {
        message: "Method not allowed.",
      },
    });
  }

  try {
    const apiKey =
      process.env.GEMINI_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: {
          message:
            "GEMINI_KEY is missing from the server environment variables.",
        },
      });
    }

    const stockData =
      req.body?.stockData;

    if (
      !stockData ||
      !stockData.symbol ||
      !stockData.name
    ) {
      return res.status(400).json({
        error: {
          message:
            "Verified Yahoo Finance stock data is required.",
        },
      });
    }

    const marketContext = {
      company: stockData.name,
      symbol: stockData.symbol,
      exchange: stockData.exchange,
      currency: stockData.currency,
      marketState: stockData.marketState,
      price: stockData.price,
      previousClose:
        stockData.previousClose,
      change: stockData.change,
      changePercent:
        stockData.changePercent,
      marketCap: stockData.marketCap,
      peRatioTTM: stockData.peRatioTTM,
      fiftyTwoWeekLow:
        stockData.fiftyTwoWeekLow,
      fiftyTwoWeekHigh:
        stockData.fiftyTwoWeekHigh,
      volume: stockData.volume,
      sector: stockData.sector,
      industry: stockData.industry,
      businessSummary:
        typeof stockData.businessSummary ===
        "string"
          ? stockData.businessSummary.slice(
              0,
              4000
            )
          : null,
    };

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
          "x-goog-api-key": apiKey,
        },

        body: JSON.stringify({
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
                    "Analyze this verified stock-market data:\n\n" +
                    JSON.stringify(
                      marketContext,
                      null,
                      2
                    ),
                },
              ],
            },
          ],

          generationConfig: {
            responseMimeType:
              "application/json",
            temperature: 0.2,
          },
        }),
      }
    );

    const data =
      await geminiResponse.json();

    if (!geminiResponse.ok) {
      const message =
        data?.error?.message ||
        `Gemini request failed with status ${geminiResponse.status}.`;

      return res
        .status(geminiResponse.status)
        .json({
          error: {
            message,
          },
        });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part?.text || "")
        .join("")
        .trim() || "";

    if (!text) {
      return res.status(502).json({
        error: {
          message:
            "Gemini returned an empty response.",
        },
      });
    }

    const cleanText = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let aiAnalysis;

    try {
      aiAnalysis = JSON.parse(cleanText);
    } catch {
      console.error(
        "Invalid Gemini JSON:",
        cleanText
      );

      return res.status(502).json({
        error: {
          message:
            "Gemini returned an invalid JSON response.",
        },
      });
    }

    const fundamentalScore = clampScore(
      aiAnalysis.fundamentalScore
    );

    const momentumScore = clampScore(
      aiAnalysis.momentumScore
    );

    const valuationScore = clampScore(
      aiAnalysis.valuationScore
    );

    const sentimentScore = clampScore(
      aiAnalysis.sentimentScore
    );

    const allowedSignals = [
      "BUY",
      "SELL",
      "NEUTRAL",
      "WATCH",
    ];

    const allowedRiskLevels = [
      "Low",
      "Moderate",
      "High",
    ];

    const result = {
      company: stockData.name,

      symbol: stockData.symbol,

      ticker: displayTicker(
        stockData.symbol
      ),

      sector:
        stockData.sector ||
        stockData.industry ||
        "N/A",

      logoDomain:
        stockData.logoDomain || "",

      price: safeNumber(
        stockData.price
      ),

      changeAbs: safeNumber(
        stockData.change
      ),

      changePercent: safeNumber(
        stockData.changePercent
      ),

      marketCap: formatMarketCap(
        stockData.marketCap
      ),

      peRatio:
        stockData.peRatioTTM ??
        "N/A",

      week52Low:
        stockData.fiftyTwoWeekLow ??
        "N/A",

      week52High:
        stockData.fiftyTwoWeekHigh ??
        "N/A",

      volume: formatVolume(
        stockData.volume
      ),

      signal: allowedSignals.includes(
        aiAnalysis.signal
      )
        ? aiAnalysis.signal
        : "WATCH",

      confidenceScore: clampScore(
        aiAnalysis.confidenceScore
      ),

      riskLevel:
        allowedRiskLevels.includes(
          aiAnalysis.riskLevel
        )
          ? aiAnalysis.riskLevel
          : "Moderate",

      summary:
        typeof aiAnalysis.summary ===
        "string"
          ? aiAnalysis.summary
          : "AI research summary is currently unavailable.",

      keyThemes: cleanArray(
        aiAnalysis.keyThemes,
        3
      ),

      growthDrivers: cleanArray(
        aiAnalysis.growthDrivers,
        4
      ),

      keyRisks: cleanArray(
        aiAnalysis.keyRisks,
        4
      ),

      fundamentalScore,

      fundamentalLabel: scoreLabel(
        fundamentalScore
      ),

      momentumScore,

      momentumLabel: scoreLabel(
        momentumScore
      ),

      valuationScore,

      valuationLabel: scoreLabel(
        valuationScore
      ),

      sentimentScore,

      sentimentLabel: sentimentLabel(
        sentimentScore
      ),

      chart: Array.isArray(
        stockData.chart
      )
        ? stockData.chart
        : [],

      source:
        stockData.source ||
        "Yahoo Finance",

      lastUpdated:
        stockData.lastUpdated || null,
    };

    return res.status(200).json({
      result,
    });
  } catch (error) {
    console.error(
      "Analyze server error:",
      error
    );

    return res.status(500).json({
      error: {
        message:
          error?.message ||
          "Internal server error.",
      },
    });
  }
}