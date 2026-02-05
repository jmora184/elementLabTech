import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as api from "./authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const data = await api.me();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      refresh,
      login: async (email, password) => {
        await api.login(email, password);
        await refresh();
      },
      register: async (email, password) => {
        await api.register(email, password);
      },
      logout: async () => {
        await api.logout();
        await refresh();
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
