"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

interface AuthState {
  authenticated: boolean;
  role: string | null;
  email: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  role: null,
  email: null,
  loading: true,
  isAdmin: false,
  login: async () => ({ success: false }),
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    role: null,
    email: null,
    loading: true,
  });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setState({
        authenticated: data.authenticated,
        role: data.role || null,
        email: data.email || null,
        loading: false,
      });
    } catch {
      setState({ authenticated: false, role: null, email: null, loading: false });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (data.success) {
          await refresh();
          return { success: true };
        }
        return { success: false, error: data.error || "Login failed" };
      } catch {
        return { success: false, error: "Network error" };
      }
    },
    [refresh]
  );

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ authenticated: false, role: null, email: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAdmin: state.role === "admin",
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
