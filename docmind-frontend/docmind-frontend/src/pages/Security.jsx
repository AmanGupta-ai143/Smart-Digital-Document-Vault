import React, { useEffect, useState } from "react";
import { Smartphone, Laptop, Monitor, KeyRound, ShieldCheck } from "lucide-react";
import { Badge, Spinner, ErrorState, Modal } from "../components/ui.jsx";
import * as authApi from "../api/auth.js";
import { useToast } from "../context/ToastContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const ICON = { mobile: Smartphone, laptop: Laptop, desktop: Monitor, tablet: Smartphone };

function TwoFactorSetupModal({ onClose, onEnabled }) {
  const { showToast } = useToast();
  const [step, setStep] = useState("loading"); // loading | scan | error
  const [qr, setQr] = useState(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    authApi.setupTwoFactor()
      .then((data) => { setQr(data); setStep("scan"); })
      .catch((err) => { setError(err.message); setStep("error"); });
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    try {
      const user = await authApi.verifyTwoFactorSetup(code);
      showToast("Two-factor authentication enabled.");
      onEnabled(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Modal title="Set up two-factor authentication" onClose={onClose}>
      {step === "loading" && <Spinner label="Generating your secret…" />}
      {step === "error" && <ErrorState message={error} />}
      {step === "scan" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Scan this QR code with an authenticator app (Google Authenticator, Authy, 1Password, etc.), then enter the 6-digit code it shows.</p>
          <img src={qr.qrCodeDataUrl} alt="2FA QR code" className="mx-auto w-48 h-48 border border-slate-200 rounded-lg" />
          <details className="text-xs text-slate-400">
            <summary className="cursor-pointer">Can't scan? Enter this key manually</summary>
            <code className="block mt-1 bg-slate-50 px-2 py-1 rounded break-all">{qr.manualEntryKey}</code>
          </details>
          {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg px-3 py-2">{error}</div>}
          <form onSubmit={submit} className="space-y-3">
            <input
              autoFocus inputMode="numeric" maxLength={6} placeholder="000000" value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-center text-lg tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <button type="submit" disabled={verifying || code.length !== 6} className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium">
              {verifying ? "Verifying…" : "Verify & Enable"}
            </button>
          </form>
        </div>
      )}
    </Modal>
  );
}

function DisableTwoFactorModal({ onClose, onDisabled }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const user = await authApi.disableTwoFactor(password);
      onDisabled(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Turn off two-factor authentication" onClose={onClose}>
      <p className="text-sm text-slate-600 mb-4">Confirm your password to disable two-factor authentication.</p>
      {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <input type="password" autoFocus placeholder="Current password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        <button type="submit" disabled={saving || !password} className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium">
          {saving ? "Disabling…" : "Disable Two-Factor Authentication"}
        </button>
      </form>
    </Modal>
  );
}

export default function SecurityCenter() {
  const { showToast } = useToast();
  const { user, setUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisable, setShowDisable] = useState(false);

  const twoFAEnabled = !!user?.twoFactorEnabled;

  const load = () => {
    setLoading(true);
    setError(null);
    authApi.fetchSessions().then(setSessions).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const score = 60 + (twoFAEnabled ? 25 : 0) + (sessions.length <= 3 ? 10 : 0);

  const removeDevice = async (id) => {
    setSessions((ss) => ss.filter((s) => s.id !== id));
    try {
      await authApi.removeSession(id);
      showToast("Device signed out.");
    } catch (err) {
      showToast(err.message, "error");
      load();
    }
  };

  const removeAllOthers = async () => {
    try {
      await authApi.removeAllOtherSessions();
      showToast("Signed out of all other devices.");
      load();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-slate-900 mb-1">Security Center</h1>
        <p className="text-slate-500 text-sm">Review your account's security and manage device access.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 flex items-center gap-6">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
            <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <circle cx="18" cy="18" r="16" fill="none" stroke="#0f766e" strokeWidth="3" strokeDasharray={`${score} 100`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center font-serif text-lg text-slate-900">{score}</div>
        </div>
        <div>
          <p className="font-medium text-slate-900">Your account security score</p>
          <p className="text-sm text-slate-500">{twoFAEnabled ? "Strong — two-factor authentication is on." : "Good — enable two-factor authentication to strengthen it."}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-800 flex items-center gap-2"><KeyRound size={15} /> Two-Factor Authentication</p>
            <p className="text-sm text-slate-500 mt-0.5">Adds a verification step when signing in from a new device, using an authenticator app.</p>
          </div>
          <button
            onClick={() => (twoFAEnabled ? setShowDisable(true) : setShowSetup(true))}
            className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${twoFAEnabled ? "bg-teal-700" : "bg-slate-200"}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${twoFAEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>
        {twoFAEnabled && (
          <p className="text-xs text-teal-700 mt-3 flex items-center gap-1"><ShieldCheck size={12} /> Two-factor authentication is active on your account.</p>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-medium text-slate-900">Active Devices</p>
          <button onClick={removeAllOthers} className="text-xs text-rose-600 font-medium">Log out all other devices</button>
        </div>
        {loading ? <Spinner /> : error ? <ErrorState message={error} onRetry={load} /> : (
          <div className="divide-y divide-slate-100">
            {sessions.map((s) => {
              const Icon = ICON[s.deviceType] || Monitor;
              return (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                  <Icon size={18} className="text-slate-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.deviceLabel} {s.isCurrentDevice && <Badge tone="teal">This device</Badge>}</p>
                    <p className="text-xs text-slate-400">{new Date(s.lastActiveAt).toLocaleString()}</p>
                  </div>
                  {!s.isCurrentDevice && <button onClick={() => removeDevice(s.id)} className="text-xs border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-medium shrink-0">Log out</button>}
                </div>
              );
            })}
            {sessions.length === 0 && <p className="text-sm text-slate-400 text-center py-8">No active sessions found.</p>}
          </div>
        )}
      </div>

      {showSetup && (
        <TwoFactorSetupModal
          onClose={() => setShowSetup(false)}
          onEnabled={(u) => { setUser(u); setShowSetup(false); }}
        />
      )}
      {showDisable && (
        <DisableTwoFactorModal
          onClose={() => setShowDisable(false)}
          onDisabled={(u) => { setUser(u); setShowDisable(false); showToast("Two-factor authentication disabled."); }}
        />
      )}
    </div>
  );
}
