import React, { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Users, Bell } from "lucide-react";
import { unifiedSearch } from "../api/resources.js";
import { fmtDate } from "../lib/format.js";
import { DOC_CATEGORIES } from "../lib/constants.js";

const TYPE_TABS = [
  { key: "all", label: "All" },
  { key: "documents", label: "Documents" },
  { key: "contacts", label: "Contacts" },
  { key: "reminders", label: "Reminders" },
];

export default function SearchPanel({ onClose, openDoc, setPage }) {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [results, setResults] = useState({ documents: [], contacts: [], reminders: [] });
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults({ documents: [], contacts: [], reminders: [] }); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await unifiedSearch(q, { category: category || undefined, date: date || undefined });
        setResults({ documents: data.documents || [], contacts: data.contacts || [], reminders: data.reminders || [] });
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [q, category, date]);

  // Category/date filters only apply to documents server-side, so once either
  // is set there's no point showing Contacts/Reminders tabs.
  const docsOnlyFilterActive = !!(category || date);

  const showDocs = type === "all" || type === "documents";
  const showContacts = !docsOnlyFilterActive && (type === "all" || type === "contacts");
  const showReminders = !docsOnlyFilterActive && (type === "all" || type === "reminders");
  const noResults = q !== "" && !loading &&
    (!showDocs || results.documents.length === 0) &&
    (!showContacts || results.contacts.length === 0) &&
    (!showReminders || results.reminders.length === 0);

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-20 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[70vh] overflow-hidden flex flex-col dark:bg-slate-900">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search size={17} className="text-slate-400 dark:text-slate-500" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder='Try "college certificates"' className="flex-1 text-sm outline-none py-1 dark:bg-transparent dark:text-slate-100 dark:placeholder-slate-500" />
          <button onClick={onClose} className="p-1 text-slate-400 dark:text-slate-500"><X size={16} /></button>
        </div>
        {q !== "" && (
          <div className="border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 px-4 pt-2 overflow-x-auto">
              {TYPE_TABS.map((t) => (
                <button key={t.key} disabled={docsOnlyFilterActive && t.key !== "all" && t.key !== "documents"} onClick={() => setType(t.key)} className={`text-xs px-2.5 py-1 rounded-full whitespace-nowrap disabled:opacity-40 ${type === t.key ? "bg-slate-900 dark:bg-teal-700 text-white" : "border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}>{t.label}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-4 py-2">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none dark:bg-slate-800 dark:text-slate-300">
                <option value="">All categories</option>
                {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={date} onChange={(e) => setDate(e.target.value)} className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 outline-none dark:bg-slate-800 dark:text-slate-300">
                <option value="">Any date</option>
                <option value="recent">Recent (30 days)</option>
                <option value="older">Older</option>
              </select>
              {(category || date) && (
                <button onClick={() => { setCategory(""); setDate(""); }} className="text-xs text-teal-700 dark:text-teal-400 font-medium">Clear</button>
              )}
            </div>
          </div>
        )}
        <div className="overflow-y-auto flex-1">
          {q === "" && <p className="text-sm text-slate-400 text-center py-10 dark:text-slate-500">Start typing to search documents, contacts, and reminders.</p>}
          {noResults && <p className="text-sm text-slate-400 text-center py-10 dark:text-slate-500">No results for "{q}".</p>}
          {showDocs && results.documents.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-medium text-slate-400 uppercase px-2 mb-1 dark:text-slate-500">Documents</p>
              {results.documents.map((d) => (
                <button key={d._id} onClick={() => { openDoc(d._id); onClose(); }} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-left dark:hover:bg-slate-800/60">
                  <FileText size={15} className="text-teal-700" /><span className="text-sm text-slate-700 dark:text-slate-300">{d.fileName}</span>
                </button>
              ))}
            </div>
          )}
          {showContacts && results.contacts.length > 0 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-400 uppercase px-2 mb-1 dark:text-slate-500">Contacts</p>
              {results.contacts.map((c) => (
                <button key={c._id} onClick={() => { setPage("contacts"); onClose(); }} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-left dark:hover:bg-slate-800/60">
                  <Users size={15} className="text-teal-700" /><span className="text-sm text-slate-700 dark:text-slate-300">{c.name}</span>
                </button>
              ))}
            </div>
          )}
          {showReminders && results.reminders.length > 0 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-400 uppercase px-2 mb-1 dark:text-slate-500">Reminders</p>
              {results.reminders.map((r) => (
                <button key={r._id} onClick={() => { setPage("reminders"); onClose(); }} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-left dark:hover:bg-slate-800/60">
                  <Bell size={15} className="text-teal-700" /><span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{r.title}</span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{fmtDate(r.date)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
