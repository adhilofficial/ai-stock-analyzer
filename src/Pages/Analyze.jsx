import { useState, useMemo } from "react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import {
  Star, TrendingUp, TrendingDown, Building2, BarChart3, ArrowUpDown, Database,
  Sparkles, ShieldCheck, AlertTriangle
} from "lucide-react";
import ScoreGauge from "../components/ScoreGauge";

const SAMPLES = ["Reliance Industries", "HDFC Bank", "Infosys", "Tata Motors", "Wipro", "Asian Paints", "Zomato"];
const TIMEFRAMES = ["1D", "1W", "1M", "1Y", "5Y", "MAX"];

const SIGNAL_STYLE = {
  BUY:     { color: "#22c55e", bg: "#052e16", label: "Positive" },
  SELL:    { color: "#ef4444", bg: "#450a0a", label: "Negative" },
  NEUTRAL: { color: "#eab308", bg: "#422006", label: "Neutral" },
  WATCH:   { color: "#3b82f6", bg: "#172554", label: "Watch" },
};

// Generates a plausible-looking price series for the chart.
// Real intraday/historical data is a later upgrade — see roadmap Phase 1.
function generateSeries(basePrice, points, volatility) {
  let price = basePrice * 0.97;
  const out = [];
  for (let i = 0; i < points; i++) {
    price += (Math.random() - 0.45) * volatility;
    out.push({ i, price: Math.round(price * 100) / 100 });
  }
  out[out.length - 1].price = basePrice;
  return out;
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: "#101a30", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px"
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, background: "#1e293b",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
      }}>
        <Icon size={17} color="#93c5fd" />
      </div>
      <div>
        <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

function ScoreCard({ title, score, scoreLabel }) {
  const labelColor = score >= 70 ? "#22c55e" : score >= 40 ? "#eab308" : "#ef4444";
  return (
    <div style={{
      background: "#101a30", border: "1px solid #1e293b", borderRadius: 10,
      padding: "14px 16px", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8
    }}>
      <div style={{ fontSize: 13, color: "#cbd5e1" }}>{title}</div>
      <ScoreGauge score={score} size={64} />
      <div style={{ fontSize: 12, fontWeight: 600, color: labelColor }}>{scoreLabel}</div>
    </div>
  );
}

