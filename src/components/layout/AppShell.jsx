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

export default function AppShell({
  children,

  /*
   * When true, the permanent default
   * Topbar search will not be rendered.
   *
   * Dashboard uses this because it has
   * its own large stock-search section.
   */
  hideDefaultSearch = false,

  /*
   * Optional custom search component
   * rendered inside the Topbar.
   *
   * Dashboard supplies this only after
   * its large search scrolls away.
   */
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
  ] = useState(false);

  /*
   * Apply the selected theme globally
   * and save the selection locally.
   */
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
   * Close the mobile sidebar whenever
   * the route changes.
   */
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function toggleTheme() {
    setTheme(
      (currentTheme) =>
        currentTheme === "dark"
          ? "light"
          : "dark",
    );
  }

  function openSidebar() {
    setSidebarOpen(true);
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="exa-app-shell">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />

      <div className="exa-shell-main">
        <Topbar
          theme={theme}
          onToggleTheme={
            toggleTheme
          }
          onOpenSidebar={
            openSidebar
          }
          hideDefaultSearch={
            hideDefaultSearch
          }
          topSearch={
            topSearch
          }
        />

        <div className="exa-shell-content">
          {children}
        </div>
      </div>
    </div>
  );
}