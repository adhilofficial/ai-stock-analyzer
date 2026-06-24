import CompactWatchlist from
  "./CompactWatchlist";

import ImportantAlerts from
  "./ImportantAlerts";

import RecentAnalyses from
  "./RecentAnalyses";

export default function DashboardRightRail({
  watchlist = [],
  alerts = [],
  recentAnalyses = [],
  watchlistLoading = false,
  watchlistError = "",
  alertsLoading = false,
  alertsError = "",
  onAnalyze,
  onRemoveStock,
  onClearAnalyses,
  onViewWatchlist,
}) {
  const visibleAlerts =
    Array.isArray(alerts)
      ? alerts.slice(0, 5)
      : [];

  const visibleAnalyses =
    Array.isArray(
      recentAnalyses,
    )
      ? recentAnalyses.slice(0, 4)
      : [];

  return (
    <aside className="exa-dashboard-right-rail">
      <CompactWatchlist
        stocks={watchlist}
        loading={watchlistLoading}
        error={watchlistError}
        onAnalyze={onAnalyze}
        onRemove={onRemoveStock}
        onViewAll={
          onViewWatchlist
        }
      />

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
          analyses={
            visibleAnalyses
          }
          onAnalyze={onAnalyze}
          onClear={
            onClearAnalyses
          }
        />
      </div>
    </aside>
  );
}