import { useState } from "react";

import {
  ArrowDown,
  ArrowUp,
  Clock3,
  Newspaper,
} from "lucide-react";

function formatRelativeTime(value) {
  if (!value) {
    return "Recently";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const difference =
    Date.now() - date.getTime();

  const minutes = Math.floor(
    difference / 60000,
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(
    hours / 24,
  );

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
    },
  ).format(date);
}

function NewsThumbnail({ article }) {
  const title =
    article?.title || "Market news";

  if (article?.imageUrl) {
    return (
      <span className="exa-news-thumbnail">
        <img
          src={article.imageUrl}
          alt=""
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display =
              "none";

            const fallback =
              event.currentTarget
                .nextElementSibling;

            if (fallback) {
              fallback.style.display =
                "flex";
            }
          }}
        />

        <span
          className="exa-news-thumbnail-fallback"
          style={{
            display: "none",
          }}
        >
          <Newspaper size={17} />
        </span>
      </span>
    );
  }

  return (
    <span className="exa-news-thumbnail">
      <span className="exa-news-thumbnail-fallback">
        <Newspaper size={17} />
      </span>

      <span className="sr-only">
        {title}
      </span>
    </span>
  );
}

export default function NewsInsightsCard({
  articles = [],
  loading = false,
  error = "",
  onViewAll,
  onOpenArticle,
}) {
  const [expanded, setExpanded] =
    useState(false);

  const normalizedArticles =
    Array.isArray(articles)
      ? articles
      : [];

  const hasMoreArticles =
    normalizedArticles.length > 4;

  const visibleArticles = expanded
    ? normalizedArticles
    : normalizedArticles.slice(0, 4);

  function handleToggleViewAll() {
    if (
      typeof onViewAll === "function"
    ) {
      onViewAll();
      return;
    }

    setExpanded(
      (currentValue) =>
        !currentValue,
    );
  }

  function handleOpenArticle(article) {
    if (
      typeof onOpenArticle ===
      "function"
    ) {
      onOpenArticle(article);
      return;
    }

    if (
      article?.url &&
      typeof window !== "undefined"
    ) {
      window.open(
        article.url,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }

  return (
    <article className="exa-dashboard-card exa-news-insights-card">
      <div className="exa-news-card-header">
        <div>
          <p className="exa-card-eyebrow">
            MARKET INTELLIGENCE
          </p>

          <h2>News &amp; Insights</h2>
        </div>

        {hasMoreArticles && (
          <button
            type="button"
            className="exa-news-view-all-top"
            onClick={handleToggleViewAll}
            aria-expanded={expanded}
          >
            {expanded
              ? "Show less"
              : "View all"}

            {expanded ? (
              <ArrowUp size={13} />
            ) : (
              <ArrowDown size={13} />
            )}
          </button>
        )}
      </div>

      {loading ? (
        <div className="exa-news-loading-list">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="exa-news-loading-row"
            >
              <span />

              <div>
                <span />
                <span />
                <span />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="exa-news-empty-state error">
          <Newspaper size={21} />

          <strong>
            News temporarily unavailable
          </strong>

          <p>
            Market data is still available.
          </p>
        </div>
      ) : visibleArticles.length === 0 ? (
        <div className="exa-news-empty-state">
          <Newspaper size={21} />

          <strong>
            No recent news
          </strong>

          <p>
            New market stories will appear
            here.
          </p>
        </div>
      ) : (
        <div className="exa-news-list">
          {visibleArticles.map(
            (article, index) => (
              <button
                key={
                  article?.id ||
                  article?.url ||
                  `${article?.title}-${index}`
                }
                type="button"
                className="exa-news-row"
                onClick={() =>
                  handleOpenArticle(
                    article,
                  )
                }
              >
                <span className="exa-news-copy">
                  <strong>
                    {article?.title ||
                      "Market update"}
                  </strong>

                  {article?.summary && (
                    <span className="exa-news-summary">
                      {article.summary}
                    </span>
                  )}

                  <span className="exa-news-meta">
                    <span>
                      {article?.source ||
                        "Litses Market News"}
                    </span>

                    <span aria-hidden="true">
                      •
                    </span>

                    <span>
                      <Clock3 size={10} />

                      {formatRelativeTime(
                        article?.publishedAt ||
                          article?.time,
                      )}
                    </span>
                  </span>
                </span>

                <NewsThumbnail
                  article={article}
                />
              </button>
            ),
          )}
        </div>
      )}

      <p className="exa-news-disclaimer">
        News content is provided for
        informational and educational
        purposes.
      </p>
    </article>
  );
}
