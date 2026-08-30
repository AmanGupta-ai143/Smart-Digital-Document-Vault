import React, { useState } from "react";
import { FileText, ArrowLeft, Eye, EyeOff, Lock } from "lucide-react";
import { Seal } from "../components/ui.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

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

export default function LoginPage({ onGoSignup, onBack }) {
  const { login, completeTwoFactorLogin } = useAuth();
  const { showToast } = useToast();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [twoFAChallenge, setTwoFAChallenge] = useState(null); // { pendingToken }
  const [otpCode, setOtpCode] = useState("");

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

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 mb-6 dark:hover:text-slate-400"><ArrowLeft size={14} /> Back</button>
        <h1 className="font-serif text-2xl mb-1 text-slate-900 dark:text-slate-100">Welcome back</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Log in to access your vault.</p>

        {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

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
            <a href="#" className="text-teal-700 font-medium">Forgot password?</a>
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
