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

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "dark"
        ? "light"
        : "dark",
    );
  }

  return (
    <div className="exa-app-shell">
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
          onOpenSidebar={() =>
            setSidebarOpen(true)
          }
        />

        <div className="exa-shell-content">
          {children}
        </div>
      </div>
    </div>
  );
}