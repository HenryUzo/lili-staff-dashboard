import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginStaff } from "@/api/auth";
import { setUnauthorizedHandler } from "@/api/http";
import { clearStoredSession, getStoredSession, setStoredSession } from "@/lib/storage";
import type { StaffSession, StaffUser } from "@/types/api";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoggingIn: boolean;
  token: string | null;
  user: StaffUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(() => getStoredSession());
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => {
      setSession(null);
      window.location.replace("/login?reason=session-expired");
    };

    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session?.token),
      isLoggingIn,
      token: session?.token ?? null,
      user: session?.user ?? null,
      async login(email, password) {
        setIsLoggingIn(true);
        try {
          const nextSession = await loginStaff(email, password);
          setStoredSession(nextSession);
          setSession(nextSession);
        } finally {
          setIsLoggingIn(false);
        }
      },
      logout() {
        clearStoredSession();
        setSession(null);
        window.location.replace("/login");
      }
    }),
    [isLoggingIn, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
