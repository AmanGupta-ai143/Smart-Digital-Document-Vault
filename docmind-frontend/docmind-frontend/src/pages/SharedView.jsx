import React, { useEffect, useState } from "react";
import { FileText, Download, ExternalLink, Lock, Clock } from "lucide-react";
import { API_BASE } from "../api/client.js";
import { Seal } from "../components/ui.jsx";

const isPhone = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

export default function SharedView({ token }) {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    fetch(`${API_BASE}/share/${token}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        setState(r.ok ? { status: "ok", info: data } : { status: "gone", message: data.message });
      })
      .catch(() => setState({ status: "gone", message: "Could not reach DocMind AI. Please try again." }));
  }, [token]);

  const fileUrl = `${API_BASE}/share/${token}/file`;
  const info = state.info;
  const isImage = info && ["jpg", "png"].includes(info.fileType);
  const isPdf = info && info.fileType === "pdf";

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      <header className="max-w-3xl mx-auto flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <Seal size={34}><FileText size={16} /></Seal>
          <span className="font-serif text-lg">DocMind AI</span>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><Lock size={13} /> Shared securely</span>
      </header>

      <main className="max-w-3xl mx-auto px-5 pb-12">
        {state.status === "loading" && <p className="text-center text-slate-500 py-20">Opening shared document…</p>}

        {state.status === "gone" && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 text-center mt-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mb-4"><Clock size={24} /></div>
            <h1 className="font-serif text-2xl mb-2">Link unavailable</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{state.message || "This link has expired or was removed by its owner."}</p>
          </div>
        )}

        {state.status === "ok" && (
          <>
            <h1 className="font-serif text-2xl break-words mb-1">{info.fileName}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              {info.sharedBy ? `Shared by ${info.sharedBy} · ` : ""}available until {new Date(info.expiresAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              <a href={fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-teal-700 hover:bg-teal-800 text-white px-5 py-3 rounded-lg font-medium text-sm"><ExternalLink size={16} /> Open</a>
              <a href={`${fileUrl}?download=1`} className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 px-5 py-3 rounded-lg font-medium text-sm"><Download size={16} /> Download</a>
            </div>

            {isImage && <img src={fileUrl} alt={info.fileName} className="w-full rounded-xl border border-slate-200 dark:border-slate-700" />}
            {isPdf && !isPhone && <iframe src={fileUrl} title={info.fileName} className="w-full h-[70vh] rounded-xl border border-slate-200 dark:border-slate-700 bg-white" />}
            {isPdf && isPhone && <p className="text-xs text-slate-400">Tap Open to read the PDF in your phone's viewer.</p>}
          </>
        )}

        <p className="text-center text-xs text-slate-400 mt-10">Shared with DocMind AI — a personal vault, not a public archive.</p>
      </main>
    </div>
  );
}
