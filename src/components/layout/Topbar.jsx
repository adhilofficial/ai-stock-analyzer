import {
  ArrowRight,
  Bell,
  CheckCheck,
  ChevronDown,
  LogOut,
  Moon,
  Search,
  Settings,
  Sparkles,
  Sun,
  User,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import { useAuth } from
  "../../context/AuthContext";

import useAlertCenterBadge from
  "../../hooks/useAlertCenterBadge";

import "../../styles/notification-dropdown.css";
import "../../styles/profile-dropdown.css";

function cleanText(value) {
  return String(value ?? "").trim();
}

function getUserDisplayName(user, profile) {
  const profileName =
    cleanText(profile?.full_name);

  if (profileName) {
    return profileName;
  }

  const metadataName =
    cleanText(
      user?.user_metadata?.full_name,
    ) ||
    cleanText(
      user?.user_metadata?.name,
    );

  if (metadataName) {
    return metadataName;
  }

  const email = cleanText(user?.email);

  if (email) {
    return email.split("@")[0];
  }

  return "Litses User";
}

function getUserInitials(name) {
  const parts = cleanText(name)
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "EX";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function getPlanDetails(plan) {
  const normalizedPlan =
    cleanText(plan).toLowerCase();

  if (normalizedPlan === "plus") {
    return {
      name: "Plus",
      badge: "PLUS",
    };
  }

  if (normalizedPlan === "pro") {
    return {
      name: "Pro",
      badge: "PRO",
    };
  }

  return {
    name: "Free",
    badge: "FREE",
  };
}

function formatAlertTime(alert) {
  const rawValue =
    alert?.occurredAt ||
    alert?.fetchedAt;

  if (!rawValue) {
    return (
      cleanText(alert?.time) ||
      "Latest update"
    );
  }

  const date = new Date(rawValue);

  if (Number.isNaN(date.getTime())) {
    return (
      cleanText(alert?.time) ||
      "Latest update"
    );
  }

  const difference =
    Date.now() - date.getTime();

  const minutes = Math.max(
    0,
    Math.floor(difference / 60000),
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(
    minutes / 60,
  );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
    },
  ).format(date);
}

function getSeverityLabel(value) {
  const severity =
    cleanText(value).toLowerCase();

  if (severity === "critical") {
    return "Critical";
  }

  if (severity === "high") {
    return "High";
  }

  if (severity === "moderate") {
    return "Moderate";
  }

  return "Information";
}

export default function Topbar({
  theme = "light",
  onToggleTheme,
  sidebarOpen = false,
  onToggleSidebar,
  hideDefaultSearch = false,
  topSearch = null,
}) {
  const navigate = useNavigate();

  const {
  user,
  profile,
  profileLoading,
  signOut,
} = useAuth();

  const {
    unreadCount,
    previewAlerts,
    markAlertAsRead,
    markAllPreviewAlertsRead,
  } = useAlertCenterBadge();

  const [
    searchQuery,
    setSearchQuery,
  ] = useState("");

  const [
    notificationsOpen,
    setNotificationsOpen,
  ] = useState(false);

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const [
    signingOut,
    setSigningOut,
  ] = useState(false);

  const [
    profileError,
    setProfileError,
  ] = useState("");

  const notificationMenuRef =
    useRef(null);

  const profileMenuRef =
    useRef(null);

 const displayName =
  getUserDisplayName(
    user,
    profile,
  );

const userInitials =
  getUserInitials(displayName);

const userEmail =
  cleanText(profile?.email) ||
  cleanText(user?.email) ||
  "Signed-in user";

const planDetails =
  getPlanDetails(profile?.plan);

  useEffect(() => {
    if (
      !notificationsOpen &&
      !profileOpen
    ) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (
        notificationsOpen &&
        notificationMenuRef.current &&
        !notificationMenuRef.current.contains(
          event.target,
        )
      ) {
        setNotificationsOpen(false);
      }

      if (
        profileOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(
          event.target,
        )
      ) {
        setProfileOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    notificationsOpen,
    profileOpen,
  ]);

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

  function toggleNotifications() {
    setProfileOpen(false);

    setNotificationsOpen(
      (currentValue) =>
        !currentValue,
    );
  }

  function toggleProfile() {
    setNotificationsOpen(false);
    setProfileError("");

    setProfileOpen(
      (currentValue) =>
        !currentValue,
    );
  }

  function openMainAlerts() {
    setNotificationsOpen(false);
    navigate("/alerts");
  }

  function openAlert(alert) {
    markAlertAsRead(alert?.id);
    setNotificationsOpen(false);

    const alertId =
      cleanText(alert?.id);

    navigate(
      alertId
        ? `/alerts?alert=${encodeURIComponent(
            alertId,
          )}`
        : "/alerts",
    );
  }

  function handleMarkAllRead() {
    markAllPreviewAlertsRead();
  }

  function openSettings() {
    setProfileOpen(false);
    navigate("/settings");
  }

  async function handleSignOut() {
    setSigningOut(true);
    setProfileError("");

    try {
      await signOut();

      setProfileOpen(false);

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Unable to sign out:",
        error,
      );

      setProfileError(
        error?.message ||
          "Unable to log out. Please try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="exa-topbar">
      <div className="exa-topbar-left">
        <button
          type="button"
          className="exa-mobile-menu-button exa-sidebar-toggle-button"
          aria-label={
            sidebarOpen
              ? "Hide navigation"
              : "Open navigation"
          }
          title={
            sidebarOpen
              ? "Hide sidebar"
              : "Open sidebar"
          }
          onClick={onToggleSidebar}
        >
          <span
            className="exa-sidebar-toggle-arrows"
            aria-hidden="true"
          >
            {sidebarOpen
              ? "‹‹‹"
              : "›››"}
          </span>
        </button>

        {topSearch ? (
          <div className="exa-topbar-custom-search">
            {topSearch}
          </div>
        ) : !hideDefaultSearch ? (
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
        ) : null}
      </div>

      <div className="exa-topbar-actions">
        <button
          type="button"
          className="exa-ask-ai-button"
          onClick={handleAskExa}
        >
          <Sparkles size={16} />
          <span>Ask Litses AI</span>
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

        <div
          className="exa-notification-menu"
          ref={notificationMenuRef}
        >
          <button
            type="button"
            className="exa-topbar-icon-button exa-notification-button"
            aria-label={
              unreadCount > 0
                ? `Open notifications. ${unreadCount} unread alerts.`
                : "Open notifications"
            }
            aria-expanded={
              notificationsOpen
            }
            aria-controls="exa-notification-dropdown"
            title="Notifications"
            onClick={
              toggleNotifications
            }
          >
            <Bell size={18} />

            {unreadCount > 0 && (
              <span className="exa-notification-dot">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <section
              id="exa-notification-dropdown"
              className="exa-notification-dropdown"
              aria-label="Recent alerts"
            >
              <div className="exa-notification-dropdown-header">
                <div>
                  <strong>
                    Notifications
                  </strong>

                  <span>
                    {unreadCount > 0
                      ? `${unreadCount} unread alert${
                          unreadCount ===
                          1
                            ? ""
                            : "s"
                        }`
                      : "You are all caught up"}
                  </span>
                </div>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    className="exa-notification-mark-all"
                    onClick={
                      handleMarkAllRead
                    }
                  >
                    <CheckCheck
                      size={14}
                    />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="exa-notification-list">
                {previewAlerts.length >
                0 ? (
                  previewAlerts.map(
                    (alert) => (
                      <button
                        key={alert.id}
                        type="button"
                        className={`exa-notification-item severity-${
                          alert.severity ||
                          "information"
                        } ${
                          alert.isRead
                            ? "read"
                            : "unread"
                        }`}
                        onClick={() =>
                          openAlert(
                            alert,
                          )
                        }
                      >
                        <span
                          className="exa-notification-severity-dot"
                          aria-hidden="true"
                        />

                        <span className="exa-notification-item-copy">
                          <span className="exa-notification-item-topline">
                            <strong>
                              {
                                alert.title
                              }
                            </strong>

                            {!alert.isRead && (
                              <span
                                className="exa-notification-unread-dot"
                                aria-label="Unread"
                              />
                            )}
                          </span>

                          <span className="exa-notification-message">
                            {
                              alert.message
                            }
                          </span>

                          <span className="exa-notification-meta">
                            <span>
                              {getSeverityLabel(
                                alert.severity,
                              )}
                            </span>

                            {alert.symbol && (
                              <span>
                                {
                                  alert.symbol
                                }
                              </span>
                            )}

                            <span>
                              {formatAlertTime(
                                alert,
                              )}
                            </span>
                          </span>
                        </span>
                      </button>
                    ),
                  )
                ) : (
                  <div className="exa-notification-empty">
                    <Bell size={22} />

                    <strong>
                      No active alerts
                    </strong>

                    <span>
                      New market and
                      personalized alerts
                      will appear here.
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="exa-notification-view-all"
                onClick={
                  openMainAlerts
                }
              >
                Go to main Alerts
                <ArrowRight
                  size={15}
                />
              </button>
            </section>
          )}
        </div>

        <div
          className="exa-profile-menu"
          ref={profileMenuRef}
        >
          <button
            type="button"
            className="exa-profile-button"
            onClick={toggleProfile}
            aria-expanded={profileOpen}
            aria-controls="exa-profile-dropdown"
            aria-label="Open user menu"
          >
            <span className="exa-profile-avatar">
              {userInitials}
            </span>

            <span className="exa-profile-copy">
              <strong>
                {displayName}
              </strong>

              <small>
  {profileLoading
    ? "Loading plan..."
    : `${planDetails.name} plan`}
</small>
            </span>

            <ChevronDown
              size={16}
              className={
                profileOpen
                  ? "exa-profile-chevron-open"
                  : ""
              }
            />
          </button>

          {profileOpen && (
            <section
              id="exa-profile-dropdown"
              className="exa-profile-dropdown"
              aria-label="User account menu"
            >
              <div className="exa-profile-dropdown-header">
                <span className="exa-profile-dropdown-avatar">
                  {userInitials}
                </span>

                <div className="exa-profile-dropdown-copy">
                  <strong>
                    {displayName}
                  </strong>

                  <span>
                    {userEmail}
                  </span>
                </div>
              </div>

              <div className="exa-profile-plan-row">
                <span>
                  Current plan
                </span>

               <strong>
  {profileLoading
    ? "..."
    : planDetails.badge}
</strong>
              </div>

              <div className="exa-profile-dropdown-divider" />

              <button
                type="button"
                className="exa-profile-dropdown-item"
                onClick={openSettings}
              >
                <Settings size={16} />

                <span>
                  Account settings
                </span>
              </button>

              <button
                type="button"
                className="exa-profile-dropdown-item"
                onClick={() =>
                  navigate("/about")
                }
              >
                <User size={16} />

                <span>
                  About Litses
                </span>
              </button>

              <div className="exa-profile-dropdown-divider" />

              {profileError && (
                <p
                  className="exa-profile-error"
                  role="alert"
                >
                  {profileError}
                </p>
              )}

              <button
                type="button"
                className="exa-profile-dropdown-item exa-profile-logout"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                <LogOut size={16} />

                <span>
                  {signingOut
                    ? "Logging out..."
                    : "Log out"}
                </span>
              </button>
            </section>
          )}
        </div>
      </div>
    </header>
  );
}
