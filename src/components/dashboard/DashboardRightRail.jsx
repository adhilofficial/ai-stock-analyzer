import CompactWatchlist from "./CompactWatchlist";
import ImportantAlerts from "./ImportantAlerts";
import NewsInsightsCard from "./NewsInsightsCard";
import RecentAnalyses from "./RecentAnalyses";

const DEFAULT_NEWS_ARTICLES = [
  {
    id: "breadth-guide",
    title:
      "How to read market breadth alongside NIFTY 50",
    summary:
      "Learn why advancing and declining stocks can confirm or question an index move.",
    source: "EXA Learn",
    time: "12m ago",
  },
  {
    id: "vix-guide",
    title:
      "Why India VIX matters for short-term market risk",
    summary:
      "A simple guide to interpreting changes in expected market volatility.",
    source: "EXA Research",
    time: "28m ago",
  },
  {
    id: "sector-rotation",
    title:
      "Understanding sector rotation in Indian equities",
    summary:
      "See how money can move between banking, IT, energy, FMCG and other sectors.",
    source: "EXA Learn",
    time: "1h ago",
  },
  {
    id: "volume-signals",
    title:
      "Using volume spikes as an educational research signal",
    summary:
      "Higher-than-normal volume may indicate increased participation or unusual activity.",
    source: "EXA Research",
    time: "2h ago",
  },
];

export default function DashboardRightRail({
  watchlist = [],
  alerts = [],
  recentAnalyses = [],
  newsArticles = [],
  watchlistLoading = false,
  watchlistError = "",
  alertsLoading = false,
  alertsError = "",
  newsLoading = false,
  newsError = "",
  onAnalyze,
  onRemoveStock,
  onClearAnalyses,
  onViewWatchlist,
  onViewNews,
  onOpenNewsArticle,
}) {
  const visibleAlerts = Array.isArray(alerts)
    ? alerts.slice(0, 4)
    : [];

  const visibleAnalyses = Array.isArray(
    recentAnalyses,
  )
    ? recentAnalyses.slice(0, 3)
    : [];

  const visibleNews =
    Array.isArray(newsArticles) &&
    newsArticles.length > 0
      ? newsArticles
      : DEFAULT_NEWS_ARTICLES;

  return (
    <aside className="exa-dashboard-right-rail">
      <CompactWatchlist
        stocks={watchlist}
        loading={watchlistLoading}
        error={watchlistError}
        onAnalyze={onAnalyze}
        onRemove={onRemoveStock}
        onViewAll={onViewWatchlist}
      />

      <div className="exa-right-rail-section exa-right-rail-news">
        <NewsInsightsCard
          articles={visibleNews}
          loading={newsLoading}
          error={newsError}
          onViewAll={onViewNews}
          onOpenArticle={onOpenNewsArticle}
        />
      </div>

      <div className="exa-right-rail-section exa-right-rail-alerts">
        <ImportantAlerts
          alerts={visibleAlerts}
          onAnalyze={onAnalyze}
        />

        {alertsLoading && (
          <p className="exa-right-rail-status">
            Generating live alerts...
          </p>
        )}

        {alertsError && (
          <p className="exa-right-rail-status error">
            Live alerts are temporarily unavailable.
          </p>
        )}
      </div>

      <div className="exa-right-rail-section exa-right-rail-recent">
        <RecentAnalyses
          analyses={visibleAnalyses}
          onAnalyze={onAnalyze}
          onClear={onClearAnalyses}
        />
      </div>
    </aside>
  );
}
