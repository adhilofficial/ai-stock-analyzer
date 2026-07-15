import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  Clock3,
  Copy,
  Database,
  Eye,
  FileText,
  Gauge,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import AppShell from
  "../components/layout/AppShell";

import "../styles/ai-research.css";

const POPULAR_STOCKS = [
  {
    symbol: "RELIANCE.NS",
    name: "Reliance Industries",
  },
  {
    symbol: "HDFCBANK.NS",
    name: "HDFC Bank",
  },
  {
    symbol: "TCS.NS",
    name: "TCS",
  },
  {
    symbol: "INFY.NS",
    name: "Infosys",
  },
  {
    symbol: "ICICIBANK.NS",
    name: "ICICI Bank",
  },
  {
    symbol: "SBIN.NS",
    name: "State Bank of India",
  },
];

function safeNumber(value) {
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

function formatPrice(
  value,
  currency = "INR",
) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  try {
    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency:
          currency || "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(number);
  } catch {
    return number.toFixed(2);
  }
}

function formatNumber(
  value,
  maximumFractionDigits = 2,
) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits,
    },
  ).format(number);
}

function formatPercent(value) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  return `${
    number > 0 ? "+" : ""
  }${number.toFixed(2)}%`;
}

function formatIndianLargeNumber(value) {
  const number = safeNumber(value);

  if (number === null) {
    return "N/A";
  }

  if (
    Math.abs(number) >=
    10_000_000
  ) {
    return `₹${(
      number / 10_000_000
    ).toFixed(2)} Cr`;
  }

  if (
    Math.abs(number) >=
    100_000
  ) {
    return `₹${(
      number / 100_000
    ).toFixed(2)} Lakh`;
  }

  return `₹${formatNumber(number)}`;
}

function formatDateTime(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "Just now";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    },
  ).format(date);
}

function getErrorMessage(data, fallback) {
  return (
    data?.error?.message ||
    data?.message ||
    fallback
  );
}

async function fetchJson(
  url,
  options = {},
) {
  const response = await fetch(
    url,
    options,
  );

  const contentType =
    response.headers.get(
      "content-type",
    ) || "";

  let data = null;

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    data = await response.json();
  } else {
    const text =
      await response.text();

    data = {
      error: {
        message:
          text ||
          "The server returned a non-JSON response.",
      },
    };
  }

  if (!response.ok) {
    const error = new Error(
      getErrorMessage(
        data,
        `Request failed with status ${response.status}.`,
      ),
    );

    error.status = response.status;
    error.code =
      data?.error?.code || "";

    throw error;
  }

  return data;
}

function CompanyMark({
  stock,
  size = 48,
}) {
  const [failed, setFailed] =
    useState(false);

  const logoKey =
    import.meta.env.VITE_LOGO_KEY;

  const domain =
    stock?.logoDomain || "";

  const showImage = Boolean(
    domain && logoKey && !failed,
  );

  const name =
    stock?.name ||
    stock?.company ||
    stock?.symbol ||
    "EXA";

  return (
    <span
      className="exa-research-company-mark"
      style={{
        width: size,
        height: size,
      }}
    >
      {showImage ? (
        <img
          src={`https://img.logo.dev/${domain}?token=${logoKey}&size=128&format=webp`}
          alt={`${name} logo`}
          onError={() =>
            setFailed(true)
          }
        />
      ) : (
        <strong>
          {name
            .trim()
            .charAt(0)
            .toUpperCase() || "E"}
        </strong>
      )}
    </span>
  );
}

