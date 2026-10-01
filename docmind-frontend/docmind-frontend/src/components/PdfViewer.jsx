import React, { useEffect, useState } from "react";
import { Maximize2, Minimize2, PanelRight, X, ExternalLink } from "lucide-react";

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