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

const styles = {
  page: {
    width: "100%",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "clamp(16px, 4vw, 24px)",
    boxSizing: "border-box",
    overflowX: "hidden",
    background:
      "radial-gradient(circle at top, var(--exa-primary-soft) 0%, var(--exa-background-secondary) 46%, var(--exa-background) 100%)",
    color: "var(--exa-text-primary)",
    fontFamily: "Inter, system-ui, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "440px",
    minWidth: 0,
    padding: "clamp(22px, 6vw, 32px)",
    boxSizing: "border-box",
    borderRadius: "22px",
    border: "1px solid var(--exa-border)",
    background: "var(--exa-card-background)",
    boxShadow: "var(--exa-shadow-card)",
    color: "var(--exa-text-primary)",
  },

  brand: {
    marginBottom: "8px",
    color: "var(--exa-primary)",
    fontSize: "14px",
    fontWeight: "800",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  },

  title: {
    margin: "0 0 8px",
    color: "var(--exa-text-primary)",
    fontSize: "30px",
    lineHeight: "1.2",
  },

  subtitle: {
    margin: "0 0 26px",
    color: "var(--exa-text-secondary)",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  field: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "var(--exa-text-secondary)",
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid var(--exa-border)",
    borderRadius: "12px",
    outline: "none",
    background: "var(--exa-input-background)",
    color: "var(--exa-text-primary)",
    caretColor: "var(--exa-primary)",
    fontSize: "15px",
  },

  button: {
    width: "100%",
    marginTop: "4px",
    padding: "14px 18px",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    background:
      "linear-gradient(135deg, var(--exa-primary), var(--exa-accent))",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
  },

  switchButton: {
    border: "none",
    padding: "0",
    cursor: "pointer",
    background: "transparent",
    color: "var(--exa-primary)",
    fontWeight: "800",
  },

  switchText: {
    margin: "22px 0 0",
    textAlign: "center",
    color: "var(--exa-text-secondary)",
    fontSize: "14px",
  },

  error: {
    marginBottom: "18px",
    padding: "12px 14px",
    border:
      "1px solid color-mix(in srgb, var(--exa-negative) 34%, transparent)",
    borderRadius: "10px",
    background:
      "color-mix(in srgb, var(--exa-negative) 9%, var(--exa-card-background))",
    color: "var(--exa-negative)",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  success: {
    marginBottom: "18px",
    padding: "12px 14px",
    border:
      "1px solid color-mix(in srgb, var(--exa-positive) 34%, transparent)",
    borderRadius: "10px",
    background:
      "color-mix(in srgb, var(--exa-positive) 9%, var(--exa-card-background))",
    color: "var(--exa-positive)",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  googleButton: {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  padding: "13px 18px",
  border: "1px solid var(--exa-border)",
  borderRadius: "12px",
  cursor: "pointer",
  background: "var(--exa-card-background-soft)",
  color: "var(--exa-text-primary)",
  fontSize: "14px",
  fontWeight: "800",
},

googleIcon: {
  width: "22px",
  height: "22px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "50%",
  color: "var(--exa-primary)",
  fontSize: "18px",
  fontWeight: "900",
},

divider: {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  margin: "22px 0",
  color: "var(--exa-text-muted)",
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
},

dividerLine: {
  flex: 1,
  height: "1px",
  background: "var(--exa-border)",
},

forgotLink: {
  display: "block",
  marginTop: "-8px",
  marginBottom: "18px",
  color: "var(--exa-primary)",
  fontSize: "13px",
  fontWeight: "700",
  textAlign: "right",
  textDecoration: "none",
},
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

 const {
  user,
  signIn,
  signUp,
  signInWithGoogle,
} = useAuth();


  const [mode, setMode] =
    useState("login");

  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const isSignup = mode === "signup";

  const destination =
    location.state?.from?.pathname ||
    "/dashboard";

  useEffect(() => {
    if (user) {
      navigate(destination, {
        replace: true,
      });
    }
  }, [
    user,
    navigate,
    destination,
  ]);

  function changeMode() {
    setMode((currentMode) =>
      currentMode === "login"
        ? "signup"
        : "login"
    );

    setError("");
    setSuccess("");
    setPassword("");
  }

  async function handleGoogleLogin() {
  setError("");
  setSuccess("");
  setSubmitting(true);

  try {
    await signInWithGoogle();
  } catch (authError) {
    setError(
      authError?.message ||
        "Google login failed. Please try again."
    );

    setSubmitting(false);
  }
}

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");
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
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brand}>
          Litses
        </div>

        <h1 style={styles.title}>
          {isSignup
            ? "Create your account"
            : "Welcome back"}
        </h1>

        <p style={styles.subtitle}>
          {isSignup
            ? "Join Litses and start building your personalized market workspace."
            : "Log in to continue to your Litses dashboard."}
        </p>

        {error && (
          <div
            role="alert"
            style={styles.error}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            style={styles.success}
          >
            {success}
          </div>
        )}
        <button
  type="button"
  onClick={handleGoogleLogin}
  disabled={submitting}
  style={{
    ...styles.googleButton,
    opacity: 1,
    cursor: submitting
      ? "not-allowed"
      : "pointer",
  }}
>
  <span
    style={styles.googleIcon}
    aria-hidden="true"
  >
    G
  </span>

  Continue with Google
</button>

<div style={styles.divider}>
  <span style={styles.dividerLine} />
  <span>or continue with email</span>
  <span style={styles.dividerLine} />
</div>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div style={styles.field}>
              <label
                htmlFor="fullName"
                style={styles.label}
              >
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(
                    event.target.value
                  )
                }
                placeholder="Adhil M"
                autoComplete="name"
                required
                minLength={2}
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.field}>
            <label
              htmlFor="email"
              style={styles.label}
            >
              Email address
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label
              htmlFor="password"
              style={styles.label}
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Minimum 6 characters"
              autoComplete={
                isSignup
                  ? "new-password"
                  : "current-password"
              }
              required
              minLength={6}
              style={styles.input}
            />
          </div>
          {!isSignup && (
  <Link
    to="/forgot-password"
    style={styles.forgotLink}
  >
    Forgot password?
  </Link>
)}
          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.button,
              opacity: 1,
              background: submitting
                ? "var(--exa-text-muted)"
                : styles.button.background,
              cursor: submitting
                ? "not-allowed"
                : "pointer",
            }}
          >
            {submitting
              ? "Please wait..."
              : isSignup
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <p style={styles.switchText}>
          {isSignup
            ? "Already have an account? "
            : "New to Litses? "}

          <button
            type="button"
            onClick={changeMode}
            style={styles.switchButton}
          >
            {isSignup
              ? "Log in"
              : "Create account"}
          </button>
        </p>
      </section>
    </main>
  );
}
