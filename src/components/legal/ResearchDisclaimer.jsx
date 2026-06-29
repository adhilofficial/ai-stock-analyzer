import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

import { LEGAL_COPY } from "../../config/legal";

export default function ResearchDisclaimer({
  compact = false,
  className = "",
}) {
  return (
    <aside
      className={`research-disclaimer ${
        compact ? "research-disclaimer--compact" : ""
      } ${className}`}
      aria-label="Financial research disclaimer"
    >
      <div className="research-disclaimer__icon">
        <AlertTriangle
          size={compact ? 17 : 20}
          aria-hidden="true"
        />
      </div>

      <div className="research-disclaimer__content">
        <strong>Important research notice</strong>

        <p>
          {compact
            ? LEGAL_COPY.shortDisclaimer
            : `${LEGAL_COPY.shortDisclaimer} ${LEGAL_COPY.dataWarning}`}
        </p>

        <div className="research-disclaimer__links">
          <Link to="/disclaimer">Read disclaimer</Link>
          <Link to="/methodology">View methodology</Link>
        </div>
      </div>
    </aside>
  );
}