const RETRYABLE_MESSAGES = [
  "fetch failed",
  "network",
  "timeout",
  "timed out",
  "econnreset",
  "econnrefused",
  "etimedout",
  "eai_again",
  "socket",
  "connection",
  "429",
  "too many requests",
  "bad gateway",
  "service unavailable",
];

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getStatusCode(error) {
  const candidates = [
    error?.statusCode,
    error?.status,
    error?.response?.status,
    error?.cause?.statusCode,
  ];

  for (const value of candidates) {
    const status = Number(value);

    if (Number.isFinite(status)) {
      return status;
    }
  }

  return null;
}

export function isRetryableError(error) {
  const statusCode = getStatusCode(error);

  if (
    statusCode === 408 ||
    statusCode === 429 ||
    (statusCode !== null && statusCode >= 500)
  ) {
    return true;
  }

  const message = String(
    error?.message ||
      error?.cause?.message ||
      error ||
      "",
  ).toLowerCase();

  return RETRYABLE_MESSAGES.some((part) =>
    message.includes(part),
  );
}

export default async function withRetry(
  operation,
  {
    attempts = 3,
    delayMs = 600,
    backoffFactor = 1.7,
    label = "Yahoo Finance request",
  } = {},
) {
  if (typeof operation !== "function") {
    throw new TypeError(
      "withRetry requires a function.",
    );
  }

  const maximumAttempts = Math.max(
    1,
    Number(attempts) || 1,
  );

  let lastError;

  for (
    let attempt = 1;
    attempt <= maximumAttempts;
    attempt += 1
  ) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const canRetry =
        attempt < maximumAttempts &&
        isRetryableError(error);

      console.warn(
        `${label} attempt ${attempt}/${maximumAttempts} failed:`,
        error instanceof Error
          ? error.message
          : error,
      );

      if (!canRetry) {
        throw error;
      }

      const nextDelay = Math.round(
        delayMs *
          Math.pow(
            backoffFactor,
            attempt - 1,
          ),
      );

      await wait(nextDelay);
    }
  }

  throw lastError;
}