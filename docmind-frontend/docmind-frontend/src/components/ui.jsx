import React from "react";
import { X, CheckCircle2, AlertTriangle } from "lucide-react";

export function Seal({ size = 40, tone = "teal", children }) {
  const tones = {
    teal: "bg-teal-700 ring-teal-200",
    amber: "bg-amber-600 ring-amber-200",
    slate: "bg-slate-700 ring-slate-200",
  };
  return (
    <div className={`rounded-full ring-4 flex items-center justify-center text-white font-serif shrink-0 ${tones[tone]}`} style={{ width: size, height: size }}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    teal: "bg-teal-50 text-teal-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${tones[tone]}`}>{children}</span>;
}

export function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-3xl" : "max-w-md"} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-serif text-lg text-slate-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, actionLabel, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mb-4 ring-8 ring-teal-50/50">
        <Icon className="text-teal-700" size={26} />
      </div>
      <h3 className="font-serif text-lg text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-5">{subtitle}</p>
      {actionLabel && (
        <button onClick={onAction} className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-lg transition-colors">
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function Spinner({ label = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="w-6 h-6 rounded-full border-2 border-teal-600 border-t-transparent animate-spin mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <AlertTriangle className="text-rose-500 mb-3" size={24} />
      <p className="text-sm text-slate-600 mb-4 max-w-sm">{message || "Something went wrong. Please try again."}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm font-medium border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg">
          Try Again
        </button>
      )}
    </div>
  );
}

export function InlineSuccess({ children }) {
  return (
    <span className="text-xs text-teal-700 font-medium flex items-center gap-1">
      <CheckCircle2 size={12} /> {children}
    </span>
  );
}
