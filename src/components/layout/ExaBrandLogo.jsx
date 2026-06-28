export default function ExaBrandLogo({
  compact = false,
  showTagline = true,
  className = "",
}) {
  const lockupClassName = [
    "exa-brand-lockup",
    compact ? "compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={lockupClassName}>
      <img
        src="/exa-logo.webp"
        alt="EXA"
        className="exa-brand-image"
        draggable="false"
      />
  
      {/* {showTagline && !compact && (
        <span className="exa-brand-tagline">
          AI Stock Analyzer
        </span>
      )} */}
    </div>
  );
}