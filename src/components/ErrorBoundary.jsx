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
      "EXA application error:",
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
            "radial-gradient(circle at top, #101b35 0%, #050914 55%)",
          color: "#f8fafc",
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
              "1px solid rgba(148, 163, 184, 0.18)",
            borderRadius: "20px",
            background:
              "rgba(9, 16, 32, 0.92)",
            boxShadow:
              "0 24px 70px rgba(0, 0, 0, 0.38)",
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
                "rgba(245, 158, 11, 0.12)",
              color: "#f59e0b",
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
              color: "#60a5fa",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.14em",
            }}
          >
            EXA SYSTEM NOTICE
          </p>

          <h1
            style={{
              margin: "0",
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
              color: "#94a3b8",
              fontSize: "14px",
              lineHeight: 1.65,
            }}
          >
            EXA could not display this page.
            Your saved watchlist and analyses
            have not been removed.
          </p>

          {this.state.errorMessage && (
            <div
              style={{
                marginTop: "18px",
                padding: "12px 14px",
                border:
                  "1px solid rgba(239, 68, 68, 0.2)",
                borderRadius: "10px",
                background:
                  "rgba(239, 68, 68, 0.07)",
                color: "#fca5a5",
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
                background: "#2563eb",
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
              Reload EXA
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
                  "1px solid rgba(148, 163, 184, 0.25)",
                borderRadius: "10px",
                background:
                  "rgba(148, 163, 184, 0.06)",
                color: "#cbd5e1",
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
              color: "#64748b",
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
