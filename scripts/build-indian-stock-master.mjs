import { mkdir, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import process from "node:process";

const UPSTOX_COMPLETE_URL =
  "https://assets.upstox.com/market-quote/instruments/exchange/complete.json.gz";

const OUTPUT_DIRECTORY =
  path.join(process.cwd(), "data");

const OUTPUT_FILE =
  path.join(
    OUTPUT_DIRECTORY,
    "indian-stock-master.json",
  );

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeCode(value) {
  return cleanText(value).toUpperCase();
}

function isEquityInstrument(item) {
  const segment =
    normalizeCode(item?.segment);

  const instrumentType =
    normalizeCode(
      item?.instrument_type,
    );

  return (
    (
      segment === "NSE_EQ" ||
      segment === "BSE_EQ"
    ) &&
    instrumentType === "EQ"
  );
}

function chooseDisplayName(
  current,
  item,
) {
  const candidates = [
    item?.short_name,
    item?.name,
    item?.trading_symbol,
  ]
    .map(cleanText)
    .filter(Boolean);

  if (!current) {
    return (
      candidates[0] ||
      "Unknown company"
    );
  }

  const betterCandidate =
    candidates.find(
      (candidate) =>
        candidate.length >
        current.length,
    );

  return (
    betterCandidate ||
    current
  );
}

function buildNseUrl(symbol) {
  if (!symbol) {
    return "";
  }

  return (
    "https://www.nseindia.com/get-quotes/equity?symbol=" +
    encodeURIComponent(symbol)
  );
}

function buildBseUrl(code) {
  if (!code) {
    return "";
  }

  return (
    "https://www.bseindia.com/stock-share-price/equity/scripcode/" +
    encodeURIComponent(code)
  );
}

async function downloadInstrumentMaster() {
  console.log(
    "Downloading Upstox instrument master…",
  );

  const response =
    await fetch(
      UPSTOX_COMPLETE_URL,
      {
        headers: {
          Accept:
            "application/gzip, application/json",
          "User-Agent":
            "EXA-NEXUS-Stock-Master/1.0",
        },
      },
    );

  if (!response.ok) {
    throw new Error(
      `Instrument download failed with status ${response.status}.`,
    );
  }

  const compressed =
    Buffer.from(
      await response.arrayBuffer(),
    );

  const jsonText =
    gunzipSync(
      compressed,
    ).toString("utf8");

  const data =
    JSON.parse(jsonText);

  if (!Array.isArray(data)) {
    throw new Error(
      "Instrument master did not return an array.",
    );
  }

  return data;
}

function createMergedStockMaster(
  instruments,
) {
  const mergedByIdentity =
    new Map();

  for (const item of instruments) {
    if (!isEquityInstrument(item)) {
      continue;
    }

    const segment =
      normalizeCode(item.segment);

    const isin =
      normalizeCode(item.isin);

    const symbol =
      normalizeCode(
        item.trading_symbol,
      );

    const exchangeToken =
      normalizeCode(
        item.exchange_token,
      );

    if (!symbol) {
      continue;
    }

    /*
     * ISIN merges the same company listed on
     * NSE and BSE into one suggestion row.
     */
    const identity =
      isin ||
      `${segment}:${symbol}`;

    const existing =
      mergedByIdentity.get(
        identity,
      ) || {
        name: "",
        isin: isin || "",
        nseSymbol: "",
        bseSecurityId: "",
        bseCode: "",
        yahooSymbol: "",
        exchange: "",
        website: "",
        logoDomain: "",
        nseUrl: "",
        bseUrl: "",
      };

    existing.name =
      chooseDisplayName(
        existing.name,
        item,
      );

    if (
      segment === "NSE_EQ"
    ) {
      existing.nseSymbol =
        symbol;

      existing.nseUrl =
        buildNseUrl(symbol);
    }

    if (
      segment === "BSE_EQ"
    ) {
      existing.bseSecurityId =
        symbol;

      const bseCode =
        /^\d{6}$/.test(
          exchangeToken,
        )
          ? exchangeToken
          : /^\d{6}$/.test(
                symbol,
              )
            ? symbol
            : "";

      existing.bseCode =
        bseCode;

      existing.bseUrl =
        buildBseUrl(
          bseCode,
        );
    }

    const exchanges = [];

    if (existing.nseSymbol) {
      exchanges.push("NSE");
    }

    if (existing.bseCode) {
      exchanges.push("BSE");
    }

    existing.exchange =
      exchanges.join(", ");

    /*
     * Yahoo normally uses SYMBOL.NS for NSE and
     * the numerical BSE security code with .BO.
     */
    existing.yahooSymbol =
      existing.nseSymbol
        ? `${existing.nseSymbol}.NS`
        : existing.bseCode
          ? `${existing.bseCode}.BO`
          : "";

    mergedByIdentity.set(
      identity,
      existing,
    );
  }

  return [
    ...mergedByIdentity.values(),
  ]
    .filter(
      (stock) =>
        stock.yahooSymbol &&
        stock.name,
    )
    .sort((first, second) =>
      first.name.localeCompare(
        second.name,
        "en-IN",
      ),
    );
}

async function main() {
  const instruments =
    await downloadInstrumentMaster();

  const stocks =
    createMergedStockMaster(
      instruments,
    );

  await mkdir(
    OUTPUT_DIRECTORY,
    {
      recursive: true,
    },
  );

  await writeFile(
    OUTPUT_FILE,
    `${JSON.stringify(
      stocks,
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    `Created ${stocks.length} merged NSE/BSE equity records.`,
  );

  console.log(
    `Saved: ${OUTPUT_FILE}`,
  );
}

main().catch((error) => {
  console.error(
    "Stock master build failed:",
    error,
  );

  process.exitCode = 1;
});
