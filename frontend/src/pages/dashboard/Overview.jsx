import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Send,
  Users,
  TrendingUp,
  ArrowUpRight,
  Zap,
  Plus,
  Instagram,
  BarChart3,
} from "lucide-react";
import Seo from "../../components/Seo.jsx";
import { get, post } from "../../lib/api.js";
import { useAuth } from "../../lib/AuthContext.jsx";

const CARDS = [
  { key: "messages_sent", label: "Messages Sent", icon: Send, color: "from-[#405DE6] to-[#833AB4]" },
  { key: "automations_active", label: "Active Automations", icon: Zap, color: "from-[#833AB4] to-[#FD1D1D]" },
  { key: "comments_handled", label: "Comments Handled", icon: MessageSquare, color: "from-[#FCAF45] to-[#dc2743]" },
  { key: "total_contacts", label: "Contacts", icon: Users, color: "from-emerald-500 to-teal-500" },
];

const QUICK_LINKS = [
  { to: "/dashboard/post-automation", label: "Post Comment → DM" },
  { to: "/dashboard/reel-automation", label: "Reel Comment → DM" },
  { to: "/dashboard/story-automation", label: "Story Mention" },
  { to: "/dashboard/reply-templates", label: "Reply Templates" },
  { to: "/dashboard/super-profile", label: "Super Profile" },
  { to: "/dashboard/analytics", label: "Analytics" },
];

function Gauge({ value = 0, label }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  const r = 40;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" strokeWidth="10" className="stroke-gray-100 dark:stroke-white/10" />
        <circle
          cx="55"
          cy="55"
          r={r}
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * pct) / 100}
          transform="rotate(-90 55 55)"
          className="stroke-ig-purple transition-all duration-1000"
        />
        <text x="55" y="60" textAnchor="middle" className="fill-gray-900 dark:fill-white font-black text-lg">
          {Math.round(pct)}%
        </text>
      </svg>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  );
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await get("/api/dashboard/stats");
        if (alive) setStats(s.stats || s);
      } catch {
        if (alive) setStats({});
      }
      try {
        const r = await get("/api/automations");
        if (alive) setRecent((Array.isArray(r) ? r : r.automations || []).slice(0, 5));
      } catch {
        if (alive) setRecent([]);
      }
      // Automatically run matching automations on recent comments each time
      // the dashboard is opened (no cron required in local development).
      try {
        await post("/api/automations/poll", {});
      } catch {
        /* silently ignore — the manual button in Account Settings remains */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const usage = Number(stats?.usage_percent ?? 0);

  return (
    <div className="space-y-6">
      <Seo title="Dashboard | vone_dm" noIndex />

      {/* Welcome */}
      <div className="rounded-3xl overflow-hidden relative bg-gray-900 p-6 sm:p-8">
        <div
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse at 15% 20%, rgba(64,93,230,0.5) 0%, transparent 55%), radial-gradient(ellipse at 85% 80%, rgba(131,58,180,0.45) 0%, transparent 55%)",
          }}
        />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-purple-300 mb-2">
              Certified Meta Business Partner
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Welcome back, {user?.name?.split(" ")[0] || "Creator"} 👋
            </h1>
            <p className="text-sm text-gray-300 max-w-xl">
              Your automations are running 24/7 through the official Meta Graph API. Track performance, build
              templates, and grow your audience below.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/dashboard/post-automation"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-gray-900 font-bold text-sm hover:bg-gray-100 transition-all"
            >
              <Plus className="w-4 h-4" /> New Automation
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/25 text-white font-bold text-sm hover:bg-white/10 transition-all"
            >
              Upgrade Plan <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARDS.map((c) => (
          <div
            key={c.key}
            className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center`}>
                <c.icon className="w-4 h-4" />
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black">{loading ? "—" : stats?.[c.key] ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Usage */}
        <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6 flex flex-col items-center justify-center">
          <p className="text-sm font-bold mb-3 self-start">Monthly Plan Usage</p>
          <Gauge value={usage} label={loading ? "Loading..." : `${stats?.actions_used ?? 0} / ${stats?.actions_limit ?? "∞"} actions`} />
          <Link to="/dashboard/my-plan" className="mt-4 text-xs font-bold text-ig-purple hover:underline">
            View My Plan →
          </Link>
        </div>

        {/* Recent automations */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold">Recent Automations</p>
            <Link to="/dashboard/dm-automation" className="text-xs font-bold text-ig-purple hover:underline">
              View all →
            </Link>
          </div>
          {loading ? (
            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-50 dark:bg-white/[0.03] animate-pulse" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-8 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
              <Instagram className="w-8 h-8 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No automations yet</p>
              <p className="text-xs text-gray-500 mt-1">Connect an Instagram account and create your first flow.</p>
              <Link
                to="/dashboard/post-automation"
                className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" /> Create Automation
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recent.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{a.name || a.keyword || "Automation"}</p>
                    <p className="text-xs text-gray-500 capitalize">{(a.type || "dm").replace(/-/g, " ")}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                      a.status === "active"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-gray-200 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                    }`}
                  >
                    {a.status || "inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
        <p className="text-sm font-bold mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-ig-purple" /> Quick Actions
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_LINKS.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] px-3 py-3.5 text-xs font-semibold text-center hover:border-ig-purple/40 hover:text-ig-purple transition-all"
            >
              {q.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
