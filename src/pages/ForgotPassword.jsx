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
      "radial-gradient(circle at top, #13244a 0%, #070b16 45%, #03050c 100%)",
    fontFamily: "Inter, system-ui, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "440px",
    padding: "32px",
    boxSizing: "border-box",
    border: "1px solid rgba(148, 163, 184, 0.18)",
    borderRadius: "22px",
    background: "rgba(8, 14, 28, 0.94)",
    boxShadow: "0 24px 80px rgba(0, 0, 0, 0.45)",
    color: "#f8fafc",
  },

  brand: {
    marginBottom: "8px",
    color: "#3b82f6",
    fontSize: "14px",
    fontWeight: "800",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
  },

  title: {
    margin: "0 0 8px",
    fontSize: "30px",
    lineHeight: "1.2",
  },

  subtitle: {
    margin: "0 0 26px",
    color: "#94a3b8",
    fontSize: "14px",
    lineHeight: "1.6",
  },

  field: {
    marginBottom: "18px",
  },

  label: {
    display: "block",
    marginBottom: "8px",
    color: "#cbd5e1",
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    border: "1px solid rgba(148, 163, 184, 0.24)",
    borderRadius: "12px",
    outline: "none",
    background: "#0c1426",
    color: "#f8fafc",
    fontSize: "15px",
  },

  button: {
    width: "100%",
    padding: "14px 18px",
    border: "none",
    borderRadius: "12px",
    background:
      "linear-gradient(135deg, #2563eb, #06b6d4)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "800",
  },

  error: {
    marginBottom: "18px",
    padding: "12px 14px",
    border: "1px solid rgba(248, 113, 113, 0.35)",
    borderRadius: "10px",
    background: "rgba(127, 29, 29, 0.24)",
    color: "#fecaca",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  success: {
    marginBottom: "18px",
    padding: "12px 14px",
    border: "1px solid rgba(52, 211, 153, 0.35)",
    borderRadius: "10px",
    background: "rgba(6, 78, 59, 0.24)",
    color: "#a7f3d0",
    fontSize: "13px",
    lineHeight: "1.5",
  },

  backLink: {
    display: "block",
    marginTop: "22px",
    color: "#60a5fa",
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
          EXA NEXUS
        </div>

        <h1 style={styles.title}>
          Reset your password
        </h1>

        <p style={styles.subtitle}>
          Enter the email address connected to your
          Markets by exa account. We will send you a
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
              opacity: submitting ? 0.65 : 1,
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