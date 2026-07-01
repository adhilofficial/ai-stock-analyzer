import {
  useEffect,
  useState,
} from "react";

const COMPANY_DOMAINS = {
  "RELIANCE.NS": "ril.com",
  "HDFCBANK.NS": "hdfcbank.com",
  "BHARTIARTL.NS": "airtel.in",
  "ICICIBANK.NS": "icicibank.com",
  "SBIN.NS": "sbi.co.in",
  "TCS.NS": "tcs.com",
  "BAJFINANCE.NS": "bajajfinserv.in",
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
  "HINDUNILVR.NS": "hul.co.in",
  "ASIANPAINT.NS": "asianpaints.com",
  "ULTRACEMCO.NS": "ultratechcement.com",
};

function resolveDomain({
  symbol,
  logoDomain,
  website,
}) {
  if (logoDomain) {
    return logoDomain;
  }

  if (website) {
    try {
      return new URL(website).hostname.replace(
        /^www\./,
        "",
      );
    } catch {
      return "";
    }
  }

  return COMPANY_DOMAINS[
    String(symbol || "").toUpperCase()
  ] || "";
}

export default function CompanyLogo({
  symbol,
  name,
  logoDomain,
  website,
  size = 42,
  className = "",
}) {
  const [failed, setFailed] =
    useState(false);

  const domain = resolveDomain({
    symbol,
    logoDomain,
    website,
  });

  const logoKey =
    import.meta.env.VITE_LOGO_KEY;

  useEffect(() => {
    setFailed(false);
  }, [domain]);

  const showImage =
    Boolean(
      domain &&
      logoKey &&
      !failed,
    );

  const fallbackLetter =
    String(
      name ||
      symbol ||
      "?",
    )
      .trim()
      .charAt(0)
      .toUpperCase();

  return (
    <div
      className={`exa-company-logo ${className}`}
      style={{
        width: size,
        height: size,
      }}
      aria-label={`${name || symbol} logo`}
    >
      {showImage ? (
        <img
          src={`https://img.logo.dev/${domain}?token=${logoKey}&size=128&format=webp`}
          alt=""
          loading="lazy"
          onError={() =>
            setFailed(true)
          }
        />
      ) : (
        <span>{fallbackLetter}</span>
      )}
    </div>
  );
}