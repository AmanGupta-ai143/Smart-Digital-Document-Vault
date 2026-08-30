import React, { useState } from "react";
import { FileText, Upload, Search, Filter, Grid3x3, List as ListIcon, Star, Sparkles } from "lucide-react";
import { CATEGORY_META, FILE_ICON, DOC_CATEGORIES } from "../lib/constants.js";
import { fmtDate, fmtBytes } from "../lib/format.js";
import { Badge, EmptyState, Spinner, ErrorState } from "../components/ui.jsx";
import { useDocuments } from "../hooks/useDocuments.js";

function DocumentCard({ doc, view, onOpen, onToggleFavorite }) {
  const meta = CATEGORY_META[doc.category] || CATEGORY_META.Other;
  const FIcon = FILE_ICON[doc.fileType] || FileText;

  if (view === "list") {
    return (
      <button onClick={() => onOpen(doc._id)} className="w-full flex items-center gap-3 bg-white border border-slate-200 hover:border-teal-300 rounded-lg px-4 py-3 text-left transition-colors dark:bg-slate-900 dark:border-slate-700">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.bg}`}><FIcon size={16} className={meta.color} /></div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-800 truncate dark:text-slate-200">{doc.fileName}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{doc.category} · {fmtDate(doc.createdAt)} · {fmtBytes(doc.fileSizeBytes)}</p>
        </div>
        {doc.isImportant && <Star size={15} className="text-amber-500 fill-amber-500 shrink-0" />}
      </button>
    );
  }

  return (
    <div className="bg-white border border-slate-200 hover:shadow-md hover:border-teal-200 rounded-xl overflow-hidden transition-all dark:bg-slate-900 dark:border-slate-700">
      <div className={`h-1.5 ${meta.bg}`} />
      <button onClick={() => onOpen(doc._id)} className="w-full text-left p-4">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${meta.bg}`}><FIcon size={18} className={meta.color} /></div>
          <span onClick={(e) => { e.stopPropagation(); onToggleFavorite(doc); }} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800">
            <Star size={15} className={doc.isFavorite ? "text-amber-500 fill-amber-500" : "text-slate-300"} />
          </span>
        </div>
        <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-2 mb-1.5 dark:text-slate-200">{doc.fileName}</p>
        <p className="text-xs text-slate-400 mb-3 dark:text-slate-500">{fmtDate(doc.createdAt)} · {fmtBytes(doc.fileSizeBytes)}</p>
        <div className="flex items-center justify-between">
          <Badge tone="slate">{doc.category}</Badge>
          {doc.aiSummary && <span className="text-[11px] text-teal-700 font-medium flex items-center gap-1"><Sparkles size={11} /> AI ready</span>}
        </div>
      </button>
    </div>
  );
}

export default function MyDocuments({ openDoc, openUpload }) {
  const [tab, setTab] = useState("all");
  const [view, setView] = useState("grid");
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filters = {
    archived: tab === "archived" ? "true" : "false",
    important: tab === "important" ? "true" : undefined,
    favorite: tab === "favorites" ? "true" : undefined,
    category: category || undefined,
    q: query || undefined,
    sort: tab === "recent" ? "recent" : undefined,
  };

  const { documents, loading, error, reload, toggleFavorite } = useDocuments(filters);

  const tabs = [
    { key: "all", label: "All Documents" },
    { key: "recent", label: "Recent" },
    { key: "important", label: "Important" },
    { key: "favorites", label: "Favorites" },
    { key: "archived", label: "Archived" },
  ];

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-slate-900 dark:text-slate-100">My Documents</h1>
          <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Organize, search, and manage everything in one place.</p>
        </div>
        <button onClick={openUpload} className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg self-start transition-colors">
          <Upload size={15} /> Upload Document
        </button>
      </div>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-slate-900 dark:bg-teal-700 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-[200px] dark:bg-slate-900 dark:border-slate-700">
          <Search size={15} className="text-slate-400 dark:text-slate-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search this list…" className="text-sm outline-none flex-1 dark:bg-transparent dark:text-slate-100 dark:placeholder-slate-500" />
        </div>
        <button onClick={() => setShowFilters((s) => !s)} className="flex items-center gap-1.5 border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          <Filter size={14} /> Filter
        </button>
        <div className="flex border border-slate-200 rounded-lg overflow-hidden dark:border-slate-700">
          <button onClick={() => setView("grid")} className={`p-2 ${view === "grid" ? "bg-slate-900 dark:bg-teal-700 text-white" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400"}`}><Grid3x3 size={15} /></button>
          <button onClick={() => setView("list")} className={`p-2 ${view === "list" ? "bg-slate-900 dark:bg-teal-700 text-white" : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400"}`}><ListIcon size={15} /></button>
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
        <EmptyState icon={FileText} title="No documents here yet" subtitle="Try a different filter, or upload your first document and let DocMind AI organize it." actionLabel="Upload Document" onAction={openUpload} />
      ) : view === "grid" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((d) => <DocumentCard key={d._id} doc={d} view="grid" onOpen={openDoc} onToggleFavorite={toggleFavorite} />)}
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((d) => <DocumentCard key={d._id} doc={d} view="list" onOpen={openDoc} onToggleFavorite={toggleFavorite} />)}
        </div>
      )}
    </div>
  );
}
