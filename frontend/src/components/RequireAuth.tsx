import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { loginPathWithNext } from "../lib/redirect";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoggedIn, sessionExpired } = useAuth();
  const location = useLocation();
  if (!isLoggedIn) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={loginPathWithNext(next, { expired: sessionExpired })} replace />;
  }
  return <>{children}</>;
}
