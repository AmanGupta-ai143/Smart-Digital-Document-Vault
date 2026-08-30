import React, { useState, useEffect, useRef } from "react";
import { Search, X, FileText, Users } from "lucide-react";
import { unifiedSearch } from "../api/resources.js";

export default function SearchPanel({ onClose, openDoc, setPage }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState({ documents: [], contacts: [] });
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults({ documents: [], contacts: [] }); return; }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await unifiedSearch(q);
        setResults(data);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [q]);

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-20 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[70vh] overflow-hidden flex flex-col dark:bg-slate-900">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Search size={17} className="text-slate-400 dark:text-slate-500" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder='Try "college certificates"' className="flex-1 text-sm outline-none py-1 dark:bg-transparent dark:text-slate-100 dark:placeholder-slate-500" />
          <button onClick={onClose} className="p-1 text-slate-400 dark:text-slate-500"><X size={16} /></button>
        </div>
        <div className="overflow-y-auto flex-1">
          {q === "" && <p className="text-sm text-slate-400 text-center py-10 dark:text-slate-500">Start typing to search documents and contacts.</p>}
          {q !== "" && !loading && results.documents.length === 0 && results.contacts.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-10 dark:text-slate-500">No results for "{q}".</p>
          )}
          {results.documents.length > 0 && (
            <div className="p-3">
              <p className="text-xs font-medium text-slate-400 uppercase px-2 mb-1 dark:text-slate-500">Documents</p>
              {results.documents.map((d) => (
                <button key={d._id} onClick={() => { openDoc(d._id); onClose(); }} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-left dark:hover:bg-slate-800/60">
                  <FileText size={15} className="text-teal-700" /><span className="text-sm text-slate-700 dark:text-slate-300">{d.fileName}</span>
                </button>
              ))}
            </div>
          )}
          {results.contacts.length > 0 && (
            <div className="p-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-400 uppercase px-2 mb-1 dark:text-slate-500">Contacts</p>
              {results.contacts.map((c) => (
                <button key={c._id} onClick={() => { setPage("contacts"); onClose(); }} className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-left dark:hover:bg-slate-800/60">
                  <Users size={15} className="text-teal-700" /><span className="text-sm text-slate-700 dark:text-slate-300">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
