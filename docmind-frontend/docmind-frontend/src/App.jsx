import React, { useState } from "react";
import { useAuth } from "./context/AuthContext.jsx";
import { useToast } from "./context/ToastContext.jsx";
import { useContacts, useReminders } from "./hooks/useContactsReminders.js";
import { useDocuments } from "./hooks/useDocuments.js";

import Landing from "./pages/Landing.jsx";
import LoginPage from "./pages/Login.jsx";
import SignupPage from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import MyDocuments from "./pages/Documents.jsx";
import DocumentDetail from "./pages/DocumentDetail.jsx";
import AIAssistant from "./pages/Assistant.jsx";
import Contacts from "./pages/Contacts.jsx";
import Reminders from "./pages/Reminders.jsx";
import ActivityPage from "./pages/Activity.jsx";
import SecurityCenter from "./pages/Security.jsx";
import Settings from "./pages/Settings.jsx";

import { Sidebar, TopBar, MobileNav, MobileMoreSheet } from "./components/Shell.jsx";
import EmailVerificationBanner from "./components/EmailVerificationBanner.jsx";
import UploadModal from "./components/UploadModal.jsx";
import AddContactModal from "./components/AddContactModal.jsx";
import AddReminderModal from "./components/AddReminderModal.jsx";
import SearchPanel from "./components/SearchPanel.jsx";
import NotificationsPanel from "./components/NotificationsPanel.jsx";

import { Spinner } from "./components/ui.jsx";

export default function App() {
  const { user, status, logout } = useAuth();
  const [authView, setAuthView] = useState("landing"); // landing | login | signup
  const [page, setPage] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMore, setMobileMore] = useState(false);

  const [selectedDocId, setSelectedDocId] = useState(null);
  const [assistantDoc, setAssistantDoc] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [notifRefreshKey, setNotifRefreshKey] = useState(0);

  const { showToast } = useToast();
  const { addContact } = useContacts();
  const { addReminder } = useReminders();
  const { documents: reminderDocs } = useDocuments({ archived: "false", limit: 100 });

  // Still loading a stored session — avoid flashing the landing page.
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-slate-950"><Spinner label="Loading DocMind AI…" /></div>;
  }

  if (status === "guest") {
    if (authView === "login") return <LoginPage onGoSignup={() => setAuthView("signup")} onBack={() => setAuthView("landing")} />;
    if (authView === "signup") return <SignupPage onGoLogin={() => setAuthView("login")} onBack={() => setAuthView("landing")} />;
    return <Landing onGetStarted={() => setAuthView("signup")} onLogin={() => setAuthView("login")} />;
  }

  const openDoc = (id) => { setSelectedDocId(id); setPage("documentDetail"); };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 flex">
      <Sidebar
        page={page === "documentDetail" ? "documents" : page}
        setPage={setPage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        onLogout={logout}
        user={user}
        storagePct={42}
      />

      <div className="flex-1 min-w-0 pb-16 md:pb-0">
        <TopBar user={user} onSearchOpen={() => setShowSearch(true)} onUpload={() => setShowUpload(true)} onNotifOpen={() => setShowNotif(true)} onMenuOpen={() => setMobileMore(true)} notifRefreshKey={notifRefreshKey} />
        <EmailVerificationBanner />

        {page === "dashboard" && <Dashboard setPage={setPage} openDoc={openDoc} openUpload={() => setShowUpload(true)} />}
        {page === "documents" && <MyDocuments openDoc={openDoc} openUpload={() => setShowUpload(true)} />}
        {page === "documentDetail" && selectedDocId && <DocumentDetail docId={selectedDocId} onBack={() => setPage("documents")} setPage={setPage} setAssistantDoc={setAssistantDoc} />}
        {page === "assistant" && <AIAssistant initialDocId={assistantDoc} />}
        {page === "contacts" && <Contacts openAddContact={() => setShowAddContact(true)} />}
        {page === "reminders" && <Reminders openAddReminder={() => setShowAddReminder(true)} />}
        {page === "activity" && <ActivityPage />}
        {page === "security" && <SecurityCenter />}
        {page === "settings" && <Settings setPage={setPage} />}
      </div>

      <MobileNav page={page === "documentDetail" ? "documents" : page} setPage={setPage} onMore={() => setMobileMore(true)} />

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onComplete={() => { setShowUpload(false); showToast("Document uploaded and organized."); setPage("documents"); }}
        />
      )}

      {showAddContact && (
        <AddContactModal
          onClose={() => setShowAddContact(false)}
          onSave={async (form) => { await addContact(form); setShowAddContact(false); showToast("Contact saved."); }}
        />
      )}

      {showAddReminder && (
        <AddReminderModal
          documents={reminderDocs}
          onClose={() => setShowAddReminder(false)}
          onSave={async (form) => { await addReminder(form); setShowAddReminder(false); showToast("Reminder created."); }}
        />
      )}

      {showSearch && <SearchPanel onClose={() => setShowSearch(false)} openDoc={openDoc} setPage={setPage} />}
      {showNotif && <NotificationsPanel onClose={() => { setShowNotif(false); setNotifRefreshKey((k) => k + 1); }} />}
      {mobileMore && <MobileMoreSheet onClose={() => setMobileMore(false)} setPage={setPage} />}
    </div>
  );
}
