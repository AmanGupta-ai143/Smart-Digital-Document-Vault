import React, { useState, useRef } from "react";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { Modal } from "../components/ui.jsx";
import * as docsApi from "../api/documents.js";

const STAGES = ["Uploading", "Reading document", "Extracting text", "AI analyzing", "Organizing complete"];

export default function UploadModal({ onClose, onComplete }) {
  const [file, setFile] = useState(null);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [stageIndex, setStageIndex] = useState(0); // 0 = idle
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const start = async (selected) => {
    setFile(selected);
    setError(null);
    setStageIndex(1);

    // Visual progress through stages while the real request is in flight —
    // the backend does the actual work synchronously in one call.
    let i = 1;
    timerRef.current = setInterval(() => setStageIndex((s) => Math.min(s + 1, 4)), 900);

    try {
      const doc = await docsApi.uploadDocument(selected, { autoAnalyze });
      clearInterval(timerRef.current);
      setStageIndex(5);
      setTimeout(() => onComplete(doc), 500);
    } catch (err) {
      clearInterval(timerRef.current);
      setError(err.message);
      setStageIndex(0);
    }
  };

  const handleFiles = (files) => {
    if (files && files[0]) start(files[0]);
  };

  return (
    <Modal title="Upload Document" onClose={onClose}>
      {stageIndex === 0 ? (
        <div>
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-700 text-sm rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
            className="border-2 border-dashed border-slate-200 hover:border-teal-400 rounded-xl p-10 text-center cursor-pointer transition-colors dark:border-slate-700"
          >
            <Upload className="mx-auto text-teal-700 mb-3" size={26} />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Drag and drop your file here</p>
            <p className="text-xs text-slate-400 mt-1 dark:text-slate-500">or click to Browse Files</p>
            <p className="text-xs text-slate-300 mt-4">Supports PDF, DOCX, TXT, JPG, PNG — up to 25MB</p>
          </div>
          <input ref={inputRef} type="file" hidden accept=".pdf,.docx,.txt,.jpg,.jpeg,.png" onChange={(e) => handleFiles(e.target.files)} />
          <label className="flex items-center gap-2 text-sm text-slate-600 mt-5 dark:text-slate-400">
            <input type="checkbox" checked={autoAnalyze} onChange={(e) => setAutoAnalyze(e.target.checked)} className="rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-teal-700" />
            Automatically organize this document with AI
          </label>
        </div>
      ) : (
        <div className="py-4">
          <p className="text-sm font-medium text-slate-800 mb-1 truncate dark:text-slate-200">{file?.name}</p>
          <p className="text-xs text-slate-400 mb-6 dark:text-slate-500">{STAGES[Math.min(stageIndex, 5) - 1]}…</p>
          <div className="space-y-3">
            {STAGES.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                {i + 1 < stageIndex ? <CheckCircle2 size={17} className="text-teal-600" /> : i + 1 === stageIndex ? <div className="w-4 h-4 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-200 dark:border-slate-700" />}
                <span className={`text-sm ${i + 1 <= stageIndex ? "text-slate-800 dark:text-slate-200" : "text-slate-300 dark:text-slate-600"}`}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
