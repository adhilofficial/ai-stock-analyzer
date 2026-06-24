function wait(milliseconds) {
  return new Promise((resolve) => {
    window.setTimeout(
      resolve,
      milliseconds,
    );
  });
}

function createTimeoutError(
  timeoutMs,
) {
  const error = new Error(
    `Request timed out after ${timeoutMs}ms.`,
  );

  error.name = "TimeoutError";

  return error;
}

const DEFAULT_RETRY_STATUSES = [
  408,
  425,
  429,
  500,
  502,
  503,
  504,
];

export async function fetchWithTimeout(
  url,
  options = {},
  config = {},
) {
  const {
    timeoutMs = 12000,
    retries = 1,
    retryDelayMs = 700,
    retryStatuses =
      DEFAULT_RETRY_STATUSES,
  } = config;

  const externalSignal =
    options.signal;

  let lastError = null;

  for (
    let attempt = 0;
    attempt <= retries;
    attempt += 1
  ) {
    if (externalSignal?.aborted) {
      throw new DOMException(
        "The request was aborted.",
        "AbortError",
      );
    }

    const controller =
      new AbortController();

    let timedOut = false;

    const handleExternalAbort = () => {
      controller.abort();
    };

    if (externalSignal) {
      externalSignal.addEventListener(
        "abort",
        handleExternalAbort,
        {
          once: true,
        },
      );
    }

    const timeoutId =
      window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

    try {
      const response = await fetch(
        url,
        {
          ...options,
          signal: controller.signal,
        },
      );

      const shouldRetry =
        retryStatuses.includes(
          response.status,
        );

      if (
        shouldRetry &&
        attempt < retries
      ) {
        lastError = new Error(
          `Server returned ${response.status}.`,
        );

        continue;
      }

      return response;
    } catch (error) {
      if (externalSignal?.aborted) {
        throw new DOMException(
          "The request was aborted.",
          "AbortError",
        );
      }

      if (timedOut) {
        lastError =
          createTimeoutError(
            timeoutMs,
          );
      } else {
        lastError =
          error instanceof Error
            ? error
            : new Error(
                "Network request failed.",
              );
      }

      if (attempt >= retries) {
        throw lastError;
      }
    } finally {
      window.clearTimeout(
        timeoutId,
      );

      if (externalSignal) {
        externalSignal.removeEventListener(
          "abort",
          handleExternalAbort,
        );
      }
    }

    const delay =
      retryDelayMs *
      (attempt + 1);

    await wait(delay);
  }

  throw (
    lastError ||
    new Error(
      "Network request failed.",
    )
  );
}

