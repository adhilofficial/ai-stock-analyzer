
import { useId } from "react";

export default function ExaBrandLogo({
  compact = false,
}) {
  const generatedId = useId().replace(
    /:/g,
    "",
  );

  const gradientId =
    `exaBrandGradient-${generatedId}`;

  const maskId =
    `exaLetterMask-${generatedId}`;

  return (
    <div
      className={
        compact
          ? "exa-brand-lockup compact"
          : "exa-brand-lockup"
      }
    >
      <svg
        className="exa-brand-svg"
        viewBox="0 0 212 82"
        role="img"
        aria-label="EXA AI Stock Analyzer"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="0%"
            y1="20%"
            x2="100%"
            y2="80%"
          >
            <stop
              offset="0%"
              stopColor="#8b5cf6"
            />

            <stop
              offset="42%"
              stopColor="#2563eb"
            />

            <stop
              offset="72%"
              stopColor="#22d3ee"
            />

            <stop
              offset="100%"
              stopColor="#2f80ed"
            />
          </linearGradient>

          <mask id={maskId}>
            <rect
              width="212"
              height="82"
              fill="black"
            />

            <path
              d="
                M147 58
                L165 8
                H184
                L203 58
                H187
                L183 47
                H166
                L162 58
                Z
              "
              fill="white"
            />

            <path
              d="
                M171 36
                H179
                L175 23
                Z
              "
              fill="black"
            />
          </mask>
        </defs>

        {/* Letter E */}
        <path
          d="
            M8 8
            H70
            L66 20
            H24
            V27
            H61
            L57 39
            H24
            V46
            H70
            L66 58
            H8
            Z
          "
          fill={`url(#${gradientId})`}
        />

        {/* Letter X */}
        <path
          d="
            M73 8
            H92
            L109 27
            L126 8
            H145
            L119 33
            L145 58
            H126
            L109 39
            L92 58
            H73
            L99 33
            Z
          "
          fill={`url(#${gradientId})`}
        />

        {/* Letter A */}
        <rect
          x="145"
          y="5"
          width="62"
          height="56"
          fill={`url(#${gradientId})`}
          mask={`url(#${maskId})`}
        />

        <text
          className="exa-brand-svg-tagline"
          x="10"
          y="77"
          fill={`url(#${gradientId})`}
          fontFamily="Inter, Arial, sans-serif"
          fontSize="12"
          fontWeight="600"
          letterSpacing="0.1"
        >
          AI Stock Analyzer
        </text>
      </svg>
    </div>
  );
}
