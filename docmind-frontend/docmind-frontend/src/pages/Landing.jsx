import React from "react";
import { FileText, Sparkles, Search, Bot, RefreshCcw, Users, ShieldCheck, Phone } from "lucide-react";
import { Seal } from "../components/ui.jsx";

export default function Landing({ onGetStarted, onLogin }) {
  const features = [
    { icon: Sparkles, title: "AI Document Organization", desc: "Every upload is auto-categorized, summarized, and tagged." },
    { icon: Search, title: "Smart Search", desc: "Search in plain language — \"show my college certificates.\"" },
    { icon: Bot, title: "Ask Your Documents", desc: "Chat with an AI that reads your files and answers questions." },
    { icon: RefreshCcw, title: "Cloud Access", desc: "Open your vault from any authorized phone or laptop." },
    { icon: Users, title: "Important Contacts", desc: "Keep the people who matter one tap away." },
    { icon: ShieldCheck, title: "Security Controls", desc: "Device sessions, 2FA, and full login history." },
  ];
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-slate-900">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <Seal size={36}><FileText size={17} /></Seal>
          <span className="font-serif text-xl">DocMind AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2">Log in</button>
          <button onClick={onGetStarted} className="text-sm font-medium bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg transition-colors">Get Started</button>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-12 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-xs font-medium tracking-wide uppercase text-teal-700 bg-teal-50 px-3 py-1 rounded-full mb-5">Your documents, organized by AI</span>
          <h1 className="font-serif text-4xl md:text-5xl leading-[1.1] mb-5">Your personal, AI-powered digital vault</h1>
          <p className="text-slate-600 text-lg mb-8 max-w-md">Securely store documents and contacts, let AI organize and summarize everything, and reach your vault from any authorized device.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={onGetStarted} className="bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-lg font-medium transition-colors">Get Started</button>
            <a href="#features" className="border border-slate-300 hover:border-slate-400 text-slate-700 px-6 py-3 rounded-lg font-medium transition-colors">Explore Features</a>
          </div>
          <p className="text-xs text-slate-400 mt-6">Protected by encrypted sessions and per-device authorization.</p>
        </div>
        <div className="relative">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 -rotate-2">
            <div className="flex items-center gap-2 mb-4">
              <Seal size={28} tone="amber"><ShieldCheck size={14} /></Seal>
              <div>
                <p className="text-sm font-medium">Health_Insurance_Policy.pdf</p>
                <p className="text-xs text-slate-400">Uploaded · AI summary ready</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed border-l-2 border-teal-200 pl-3">Individual health insurance policy covering hospitalization up to ₹5,00,000 — renewal due soon.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-4 mt-4 ml-10 rotate-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-serif">RV</div>
              <div>
                <p className="text-sm font-medium">Rakesh Verma</p>
                <p className="text-xs text-slate-400">Emergency contact · Father</p>
              </div>
              <Phone size={16} className="ml-auto text-teal-700" />
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200">
        <h2 className="font-serif text-2xl mb-10 text-center">Everything your vault needs</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-3">
                <f.icon size={18} className="text-teal-700" />
              </div>
              <h3 className="font-medium mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        © 2026 DocMind AI — a personal vault, not a public archive.
      </footer>
    </div>
  );
}
