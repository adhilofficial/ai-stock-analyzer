async function readApiResponse(
  response
) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  if (
    !contentType.includes(
      "application/json"
    )
  ) {
    const text =
      await response.text();

    console.error(
      "Non-JSON API response:",
      text
    );

    throw new Error(
      "The server returned an invalid response."
    );
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        data?.error ||
        `Request failed with status ${response.status}.`
    );
  }

  return data;
}

export async function searchStocks(
  query
) {
  const response = await fetch(
    `/api/stock-search?q=${encodeURIComponent(
      query
    )}`
  );

  const data =
    await readApiResponse(response);

  return data.stocks || [];
}

export async function getStockData(
  symbol,
  range = "1y"
) {
  const response = await fetch(
    `/api/stock-data?symbol=${encodeURIComponent(
      symbol
    )}&range=${encodeURIComponent(
      range
    )}`
  );

  const data =
    await readApiResponse(response);

  return data.stock;
}

export async function getAiAnalysis(
  stockData
) {
  const response = await fetch(
    "/api/analyze",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        stockData,
      }),
    }
  );

  const data =
    await readApiResponse(response);

  return data.result;
}