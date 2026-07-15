import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background:
      "radial-gradient(circle at top, var(--exa-primary-soft) 0%, var(--exa-background-secondary) 46%, var(--exa-background) 100%)",
    color: "var(--exa-text-primary)",
    fontFamily: "Inter, system-ui, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "440px",
    padding: "32px",
    boxSizing: "border-box",
    border: "1px solid var(--exa-border)",
    borderRadius: "22px",
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
    border:
      "1px solid var(--exa-border)",
    borderRadius: "12px",
    outline: "none",
    background: "var(--exa-input-background)",
    color: "var(--exa-text-primary)",
    caretColor: "var(--exa-primary)",
    fontSize: "15px",
  },

  button: {
    width: "100%",
    padding: "14px 18px",
    border: "none",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, var(--exa-primary), var(--exa-accent))",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
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

  backLink: {
    display: "block",
    marginTop: "22px",
    color: "var(--exa-primary)",
    fontSize: "14px",
    fontWeight: "700",
    textAlign: "center",
    textDecoration: "none",
  },
};

export default function ResetPassword() {
  const navigate = useNavigate();

  const {
    user,
    loading,
    updatePassword,
    signOut,
  } = useAuth();

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError(
        "Your new password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "The passwords do not match."
      );
      return;
    }

    setSubmitting(true);

    try {
      await updatePassword(password);

      setSuccess(
        "Your password was updated successfully. Redirecting to login..."
      );

      setPassword("");
      setConfirmPassword("");

      window.setTimeout(
        async () => {
          try {
            await signOut();
          } finally {
            navigate("/login", {
              replace: true,
            });
          }
        },
        1500
      );
    } catch (updateError) {
      console.error(
        "Unable to update password:",
        updateError
      );

      setError(
        updateError?.message ||
          "Unable to update your password. The reset link may have expired."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <div style={styles.brand}>
            Litses
          </div>

          <p style={styles.subtitle}>
            Verifying your password-reset link...
          </p>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main style={styles.page}>
        <section style={styles.card}>
          <div style={styles.brand}>
            Litses
          </div>

          <h1 style={styles.title}>
            Reset link unavailable
          </h1>

          <p style={styles.subtitle}>
            This password-reset link is invalid or
            has expired. Request a new link and try
            again.
          </p>

          <Link
            to="/forgot-password"
            style={styles.backLink}
          >
            Request another reset link
          </Link>

          <Link
            to="/login"
            style={styles.backLink}
          >
            Back to login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.brand}>
          Litses
        </div>

        <h1 style={styles.title}>
          Create a new password
        </h1>

        <p style={styles.subtitle}>
          Enter and confirm the new password for
          your Litses account.
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

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label
              htmlFor="new-password"
              style={styles.label}
            >
              New password
            </label>

            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              required
              minLength={8}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label
              htmlFor="confirm-password"
              style={styles.label}
            >
              Confirm new password
            </label>

            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              placeholder="Enter the password again"
              autoComplete="new-password"
              required
              minLength={8}
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || Boolean(success)}
            style={{
              ...styles.button,
              opacity: 1,
              background:
                submitting || success
                  ? "var(--exa-text-muted)"
                  : styles.button.background,
              cursor:
                submitting || success
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {submitting
              ? "Updating password..."
              : "Update password"}
          </button>
        </form>

        <Link
          to="/login"
          style={styles.backLink}
        >
          Back to login
        </Link>
      </section>
    </main>
  );
}
