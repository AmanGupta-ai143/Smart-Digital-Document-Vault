import React, { useState, useRef, useEffect } from "react";
import { Send, Bot } from "lucide-react";
import { useDocuments } from "../hooks/useDocuments.js";
import { askDocuments } from "../api/documents.js";

export default function AIAssistant({ initialDocId }) {
  const { documents } = useDocuments({ archived: "false", limit: 100 });
  const [scope, setScope] = useState(initialDocId ? "one" : "all");
  const [scopeDocId, setScopeDocId] = useState(initialDocId || "");
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi — ask me anything about your documents. I'll only look at the ones in scope below.", sources: [], suggestions: ["Summarize my recent documents", "Find my important certificates", "What deadlines are coming up?"] },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (!scopeDocId && documents[0]) setScopeDocId(documents[0]._id); }, [documents]); // eslint-disable-line

  const send = async (text) => {
    const q = text ?? input;
    if (!q.trim() || sending) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setSending(true);
    try {
      const documentIds = scope === "one" && scopeDocId ? [scopeDocId] : [];
      const result = await askDocuments(q, documentIds);
      setMessages((m) => [...m, { role: "ai", text: result.answer, sources: result.sourceDocuments || [], suggestions: result.followUpQuestions || [] }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "ai", text: `Sorry, I couldn't get an answer: ${err.message}`, sources: [], suggestions: [] }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto flex flex-col h-[calc(100vh-64px)]">
      <div className="mb-4">
        <h1 className="font-serif text-2xl text-slate-900 dark:text-slate-100">Ask DocMind AI</h1>
        <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Search, understand, and explore your documents using natural language.</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-slate-500 dark:text-slate-400">Scope:</span>
        <button onClick={() => setScope("all")} className={`text-xs px-2.5 py-1 rounded-full border ${scope === "all" ? "bg-slate-900 dark:bg-teal-700 text-white border-slate-900 dark:border-teal-700" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}>All Documents</button>
        <select value={scopeDocId} onChange={(e) => { setScopeDocId(e.target.value); setScope("one"); }} className={`text-xs px-2.5 py-1 rounded-full border outline-none ${scope === "one" ? "bg-slate-900 dark:bg-teal-700 text-white border-slate-900 dark:border-teal-700" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}>
          {documents.map((d) => <option key={d._id} value={d._id} className="text-slate-900 dark:text-slate-100">{d.fileName}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto bg-white border border-slate-200 rounded-xl p-5 space-y-5 mb-4 dark:bg-slate-900 dark:border-slate-700">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${m.role === "user" ? "bg-teal-700 text-white" : "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"} rounded-2xl px-4 py-3`}>
              <p className="text-sm whitespace-pre-line leading-relaxed">{m.text}</p>
              {m.sources?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {m.sources.map((s) => <span key={s} className="text-[10px] bg-white/70 text-teal-800 px-2 py-0.5 rounded-full font-medium">{s}</span>)}
                </div>
              )}
              {m.suggestions?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {m.suggestions.map((s) => <button key={s} onClick={() => send(s)} className="text-xs bg-white border border-slate-200 hover:border-teal-400 text-slate-600 px-2.5 py-1 rounded-full dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400">{s}</button>)}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-slate-50 rounded-2xl px-4 py-3 flex items-center gap-2 text-slate-400 text-sm dark:bg-slate-800/60 dark:text-slate-500">
              <Bot size={14} className="animate-pulse" /> Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 dark:bg-slate-900 dark:border-slate-700">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Ask a question…" className="flex-1 text-sm outline-none py-2 dark:bg-transparent dark:text-slate-100 dark:placeholder-slate-500" />
        <button onClick={() => send()} disabled={sending} className="p-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-lg"><Send size={15} /></button>
      </div>
    </div>
  );
}
