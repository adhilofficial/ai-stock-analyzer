import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";

import path from "node:path";
import process from "node:process";

/*
 * Folder and file locations
 */
const DATA_DIRECTORY = path.join(
  process.cwd(),
  "data",
);

const STOCK_MASTER_FILE = path.join(
  DATA_DIRECTORY,
  "indian-stock-master.json",
);

const OUTPUT_FILE = path.join(
  DATA_DIRECTORY,
  "screener-universe.json",
);

/*
 * Starter universe for the EXA NEXUS Stock Screener.
 *
 * Every symbol is checked against your existing
 * indian-stock-master.json file.
 *
 * Invalid, renamed or unavailable symbols are
 * automatically skipped.
 */
const STARTER_NSE_SYMBOLS = [
  // Large-cap and widely followed companies
  "RELIANCE",
  "HDFCBANK",
  "ICICIBANK",
  "SBIN",
  "KOTAKBANK",
  "AXISBANK",
  "INDUSINDBK",
  "BANKBARODA",
  "PNB",
  "CANBK",
  "UNIONBANK",
  "FEDERALBNK",
  "IDFCFIRSTB",

  // Information technology
  "TCS",
  "INFY",
  "HCLTECH",
  "WIPRO",
  "TECHM",
  "LTIM",
  "PERSISTENT",
  "COFORGE",
  "MPHASIS",
  "OFSS",
  "TATAELXSI",
  "KPITTECH",

  // Financial services
  "BAJFINANCE",
  "BAJAJFINSV",
  "BAJAJHLDNG",
  "CHOLAFIN",
  "SHRIRAMFIN",
  "MUTHOOTFIN",
  "LICHSGFIN",
  "JIOFIN",
  "PFC",
  "RECLTD",

  // Insurance
  "LICI",
  "SBILIFE",
  "HDFCLIFE",
  "ICICIPRULI",
  "ICICIGI",

  // FMCG and consumer
  "ITC",
  "HINDUNILVR",
  "NESTLEIND",
  "BRITANNIA",
  "TATACONSUM",
  "MARICO",
  "DABUR",
  "GODREJCP",
  "COLPAL",
  "PIDILITIND",
  "PAGEIND",
  "JUBLFOOD",
  "VBL",
  "UBL",
  "UNITDSPR",
  "MCDOWELL-N",

  // Automobiles
  "MARUTI",
  "TATAMOTORS",
  "M&M",
  "BAJAJ-AUTO",
  "EICHERMOT",
  "HEROMOTOCO",
  "TVSMOTOR",
  "MOTHERSON",
  "BOSCHLTD",
  "SONACOMS",

  // Pharmaceuticals and healthcare
  "SUNPHARMA",
  "CIPLA",
  "DRREDDY",
  "DIVISLAB",
  "LUPIN",
  "AUROPHARMA",
  "ZYDUSLIFE",
  "TORNTPHARM",
  "BIOCON",
  "ALKEM",
  "MANKIND",
  "APOLLOHOSP",
  "MAXHEALTH",
  "FORTIS",

  // Metals and mining
  "TATASTEEL",
  "JSWSTEEL",
  "HINDALCO",
  "VEDL",
  "COALINDIA",
  "NMDC",
  "SAIL",
  "JINDALSTEL",
  "APLAPOLLO",

  // Energy, oil and power
  "ONGC",
  "IOC",
  "BPCL",
  "GAIL",
  "PETRONET",
  "NTPC",
  "POWERGRID",
  "TATAPOWER",
  "ADANIGREEN",
  "ADANIPOWER",
  "NHPC",

  // Infrastructure and capital goods
  "LT",
  "SIEMENS",
  "ABB",
  "BEL",
  "BHEL",
  "CGPOWER",
  "RVNL",
  "IRFC",
  "HAL",
  "MAZDOCK",
  "COCHINSHIP",
  "BDL",

  // Cement and construction materials
  "ULTRACEMCO",
  "GRASIM",
  "AMBUJACEM",
  "ACC",
  "SHREECEM",
  "DALBHARAT",
  "ASTRAL",
  "SUPREMEIND",

  // Real estate
  "DLF",
  "GODREJPROP",
  "OBEROIRLTY",
  "LODHA",
  "PHOENIXLTD",
  "PRESTIGE",

  // Chemicals and agriculture
  "UPL",
  "PIIND",
  "SRF",
  "DEEPAKNTR",

  // Telecom and digital companies
  "BHARTIARTL",
  "IDEA",
  "ETERNAL",
  "ZOMATO",
  "PAYTM",
  "POLICYBZR",
  "NYKAA",
  "NAUKRI",
  "DELHIVERY",

  // Retail, travel and hospitality
  "DMART",
  "TRENT",
  "INDHOTEL",
  "INDIGO",
  "IRCTC",

  // Ports and diversified groups
  "ADANIENT",
  "ADANIPORTS",

  // Consumer electrical and electronics
  "ASIANPAINT",
  "BERGEPAINT",
  "HAVELLS",
  "VOLTAS",
  "CROMPTON",
  "DIXON",
  "POLYCAB",

  // Additional widely followed stocks
  "TITAN",
];

