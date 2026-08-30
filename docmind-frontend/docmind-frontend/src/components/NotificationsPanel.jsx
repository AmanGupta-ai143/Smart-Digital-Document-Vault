import React, { useEffect, useState } from "react";
import { Sparkles, Bell, ShieldCheck, Users, CheckCheck } from "lucide-react";
import * as api from "../api/resources.js";

const ICON = { reminder: Bell, ai_update: Sparkles, security: ShieldCheck, account: Users };

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationsPanel({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.listNotifications().then((d) => setNotifications(d.notifications)).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const markRead = async (id) => {
    setNotifications((ns) => ns.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    await api.markNotificationRead(id).catch(() => {});
  };

  const markAllRead = async () => {
    setNotifications((ns) => ns.map((n) => ({ ...n, isRead: true })));
    await api.markAllNotificationsRead().catch(() => {});
  };

  return (
    <div className="fixed inset-0 z-40 bg-transparent" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="absolute top-16 right-4 md:right-8 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between dark:border-slate-800">
          <p className="text-sm font-medium">Notifications</p>
          <button onClick={markAllRead} className="text-xs text-teal-700 font-medium flex items-center gap-1"><CheckCheck size={13} /> Mark all read</button>
        </div>
        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto dark:divide-slate-800">
          {loading && <p className="text-sm text-slate-400 text-center py-8 dark:text-slate-500">Loading…</p>}
          {!loading && notifications.length === 0 && <p className="text-sm text-slate-400 text-center py-8 dark:text-slate-500">You're all caught up.</p>}
          {notifications.map((n) => {
            const Icon = ICON[n.category] || Bell;
            return (
              <button key={n._id} onClick={() => markRead(n._id)} className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 ${n.isRead ? "opacity-60" : ""}`}>
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0 dark:bg-teal-900/40"><Icon size={14} /></div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-700 leading-snug dark:text-slate-300">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5 dark:text-slate-500">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 ml-auto shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
