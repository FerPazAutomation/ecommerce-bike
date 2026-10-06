import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { TOKEN_KEY, clearToken, getToken, setToken, setUnauthorizedHandler } from "../api/client";
import { AuthContext, type AuthState } from "../hooks/useAuth";

/**
 * Fuente única de la sesión. Ante un 401 solo marca la sesión como vencida:
 * la redirección al login la hace `RequireAuth` (una sola navegación, sin carreras).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [sessionExpired, setSessionExpired] = useState(false);

  const endSession = useCallback(
    (expired: boolean) => {
      clearToken();
      setTokenState(null);
      setSessionExpired(expired);
      queryClient.clear();
    },
    [queryClient],
  );

  const login = useCallback((newToken: string) => {
    setToken(newToken);
    setTokenState(newToken);
    setSessionExpired(false);
  }, []);

  const logout = useCallback(() => endSession(false), [endSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => endSession(true));
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === null || e.key === TOKEN_KEY) setTokenState(getToken());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ token, isLoggedIn: token != null, sessionExpired, login, logout }),
    [token, sessionExpired, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
