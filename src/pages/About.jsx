import {
  BarChart3,
  BrainCircuit,
  Building2,
  Database,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import AppShell from "../components/layout/AppShell";
import LegalFooter from "../components/legal/LegalFooter";
import BRAND from "../config/brand";

const platformFeatures = [
  {
    icon: BarChart3,
    title: "Market intelligence",
    description:
      "Explore Indian market movements, stock fundamentals, technical indicators and market activity through one unified platform.",
  },
  {
    icon: BrainCircuit,
    title: "AI-assisted research",
    description:
      "Convert structured market information into readable research summaries, important themes, potential opportunities and key risks.",
  },
  {
    icon: Database,
    title: "Connected financial data",
    description:
      "Litses combines available market prices, company information, historical data and news from connected data services.",
  },
  {
    icon: ShieldCheck,
    title: "Research transparency",
    description:
      "The platform clearly communicates the limitations of market data, model-generated scores and AI-assisted analysis.",
  },
];

export default function About() {
  return (
    <AppShell>
      <main className="exa-about-page">
        <section className="exa-about-hero">
          <div className="exa-about-hero__content">
            <span className="exa-about-eyebrow">
              About {BRAND.company}
            </span>

            <h1>
              Building intelligent tools for financial-market research
            </h1>

            <p>
              <strong>{BRAND.product}</strong> is an AI-powered Indian
              financial-market research and analytics platform built to
              make complex market information easier to understand.
            </p>
          </div>

          <div className="exa-about-hero__visual">
            <div className="exa-about-brand-mark">
              <Sparkles size={32} aria-hidden="true" />
            </div>

            <strong>{BRAND.company}</strong>
            <span>Financial technology and AI research</span>
          </div>
        </section>

        <section className="exa-about-introduction">
          <div className="exa-about-section-heading">
            <span>Our product</span>
            <h2>Litses</h2>
          </div>

          <div className="exa-about-introduction__content">
            <p>
              Litses is being developed as a modern research
              workspace for people who want to understand Indian stocks,
              market movements and financial information through a clear
              and structured interface.
            </p>

            <p>
              The platform combines financial data, analytical indicators
              and artificial intelligence to help users perform additional
              research. It does not replace independent verification or
              personalised professional advice.
            </p>
          </div>
        </section>

        <section className="exa-about-mission">
          <div className="exa-about-mission__icon">
            <Building2 size={25} aria-hidden="true" />
          </div>

          <div>
            <span>Our mission</span>

            <h2>
              Make financial-market research easier to understand and
              access
            </h2>

            <p>
              Our goal is to transform complex market information into an
              organised research experience while maintaining clear
              communication about data quality, risk and AI limitations.
            </p>
          </div>
        </section>

        <section className="exa-about-platform">
          <div className="exa-about-section-heading">
            <span>Platform capabilities</span>
            <h2>Research tools inside Litses</h2>
          </div>

          <div className="exa-about-feature-grid">
            {platformFeatures.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  className="exa-about-feature"
                  key={feature.title}
                >
                  <div className="exa-about-feature__icon">
                    <Icon size={21} aria-hidden="true" />
                  </div>

                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <LegalFooter />
      </main>
    </AppShell>
  );
}
