const SYSTEM_PROMPT = `You are a financial analyst assistant for EXA NEXUS, an Indian markets platform. When given a stock ticker or company name (Indian market), provide a structured analysis in this exact JSON format:
{
  "company": "Company Name",
  "ticker": "NSE:TICKER",
  "sector": "Sector",
  "logoDomain": "ril.com",
  "price": 389.45,
  "changeAbs": 8.65,
  "changePercent": 2.27,
  "marketCap": "₹1,24,715 Cr",
  "peRatio": 28.74,
  "week52Low": 246.10,
  "week52High": 416.80,
  "volume": "1.25 Cr",
  "signal": "BUY",
  "confidenceScore": 82,
  "riskLevel": "Moderate",
  "summary": "2-3 sentence analyst summary",
  "keyThemes": ["theme 1", "theme 2", "theme 3"],
  "growthDrivers": ["driver 1", "driver 2", "driver 3", "driver 4"],
  "keyRisks": ["risk 1", "risk 2", "risk 3", "risk 4"],
  "fundamentalScore": 83,
  "fundamentalLabel": "Strong",
  "momentumScore": 76,
  "momentumLabel": "Strong",
  "valuationScore": 68,
  "valuationLabel": "Neutral",
  "sentimentScore": 72,
  "sentimentLabel": "Positive"
}
All numeric values should be realistic estimates for the actual company based on its known market position, sector, and approximate size. logoDomain must be the company's real official website domain without https:// or www (e.g. ril.com, hdfcbank.com, infosys.com, tatamotors.com) — this is used to fetch their brand logo. signal must be one of: BUY, SELL, NEUTRAL, WATCH. riskLevel must be one of: Low, Moderate, High. Score labels should match their score: 70+ = Strong/Positive, 40-69 = Neutral, below 40 = Weak/Negative/Cautious.
Respond ONLY with valid JSON. No markdown, no backticks, no extra text.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  try {
    const userMessage = req.body.messages?.[0]?.content || "Analyze a stock";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: SYSTEM_PROMPT + "\n\n" + userMessage }] }]
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ error: { message: data.error.message } });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.status(200).json({ content: [{ type: "text", text }] });

  } catch (err) {
    res.status(200).json({ error: { message: err.message } });
  }
}