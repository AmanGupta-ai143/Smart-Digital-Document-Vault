import React, { useState } from "react";
import { FileText, ArrowLeft } from "lucide-react";
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
          <p className="text-slate-400 text-sm max-w-xs dark:text-slate-500">Your documents and contacts sync securely the moment you sign in.</p>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Protected by encrypted sessions.</p>
      </div>
      <div className="flex items-center justify-center p-6 md:p-10">{children}</div>
    </div>
  );
}

export default function SignupPage({ onGoLogin, onBack }) {
  const { signup } = useAuth();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    if (!form.name.trim()) return "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email.";
    if (form.password.length < 8) return "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) return "Passwords don't match.";
    return null;
  };

  const next = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    }
    setError(null);
    setStep((s) => s + 1);
  };

  const finish = async () => {
    setError(null);
    setLoading(true);
    try {
      await signup({ name: form.name, email: form.email, password: form.password });
    } catch (err) {
      setError(err.message);
      showToast(err.message, "error");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm">
        <button onClick={onBack} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 mb-6 dark:hover:text-slate-400"><ArrowLeft size={14} /> Back</button>
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-teal-700" : "bg-slate-200 dark:bg-slate-700"}`} />)}
        </div>

        {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}

        {step === 1 && (
          <>
            <h1 className="font-serif text-2xl mb-1 text-slate-900 dark:text-slate-100">Create your vault</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Step 1 of 3 — Personal details</p>
            <div className="space-y-4">
              <input placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
              <input placeholder="Email address" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
              <input placeholder="Create password" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
              <input placeholder="Confirm password" type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="font-serif text-2xl mb-1 text-slate-900 dark:text-slate-100">Security preferences</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Step 2 of 3 — you can change these later in Settings</p>
            <div className="space-y-3">
              <label className="flex items-center justify-between border border-slate-200 dark:border-slate-700 dark:text-slate-300 rounded-lg px-4 py-3 text-sm">
                Enable two-factor authentication <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-teal-700" />
              </label>
              <label className="flex items-center justify-between border border-slate-200 dark:border-slate-700 dark:text-slate-300 rounded-lg px-4 py-3 text-sm">
                Trust this device <input type="checkbox" defaultChecked className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-teal-700" />
              </label>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h1 className="font-serif text-2xl mb-1 text-slate-900 dark:text-slate-100">Personalize</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Step 3 of 3</p>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2 dark:text-slate-400">Preferred theme</p>
                <div className="flex gap-2">{["Light", "Dark", "System"].map((t) => <button key={t} type="button" className="flex-1 border border-slate-200 dark:border-slate-700 dark:text-slate-300 rounded-lg py-2 hover:border-teal-600">{t}</button>)}</div>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-3 mt-6">
          {step > 1 && <button onClick={() => setStep(step - 1)} className="flex-1 border border-slate-200 dark:border-slate-700 dark:text-slate-300 py-2.5 rounded-lg text-sm font-medium">Back</button>}
          {step < 3 ? (
            <button onClick={next} className="flex-1 bg-teal-700 hover:bg-teal-800 text-white py-2.5 rounded-lg text-sm font-medium">Continue</button>
          ) : (
            <button onClick={finish} disabled={loading} className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium">
              {loading ? "Creating…" : "Create Vault"}
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-6">Already have an account? <button onClick={onGoLogin} className="text-teal-700 font-medium">Log in</button></p>
      </div>
    </AuthLayout>
  );
}
