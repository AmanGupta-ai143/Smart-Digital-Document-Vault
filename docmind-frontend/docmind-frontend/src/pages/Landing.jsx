import React from "react";
import {
  FileText, Sparkles, Search, Bot, Bell, Users, ShieldCheck, Fingerprint, KeyRound, ScanText,
  UploadCloud, Wand2, Clock, Check, ArrowDown, X, ChevronDown, Smartphone,
} from "lucide-react";
import { Seal } from "../components/ui.jsx";

const features = [
  { icon: Sparkles, title: "AI auto-organization", desc: "Every upload is categorized, summarized, and tagged for you." },
  { icon: ScanText, title: "Reads scans & photos", desc: "Text is pulled out of PDFs and images, so every file becomes searchable." },
  { icon: Bell, title: "Expiry reminders", desc: "AI spots important dates and you confirm them as reminders." },
  { icon: Bot, title: "Ask your documents", desc: "Ask in plain language and get answers from your own files." },
  { icon: Search, title: "Smart search", desc: "Find a document by what is inside it, not just its file name." },
  { icon: Users, title: "Important contacts", desc: "Keep the people who matter one tap away, beside your papers." },
];

const steps = [
  { icon: UploadCloud, title: "Upload", desc: "Add a PDF or a photo of any document from your phone or laptop." },
  { icon: Wand2, title: "AI organizes", desc: "DocMind reads it, picks a category, writes a summary, and finds key dates." },
  { icon: Clock, title: "Find & relax", desc: "Search or ask a question, and get reminded before anything expires." },
];

const security = [
  { icon: Fingerprint, title: "Passkey sign-in", desc: "Log in with your fingerprint or face instead of a password." },
  { icon: KeyRound, title: "Two-factor login", desc: "Add an authenticator code as a second lock on your vault." },
  { icon: Smartphone, title: "Device sessions", desc: "See where you are signed in and sign out any device remotely." },
  { icon: ShieldCheck, title: "Full login history", desc: "Every sign-in is logged so you can spot anything unusual." },
];

const faqs = [
  ["Is my data private?", "Your documents belong to your account only. Each request is checked against your login, and the AI assistant only looks at your own files."],
  ["What can I store?", "Anything important: insurance, IDs, bills, warranties, certificates, vehicle papers, and more. PDFs and images are supported."],
  ["How does the AI work?", "After upload, DocMind extracts the text, then an AI model suggests a category, writes a short summary, and picks out important dates."],
  ["Will it remind me before things expire?", "Yes. Dates found in your documents can be saved as reminders, and you will be notified before they arrive."],
  ["Do I need a password?", "No. You can sign in with a passkey, and add two-factor verification for extra protection."],
];

