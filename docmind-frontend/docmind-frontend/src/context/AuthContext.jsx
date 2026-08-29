import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { tokenStore } from "../api/client.js";
import * as authApi from "../api/auth.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | guest
  const [error, setError] = useState(null);

  const restoreSession = useCallback(async () => {
    if (!tokenStore.getAccess()) {
      setStatus("guest");
      return;
    }
    try {
      const me = await authApi.fetchMe();
      setUser(me);
      setStatus("authenticated");
    } catch {
      tokenStore.clear();
      setStatus("guest");
    }
  }, []);

  useEffect(() => {
    restoreSession();
    const onExpired = () => {
      setUser(null);
      setStatus("guest");
      setError("Your session expired. Please log in again.");
    };
    window.addEventListener("docmind:session-expired", onExpired);
    return () => window.removeEventListener("docmind:session-expired", onExpired);
  }, [restoreSession]);

  const login = async (credentials) => {
    setError(null);
    const result = await authApi.login(credentials);
    if (result.requires2FA) return result; // { requires2FA: true, pendingToken }
    setUser(result.user);
    setStatus("authenticated");
    return result;
  };

  const completeTwoFactorLogin = async ({ pendingToken, token }) => {
    setError(null);
    const u = await authApi.verifyLoginTwoFactor({ pendingToken, token });
    setUser(u);
    setStatus("authenticated");
    return u;
  };

  const signup = async (details) => {
    setError(null);
    const u = await authApi.signup(details);
    setUser(u);
    setStatus("authenticated");
    return u;
  };

  const logout = async () => {
    await authApi.logout().catch(() => {});
    setUser(null);
    setStatus("guest");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, status, error, login, completeTwoFactorLogin, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
