import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getStaffSession, loginStaff, logoutStaff } from "@/api/auth";
import { setUnauthorizedHandler } from "@/api/http";
import type { StaffLoginResult, StaffSession, StaffUser } from "@/types/api";

interface AuthContextValue {
  isAuthenticated: boolean;
  isRestoring: boolean;
  isLoggingIn: boolean;
  user: StaffUser | null;
  login: (email: string, password: string) => Promise<StaffLoginResult>;
  completeLogin: (session: StaffSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function isStaffSession(value: unknown): value is StaffSession {
  if (!value || typeof value !== "object" || !("user" in value)) return false;
  const user = value.user;
  return Boolean(user && typeof user === "object" && "id" in user && "email" in user && "permissions" in user);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StaffSession | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      setSession(null);
      window.location.replace("/login?reason=session-expired");
    };

    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    getStaffSession().then((nextSession) => setSession(isStaffSession(nextSession) ? nextSession : null)).catch(() => setSession(null)).finally(() => setIsRestoring(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(session),
      isRestoring,
      isLoggingIn,
      user: session?.user ?? null,
      async login(email, password) {
        setIsLoggingIn(true);
        try {
          const nextSession = await loginStaff(email, password);
          if ("user" in nextSession) {
            setSession(nextSession);
          }
          return nextSession;
        } finally {
          setIsLoggingIn(false);
        }
      },
      completeLogin(nextSession) {
        setSession(nextSession);
      },
      logout() {
        void logoutStaff().catch(() => undefined);
        setSession(null);
        window.location.replace("/login");
      }
    }),
    [isLoggingIn, isRestoring, session]
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
