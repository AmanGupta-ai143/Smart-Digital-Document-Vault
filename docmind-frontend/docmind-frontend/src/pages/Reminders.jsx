import React, { useEffect, useState } from "react";
import { Bell, Plus, Sparkles, Clock } from "lucide-react";
import { fmtDate, daysUntil } from "../lib/format.js";
import { EmptyState, Spinner, ErrorState } from "../components/ui.jsx";
import { useReminders } from "../hooks/useContactsReminders.js";
import { useToast } from "../context/ToastContext.jsx";
import * as api from "../api/resources.js";

export default function Reminders({ openAddReminder }) {
  const { reminders, loading, error, reload, completeReminder } = useReminders();
  const { showToast } = useToast();
  const [tab, setTab] = useState("upcoming");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => { api.listAiDetectedDates().then(setSuggestions).catch(() => {}); }, [reminders]);

  const createFromSuggestion = async (s) => {
    try {
      await api.createReminder({ title: `${s.label} — ${s.fileName}`, date: s.date, priority: "high", documentId: s.documentId, dateIndex: s.dateIndex, source: "ai_detected" });
      showToast("Reminder created.");
      reload();
      setSuggestions((sg) => sg.filter((x) => x.documentId !== s.documentId || x.dateIndex !== s.dateIndex));
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const filtered = reminders.filter((r) => r.status === tab);

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-slate-900">Reminders & Important Dates</h1>
          <p className="text-slate-500 text-sm mt-1">Never miss a renewal, deadline, or important date.</p>
        </div>
        <button onClick={openAddReminder} className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg self-start">
          <Plus size={15} /> Create Reminder
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Sparkles size={13} /> AI Detected Important Dates</p>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={`${s.documentId}-${s.dateIndex}`} className="bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-700">Potential <strong>{s.label.toLowerCase()}</strong> detected in <strong>{s.fileName}</strong> — {fmtDate(s.date)}</p>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => createFromSuggestion(s)} className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium">Create Reminder</button>
                  <button onClick={() => setSuggestions((sg) => sg.filter((x) => x !== s))} className="text-xs border border-amber-300 text-amber-800 px-3 py-1.5 rounded-lg font-medium">Ignore</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-5">
        {["upcoming", "completed"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium capitalize ${tab === t ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-slate-600"}`}>{t}</button>
        ))}
      </div>

      {loading ? <Spinner label="Loading reminders…" /> : error ? <ErrorState message={error} onRetry={reload} /> : filtered.length === 0 ? (
        <EmptyState icon={Bell} title="Nothing scheduled yet" subtitle="Create a reminder or let DocMind AI help identify important dates." actionLabel="Create Reminder" onAction={openAddReminder} />
      ) : (
        <div className="space-y-2">
          {[...filtered].sort((a, b) => (a.date < b.date ? -1 : 1)).map((r) => (
            <div key={r._id} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${r.priority === "high" ? "bg-rose-50 text-rose-600" : r.priority === "medium" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-500"}`}><Clock size={16} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{r.title}</p>
                <p className="text-xs text-slate-400">{fmtDate(r.date)}{r.status === "upcoming" ? ` · ${daysUntil(r.date) >= 0 ? `${daysUntil(r.date)} days away` : "overdue"}` : ""}</p>
              </div>
              {r.status === "upcoming" && <button onClick={() => completeReminder(r._id)} className="text-xs border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-medium shrink-0">Mark done</button>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
