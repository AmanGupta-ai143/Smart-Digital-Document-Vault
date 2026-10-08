import React, { useState } from "react";
import { FileText, Upload, Search, Filter, Grid3x3, List as ListIcon, Rows3, Star, Sparkles, AlertTriangle, Bot, Trash2, RotateCcw, XCircle } from "lucide-react";
import { CATEGORY_META, FILE_ICON, DOC_CATEGORIES } from "../lib/constants.js";
import { fmtDate, fmtBytes, daysUntil } from "../lib/format.js";
import { Badge, EmptyState, Spinner, ErrorState, Modal } from "../components/ui.jsx";
import { useDocuments } from "../hooks/useDocuments.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { emptyRecycleBin } from "../api/documents.js";

function nextExpiry(doc) {
  const dates = (doc.aiDetectedDates || []).filter((d) => d.date && daysUntil(d.date) >= -1);
  if (!dates.length) return null;
  return dates.reduce((soonest, d) => (daysUntil(d.date) < daysUntil(soonest.date) ? d : soonest));
}

function DocumentCard({ doc, view, onOpen, onToggleFavorite, onAskAI }) {
  const meta = CATEGORY_META[doc.category] || CATEGORY_META.Other;
  const FIcon = FILE_ICON[doc.fileType] || FileText;
  const expiry = nextExpiry(doc);
  const tags = (doc.tags && doc.tags.length ? doc.tags : doc.aiTags) || [];

  if (view === "compact") {
    // Denser than list: one slim row, minimal padding, no per-row card border —
    // rows are visually separated by a top-level divider instead.
    return (
      <button onClick={() => onOpen(doc._id)} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
        <FIcon size={14} className={`shrink-0 ${meta.color}`} />
        <span className="text-sm text-slate-800 dark:text-slate-200 truncate flex-1">{doc.fileName}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">{doc.category}</span>
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 w-20 text-right">{fmtDate(doc.createdAt)}</span>
        {doc.isImportant && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
      </button>
    );
  }

  if (view === "list") {
    return (
      <button onClick={() => onOpen(doc._id)} className="w-full flex items-center gap-3 bg-white border border-slate-200 hover:border-teal-300 rounded-lg px-4 py-3 text-left transition-colors dark:bg-slate-900 dark:border-slate-700">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}><FIcon size={16} className={meta.color} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800 truncate dark:text-slate-200">{doc.fileName}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{doc.category} · {fmtDate(doc.createdAt)} · {fmtBytes(doc.fileSizeBytes)}</p>
        </div>
        {expiry && <span className="text-[11px] text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded-full shrink-0 dark:bg-amber-900/30 dark:text-amber-400">⚠ {fmtDate(expiry.date)}</span>}
        {doc.isImportant && <Star size={15} className="text-amber-500 fill-amber-500 shrink-0" />}
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 hover:shadow-md hover:border-teal-200 rounded-xl overflow-hidden transition-all dark:bg-slate-900 dark:border-slate-700">
      <div className={`h-1.5 ${meta.bg}`} />
      <div className="p-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpen(doc._id)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(doc._id); } }}
          className="w-full text-left cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 rounded-lg"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.bg}`}><FIcon size={18} className={meta.color} /></div>
            <button type="button" onClick={(e) => { e.stopPropagation(); onToggleFavorite(doc); }} aria-label={doc.isFavorite ? "Remove from favorites" : "Add to favorites"} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">
              <Star size={15} className={doc.isFavorite ? "text-amber-500 fill-amber-500" : "text-slate-300"} />
            </button>
          </div>
          <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2 mb-1.5 dark:text-slate-200">{doc.fileName}</p>
          <p className="text-xs text-slate-400 mb-2 dark:text-slate-500">{fmtDate(doc.createdAt)} · {fmtBytes(doc.fileSizeBytes)}</p>
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <Badge tone="slate">{doc.category}</Badge>
            {tags.slice(0, 2).map((t) => (
              <span key={t} className="text-[11px] text-slate-500 dark:text-slate-400">#{t}</span>
            ))}
          </div>
          {expiry && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 mb-3">
              <AlertTriangle size={11} /> Expires {fmtDate(expiry.date)}
            </p>
          )}
          {doc.aiSummary && <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1"><Sparkles size={11} /> AI ready</span>}
        </div>
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={() => onOpen(doc._id)} className="flex-1 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">Open</button>
          <button onClick={() => onAskAI(doc)} className="flex-1 text-xs font-medium text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900 rounded-lg py-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/30 flex items-center justify-center gap-1">
            <Bot size={12} /> Ask AI
          </button>
        </div>
      </div>
    </div>
  );
}

function TrashRow({ doc, onRestore, onPermanentDelete }) {
  const meta = CATEGORY_META[doc.category] || CATEGORY_META.Other;
  const FIcon = FILE_ICON[doc.fileType] || FileText;
  return (
    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg px-4 py-3 dark:bg-slate-900 dark:border-slate-700">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}><FIcon size={16} className={meta.color} /></div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate dark:text-slate-200">{doc.fileName}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Deleted {doc.deletedAt ? fmtDate(doc.deletedAt) : ""}</p>
      </div>
      <button onClick={() => onRestore(doc)} className="flex items-center gap-1 text-xs font-medium text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-900 rounded-lg px-3 py-1.5 hover:bg-teal-50 dark:hover:bg-teal-900/30 shrink-0">
        <RotateCcw size={12} /> Restore
      </button>
      <button onClick={() => onPermanentDelete(doc)} className="flex items-center gap-1 text-xs font-medium text-rose-600 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-900/20 shrink-0">
        <XCircle size={12} /> Delete Permanently
      </button>
    </div>
  );
}

const VALID_VIEWS = ["grid", "list", "compact"];

export default function MyDocuments({ openDoc, openUpload, setPage, setAssistantDoc }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState("all");
  // Seed from the user's saved Settings > Document Preferences > Default view,
  // falling back to grid if they've never set one.
  const [view, setView] = useState(() =>
    VALID_VIEWS.includes(user?.preferences?.defaultDocumentView) ? user.preferences.defaultDocumentView : "grid"
  );
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { type: "one" | "all", doc? }

  const filters = {
    archived: tab === "archived" ? "true" : "false",
    deleted: tab === "trash" ? "true" : undefined,
    important: tab === "important" ? "true" : undefined,
    favorite: tab === "favorites" ? "true" : undefined,
    category: category || undefined,
    q: query || undefined,
    sort: tab === "recent" ? "recent" : undefined,
  };

  const { documents, loading, error, reload, toggleFavorite, moveToTrash, restoreDocument, permanentlyDelete } = useDocuments(filters);

  const askAI = (doc) => {
    setAssistantDoc?.(doc._id);
    setPage?.("assistant");
  };

  const confirmPermanentDelete = async () => {
    if (confirmTarget?.type === "one") {
      await permanentlyDelete(confirmTarget.doc);
      showToast("Document permanently deleted.");
    } else if (confirmTarget?.type === "all") {
      try {
        const res = await emptyRecycleBin();
        showToast(`Recycle bin emptied (${res.count} document${res.count === 1 ? "" : "s"}).`);
        reload();
      } catch (err) {
        showToast(err.message, "error");
      }
    }
    setConfirmTarget(null);
  };

  const tabs = [
    { key: "all", label: "All Documents" },
    { key: "recent", label: "Recent" },
    { key: "important", label: "Important" },
    { key: "favorites", label: "Favorites" },
    { key: "archived", label: "Archived" },
    { key: "trash", label: "Recycle Bin" },
  ];

  const viewButtons = [
    { key: "grid", icon: Grid3x3 },
    { key: "list", icon: ListIcon },
    { key: "compact", icon: Rows3 },
  ];

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-slate-900 dark:text-slate-100">My Documents</h1>
          <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Organize, search, and manage everything in one place.</p>
        </div>
        {tab === "trash" ? (
          documents.length > 0 && (
            <button onClick={() => setConfirmTarget({ type: "all" })} className="flex items-center gap-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 text-sm font-medium px-4 py-2.5 rounded-lg self-start transition-colors">
              <Trash2 size={15} /> Empty Recycle Bin
            </button>
          )
        ) : (
          <button onClick={openUpload} className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg self-start transition-colors">
            <Upload size={15} /> Upload Document
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-slate-900 dark:bg-teal-700 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl md:rounded-lg px-3 h-12 md:h-auto md:py-2 flex-1 min-w-[200px] dark:bg-slate-900 dark:border-slate-700">
          <Search size={15} className="text-slate-400 dark:text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this list…" className="text-sm outline-none flex-1 dark:bg-transparent dark:text-slate-100 dark:placeholder-slate-500" />
        </div>
        <button onClick={() => setShowFilters((s) => !s)} className="flex items-center gap-1.5 border border-slate-200 bg-white rounded-xl md:rounded-lg px-4 h-12 md:h-auto md:px-3 md:py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 touch-manipulation">
          <Filter size={16} /> Filter
        </button>
        <div className="flex border border-slate-200 rounded-xl overflow-hidden dark:border-slate-700">
          {viewButtons.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              title={key[0].toUpperCase() + key.slice(1) + " view"}
              aria-label={key[0].toUpperCase() + key.slice(1) + " view"}
              className={`w-14 h-12 md:w-10 md:h-10 flex items-center justify-center touch-manipulation ${view === key ? "bg-slate-900 dark:bg-teal-700 text-white" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400"}`}
            >
              <Icon size={22} className="md:w-[15px] md:h-[15px]" />
            </button>
          ))}
        </div>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <button onClick={() => setCategory("")} className={`text-xs px-2.5 py-1 rounded-full border ${category === "" ? "bg-teal-700 text-white border-teal-700" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}>All</button>
          {DOC_CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`text-xs px-2.5 py-1 rounded-full border ${category === c ? "bg-teal-700 text-white border-teal-700" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}>{c}</button>
          ))}
        </div>
      )}

      {loading ? (
        <Spinner label="Loading documents…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : documents.length === 0 ? (
        tab === "trash" ? (
          <EmptyState icon={Trash2} title="Recycle bin is empty" subtitle="Deleted documents will appear here before they're permanently removed." />
        ) : (
          <EmptyState icon={FileText} title="No documents here yet" subtitle="Try a different filter, or upload your first document and let DocMind AI organize it." actionLabel="Upload Document" onAction={openUpload} />
        )
      ) : tab === "trash" ? (
        <div className="space-y-2">
          {documents.map((d) => (
            <TrashRow key={d._id} doc={d} onRestore={restoreDocument} onPermanentDelete={(doc) => setConfirmTarget({ type: "one", doc })} />
          ))}
        </div>
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((d) => <DocumentCard key={d._id} doc={d} view="grid" onOpen={openDoc} onToggleFavorite={toggleFavorite} onAskAI={askAI} />)}
        </div>
      ) : view === "compact" ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
          {documents.map((d) => <DocumentCard key={d._id} doc={d} view="compact" onOpen={openDoc} onToggleFavorite={toggleFavorite} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => <DocumentCard key={d._id} doc={d} view="list" onOpen={openDoc} onToggleFavorite={toggleFavorite} />)}
        </div>
      )}

      {confirmTarget && (
        <Modal title={confirmTarget.type === "all" ? "Empty recycle bin?" : "Delete permanently?"} onClose={() => setConfirmTarget(null)}>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
            {confirmTarget.type === "all"
              ? `This will permanently delete all ${documents.length} document${documents.length === 1 ? "" : "s"} in your recycle bin. This can't be undone.`
              : `"${confirmTarget.doc.fileName}" will be permanently deleted. This can't be undone.`}
          </p>
          <div className="flex justify-end gap-2">
            <button onClick={() => setConfirmTarget(null)} className="text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2">Cancel</button>
            <button onClick={confirmPermanentDelete} className="text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg px-4 py-2">Delete Permanently</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
