import {
  Activity,
  Mail,
} from "lucide-react";

import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import { Link } from "react-router-dom";

import BRAND from "../../config/brand";

const footerGroups = [
  {
    title: "Company",
    links: [
      {
        label: "About EXA NEXUS",
        to: "/about",
      },
      {
        label: "Contact",
        href: "mailto:adhilofficial0@gmail.com",
      },
      {
        label: "Disclaimer",
        to: "/disclaimer",
      },
      {
        label: "Research methodology",
        to: "/methodology",
      },
    ],
  },
  {
    title: "Markets by exa",
    links: [
      {
        label: "Dashboard",
        to: "/dashboard",
      },
      {
        label: "Stock Analysis",
        to: "/analyze",
      },
      {
        label: "Stock Screener",
        to: "/screener",
      },
      {
        label: "Portfolio",
        to: "/portfolio",
      },
      {
        label: "Market Pulse",
        to: "/market-pulse",
      },
    ],
  },
  {
    title: "Research",
    links: [
      {
        label: "AI Research",
        to: "/research",
      },
      {
        label: "Important Alerts",
        to: "/alerts",
      },
      {
        label: "Learn",
        to: "/learn",
      },
      {
        label: "Compare Stocks",
        to: "/compare",
      },
    ],
  },
];

function FooterLink({ link }) {
  if (link.href) {
    return (
      <a href={link.href}>
        {link.label}
      </a>
    );
  }

  return (
    <Link to={link.to}>
      {link.label}
    </Link>
  );
}

export default function LegalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="exa-company-footer">
      <div className="exa-company-footer__top">
        <div className="exa-company-footer__identity">
          <div className="exa-company-footer__brand">
            <div className="exa-company-footer__brand-icon">
              <Activity size={26} aria-hidden="true" />
            </div>

            <div>
              <strong>{BRAND.product}</strong>
              <span>A product by {BRAND.company}</span>
            </div>
          </div>

          <p>
            AI-powered Indian financial-market research and analytics
            platform.
          </p>

          <a
            className="exa-company-footer__email"
            href="mailto:adhilofficial0@gmail.com"
          >
            <Mail size={16} aria-hidden="true" />
            adhilofficial0@gmail.com
          </a>
        </div>

        <div className="exa-company-footer__groups">
          {footerGroups.map((group) => (
            <div
              className="exa-company-footer__group"
              key={group.title}
            >
              <h3>{group.title}</h3>

              <nav aria-label={group.title}>
                {group.links.map((link) => (
                  <FooterLink
                    key={link.label}
                    link={link}
                  />
                ))}
              </nav>
            </div>
          ))}
        </div>
      </div>

      <div className="exa-company-footer__social">
        <div className="exa-company-footer__social-icons">
          <a
            href="https://www.linkedin.com/in/adhilroshabraham"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn"
          >
           <FaLinkedinIn size={18} />
          </a>

          <a
            href="https://github.com/adhilofficial"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub"
          >
           <FaGithub size={18} />
          </a>

          <a
            href="https://www.instagram.com/marketsby.exa?igsh=NzJxb2pzbW9zM2h3&utm_source=qr"
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
          >
            <FaInstagram size={18} />
          </a>
        </div>
      </div>

      <div className="exa-company-footer__risk">
        “Investment in securities markets is subject to market risk.
        Read all related documents carefully before investing.”
      </div>

      <div className="exa-company-footer__legal">
        <p>
          © {currentYear} {BRAND.company}. All rights reserved.
        </p>

        <p>
          Markets by exa provides AI-assisted market research for
          informational and educational purposes only. Information may be
          delayed, cached, incomplete or inaccurate and does not represent
          personalised investment advice.
        </p>
      </div>
    </footer>
  );
}