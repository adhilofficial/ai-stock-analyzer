import { useState } from "react";
import { Link } from "react-router-dom";

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

export default function ForgotPassword() {
  const { sendPasswordResetEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanedEmail = email.trim();

    if (!cleanedEmail) {
      setError("Enter your email address.");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      await sendPasswordResetEmail(cleanedEmail);

      setSuccess(
        "If an account exists for this email, a password reset link has been sent. Check your inbox and spam folder."
      );
    } catch (resetError) {
      console.error(
        "Unable to send password reset email:",
        resetError
      );

      setError(
        resetError?.message ||
          "Unable to send the reset email. Please try again."
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
          Reset your password
        </h1>

        <p style={styles.subtitle}>
          Enter the email address connected to your
          Litses account. We will send you a
          secure password-reset link.
        </p>

        {error && (
          <div role="alert" style={styles.error}>
            {error}
          </div>
        )}

        {success && (
          <div role="status" style={styles.success}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label
              htmlFor="reset-email"
              style={styles.label}
            >
              Email address
            </label>

            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              autoComplete="email"
              required
              style={styles.input}
            />
          </div>

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
              ? "Sending reset link..."
              : "Send reset link"}
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
