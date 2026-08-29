import React, { useState } from "react";
import { Modal } from "./ui.jsx";
import { CONTACT_CATEGORIES } from "../lib/constants.js";

export default function AddContactModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: "", phoneNumber: "", alternateNumber: "", email: "", category: "Family", notes: "", isFavorite: false, isEmergencyContact: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.name || !form.phoneNumber) { setError("Name and phone number are required."); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Contact" onClose={onClose}>
      {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      <div className="space-y-3">
        <input placeholder="Full name" value={form.name} onChange={(e) => set("name", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Primary phone" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
          <input placeholder="Alternate phone" value={form.alternateNumber} onChange={(e) => set("alternateNumber", e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        </div>
        <input placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
          {CONTACT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        <div className="flex gap-4 text-sm text-slate-600">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFavorite} onChange={(e) => set("isFavorite", e.target.checked)} className="rounded border-slate-300 text-teal-700" /> Favorite</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isEmergencyContact} onChange={(e) => set("isEmergencyContact", e.target.checked)} className="rounded border-slate-300 text-teal-700" /> Emergency contact</label>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-slate-200 py-2.5 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium">
            {saving ? "Saving…" : "Save Contact"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
