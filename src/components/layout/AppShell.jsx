import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
} from "react-router-dom";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

import "../../styles/theme.css";

const THEME_STORAGE_KEY =
  "exa-theme-v1";

const SIDEBAR_BREAKPOINT = 900;

function getInitialTheme() {
  if (
    typeof window ===
    "undefined"
  ) {
    return "dark";
  }

  const savedTheme =
    window.localStorage.getItem(
      THEME_STORAGE_KEY,
    );

  if (
    savedTheme === "dark" ||
    savedTheme === "light"
  ) {
    return savedTheme;
  }

  const prefersLight =
    window.matchMedia?.(
      "(prefers-color-scheme: light)",
    )?.matches;

  return prefersLight
    ? "light"
    : "dark";
}

function getInitialSidebarOpen() {
  if (
    typeof window ===
    "undefined"
  ) {
    return false;
  }

  /*
   * Start open on laptops/desktops.
   * Start closed on tablets and phones.
   */
  return (
    window.innerWidth >
    SIDEBAR_BREAKPOINT
  );
}

export default function AppShell({
  children,
  hideDefaultSearch = false,
  topSearch = null,
}) {
  const location =
    useLocation();

  const [
    theme,
    setTheme,
  ] = useState(
    getInitialTheme,
  );

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(
    getInitialSidebarOpen,
  );

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme,
    );

    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      theme,
    );
  }, [theme]);

  /*
   * Automatically switch sidebar mode when
   * moving between desktop and mobile widths.
   */
  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        `(min-width: ${
          SIDEBAR_BREAKPOINT + 1
        }px)`,
      );

    function handleBreakpointChange(
      event,
    ) {
      setSidebarOpen(
        event.matches,
      );
    }

    mediaQuery.addEventListener(
      "change",
      handleBreakpointChange,
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleBreakpointChange,
      );
    };
  }, []);

  /*
   * Close the drawer after navigation only
   * on mobile and tablet screens.
   */
  useEffect(() => {
    if (
      window.innerWidth <=
      SIDEBAR_BREAKPOINT
    ) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  /*
   * Prevent the page behind the mobile
   * drawer from scrolling.
   */
  useEffect(() => {
    const previousOverflow =
      document.body.style.overflow;

    if (
      sidebarOpen &&
      window.innerWidth <=
        SIDEBAR_BREAKPOINT
    ) {
      document.body.style.overflow =
        "hidden";
    } else {
      document.body.style.overflow =
        previousOverflow;
    }

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [sidebarOpen]);

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "dark"
        ? "light"
        : "dark",
    );
  }

  function toggleSidebar() {
    setSidebarOpen(
      (currentValue) =>
        !currentValue,
    );
  }

  return (
    <div
      className={`exa-app-shell ${
        sidebarOpen
          ? "sidebar-open"
          : "sidebar-closed"
      }`}
    >
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() =>
          setSidebarOpen(false)
        }
      />

      <div className="exa-shell-main">
  <Topbar
    theme={theme}
    onToggleTheme={toggleTheme}
    sidebarOpen={sidebarOpen}
    onToggleSidebar={toggleSidebar}
    hideDefaultSearch={hideDefaultSearch}
    topSearch={topSearch}
  />

  <div className="exa-shell-content">
  {children}
</div>
</div>
    </div>
  );
}