function ScoreDial({
  score,
  label,
}) {
  const numeric = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        Number(score) || 0,
      ),
    ),
  );

  return (
    <div className="exa-research-score-dial-wrap">
      <div
        className="exa-research-score-dial"
        style={{
          "--exa-score": `${numeric * 3.6}deg`,
        }}
      >
        <span>
          {numeric}
          <small>/100</small>
        </span>
      </div>

      <div>
        <strong>{label}</strong>
        <small>
          AI-assisted score
        </small>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  note,
  tone = "default",
}) {
  return (
    <article
      className={`exa-research-metric-card ${tone}`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function SectionCard({
  icon: Icon,
  eyebrow,
  title,
  children,
  className = "",
}) {
  return (
    <section
      className={`exa-research-section-card ${className}`}
    >
      <header>
        <span className="exa-research-section-icon">
          <Icon size={18} />
        </span>

        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </header>

      <div className="exa-research-section-body">
        {children}
      </div>
    </section>
  );
}

function BulletList({
  items,
  tone = "neutral",
  emptyText =
    "No additional point was identified from the available data.",
}) {
  const rows = Array.isArray(items)
    ? items.filter(Boolean)
    : [];

  if (rows.length === 0) {
    return (
      <p className="exa-research-empty-copy">
        {emptyText}
      </p>
    );
  }

  return (
    <ul
      className={`exa-research-bullet-list ${tone}`}
    >
      {rows.map((item, index) => (
        <li key={`${item}-${index}`}>
          <span>
            {tone === "positive" ? (
              <CheckCircle2
                size={15}
              />
            ) : tone ===
              "negative" ? (
              <XCircle size={15} />
            ) : (
              <ArrowRight
                size={14}
              />
            )}
          </span>
          <p>{item}</p>
        </li>
      ))}
    </ul>
  );
}

function AnalysisScoreBlock({
  score,
  title,
  summary,
}) {
  return (
    <div className="exa-research-analysis-lead">
      <ScoreDial
        score={score}
        label={title}
      />
      <p>{summary}</p>
    </div>
  );
}

function ScenarioCard({
  type,
  title,
  scenario,
}) {
  return (
    <article
      className={`exa-research-scenario ${type}`}
    >
      <div className="exa-research-scenario-heading">
        {type === "bull" ? (
          <TrendingUp size={18} />
        ) : type === "bear" ? (
          <TrendingDown size={18} />
        ) : (
          <Scale size={18} />
        )}
        <strong>{title}</strong>
      </div>

      <p>{scenario?.thesis}</p>

      <BulletList
        items={scenario?.conditions}
        tone="neutral"
      />
    </article>
  );
}

function LoadingResearch({ stage }) {
  const stages = [
    {
      key: "market",
      label:
        "Loading verified market data",
    },
    {
      key: "research",
      label:
        "Generating structured AI research",
    },
    {
      key: "formatting",
      label:
        "Preparing your research workspace",
    },
  ];

  const activeIndex =
    stage === "market"
      ? 0
      : stage === "research"
        ? 1
        : 2;

  return (
    <section className="exa-research-loading-card">
      <span className="exa-research-loading-icon">
        <Sparkles size={25} />
      </span>

      <div>
        <p>LITSES RESEARCH ENGINE</p>
        <h2>
          Building the research report
        </h2>
        <span>
          This combines verified Yahoo Finance
          data with a structured Gemini analysis.
        </span>
      </div>

      <div className="exa-research-loading-steps">
        {stages.map((item, index) => (
          <div
            key={item.key}
            className={
              index < activeIndex
                ? "complete"
                : index === activeIndex
                  ? "active"
                  : ""
            }
          >
            <span>
              {index < activeIndex ? (
                <Check size={14} />
              ) : index ===
                activeIndex ? (
                <LoaderCircle
                  size={14}
                  className="exa-research-spin"
                />
              ) : (
                index + 1
              )}
            </span>
            <p>{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyWorkspace() {
  return (
    <section className="exa-research-empty-workspace">
      <div className="exa-research-empty-visual">
        <FileText size={30} />
      </div>

      <div>
        <p>DEEP-DIVE WORKSPACE</p>
        <h2>
          Turn verified stock data into a
          structured research report
        </h2>
        <span>
          Search an Indian-listed company to
          review its business, fundamentals,
          valuation, technical context, growth
          drivers, risks and scenario analysis.
        </span>
      </div>

      <div className="exa-research-feature-grid">
        <article>
          <Building2 size={18} />
          <strong>
            Business and industry
          </strong>
          <span>
            Company profile, strengths and
            operating dependencies.
          </span>
        </article>

        <article>
          <BarChart3 size={18} />
          <strong>
            Financial evidence
          </strong>
          <span>
            Fundamentals, valuation and market
            trend interpretation.
          </span>
        </article>

        <article>
          <ShieldAlert size={18} />
          <strong>
            Risk-first scenarios
          </strong>
          <span>
            Bull, base and bear conditions without
            price targets or promises.
          </span>
        </article>
      </div>
    </section>
  );
}

function buildCopyText({
  stockData,
  report,
  generatedAt,
}) {
  const lines = [
    "LITSES — AI RESEARCH REPORT",
    "",
    `${stockData?.name || stockData?.company || stockData?.symbol}`,
    `${stockData?.symbol} · ${stockData?.exchange || "Indian market"}`,
    `Generated: ${formatDateTime(generatedAt)}`,
    "",
    `Research stance: ${report?.researchStance}`,
    `Confidence: ${report?.confidenceScore}/100`,
    `Risk level: ${report?.riskLevel}`,
    "",
    "EXECUTIVE SUMMARY",
    report?.executiveSummary,
    "",
    "BUSINESS OVERVIEW",
    report?.businessOverview?.summary,
    ...(
      report?.businessOverview?.strengths || []
    ).map((item) => `• ${item}`),
    "",
    "INDUSTRY POSITION",
    report?.industryPosition?.summary,
    ...(
      report?.industryPosition?.competitiveAdvantages || []
    ).map((item) => `• ${item}`),
    "",
    "FUNDAMENTAL ANALYSIS",
    report?.fundamentalAnalysis?.summary,
    "",
    "VALUATION ANALYSIS",
    report?.valuationAnalysis?.summary,
    report?.valuationAnalysis?.interpretation,
    "",
    "TECHNICAL CONTEXT",
    report?.technicalAnalysis?.summary,
    "",
    "GROWTH DRIVERS",
    ...(
      report?.growthDrivers || []
    ).map(
      (item) =>
        `• ${item.title}: ${item.detail} (${item.horizon})`,
    ),
    "",
    "KEY RISKS",
    ...(
      report?.keyRisks || []
    ).map(
      (item) =>
        `• ${item.title}: ${item.detail} (${item.severity})`,
    ),
    "",
    "CONCLUSION",
    report?.conclusion,
    "",
    "Educational research only. Not personalised investment advice or a buy/sell recommendation.",
  ];

  return lines
    .filter(
      (line) =>
        line !== undefined &&
        line !== null,
    )
    .join("\n");
}

export default function AIResearch() {
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] =
    useState("");
  const [suggestions, setSuggestions] =
    useState([]);
  const [searchLoading, setSearchLoading] =
    useState(false);
  const [showSuggestions, setShowSuggestions] =
    useState(false);
  const [selectedStock, setSelectedStock] =
    useState(null);
  const [stockData, setStockData] =
    useState(null);
  const [researchResult, setResearchResult] =
    useState(null);
  const [loadingStage, setLoadingStage] =
    useState("");
  const [error, setError] =
    useState("");
  const [copied, setCopied] =
    useState(false);

  const requestRef = useRef(0);
  const autoLoadedRef = useRef("");

  const report =
    researchResult?.report || null;

  const currency =
    stockData?.currency || "INR";

  const changePercent =
    safeNumber(
      stockData?.changePercent,
    ) || 0;

  const stanceTone = useMemo(() => {
    if (
      report?.researchStance ===
      "Positive"
    ) {
      return "positive";
    }

    if (
      report?.researchStance ===
      "Cautious"
    ) {
      return "negative";
    }

    if (
      report?.researchStance ===
      "Balanced"
    ) {
      return "balanced";
    }

    return "watch";
  }, [report]);

  useEffect(() => {
    const searchText =
      query.trim();

    if (
      !searchText ||
      searchText.length < 2 ||
      loadingStage
    ) {
      setSuggestions([]);
      setSearchLoading(false);
      return undefined;
    }

    const requestId =
      requestRef.current + 1;

    requestRef.current = requestId;

    const timeoutId =
      window.setTimeout(
        async () => {
          setSearchLoading(true);

          try {
            const data =
              await fetchJson(
                `/api/stock-search?q=${encodeURIComponent(
                  searchText,
                )}`,
              );

            if (
              requestId !==
              requestRef.current
            ) {
              return;
            }

            setSuggestions(
              Array.isArray(data)
                ? data.slice(0, 8)
                : [],
            );
            setShowSuggestions(true);
          } catch (caughtError) {
            if (
              requestId !==
              requestRef.current
            ) {
              return;
            }

            console.warn(
              "AI Research stock search failed:",
              caughtError,
            );

            setSuggestions([]);
            setShowSuggestions(true);
          } finally {
            if (
              requestId ===
              requestRef.current
            ) {
              setSearchLoading(false);
            }
          }
        },
        320,
      );

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query, loadingStage]);

  useEffect(() => {
    const parameters =
      new URLSearchParams(
        location.search,
      );

    const symbol = String(
      parameters.get("symbol") || "",
    )
      .trim()
      .toUpperCase();

    if (
      !symbol ||
      autoLoadedRef.current === symbol
    ) {
      return;
    }

    autoLoadedRef.current = symbol;

    generateResearch({
      symbol,
      name: symbol,
    });
    // The URL symbol should run only once per value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search]);

  async function generateResearch(stock) {
    const symbol = String(
      stock?.symbol || stock || "",
    )
      .trim()
      .toUpperCase();

    if (!symbol || loadingStage) {
      return;
    }

    const currentRequest =
      requestRef.current + 1;

    requestRef.current =
      currentRequest;

    setSelectedStock(
      typeof stock === "object"
        ? stock
        : {
            symbol,
            name: symbol,
          },
    );
    setStockData(null);
    setResearchResult(null);
    setError("");
    setCopied(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setQuery("");
    setLoadingStage("market");

    try {
      const marketData =
        await fetchJson(
          `/api/stock-data?symbol=${encodeURIComponent(
            symbol,
          )}&range=1y`,
        );

      if (
        currentRequest !==
        requestRef.current
      ) {
        return;
      }

      setStockData(marketData);
      setSelectedStock((current) => ({
        ...current,
        ...marketData,
        symbol: marketData.symbol || symbol,
        name:
          marketData.name ||
          current?.name ||
          symbol,
      }));
      setLoadingStage("research");

      const researchData =
        await fetchJson(
          "/api/research",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              stockData: marketData,
            }),
          },
        );

      if (
        currentRequest !==
        requestRef.current
      ) {
        return;
      }

      setLoadingStage("formatting");

      await new Promise(
        (resolve) =>
          window.setTimeout(
            resolve,
            180,
          ),
      );

      setResearchResult(
        researchData,
      );
    } catch (caughtError) {
      console.error(
        "AI Research generation failed:",
        caughtError,
      );

      let message =
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to generate the AI research report.";

      if (
        caughtError?.status === 429 ||
        caughtError?.code ===
          "GEMINI_LIMIT_REACHED"
      ) {
        message =
          "The Gemini usage limit was reached. Your verified market snapshot is still available; retry the AI report later.";
      }

      setError(message);
    } finally {
      if (
        currentRequest ===
        requestRef.current
      ) {
        setLoadingStage("");
      }
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const searchText =
      query.trim();

    if (!searchText) {
      return;
    }

    const preferred =
      suggestions.find(
        (item) =>
          String(item?.symbol || "")
            .toLowerCase() ===
          searchText.toLowerCase(),
      ) || suggestions[0];

    if (preferred?.symbol) {
      generateResearch(preferred);
      return;
    }

    try {
      setSearchLoading(true);

      const results =
        await fetchJson(
          `/api/stock-search?q=${encodeURIComponent(
            searchText,
          )}`,
        );

      const stock =
        Array.isArray(results)
          ? results[0]
          : null;

      if (!stock?.symbol) {
        throw new Error(
          "No matching NSE or BSE company was found.",
        );
      }

      generateResearch(stock);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to search for this company.",
      );
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleCopy() {
    if (!report || !stockData) {
      return;
    }

    const text = buildCopyText({
      stockData,
      report,
      generatedAt:
        researchResult?.generatedAt,
    });

    try {
      await navigator.clipboard.writeText(
        text,
      );
      setCopied(true);

      window.setTimeout(
        () => setCopied(false),
        1800,
      );
    } catch (caughtError) {
      console.error(
        "Unable to copy report:",
        caughtError,
      );
      setError(
        "The browser could not copy the report. Select and copy the text manually.",
      );
    }
  }

  function resetWorkspace() {
    requestRef.current += 1;
    setSelectedStock(null);
    setStockData(null);
    setResearchResult(null);
    setError("");
    setLoadingStage("");
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    setCopied(false);
  }

  return (
    <AppShell hideDefaultSearch>
      <main className="exa-research-page">
        <div className="exa-research-container">
          <section className="exa-research-hero">
            <div className="exa-research-hero-copy">
              <p className="exa-research-eyebrow">
                LITSES AI RESEARCH
              </p>

              <h1>
                Institutional-style research for
                Indian stocks
              </h1>

              <span>
                Combine verified market data with a
                structured AI review of the business,
                fundamentals, valuation, technical
                context, growth drivers and risks.
              </span>
            </div>

            <div className="exa-research-hero-badge">
              <Sparkles size={18} />
              <div>
                <strong>
                  Gemini-assisted
                </strong>
                <small>
                  Evidence-led research
                </small>
              </div>
            </div>
          </section>

          <section className="exa-research-search-card">
            <form
              onSubmit={handleSubmit}
              className="exa-research-search-form"
            >
              <Search size={20} />

              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(
                    event.target.value,
                  );
                  setShowSuggestions(true);
                  setError("");
                }}
                onFocus={() =>
                  setShowSuggestions(true)
                }
                onBlur={() =>
                  window.setTimeout(
                    () =>
                      setShowSuggestions(false),
                    160,
                  )
                }
                placeholder="Search an NSE or BSE company..."
                aria-label="Search company for AI research"
                autoComplete="off"
                disabled={Boolean(
                  loadingStage,
                )}
              />

              <button
                type="submit"
                disabled={
                  Boolean(loadingStage) ||
                  !query.trim()
                }
              >
                {searchLoading ? (
                  <LoaderCircle
                    size={17}
                    className="exa-research-spin"
                  />
                ) : (
                  <Sparkles size={17} />
                )}
                Generate research
              </button>
            </form>

            {showSuggestions &&
              query.trim() && (
                <div className="exa-research-suggestions">
                  {searchLoading ? (
                    <div className="exa-research-suggestion-status">
                      <LoaderCircle
                        size={16}
                        className="exa-research-spin"
                      />
                      Searching Indian stocks...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map(
                      (stock) => (
                        <button
                          key={stock.symbol}
                          type="button"
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            generateResearch(
                              stock,
                            )
                          }
                        >
                          <CompanyMark
                            stock={stock}
                            size={40}
                          />

                          <span className="exa-research-suggestion-copy">
                            <strong>
                              {stock.name ||
                                stock.company ||
                                stock.symbol}
                            </strong>
                            <small>
                              {stock.symbol}
                              {stock.exchange
                                ? ` · ${stock.exchange}`
                                : ""}
                            </small>
                          </span>

                          <span className="exa-research-suggestion-price">
                            <strong>
                              {formatPrice(
                                stock.price,
                                stock.currency,
                              )}
                            </strong>
                            {safeNumber(
                              stock.changePercent,
                            ) !== null && (
                              <small
                                className={
                                  Number(
                                    stock.changePercent,
                                  ) >= 0
                                    ? "positive"
                                    : "negative"
                                }
                              >
                                {formatPercent(
                                  stock.changePercent,
                                )}
                              </small>
                            )}
                          </span>
                        </button>
                      ),
                    )
                  ) : (
                    <div className="exa-research-suggestion-status">
                      No matching company found.
                    </div>
                  )}
                </div>
              )}

            {!stockData &&
              !loadingStage && (
                <div className="exa-research-popular-row">
                  <span>Popular</span>
                  {POPULAR_STOCKS.map(
                    (stock) => (
                      <button
                        type="button"
                        key={stock.symbol}
                        onClick={() =>
                          generateResearch(
                            stock,
                          )
                        }
                      >
                        {stock.name}
                      </button>
                    ),
                  )}
                </div>
              )}
          </section>

          {error && (
            <section className="exa-research-error-card">
              <AlertTriangle size={20} />
              <div>
                <strong>
                  Research could not be completed
                </strong>
                <p>{error}</p>
              </div>

              {selectedStock?.symbol && (
                <button
                  type="button"
                  onClick={() =>
                    generateResearch(
                      selectedStock,
                    )
                  }
                  disabled={Boolean(
                    loadingStage,
                  )}
                >
                  <RefreshCw size={15} />
                  Retry
                </button>
              )}
            </section>
          )}

          {loadingStage ? (
            <LoadingResearch
              stage={loadingStage}
            />
          ) : !stockData && !report ? (
            <EmptyWorkspace />
          ) : (
            <>
              {stockData && (
                <section className="exa-research-stock-header">
                  <div className="exa-research-stock-identity">
                    <CompanyMark
                      stock={{
                        ...selectedStock,
                        ...stockData,
                      }}
                      size={58}
                    />

                    <div>
                      <p>
                        VERIFIED MARKET SNAPSHOT
                      </p>
                      <h2>
                        {stockData.name ||
                          stockData.company ||
                          stockData.symbol}
                      </h2>
                      <span>
                        {stockData.symbol}
                        {stockData.exchange
                          ? ` · ${stockData.exchange}`
                          : ""}
                        {stockData.sector
                          ? ` · ${stockData.sector}`
                          : ""}
                      </span>
                    </div>
                  </div>

                  <div className="exa-research-stock-price">
                    <p>Current price</p>
                    <strong>
                      {formatPrice(
                        stockData.price,
                        currency,
                      )}
                    </strong>
                    <span
                      className={
                        changePercent >= 0
                          ? "positive"
                          : "negative"
                      }
                    >
                      {changePercent >= 0 ? (
                        <TrendingUp
                          size={15}
                        />
                      ) : (
                        <TrendingDown
                          size={15}
                        />
                      )}
                      {formatPercent(
                        changePercent,
                      )}
                    </span>
                  </div>

                  <div className="exa-research-stock-actions">
                    {report && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={handleCopy}
                      >
                        {copied ? (
                          <Check size={15} />
                        ) : (
                          <Copy size={15} />
                        )}
                        {copied
                          ? "Copied"
                          : "Copy report"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="secondary"
                      onClick={() =>
                        navigate(
                          `/analyze?symbol=${encodeURIComponent(
                            stockData.symbol,
                          )}`,
                        )
                      }
                    >
                      <Activity size={15} />
                      Stock Analysis
                    </button>

                    <button
                      type="button"
                      className="icon"
                      onClick={resetWorkspace}
                      title="Start new research"
                      aria-label="Start new research"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </div>
                </section>
              )}

              <section className="exa-research-metrics-grid">
                <MetricCard
                  label="Market cap"
                  value={
                    formatIndianLargeNumber(
                      stockData?.marketCap,
                    )
                  }
                  note="Latest verified value"
                />
                <MetricCard
                  label="P/E ratio"
                  value={
                    formatNumber(
                      stockData?.peRatioTTM ??
                        stockData?.peRatio,
                    )
                  }
                  note="Trailing valuation multiple"
                />
                <MetricCard
                  label="52-week range"
                  value={`${formatPrice(
                    stockData?.fiftyTwoWeekLow ??
                      stockData?.week52Low,
                    currency,
                  )} — ${formatPrice(
                    stockData?.fiftyTwoWeekHigh ??
                      stockData?.week52High,
                    currency,
                  )}`}
                  note="Recorded annual trading range"
                />
                <MetricCard
                  label="Volume"
                  value={formatNumber(
                    stockData?.volume,
                    0,
                  )}
                  note="Latest reported volume"
                />
              </section>

              {report ? (
                <div className="exa-research-report">
                  <section
                    className={`exa-research-executive-card ${stanceTone}`}
                  >
                    <div className="exa-research-executive-main">
                      <p>AI RESEARCH VIEW</p>
                      <div className="exa-research-executive-title-row">
                        <h2>
                          {report.researchStance}
                        </h2>
                        <span>
                          {report.riskLevel} risk
                        </span>
                      </div>
                      <p className="exa-research-executive-summary">
                        {report.executiveSummary}
                      </p>

                      <div className="exa-research-report-meta">
                        <span>
                          <Clock3 size={13} />
                          {formatDateTime(
                            researchResult?.generatedAt,
                          )}
                        </span>
                        <span>
                          <Database size={13} />
                          Yahoo Finance + Gemini
                        </span>
                        {researchResult?.cached && (
                          <span>
                            Cached research
                          </span>
                        )}
                      </div>
                    </div>

                    <ScoreDial
                      score={
                        report.confidenceScore
                      }
                      label="Research confidence"
                    />
                  </section>

                  <div className="exa-research-two-column">
                    <SectionCard
                      icon={BriefcaseBusiness}
                      eyebrow="COMPANY"
                      title="Business overview"
                    >
                      <p className="exa-research-body-copy">
                        {report.businessOverview
                          ?.summary}
                      </p>

                      <div className="exa-research-split-lists">
                        <div>
                          <h3>Strengths</h3>
                          <BulletList
                            items={
                              report.businessOverview
                                ?.strengths
                            }
                            tone="positive"
                          />
                        </div>

                        <div>
                          <h3>
                            Key dependencies
                          </h3>
                          <BulletList
                            items={
                              report.businessOverview
                                ?.dependencies
                            }
                          />
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={Building2}
                      eyebrow="MARKET POSITION"
                      title="Industry context"
                    >
                      <p className="exa-research-body-copy">
                        {report.industryPosition
                          ?.summary}
                      </p>

                      <div className="exa-research-split-lists">
                        <div>
                          <h3>
                            Competitive advantages
                          </h3>
                          <BulletList
                            items={
                              report.industryPosition
                                ?.competitiveAdvantages
                            }
                            tone="positive"
                          />
                        </div>

                        <div>
                          <h3>Challenges</h3>
                          <BulletList
                            items={
                              report.industryPosition
                                ?.challenges
                            }
                            tone="negative"
                          />
                        </div>
                      </div>
                    </SectionCard>
                  </div>

                  <div className="exa-research-three-column">
                    <SectionCard
                      icon={Gauge}
                      eyebrow="QUALITY"
                      title="Fundamentals"
                    >
                      <AnalysisScoreBlock
                        score={
                          report.fundamentalAnalysis
                            ?.score
                        }
                        title="Fundamental score"
                        summary={
                          report.fundamentalAnalysis
                            ?.summary
                        }
                      />

                      <div className="exa-research-compact-lists">
                        <div>
                          <h3>Positives</h3>
                          <BulletList
                            items={
                              report.fundamentalAnalysis
                                ?.positives
                            }
                            tone="positive"
                          />
                        </div>
                        <div>
                          <h3>Concerns</h3>
                          <BulletList
                            items={
                              report.fundamentalAnalysis
                                ?.concerns
                            }
                            tone="negative"
                          />
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={Scale}
                      eyebrow="PRICING"
                      title="Valuation"
                    >
                      <AnalysisScoreBlock
                        score={
                          report.valuationAnalysis
                            ?.score
                        }
                        title="Valuation score"
                        summary={
                          report.valuationAnalysis
                            ?.summary
                        }
                      />

                      <div className="exa-research-interpretation">
                        <strong>
                          Interpretation
                        </strong>
                        <p>
                          {report.valuationAnalysis
                            ?.interpretation}
                        </p>
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={Activity}
                      eyebrow="MARKET TREND"
                      title="Technical context"
                    >
                      <AnalysisScoreBlock
                        score={
                          report.technicalAnalysis
                            ?.score
                        }
                        title="Technical score"
                        summary={
                          report.technicalAnalysis
                            ?.summary
                        }
                      />

                      <div className="exa-research-trend-badge">
                        <span>Trend</span>
                        <strong>
                          {report.technicalAnalysis
                            ?.trend}
                        </strong>
                      </div>

                      <div className="exa-research-level-notes">
                        <p>
                          <strong>Support:</strong>{" "}
                          {report.technicalAnalysis
                            ?.supportNote}
                        </p>
                        <p>
                          <strong>
                            Resistance:
                          </strong>{" "}
                          {report.technicalAnalysis
                            ?.resistanceNote}
                        </p>
                      </div>
                    </SectionCard>
                  </div>

                  <div className="exa-research-two-column">
                    <SectionCard
                      icon={Lightbulb}
                      eyebrow="OPPORTUNITIES"
                      title="Growth drivers"
                    >
                      <div className="exa-research-driver-list">
                        {(
                          report.growthDrivers || []
                        ).map(
                          (item, index) => (
                            <article
                              key={`${item.title}-${index}`}
                            >
                              <span>
                                {index + 1}
                              </span>
                              <div>
                                <div>
                                  <strong>
                                    {item.title}
                                  </strong>
                                  <small>
                                    {item.horizon}
                                  </small>
                                </div>
                                <p>{item.detail}</p>
                              </div>
                            </article>
                          ),
                        )}
                      </div>
                    </SectionCard>

                    <SectionCard
                      icon={ShieldAlert}
                      eyebrow="RISK REVIEW"
                      title="Key risks"
                    >
                      <div className="exa-research-risk-list">
                        {(
                          report.keyRisks || []
                        ).map(
                          (item, index) => (
                            <article
                              key={`${item.title}-${index}`}
                              className={
                                String(
                                  item.severity,
                                ).toLowerCase()
                              }
                            >
                              <span>
                                <AlertTriangle
                                  size={16}
                                />
                              </span>
                              <div>
                                <div>
                                  <strong>
                                    {item.title}
                                  </strong>
                                  <small>
                                    {item.severity}
                                  </small>
                                </div>
                                <p>{item.detail}</p>
                              </div>
                            </article>
                          ),
                        )}
                      </div>
                    </SectionCard>
                  </div>

                  <SectionCard
                    icon={Target}
                    eyebrow="CONDITIONAL OUTLOOK"
                    title="Bull, base and bear scenarios"
                    className="exa-research-scenarios-card"
                  >
                    <div className="exa-research-scenarios-grid">
                      <ScenarioCard
                        type="bull"
                        title="Bull scenario"
                        scenario={
                          report.scenarios?.bull
                        }
                      />
                      <ScenarioCard
                        type="base"
                        title="Base scenario"
                        scenario={
                          report.scenarios?.base
                        }
                      />
                      <ScenarioCard
                        type="bear"
                        title="Bear scenario"
                        scenario={
                          report.scenarios?.bear
                        }
                      />
                    </div>
                  </SectionCard>

                  <div className="exa-research-two-column bottom">
                    <SectionCard
                      icon={Eye}
                      eyebrow="MONITORING"
                      title="What to watch next"
                    >
                      <BulletList
                        items={
                          report.watchItems
                        }
                      />
                    </SectionCard>

                    <SectionCard
                      icon={FileText}
                      eyebrow="RESEARCH CONCLUSION"
                      title="Evidence-based conclusion"
                    >
                      <p className="exa-research-conclusion">
                        {report.conclusion}
                      </p>
                    </SectionCard>
                  </div>
                </div>
              ) : (
                stockData && (
                  <section className="exa-research-live-only-card">
                    <Database size={23} />
                    <div>
                      <strong>
                        Verified market data is available
                      </strong>
                      <p>
                        The AI report is currently unavailable.
                        Use Retry when the Gemini service becomes
                        available again.
                      </p>
                    </div>
                  </section>
                )
              )}
            </>
          )}

          <p className="exa-research-disclaimer">
            Litses provides AI-assisted educational
            research based on available market data. It is
            not personalised investment advice, a registered
            research recommendation or a guarantee of future
            performance. Verify important information before
            making financial decisions.
          </p>
        </div>
      </main>
    </AppShell>
  );
}
