import { apiRequest, tokenStore } from "./client.js";

export function detectDeviceLabel() {
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  const browser = /Chrome/i.test(ua) ? "Chrome" : /Safari/i.test(ua) ? "Safari" : /Firefox/i.test(ua) ? "Firefox" : "Browser";
  const platform = /Windows/i.test(ua) ? "Windows" : /Mac/i.test(ua) ? "Mac" : /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : "Device";
  return { deviceLabel: `${browser} — ${platform}`, deviceType: isMobile ? "mobile" : "laptop" };
}

export async function signup({ name, email, password }) {
  const data = await apiRequest("/auth/signup", { method: "POST", auth: false, body: { name, email, password } });
  tokenStore.set(data.accessToken, data.refreshToken);
  return data.user;
}

export async function login({ email, password }) {
  const { deviceLabel, deviceType } = detectDeviceLabel();
  const data = await apiRequest("/auth/login", { method: "POST", auth: false, body: { email, password, deviceLabel, deviceType } });
  if (data.requires2FA) return { requires2FA: true, pendingToken: data.pendingToken };
  tokenStore.set(data.accessToken, data.refreshToken);
  return { user: data.user };
}

export async function verifyLoginTwoFactor({ pendingToken, token }) {
  const data = await apiRequest("/auth/2fa/login-verify", { method: "POST", auth: false, body: { pendingToken, token } });
  tokenStore.set(data.accessToken, data.refreshToken);
  return data.user;
}

export async function setupTwoFactor() {
  return apiRequest("/auth/2fa/setup", { method: "POST" }); // { qrCodeDataUrl, manualEntryKey }
}

export async function verifyTwoFactorSetup(token) {
  const data = await apiRequest("/auth/2fa/verify", { method: "POST", body: { token } });
  return data.user;
}

export async function disableTwoFactor(password) {
  const data = await apiRequest("/auth/2fa/disable", { method: "POST", body: { password } });
  return data.user;
}

export async function logout() {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } finally {
    tokenStore.clear();
  }
}

export async function fetchMe() {
  const data = await apiRequest("/auth/me");
  return data.user;
}

export async function changePassword({ currentPassword, newPassword }) {
  return apiRequest("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
}

export async function fetchSessions() {
  const data = await apiRequest("/auth/sessions");
  return data.sessions;
}

export async function removeSession(id) {
  return apiRequest(`/auth/sessions/${id}`, { method: "DELETE" });
}

export async function removeAllOtherSessions() {
  return apiRequest("/auth/sessions", { method: "DELETE" });
}
