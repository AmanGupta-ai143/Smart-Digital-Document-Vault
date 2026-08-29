const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const mammoth = require("mammoth");

/**
 * Extracts raw text from an uploaded file buffer so it can be indexed
 * for search and handed to the AI for analysis.
 */
async function extractText(buffer, mimeType) {
  try {
    if (mimeType === "application/pdf") {
      const data = await pdfParse(buffer);
      return data.text;
    }

    if (mimeType === "text/plain") {
      return buffer.toString("utf-8");
    }

    if (mimeType === "image/jpeg" || mimeType === "image/png") {
      const { data } = await Tesseract.recognize(buffer, "eng");
      return data.text;
    }

    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    }

    return "";
  } catch (err) {
    console.error("[textExtraction] failed:", err.message);
    return "";
  }
}

module.exports = { extractText };
