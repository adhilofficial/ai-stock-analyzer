import { useState } from "react";
 
const SYSTEM_PROMPT = `You are a financial analyst assistant. When given a stock ticker or company name (Indian market), provide a structured analysis in this exact JSON format:
{
  "company": "Company Name",
  "ticker": "NSE:TICKER",
  "sector": "Sector",
  "signal": "BUY",
  "strength": 7,
  "summary": "2-3 sentence analyst summary",
  "positives": ["point 1", "point 2", "point 3"],
  "risks": ["risk 1", "risk 2", "risk 3"],
  "keyMetrics": {
    "peRange": "15-20x (estimated)",
    "sector": "IT",
    "marketCap": "Large cap",
    "trend": "Uptrend"
  },
  "analystNote": "One actionable note for a swing trader"
}
Respond ONLY with valid JSON. No markdown, no backticks, no extra text.`;
 
const SIGNALS = {
  BUY:     { color: "#15803d", bg: "#dcfce7" },
  SELL:    { color: "#b91c1c", bg: "#fee2e2" },
  NEUTRAL: { color: "#92400e", bg: "#fef3c7" },
  WATCH:   { color: "#1d4ed8", bg: "#dbeafe" },
};
 
const SAMPLES = ["Reliance Industries", "HDFC Bank", "Infosys", "Tata Motors", "Wipro", "Asian Paints", "Zomato"];
 
export default function StockAnalyzer() {
  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState("");
 
  async function analyze(stock) {
    const q = stock || query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setResult(null);
 
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Analyze this Indian stock: ${q}` }]
        })
      });
 
      const data = await res.json();
console.log("Response:", JSON.stringify(data));

// Check for API error

if (data.error) {
  setError("API Error: " + data.error.message);
  setLoading(false);
  return;
}

const text = data.content?.map(c => c.text || "").join("").trim();
if (!text) {
  setError("Empty response from API. Check billing at console.anthropic.com");
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
 
  const sig = result ? (SIGNALS[result.signal] || SIGNALS.NEUTRAL) : null;
 
  return (
    <div style={{ fontFamily: "Arial, sans-serif", padding: "2rem", maxWidth: 700, margin: "0 auto", background: "#0f172a", minHeight: "100vh", color: "#fff" }}>
      <h1 style={{ textAlign: "center", fontSize: 26, fontWeight: 600, marginBottom: 4 }}>AI Stock Analyst</h1>
      <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginBottom: 24 }}>
        Powered by EXA NEXUS · Indian markets (NSE/BSE) · Research use only
      </p>
 
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && analyze()}
          placeholder="Enter stock name (e.g. Infosys, HDFC Bank)"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 8, fontSize: 15, border: "1px solid #334155", background: "#1e293b", color: "#fff", outline: "none" }}
        />
        <button
          onClick={() => analyze()}
          disabled={loading || !query.trim()}
          style={{ padding: "10px 20px", borderRadius: 8, fontWeight: 600, fontSize: 15, background: "#1A3C6E", color: "#fff", border: "none", cursor: "pointer" }}
        >
          {loading ? "..." : "Analyze"}
        </button>
      </div>
 
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
        {SAMPLES.map(s => (
          <button key={s} onClick={() => analyze(s)}
            style={{ padding: "4px 12px", borderRadius: 20, fontSize: 13, background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", cursor: "pointer" }}>
            {s}
          </button>
        ))}
      </div>
 
      {error && (
        <div style={{ padding: 12, background: "#450a0a", borderRadius: 8, color: "#fca5a5", marginBottom: 16, fontSize: 14 }}>
          {error}
        </div>
      )}
 
      {loading && (
        <div style={{ textAlign: "center", color: "#94a3b8", padding: 40, fontSize: 15 }}>
          Analyzing {query}...
        </div>
      )}
 
      {result && sig && (
        <div style={{ border: "1px solid #334155", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", background: "#1A3C6E", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 600, fontSize: 18 }}>{result.company}</div>
              <div style={{ color: "#93c5fd", fontSize: 13 }}>{result.ticker} · {result.sector}</div>
            </div>
            <span style={{ padding: "4px 16px", borderRadius: 20, fontWeight: 600, fontSize: 15, background: sig.bg, color: sig.color }}>
              {result.signal}
            </span>
          </div>
 
          <div style={{ padding: 20, background: "#1e293b" }}>
            <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{result.summary}</p>
 
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 14, borderRadius: 8, background: "#052e16", border: "1px solid #166534" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#4ade80", marginBottom: 8 }}>✓ Positives</div>
                {result.positives?.map((p, i) => <div key={i} style={{ fontSize: 13, color: "#86efac", marginBottom: 4 }}>• {p}</div>)}
              </div>
              <div style={{ padding: 14, borderRadius: 8, background: "#431407", border: "1px solid #9a3412" }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#fb923c", marginBottom: 8 }}>⚠ Risks</div>
                {result.risks?.map((r, i) => <div key={i} style={{ fontSize: 13, color: "#fdba74", marginBottom: 4 }}>• {r}</div>)}
              </div>
            </div>
 
            <div style={{ padding: 12, borderRadius: 8, background: "#172554", border: "1px solid #1d4ed8" }}>
              <span style={{ fontWeight: 600, fontSize: 13, color: "#60a5fa" }}>Analyst note: </span>
              <span style={{ fontSize: 13, color: "#93c5fd" }}>{result.analystNote}</span>
            </div>
 
            <div style={{ fontSize: 11, color: "#475569", marginTop: 12, textAlign: "center" }}>
              AI-generated · Not financial advice · Verify before trading
            </div>
          </div>
        </div>
      )}
    </div>
  );
}