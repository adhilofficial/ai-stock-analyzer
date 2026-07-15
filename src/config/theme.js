export const THEME_STORAGE_KEY =
  "exa-theme-v2";

export const DEFAULT_THEME = "light";

export function getInitialTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME;
  }

  const savedTheme =
    window.localStorage.getItem(
      THEME_STORAGE_KEY,
    );

  return savedTheme === "dark" ||
    savedTheme === "light"
    ? savedTheme
    : DEFAULT_THEME;
}

export function applyTheme(theme) {
  const nextTheme =
    theme === "dark"
      ? "dark"
      : DEFAULT_THEME;

  if (typeof document !== "undefined") {
    document.documentElement.setAttribute(
      "data-theme",
      nextTheme,
    );

    document
      .querySelector(
        'meta[name="theme-color"]',
      )
      ?.setAttribute(
        "content",
        nextTheme === "dark"
          ? "#07111f"
          : "#f6f8fc",
      );
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      THEME_STORAGE_KEY,
      nextTheme,
    );
  }

  return nextTheme;
}
