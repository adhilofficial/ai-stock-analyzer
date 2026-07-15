import { Component } from "react";
import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      errorMessage: "",
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage:
        error instanceof Error
          ? error.message
          : "An unexpected application error occurred.",
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error(
      "Litses application error:",
      error,
      errorInfo,
    );
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReturnToDashboard = () => {
    window.location.href =
      "/dashboard";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main
        role="alert"
        style={{
          minHeight: "100vh",
          padding: "24px",
          background:
            "radial-gradient(circle at top, var(--exa-primary-soft) 0%, var(--exa-background-secondary) 48%, var(--exa-background) 100%)",
          color: "var(--exa-text-primary)",
          fontFamily:
            "Inter, system-ui, sans-serif",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <section
          style={{
            width: "100%",
            maxWidth: "520px",
            padding: "32px",
            border:
              "1px solid var(--exa-border)",
            borderRadius: "20px",
            background:
              "var(--exa-card-background)",
            boxShadow: "var(--exa-shadow-card)",
            textAlign: "center",
          }}
        >
          <span
            style={{
              width: "58px",
              height: "58px",
              margin: "0 auto 18px",
              borderRadius: "16px",
              background:
                "color-mix(in srgb, var(--exa-warning) 12%, var(--exa-card-background))",
              color: "var(--exa-warning)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertTriangle size={28} />
          </span>

          <p
            style={{
              margin: "0 0 8px",
              color: "var(--exa-primary)",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.14em",
            }}
          >
            LITSES SYSTEM NOTICE
          </p>

          <h1
            style={{
              margin: "0",
              color: "var(--exa-text-primary)",
              fontSize: "25px",
              lineHeight: 1.25,
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              margin: "14px auto 0",
              maxWidth: "410px",
              color: "var(--exa-text-secondary)",
              fontSize: "14px",
              lineHeight: 1.65,
            }}
          >
            Litses could not display this page.
            Your saved watchlist and analyses
            have not been removed.
          </p>

          {this.state.errorMessage && (
            <div
              style={{
                marginTop: "18px",
                padding: "12px 14px",
                border:
                  "1px solid color-mix(in srgb, var(--exa-negative) 25%, transparent)",
                borderRadius: "10px",
                background:
                  "color-mix(in srgb, var(--exa-negative) 8%, var(--exa-card-background))",
                color: "var(--exa-negative)",
                fontSize: "12px",
                lineHeight: 1.5,
                overflowWrap: "anywhere",
              }}
            >
              {this.state.errorMessage}
            </div>
          )}

          <div
            style={{
              marginTop: "24px",
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                minHeight: "42px",
                padding: "0 17px",
                border: "0",
                borderRadius: "10px",
                background:
                  "linear-gradient(135deg, var(--exa-primary), var(--exa-accent))",
                color: "#ffffff",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <RefreshCw size={16} />
              Reload Litses
            </button>

            <button
              type="button"
              onClick={
                this.handleReturnToDashboard
              }
              style={{
                minHeight: "42px",
                padding: "0 17px",
                border:
                  "1px solid var(--exa-border)",
                borderRadius: "10px",
                background:
                  "var(--exa-card-background-soft)",
                color: "var(--exa-text-secondary)",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Return to Dashboard
            </button>
          </div>

          <p
            style={{
              margin: "20px 0 0",
              color: "var(--exa-text-muted)",
              fontSize: "11px",
              lineHeight: 1.5,
            }}
          >
            Reload the application first. If
            the problem continues, check the
            browser console and Vercel logs.
          </p>
        </section>
      </main>
    );
  }
}
