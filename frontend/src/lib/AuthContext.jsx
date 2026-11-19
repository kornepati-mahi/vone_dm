import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { get } from "./api.js";

const AUTH_HINT = "dm_panda_auth_hint";

const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  authHint: false,
  isLoading: true,
  refresh: async () => {},
  logout: async () => {},
  setUser: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [authHint, setAuthHint] = useState(() => {
    try { return localStorage.getItem(AUTH_HINT) === "1"; } catch { return false; }
  });

  const applyUser = useCallback((u) => {
    setUser(u);
    setAuthHint(!!u);
    try {
      if (u) localStorage.setItem(AUTH_HINT, "1");
      else localStorage.removeItem(AUTH_HINT);
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await get("/api/me");
      const u = data && (data.id || data.user) ? (data.user || data) : null;
      applyUser(u);
      const state = u?.access_state;
      if (state && (state.is_hard_banned === true || state.dashboard_allowed === false)) {
        const message = state.ban_message || "Your account has been blocked.";
        applyUser(null);
        if (typeof window !== "undefined") {
          window.location.replace("/login?popup_reason=hard_ban&message=" + encodeURIComponent(message));
        }
      }
      return u;
    } catch {
      applyUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [applyUser]);

  const logout = useCallback(async () => {
    try {
      await get("/logout");
    } catch {}
    applyUser(null);
  }, [applyUser]);

  useEffect(() => {
    // Only probe for an existing session when a login hint exists. On a fresh
    // visit (or while Google is still redirecting) this avoids noisy 401s.
    let hadHint = false;
    try { hadHint = localStorage.getItem(AUTH_HINT) === "1"; } catch {}
    if (hadHint) refresh();
    else setLoading(false);
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, authHint, isLoading, refresh, logout, setUser: applyUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
