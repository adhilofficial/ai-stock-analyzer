import {
  BarChart3,
  BrainCircuit,
  Clock3,
  Database,
  Layers3,
  ShieldCheck,
} from "lucide-react";

import ResearchDisclaimer from "../components/legal/ResearchDisclaimer";
import BRAND from "../config/brand";
import { SIGNAL_EXPLANATIONS } from "../config/legal";

const methodologySteps = [
  {
    icon: Database,
    title: "1. Data collection",
    description:
      "The platform collects available market prices, company fundamentals, historical chart information, market activity and related news from connected data services.",
  },
  {
    icon: Layers3,
    title: "2. Data normalisation",
    description:
      "Raw values are converted into a consistent structure so the dashboard, screener, comparison tools and AI analysis can use the same information.",
  },
  {
    icon: BarChart3,
    title: "3. Analytical indicators",
    description:
      "The platform reviews available fundamental, momentum, valuation, sentiment and risk-related indicators. Missing information should not be treated as a positive or negative signal.",
  },
  {
    icon: BrainCircuit,
    title: "4. AI-assisted interpretation",
    description:
      "The AI layer converts structured market information into a readable research summary, including potential strengths, risks and important themes.",
  },
  {
    icon: ShieldCheck,
    title: "5. Output validation",
    description:
      "Generated output is normalised into expected fields and score ranges before it is displayed. This reduces formatting problems but cannot guarantee that every interpretation is correct.",
  },
  {
    icon: Clock3,
    title: "6. Freshness and caching",
    description:
      "Some responses may be temporarily cached to improve performance and manage external-service limits. Users should review the displayed timestamp and data-status labels.",
  },
];

const signalRows = [
  {
    signal: "Bullish",
    explanation: SIGNAL_EXPLANATIONS.bullish,
  },
  {
    signal: "Bearish",
    explanation: SIGNAL_EXPLANATIONS.bearish,
  },
  {
    signal: "Neutral",
    explanation: SIGNAL_EXPLANATIONS.neutral,
  },
  {
    signal: "Watch",
    explanation: SIGNAL_EXPLANATIONS.watch,
  },
];

export default function Methodology() {
  return (
    <main className="legal-page methodology-page">
      <header className="legal-page__hero">
        <span className="legal-page__eyebrow">
          {BRAND.product}
        </span>

        <h1>Research Methodology</h1>

        <p>
          How market information is transformed into AI-assisted
          research insights.
        </p>
      </header>

      <ResearchDisclaimer />

      <section className="methodology-introduction">
        <h2>How the analysis works</h2>

        <p>
          Litses combines available market information,
          calculated indicators and AI-assisted interpretation.
          The output is designed to support further research, not
          replace independent verification or professional advice.
        </p>
      </section>

      <div className="methodology-steps">
        {methodologySteps.map((step) => {
          const Icon = step.icon;

          return (
            <article
              className="methodology-step"
              key={step.title}
            >
              <div className="methodology-step__icon">
                <Icon
                  size={21}
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2>{step.title}</h2>
                <p>{step.description}</p>
              </div>
            </article>
          );
        })}
      </div>

      <section className="signal-methodology">
        <h2>Understanding research signals</h2>

        <div className="signal-methodology__table">
          {signalRows.map((row) => (
            <div
              className="signal-methodology__row"
              key={row.signal}
            >
              <strong>{row.signal}</strong>
              <p>{row.explanation}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="methodology-limitations">
        <h2>Important limitations</h2>

        <ul>
          <li>
            Data providers can experience delays, errors or
            temporary outages.
          </li>

          <li>
            Company fundamentals may reflect different reporting
            periods.
          </li>

          <li>
            News sentiment can be incomplete or interpreted
            incorrectly.
          </li>

          <li>
            AI-generated text can contain factual or analytical
            errors.
          </li>

          <li>
            Scores and signals can change when new market
            information becomes available.
          </li>

          <li>
            No score, signal or summary guarantees a future market
            outcome.
          </li>
        </ul>
      </section>

      <p className="legal-page__last-updated">
        Last updated: June 29, 2026
      </p>
    </main>
  );
}
