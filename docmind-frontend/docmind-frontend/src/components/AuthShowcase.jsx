import React from "react";
import { FileText, Award, HeartPulse, Sparkles, Lock, Bell, CheckCircle2 } from "lucide-react";

/**
 * Decorative illustration for the left panel of the login / signup pages.
 * Pure JSX + Tailwind (no image files), so it loads instantly and matches the app's colours.
 */
export default function AuthShowcase() {
  return (
    <div className="relative mx-auto w-full max-w-[440px] h-[420px] select-none" aria-hidden="true">
      {/* soft teal glow behind the cards */}
      <div className="absolute inset-x-6 top-10 bottom-6 rounded-full bg-teal-500/15 blur-3xl" />

      {/* back card: certificate */}
      <div className="absolute left-0 top-4 w-60 -rotate-6 rounded-xl border border-white/10 bg-slate-800/90 p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300"><Award size={20} /></div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-100">Python Certification</p>
            <p className="text-xs text-slate-400">Certificates</p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-300"><CheckCircle2 size={13} /> Stored safely</div>
      </div>

      {/* main card: marksheet */}
      <div className="absolute left-10 top-36 z-10 w-80 rounded-2xl border border-white/10 bg-slate-800 p-5 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/20 text-rose-300"><FileText size={22} /></div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">Semester 5 Marksheet.pdf</p>
            <p className="text-xs text-slate-400">Education · 402 KB</p>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-2 w-full rounded bg-slate-700" />
          <div className="h-2 w-11/12 rounded bg-slate-700" />
          <div className="h-2 w-3/5 rounded bg-slate-700" />
        </div>
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-3 py-1 text-xs font-medium text-teal-300">
          <Sparkles size={13} /> AI summary ready
        </div>
      </div>

      {/* right card: insurance with expiry reminder */}
      <div className="absolute right-0 top-0 w-48 rotate-6 rounded-xl border border-white/10 bg-slate-800/90 p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300"><HeartPulse size={20} /></div>
          <p className="text-sm font-medium text-slate-100 leading-tight">Health Insurance Policy</p>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-300">
          <Bell size={12} /> Renews in 18 days
        </div>
      </div>

      {/* floating pills */}
      <div className="absolute bottom-2 left-0 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200 shadow-lg">
        <Lock size={13} className="text-teal-300" /> Private &amp; encrypted
      </div>
      <div className="absolute bottom-10 right-0 z-20 inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-200 shadow-lg">
        <Sparkles size={13} className="text-teal-300" /> Auto-categorised
      </div>
    </div>
  );
}
