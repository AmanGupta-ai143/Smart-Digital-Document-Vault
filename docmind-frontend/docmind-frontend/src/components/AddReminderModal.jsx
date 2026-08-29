import React, { useState } from "react";
import { Modal } from "./ui.jsx";

export default function AddReminderModal({ onClose, onSave, documents = [] }) {
  const [form, setForm] = useState({ title: "", date: "", priority: "medium", documentId: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.title || !form.date) { setError("Title and date are required."); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave({ ...form, documentId: form.documentId || undefined });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create Reminder" onClose={onClose}>
      {error && <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg px-3 py-2 mb-4">{error}</div>}
      <div className="space-y-3">
        <input placeholder="Reminder title" value={form.title} onChange={(e) => set("title", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
        <div className="grid grid-cols-2 gap-3">
          <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600" />
          <select value={form.priority} onChange={(e) => set("priority", e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
            <option value="low">Low priority</option><option value="medium">Medium priority</option><option value="high">High priority</option>
          </select>
        </div>
        <select value={form.documentId} onChange={(e) => set("documentId", e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600">
          <option value="">No related document</option>
          {documents.map((d) => <option key={d._id} value={d._id}>{d.fileName}</option>)}
        </select>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 border border-slate-200 py-2.5 rounded-lg text-sm font-medium">Cancel</button>
          <button onClick={submit} disabled={saving} className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-medium">
            {saving ? "Saving…" : "Save Reminder"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
