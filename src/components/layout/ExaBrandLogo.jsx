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
        src="/favicon.svg"
        alt="Litses"
        className="exa-brand-image"
        draggable="false"
      />

      <span className="exa-brand-copy">
        <strong className="exa-brand-wordmark">
          Litses
        </strong>

        {showTagline && !compact && (
          <span className="exa-brand-tagline">
            Market intelligence
          </span>
        )}
      </span>
    </div>
  );
}
