import React, { useMemo, useState } from "react";
import { Users, Plus, Search, Phone, Star, ShieldAlert } from "lucide-react";
import { CONTACT_CATEGORIES } from "../lib/constants.js";
import { initialsOf } from "../lib/format.js";
import { EmptyState, Spinner, ErrorState } from "../components/ui.jsx";
import { useContacts } from "../hooks/useContactsReminders.js";
import { useToast } from "../context/ToastContext.jsx";

function ContactCard({ contact, onCall }) {
  return (
    <div className="bg-white border border-slate-200 hover:border-teal-200 rounded-xl p-4 flex items-center gap-3 dark:bg-slate-900 dark:border-slate-700">
      <div className="w-11 h-11 rounded-full bg-slate-800 text-white flex items-center justify-center font-serif text-sm shrink-0">{initialsOf(contact.name)}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate flex items-center gap-1.5 dark:text-slate-200">
          {contact.name} {contact.isFavorite && <Star size={12} className="text-amber-500 fill-amber-500 shrink-0" />}
        </p>
        <p className="text-xs text-slate-400 truncate dark:text-slate-500">{contact.phoneNumber} · {contact.category}</p>
      </div>
      <button onClick={() => onCall(contact.name)} className="p-2 rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100 shrink-0 dark:bg-teal-900/40"><Phone size={15} /></button>
    </div>
  );
}

export default function Contacts({ openAddContact }) {
  const { contacts, loading, error, reload } = useContacts();
  const { showToast } = useToast();
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      if (tab === "favorites" && !c.isFavorite) return false;
      if (tab === "emergency" && !c.isEmergencyContact) return false;
      if (tab !== "all" && tab !== "favorites" && tab !== "emergency" && c.category !== tab) return false;
      if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [contacts, tab, query]);

  const tabs = ["all", "favorites", "emergency", ...CONTACT_CATEGORIES];
  const emergency = contacts.filter((c) => c.isEmergencyContact);

  return (
    <div className="p-5 md:p-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl text-slate-900 dark:text-slate-100">Important Contacts</h1>
          <p className="text-slate-500 text-sm mt-1 dark:text-slate-400">Keep your essential contacts securely organized and easy to access.</p>
        </div>
        <button onClick={openAddContact} className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg self-start">
          <Plus size={15} /> Add Contact
        </button>
      </div>

      {loading ? <Spinner label="Loading contacts…" /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          {emergency.length > 0 && tab === "all" && (
            <div className="mb-6">
              <p className="text-xs font-medium text-rose-700 uppercase tracking-wide mb-2 flex items-center gap-1.5"><ShieldAlert size={13} /> Emergency Contacts</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {emergency.map((c) => (
                  <div key={c._id} className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-rose-600 text-white flex items-center justify-center font-serif text-sm shrink-0">{initialsOf(c.name)}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-800 truncate dark:text-slate-200">{c.name}</p>
                      <p className="text-xs text-slate-500 truncate dark:text-slate-400">{c.category}</p>
                    </div>
                    <button onClick={() => showToast(`Calling ${c.name}…`)} className="p-2 rounded-full bg-rose-600 text-white shrink-0"><Phone size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            {tabs.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${tab === t ? "bg-slate-900 dark:bg-teal-700 text-white" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"}`}>
                {t === "all" ? "All" : t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 mb-5 max-w-sm dark:bg-slate-900 dark:border-slate-700">
            <Search size={15} className="text-slate-400 dark:text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search contacts…" className="text-sm outline-none flex-1 dark:bg-transparent dark:text-slate-100 dark:placeholder-slate-500" />
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={Users} title="Keep important people close" subtitle="Add your first important contact to see it here." actionLabel="Add Contact" onAction={openAddContact} />
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {filtered.map((c) => <ContactCard key={c._id} contact={c} onCall={(n) => showToast(`Calling ${n}…`)} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}
