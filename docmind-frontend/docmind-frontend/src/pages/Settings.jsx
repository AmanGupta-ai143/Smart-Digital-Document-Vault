import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { updatePreferences, getStorage, deleteAccount } from "../api/resources.js";
import { changePassword } from "../api/auth.js";
import { tokenStore } from "../api/client.js";
import { fmtBytes } from "../lib/format.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Settings({ setPage }) {
  const { user, setUser, logout } = useAuth();
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [prefs, setPrefs] = useState(user?.preferences || {});
  const [storage, setStorage] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  // If the account has a theme saved from another device, adopt it once on load
  // (but don't fight the user if they've already picked something on this device).
  useEffect(() => {
    if (user?.preferences?.theme && !localStorage.getItem("docmind_theme")) {
      setTheme(user.preferences.theme);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { getStorage().then(setStorage).catch(() => {}); }, []);

  const save = async (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    try {
      const saved = await updatePreferences(patch);
      setUser((u) => ({ ...u, preferences: saved }));
      showToast("Preference saved.");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    setPwSaving(true);
    try {
      await changePassword(pwForm);
      showToast("Password updated.");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPwSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("This permanently deletes your account. Continue?")) return;
    try {
      await deleteAccount();
      showToast("Account deleted.");
      logout();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/settings/export`, {
        headers: { Authorization: `Bearer ${tokenStore.getAccess()}` },
      });
      if (!res.ok) throw new Error("Export failed. Please try again.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `docmind-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast("Export downloaded.");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const usedPct = storage ? Math.min(100, Math.round((storage.usedBytes / storage.limitBytes) * 100)) : 0;

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-slate-900 mb-1 dark:text-slate-100">Settings</h1>
        <p className="text-slate-500 text-sm dark:text-slate-400">Preferences sync across every authorized device.</p>
      </div>

      <section className="bg-white border border-slate-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-700">
        <h2 className="font-medium text-slate-900 mb-4 dark:text-slate-100">Profile</h2>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-800 text-white flex items-center justify-center font-serif text-lg">
            {(user?.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
          </div>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-700">
        <h2 className="font-medium text-slate-900 mb-4 dark:text-slate-100">Appearance</h2>
        <div className="flex gap-2">
          {["light", "dark", "system"].map((t) => (
            <button
              key={t}
              onClick={() => { setTheme(t); save({ theme: t }); }}
              className={`flex-1 border rounded-lg py-2 text-sm capitalize ${theme === t ? "border-teal-700 bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-700">
        <h2 className="font-medium text-slate-900 mb-4 dark:text-slate-100">Document Preferences</h2>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">Default view</p>
          <div className="flex gap-2">
            {["grid", "list", "compact"].map((v) => (
              <button key={v} onClick={() => save({ defaultDocumentView: v })} className={`text-xs px-3 py-1.5 rounded-lg border capitalize ${prefs.defaultDocumentView === v ? "bg-teal-700 text-white border-teal-700" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}>{v}</button>
            ))}
          </div>
        </div>
        <label className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-400">Automatically analyze uploads with AI</span>
          <input type="checkbox" checked={!!prefs.autoAiAnalysisOnUpload} onChange={(e) => save({ autoAiAnalysisOnUpload: e.target.checked })} className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-teal-700" />
        </label>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-700">
        <h2 className="font-medium text-slate-900 mb-4 dark:text-slate-100">Change Password</h2>
        <form onSubmit={submitPasswordChange} className="space-y-3">
          <input type="password" placeholder="Current password" required value={pwForm.currentPassword} onChange={(e) => setPwForm((f) => ({ ...f, currentPassword: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
          <input type="password" placeholder="New password (min 8 characters)" required minLength={8} value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100" />
          <button type="submit" disabled={pwSaving} className="text-sm bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white px-4 py-2 rounded-lg font-medium">{pwSaving ? "Updating…" : "Update Password"}</button>
        </form>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-700">
        <h2 className="font-medium text-slate-900 mb-4 dark:text-slate-100">Storage</h2>
        {storage ? (
          <>
            <div className="flex justify-between text-xs text-slate-500 mb-1 dark:text-slate-400"><span>{fmtBytes(storage.usedBytes)} used</span><span>{fmtBytes(storage.limitBytes)} total</span></div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800"><div className="h-full bg-teal-600 rounded-full" style={{ width: `${usedPct}%` }} /></div>
          </>
        ) : <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-5 dark:bg-slate-900 dark:border-slate-700">
        <h2 className="font-medium text-slate-900 mb-1 dark:text-slate-100">Security</h2>
        <p className="text-sm text-slate-500 mb-3 dark:text-slate-400">Manage sessions, two-factor authentication, and login activity.</p>
        <button onClick={() => setPage("security")} className="text-sm text-teal-700 font-medium">Go to Security Center →</button>
      </section>

      <section className="bg-white border border-rose-100 rounded-xl p-5 dark:bg-slate-900">
        <h2 className="font-medium text-rose-700 mb-1">Data & Privacy</h2>
        <p className="text-sm text-slate-500 mb-3 dark:text-slate-400">Export your data or permanently delete your account.</p>
        <div className="flex gap-2">
          <button onClick={handleExportData} disabled={exporting} className="text-xs border border-slate-200 px-3 py-2 rounded-lg font-medium disabled:opacity-60 dark:border-slate-700">{exporting ? "Preparing…" : "Export Data"}</button>
          <button onClick={handleDeleteAccount} className="text-xs border border-rose-200 text-rose-600 px-3 py-2 rounded-lg font-medium">Delete Account</button>
        </div>
      </section>
    </div>
  );
}
