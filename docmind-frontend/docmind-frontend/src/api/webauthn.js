import { apiRequest, tokenStore } from "./client.js";
import { detectDeviceLabel } from "./auth.js";
import { startRegistration, startAuthentication } from "@simplewebauthn/browser";

/**
 * Adds a passkey to the currently logged-in account. Triggers the browser's
 * native fingerprint/Face ID/security-key prompt via startRegistration.
 */
export async function registerPasskey() {
  const options = await apiRequest("/webauthn/register/options", { method: "POST" });
  const attestation = await startRegistration({ optionsJSON: options });
  const { deviceLabel } = detectDeviceLabel();
  return apiRequest("/webauthn/register/verify", {
    method: "POST",
    body: { ...attestation, deviceLabel },
  });
}

export async function listPasskeys() {
  const data = await apiRequest("/webauthn/credentials");
  return data.credentials;
}

export async function deletePasskey(id) {
  return apiRequest(`/webauthn/credentials/${id}`, { method: "DELETE" });
}

/**
 * Usernameless passkey login — no email needed. The browser shows a picker
 * of whichever passkeys it has saved for this site.
 */
export async function loginWithPasskey() {
  const { options, challengeToken } = await apiRequest("/webauthn/login/options", { method: "POST", auth: false });
  const credentialResponse = await startAuthentication({ optionsJSON: options });
  const { deviceLabel, deviceType } = detectDeviceLabel();

  const data = await apiRequest("/webauthn/login/verify", {
    method: "POST",
    auth: false,
    body: { credentialResponse, challengeToken, deviceLabel, deviceType },
  });

  tokenStore.set(data.accessToken, data.refreshToken);
  return data.user;
}
