// /api/oracle.js — Vercel Serverless Function
// Keys are stored as Vercel Environment Variables (never exposed to frontend)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GROQ_KEY = process.env.GROQ_API_KEY;
  const GEMINI_KEY = process.env.GEMINI_API_KEY;

  if (!GROQ_KEY && !GEMINI_KEY) {
    return res.status(500).json({ error: 'No AI provider configured. Set GROQ_API_KEY or GEMINI_API_KEY in Vercel env vars.' });
  }

  try {
    const { prompt, systemPrompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Missing prompt' });

    // Pick provider: Groq-first with random variety (65/35 split)
    const hasGroq = !!GROQ_KEY;
    const hasGemini = !!GEMINI_KEY;
    let primary, fallback;

    if (hasGroq && hasGemini) {
      primary = Math.random() < 0.85 ? 'groq' : 'gemini';
      fallback = primary === 'groq' ? 'gemini' : 'groq';
    } else {
      primary = hasGroq ? 'groq' : 'gemini';
      fallback = null;
    }

    console.log(`🔮 Oracle using: ${primary}${fallback ? ` (fallback: ${fallback})` : ''}`);

    try {
      const text = await callProvider(primary, prompt, systemPrompt, GROQ_KEY, GEMINI_KEY);
      const parsed = parseJSON(text);
      return res.status(200).json({ result: parsed, provider: primary });
    } catch (err) {
      console.warn(`${primary} failed:`, err.message);
      if (fallback) {
        console.log(`🔄 Switching to ${fallback}...`);
        const text = await callProvider(fallback, prompt, systemPrompt, GROQ_KEY, GEMINI_KEY);
        const parsed = parseJSON(text);
        return res.status(200).json({ result: parsed, provider: fallback });
      }
      throw err;
    }
  } catch (err) {
    console.error('Oracle error:', err);
    return res.status(500).json({ error: err.message || 'Oracle failed' });
  }
}

async function callProvider(provider, prompt, systemPrompt, groqKey, geminiKey) {
  if (provider === 'groq') return callGroq(prompt, systemPrompt, groqKey);
  if (provider === 'gemini') return callGemini(prompt, systemPrompt, geminiKey);
  throw new Error(`Unknown provider: ${provider}`);
}

async function callGroq(prompt, systemPrompt, key) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.9,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt || 'You are a mystical relationship oracle. Always respond in valid JSON only. No markdown.' },
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `Groq error ${res.status}`);
  }
  const json = await res.json();
  return json.choices[0].message.content;
}

async function callGemini(prompt, systemPrompt, key) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      systemInstruction: { parts: [{ text: systemPrompt || 'You are a mystical relationship oracle. Always respond in valid JSON only. No markdown, no backticks, no explanation.' }] },
      generationConfig: { temperature: 0.9, maxOutputTokens: 1024, responseMimeType: 'application/json' }
    })
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `Gemini error ${res.status}`);
  }
  const json = await res.json();
  return json.candidates[0].content.parts[0].text;
}

function parseJSON(text) {
  try { return JSON.parse(text); }
  catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error('Could not parse Oracle response');
  }
}
