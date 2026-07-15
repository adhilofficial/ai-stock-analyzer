import {
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  Database,
  ShieldAlert,
} from "lucide-react";

import BRAND from "../config/brand";
import { LEGAL_COPY } from "../config/legal";

const disclaimerSections = [
  {
    id: "informational-purpose",
    icon: BarChart3,
    title: "Informational purpose",
    content:
      "The platform is designed to help users explore financial-market information, company data, market trends and AI-generated research summaries. The information is general in nature and is not prepared for the personal circumstances of any individual user.",
  },
  {
    id: "no-personalised-advice",
    icon: ShieldAlert,
    title: "No personalised investment advice",
    content:
      "Litses does not evaluate your income, liabilities, investment objectives, financial condition, risk tolerance or investment horizon. Content displayed by the platform should not be interpreted as personalised financial, investment, tax or legal advice.",
  },
  {
    id: "ai-limitations",
    icon: BrainCircuit,
    title: "Artificial intelligence limitations",
    content: LEGAL_COPY.aiWarning,
  },
  {
    id: "data-limitations",
    icon: Database,
    title: "Market-data limitations",
    content: LEGAL_COPY.dataWarning,
  },
  {
    id: "investment-risk",
    icon: AlertTriangle,
    title: "Investment and trading risk",
    content: LEGAL_COPY.riskWarning,
  },
];

export default function Disclaimer() {
  return (
    <main className="legal-page">
      <header className="legal-page__hero">
        <span className="legal-page__eyebrow">
          {BRAND.company}
        </span>

        <h1>Financial Research Disclaimer</h1>

        <p>
          Please read this information before using{" "}
          {BRAND.product}.
        </p>
      </header>

      <section className="legal-page__summary">
        <ShieldAlert
          size={24}
          aria-hidden="true"
        />

        <div>
          <strong>Important</strong>
          <p>{LEGAL_COPY.fullDisclaimer}</p>
        </div>
      </section>

      <div className="legal-page__sections">
        {disclaimerSections.map((section) => {
          const Icon = section.icon;

          return (
            <section
              className="legal-section"
              id={section.id}
              key={section.id}
            >
              <div className="legal-section__icon">
                <Icon
                  size={21}
                  aria-hidden="true"
                />
              </div>

              <div>
                <h2>{section.title}</h2>
                <p>{section.content}</p>
              </div>
            </section>
          );
        })}
      </div>

      <section className="legal-page__responsibility">
        <h2>User responsibility</h2>

        <p>
          Before making an investment or trading decision, users
          should independently verify the relevant financial
          information, exchange announcements, company filings,
          risks and suitability of the decision.
        </p>

        <p>
          Seek assistance from an appropriately qualified and
          registered professional when personalised guidance is
          required.
        </p>
      </section>

      <p className="legal-page__last-updated">
        Last updated: June 29, 2026
      </p>
    </main>
  );
}