/*
 * Convert any supplied symbol into a clean
 * uppercase NSE symbol.
 *
 * Examples:
 * RELIANCE.NS -> RELIANCE
 * reliance    -> RELIANCE
 */
function normalizeSymbol(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\.(NS|BO)$/i, "");
}

/*
 * Convert unknown values to safe text.
 */
function cleanText(value) {
  return String(value || "").trim();
}

/*
 * Generate an NSE company page link when
 * the stock master does not contain one.
 */
function createNseUrl(symbol) {
  if (!symbol) {
    return "";
  }

  return (
    "https://www.nseindia.com/get-quotes/equity?symbol=" +
    encodeURIComponent(symbol)
  );
}

/*
 * Read the stock-master file created by:
 *
 * npm run build:stock-master
 */
async function readStockMaster() {
  let fileText;

  try {
    fileText = await readFile(
      STOCK_MASTER_FILE,
      "utf8",
    );
  } catch {
    throw new Error(
      "data/indian-stock-master.json was not found. Run npm run build:stock-master first.",
    );
  }

  let stocks;

  try {
    stocks = JSON.parse(fileText);
  } catch {
    throw new Error(
      "data/indian-stock-master.json contains invalid JSON.",
    );
  }

  if (!Array.isArray(stocks)) {
    throw new Error(
      "data/indian-stock-master.json must contain an array.",
    );
  }

  return stocks;
}

/*
 * Create a fast lookup table using both
 * nseSymbol and yahooSymbol.
 */
function createStockLookup(stockMaster) {
  const lookup = new Map();

  for (const stock of stockMaster) {
    const nseSymbol = normalizeSymbol(
      stock?.nseSymbol,
    );

    const yahooSymbol = cleanText(
      stock?.yahooSymbol,
    ).toUpperCase();

    if (nseSymbol) {
      lookup.set(nseSymbol, stock);
    }

    if (yahooSymbol.endsWith(".NS")) {
      lookup.set(
        normalizeSymbol(yahooSymbol),
        stock,
      );
    }
  }

  return lookup;
}

/*
 * Create the validated screener universe.
 */
function createScreenerUniverse(stockMaster) {
  const stockLookup =
    createStockLookup(stockMaster);

  const selectedStocks = [];
  const missingSymbols = [];
  const addedSymbols = new Set();

  STARTER_NSE_SYMBOLS.forEach(
    (requestedSymbol, index) => {
      const normalizedSymbol =
        normalizeSymbol(requestedSymbol);

      if (!normalizedSymbol) {
        return;
      }

      if (
        addedSymbols.has(normalizedSymbol)
      ) {
        return;
      }

      const stock = stockLookup.get(
        normalizedSymbol,
      );

      /*
       * Skip renamed, delisted or unavailable
       * symbols without crashing the script.
       */
      if (!stock) {
        missingSymbols.push(
          normalizedSymbol,
        );

        return;
      }

      const nseSymbol = normalizeSymbol(
        stock.nseSymbol ||
          normalizedSymbol,
      );

      if (!nseSymbol) {
        missingSymbols.push(
          normalizedSymbol,
        );

        return;
      }

      addedSymbols.add(nseSymbol);

      selectedStocks.push({
        symbol: `${nseSymbol}.NS`,

        yahooSymbol:
          `${nseSymbol}.NS`,

        name:
          cleanText(stock.name) ||
          nseSymbol,

        exchange: "NSE",

        nseSymbol,

        bseSecurityId:
          cleanText(
            stock.bseSecurityId,
          ),

        bseCode:
          cleanText(
            stock.bseCode,
          ),

        isin:
          cleanText(stock.isin),

        logoDomain:
          cleanText(
            stock.logoDomain,
          ),

        companyUrl:
          cleanText(
            stock.website,
          ),

        nseUrl:
          cleanText(
            stock.nseUrl,
          ) ||
          createNseUrl(nseSymbol),

        bseUrl:
          cleanText(
            stock.bseUrl,
          ),

        universeRank:
          index + 1,

        universeGroup:
          "starter-liquid",
      });
    },
  );

  return {
    selectedStocks,
    missingSymbols,
  };
}

/*
 * Main script execution.
 */
async function main() {
  console.log(
    "Reading Indian stock master...",
  );

  const stockMaster =
    await readStockMaster();

  console.log(
    `Found ${stockMaster.length} records in the stock master.`,
  );

  const {
    selectedStocks,
    missingSymbols,
  } = createScreenerUniverse(
    stockMaster,
  );

  if (selectedStocks.length === 0) {
    throw new Error(
      "No screener symbols matched the Indian stock master.",
    );
  }

  await mkdir(DATA_DIRECTORY, {
    recursive: true,
  });

  await writeFile(
    OUTPUT_FILE,
    `${JSON.stringify(
      selectedStocks,
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(
    `Created ${selectedStocks.length} screener-universe records.`,
  );

  console.log(
    `Saved: ${OUTPUT_FILE}`,
  );

  if (missingSymbols.length > 0) {
    console.warn(
      `${missingSymbols.length} unavailable or renamed symbols were skipped:`,
    );

    console.warn(
      missingSymbols.join(", "),
    );
  }
}

main().catch((error) => {
  console.error(
    "Screener universe build failed:",
    error instanceof Error
      ? error.message
      : error,
  );

  process.exitCode = 1;
});