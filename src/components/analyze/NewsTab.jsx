import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  ArrowDownUp,
  ExternalLink,
  Filter,
  LoaderCircle,
  Newspaper,
  RefreshCw,
} from "lucide-react";

const SENTIMENTS = [
  "All",
  "Positive",
  "Neutral",
  "Negative",
];

const SENTIMENT_COLORS = {
  Positive: "#22c55e",
  Neutral: "#60a5fa",
  Negative: "#fb7185",
};

function formatRelativeTime(value) {
  const date = new Date(value || 0);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const difference = Date.now() - date.getTime();
  const minutes = Math.floor(difference / 60_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function SentimentBadge({ sentiment = "Neutral" }) {
  const color =
    SENTIMENT_COLORS[sentiment] ||
    SENTIMENT_COLORS.Neutral;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 24,
        padding: "3px 9px",
        border: `1px solid ${color}44`,
        borderRadius: 999,
        color,
        background: `${color}16`,
        fontSize: 10,
        fontWeight: 800,
      }}
    >
      {sentiment}
    </span>
  );
}

function NewsSkeleton() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 14,
      }}
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          style={{
            minHeight: 260,
            border: "1px solid #1e3350",
            borderRadius: 16,
            background: "#0d1a2e",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 140,
              background: "#142641",
            }}
          />

          <div style={{ padding: 16 }}>
            {[90, 75, 95, 55].map((width) => (
              <div
                key={width}
                style={{
                  width: `${width}%`,
                  height: 10,
                  marginBottom: 10,
                  borderRadius: 999,
                  background: "#1a2d4a",
                }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div
      style={{
        minWidth: 105,
        padding: "12px 14px",
        border: "1px solid #1e3350",
        borderRadius: 12,
        background: "#101e34",
      }}
    >
      <span
        style={{
          color: "#64748b",
          fontSize: 10,
          fontWeight: 700,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          marginTop: 4,
          color,
          fontSize: 20,
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function ArticleCard({ article }) {
  return (
    <article
      style={{
        border: "1px solid #1e3350",
        borderRadius: 16,
        background: "#0d1a2e",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block",
          height: 155,
          background: "#101e34",
          overflow: "hidden",
        }}
      >
        {article.thumbnail ? (
          <img
            src={article.thumbnail}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <span
            style={{
              width: "100%",
              height: "100%",
              color: "#60a5fa",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Newspaper size={34} />
          </span>
        )}
      </a>

      <div
        style={{
          padding: 16,
          display: "flex",
          flex: 1,
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
          }}
        >
          <SentimentBadge sentiment={article.sentiment} />

          <span
            style={{
              color: "#64748b",
              fontSize: 10,
            }}
          >
            {formatRelativeTime(article.publishedAt)}
          </span>
        </div>

        <h3
          style={{
            margin: "12px 0 0",
            color: "#f8fafc",
            fontSize: 15,
            lineHeight: 1.45,
          }}
        >
          {article.title}
        </h3>

        <p
          style={{
            display: "-webkit-box",
            overflow: "hidden",
            minHeight: 57,
            margin: "9px 0 0",
            color: "#94a3b8",
            fontSize: 11,
            lineHeight: 1.65,
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: 3,
          }}
        >
          {article.summary ||
            "Open the original article to read the complete report."}
        </p>

        <div
          style={{
            marginTop: "auto",
            paddingTop: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span
            style={{
              overflow: "hidden",
              color: "#60a5fa",
              fontSize: 10,
              fontWeight: 700,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {article.publisher || "Market News"}
          </span>

          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: "#93c5fd",
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 10,
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Read article
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function NewsTab({ symbol, company }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [sortOrder, setSortOrder] = useState("latest");
  const [visibleCount, setVisibleCount] = useState(8);

  const loadNews = useCallback(
    async ({ signal, refresh = false } = {}) => {
      const cleanedSymbol = String(symbol || "").trim();
      const cleanedCompany = String(company || "").trim();

      if (!cleanedSymbol && !cleanedCompany) {
        setNews([]);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const parameters = new URLSearchParams();

        if (cleanedSymbol) {
          parameters.set("symbol", cleanedSymbol);
        }

        if (cleanedCompany) {
          parameters.set("company", cleanedCompany);
        }

        parameters.set("limit", "30");

        if (refresh) {
          parameters.set("refresh", "1");
        }

        const response = await fetch(
          `/api/stock-news?${parameters.toString()}`,
          {
            headers: { Accept: "application/json" },
            signal,
          },
        );

        const data = await response.json();

        if (!response.ok || data?.success !== true) {
          throw new Error(
            data?.error || "Unable to load stock-related news.",
          );
        }

        setNews(Array.isArray(data.news) ? data.news : []);
        setVisibleCount(8);
      } catch (caughtError) {
        if (caughtError?.name === "AbortError") return;

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "Unable to load stock-related news.",
        );

        setNews([]);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [symbol, company],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadNews({ signal: controller.signal });

    return () => controller.abort();
  }, [loadNews]);

  const sources = useMemo(
    () => [
      "All",
      ...new Set(news.map((item) => item.publisher).filter(Boolean)),
    ],
    [news],
  );

  const counts = useMemo(
    () =>
      news.reduce(
        (summary, item) => {
          const sentiment = SENTIMENTS.includes(item.sentiment)
            ? item.sentiment
            : "Neutral";

          summary[sentiment] += 1;
          return summary;
        },
        { Positive: 0, Neutral: 0, Negative: 0 },
      ),
    [news],
  );

  const filteredNews = useMemo(() => {
    return [...news]
      .filter((item) => {
        if (
          sentimentFilter !== "All" &&
          item.sentiment !== sentimentFilter
        ) {
          return false;
        }

        if (
          sourceFilter !== "All" &&
          item.publisher !== sourceFilter
        ) {
          return false;
        }

        return true;
      })
      .sort((first, second) => {
        const firstTime = new Date(first.publishedAt || 0).getTime() || 0;
        const secondTime = new Date(second.publishedAt || 0).getTime() || 0;

        return sortOrder === "oldest"
          ? firstTime - secondTime
          : secondTime - firstTime;
      });
  }, [news, sentimentFilter, sourceFilter, sortOrder]);

  const visibleNews = filteredNews.slice(0, visibleCount);

  const yahooNewsUrl = symbol
    ? `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/news/`
    : "https://finance.yahoo.com/news/";

  return (
    <div style={{ paddingTop: 16 }}>
      <section
        style={{
          padding: 18,
          border: "1px solid #1e3350",
          borderRadius: 16,
          background:
            "linear-gradient(145deg, rgba(10,24,43,.98), rgba(7,18,35,.98))",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <span
              style={{
                color: "#60a5fa",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: ".14em",
                textTransform: "uppercase",
              }}
            >
              Latest coverage
            </span>

            <h2
              style={{
                margin: "6px 0 0",
                color: "#f8fafc",
                fontSize: 20,
              }}
            >
              {company || symbol || "Stock"} news
            </h2>

            <p
              style={{
                maxWidth: 700,
                margin: "7px 0 0",
                color: "#94a3b8",
                fontSize: 12,
                lineHeight: 1.65,
              }}
            >
              Filter company-specific headlines by source and headline sentiment.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadNews({ refresh: true })}
            disabled={loading}
            style={{
              minHeight: 38,
              padding: "8px 12px",
              border: "1px solid rgba(96,165,250,.25)",
              borderRadius: 10,
              color: "#93c5fd",
              background: "rgba(37,99,235,.1)",
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 11,
              fontWeight: 750,
            }}
          >
            {loading ? (
              <LoaderCircle size={14} className="exa-analyze-spinner" />
            ) : (
              <RefreshCw size={14} />
            )}
            Refresh news
          </button>
        </div>

        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <SummaryCard label="Total articles" value={news.length} color="#f8fafc" />
          <SummaryCard label="Positive" value={counts.Positive} color="#22c55e" />
          <SummaryCard label="Neutral" value={counts.Neutral} color="#60a5fa" />
          <SummaryCard label="Negative" value={counts.Negative} color="#fb7185" />
        </div>
      </section>

      <section
        style={{
          marginTop: 14,
          padding: 14,
          border: "1px solid #1e3350",
          borderRadius: 14,
          background: "#0b1729",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <Filter size={15} color="#60a5fa" />

        {SENTIMENTS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setSentimentFilter(option);
              setVisibleCount(8);
            }}
            style={{
              minHeight: 32,
              padding: "6px 11px",
              border:
                sentimentFilter === option
                  ? "1px solid rgba(96,165,250,.45)"
                  : "1px solid #1e3350",
              borderRadius: 999,
              color: sentimentFilter === option ? "#fff" : "#94a3b8",
              background:
                sentimentFilter === option
                  ? "rgba(37,99,235,.2)"
                  : "#101e34",
              cursor: "pointer",
              fontSize: 10,
              fontWeight: 750,
            }}
          >
            {option}
          </button>
        ))}

        <select
          value={sourceFilter}
          onChange={(event) => {
            setSourceFilter(event.target.value);
            setVisibleCount(8);
          }}
          style={{
            marginLeft: "auto",
            minHeight: 32,
            maxWidth: 180,
            padding: "5px 9px",
            border: "1px solid #1e3350",
            borderRadius: 8,
            color: "#cbd5e1",
            background: "#101e34",
            fontSize: 10,
          }}
        >
          {sources.map((source) => (
            <option key={source} value={source}>
              {source === "All" ? "All sources" : source}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() =>
            setSortOrder((current) =>
              current === "latest" ? "oldest" : "latest",
            )
          }
          style={{
            minHeight: 32,
            padding: "6px 10px",
            border: "1px solid #1e3350",
            borderRadius: 8,
            color: "#cbd5e1",
            background: "#101e34",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            fontSize: 10,
            fontWeight: 700,
          }}
        >
          <ArrowDownUp size={13} />
          {sortOrder === "latest" ? "Latest first" : "Oldest first"}
        </button>
      </section>

      <section style={{ marginTop: 14 }}>
        {loading ? (
          <NewsSkeleton />
        ) : error ? (
          <div
            style={{
              padding: 28,
              border: "1px solid rgba(251,113,133,.24)",
              borderRadius: 16,
              color: "#fda4af",
              background: "rgba(127,29,29,.14)",
              textAlign: "center",
            }}
          >
            <AlertCircle size={24} />
            <strong style={{ display: "block", marginTop: 10 }}>
              News unavailable
            </strong>
            <p style={{ margin: "7px 0 0", fontSize: 11 }}>{error}</p>
          </div>
        ) : visibleNews.length > 0 ? (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 14,
              }}
            >
              {visibleNews.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>

            {visibleCount < filteredNews.length && (
              <div style={{ marginTop: 16, textAlign: "center" }}>
                <button
                  type="button"
                  onClick={() => setVisibleCount((current) => current + 8)}
                  style={{
                    minHeight: 38,
                    padding: "8px 15px",
                    border: "1px solid rgba(96,165,250,.28)",
                    borderRadius: 10,
                    color: "#93c5fd",
                    background: "rgba(37,99,235,.1)",
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 750,
                  }}
                >
                  Load more articles
                </button>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              padding: 34,
              border: "1px solid #1e3350",
              borderRadius: 16,
              color: "#94a3b8",
              background: "#0b1729",
              textAlign: "center",
            }}
          >
            <Newspaper size={26} color="#60a5fa" />
            <strong
              style={{
                display: "block",
                marginTop: 10,
                color: "#f8fafc",
              }}
            >
              No matching articles
            </strong>
          </div>
        )}
      </section>

      <div
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTop: "1px solid #1e3350",
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span style={{ color: "#64748b", fontSize: 10 }}>
          Sentiment uses headline keywords and is not investment advice.
        </span>

        <a
          href={yahooNewsUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#93c5fd",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 10,
            fontWeight: 750,
            textDecoration: "none",
          }}
        >
          Open Yahoo Finance news
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}