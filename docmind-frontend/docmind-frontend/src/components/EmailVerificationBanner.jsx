import React, { useState, useEffect } from "react";
import { MailCheck, X } from "lucide-react";
import { verifyEmail, resendVerificationCode } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

const DISMISS_KEY = "docmind_verify_banner_dismissed";

export default function EmailVerificationBanner() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISS_KEY) === "true");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  if (!user || user.emailVerified || dismissed) return null;

  const submit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      const updated = await verifyEmail(code);
      setUser(updated);
      showToast("Email verified.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await resendVerificationCode();
      showToast("Verification code sent.");
      setCooldown(30);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 md:px-6 py-3">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3">
        <MailCheck size={18} className="text-amber-700 dark:text-amber-400 shrink-0" />
        <p className="text-sm text-amber-800 dark:text-amber-300 flex-1 min-w-[220px]">
          Confirm your email — we sent a 6-digit code to <strong>{user.email}</strong>.
        </p>
        <form onSubmit={submit} className="flex items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            inputMode="numeric"
            className="w-24 text-center tracking-[0.3em] text-sm border border-amber-300 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-100 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            type="submit"
            disabled={verifying || code.length !== 6}
            className="text-xs font-medium bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg"
          >
            {verifying ? "Checking…" : "Verify"}
          </button>
        </form>
        <button
          onClick={resend}
          disabled={resending || cooldown > 0}
          className="text-xs font-medium text-amber-700 dark:text-amber-400 hover:underline disabled:opacity-50 disabled:no-underline shrink-0"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending…" : "Resend code"}
        </button>
        <button
          onClick={() => { sessionStorage.setItem(DISMISS_KEY, "true"); setDismissed(true); }}
          className="p-1 text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 shrink-0"
          title="Dismiss for this session"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
