import {
  Bell,
  ChevronDown,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
} from "lucide-react";

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

export default function Topbar({
  theme = "dark",
  onToggleTheme,
  onOpenSidebar,
}) {
  const navigate =
    useNavigate();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  function handleSearch(event) {
    event.preventDefault();

    const cleanedQuery =
      searchQuery.trim();

    if (!cleanedQuery) {
      return;
    }

    navigate(
      `/analyze?query=${encodeURIComponent(
        cleanedQuery,
      )}`,
    );

    setSearchQuery("");
  }

  function handleAskExa() {
    navigate("/analyze");
  }

  return (
    <header className="exa-topbar">
      <div className="exa-topbar-left">
        <button
          type="button"
          className="exa-mobile-menu-button"
          aria-label="Open navigation"
          onClick={onOpenSidebar}
        >
          <Menu size={21} />
        </button>

        <form
          className="exa-topbar-search"
          onSubmit={handleSearch}
        >
          <Search
            size={17}
            strokeWidth={1.8}
          />

          <input
            type="search"
            value={searchQuery}
            onChange={(event) =>
              setSearchQuery(
                event.target.value,
              )
            }
            placeholder="Search stocks, mutual funds, indices..."
            aria-label="Search stocks, mutual funds or indices"
          />

          <button
            type="submit"
            aria-label="Search"
          >
            <Search size={16} />
          </button>
        </form>
      </div>

      <div className="exa-topbar-actions">
        <button
          type="button"
          className="exa-ask-ai-button"
          onClick={handleAskExa}
        >
          <Sparkles size={16} />
          <span>Ask EXA AI</span>
        </button>

        <button
          type="button"
          className="exa-topbar-icon-button"
          onClick={onToggleTheme}
          aria-label={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
          }
          title={
            theme === "dark"
              ? "Light mode"
              : "Dark mode"
          }
        >
          {theme === "dark" ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>

        <button
          type="button"
          className="exa-topbar-icon-button exa-notification-button"
          aria-label="Notifications"
        >
          <Bell size={18} />

          <span className="exa-notification-dot">
            3
          </span>
        </button>

        <button
          type="button"
          className="exa-profile-button"
        >
          <span className="exa-profile-avatar">
            AP
          </span>

          <span className="exa-profile-copy">
            <strong>Adhil</strong>
            <small>EXA Founder</small>
          </span>

          <ChevronDown
            size={16}
          />
        </button>
      </div>
    </header>
  );
}