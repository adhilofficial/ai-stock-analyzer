import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  ExternalLink,
  Newspaper,
  RefreshCw,
} from "lucide-react";

function formatRelativeTime(value) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  const difference = Date.now() - date.getTime();

  if (difference < 60_000) {
    return "Just now";
  }

  const minutes = Math.floor(difference / 60_000);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
  }).format(date);
}

function NewsSkeleton() {
  return (
    <div className="exa-stock-news-skeleton">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="exa-news-skeleton-item"
        >
          <span />

          <div>
            <i />
            <i />
            <i />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StockNewsPanel({
  symbol,
  company,
}) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadNews = useCallback(
    async (signal) => {
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

        const response = await fetch(
          `/api/stock-news?${parameters.toString()}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
            signal,
          },
        );

        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            "The stock-news endpoint returned a non-JSON response.",
          );
        }

        const data = await response.json();

        if (!response.ok || data?.success !== true) {
          throw new Error(
            data?.error || "Unable to load stock-related news.",
          );
        }

        setNews(Array.isArray(data?.news) ? data.news : []);
      } catch (caughtError) {
        if (caughtError?.name === "AbortError") {
          return;
        }

        console.error("Stock news loading error:", caughtError);

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

    loadNews(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadNews]);

  function retryNews() {
    loadNews();
  }

  const yahooNewsUrl = symbol
    ? `https://finance.yahoo.com/quote/${encodeURIComponent(
        symbol,
      )}/news/`
    : "https://finance.yahoo.com/news/";

  return (
    <article className="exa-stock-news-card">
      <div className="exa-stock-news-heading">
        <div className="exa-stock-news-title">
          <span>
            <Newspaper size={17} />
          </span>

          <div>
            <p>LATEST COVERAGE</p>
            <h3>Stock-related news</h3>
          </div>
        </div>

        {!loading && (
          <button
            type="button"
            className="exa-news-refresh-button"
            onClick={retryNews}
            aria-label="Refresh stock news"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      <p className="exa-stock-news-company">
        Latest updates related to{" "}
        <strong>{company || symbol || "this company"}</strong>
      </p>

      {loading ? (
        <NewsSkeleton />
      ) : error ? (
        <div className="exa-stock-news-message">
          <AlertCircle size={18} />
          <strong>News unavailable</strong>
          <p>{error}</p>

          <button type="button" onClick={retryNews}>
            Try again
          </button>
        </div>
      ) : news.length > 0 ? (
        <div className="exa-stock-news-list">
          {news.map((article) => (
            <a
              key={article.id}
              className="exa-stock-news-item"
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {article.thumbnail ? (
                <img
                  src={article.thumbnail}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <span className="exa-news-image-fallback">
                  <Newspaper size={18} />
                </span>
              )}

              <div className="exa-stock-news-copy">
                <h4>{article.title}</h4>

                <div className="exa-stock-news-meta">
                  <span>{article.publisher}</span>
                  <i aria-hidden="true">•</i>
                  <span>{formatRelativeTime(article.publishedAt)}</span>
                  <ExternalLink size={11} />
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="exa-stock-news-message">
          <Newspaper size={20} />
          <strong>No recent news found</strong>
          <p>
            Yahoo Finance has not returned recent coverage for this stock.
          </p>
        </div>
      )}

      <a
        className="exa-stock-news-footer"
        href={yahooNewsUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        View more news on Yahoo Finance
        <ExternalLink size={12} />
      </a>
    </article>
  );
}