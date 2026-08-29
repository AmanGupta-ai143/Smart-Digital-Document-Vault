import React, { useEffect, useState } from "react";
import {
  LayoutDashboard, FileText, Bot, Users, Bell, Activity as ActivityIcon,
  ShieldCheck, Settings as SettingsIcon, Search, Upload, Menu, LogOut,
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
    <aside className={`hidden md:flex flex-col border-r border-slate-200 bg-white h-screen sticky top-0 transition-all ${collapsed ? "w-[76px]" : "w-64"}`}>
      <div className={`flex items-center gap-2.5 px-5 h-16 border-b border-slate-100 ${collapsed ? "justify-center px-0" : ""}`}>
        <Seal size={32}><FileText size={15} /></Seal>
        {!collapsed && <span className="font-serif text-lg text-slate-900">DocMind AI</span>}
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const active = page === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setPage(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-50"
              } ${collapsed ? "justify-center px-0" : ""}`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={18} className={active ? "text-teal-700" : "text-slate-400"} />
              {!collapsed && item.label}
            </button>
          );
        })}
      </nav>
      <div className="p-3 border-t border-slate-100 space-y-3">
        {!collapsed && (
          <div className="px-2">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Storage</span><span>{storagePct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-600 rounded-full" style={{ width: `${storagePct}%` }} />
            </div>
          </div>
        )}
        <div className={`flex items-center gap-2.5 px-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs font-serif flex items-center justify-center shrink-0">
            {(user?.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        <button onClick={onLogout} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-rose-600 ${collapsed ? "justify-center px-0" : ""}`}>
          <LogOut size={16} /> {!collapsed && "Log out"}
        </button>
        <button onClick={() => setCollapsed((c) => !c)} className="w-full flex items-center justify-center py-1 text-slate-300 hover:text-slate-500">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  );
}

export function MobileNav({ page, setPage, onMore }) {
  const items = NAV_ITEMS.slice(0, 4);
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 flex items-stretch z-30">
      {items.map((item) => (
        <button key={item.key} onClick={() => setPage(item.key)} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] ${page === item.key ? "text-teal-700" : "text-slate-400"}`}>
          <item.icon size={19} />
          {item.label.split(" ")[0]}
        </button>
      ))}
      <button onClick={onMore} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] text-slate-400">
        <Menu size={19} /> More
      </button>
    </nav>
  );
}

export function MobileMoreSheet({ onClose, setPage }) {
  return (
    <div className="fixed inset-0 z-40 bg-slate-900/40 flex items-end md:hidden" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-t-2xl w-full p-4 pb-8">
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
        {NAV_ITEMS.slice(4).map((item) => (
          <button key={item.key} onClick={() => { setPage(item.key); onClose(); }} className="w-full flex items-center gap-3 px-2 py-3 text-sm font-medium text-slate-700">
            <item.icon size={18} className="text-slate-400" /> {item.label}
          </button>
        ))}
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
    <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200 h-16 flex items-center gap-3 px-4 md:px-6">
      <button onClick={onMenuOpen} className="md:hidden p-2 -ml-2 text-slate-500"><Menu size={20} /></button>
      <button onClick={onSearchOpen} className="flex-1 max-w-md flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors">
        <Search size={16} /> Search documents, contacts, tags…
      </button>
      <div className="ml-auto flex items-center gap-2">
        <button onClick={onUpload} className="hidden sm:flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-3.5 py-2 rounded-lg transition-colors">
          <Upload size={15} /> Upload
        </button>
        <button onClick={onNotifOpen} className="relative p-2.5 rounded-lg hover:bg-slate-100 text-slate-500">
          <Bell size={19} />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full ring-2 ring-white" />}
        </button>
        <div className="w-8 h-8 rounded-full bg-slate-800 text-white text-xs font-serif flex items-center justify-center">
          {(user?.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
        </div>
      </div>
    </header>
  );
}
