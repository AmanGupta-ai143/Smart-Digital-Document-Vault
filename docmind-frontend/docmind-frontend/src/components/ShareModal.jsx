import React, { useEffect, useState } from "react";
import { Copy, Check, Share2, Trash2, Clock } from "lucide-react";
import { Modal } from "./ui.jsx";
import * as docsApi from "../api/documents.js";
import { useToast } from "../context/ToastContext.jsx";

const OPTIONS = [
  { key: "1h", label: "1 hour" },
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
];

const fmt = (d) => new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export default function ShareModal({ doc, onClose }) {
  const { showToast } = useToast();
  const [expiresIn, setExpiresIn] = useState("24h");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null); // { url, expiresAt }
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState([]);

  const loadShares = () => docsApi.listShares(doc._id).then(setShares).catch(() => {});
  useEffect(() => { loadShares(); }, [doc._id]);

  const create = async () => {
    setBusy(true);
    try {
      const res = await docsApi.createShare(doc._id, expiresIn);
      setCreated(res);
      setCopied(false);
      loadShares();
    } catch (err) {
      showToast(err.message || "Could not create the link.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(created.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Copy failed — select the link and copy it manually.");
    }
  };

  const nativeShare = () => navigator.share({ title: doc.fileName, text: "Shared securely with DocMind AI", url: created.url }).catch(() => {});

  const revoke = async (id) => {
    await docsApi.revokeShare(doc._id, id).catch(() => {});
    loadShares();
    showToast("Link removed.");
  };

  return (
    <Modal title="Share document" onClose={onClose}>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1 break-all font-medium">{doc.fileName}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Anyone with the link can view this file until it expires. You can remove a link at any time.</p>

      <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Link expires after</p>
      <div className="flex gap-2 mb-4">
        {OPTIONS.map((o) => (
          <button key={o.key} type="button" onClick={() => setExpiresIn(o.key)} className={`flex-1 py-2.5 rounded-lg text-sm border ${expiresIn === o.key ? "bg-teal-700 text-white border-teal-700" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700"}`}>{o.label}</button>
        ))}
      </div>

      {!created ? (
        <button type="button" onClick={create} disabled={busy} className="w-full bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white py-3 rounded-lg font-medium text-sm">{busy ? "Creating…" : "Create share link"}</button>
      ) : (
        <div className="space-y-3">
          <input readOnly value={created.url} onFocus={(e) => e.target.select()} className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg px-3 py-2.5 text-xs" />
          <div className="flex gap-2">
            <button type="button" onClick={copy} className="flex-1 flex items-center justify-center gap-2 bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-lg font-medium text-sm">
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied" : "Copy link"}
            </button>
            {typeof navigator !== "undefined" && navigator.share && (
              <button type="button" onClick={nativeShare} className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-4 rounded-lg text-sm"><Share2 size={16} /> Share</button>
            )}
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1"><Clock size={12} /> Works until {fmt(created.expiresAt)}</p>
        </div>
      )}

      {shares.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Active links</p>
          <div className="space-y-2">
            {shares.map((s) => (
              <div key={s._id} className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs text-slate-700 dark:text-slate-200">Expires {fmt(s.expiresAt)}</p>
                  <p className="text-xs text-slate-400">{s.viewCount} view{s.viewCount === 1 ? "" : "s"}</p>
                </div>
                <button type="button" onClick={() => revoke(s._id)} className="flex items-center gap-1 text-xs text-rose-600 font-medium px-2 py-2"><Trash2 size={13} /> Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
