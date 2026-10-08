import React, { useEffect, useState } from "react";
import { Maximize2, Minimize2, PanelRight, X, ExternalLink, FileText } from "lucide-react";

export default function PdfViewer({ url, title = "Document" }) {
  const [mode, setMode] = useState("inline"); // inline | half | full

  // Esc closes the enlarged view, and the page behind stops scrolling while it is open.
  useEffect(() => {
    if (mode === "inline") return;
    const onKey = (e) => e.key === "Escape" && setMode("inline");
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mode]);

  // Phones can't show a PDF inside a page, so they get a clean card with an Open button
  // instead of the browser's cut-off placeholder.
  const isPhone = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isPhone) {
    return (
      <div className="flex flex-col items-center text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-8">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-900/30 flex items-center justify-center mb-4"><FileText size={30} /></div>
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 break-all max-w-full">{title}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 mb-5">PDF document</p>
        <a href={url} target="_blank" rel="noreferrer" className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2">
          <ExternalLink size={16} /> Open PDF
        </a>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">Opens in your phone's PDF viewer.</p>
      </div>
    );
  }

  const frameClass = {
    inline: "h-full rounded-xl",
    half: "fixed top-0 right-0 z-50 h-screen w-full md:w-1/2 shadow-2xl",
    full: "fixed inset-0 z-50",
  }[mode];

  const btn = "p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10";

  return (
    // This outer box keeps its size so the page layout doesn't jump when the viewer is enlarged.
    <div className="h-[32rem] md:h-[40rem]">
      {mode === "half" && (
        <div onClick={() => setMode("inline")} className="fixed inset-0 z-40 bg-black/30" />
      )}

      <div className={`${frameClass} flex flex-col overflow-hidden border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900`}>
        <div className="flex items-center justify-between gap-2 bg-zinc-800 px-3 py-2">
          <p className="truncate text-xs text-slate-200">{title}</p>
          <div className="flex items-center gap-1 shrink-0">
            {mode !== "half" && (
              <button onClick={() => setMode("half")} title="Half screen" className={btn}>
                <PanelRight size={16} />
              </button>
            )}
            {mode !== "full" ? (
              <button onClick={() => setMode("full")} title="Full screen" className={btn}>
                <Maximize2 size={16} />
              </button>
            ) : (
              <button onClick={() => setMode("half")} title="Half screen" className={btn}>
                <Minimize2 size={16} />
              </button>
            )}
            <a href={url} target="_blank" rel="noreferrer" title="Open in new tab" className={btn}>
              <ExternalLink size={16} />
            </a>
            {mode !== "inline" && (
              <button onClick={() => setMode("inline")} title="Close (Esc)" className={btn}>
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <iframe src={url} title={title} className="w-full flex-1 bg-white" />
      </div>
    </div>
  );
}