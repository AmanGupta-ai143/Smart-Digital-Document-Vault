import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
          key={toast.id}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 text-white text-sm px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 ${
            toast.tone === "error" ? "bg-rose-700" : "bg-slate-900"
          }`}
          onAnimationEnd={() => {}}
        >
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
