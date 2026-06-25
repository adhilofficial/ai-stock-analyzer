import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import ScoreGauge from "../ScoreGauge";

function getRiskClass(riskLevel) {
  const normalizedRisk = String(
    riskLevel || "Moderate",
  )
    .trim()
    .toLowerCase();

  if (normalizedRisk === "low") {
    return "low";
  }

  if (normalizedRisk === "high") {
    return "high";
  }

  return "moderate";
}

function InsightList({
  items = [],
  emptyMessage,
  type,
}) {
  const normalizedItems =
    Array.isArray(items)
      ? items.filter(Boolean)
      : [];

  if (normalizedItems.length === 0) {
    return (
      <p className="exa-ai-insight-empty">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="exa-ai-insight-list">
      {normalizedItems.map(
        (item, index) => (
          <div
            key={`${item}-${index}`}
            className={`exa-ai-insight-item ${type}`}
          >
            <span
              className="exa-ai-insight-marker"
              aria-hidden="true"
            />

            <p>{item}</p>
          </div>
        ),
      )}
    </div>
  );
}

export default function PremiumAiResearchPanel({
  result,
  aiNotice = "",
}) {
  if (!result) {
    return null;
  }

  const confidenceScore = Math.min(
    100,
    Math.max(
      0,
      Number(
        result.confidenceScore,
      ) || 0,
    ),
  );

  const riskLevel =
    result.riskLevel ||
    "Moderate";

  const riskClass =
    getRiskClass(riskLevel);

  const keyThemes =
    Array.isArray(result.keyThemes)
      ? result.keyThemes.filter(Boolean)
      : [];

  return (
    <aside className="exa-premium-ai-panel">
      <article className="exa-ai-confidence-card">
        <div className="exa-ai-card-heading">
          <div>
            <p>EXA RESEARCH SIGNAL</p>

            <h3>
              AI confidence &amp; risk
            </h3>
          </div>

          <span className="exa-ai-card-icon">
            <BrainCircuit size={18} />
          </span>
        </div>

        <div className="exa-ai-confidence-layout">
          <div className="exa-ai-gauge-wrapper">
            <ScoreGauge
              score={confidenceScore}
              size={92}
            />

            <span>
              Confidence score
            </span>
          </div>

          <div className="exa-ai-risk-column">
            <span className="exa-ai-risk-label">
              Risk assessment
            </span>

            <div
              className={`exa-ai-risk-badge ${riskClass}`}
            >
              <span />

              {riskLevel} risk
            </div>

            <p>
              Based on available market,
              valuation and AI research
              signals.
            </p>
          </div>
        </div>

        <div className="exa-ai-confidence-footer">
          <CheckCircle2 size={13} />

          <span>
            {result.aiAvailable
              ? "AI research successfully generated"
              : "Live market data available — AI analysis unavailable"}
          </span>
        </div>
      </article>

      <article className="exa-ai-summary-card">
        <div className="exa-ai-summary-heading">
          <span>
            <Sparkles size={17} />
          </span>

          <div>
            <p>AI-ASSISTED INSIGHT</p>

            <h3>
              Research summary
            </h3>
          </div>
        </div>

        <p className="exa-ai-summary-text">
          {result.summary ||
            aiNotice ||
            "AI research is temporarily unavailable. Live prices, valuation metrics and chart information are still available."}
        </p>

        <div className="exa-ai-themes-section">
          <p className="exa-ai-section-label">
            Key themes
          </p>

          {keyThemes.length > 0 ? (
            <div className="exa-ai-theme-list">
              {keyThemes.map(
                (theme, index) => (
                  <span
                    key={`${theme}-${index}`}
                  >
                    {theme}
                  </span>
                ),
              )}
            </div>
          ) : (
            <p className="exa-ai-insight-empty">
              No AI themes are currently
              available.
            </p>
          )}
        </div>
      </article>

      <article className="exa-ai-insights-card positive">
        <div className="exa-ai-insights-heading">
          <span>
            <ShieldCheck size={17} />
          </span>

          <div>
            <p>OPPORTUNITY ANALYSIS</p>

            <h3>Growth drivers</h3>
          </div>
        </div>

        <InsightList
          items={result.growthDrivers}
          emptyMessage="AI growth drivers are currently unavailable."
          type="positive"
        />
      </article>

      <article className="exa-ai-insights-card negative">
        <div className="exa-ai-insights-heading">
          <span>
            <AlertTriangle size={17} />
          </span>

          <div>
            <p>RISK ANALYSIS</p>

            <h3>Key risks</h3>
          </div>
        </div>

        <InsightList
          items={result.keyRisks}
          emptyMessage="AI risk analysis is currently unavailable."
          type="negative"
        />
      </article>

      <div className="exa-ai-research-disclaimer">
        Market data source:{" "}
        <strong>
          {result.source ||
            "Yahoo Finance"}
        </strong>
        . EXA research indicators are for
        educational purposes and are not
        personalized investment advice.
      </div>

      <style>
        {`
          .exa-premium-ai-panel {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .exa-ai-confidence-card,
          .exa-ai-summary-card,
          .exa-ai-insights-card {
            min-width: 0;
            padding: 18px;
            border: 1px solid rgba(148, 163, 184, 0.13);
            border-radius: 18px;
            background:
              linear-gradient(
                145deg,
                rgba(13, 27, 49, 0.95),
                rgba(7, 17, 32, 0.97)
              );
            box-shadow:
              0 18px 48px rgba(0, 0, 0, 0.17);
          }

          .exa-ai-card-heading {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 14px;
          }

          .exa-ai-card-heading p,
          .exa-ai-summary-heading p,
          .exa-ai-insights-heading p {
            margin: 0 0 4px;
            color: #60a5fa;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: 0.12em;
          }

          .exa-ai-card-heading h3,
          .exa-ai-summary-heading h3,
          .exa-ai-insights-heading h3 {
            margin: 0;
            color: #eaf1fb;
            font-size: 14px;
            line-height: 1.4;
          }

          .exa-ai-card-icon {
            width: 36px;
            height: 36px;
            flex-shrink: 0;
            border: 1px solid rgba(96, 165, 250, 0.16);
            border-radius: 11px;
            color: #60a5fa;
            background: rgba(37, 99, 235, 0.1);
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .exa-ai-confidence-layout {
            margin-top: 19px;
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            align-items: center;
            gap: 20px;
          }

          .exa-ai-gauge-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .exa-ai-gauge-wrapper > span {
            margin-top: 7px;
            color: #64748b;
            font-size: 9px;
            font-weight: 650;
          }

          .exa-ai-risk-column {
            min-width: 0;
          }

          .exa-ai-risk-label {
            color: #64748b;
            font-size: 9px;
            font-weight: 650;
          }

          .exa-ai-risk-badge {
            width: fit-content;
            min-height: 30px;
            margin-top: 8px;
            padding: 0 11px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 800;
            display: inline-flex;
            align-items: center;
            gap: 7px;
          }

          .exa-ai-risk-badge > span {
            width: 7px;
            height: 7px;
            border-radius: 50%;
          }

          .exa-ai-risk-badge.low {
            border: 1px solid rgba(52, 211, 153, 0.22);
            color: #6ee7b7;
            background: rgba(6, 78, 59, 0.15);
          }

          .exa-ai-risk-badge.low > span {
            background: #34d399;
          }

          .exa-ai-risk-badge.moderate {
            border: 1px solid rgba(250, 204, 21, 0.22);
            color: #fde047;
            background: rgba(113, 63, 18, 0.16);
          }

          .exa-ai-risk-badge.moderate > span {
            background: #facc15;
          }

          .exa-ai-risk-badge.high {
            border: 1px solid rgba(251, 113, 133, 0.23);
            color: #fda4af;
            background: rgba(136, 19, 55, 0.16);
          }

          .exa-ai-risk-badge.high > span {
            background: #fb7185;
          }

          .exa-ai-risk-column p {
            margin: 9px 0 0;
            color: #526178;
            font-size: 8px;
            line-height: 1.55;
          }

          .exa-ai-confidence-footer {
            margin-top: 17px;
            padding-top: 13px;
            border-top: 1px solid rgba(148, 163, 184, 0.09);
            color: #68809d;
            font-size: 8px;
            line-height: 1.4;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .exa-ai-confidence-footer svg {
            flex-shrink: 0;
            color: #34d399;
          }

          .exa-ai-summary-heading,
          .exa-ai-insights-heading {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .exa-ai-summary-heading > span,
          .exa-ai-insights-heading > span {
            width: 35px;
            height: 35px;
            flex-shrink: 0;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          }

          .exa-ai-summary-heading > span {
            border: 1px solid rgba(96, 165, 250, 0.16);
            color: #60a5fa;
            background: rgba(37, 99, 235, 0.1);
          }

          .exa-ai-summary-text {
            margin: 16px 0 0;
            color: #aebbd0;
            font-size: 11px;
            line-height: 1.75;
          }

          .exa-ai-themes-section {
            margin-top: 17px;
            padding-top: 14px;
            border-top: 1px solid rgba(148, 163, 184, 0.09);
          }

          .exa-ai-section-label {
            margin: 0 0 8px;
            color: #64748b;
            font-size: 9px;
            font-weight: 700;
          }

          .exa-ai-theme-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }

          .exa-ai-theme-list span {
            padding: 5px 9px;
            border: 1px solid rgba(96, 165, 250, 0.13);
            border-radius: 999px;
            color: #93c5fd;
            background: rgba(37, 99, 235, 0.08);
            font-size: 8px;
            line-height: 1.3;
          }

          .exa-ai-insights-card.positive {
            border-color: rgba(52, 211, 153, 0.16);
            background:
              linear-gradient(
                145deg,
                rgba(5, 46, 22, 0.31),
                rgba(7, 24, 31, 0.95)
              );
          }

          .exa-ai-insights-card.negative {
            border-color: rgba(251, 113, 133, 0.17);
            background:
              linear-gradient(
                145deg,
                rgba(69, 10, 10, 0.28),
                rgba(26, 15, 25, 0.95)
              );
          }

          .exa-ai-insights-card.positive
            .exa-ai-insights-heading > span {
            border: 1px solid rgba(52, 211, 153, 0.19);
            color: #34d399;
            background: rgba(6, 78, 59, 0.14);
          }

          .exa-ai-insights-card.negative
            .exa-ai-insights-heading > span {
            border: 1px solid rgba(251, 113, 133, 0.2);
            color: #fb7185;
            background: rgba(136, 19, 55, 0.13);
          }

          .exa-ai-insights-card.positive
            .exa-ai-insights-heading p {
            color: #34d399;
          }

          .exa-ai-insights-card.negative
            .exa-ai-insights-heading p {
            color: #fb7185;
          }

          .exa-ai-insight-list {
            margin-top: 14px;
            display: flex;
            flex-direction: column;
            gap: 9px;
          }

          .exa-ai-insight-item {
            min-width: 0;
            display: grid;
            grid-template-columns: auto minmax(0, 1fr);
            align-items: flex-start;
            gap: 8px;
          }

          .exa-ai-insight-marker {
            width: 6px;
            height: 6px;
            margin-top: 6px;
            border-radius: 50%;
          }

          .exa-ai-insight-item.positive
            .exa-ai-insight-marker {
            background: #34d399;
          }

          .exa-ai-insight-item.negative
            .exa-ai-insight-marker {
            background: #fb7185;
          }

          .exa-ai-insight-item p {
            margin: 0;
            color: #aebbd0;
            font-size: 9px;
            line-height: 1.6;
          }

          .exa-ai-insight-empty {
            margin: 13px 0 0;
            color: #596980;
            font-size: 9px;
            line-height: 1.55;
          }

          .exa-ai-research-disclaimer {
            padding: 3px 9px;
            color: #46546a;
            font-size: 8px;
            line-height: 1.6;
            text-align: center;
          }

          .exa-ai-research-disclaimer strong {
            color: #64748b;
          }

          @media (max-width: 1150px) {
            .exa-ai-confidence-layout {
              grid-template-columns: 1fr;
              justify-items: flex-start;
            }

            .exa-ai-gauge-wrapper {
              align-items: flex-start;
            }
          }

          @media (max-width: 700px) {
            .exa-ai-confidence-card,
            .exa-ai-summary-card,
            .exa-ai-insights-card {
              padding: 16px 14px;
              border-radius: 16px;
            }

            .exa-ai-confidence-layout {
              grid-template-columns:
                auto minmax(0, 1fr);
            }

            .exa-ai-gauge-wrapper {
              align-items: center;
            }
          }
        `}
      </style>
    </aside>
  );
}
