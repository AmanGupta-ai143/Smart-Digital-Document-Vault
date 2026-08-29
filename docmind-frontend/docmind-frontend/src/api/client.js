const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const TOKEN_KEY = "docmind_access_token";
const REFRESH_KEY = "docmind_refresh_token";

export const tokenStore = {
  getAccess: () => localStorage.getItem(TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set: (accessToken, refreshToken) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

let refreshPromise = null;

/**
 * Exchanges the stored refresh token for a new access token. Multiple
 * concurrent 401s share a single in-flight refresh call instead of each
 * firing their own.
 */
async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = tokenStore.getRefresh();
    if (!refreshToken) throw new Error("No refresh token available.");

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) throw new Error("Session expired.");
    const data = await res.json();
    tokenStore.set(data.accessToken, null);
    return data.accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * Central request helper for every API call in the app. Attaches the
 * access token, retries once after a silent refresh on 401, and always
 * surfaces the backend's user-facing `message` field on failure.
 */
export async function apiRequest(path, { method = "GET", body, isFormData = false, auth = true, retry = true } = {}) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = tokenStore.getAccess();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retry) {
    try {
      await refreshAccessToken();
      return apiRequest(path, { method, body, isFormData, auth, retry: false });
    } catch {
      tokenStore.clear();
      window.dispatchEvent(new CustomEvent("docmind:session-expired"));
      throw new Error("Your session expired. Please log in again.");
    }
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // No JSON body (e.g. some 204s) — fine to ignore.
  }

  if (!res.ok) {
    throw new Error(data?.message || "Something went wrong. Please try again.");
  }

  return data;
}
