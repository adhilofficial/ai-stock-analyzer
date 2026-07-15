import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  WifiOff,
  X,
} from "lucide-react";

export default function NetworkStatusBanner() {
  const [isOnline, setIsOnline] =
    useState(() =>
      typeof navigator === "undefined"
        ? true
        : navigator.onLine,
    );

  const [showRestored, setShowRestored] =
    useState(false);

  const [dismissed, setDismissed] =
    useState(false);

  const restoredTimerRef =
    useRef(null);

  useEffect(() => {
    function handleOffline() {
      setIsOnline(false);
      setShowRestored(false);
      setDismissed(false);

      if (restoredTimerRef.current) {
        window.clearTimeout(
          restoredTimerRef.current,
        );
      }
    }

    function handleOnline() {
      setIsOnline(true);
      setShowRestored(true);
      setDismissed(false);

      if (restoredTimerRef.current) {
        window.clearTimeout(
          restoredTimerRef.current,
        );
      }

      restoredTimerRef.current =
        window.setTimeout(() => {
          setShowRestored(false);
        }, 4000);
    }

    window.addEventListener(
      "offline",
      handleOffline,
    );

    window.addEventListener(
      "online",
      handleOnline,
    );

    return () => {
      window.removeEventListener(
        "offline",
        handleOffline,
      );

      window.removeEventListener(
        "online",
        handleOnline,
      );

      if (restoredTimerRef.current) {
        window.clearTimeout(
          restoredTimerRef.current,
        );
      }
    };
  }, []);

  const shouldShow =
    !dismissed &&
    (!isOnline || showRestored);

  if (!shouldShow) {
    return null;
  }

  const isOffline = !isOnline;

  return (
    <div
      role={isOffline ? "alert" : "status"}
      aria-live="polite"
      style={{
        position: "fixed",
        top: "14px",
        left: "50%",
        zIndex: 9999,
        width: "calc(100% - 28px)",
        maxWidth: "520px",
        minHeight: "48px",
        padding: "10px 12px",
        border: isOffline
          ? "1px solid color-mix(in srgb, var(--exa-warning) 34%, transparent)"
          : "1px solid color-mix(in srgb, var(--exa-positive) 32%, transparent)",
        borderRadius: "12px",
        background: isOffline
          ? "color-mix(in srgb, var(--exa-warning) 8%, var(--exa-card-background))"
          : "color-mix(in srgb, var(--exa-positive) 8%, var(--exa-card-background))",
        color: "var(--exa-text-primary)",
        boxShadow: "var(--exa-shadow-card)",
        backdropFilter: "blur(14px)",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span
        style={{
          width: "32px",
          height: "32px",
          flexShrink: 0,
          borderRadius: "9px",
          color: isOffline
            ? "var(--exa-warning)"
            : "var(--exa-positive)",
          background: isOffline
            ? "color-mix(in srgb, var(--exa-warning) 12%, transparent)"
            : "color-mix(in srgb, var(--exa-positive) 12%, transparent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {isOffline ? (
          <WifiOff size={17} />
        ) : (
          <CheckCircle2 size={17} />
        )}
      </span>

      <div
        style={{
          minWidth: 0,
          flex: 1,
        }}
      >
        <strong
          style={{
            display: "block",
            color: "var(--exa-text-primary)",
            fontSize: "12px",
            lineHeight: 1.35,
          }}
        >
          {isOffline
            ? "You are offline"
            : "Connection restored"}
        </strong>

        <span
          style={{
            marginTop: "2px",
            color: "var(--exa-text-secondary)",
            fontSize: "11px",
            lineHeight: 1.4,
            display: "block",
          }}
        >
          {isOffline
            ? "Live market data and news may not update until your connection returns."
            : "Litses can now refresh live market data again."}
        </span>
      </div>

      <button
        type="button"
        aria-label="Close connection message"
        onClick={() =>
          setDismissed(true)
        }
        style={{
          width: "30px",
          height: "30px",
          flexShrink: 0,
          border: "0",
          borderRadius: "8px",
          background:
            "var(--exa-card-background-soft)",
          color: "var(--exa-text-muted)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <X size={15} />
      </button>
    </div>
  );
}

