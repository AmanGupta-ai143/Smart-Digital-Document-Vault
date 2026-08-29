import { useState, useEffect, useCallback } from "react";
import * as api from "../api/resources.js";

export function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setContacts(await api.listContacts());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addContact = async (payload) => {
    const contact = await api.createContact(payload);
    setContacts((cs) => [...cs, contact]);
    return contact;
  };

  const removeContact = async (id) => {
    setContacts((cs) => cs.filter((c) => c._id !== id));
    await api.deleteContact(id).catch(() => load());
  };

  return { contacts, loading, error, reload: load, addContact, removeContact };
}

export function useReminders() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReminders(await api.listReminders());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addReminder = async (payload) => {
    const reminder = await api.createReminder(payload);
    setReminders((rs) => [...rs, reminder]);
    return reminder;
  };

  const completeReminder = async (id) => {
    setReminders((rs) => rs.map((r) => (r._id === id ? { ...r, status: "completed" } : r)));
    try {
      await api.updateReminder(id, { status: "completed" });
    } catch {
      load();
    }
  };

  return { reminders, loading, error, reload: load, addReminder, completeReminder };
}
