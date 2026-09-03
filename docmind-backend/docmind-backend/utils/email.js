const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "DocMind AI <onboarding@resend.dev>";

/**
 * Sends an email via Resend's REST API. If RESEND_API_KEY isn't configured,
 * this quietly no-ops (logs a warning) rather than throwing — email alerts
 * are a nice-to-have, and a missing key shouldn't break login or signup.
 */
async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn(`[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`);
    return null;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
      console.error("[email] Resend API error:", res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[email] send failed:", err.message);
    return null;
  }
}

/**
 * Login alert email — sent (best-effort, non-blocking) whenever a new
 * session is issued, whether via password, 2FA, or passkey.
 */
function sendLoginAlertEmail(user, { deviceLabel, ip, time }) {
  return sendEmail({
    to: user.email,
    subject: "New sign-in to your DocMind AI account",
    html: `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;color:#1e293b">
        <h2 style="color:#0f766e;margin-bottom:4px">New sign-in detected</h2>
        <p>Hi ${user.name || "there"},</p>
        <p>Your DocMind AI account was just signed into:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
          <tr><td style="padding:6px 0;color:#64748b;width:110px">Device</td><td style="padding:6px 0;font-weight:600">${deviceLabel || "Unknown device"}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Time</td><td style="padding:6px 0;font-weight:600">${time}</td></tr>
          ${ip ? `<tr><td style="padding:6px 0;color:#64748b">IP address</td><td style="padding:6px 0;font-weight:600">${ip}</td></tr>` : ""}
        </table>
        <p>If this was you, no action is needed.</p>
        <p>If you don't recognize this activity, change your password and review your active sessions in the Security Center right away.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:28px;border-top:1px solid #e2e8f0;padding-top:12px">
          DocMind AI — a personal vault, not a public archive.
        </p>
      </div>
    `,
  });
}

/**
 * Signup verification email — a 6-digit code, expires in 15 minutes.
 */
function sendVerificationEmail(user, code) {
  return sendEmail({
    to: user.email,
    subject: `${code} is your DocMind AI verification code`,
    html: `
      <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;color:#1e293b">
        <h2 style="color:#0f766e;margin-bottom:4px">Verify your email</h2>
        <p>Hi ${user.name || "there"},</p>
        <p>Enter this code to confirm this is really your inbox:</p>
        <div style="font-size:32px;font-weight:700;letter-spacing:8px;text-align:center;background:#f0fdfa;color:#0f766e;padding:20px;border-radius:12px;margin:20px 0">
          ${code}
        </div>
        <p style="color:#64748b;font-size:13px">This code expires in 15 minutes. If you didn't create a DocMind AI account, you can ignore this email.</p>
        <p style="color:#94a3b8;font-size:12px;margin-top:28px;border-top:1px solid #e2e8f0;padding-top:12px">
          DocMind AI — a personal vault, not a public archive.
        </p>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendLoginAlertEmail, sendVerificationEmail };
