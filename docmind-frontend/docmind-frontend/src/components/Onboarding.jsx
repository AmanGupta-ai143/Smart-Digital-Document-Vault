import React, { useState } from "react";
import { Upload, Sparkles, Bell, X } from "lucide-react";
import { Seal } from "./ui.jsx";
import { updatePreferences } from "../api/resources.js";
import { useAuth } from "../context/AuthContext.jsx";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to DocMind AI",
    body: "Your personal digital vault — upload your documents and let AI understand, organize, and keep track of what matters.",
  },
  {
    icon: Upload,
    title: "Upload your first document",
    body: "Drag and drop a file, or browse from your device. Insurance policies, IDs, certificates — whatever you need to keep track of.",
  },
  {
    icon: Sparkles,
    title: "Let AI organize it",
    body: "DocMind AI automatically detects the category, tags, and any important dates — you just review and confirm.",
  },
  {
    icon: Bell,
    title: "Set reminders for important dates",
    body: "When AI spots an expiry or renewal date, you can turn it into a reminder in one click, so nothing catches you off guard.",
  },
];

// Shown once to new users (gated on user.preferences.hasSeenOnboarding).
// Skippable at any point, per spec: onboarding should never create friction.
export default function Onboarding({ onFinish, onUpload }) {
  const { setUser } = useAuth();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  const dismiss = async () => {
    try {
      const prefs = await updatePreferences({ hasSeenOnboarding: true });
      setUser((u) => ({ ...u, preferences: prefs }));
    } catch {
      // Non-critical — worst case the user sees onboarding again next visit.
    }
    onFinish();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
        <button onClick={dismiss} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Skip onboarding">
          <X size={18} />
        </button>

        <Seal size={48} tone="teal"><current.icon size={22} /></Seal>
        <h2 className="font-serif text-xl text-slate-900 dark:text-slate-100 mt-4">{current.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">{current.body}</p>

        <div className="flex items-center gap-1.5 mt-6 mb-5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-teal-700" : "w-1.5 bg-slate-200 dark:bg-slate-700"}`} />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={dismiss} className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 font-medium">Skip</button>
          <div className="flex gap-2">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)} className="text-sm font-medium text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2">Back</button>
            )}
            {isLast ? (
              <button
                onClick={async () => { await dismiss(); onUpload?.(); }}
                className="text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg px-4 py-2"
              >
                Upload a Document
              </button>
            ) : (
              <button onClick={() => setStep((s) => s + 1)} className="text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg px-4 py-2">Next</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
