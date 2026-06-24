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
          ? "1px solid rgba(245, 158, 11, 0.32)"
          : "1px solid rgba(34, 197, 94, 0.3)",
        borderRadius: "12px",
        background: isOffline
          ? "rgba(30, 20, 7, 0.96)"
          : "rgba(7, 28, 19, 0.96)",
        color: "#f8fafc",
        boxShadow:
          "0 18px 48px rgba(0, 0, 0, 0.36)",
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
            ? "#f59e0b"
            : "#22c55e",
          background: isOffline
            ? "rgba(245, 158, 11, 0.12)"
            : "rgba(34, 197, 94, 0.12)",
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
            color: "#94a3b8",
            fontSize: "10px",
            lineHeight: 1.4,
            display: "block",
          }}
        >
          {isOffline
            ? "Live market data and news may not update until your connection returns."
            : "EXA can now refresh live market data again."}
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
            "rgba(148, 163, 184, 0.08)",
          color: "#94a3b8",
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

