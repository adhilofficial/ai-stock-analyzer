import {
  useEffect,
  useMemo,
  useState,
} from "react";

const COMPANY_DOMAINS = Object.freeze({
  "RELIANCE.NS": "ril.com",
  "HDFCBANK.NS": "hdfcbank.com",
  "BHARTIARTL.NS": "airtel.in",
  "ICICIBANK.NS": "icicibank.com",
  "SBIN.NS": "sbi.co.in",
  "TCS.NS": "tcs.com",
  "BAJFINANCE.NS": "bajajfinserv.in",
  "BAJAJFINSV.NS": "bajajfinserv.in",
  "INFY.NS": "infosys.com",
  "ITC.NS": "itcportal.com",
  "LT.NS": "larsentoubro.com",
  "KOTAKBANK.NS": "kotak.com",
  "AXISBANK.NS": "axisbank.com",
  "MARUTI.NS": "marutisuzuki.com",
  "SUNPHARMA.NS": "sunpharma.com",
  "TATAMOTORS.NS": "tatamotors.com",
  "TATASTEEL.NS": "tatasteel.com",
  "WIPRO.NS": "wipro.com",
  "TECHM.NS": "techmahindra.com",
  "HINDUNILVR.NS": "hul.co.in",
  "ASIANPAINT.NS": "asianpaints.com",
  "ULTRACEMCO.NS": "ultratechcement.com",
  "TITAN.NS": "titancompany.in",
  "POWERGRID.NS": "powergrid.in",
  "NTPC.NS": "ntpc.co.in",
  "ONGC.NS": "ongcindia.com",
  "HINDALCO.NS": "hindalco.com",
  "JSWSTEEL.NS": "jsw.in",
  "ADANIPORTS.NS": "adani.com",
});

function cleanDomain(value) {
  const rawValue = String(value || "").trim();

  if (!rawValue) {
    return "";
  }

  try {
    const url = rawValue.includes("://")
      ? new URL(rawValue)
      : new URL(`https://${rawValue}`);

    return url.hostname.replace(/^www\./i, "");
  } catch {
    return rawValue
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0]
      .trim();
  }
}

function resolveDomain({
  symbol,
  logoDomain,
  website,
}) {
  const explicitDomain = cleanDomain(
    logoDomain || website,
  );

  if (explicitDomain) {
    return explicitDomain;
  }

  return (
    COMPANY_DOMAINS[
      String(symbol || "")
        .trim()
        .toUpperCase()
    ] || ""
  );
}

export default function CompanyLogo({
  symbol,
  name,
  logoDomain,
  website,
  size = 42,
  className = "",
}) {
  const [failed, setFailed] = useState(false);

  const domain = useMemo(
    () =>
      resolveDomain({
        symbol,
        logoDomain,
        website,
      }),
    [symbol, logoDomain, website],
  );

  const logoKey =
    import.meta.env.VITE_LOGO_KEY ||
    import.meta.env.VITE_LOGO_DEV_KEY ||
    "";

  useEffect(() => {
    setFailed(false);
  }, [domain, logoKey]);

  const showImage = Boolean(
    domain && logoKey && !failed,
  );

  const fallbackLetter = String(
    name || symbol || "?",
  )
    .trim()
    .charAt(0)
    .toUpperCase();

  const accessibleName =
    name || symbol || "Company";

  return (
    <div
      className={`exa-company-logo ${className}`.trim()}
      style={{
        width: size,
        height: size,
      }}
      role="img"
      aria-label={`${accessibleName} logo`}
      title={accessibleName}
    >
      {showImage ? (
        <img
          src={
            `https://img.logo.dev/${encodeURIComponent(domain)}` +
            `?token=${encodeURIComponent(logoKey)}` +
            "&size=128&format=webp"
          }
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">
          {fallbackLetter || "?"}
        </span>
      )}
    </div>
  );
}