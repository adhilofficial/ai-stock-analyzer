const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || ""
)
  .trim()
  .replace(/\/$/, "");

async function readJson(response) {
  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        "Unable to load dashboard.",
    );
  }

  return data;
}

export async function getDashboardMarket() {
  const response = await fetch(
    `${API_BASE_URL}/api/dashboard-market`,
  );

  return readJson(response);
}