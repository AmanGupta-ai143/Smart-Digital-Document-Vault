import { useState, useEffect, useCallback } from "react";
import * as docsApi from "../api/documents.js";

export function useDocuments(filters) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await docsApi.listDocuments(filters);
      setDocuments(data.documents);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  const patchLocal = (id, patch) => setDocuments((docs) => docs.map((d) => (d._id === id ? { ...d, ...patch } : d)));

  const toggleFavorite = async (doc) => {
    patchLocal(doc._id, { isFavorite: !doc.isFavorite });
    try {
      await docsApi.updateDocument(doc._id, { isFavorite: !doc.isFavorite });
    } catch {
      patchLocal(doc._id, { isFavorite: doc.isFavorite }); // revert on failure
    }
  };

  const toggleImportant = async (doc) => {
    patchLocal(doc._id, { isImportant: !doc.isImportant });
    try {
      await docsApi.updateDocument(doc._id, { isImportant: !doc.isImportant });
    } catch {
      patchLocal(doc._id, { isImportant: doc.isImportant });
    }
  };

  const toggleArchived = async (doc) => {
    patchLocal(doc._id, { isArchived: !doc.isArchived });
    try {
      await docsApi.updateDocument(doc._id, { isArchived: !doc.isArchived });
    } catch {
      patchLocal(doc._id, { isArchived: doc.isArchived });
    }
  };

  return { documents, setDocuments, loading, error, reload: load, toggleFavorite, toggleImportant, toggleArchived };
}
