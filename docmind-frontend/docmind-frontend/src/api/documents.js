import { apiRequest } from "./client.js";

/**
 * Builds a query string from a filters object, skipping empty values.
 */
function toQuery(params = {}) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return q ? `?${q}` : "";
}

export async function listDocuments(filters = {}) {
  const data = await apiRequest(`/documents${toQuery(filters)}`);
  return data; // { documents, total, page, limit }
}

export async function getDocument(id) {
  const data = await apiRequest(`/documents/${id}`);
  return data.document;
}

export async function updateDocument(id, patch) {
  const data = await apiRequest(`/documents/${id}`, { method: "PATCH", body: patch });
  return data.document;
}

export async function deleteDocument(id) {
  return apiRequest(`/documents/${id}`, { method: "DELETE" });
}

export async function confirmDetectedDate(id, dateIndex, confirmed) {
  const data = await apiRequest(`/documents/${id}/confirm-date`, { method: "PATCH", body: { dateIndex, confirmed } });
  return data.document;
}

/**
 * Uploads a file with multipart/form-data. onProgress receives a rough
 * stage label since fetch doesn't expose granular upload progress —
 * swap to XMLHttpRequest if a real progress bar is needed.
 */
export async function uploadDocument(file, { category, tags, isImportant, autoAnalyze = true } = {}) {
  const form = new FormData();
  form.append("file", file);
  if (category) form.append("category", category);
  if (tags) form.append("tags", tags);
  if (isImportant !== undefined) form.append("isImportant", String(isImportant));
  form.append("autoAnalyze", String(autoAnalyze));

  const data = await apiRequest("/documents/upload", { method: "POST", isFormData: true, body: form });
  return data.document;
}

export async function askDocuments(question, documentIds = []) {
  return apiRequest("/documents/ask", { method: "POST", body: { question, documentIds } });
}
