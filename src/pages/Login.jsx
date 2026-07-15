import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "../styles/login.css";

function getOAuthError(location) {
  const searchParams = new URLSearchParams(location.search);
  const hashParams = new URLSearchParams(
    location.hash.replace(/^#/, "")
  );

  const message =
    searchParams.get("error_description") ||
    hashParams.get("error_description") ||
    searchParams.get("error") ||
    hashParams.get("error");

  return message
    ? message.replace(/\+/g, " ")
    : "";
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="litses-login-google__icon"
      viewBox="0 0 24 24"
    >
      <path
        fill="#4285f4"
        d="M21.6 12.23c0-.72-.06-1.42-.19-2.09H12v3.96h5.38a4.6 4.6 0 0 1-1.99 3.02v2.57h3.23c1.89-1.74 2.98-4.3 2.98-7.46Z"
      />
      <path
        fill="#34a853"
        d="M12 22c2.7 0 4.96-.9 6.62-2.42l-3.23-2.56c-.9.6-2.04.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.06v2.64A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#fbbc05"
        d="M6.4 13.86A6.02 6.02 0 0 1 6.08 12c0-.65.11-1.28.32-1.86V7.5H3.06A10 10 0 0 0 2 12c0 1.61.39 3.14 1.06 4.5l3.34-2.64Z"
      />
      <path
        fill="#ea4335"
        d="M12 6.02c1.47 0 2.78.5 3.81 1.49l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.94 5.5l3.34 2.64c.79-2.36 3-4.12 5.6-4.12Z"
      />
    </svg>
  );
}

function BrandLockup({ compact = false }) {
  return (
    <div
      className={
        compact
          ? "litses-login-brand litses-login-brand--compact"
          : "litses-login-brand"
      }
    >
      <img
        src="/favicon.svg"
        alt=""
        className="litses-login-brand__mark"
        draggable="false"
      />

      <span className="litses-login-brand__copy">
        <strong>Litses</strong>
        {!compact && <small>Market intelligence</small>}
      </span>
    </div>
  );
}

