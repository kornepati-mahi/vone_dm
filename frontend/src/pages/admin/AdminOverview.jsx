import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users, CreditCard, Receipt, LifeBuoy, Mail, Zap, TrendingUp, FileText, MessageSquare,
} from "lucide-react";
import Seo from "../../components/Seo.jsx";
import { get } from "../../lib/api.js";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await get("/api/admin/stats");
        if (alive) setStats(d.stats || d);
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const cards = [
    { key: "users_total", label: "Total Users", icon: Users, color: "from-[#405DE6] to-[#833AB4]", to: "/admin/users" },
    { key: "revenue_total", label: "Total Revenue", icon: Receipt, color: "from-emerald-500 to-teal-500", to: "/admin/transactions", money: true },
    { key: "revenue_month", label: "Revenue (Month)", icon: TrendingUp, color: "from-[#FCAF45] to-[#dc2743]", to: "/admin/transactions", money: true },
    { key: "automations_active", label: "Active Automations", icon: Zap, color: "from-[#833AB4] to-[#FD1D1D]", to: "/admin/automations" },
    { key: "tickets_open", label: "Open Tickets", icon: LifeBuoy, color: "from-sky-500 to-blue-600", to: "/admin/tickets" },
    { key: "contact_new", label: "New Messages", icon: Mail, color: "from-pink-500 to-rose-500", to: "/admin/contact" },
    { key: "blog_posts", label: "Blog Posts", icon: FileText, color: "from-violet-500 to-purple-600", to: "/admin/blog" },
    { key: "messages_sent", label: "Messages Sent", icon: MessageSquare, color: "from-cyan-500 to-teal-500", to: "/admin/automations" },
  ];

  return (
    <div className="space-y-6">
      <Seo title="Admin | vone_dm" noIndex />

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
              Administration
            </p>
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Admin Control Panel</h1>
            <p className="text-sm text-gray-300 max-w-xl">
              Manage users, plans, billing, support, and site content across the platform.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Link
              to="/admin/users"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-gray-900 font-bold text-sm hover:bg-gray-100 transition-all"
            >
              <Users className="w-4 h-4" /> Manage Users
            </Link>
            <Link
              to="/admin/settings"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-white/25 text-white font-bold text-sm hover:bg-white/10 transition-all"
            >
              <CreditCard className="w-4 h-4" /> Payment Settings
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 p-5 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link
            key={c.key}
            to={c.to}
            className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.color} text-white flex items-center justify-center`}>
                <c.icon className="w-4 h-4" />
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black">
              {loading ? "—" : c.money ? inr(stats?.[c.key] ?? 0) : stats?.[c.key] ?? 0}
            </p>
            <p className="text-xs text-gray-500 mt-1">{c.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Users Active / Total", value: loading ? "—" : `${stats?.users_active ?? 0} / ${stats?.users_total ?? 0}` },
          { label: "Pending Transactions", value: loading ? "—" : stats?.transactions_pending ?? 0 },
          { label: "Plans Configured", value: loading ? "—" : stats?.plans_count ?? 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-5 text-center">
            <p className="text-xl font-black">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
