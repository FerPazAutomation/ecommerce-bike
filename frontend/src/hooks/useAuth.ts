import { createContext, useContext } from "react";

export type AuthState = {
  token: string | null;
  isLoggedIn: boolean;
  /** true si la sesión terminó por un 401 de la API (no por un logout manual). */
  sessionExpired: boolean;
  login: (token: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