function FinanceShowcase() {
  return (
    <aside className="litses-login-showcase">
      <div className="litses-login-showcase__orb litses-login-showcase__orb--one" />
      <div className="litses-login-showcase__orb litses-login-showcase__orb--two" />

      <div className="litses-login-showcase__content">
        <BrandLockup />

        <div className="litses-login-showcase__copy">
          <span className="litses-login-kicker">
            <span aria-hidden="true" />
            Built for clearer decisions
          </span>

          <h2>
            See the market.
            <br />
            <span>Understand the move.</span>
          </h2>

          <p>
            Bring price action, company context, and intelligent alerts into
            one focused workspace.
          </p>
        </div>

        <div className="litses-login-market-card">
          <div className="litses-login-market-card__header">
            <div>
              <span className="litses-login-market-card__eyebrow">
                Market pulse
              </span>
              <strong>Momentum strengthening</strong>
            </div>

            <span className="litses-login-live-pill">
              <span aria-hidden="true" />
              Preview
            </span>
          </div>

          <div
            className="litses-login-chart"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 560 220"
              preserveAspectRatio="none"
              focusable="false"
            >
              <defs>
                <linearGradient
                  id="litses-login-chart-fill"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.34" />
                  <stop offset="100%" stopColor="#67e8f9" stopOpacity="0" />
                </linearGradient>
                <linearGradient
                  id="litses-login-chart-line"
                  x1="0"
                  x2="1"
                >
                  <stop offset="0%" stopColor="#93c5fd" />
                  <stop offset="100%" stopColor="#5eead4" />
                </linearGradient>
              </defs>

              <g className="litses-login-chart__grid">
                <line x1="0" x2="560" y1="36" y2="36" />
                <line x1="0" x2="560" y1="92" y2="92" />
                <line x1="0" x2="560" y1="148" y2="148" />
                <line x1="0" x2="560" y1="204" y2="204" />
              </g>

              <path
                fill="url(#litses-login-chart-fill)"
                d="M0 181 C28 177 44 188 73 169 C100 151 118 160 145 139 C169 120 190 131 216 111 C243 90 265 103 292 87 C321 70 340 82 368 63 C398 42 417 59 446 43 C474 27 502 35 548 18 L560 220 L0 220 Z"
              />
              <path
                className="litses-login-chart__line"
                d="M0 181 C28 177 44 188 73 169 C100 151 118 160 145 139 C169 120 190 131 216 111 C243 90 265 103 292 87 C321 70 340 82 368 63 C398 42 417 59 446 43 C474 27 502 35 548 18"
              />
              <circle cx="548" cy="18" r="6" className="litses-login-chart__point" />
              <circle cx="548" cy="18" r="12" className="litses-login-chart__pulse" />
            </svg>
          </div>

          <div className="litses-login-market-card__footer">
            <div>
              <span>Signal</span>
              <strong>Price + context</strong>
            </div>
            <div>
              <span>Coverage</span>
              <strong>Indian markets</strong>
            </div>
            <div>
              <span>Alerts</span>
              <strong>Personalized</strong>
            </div>
          </div>

          <span className="litses-login-market-card__note">
            Illustrative market preview
          </span>
        </div>

        <p className="litses-login-showcase__trust">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M12 3 5 6v5c0 4.6 2.9 8.8 7 10 4.1-1.2 7-5.4 7-10V6l-7-3Zm-1 12-3-3 1.4-1.4 1.6 1.6 3.6-3.6L16 10l-5 5Z" />
          </svg>
          Research tools for informed decisions—not investment advice.
        </p>
      </div>
    </aside>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    signIn,
    signUp,
    signInWithGoogle,
  } = useAuth();

  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submissionType, setSubmissionType] = useState("");
  const [error, setError] = useState(() =>
    getOAuthError(location)
  );
  const [success, setSuccess] = useState("");

  const isSignup = mode === "signup";
  const destination = location.state?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (user) {
      navigate(destination, {
        replace: true,
      });
    }
  }, [user, navigate, destination]);

  function changeMode() {
    setMode((currentMode) =>
      currentMode === "login" ? "signup" : "login"
    );
    setError("");
    setSuccess("");
    setPassword("");
  }

  async function handleGoogleLogin() {
    setError("");
    setSuccess("");
    setSubmissionType("google");
    setSubmitting(true);

    try {
      await signInWithGoogle();
    } catch (authError) {
      setError(
        authError?.message ||
          "Google login failed. Please try again."
      );
      setSubmitting(false);
      setSubmissionType("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setSubmissionType("email");
    setSubmitting(true);

    try {
      if (isSignup) {
        const data = await signUp({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
        });

        if (data.session) {
          navigate("/dashboard", {
            replace: true,
          });
          return;
        }

        setSuccess(
          "Account created. Check your email and confirm your account before logging in."
        );
        setMode("login");
        setPassword("");
      } else {
        await signIn({
          email: email.trim(),
          password,
        });

        navigate(destination, {
          replace: true,
        });
      }
    } catch (authError) {
      setError(
        authError?.message ||
          "Authentication failed. Please try again."
      );
    } finally {
      setSubmitting(false);
      setSubmissionType("");
    }
  }

  return (
    <main className="litses-login-page">
      <div className="litses-login-shell">
        <FinanceShowcase />

        <section
          className="litses-login-panel"
          aria-labelledby="litses-login-title"
          aria-busy={submitting}
        >
          <div className="litses-login-panel__inner">
            <div className="litses-login-panel__topline">
              <BrandLockup compact />
              <span className="litses-login-secure-label">
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M17 8h-1V6a4 4 0 0 0-8 0v2H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2Zm-5 8.7a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4ZM14 8h-4V6a2 2 0 0 1 4 0v2Z" />
                </svg>
                Secure access
              </span>
            </div>

            <div className="litses-login-heading">
              <span className="litses-login-heading__eyebrow">
                {isSignup ? "Get started" : "Welcome back"}
              </span>
              <h1 id="litses-login-title">
                {isSignup ? "Create your account" : "Log in to Litses"}
              </h1>
              <p>
                {isSignup
                  ? "Create your personalized market workspace in a few steps."
                  : "Your market workspace is ready when you are."}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="litses-login-alert litses-login-alert--error"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                aria-live="polite"
                className="litses-login-alert litses-login-alert--success"
              >
                {success}
              </div>
            )}

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="litses-login-google"
            >
              <GoogleMark />
              <span>
                {submitting && submissionType === "google"
                  ? "Connecting to Google..."
                  : "Continue with Google"}
              </span>
            </button>

            <div className="litses-login-divider" aria-hidden="true">
              <span />
              <small>or continue with email</small>
              <span />
            </div>

            <form
              onSubmit={handleSubmit}
              className="litses-login-form"
              aria-busy={
                submitting && submissionType === "email"
              }
            >
              {isSignup && (
                <div className="litses-login-field">
                  <label htmlFor="fullName">Full name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    disabled={submitting}
                    required
                    minLength={2}
                  />
                </div>
              )}

              <div className="litses-login-field">
                <label htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={submitting}
                  required
                />
              </div>

              <div className="litses-login-field">
                <div className="litses-login-field__label-row">
                  <label htmlFor="password">Password</label>
                  {!isSignup && (
                    <Link to="/forgot-password">Forgot password?</Link>
                  )}
                </div>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Minimum 6 characters"
                  autoComplete={
                    isSignup ? "new-password" : "current-password"
                  }
                  disabled={submitting}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="litses-login-submit"
              >
                <span>
                  {submitting && submissionType === "email"
                    ? "Please wait..."
                    : isSignup
                      ? "Create account"
                      : "Log in"}
                </span>
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="m13 5-1.4 1.4 4.6 4.6H4v2h12.2l-4.6 4.6L13 19l7-7-7-7Z" />
                </svg>
              </button>
            </form>

            <p className="litses-login-switch">
              {isSignup ? "Already have an account? " : "New to Litses? "}
              <button
                type="button"
                onClick={changeMode}
                disabled={submitting}
              >
                {isSignup ? "Log in" : "Create account"}
              </button>
            </p>

            <p className="litses-login-disclaimer">
              By continuing, you acknowledge that Litses provides research
              tools and educational market information.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
