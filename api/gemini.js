export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set.");
    return res.status(500).json({ error: "API key is not configured on the server." });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!geminiRes.ok) {
        const errorBody = await geminiRes.json();
        console.error("Google API Error:", errorBody);
        return res.status(geminiRes.status).json({ error: "Failed to fetch response from Gemini.", details: errorBody });
    }

    const result = await geminiRes.json();

    const text = result.candidates[0]?.content?.parts[0]?.text;

    if (text) {
      return res.status(200).json({ text: text });
    } else {
      console.error("Unexpected response structure from Google API:", result);
      return res.status(500).json({ error: "Could not extract text from Gemini's response." });
    }

  } catch (err) {
    console.error("Internal Server Error:", err);
    return res.status(500).json({ error: err.message || "An internal server error occurred." });
  }
}