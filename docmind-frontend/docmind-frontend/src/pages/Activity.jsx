import React, { useEffect, useMemo, useState } from "react";
import { Upload, Sparkles, Users, Bell, Star, ShieldCheck, Archive, KeyRound, Activity as ActivityIcon } from "lucide-react";
import { fmtDate } from "../lib/format.js";
import { Spinner, ErrorState } from "../components/ui.jsx";
import { listActivity } from "../api/resources.js";

const ICONS = {
  document_uploaded: Upload,
  document_categorized: Sparkles,
  document_deleted: Archive,
  contact_added: Users,
  contact_updated: Users,
  contact_deleted: Users,
  reminder_created: Bell,
  reminder_completed: Bell,
  login: ShieldCheck,
  logout: ShieldCheck,
  device_removed: ShieldCheck,
  password_changed: KeyRound,
  "2fa_enabled": KeyRound,
  "2fa_disabled": KeyRound,
};

export default function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    listActivity().then((d) => setLogs(d.logs)).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const grouped = useMemo(() => {
    const map = {};
    logs.forEach((a) => {
      const day = new Date(a.createdAt).toDateString();
      (map[day] ||= []).push(a);
    });
    return Object.entries(map);
  }, [logs]);

  return (
    <div className="p-5 md:p-8 max-w-3xl mx-auto">
      <h1 className="font-serif text-2xl text-slate-900 mb-1">Activity History</h1>
      <p className="text-slate-500 text-sm mb-6">A record of what's happened in your vault.</p>

      {loading ? <Spinner label="Loading activity…" /> : error ? <ErrorState message={error} onRetry={load} /> : logs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <ActivityIcon className="text-slate-300 mb-3" size={28} />
          <p className="text-sm text-slate-400">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, items]) => (
            <div key={day}>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">{fmtDate(day)}</p>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
                {items.map((a) => {
                  const Icon = ICONS[a.type] || ActivityIcon;
                  return (
                    <div key={a._id} className="flex items-center gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0"><Icon size={14} /></div>
                      <p className="text-sm text-slate-700 flex-1">{a.description}</p>
                      <span className="text-xs text-slate-400 shrink-0">{new Date(a.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
