import React from "react";
import { Search, FileText, Award, HeartPulse, Briefcase, GraduationCap, Sparkles, Bell, CheckCircle2, Lock } from "lucide-react";

/**
 * Product preview for the left panel of the login / signup pages.
 * Pure JSX + Tailwind (no image files). Shows 2 rows on short screens and 4 on taller ones so it never crowds the heading.
 */
const ROWS = [
  { icon: GraduationCap, tile: "bg-blue-500/15 text-blue-300", name: "Semester 5 Marksheet.pdf", meta: "Education · 402 KB", status: { icon: Sparkles, text: "AI summarised", tone: "bg-teal-500/15 text-teal-300" } },
  { icon: Briefcase, tile: "bg-teal-500/15 text-teal-300", name: "Internship Offer Letter.pdf", meta: "Career · 261 KB", status: { icon: Bell, text: "Due in 9 days", tone: "bg-amber-500/15 text-amber-300" } },
  { icon: HeartPulse, tile: "bg-emerald-500/15 text-emerald-300", name: "Health Insurance Policy.pdf", meta: "Health · 958 KB", status: { icon: Bell, text: "Renews in 18 days", tone: "bg-amber-500/15 text-amber-300" } },
  { icon: Award, tile: "bg-violet-500/15 text-violet-300", name: "Python Certification.pdf", meta: "Certificates · 322 KB", status: { icon: CheckCircle2, text: "Stored", tone: "bg-emerald-500/15 text-emerald-300" } },
];

export default function AuthShowcase() {
  return (
    <div className="hidden [@media(min-height:560px)]:block w-full max-w-lg" aria-hidden="true">
      <div className="relative">
        <div className="absolute -inset-6 rounded-[2rem] bg-teal-500/10 blur-3xl" />
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-800/70 shadow-2xl">
          {/* search bar */}
          <div className="flex items-center gap-3 border-b border-white/5 px-5 py-4">
            <Search size={16} className="text-slate-400" />
            <span className="flex-1 text-sm text-slate-400">Search your documents…</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-2.5 py-1 text-xs font-medium text-teal-300"><Sparkles size={12} /> Ask AI</span>
          </div>

          {/* document rows */}
          <div className="divide-y divide-white/5">
            {ROWS.map((r, i) => (
              <div key={r.name} className={`${i >= 2 ? "hidden [@media(min-height:780px)]:flex" : "flex"} items-center gap-3 px-5 py-3.5`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${r.tile}`}><r.icon size={19} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">{r.name}</p>
                  <p className="text-xs text-slate-400">{r.meta}</p>
                </div>
                <span className={`hidden lg:inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${r.status.tone}`}>
                  <r.status.icon size={12} /> {r.status.text}
                </span>
              </div>
            ))}
          </div>

          {/* footer */}
          <div className="flex items-center gap-2 border-t border-white/5 bg-slate-900/40 px-5 py-3 text-xs text-slate-400">
            <Lock size={13} className="text-teal-300" /> Private storage · Passkey &amp; 2FA protected
          </div>
        </div>
      </div>
    </div>
  );
}
