import React, { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Star, BadgeCheck, Download, Archive, Bot, FileText } from "lucide-react";
import { CATEGORY_META, FILE_ICON } from "../lib/constants.js";
import { fmtDate, fmtBytes } from "../lib/format.js";
import { Badge, Spinner, ErrorState } from "../components/ui.jsx";
import * as docsApi from "../api/documents.js";
import { useToast } from "../context/ToastContext.jsx";

export default function DocumentDetail({ docId, onBack, setPage, setAssistantDoc }) {
  const { showToast } = useToast();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");

  const load = () => {
    setLoading(true);
    setError(null);
    docsApi.getDocument(docId).then(setDoc).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(load, [docId]);

  const update = async (patch) => {
    setDoc((d) => ({ ...d, ...patch }));
    try {
      await docsApi.updateDocument(docId, patch);
    } catch (e) {
      showToast(e.message, "error");
      load();
    }
  };

  const confirmDate = async (index, confirmed) => {
    try {
      const updated = await docsApi.confirmDetectedDate(docId, index, confirmed);
      setDoc(updated);
      showToast(confirmed ? "Reminder confirmed." : "Date ignored.");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  if (loading) return <div className="p-8"><Spinner label="Loading document…" /></div>;
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={load} /></div>;
  if (!doc) return null;

  const meta = CATEGORY_META[doc.category] || CATEGORY_META.Other;
  const FIcon = FILE_ICON[doc.fileType] || FileText;

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5"><ArrowLeft size={15} /> Back</button>

      <div className="grid md:grid-cols-5 gap-6">
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center h-72 md:h-full">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${meta.bg}`}><FIcon size={28} className={meta.color} /></div>
          <p className="text-sm font-medium text-slate-800 px-2">{doc.fileName}</p>
          <p className="text-xs text-slate-400 mt-1">{doc.fileType?.toUpperCase()} · {fmtBytes(doc.fileSizeBytes)}</p>
          <a href={doc.cloudFileUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-700 font-medium mt-4">Open original file</a>
        </div>

        <div className="md:col-span-3">
          <h1 className="font-serif text-xl text-slate-900 leading-snug pr-4 mb-1">{doc.fileName}</h1>
          <div className="flex items-center gap-2 mb-5">
            <Badge tone="slate">{doc.category}</Badge>
            {doc.isImportant && <Badge tone="amber">Important</Badge>}
            <span className="text-xs text-slate-400">Uploaded {fmtDate(doc.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1 border-b border-slate-200 mb-5">
            {["overview", "details", "chat"].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm font-medium capitalize border-b-2 -mb-px ${tab === t ? "border-teal-700 text-teal-800" : "border-transparent text-slate-500"}`}>
                {t === "chat" ? "AI Chat" : t}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="space-y-5">
              {doc.aiProcessingStatus === "processing" && <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">AI analysis is still processing — refresh in a moment.</p>}
              {doc.aiProcessingStatus === "failed" && <p className="text-sm text-rose-700 bg-rose-50 rounded-lg px-3 py-2">AI analysis failed for this document. You can still edit it manually.</p>}
              {doc.aiSummary && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Sparkles size={12} className="text-teal-600" /> AI Summary</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{doc.aiSummary}</p>
                </div>
              )}
              {doc.aiKeyPoints?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Key Points</p>
                  <ul className="space-y-1.5">
                    {doc.aiKeyPoints.map((k, i) => <li key={i} className="text-sm text-slate-700 flex items-start gap-2"><span className="w-1 h-1 rounded-full bg-teal-600 mt-2 shrink-0" />{k}</li>)}
                  </ul>
                </div>
              )}
              {(doc.tags?.length > 0 || doc.aiTags?.length > 0) && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[...(doc.tags || []), ...(doc.aiTags || [])].map((t) => <Badge key={t} tone="teal">#{t}</Badge>)}
                  </div>
                </div>
              )}
              {doc.aiDetectedDates?.filter((d) => !d.confirmed).map((d, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-1">AI-detected date</p>
                  <p className="text-sm text-slate-700 mb-3">{d.label}: <strong>{fmtDate(d.date)}</strong></p>
                  <div className="flex gap-2">
                    <button onClick={() => confirmDate(i, true)} className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium">Create Reminder</button>
                    <button onClick={() => confirmDate(i, false)} className="text-xs border border-amber-300 text-amber-800 px-3 py-1.5 rounded-lg font-medium">Ignore</button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-400 italic">Review AI-extracted information before relying on it.</p>
            </div>
          )}

          {tab === "details" && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[["File type", doc.fileType?.toUpperCase()], ["File size", fmtBytes(doc.fileSizeBytes)], ["Category", doc.category], ["Uploaded", fmtDate(doc.createdAt)], ["Storage", "Cloud vault"], ["Status", "Encrypted"]].map(([k, v]) => (
                <div key={k} className="border border-slate-100 rounded-lg p-3"><p className="text-xs text-slate-400">{k}</p><p className="font-medium text-slate-800">{v}</p></div>
              ))}
            </div>
          )}

          {tab === "chat" && (
            <div className="text-center py-8">
              <Bot size={28} className="text-teal-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4">Ask questions about this specific document.</p>
              <button onClick={() => { setAssistantDoc(doc._id); setPage("assistant"); }} className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg">Ask DocMind AI About This Document</button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-8 pt-5 border-t border-slate-100">
            <button onClick={() => update({ isFavorite: !doc.isFavorite })} className="flex items-center gap-1.5 text-sm border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg">
              <Star size={14} className={doc.isFavorite ? "text-amber-500 fill-amber-500" : ""} /> {doc.isFavorite ? "Favorited" : "Favorite"}
            </button>
            <button onClick={() => update({ isImportant: !doc.isImportant })} className="flex items-center gap-1.5 text-sm border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg">
              <BadgeCheck size={14} /> {doc.isImportant ? "Marked Important" : "Mark Important"}
            </button>
            <a href={doc.cloudFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg"><Download size={14} /> Download</a>
            <button onClick={() => update({ isArchived: !doc.isArchived })} className="flex items-center gap-1.5 text-sm border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg">
              <Archive size={14} /> {doc.isArchived ? "Unarchive" : "Archive"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
