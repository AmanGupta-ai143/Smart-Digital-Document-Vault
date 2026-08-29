import { apiRequest } from "./client.js";

function toQuery(params = {}) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return q ? `?${q}` : "";
}

/* Contacts */
export async function listContacts(filters = {}) {
  const data = await apiRequest(`/contacts${toQuery(filters)}`);
  return data.contacts;
}
export async function createContact(payload) {
  const data = await apiRequest("/contacts", { method: "POST", body: payload });
  return data.contact;
}
export async function updateContact(id, patch) {
  const data = await apiRequest(`/contacts/${id}`, { method: "PATCH", body: patch });
  return data.contact;
}
export async function deleteContact(id) {
  return apiRequest(`/contacts/${id}`, { method: "DELETE" });
}

/* Reminders */
export async function listReminders(status) {
  const data = await apiRequest(`/reminders${toQuery({ status })}`);
  return data.reminders;
}
export async function listAiDetectedDates() {
  const data = await apiRequest("/reminders/ai-detected");
  return data.suggestions;
}
export async function createReminder(payload) {
  const data = await apiRequest("/reminders", { method: "POST", body: payload });
  return data.reminder;
}
export async function updateReminder(id, patch) {
  const data = await apiRequest(`/reminders/${id}`, { method: "PATCH", body: patch });
  return data.reminder;
}
export async function deleteReminder(id) {
  return apiRequest(`/reminders/${id}`, { method: "DELETE" });
}

/* Activity */
export async function listActivity(page = 1, limit = 30) {
  return apiRequest(`/activity${toQuery({ page, limit })}`);
}

/* Search */
export async function unifiedSearch(q) {
  return apiRequest(`/search${toQuery({ q })}`);
}

/* Notifications */
export async function listNotifications(unreadOnly = false) {
  return apiRequest(`/notifications${toQuery({ unreadOnly: unreadOnly || undefined })}`); // { notifications, unreadCount }
}
export async function markNotificationRead(id) {
  const data = await apiRequest(`/notifications/${id}/read`, { method: "PATCH" });
  return data.notification;
}
export async function markAllNotificationsRead() {
  return apiRequest("/notifications/read-all", { method: "PATCH" });
}

/* Settings */
export async function updatePreferences(prefs) {
  const data = await apiRequest("/settings/preferences", { method: "PATCH", body: prefs });
  return data.preferences;
}
export async function getStorage() {
  return apiRequest("/settings/storage");
}
export async function getInsights() {
  return apiRequest("/settings/insights");
}
export async function deleteAccount() {
  return apiRequest("/settings/account", { method: "DELETE" });
}
