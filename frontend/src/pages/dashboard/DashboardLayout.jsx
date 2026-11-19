import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Image as ImageIcon,
  Radio,
  AtSign,
  Zap,
  Shield,
  Inbox,
  Sparkles,
  Link2,
  BarChart3,
  CreditCard,
  Receipt,
  Settings,
  LifeBuoy,
  Mail,
  Menu,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Lock,
  MessageCircle,
  Instagram,
} from "lucide-react";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useTheme } from "../../lib/ThemeContext.jsx";
import { usePlan, SECTION_FEATURES } from "../../lib/PlanContext.jsx";
import { useToast } from "../../lib/ToastContext.jsx";
import { get, post } from "../../lib/api.js";
import InstagramConnectButton from "../../components/InstagramConnectButton.jsx";

// Matches the live vone_dm dashboard sidebar exactly.
const NAV = [
  {
    section: "",
    items: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true, section: "overview" },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3, section: "analytics" },
    ],
  },
  {
    section: "Automation",
    items: [
      { to: "/dashboard/reply-templates", label: "Reply Templates", icon: MessageCircle, section: "reply-templates" },
      { to: "/dashboard/super-profile", label: "Super Profile", icon: Link2, section: "super-profile" },
      { to: "/dashboard/welcome-message", label: "Welcome Message", icon: MessageSquare, section: "welcome-message" },
      { to: "/dashboard/convo-starter", label: "Convo Starter", icon: Sparkles, section: "convo-starter" },
      { to: "/dashboard/inbox-menu", label: "Inbox Menu", icon: Inbox, section: "inbox-menu" },
      { to: "/dashboard/global-triggers", label: "Global Trigger", icon: Zap, section: "global-triggers" },
      { to: "/dashboard/dm-automation", label: "DM Automation", icon: MessageSquare, section: "dm-automation" },
      { to: "/dashboard/post-automation", label: "Post Automation", icon: FileText, section: "post-automation" },
      { to: "/dashboard/reel-automation", label: "Reel Automation", icon: Radio, section: "reel-automation" },
      { to: "/dashboard/story-automation", label: "Story Automation", icon: ImageIcon, section: "story-automation" },
      { to: "/dashboard/live-automation", label: "Live Automation", icon: Zap, section: "live-automation" },
      { to: "/dashboard/mentions", label: "Mentions", icon: AtSign, section: "mentions" },
      { to: "/dashboard/suggest-more", label: "Suggest More", icon: Sparkles, section: "suggest-more" },
      { to: "/dashboard/comment-moderation", label: "Comment Moderation", icon: Shield, section: "comment-moderation" },
    ],
  },
  {
    section: "Account",
    items: [
      { to: "/dashboard/my-plan", label: "My Plan", icon: CreditCard, section: "my-plan" },
      { to: "/dashboard/transactions", label: "Transactions", icon: Receipt, section: "transactions" },
      { to: "/dashboard/account-settings", label: "Account Settings", icon: Settings, section: "account-settings" },
      { to: "/dashboard/support", label: "Support", icon: LifeBuoy, section: "support" },
      { to: "/dashboard/contact", label: "Contact", icon: Mail, section: "contact" },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

function Avatar({ user, className = "w-8 h-8 rounded-xl", textClass = "text-xs" }) {
  const [failed, setFailed] = useState(false);
  const src = user?.profile_picture_url || user?.avatar_url || user?.prefs?.avatar_url;
  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={user?.name || "User"}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`${className} object-cover border border-gray-200 dark:border-white/10 shrink-0`}
      />
    );
  }
  return (
    <div className={`${className} bg-gradient-to-br from-[#405DE6] to-[#833AB4] text-white ${textClass} font-black flex items-center justify-center shrink-0`}>
      {initial}
    </div>
  );
}