const Card = ({ children, className = "" }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 ${className}`}>{children}</div>
);

export default function Landing({ onGetStarted, onLogin }) {
  const primary = "bg-teal-700 hover:bg-teal-800 text-white px-6 py-3 rounded-lg font-medium transition-colors";
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <Seal size={36}><FileText size={17} /></Seal>
          <span className="font-serif text-xl">DocMind AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onLogin} className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 dark:text-slate-400 dark:hover:text-slate-100">Log in</button>
          <button onClick={onGetStarted} className="text-sm font-medium bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-lg transition-colors">Get started free</button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-50 via-transparent to-transparent dark:from-teal-950/40" />
        <div className="relative max-w-6xl mx-auto px-6 pt-6 pb-14 grid lg:grid-cols-[1.15fr_1fr] gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase text-teal-700 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full mb-4 dark:bg-teal-900/40 dark:border-teal-900"><Sparkles size={12} /> AI-powered document vault</span>
            <h1 className="font-serif text-4xl lg:text-[3.25rem] leading-[1.08] mb-4">Every important paper, <span className="text-teal-700">organized by AI.</span></h1>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-lg mb-6 max-w-lg">Upload once and DocMind files it, summarizes it, and reminds you before anything expires.</p>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={onGetStarted} className="bg-teal-700 hover:bg-teal-800 text-white px-5 py-2.5 rounded-lg font-medium shadow-lg shadow-teal-700/20 transition-colors">Get started free</button>
              <a href="#how" className="inline-flex items-center gap-1.5 px-3 py-2.5 font-medium text-slate-700 dark:text-slate-300 hover:text-teal-700">See how it works <ArrowDown size={16} /></a>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-6 text-xs text-slate-500 dark:text-slate-400">
              {["Free to start", "Passkey sign-in", "Two-factor login"].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><Check size={14} className="text-teal-700" />{t}</span>
              ))}
            </div>
          </div>

          <Card className="w-full max-w-md lg:ml-auto shadow-xl p-5 rotate-1">
            <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 mb-3"><Search size={14} /> Search your documents…</div>
            <div className="flex gap-2 mb-2 text-xs">
              {["All", "Insurance", "Identity", "Bills"].map((c, i) => (
                <span key={c} className={`px-3 py-1 rounded-full ${i === 0 ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{c}</span>
              ))}
            </div>
            {[
              ["Car Insurance", "Expires in 5 days", "amber"],
              ["Aadhaar Card", "Identity", "teal"],
              ["Electricity Bill", "Bills", "teal"],
            ].map(([name, tag, tone]) => (
              <div key={name} className="flex items-center gap-3 py-2.5 border-t border-slate-100 dark:border-slate-800 first:border-0">
                <Seal size={30} tone={tone}><FileText size={14} /></Seal>
                <p className="flex-1 text-sm font-medium">{name}</p>
                <span className={`text-xs ${tone === "amber" ? "text-amber-600" : "text-slate-400 dark:text-slate-500"}`}>{tag}</span>
              </div>
            ))}
          </Card>
        </div>
      </section>

      {/* Problem vs solution */}
      <section className="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-6">
        <Card className="p-7">
          <p className="text-xs uppercase tracking-wide text-rose-600 mb-2">The problem</p>
          <h3 className="font-serif text-2xl mb-4">Your documents are everywhere.</h3>
          {["Buried in chats, emails, and your photo gallery", "Renewals and warranties lapse before you notice", "Hard to find the right file when you need it"].map((t) => (
            <p key={t} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2"><X size={16} className="text-rose-500 shrink-0 mt-0.5" />{t}</p>
          ))}
        </Card>
        <Card className="p-7 border-teal-200 dark:border-teal-900">
          <p className="text-xs uppercase tracking-wide text-teal-700 mb-2">With DocMind</p>
          <h3 className="font-serif text-2xl mb-4">Organization without the effort.</h3>
          {["Upload once and AI sorts and summarizes it", "Reminders for dates that matter", "Ask a question and get the answer from your files"].map((t) => (
            <p key={t} className="flex gap-2 text-sm text-slate-600 dark:text-slate-400 mb-2"><Check size={16} className="text-teal-700 shrink-0 mt-0.5" />{t}</p>
          ))}
        </Card>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="font-serif text-3xl mb-2 text-center">Everything you need to tame the paperwork</h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-10">Powerful AI underneath, simple on the surface.</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card key={f.title} className="p-5 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center mb-3 dark:bg-teal-900/40"><f.icon size={18} className="text-teal-700" /></div>
              <h3 className="font-medium mb-1">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-slate-800">
        <h2 className="font-serif text-3xl mb-10 text-center">Organized in three steps</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={s.title} className="text-center px-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-teal-700 text-white flex items-center justify-center mb-4"><s.icon size={22} /></div>
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Step {i + 1}</p>
              <h3 className="font-serif text-xl mb-1">{s.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI chat demo */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-xs font-medium uppercase tracking-wide text-teal-700">AI assistant</span>
          <h2 className="font-serif text-3xl mt-2 mb-4">Ask your documents anything</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-5">Ask in plain language and get an answer drawn only from your own files, with the source document named.</p>
          {["“When does my health insurance renew?”", "“What is my car policy number?”", "“Show documents that need my attention.”"].map((q) => (
            <p key={q} className="text-sm text-slate-600 dark:text-slate-400 mb-2 flex gap-2"><Check size={16} className="text-teal-700 shrink-0 mt-0.5" />{q}</p>
          ))}
        </div>
        <Card className="p-5 shadow-lg">
          <div className="ml-auto max-w-[80%] bg-teal-700 text-white text-sm rounded-2xl rounded-br-sm px-4 py-2.5 mb-3 w-fit">When does my car insurance expire?</div>
          <div className="bg-slate-50 dark:bg-slate-800 text-sm rounded-2xl rounded-bl-sm px-4 py-3 max-w-[90%]">
            Your car insurance expires on 6 June — that is in 5 days. Want me to set a reminder?
            <p className="mt-2 text-xs text-slate-400 flex items-center gap-1"><FileText size={12} /> Car_Insurance_2025.pdf</p>
          </div>
        </Card>
      </section>

      {/* Security */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-slate-800">
        <h2 className="font-serif text-3xl mb-2 text-center">Built for your most sensitive papers</h2>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-10">Security is part of the foundation, not an add-on.</p>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {security.map((f) => (
            <Card key={f.title} className="p-5">
              <f.icon size={20} className="text-teal-700 mb-3" />
              <h3 className="font-medium mb-1 text-sm">{f.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 py-16">
        <h2 className="font-serif text-3xl mb-8 text-center">Frequently asked questions</h2>
        <div className="space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="group bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4">
              <summary className="flex items-center justify-between cursor-pointer list-none font-medium text-sm">
                {q} <ChevronDown size={16} className="text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <div className="bg-slate-900 text-white rounded-3xl text-center px-6 py-14">
          <h2 className="font-serif text-3xl mb-3">Start organizing in two minutes</h2>
          <p className="text-slate-400 mb-7">Create your vault and let AI handle the paperwork.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <button onClick={onGetStarted} className={primary}>Get started free</button>
            <button onClick={onLogin} className="border border-slate-600 hover:border-slate-400 px-6 py-3 rounded-lg font-medium transition-colors">Log in</button>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:text-slate-500">
        © 2026 DocMind AI — a personal vault, not a public archive.
      </footer>
    </div>
  );
}
