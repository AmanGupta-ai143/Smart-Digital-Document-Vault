import React, { useEffect, useState } from "react";
import { ArrowLeft, Sparkles, Star, BadgeCheck, Download, Archive, Bot, FileText, Trash2 } from "lucide-react";
import { CATEGORY_META, FILE_ICON } from "../lib/constants.js";
import { fmtDate, fmtBytes } from "../lib/format.js";
import { Badge, Spinner, ErrorState, Modal } from "../components/ui.jsx";
import PdfViewer from "../components/PdfViewer.jsx";
import * as docsApi from "../api/documents.js";
import { useToast } from "../context/ToastContext.jsx";

export default function DocumentDetail({ docId, onBack, setPage, setAssistantDoc }) {
  const { showToast } = useToast();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagInput, setTagInput] = useState("");

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

  const moveToTrash = async () => {
    try {
      await docsApi.deleteDocument(docId);
      showToast("Document moved to recycle bin.");
      onBack();
    } catch (e) {
      showToast(e.message, "error");
    }
    setConfirmDelete(false);
  };

  if (loading) return <div className="p-8"><Spinner label="Loading document…" /></div>;
  if (error) return <div className="p-8"><ErrorState message={error} onRetry={load} /></div>;
  if (!doc) return null;

  const meta = CATEGORY_META[doc.category] || CATEGORY_META.Other;
  const FIcon = FILE_ICON[doc.fileType] || FileText;

  return (
    <div className="p-4 sm:p-5 md:p-8 max-w-5xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 dark:text-slate-400 dark:hover:text-slate-200"><ArrowLeft size={15} /> Back</button>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Left column: file preview */}
        <div className="min-w-0 md:col-span-2">
          {doc.fileType === "pdf" ? (
            <PdfViewer url={doc.cloudFileUrl} title={doc.fileName} />
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col items-center justify-center text-center h-72 md:h-full dark:bg-slate-900 dark:border-slate-700">
              {doc.fileType === "jpg" || doc.fileType === "png" ? (
                <img src={doc.cloudFileUrl} alt={doc.fileName} className="w-full h-full object-contain bg-slate-50 dark:bg-slate-800" />
              ) : (
                <div className="p-6 flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${meta.bg}`}><FIcon size={28} className={meta.color} /></div>
                  <p className="text-sm font-medium text-slate-800 px-2 break-all dark:text-slate-200">{doc.fileName}</p>
                  <p className="text-xs text-slate-400 mt-1 dark:text-slate-500">{doc.fileType?.toUpperCase()} · {fmtBytes(doc.fileSizeBytes)}</p>
                  <p className="text-xs text-slate-400 mt-2 dark:text-slate-500">Preview isn't available for this file type.</p>
                  <a href={doc.cloudFileUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-700 font-medium mt-4">Open original file</a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="min-w-0 md:col-span-3">
          <h1 className="font-serif text-xl text-slate-900 leading-snug pr-4 mb-1 break-words dark:text-slate-100">{doc.fileName}</h1>
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <Badge tone="slate">{doc.category}</Badge>
            {doc.isImportant && <Badge tone="amber">Important</Badge>}
            <span className="text-xs text-slate-400 dark:text-slate-500">Uploaded {fmtDate(doc.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1 border-b border-slate-200 mb-5 dark:border-slate-700">
            {["overview", "details", "chat"].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm font-medium capitalize border-b-2 -mb-px ${tab === t ? "border-teal-700 text-teal-800 dark:text-teal-300" : "border-transparent text-slate-500 dark:text-slate-400"}`}>
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
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5 dark:text-slate-500"><Sparkles size={12} className="text-teal-600" /> AI Summary</p>
                  <p className="text-sm text-slate-700 leading-relaxed dark:text-slate-300">{doc.aiSummary}</p>
                </div>
              )}
              {doc.aiKeyPoints?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5 dark:text-slate-500">Key Points</p>
                  <ul className="space-y-1.5">
                    {doc.aiKeyPoints.map((k, i) => <li key={i} className="text-sm text-slate-700 flex items-start gap-2 dark:text-slate-300"><span className="w-1 h-1 rounded-full bg-teal-600 mt-2 shrink-0" />{k}</li>)}
                  </ul>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1.5 dark:text-slate-500">Tags</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(doc.tags || []).map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 text-xs bg-teal-50 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 px-2 py-1 rounded-full">
                      #{t}
                      <button onClick={() => update({ tags: doc.tags.filter((x) => x !== t) })} className="hover:text-rose-600" title="Remove tag">×</button>
                    </span>
                  ))}
                  {(doc.tags || []).length === 0 && <p className="text-xs text-slate-400 dark:text-slate-500">No tags yet.</p>}
                </div>
                <form onSubmit={(e) => { e.preventDefault(); const v = tagInput.trim().toLowerCase(); if (v && !doc.tags?.includes(v)) update({ tags: [...(doc.tags || []), v] }); setTagInput(""); }} className="flex gap-1.5">
                  <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add a tag…" className="flex-1 text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-teal-600 dark:bg-slate-800 dark:text-slate-100" />
                  <button type="submit" className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg font-medium">Add</button>
                </form>
                {doc.aiTags?.filter((t) => !doc.tags?.includes(t)).length > 0 && (
                  <div className="mt-2">
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-1 flex items-center gap-1"><Sparkles size={10} /> AI suggested</p>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.aiTags.filter((t) => !doc.tags?.includes(t)).map((t) => (
                        <button key={t} onClick={() => update({ tags: [...(doc.tags || []), t] })} className="text-xs border border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full hover:border-teal-400 hover:text-teal-700">+ #{t}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {doc.aiDetectedDates?.filter((d) => !d.confirmed).map((d, i) => (
                <div key={i} className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <p className="text-xs font-medium text-amber-800 uppercase tracking-wide mb-1">AI-detected date</p>
                  <p className="text-sm text-slate-700 mb-3 dark:text-slate-300">{d.label}: <strong>{fmtDate(d.date)}</strong></p>
                  <div className="flex gap-2">
                    <button onClick={() => confirmDate(i, true)} className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg font-medium">Create Reminder</button>
                    <button onClick={() => confirmDate(i, false)} className="text-xs border border-amber-300 text-amber-800 px-3 py-1.5 rounded-lg font-medium">Ignore</button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-slate-400 italic dark:text-slate-500">Review AI-extracted information before relying on it.</p>
            </div>
          )}

          {tab === "details" && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[["File type", doc.fileType?.toUpperCase()], ["File size", fmtBytes(doc.fileSizeBytes)], ["Category", doc.category], ["Uploaded", fmtDate(doc.createdAt)], ["Storage", "Cloud vault"], ["AI processing", doc.aiProcessingStatus === "completed" ? "Completed" : doc.aiProcessingStatus === "failed" ? "Failed" : "Processing"]].map(([k, v]) => (
                <div key={k} className="border border-slate-100 rounded-lg p-3 dark:border-slate-800"><p className="text-xs text-slate-400 dark:text-slate-500">{k}</p><p className="font-medium text-slate-800 dark:text-slate-200">{v}</p></div>
              ))}
            </div>
          )}

          {tab === "chat" && (
            <div className="text-center py-8">
              <Bot size={28} className="text-teal-700 mx-auto mb-3" />
              <p className="text-sm text-slate-500 mb-4 dark:text-slate-400">Ask questions about this specific document.</p>
              <button onClick={() => { setAssistantDoc(doc._id); setPage("assistant"); }} className="bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg">Ask DocMind AI About This Document</button>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-8 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button onClick={() => update({ isFavorite: !doc.isFavorite })} className="flex items-center gap-1.5 text-sm border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg dark:border-slate-700 dark:hover:bg-slate-800/60">
              <Star size={14} className={doc.isFavorite ? "text-amber-500 fill-amber-500" : ""} /> {doc.isFavorite ? "Favorited" : "Favorite"}
            </button>
            <button onClick={() => update({ isImportant: !doc.isImportant })} className="flex items-center gap-1.5 text-sm border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg dark:border-slate-700 dark:hover:bg-slate-800/60">
              <BadgeCheck size={14} /> {doc.isImportant ? "Marked Important" : "Mark Important"}
            </button>
            <a href={doc.cloudFileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg dark:border-slate-700 dark:hover:bg-slate-800/60"><Download size={14} /> Download</a>
            <button onClick={() => update({ isArchived: !doc.isArchived })} className="flex items-center gap-1.5 text-sm border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg dark:border-slate-700 dark:hover:bg-slate-800/60">
              <Archive size={14} /> {doc.isArchived ? "Unarchive" : "Archive"}
            </button>
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1.5 text-sm border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-900/20 px-3 py-2 rounded-lg">
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <Modal title="Move to recycle bin?" onClose={() => setConfirmDelete(false)}>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
            "{doc.fileName}" will be moved to the recycle bin. You can restore it later, or delete it permanently from there.
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmDelete(false)} className="text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2">Cancel</button>
            <button onClick={moveToTrash} className="text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg px-4 py-2">Move to Recycle Bin</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
