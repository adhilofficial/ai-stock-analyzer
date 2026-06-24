import {
  useEffect,
  useRef,
} from "react";

export default function useAutoRefresh(
  callback,
  intervalMs = 300000,
) {
  const callbackRef =
    useRef(callback);

  const lastRefreshRef =
    useRef(Date.now());

  useEffect(() => {
    callbackRef.current =
      callback;
  }, [callback]);

  useEffect(() => {
    function runRefresh() {
      if (
        document.visibilityState !==
        "visible"
      ) {
        return;
      }

      if (
        typeof callbackRef.current ===
        "function"
      ) {
        callbackRef.current();
        lastRefreshRef.current =
          Date.now();
      }
    }

    const intervalId =
      window.setInterval(
        runRefresh,
        intervalMs,
      );

    function handleVisibilityChange() {
      const timeSinceLastRefresh =
        Date.now() -
        lastRefreshRef.current;

      if (
        document.visibilityState ===
          "visible" &&
        timeSinceLastRefresh >=
          intervalMs
      ) {
        runRefresh();
      }
    }

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.clearInterval(
        intervalId,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [intervalMs]);
}
