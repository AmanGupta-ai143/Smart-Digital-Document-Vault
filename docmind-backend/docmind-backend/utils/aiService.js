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
async function generateJSON(prompt, maxOutputTokens) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      maxOutputTokens,
    },
  });

  const text = response.text || "{}";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
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