export default function Analyze() {function CompanyLogo({ domain, name, size = 52 }) {
  const [failed, setFailed] = useState(false);
  const showImage = domain && !failed;
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: showImage ? "#fff" : "#1e293b",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, overflow: "hidden"
    }}>
      {showImage ? (
        <img
          src={`https://img.logo.dev/${domain}?token=${import.meta.env.VITE_LOGO_KEY}&size=128&format=webp`}
          alt={name}
          onError={() => setFailed(true)}
          style={{ width: "70%", height: "70%", objectFit: "contain" }}
        />
      ) : (
        <span style={{ fontWeight: 700, fontSize: size * 0.35, color: "#93c5fd" }}>
          {name?.charAt(0) || "?"}
        </span>
      )}
    </div>
  );
}
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [timeframe, setTimeframe] = useState("1D");
  const [activeTab, setActiveTab] = useState("Overview");

  async function analyze(stock) {
    const q = stock || query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: `Analyze this Indian stock: ${q}` }]
        })
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error.message);
        setLoading(false);
        return;
      }

      const text = data.content?.map(c => c.text || "").join("").trim();
      if (!text) {
        setError("Empty response from server.");
        setLoading(false);
        return;
      }
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setQuery("");
    } catch (e) {
      setError("Error: " + e.message);
    }
    setLoading(false);
  }

  const chartData = useMemo(() => {
    if (!result) return [];
    const pointsByTf = { "1D": 40, "1W": 50, "1M": 60, "1Y": 80, "5Y": 80, MAX: 90 };
    const volByTf = { "1D": result.price * 0.004, "1W": result.price * 0.01, "1M": result.price * 0.02,
      "1Y": result.price * 0.05, "5Y": result.price * 0.08, MAX: result.price * 0.1 };
    return generateSeries(result.price, pointsByTf[timeframe], volByTf[timeframe]);
  }, [result, timeframe]);

  const sig = result ? (SIGNAL_STYLE[result.signal] || SIGNAL_STYLE.NEUTRAL) : null;

  return (
    <div style={{ width: "100%", padding: "20px 32px", boxSizing: "border-box", fontFamily: "Arial, sans-serif" }}>

      {/* Search row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && analyze()}
          placeholder="Search stocks, sectors or themes..."
          style={{
            flex: 1, padding: "12px 16px", borderRadius: 10, fontSize: 15,
            border: "1px solid #1e293b", background: "#101a30", color: "#fff", outline: "none"
          }}
        />
        <button
          onClick={() => analyze()}
          disabled={loading || !query.trim()}
          style={{
            padding: "12px 24px", borderRadius: 10, fontWeight: 600, fontSize: 15,
            background: "#1d4ed8", color: "#fff", border: "none", cursor: "pointer", whiteSpace: "nowrap"
          }}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {/* Sample chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {SAMPLES.map(s => (
          <button key={s} onClick={() => analyze(s)}
            style={{
              padding: "8px 16px", borderRadius: 20, fontSize: 14,
              background: "#101a30", border: "1px solid #1e293b", color: "#cbd5e1", cursor: "pointer"
            }}>
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ padding: 14, background: "#450a0a", borderRadius: 10, color: "#fca5a5", marginBottom: 20, fontSize: 14 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", color: "#64748b", padding: 60, fontSize: 15 }}>
          Running AI analysis...
        </div>
      )}

      {!result && !loading && !error && (
        <div style={{ textAlign: "center", color: "#475569", padding: 60, fontSize: 14 }}>
          Search a stock or pick one above to see a full AI-powered analysis.
        </div>
      )}

      {result && sig && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Stock header card */}
            <div style={{ background: "#101a30", border: "1px solid #1e293b", borderRadius: 12, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 14 }}>
                  <CompanyLogo domain={result.logoDomain} name={result.company} size={52} />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 19, fontWeight: 600, color: "#fff" }}>{result.company}</span>
                      <Star size={16} color="#64748b" />
                    </div>
                    <div style={{ fontSize: 13, color: "#60a5fa", marginTop: 2 }}>
                      {result.ticker} <span style={{ color: "#64748b" }}>· {result.sector}</span>
                    </div>
                  </div>
                </div>
                <span style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8,
                  background: sig.bg, color: sig.color, fontSize: 13, fontWeight: 600
                }}>
                  {result.changePercent >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  AI View: {sig.label}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 16 }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: "#fff" }}>₹{result.price}</span>
                <span style={{
                  fontSize: 15, fontWeight: 600,
                  color: result.changePercent >= 0 ? "#22c55e" : "#ef4444"
                }}>
                  {result.changePercent >= 0 ? "▲" : "▼"} {Math.abs(result.changeAbs)} ({Math.abs(result.changePercent)}%)
                </span>
                <span style={{ fontSize: 13, color: "#64748b" }}>Today</span>
              </div>
            </div>

            {/* Metric cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <MetricCard icon={Building2} label="Market cap" value={result.marketCap} />
              <MetricCard icon={BarChart3} label="P/E ratio (TTM)" value={result.peRatio} />
              <MetricCard icon={ArrowUpDown} label="52W range" value={`${result.week52Low} - ${result.week52High}`} />
              <MetricCard icon={Database} label="Volume (NSE)" value={result.volume} />
            </div>

            {/* Chart */}
            <div style={{ background: "#101a30", border: "1px solid #1e293b", borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {TIMEFRAMES.map(tf => (
                  <button key={tf} onClick={() => setTimeframe(tf)}
                    style={{
                      padding: "5px 12px", borderRadius: 6, fontSize: 13, cursor: "pointer",
                      border: "none",
                      background: timeframe === tf ? "#1d4ed8" : "transparent",
                      color: timeframe === tf ? "#fff" : "#64748b"
                    }}>
                    {tf}
                  </button>
                ))}
              </div>
              <div style={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="i" hide />
                    <YAxis domain={["auto", "auto"]} tick={{ fill: "#64748b", fontSize: 11 }} width={50} />
                    <Tooltip
                      contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                      labelStyle={{ display: "none" }}
                      formatter={(v) => [`₹${v}`, "Price"]}
                    />
                    <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fill="url(#priceFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #1e293b" }}>
              {["Overview", "Fundamentals", "Technicals", "News", "Risks", "Financials"].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "10px 16px", fontSize: 14, cursor: "pointer", border: "none",
                    background: "transparent",
                    color: activeTab === tab ? "#fff" : "#64748b",
                    borderBottom: activeTab === tab ? "2px solid #2563eb" : "2px solid transparent"
                  }}>
                  {tab}
                </button>
              ))}
            </div>

            {activeTab === "Overview" ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <ScoreCard title="Fundamental score" score={result.fundamentalScore} scoreLabel={result.fundamentalLabel} />
                <ScoreCard title="Momentum score" score={result.momentumScore} scoreLabel={result.momentumLabel} />
                <ScoreCard title="Valuation score" score={result.valuationScore} scoreLabel={result.valuationLabel} />
                <ScoreCard title="Sentiment score" score={result.sentimentScore} scoreLabel={result.sentimentLabel} />
              </div>
            ) : (
              <div style={{ padding: 24, textAlign: "center", color: "#475569", fontSize: 14 }}>
                This tab is part of the EXA NEXUS roadmap — coming in a later phase.
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <div style={{ background: "#101a30", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Confidence score</div>
                  <ScoreGauge score={result.confidenceScore} size={72} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Risk level</div>
                  <div style={{
                    fontSize: 15, fontWeight: 600,
                    color: result.riskLevel === "Low" ? "#22c55e" : result.riskLevel === "High" ? "#ef4444" : "#eab308"
                  }}>
                    {result.riskLevel}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: "#101a30", border: "1px solid #1e293b", borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#60a5fa", marginBottom: 10 }}>
                <Sparkles size={15} /> AI research summary
              </div>
              <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.7, marginBottom: 12 }}>{result.summary}</p>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 6 }}>Key themes</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(result.keyThemes || []).map((t, i) => (
                  <span key={i} style={{
                    fontSize: 12, padding: "4px 10px", borderRadius: 6,
                    background: "#1e293b", color: "#93c5fd"
                  }}>{t}</span>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: "#052e16", border: "1px solid #166534", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#4ade80", marginBottom: 8 }}>
                  <ShieldCheck size={14} /> Growth drivers
                </div>
                {(result.growthDrivers || []).map((g, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: "#86efac", marginBottom: 6, lineHeight: 1.5 }}>• {g}</div>
                ))}
              </div>
              <div style={{ background: "#431407", border: "1px solid #9a3412", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "#fb923c", marginBottom: 8 }}>
                  <AlertTriangle size={14} /> Key risks
                </div>
                {(result.keyRisks || []).map((r, i) => (
                  <div key={i} style={{ fontSize: 12.5, color: "#fdba74", marginBottom: 6, lineHeight: 1.5 }}>• {r}</div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