export default function DashboardLayout() {
  const { user, isAuthenticated, isLoading, logout, refresh } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { hasFeature } = usePlan();
  const { showSuccess, showError } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // The dashboard opens right after signup, but every tab stays locked until
  // an Instagram account is connected.
  const igLocked = !user?.hasLinkedInstagram;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await get("/api/notifications");
        if (alive) setNotifications(Array.isArray(d?.notifications) ? d.notifications : []);
      } catch {
        if (alive) setNotifications([]);
      }
    })();
    return () => { alive = false; };
  }, [user?.id, user?.hasLinkedInstagram]);

  const selectAccount = async (account) => {
    try {
      await post("/api/instagram/select", { account_id: account.id });
      await refresh();
      setSwitchOpen(false);
      showSuccess(`Now using @${account.username || "your account"}.`);
    } catch (err) {
      showError(err.message || "Could not switch account.");
    }
  };

  useEffect(() => {
    setOpen(false);
    setAccountOpen(false);
    setNotifOpen(false);
    setSwitchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login?message=" + encodeURIComponent("You must be logged in to view this page."), { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
        <div className="text-center">
          <img src="/images/vone-logo.svg" alt="" className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading your account...</p>
        </div>
      </div>
    );
  }

  const current = ALL_ITEMS.find((i) => i.to === location.pathname);
  const accounts = user?.ig_accounts || [];

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col w-full">
      {/* Brand + collapse */}
      <div className={`flex items-center h-[72px] shrink-0 border-b border-gray-200/80 dark:border-white/[0.07] ${collapsed ? "justify-center px-0" : "justify-between px-4 sm:px-5"}`}>
        {collapsed ? (
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            title="Expand Sidebar"
            className="h-10 w-10 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center border border-gray-200 dark:border-white/10"
          >
            <img src="/images/vone-logo.svg" alt="vone_dm" className="h-6 w-auto" />
          </button>
        ) : (
          <>
            <Link to="/" className="flex items-center gap-2.5 min-w-0">
              <img src="/images/vone-logo.svg" alt="vone_dm" className="h-8 w-auto object-contain shrink-0" />
              <span className="font-black truncate text-lg tracking-tight text-gray-900 dark:text-white">vone_dm</span>
            </Link>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              title="Collapse sidebar"
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/[0.06] flex items-center justify-center shrink-0"
            >
              <PanelLeftClose size={18} />
            </button>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className={`flex-1 min-h-0 overflow-y-auto scrollbar-none py-3 w-full ${collapsed ? "px-2.5" : "px-3"}`}>
        {NAV.map((group, gi) => (
          <div key={group.section || "main"} className={gi > 0 ? "mt-4" : ""}>
            {!collapsed && group.section && (
              <div className="px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                {group.section}
              </div>
            )}
            <div className="space-y-0.5 w-full">
              {group.items.map((item) => {
                const featureKey = SECTION_FEATURES[item.section];
                const planLocked = featureKey ? !hasFeature(featureKey) : false;
                const disabled = igLocked || planLocked;
                const active = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    title={collapsed ? item.label : undefined}
                    aria-disabled={igLocked}
                    tabIndex={igLocked ? -1 : undefined}
                    onClick={(e) => {
                      if (igLocked) {
                        e.preventDefault();
                        showError("Connect your Instagram account to unlock all dashboard tabs.");
                      }
                    }}
                    className={`group w-full flex items-center rounded-xl text-sm transition-all duration-150 min-h-[42px] min-w-0 ${
                      collapsed ? "justify-center px-2 py-2" : "gap-3 px-3 py-2.5"
                    } ${
                      active && !igLocked
                        ? "bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#FD1D1D] text-white font-semibold shadow-sm shadow-[#833AB4]/25"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white font-medium"
                    } ${disabled ? "opacity-50" : ""} ${igLocked ? "cursor-not-allowed" : ""}`}
                  >
                    <Icon className={`h-5 w-5 shrink-0 transition-transform group-hover:scale-105 ${active && !igLocked ? "text-white" : ""}`} />
                    {!collapsed && <span className="flex-1 min-w-0 text-left truncate">{item.label}</span>}
                    {!collapsed && disabled && <Lock className="h-4 w-4 shrink-0 ml-auto text-gray-400 dark:text-gray-500" />}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Switch account + user */}
      <div className={`shrink-0 mt-auto border-t border-gray-200/80 dark:border-white/[0.07] pt-2.5 pb-3 sm:pb-4 relative z-30 ${collapsed ? "px-2.5" : "px-3"}`}>
        {switchOpen && (
          <div className={`absolute bottom-full mb-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] shadow-xl overflow-hidden z-[100] ${collapsed ? "left-full ml-3 w-64" : "left-1 right-1 sm:left-2 sm:right-2"}`}>
            <div className="p-2.5 min-w-[200px]">
              <p className="px-2.5 py-1.5 text-xs font-semibold text-gray-500 mb-1">Switch Account</p>
              {accounts.length > 0 ? (
                <div className="scrollbar-none max-h-[200px] overflow-y-auto space-y-1">
                  {accounts.map((a) => {
                    const active = (user?.active_ig_account_id || accounts[0]?.id) === a.id;
                    return (
                      <button
                        key={a.id || a.ig_user_id}
                        type="button"
                        onClick={() => selectAccount(a)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors ${
                          active
                            ? "bg-gradient-to-r from-[#405DE6]/10 via-[#833AB4]/10 to-[#FD1D1D]/10 border border-[#833AB4]/30"
                            : "border border-transparent hover:bg-gray-50 dark:hover:bg-white/[0.05]"
                        }`}
                      >
                        <img src="/images/vone-logo.svg" alt="" className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-white/10" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-gray-900 dark:text-white">@{a.username || "instagram"}</p>
                          <p className={`text-[10px] ${active ? "text-ig-purple font-semibold" : "text-emerald-600 dark:text-emerald-400"}`}>
                            {active ? "Active" : "Connected"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="px-2.5 py-3 text-xs text-gray-500">No Instagram accounts linked</p>
              )}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setSwitchOpen((v) => !v)}
          className={`w-full flex items-center rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors ${collapsed ? "justify-center p-2" : "gap-3 px-3 py-2.5"}`}
        >
          <Avatar user={user} className="w-8 h-8 rounded-full" />
          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-bold truncate text-gray-900 dark:text-white">{user?.name || "Account"}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email || ""}</p>
            </div>
          )}
          {!collapsed && <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-[100dvh] max-w-full overflow-hidden bg-gray-50 dark:bg-[#0a0a0b] text-gray-900 dark:text-gray-100">
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[240] lg:hidden transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex relative h-full max-w-none shrink-0 flex-col bg-white dark:bg-[#101012] border-r border-gray-200/80 dark:border-white/[0.07] transition-[width] duration-200 ${collapsed ? "w-[72px]" : "w-64"}`}
      >
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      <aside className={`lg:hidden fixed top-0 left-0 h-full w-64 max-w-[85vw] z-[260] flex flex-col bg-white dark:bg-[#101012] border-r border-gray-200 dark:border-white/10 transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        {sidebar}
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="sticky top-0 z-[160] flex min-h-16 items-center justify-between gap-3 border-b border-gray-200 dark:border-white/[0.07] bg-white/90 dark:bg-[#101012]/90 backdrop-blur-md px-3 py-2 shadow-sm sm:px-6 sm:py-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] lg:hidden"
            >
              <Menu size={20} />
            </button>
            {collapsed && (
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                title="Expand Sidebar"
                className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06] lg:flex"
              >
                <PanelLeftOpen size={20} />
              </button>
            )}
            <nav className="flex min-w-0 items-center text-xs sm:text-sm font-medium">
              <button type="button" onClick={() => navigate("/dashboard")} className="shrink-0 hover:text-gray-900 dark:hover:text-white text-gray-500">
                Overview
              </button>
              {current && current.label !== "Overview" && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 mx-1.5 sm:mx-2 text-gray-300 dark:text-gray-600 shrink-0" />
                  <span className="text-gray-900 dark:text-white font-semibold truncate min-w-0">{current.label}</span>
                </>
              )}
            </nav>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setNotifOpen((v) => !v); setAccountOpen(false); }}
                aria-label="Notifications"
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] text-gray-500 shadow-sm hover:bg-gray-50 dark:hover:bg-white/[0.05]"
              >
                <Bell className="h-4.5 w-4.5" />
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] shadow-xl z-[180] overflow-hidden">
                    <div className="border-b border-gray-100 dark:border-white/[0.07] px-4 py-3 bg-gray-50/60 dark:bg-white/[0.02]">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">Notifications</p>
                      <p className="text-xs text-gray-500">{notifications.length ? `${notifications.length} update${notifications.length > 1 ? "s" : ""}` : "All caught up"}</p>
                    </div>
                    {notifications.length ? (
                      <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-white/[0.06]">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              if (n.id === "ig_connect") showError("Connect your Instagram using the button at the top of the dashboard.");
                              else navigate("/dashboard/support");
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                          >
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{n.title}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{n.body}</p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <Bell className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No notifications yet</p>
                        <p className="text-xs text-gray-500 mt-0.5">We'll alert you when something important happens</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Account dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => { setAccountOpen((v) => !v); setNotifOpen(false); }}
                className="relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] shadow-sm overflow-hidden p-0.5"
                aria-label="User Profile"
              >
                <Avatar user={user} className="w-full h-full rounded-lg" />
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#161618] shadow-xl z-[180] overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-white/[0.07] bg-gray-50/60 dark:bg-white/[0.02] flex items-center gap-2.5">
                      <Avatar user={user} className="h-9 w-9 rounded-xl" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate text-gray-900 dark:text-white">{user?.name || "Account"}</p>
                        {user?.email && <p className="text-xs text-gray-500 truncate">{user.email}</p>}
                      </div>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.05] text-sm font-medium text-gray-800 dark:text-gray-200"
                      >
                        <span className="flex items-center gap-2.5">
                          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />} Dark Mode
                        </span>
                        <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${isDarkMode ? "bg-[#833AB4]" : "bg-gray-300"}`}>
                          <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? "translate-x-4" : ""}`} />
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAccountOpen(false); navigate("/dashboard/account-settings"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/[0.05] text-sm font-medium text-gray-800 dark:text-gray-200"
                      >
                        <Settings size={16} /> Settings
                      </button>
                      <div className="my-1 border-t border-gray-100 dark:border-white/[0.07]" />
                      <button
                        type="button"
                        onClick={async () => { await logout(); navigate("/login"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-medium text-red-500"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto scrollbar-none p-3 pb-8 sm:p-4 sm:pb-10 lg:p-6 lg:pb-6" data-dashboard-section-scroll-root>
          <div className="animate-fadeIn relative min-h-full">
            {igLocked && (
              <div className="mb-5 rounded-3xl border border-[#833AB4]/25 bg-gradient-to-br from-[#405DE6]/[0.10] via-[#833AB4]/[0.08] to-[#FD1D1D]/[0.10] p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5">
                  <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-[#405DE6] via-[#833AB4] to-[#FD1D1D] text-white flex items-center justify-center">
                    <Instagram className="w-7 h-7" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-black uppercase tracking-widest text-ig-purple">First step</p>
                    <h2 className="mt-1 text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                      Connect your Instagram account
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Every dashboard tab is locked until you link your Instagram Business or Creator account with Meta.
                    </p>
                  </div>
                  <div className="w-full shrink-0 lg:w-auto">
                    <InstagramConnectButton full={false} label="Connect Instagram now" className="px-6" />
                  </div>
                </div>
              </div>
            )}
            <div className={igLocked ? "pointer-events-none select-none opacity-50 blur-[1.5px]" : ""}>
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
