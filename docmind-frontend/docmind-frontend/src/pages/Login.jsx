import React, { useState, useEffect } from "react";
import { FileText, ArrowLeft, Eye, EyeOff, Lock, Fingerprint } from "lucide-react";
import { Seal } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { forgotPassword, resetPassword } from "../api/auth.js";

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 font-sans grid md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between bg-slate-900 text-white p-10">
        <div className="flex items-center gap-2.5">
          <Seal size={34}><FileText size={16} /></Seal>
          <span className="font-serif text-lg">DocMind AI</span>
        </div>
        <div>
          <h2 className="font-serif text-3xl leading-tight mb-3">One vault.<br />Every authorized device.</h2>
          <p className="text-slate-400 text-sm max-w-xs dark:text-slate-500">Your documents and contacts sync securely the moment you sign in — phone, laptop, or desktop.</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Protected by encrypted sessions.</p>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">{children}</div>
    </div>
  );
}

function ForgotPasswordForm({ initialEmail, onBack, onDone }) {
  const { showToast } = useToast();
  const [step, setStep] = useState("email"); // "email" -> "reset"
  const [email, setEmail] = useState(initialEmail || "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const sendCode = async (e) => {
    e?.preventDefault();
    setError(null); setLoading(true);
    try {
      await forgotPassword(email.trim());
      setStep("reset");
      showToast("If that email has an account, a code is on its way.");
    } catch (err) {
      setError(err.message || "Could not send the code. Please try again.");
    } finally { setLoading(false); }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      await resetPassword({ email: email.trim(), code, password });
      showToast("Password updated. Please log in.");
      onDone(email.trim());
    } catch (err) {
      setError(err.message || "Could not reset your password.");
    } finally { setLoading(false); }
  };

  const input = "' + inp + '";
  return (
    <div className="w-full max-w-sm">
      <button onClick={onBack} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 flex items-center gap-1 mb-6"><ArrowLeft size={14} /> Back to log in</button>
      <h1 className="font-serif text-2xl mb-1 text-slate-900 dark:text-slate-100">Reset your password</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {step === "email" ? "Enter your account email and we'll send you a 6-digit code." : `We sent a code to ${email}. Enter it with your new password.`}
      </p>
      {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

      {step === "email" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">Email</label>
            <input type="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium text-sm">{loading ? "Sending…" : "Send reset code"}</button>
        </form>
      ) : (
        <form onSubmit={submitReset} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">6-digit code</label>
            <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className={input + " tracking-[0.4em] text-center text-lg"} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1.5">New password (at least 8 characters)</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input + " pr-10"} />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading || code.length !== 6 || password.length < 8} className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium text-sm">{loading ? "Updating…" : "Update password"}</button>
          <button type="button" onClick={sendCode} disabled={loading} className="w-full text-sm text-teal-700 font-medium">Send a new code</button>
        </form>
      )}
    </div>
  );
}

export default function LoginPage({ onGoSignup, onBack }) {
  const { login, completeTwoFactorLogin, loginWithPasskey } = useAuth();
  const { showToast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const [twoFAChallenge, setTwoFAChallenge] = useState(null); // { pendingToken }
  const [otpCode, setOtpCode] = useState("");
  const [forgotMode, setForgotMode] = useState(false);

  useEffect(() => { setPasskeySupported(browserSupportsWebAuthn()); }, []);

  const submitPasskey = async () => {
    setError(null);
    setPasskeyLoading(true);
    try {
      await loginWithPasskey();
    } catch (err) {
      // A cancelled or timed-out browser prompt shouldn't read like a server error.
      const friendly = /NotAllowedError|cancel|timed? ?out/i.test(err.message)
        ? "Passkey sign-in was cancelled or no passkey was found for this site."
        : err.message;
      showToast(friendly, "error");
    } finally {
      setPasskeyLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await login(form);
      if (result?.requires2FA) setTwoFAChallenge({ pendingToken: result.pendingToken });
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await completeTwoFactorLogin({ pendingToken: twoFAChallenge.pendingToken, token: otpCode });
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (twoFAChallenge) {
    return (
      <AuthLayout>
        <div className="w-full max-w-sm">
          <button onClick={() => setTwoFAChallenge(null)} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 mb-6 dark:hover:text-slate-400"><ArrowLeft size={14} /> Back</button>
          <h1 className="font-serif text-2xl mb-1 text-slate-900 dark:text-slate-100">Two-factor verification</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Enter the 6-digit code from your authenticator app.</p>
          {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
          <form onSubmit={submitOtp} className="space-y-4">
            <input
              autoFocus inputMode="numeric" maxLength={6} placeholder="000000" value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button type="submit" disabled={loading || otpCode.length !== 6} className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium text-sm">
              {loading ? "Verifying…" : "Verify & Log In"}
            </button>
          </form>
        </div>
      </AuthLayout>
    );
  }

  if (forgotMode) {
    return (
      <AuthLayout>
        <ForgotPasswordForm initialEmail={form.email} onBack={() => setForgotMode(false)} onDone={(email) => { setForm({ email, password: "" }); setForgotMode(false); }} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 mb-6 dark:hover:text-slate-400"><ArrowLeft size={14} /> Back</button>
        <h1 className="font-serif text-2xl mb-1 text-slate-900 dark:text-slate-100">Welcome back</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Log in to access your vault.</p>

        {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        {passkeySupported && (
          <>
            <button
              type="button"
              onClick={submitPasskey}
              disabled={passkeyLoading}
              className="w-full border border-slate-200 dark:border-slate-700 dark:text-slate-200 hover:border-teal-600 disabled:opacity-60 py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2 mb-4"
            >
              <Fingerprint size={16} className="text-teal-700 dark:text-teal-400" />
              {passkeyLoading ? "Waiting for your passkey…" : "Sign in with a passkey"}
            </button>
            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mb-4">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" /> or <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>
          </>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1.5 dark:text-slate-400">Email or User ID</label>
            <input
              type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300 block mb-1.5 dark:text-slate-400">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent pr-10"
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-teal-700 focus:ring-teal-600" /> Remember this device
            </label>
            <button type="button" onClick={() => setForgotMode(true)} className="text-teal-700 font-medium py-1">Forgot password?</button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2">
            <Lock size={15} /> {loading ? "Signing in…" : "Secure Login"}
          </button>
        </form>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-6">Don't have an account? <button onClick={onGoSignup} className="text-teal-700 font-medium">Create Account</button></p>
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-4">Your personal vault is protected and accessible only through authorized accounts and devices.</p>
      </div>
    </AuthLayout>
  );
}
