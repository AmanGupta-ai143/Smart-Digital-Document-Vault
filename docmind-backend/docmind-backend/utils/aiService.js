const { GoogleGenAI } = require("@google/genai");
const Document = require("../models/Document");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// gemini-2.5-flash currently sits on Gemini's free tier (generous requests/day,
// no credit card required) — see https://ai.google.dev/gemini-api/docs/models
// for the current list, since Google renames/retires model IDs periodically.
// Override with GEMINI_MODEL in .env if this ID stops working.
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/**
 * Calls Gemini with a prompt and forces a JSON response via responseMimeType
 * (more reliable than asking nicely in the prompt). Falls back to stripping
 * markdown fences in case the model adds them anyway.
 */
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash-lite";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini returns 503 (overloaded) or 429 (rate limited) during busy periods;
// both are temporary, so they are worth retrying instead of failing the user.
function isTemporaryError(err) {
  const text = `${err?.status || ""} ${err?.message || ""}`;
  return /\b(503|429)\b|UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand/i.test(text);
}

async function callModel(model, prompt, maxOutputTokens) {
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      maxOutputTokens: maxOutputTokens * 4, // leave room for model "thinking" tokens
      thinkingConfig: { thinkingBudget: 0 }, // not needed for this task
    },
  });

  const text = response.text;
  if (!text) throw new Error("AI returned an empty response.");
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

/**
 * Calls Gemini with a prompt and forces a JSON response via responseMimeType.
 * If the main model is overloaded it retries with a short backoff, then falls
 * back to a lighter model, so a busy moment on Google's side does not break
 * the assistant.
 */
async function generateJSON(prompt, maxOutputTokens) {
  const attempts = [
    { model: MODEL, wait: 0 },
    { model: MODEL, wait: 1500 },
    { model: FALLBACK_MODEL, wait: 1000 },
    { model: FALLBACK_MODEL, wait: 2500 },
  ];

  let lastError;
  for (const { model, wait } of attempts) {
    if (wait) await sleep(wait);
    try {
      return await callModel(model, prompt, maxOutputTokens);
    } catch (err) {
      lastError = err;
      if (!isTemporaryError(err)) throw err;
      console.warn(`[ai] ${model} temporarily unavailable, retrying...`);
    }
  }

  console.error("[ai] All attempts failed:", lastError?.message);
  throw new Error("The AI service is very busy right now. Please try again in a minute.");
}

/**
 * Asks the model to analyze a freshly extracted document text and return
 * structured JSON: category, summary, key points, tags, and any dates
 * worth flagging for the user to confirm as reminders.
 */
async function analyzeDocument(extractedText, fileName) {
  const prompt = `You are analyzing a personal document for a private document-vault app.
File name: ${fileName}
Categories to choose from exactly: ${Document.CATEGORIES.join(", ")}

Document text:
"""
${extractedText.slice(0, 12000)}
"""

Respond with ONLY valid JSON matching this shape:
{
  "category": "one of the categories above",
  "categoryConfidence": 0.0,
  "summary": "2-3 sentence plain-language summary",
  "keyPoints": ["short bullet", "short bullet"],
  "tags": ["lowercase-tag", "lowercase-tag"],
  "detectedDates": [{ "label": "what the date is for", "date": "YYYY-MM-DD" }]
}`;

  return generateJSON(prompt, 1000);
}

/**
 * Answers a question about one or more documents ("Ask Your Document" /
 * AI Assistant). Context is limited to the requesting user's own
 * documents — callers must pre-filter by userId before calling this.
 */
async function answerQuestion(question, documents) {
  const context = documents
    .map((d, i) => `[Doc ${i + 1}: ${d.fileName}]\n${(d.extractedText || "").slice(0, 4000)}`)
    .join("\n\n");

  const prompt = `You are DocMind AI, an assistant answering questions about a user's own personal documents.
Only use the provided document context. If the answer isn't in the documents, say so plainly.

${context}

Question: ${question}

Respond with ONLY valid JSON:
{
  "answer": "your answer",
  "sourceDocuments": ["file names referenced"],
  "followUpQuestions": ["suggested next question", "suggested next question"]
}`;

  return generateJSON(prompt, 800);
}

module.exports = { analyzeDocument, answerQuestion };
