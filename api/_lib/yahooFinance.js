import YahooFinance from "yahoo-finance2";

const REQUEST_TIMEOUT_MS = 8_000;

async function fetchWithTimeout(
  input,
  init = {},
) {
  const controller =
    new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort(
      new Error(
        "Yahoo Finance request timed out.",
      ),
    );
  }, REQUEST_TIMEOUT_MS);

  /*
   * Respect an AbortSignal already supplied
   * by yahoo-finance2.
   */
  if (init.signal) {
    if (init.signal.aborted) {
      controller.abort(
        init.signal.reason,
      );
    } else {
      init.signal.addEventListener(
        "abort",
        () => {
          controller.abort(
            init.signal.reason,
          );
        },
        {
          once: true,
        },
      );
    }
  }

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

import yahooFinance from "./_lib/yahooFinance.js";

export default yahooFinance;