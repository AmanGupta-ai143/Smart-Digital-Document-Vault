import React, { useEffect, useState } from "react";
import { FileText, Star, AlertTriangle, HardDrive, Bell, Upload, ScanLine, Bot, PlusCircle, Sparkles, Clock } from "lucide-react";
import { CATEGORY_META, FILE_ICON } from "../lib/constants.js";
import { fmtDate } from "../lib/format.js";
import { Spinner, ErrorState } from "../components/ui.jsx";
import { useDocuments } from "../hooks/useDocuments.js";
import { useReminders } from "../hooks/useContactsReminders.js";
import { getInsights, getStorage, listAiDetectedDates } from "../api/resources.js";
import { useAuth } from "../context/AuthContext.jsx";

const DAY_MS = 24 * 60 * 60 * 1000;

export default function Dashboard({ setPage, openDoc, openUpload }) {
  const { user } = useAuth();
  const { documents, loading: docsLoading, error: docsError, reload, toggleFavorite } = useDocuments({ archived: "false", sort: "recent", limit: 5 });
  const { reminders } = useReminders();
  const [insights, setInsights] = useState(null);
  const [storage, setStorage] = useState(null);
  const [dateSuggestions, setDateSuggestions] = useState([]);

  useEffect(() => {
    getInsights().then(setInsights).catch(() => {});
    getStorage().then(setStorage).catch(() => {});
    listAiDetectedDates().then(setDateSuggestions).catch(() => setDateSuggestions([]));
  }, []);

  const upcoming = reminders.filter((r) => r.status === "upcoming" && new Date(r.date) - Date.now() >= -DAY_MS);
  const overdue = reminders.filter((r) => r.status === "upcoming" && new Date(r.date) - Date.now() < -DAY_MS);

  const expiringSoon = dateSuggestions.filter(
    (s) => s.date && new Date(s.date) - Date.now() <= 30 * DAY_MS && new Date(s.date) - Date.now() >= -DAY_MS
  );

  const storagePct = storage ? Math.min(100, Math.round((storage.usedBytes / storage.limitBytes) * 100)) : 0;
  const storageGb = (bytes) => (bytes / 1024 ** 3).toFixed(1);

  const cards = [
    { label: "Documents", value: documents.length ? `${documents.length}+` : "0", sub: "recently added", icon: FileText, tone: "teal" },
    { label: "Expiring Soon", value: expiringSoon.length, sub: "within 30 days", icon: AlertTriangle, tone: "amber" },
    { label: "Storage", value: storage ? `${storagePct}%` : "—", sub: storage ? `${storageGb(storage.usedBytes)} of ${storageGb(storage.limitBytes)} GB` : "loading…", icon: HardDrive, tone: "slate", progress: storage ? storagePct : null },
    { label: "Reminders", value: upcoming.length, sub: "pending", icon: Bell, tone: "rose" },
  ];

  const actionItems = [
    ...overdue.map((r) => ({ id: `rem-${r._id}`, icon: Clock, tone: "rose", text: `Reminder overdue: ${r.title}`, action: () => setPage("reminders") })),
    ...expiringSoon.map((s) => ({
      id: `date-${s.documentId}-${s.dateIndex}`,
      icon: AlertTriangle,
      tone: "amber",
      text: `${s.fileName} — ${s.label || "important date"} on ${fmtDate(s.date)}`,
      action: () => openDoc(s.documentId),
    })),
  ];

  const firstName = (user?.name || "there").split(" ")[0];

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-serif text-2xl md:text-3xl text-slate-900 dark:text-slate-100">Good morning, {firstName} 👋</h1>
        <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Here's what's happening in your digital vault.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 dark:bg-slate-900 dark:border-slate-700">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
              c.tone === "teal" ? "bg-teal-50 text-teal-700" : c.tone === "amber" ? "bg-amber-50 text-amber-700" : c.tone === "rose" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"
            }`}>
              <c.icon size={17} />
            </div>
            <p className="text-2xl font-serif text-slate-900 dark:text-slate-100">{c.value}</p>
            <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">{c.label} · {c.sub}</p>
            {c.progress !== null && c.progress !== undefined && (
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full ${c.progress > 85 ? "bg-rose-500" : "bg-teal-600"}`} style={{ width: `${c.progress}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {actionItems.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 dark:bg-slate-900 dark:border-amber-900/60">
          <div className="px-5 py-4 border-b border-amber-100 dark:border-amber-900/40">
            <h2 className="font-medium text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" /> Action Required
            </h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {actionItems.slice(0, 4).map((item) => (
              <button key={item.id} onClick={item.action} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 text-left dark:hover:bg-slate-800/60">
                <item.icon size={16} className={item.tone === "rose" ? "text-rose-600" : "text-amber-600"} />
                <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{item.text}</span>
                <span className="text-xs text-teal-700 font-medium">View</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-4 gap-3">
        {[
          { label: "Upload Document", icon: Upload, action: openUpload },
          { label: "Scan Document", icon: ScanLine, action: openUpload },
          { label: "Ask DocMind AI", icon: Bot, action: () => setPage("assistant") },
          { label: "Add Contact", icon: PlusCircle, action: () => setPage("contacts") },
        ].map((a) => (
          <button key={a.label} onClick={a.action} className="bg-white border border-slate-200 hover:border-teal-300 hover:shadow-sm rounded-xl p-4 flex flex-col items-start gap-2 transition-all text-left dark:bg-slate-900 dark:border-slate-700">
            <a.icon size={18} className="text-teal-700" />
            <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-medium text-slate-900 dark:text-slate-100">Recent Documents</h2>
            <button onClick={() => setPage("documents")} className="text-xs text-teal-700 font-medium">View all</button>
          </div>
          {docsLoading ? <Spinner /> : docsError ? <ErrorState message={docsError} onRetry={reload} /> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {documents.map((d) => {
                const meta = CATEGORY_META[d.category] || CATEGORY_META.Other;
                const FIcon = FILE_ICON[d.fileType] || FileText;
                return (
                  <div key={d._id} className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <button onClick={() => openDoc(d._id)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}>
                        <FIcon size={16} className={meta.color} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate dark:text-slate-200">{d.fileName}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{d.category} · {fmtDate(d.createdAt)}</p>
                      </div>
                    </button>
                    {d.aiSummary && <span className="text-[11px] text-teal-700 font-medium bg-teal-50 px-2 py-0.5 rounded-full dark:bg-teal-900/40 shrink-0">AI ready</span>}
                    <button onClick={() => toggleFavorite(d)} className="shrink-0 p-1 -m-1 text-slate-300 hover:text-amber-500 dark:text-slate-600" title={d.isFavorite ? "Remove from favorites" : "Add to favorites"}>
                      <Star size={15} fill={d.isFavorite ? "currentColor" : "none"} className={d.isFavorite ? "text-amber-500" : ""} />
                    </button>
                  </div>
                );
              })}
              {documents.length === 0 && <p className="text-sm text-slate-400 text-center py-10 dark:text-slate-500">No documents yet — upload your first one.</p>}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-medium text-slate-900 dark:text-slate-100">Upcoming Reminders</h2>
              <button onClick={() => setPage("reminders")} className="text-xs text-teal-700 font-medium">View all</button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {upcoming.slice(0, 3).map((r) => (
                <div key={r._id} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{r.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 dark:text-slate-500">{fmtDate(r.date)}</p>
                </div>
              ))}
              {upcoming.length === 0 && <p className="text-sm text-slate-400 text-center py-8 dark:text-slate-500">Nothing scheduled.</p>}
            </div>
          </div>

          <div className="bg-slate-900 text-white rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={16} className="text-teal-400" />
              <p className="text-xs font-medium uppercase tracking-wide text-teal-300">DocMind AI Insight</p>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed mb-4">
              {insights
                ? `You uploaded ${insights.uploadsThisMonth} document${insights.uploadsThisMonth === 1 ? "" : "s"} this month.${insights.byCategory?.[0] ? ` Most are in ${insights.byCategory[0]._id}.` : ""}`
                : "Insights will appear here once you have a few documents uploaded."}
            </p>
            <button onClick={() => setPage("assistant")} className="text-xs font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">Explore Insights</button>
          </div>
        </div>
      </div>
    </div>
  );
}
