import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Receipt,
  LifeBuoy,
  Mail,
  Settings,
  Newspaper,
  Zap,
  Menu,
  X,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
  ShieldCheck,
  Loader2,
  Lock,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useTheme } from "../../lib/ThemeContext.jsx";
import { post } from "../../lib/api.js";
import { useToast } from "../../lib/ToastContext.jsx";

const NAV = [
  { section: "Overview", items: [{ to: "/admin", label: "Admin Dashboard", icon: LayoutDashboard, end: true }] },
  {
    section: "Management",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/plans", label: "Plans & Pricing", icon: CreditCard },
      { to: "/admin/blog", label: "Blog Posts", icon: Newspaper },
      { to: "/admin/automations", label: "Automations", icon: Zap },
    ],
  },
  {
    section: "Finance & Support",
    items: [
      { to: "/admin/transactions", label: "Transactions", icon: Receipt },
      { to: "/admin/tickets", label: "Support Tickets", icon: LifeBuoy },
      { to: "/admin/contact", label: "Contact Messages", icon: Mail },
    ],
  },
  {
    section: "Configuration",
    items: [
      { to: "/admin/content", label: "Site Content", icon: FileText },
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function AdminLayout() {
  const { user, isAuthenticated, isLoading, logout, setUser, refresh } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  // Admin login form state (shown when visiting /admin without a session)
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isAdmin = user?.role === "admin";

  const submitLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    try {
      const data = await post("/api/auth/login", {
        email: loginForm.email.trim(),
        password: loginForm.password,
      });
      const u = data && data.user ? data.user : null;
      if (u) setUser(u);
      else await refresh();
      if (u && u.role === "admin") {
        showSuccess("Welcome back, admin!");
      } else {
        setLoginError("This account does not have admin access.");
        try {
          await post("/api/auth/logout", {});
        } catch {}
        setUser(null);
      }
    } catch (err) {
      setLoginError(err.message || "Login failed. Please try again.");
    } finally {
      setLoginBusy(false);
    }
  };

  // Gate: nothing but the login form until an admin signs in.
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <img src="/images/vone-logo.svg" alt="" className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <img src="/images/vone-logo.svg" alt="vone_dm" className="w-12 h-12 mx-auto mb-3" />
            <h1 className="text-xl font-black">vone_dm Admin</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAuthenticated
                ? "Your account doesn't have admin access."
                : "Sign in with an admin account to continue."}
            </p>
          </div>

          {isAuthenticated ? (
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 text-center">
              <ShieldCheck className="w-8 h-8 mx-auto text-amber-500 mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                Signed in as <strong>{user?.email}</strong>, which is not an admin account.
              </p>
              <div className="flex flex-col gap-2.5">
                <Link
                  to="/dashboard"
                  className="px-5 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-bold"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={async () => {
                    await logout();
                    navigate("/admin", { replace: true });
                  }}
                  className="px-5 py-3 rounded-xl border border-gray-300 dark:border-white/15 text-sm font-bold"
                >
                  Sign out & use another account
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={submitLogin} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="admin@example.com"
                  autoComplete="username"
                  required
                  className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
                />
              </div>
              {loginError && (
                <p className="text-xs text-red-500 text-center">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loginBusy}
                className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loginBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                <Lock className="w-4 h-4" /> Sign in to Admin
              </button>
              <p className="text-[11px] text-center text-gray-400">
                Admin access only.{" "}
                <Link to="/" className="underline hover:text-gray-600">
                  Back to site
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="h-16 sm:h-[68px] flex items-center justify-between px-5 border-b border-neutral-200/70 dark:border-white/[0.07]">
        <Link to="/" className="flex items-center gap-2">
          <img src="/images/vone-logo.svg" alt="vone_dm" className="h-8 w-auto" />
          <span className="font-black text-lg tracking-tight hidden sm:block">vone_dm</span>
          <span className="text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-[#405DE6] to-[#833AB4] text-white px-2 py-0.5 rounded-full">
            Admin
          </span>
        </Link>
        <button onClick={() => setOpen(false)} className="lg:hidden p-2" aria-label="Close menu">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-none py-4 px-3 space-y-5">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {group.section}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-[#405DE6] to-[#833AB4] text-white shadow-md shadow-purple-500/20"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white"
                    }`
                  }
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-neutral-200/70 dark:border-white/[0.07] space-y-1">
        <Link
          to="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
        >
          <ShieldCheck className="w-4 h-4" /> User Dashboard
        </Link>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/[0.04]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#405DE6] to-[#833AB4] text-white text-xs font-black flex items-center justify-center shrink-0">
            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold truncate">{user?.name || "Admin"}</p>
            <p className="text-[10px] text-gray-500 truncate">{user?.email || ""}</p>
          </div>
          <button
            onClick={async () => {
              await logout();
              navigate("/");
            }}
            aria-label="Logout"
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0b] text-gray-900 dark:text-gray-100">
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-[264px] bg-white dark:bg-[#101012] border-r border-neutral-200/70 dark:border-white/[0.07] z-40">
        {sidebar}
      </aside>

      <div
        className={`lg:hidden fixed inset-0 bg-black/60 z-50 transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-[280px] bg-white dark:bg-[#101012] z-[60] transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebar}
      </aside>

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 h-16 sm:h-[68px] bg-white/85 dark:bg-[#101012]/85 backdrop-blur-md border-b border-neutral-200/70 dark:border-white/[0.07] flex items-center justify-between px-4 sm:px-6 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 -ml-2" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">
                {NAV.flatMap((g) => g.items).find((i) => location.pathname === i.to)?.label || "Admin"}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                Administration panel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link
              to="/dashboard"
              className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#405DE6] to-[#833AB4] text-white shadow-md shadow-purple-500/20"
            >
              User View
            </Link>

            <div className="relative">
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
              >
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#405DE6] to-[#833AB4] text-white text-xs font-black flex items-center justify-center">
                  {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-neutral-200 dark:border-white/10 bg-white dark:bg-[#161618] shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-neutral-100 dark:border-white/[0.07]">
                      <p className="text-sm font-bold truncate">{user?.name || "Admin"}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email || ""}</p>
                    </div>
                    <Link
                      to="/dashboard/account-settings"
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                    >
                      Account Settings
                    </Link>
                    <button
                      onClick={async () => {
                        await logout();
                        navigate("/");
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="w-full p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
