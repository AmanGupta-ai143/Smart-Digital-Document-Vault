import React, { useEffect, useState } from "react";
import {
  LayoutDashboard, FileText, Bot, Users, Bell, Activity as ActivityIcon,
  ShieldCheck, Settings as SettingsIcon, Search, Upload, Menu, LogOut, X,
  ChevronRight, ChevronLeft,
} from "lucide-react";
import { Seal } from "./ui.jsx";
import { listNotifications } from "../api/resources.js";

export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "documents", label: "My Documents", icon: FileText },
  { key: "assistant", label: "AI Assistant", icon: Bot },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "reminders", label: "Reminders", icon: Bell },
  { key: "activity", label: "Activity", icon: ActivityIcon },
  { key: "security", label: "Security Center", icon: ShieldCheck },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar({ page, setPage, collapsed, setCollapsed, onLogout, user, storagePct }) {
  return (
    <aside className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 transition-all ${collapsed ? "w-[76px]" : "w-64"}`}>
      <div className={`flex items-center gap-2.5 px-5 h-16 border-b border-slate-100 dark:border-slate-800 ${collapsed ? "justify-center px-0" : ""}`}>
        <Seal size={32}><FileText size={15} /></Seal>
        {!collapsed && <span className="font-serif text-lg text-slate-900 dark:text-slate-100">DocMind AI</span>}
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className={active ? "text-teal-700 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"} />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
        {!collapsed && (
          <div className="px-2">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>Storage</span><span>{storagePct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-teal-600 rounded-full" style={{ width: `${storagePct}%` }} />
            </div>
          </div>
        )}
        <div className={`flex items-center gap-2.5 px-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white text-xs font-serif flex items-center justify-center shrink-0">
            {(user?.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-100">{user?.name}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button onClick={onLogout} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-rose-600 dark:hover:text-rose-400 ${collapsed ? "justify-center px-0" : ""}`}>
          <LogOut size={16} /> {!collapsed && "Log out"}
        </button>
        <button onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="w-full flex items-center justify-center py-1 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600 rounded">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({ page, setPage, onMore }) {
  const items = NAV_ITEMS.slice(0, 4);
  const SHORT = { dashboard: "Home", documents: "Docs", assistant: "AI", contacts: "Contacts" };
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-stretch z-30 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(15,23,42,0.06)]">
      {items.map((item) => (
        <button key={item.key} onClick={() => setPage(item.key)} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${page === item.key ? "text-teal-700 dark:text-teal-400" : "text-slate-400 dark:text-slate-500"}`}>
          <item.icon size={19} />
          {SHORT[item.key] || item.label}
        </button>
      ))}
      <button onClick={onMore} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-slate-400 dark:text-slate-500">
        <Menu size={19} /> More
      </button>
    </nav>
  );
}

export function MobileMoreSheet({ onClose, setPage, onLogout, user }) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 flex items-end md:hidden" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-t-2xl w-full p-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />
        {NAV_ITEMS.slice(4).map((item) => (
          <button key={item.key} onClick={() => { setPage(item.key); onClose(); }} className="w-full flex items-center gap-3 px-2 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
            <item.icon size={18} className="text-slate-400 dark:text-slate-500" /> {item.label}
          </button>
        ))}
        <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2">
          {user?.email && <p className="px-2 pb-2 text-xs text-slate-400 dark:text-slate-500 truncate">Signed in as {user.email}</p>}
          <button onClick={() => { onClose(); onLogout(); }} className="w-full flex items-center gap-3 px-2 py-3 text-sm font-medium text-rose-600 dark:text-rose-400">
            <LogOut size={18} /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export function MobileDrawer({ page, setPage, onClose, onLogout, user }) {
  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-[82%] max-w-xs bg-white dark:bg-slate-900 shadow-2xl flex flex-col pt-[env(safe-area-inset-top)]">
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Seal size={32}><FileText size={15} /></Seal>
            <span className="font-serif text-lg text-slate-900 dark:text-slate-100">DocMind AI</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close menu" className="w-10 h-10 -mr-2 flex items-center justify-center text-slate-400"><X size={20} /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = page === item.key;
            return (
              <button key={item.key} type="button" onClick={() => { setPage(item.key); onClose(); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium ${active ? "bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300" : "text-slate-600 dark:text-slate-300"}`}>
                <item.icon size={18} /> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 dark:border-slate-800 px-5 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {user?.email && <p className="text-xs text-slate-400 dark:text-slate-500 truncate mb-1">{user.name ? `${user.name} · ` : ""}{user.email}</p>}
          <button type="button" onClick={() => { onClose(); onLogout(); }} className="w-full flex items-center gap-3 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400"><LogOut size={18} /> Log out</button>
        </div>
      </div>
    </div>
  );
}

export function TopBar({ user, onSearchOpen, onUpload, onNotifOpen, onMenuOpen, notifRefreshKey }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    listNotifications(true).then((d) => setUnreadCount(d.unreadCount)).catch(() => {});
  }, [notifRefreshKey]);

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 h-16 flex items-center gap-3 px-4 md:px-6">
      <button type="button" onClick={onMenuOpen} aria-label="Open navigation menu" className="md:hidden shrink-0 w-11 h-11 -ml-2 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 active:bg-teal-50 active:text-teal-700 dark:active:bg-slate-800 touch-manipulation focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600"><Menu size={22} /></button>
      <button onClick={onSearchOpen} aria-label="Search documents, contacts, and reminders" className="flex-1 min-w-0 max-w-md flex items-center gap-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400 dark:text-slate-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">
        <Search size={16} className="shrink-0" /> <span className="truncate"><span className="sm:hidden">Search</span><span className="hidden sm:inline">Search documents, contacts, tags…</span></span>
      </button>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={onUpload} className="hidden sm:flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-800">
          <Upload size={15} /> Upload
        </button>
        <button onClick={onNotifOpen} aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"} className="relative p-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-600">
          <Bell size={19} />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900" />}
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white text-xs font-serif flex items-center justify-center">
          {(user?.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
        </div>
      </div>
    </header>
  );
}
