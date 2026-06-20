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

export default async function handler(req, res) {
    
  // Allow CORS

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