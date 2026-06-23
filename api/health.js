export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");

    return res.status(405).json({
      success: false,
      error: "Only GET requests are allowed.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "EXA NEXUS API is working",

    services: {
      yahooFinance: true,
      geminiConfigured: Boolean(
        process.env.GEMINI_KEY,
      ),
    },

    geminiModel:
      process.env.GEMINI_MODEL ||
      "gemini-2.5-flash-lite",

    time: new Date().toISOString(),
  });
}