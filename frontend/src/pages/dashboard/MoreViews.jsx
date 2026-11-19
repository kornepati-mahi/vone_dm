import { useEffect, useState } from "react";
import { BarChart3, MessageSquare, Send, Users, TrendingUp, Instagram, Save, Loader2, LifeBuoy, Link2, ExternalLink, Trash2, Zap, LogOut } from "lucide-react";
import Seo from "../../components/Seo.jsx";
import { get, put, post } from "../../lib/api.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useToast } from "../../lib/ToastContext.jsx";
import InstagramConnectButton from "../../components/InstagramConnectButton.jsx";

export function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await get("/api/dashboard/stats");
        if (alive) setData(d.stats || d);
      } catch {
        if (alive) setData({});
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const days = data?.daily || [];
  const max = Math.max(1, ...days.map((d) => Number(d.count || 0)));
  const totals = [
    { key: "messages_sent", label: "Messages Sent", icon: Send, color: "from-[#405DE6] to-[#833AB4]" },
    { key: "comments_handled", label: "Comments Handled", icon: MessageSquare, color: "from-[#FCAF45] to-[#dc2743]" },
    { key: "total_contacts", label: "Total Contacts", icon: Users, color: "from-emerald-500 to-teal-500" },
    { key: "automations_active", label: "Active Automations", icon: BarChart3, color: "from-[#833AB4] to-[#FD1D1D]" },
  ];

  return (
    <div className="space-y-6">
      <Seo title="Analytics | vone_dm Dashboard" noIndex />
      <div>
        <h1 className="text-xl sm:text-2xl font-black">Performance Analytics</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Track your campaign performance with detailed analytics and reports.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {totals.map((t) => (
          <div key={t.key} className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-5">
            <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${t.color} text-white flex items-center justify-center mb-3`}>
              <t.icon className="w-4 h-4" />
            </span>
            <p className="text-2xl font-black">{loading ? "—" : data?.[t.key] ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">{t.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-ig-purple" /> Last 14 days — actions
          </p>
          <span className="text-xs text-gray-500">Meta Graph API</span>
        </div>
        {loading ? (
          <div className="h-48 rounded-xl bg-gray-50 dark:bg-white/[0.03] animate-pulse" />
        ) : days.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center">
            <BarChart3 className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No activity in this period</p>
            <p className="text-xs text-gray-500 mt-1">Create an automation to start collecting data.</p>
          </div>
        ) : (
          <div className="flex items-end gap-2 h-48">
            {days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex-1 flex items-end">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-[#405DE6] to-[#833AB4] group-hover:opacity-80 transition-all min-h-[4px]"
                    style={{ height: `${(Number(d.count || 0) / max) * 100}%` }}
                    title={`${d.count} actions`}
                  />
                </div>
                <span className="text-[9px] text-gray-400">{String(d.day || "").slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function AccountSettings() {
  const { user, setUser, refresh, logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const [profile, setProfile] = useState({ name: "", email: "" });
  const [accounts, setAccounts] = useState([]);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [firstPassword, setFirstPassword] = useState("");
  const [busyP, setBusyP] = useState(false);
  const [busyW, setBusyW] = useState(false);
  const [busyFirst, setBusyFirst] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [busyDelete, setBusyDelete] = useState(false);
  const [webhook, setWebhook] = useState(null);
  const [busyWebhook, setBusyWebhook] = useState(false);
  const [pollResult, setPollResult] = useState(null);
  const [polling, setPolling] = useState(false);
  const [busyDisconnect, setBusyDisconnect] = useState(null);

  useEffect(() => {
    if (user) setProfile({ name: user.name || "", email: user.email || "" });
  }, [user]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await get("/api/instagram/accounts");
        if (alive) setAccounts(Array.isArray(d) ? d : d.accounts || []);
      } catch {
        if (alive) setAccounts([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusyP(true);
    try {
      const d = await put("/api/auth/profile", { name: profile.name });
      if (d && d.user) setUser(d.user);
      else await refresh();
      showSuccess("Profile updated.");
    } catch (err) {
      showError(err.message);
    } finally {
      setBusyP(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    if (passwords.next.length < 8) return showError("Password must be at least 8 characters long.");
    if (passwords.next !== passwords.confirm) return showError("Passwords do not match.");
    setBusyW(true);
    try {
      await post("/api/auth/change-password", {
        current_password: passwords.current,
        new_password: passwords.next,
      });
      showSuccess("Password updated successfully!");
      setPasswords({ current: "", next: "", confirm: "" });
    } catch (err) {
      showError(err.message);
    } finally {
      setBusyW(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await get("/api/instagram/webhook-config");
        if (alive) setWebhook(d);
      } catch {
        if (alive) setWebhook(null);
      }
    })();
    return () => { alive = false; };
  }, []);

  const disconnectAccount = async (account) => {
    if (!window.confirm(`Disconnect @${account.username || "this account"}?`)) return;
    setBusyDisconnect(account.id);
    try {
      await post("/api/instagram/disconnect", { account_id: account.id });
      const d = await get("/api/instagram/accounts");
      setAccounts(Array.isArray(d) ? d : d.accounts || []);
      await refresh();
      showSuccess("Instagram account disconnected.");
    } catch (err) {
      showError(err.message || "Could not disconnect account.");
    } finally {
      setBusyDisconnect(null);
    }
  };

  const runPoll = async () => {
    setPolling(true);
    setPollResult(null);
    try {
      const d = await post("/api/automations/poll", {});
      setPollResult(d);
      showSuccess(`Checked ${d.checked} comments · ${d.matched} matched · ${d.public_replies} replies · ${d.dms_sent} DMs sent.`);
    } catch (err) {
      showError(err.message || "Could not run automations.");
    } finally {
      setPolling(false);
    }
  };

  const enableWebhook = async () => {
    const account = accounts[0];
    if (!account) return showError("Connect an Instagram account first.");
    setBusyWebhook(true);
    try {
      await post("/api/instagram/subscribe", { account_id: account.id });
      showSuccess("Webhook activated. Automations will now fire on Instagram events.");
    } catch (err) {
      showError(err.message || "Could not activate the webhook.");
    } finally {
      setBusyWebhook(false);
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm("Permanently delete your account? This cannot be undone.")) return;
    setBusyDelete(true);
    try {
      await post("/api/account/delete", user?.hasPassword
        ? { password: deleteConfirm }
        : { confirm: deleteConfirm });
      await logout();
      window.location.href = "/login?message=" + encodeURIComponent("Your account has been deleted.");
    } catch (err) {
      showError(err.message || "Could not delete your account.");
      setBusyDelete(false);
    }
  };

  const saveFirstPassword = async (e) => {
    e.preventDefault();
    if (firstPassword.length < 8) return showError("Password must be at least 8 characters long.");
    setBusyFirst(true);
    try {
      await post("/api/account/set-password", { password: firstPassword });
      showSuccess("Password set successfully!");
      setFirstPassword("");
      await refresh();
    } catch (err) {
      showError(err.message || "Failed to set password.");
    } finally {
      setBusyFirst(false);
    }
  };

  return (
    <div className="space-y-6">
      <Seo title="Account Settings | vone_dm Dashboard" noIndex />
      <div>
        <h1 className="text-xl sm:text-2xl font-black">Account Settings</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Manage your profile, password, and connected accounts.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <form onSubmit={saveProfile} className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
          <h2 className="font-black mb-4">Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Full Name</label>
              <input
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Email Address</label>
              <input
                value={profile.email}
                disabled
                className="w-full text-sm rounded-xl border border-gray-200 dark:border-white/10 px-3.5 py-3 bg-gray-50 dark:bg-white/[0.03] text-gray-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busyP}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-bold disabled:opacity-60"
          >
            {busyP ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
          </button>
        </form>

        {!user?.hasPassword && (
          <form onSubmit={saveFirstPassword} className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
            <h2 className="font-black mb-1">Set a Password</h2>
            <p className="text-xs text-gray-500 mb-4">
              You signed in with Google. Add a password so you can also log in with your email.
            </p>
            <input
              type="password"
              value={firstPassword}
              onChange={(e) => setFirstPassword(e.target.value)}
              placeholder="New password (8+ characters)"
              className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
              required
            />
            <button
              type="submit"
              disabled={busyFirst}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-bold disabled:opacity-60"
            >
              {busyFirst ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Set Password
            </button>
          </form>
        )}

        {user?.hasPassword && (
        <form onSubmit={savePassword} className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
          <h2 className="font-black mb-4">Change Password</h2>
          <div className="space-y-4">
            {[
              { k: "current", label: "Current Password" },
              { k: "next", label: "New Password" },
              { k: "confirm", label: "Confirm New Password" },
            ].map((f) => (
              <div key={f.k}>
                <label className="block text-sm font-semibold mb-1.5">{f.label}</label>
                <input
                  type="password"
                  value={passwords[f.k]}
                  onChange={(e) => setPasswords((p) => ({ ...p, [f.k]: e.target.value }))}
                  className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
                  required
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={busyW}
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-bold disabled:opacity-60"
          >
            {busyW ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Update Password
          </button>
        </form>
        )}
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="font-black flex items-center gap-2">
              <Instagram className="w-4 h-4 text-pink-500" /> Instagram Accounts
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Connect your Instagram Business or Creator account. Account must be public.
            </p>
          </div>
          <InstagramConnectButton full={false} className="!py-2.5 shrink-0" />
        </div>
        {accounts.length === 0 ? (
          <div className="text-center py-8 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            <Instagram className="w-8 h-8 mx-auto text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No account connected</p>
            <p className="text-xs text-gray-500 mt-1">We'll only access permissions needed for DM automation.</p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {accounts.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold truncate">@{a.username || a.ig_user_id}</p>
                  <p className="text-[11px] text-gray-500 break-all">ID {a.ig_user_id} · {a.account_type || "Business"} · connected {a.connected_at ? new Date(a.connected_at).toLocaleDateString() : "recently"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md">
                    {a.status || "active"}
                  </span>
                  <button
                    type="button"
                    onClick={() => disconnectAccount(a)}
                    disabled={busyDisconnect === a.id}
                    title="Log out / disconnect this account"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-900/60 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 text-[11px] font-bold disabled:opacity-50"
                  >
                    {busyDisconnect === a.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                    Logout
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
        <h2 className="font-black mb-1">Automation Delivery</h2>
        <p className="text-xs text-gray-500 mb-4">
          Run automations on your recent comments, or copy these into your Meta app's webhook settings for live delivery.
        </p>
        <button
          type="button"
          onClick={runPoll}
          disabled={polling}
          className="mb-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#405DE6] to-[#833AB4] text-white text-sm font-bold disabled:opacity-60"
        >
          {polling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Run automations now
        </button>
        {pollResult && (
          <p className="mb-4 text-[11px] text-gray-500">
            Checked {pollResult.checked} · matched {pollResult.matched} · public replies {pollResult.public_replies} · DMs sent {pollResult.dms_sent} · DMs blocked {pollResult.dms_failed}
          </p>
        )}
        <div className="space-y-2 text-xs">
          <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-3">
            <p className="font-bold text-gray-500">Callback URL</p>
            <p className="font-mono break-all mt-0.5">{webhook?.callback_url || "—"}</p>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-3">
            <p className="font-bold text-gray-500">Verify token</p>
            <p className="font-mono break-all mt-0.5">{webhook?.verify_token || "—"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={enableWebhook}
          disabled={busyWebhook || accounts.length === 0}
          className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-bold disabled:opacity-60"
        >
          {busyWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />} Activate webhook
        </button>
      </div>

      <div className="rounded-2xl border border-red-100 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 p-6">
        <h2 className="font-black text-red-600 dark:text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-red-600/80 dark:text-red-300/80 mb-4">
          Deleting your account will permanently remove all your data, campaigns, and settings. This action is
          permanent and cannot be undone.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="password"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder={user?.hasPassword ? "Enter your password" : "Type DELETE"}
            className="flex-1 text-sm rounded-xl border border-red-200 dark:border-red-900/60 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-red-500"
          />
          <button
            type="button"
            onClick={deleteAccount}
            disabled={busyDelete || !deleteConfirm}
            className="px-5 py-3 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {busyDelete && <Loader2 className="w-4 h-4 animate-spin" />} Delete My Account
          </button>
          <a
            href="/delete-account-guide"
            className="px-5 py-3 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-bold text-center"
          >
            Read Guide
          </a>
        </div>
      </div>
    </div>
  );
}

export function Support() {
  const { showSuccess, showError } = useToast();
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await get("/api/support/tickets");
        if (alive) setTickets(Array.isArray(d) ? d : d.tickets || []);
      } catch {
        if (alive) setTickets([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || form.message.trim().length < 10) {
      return showError("Please add a subject and at least 10 characters of detail.");
    }
    setBusy(true);
    try {
      const d = await post("/api/support/tickets", form);
      if (d && d.ticket) setTickets((t) => [d.ticket, ...t]);
      setForm({ subject: "", message: "" });
      showSuccess("Ticket created! Our team will reply by email.");
    } catch (err) {
      showError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Seo title="Support | vone_dm Dashboard" noIndex />
      <div>
        <h1 className="text-xl sm:text-2xl font-black">Support</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Our automation experts are here to help.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <form onSubmit={submit} className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
          <h2 className="font-black mb-4 flex items-center gap-2">
            <LifeBuoy className="w-4 h-4 text-ig-purple" /> Open a Ticket
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Subject</label>
              <input
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Automation not firing"
                className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                rows={5}
                placeholder="Describe what you expected versus what happened, including any error text..."
                className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple resize-y"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="mt-5 px-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Submit Ticket
          </button>
        </form>

        <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
          <h2 className="font-black mb-4">Your Tickets</h2>
          {tickets.length === 0 ? (
            <div className="text-center py-10">
              <LifeBuoy className="w-8 h-8 mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No tickets yet</p>
              <p className="text-xs text-gray-500 mt-1">Most questions are answered within 24 hours.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {tickets.map((t) => (
                <li key={t.id} className="px-4 py-3 rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-bold truncate">{t.subject}</p>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                        t.status === "resolved"
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-amber-500/15 text-amber-600"
                      }`}
                    >
                      {t.status || "open"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{t.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5">{t.created_at ? new Date(t.created_at).toLocaleString() : ""}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/[0.06] text-xs text-gray-500">
            Or email <a href="mailto:saichanduvlk@gmail.com" className="text-ig-purple font-semibold">saichanduvlk@gmail.com</a> directly.
          </div>
        </div>
      </div>
    </div>
  );
}

export function SuperProfileView() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ bio: "", links: [] });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await get("/api/superprofile");
        if (alive) {
          const p = d.profile || d;
          if (p && p.id) {
            setProfile(p);
            setForm({ bio: p.bio || "", links: Array.isArray(p.links) ? p.links : (typeof p.links === "string" ? JSON.parse(p.links || "[]") : []) });
          }
        }
      } catch {
        /* not created yet */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { bio: form.bio, links: JSON.stringify(form.links || []) };
      const d = profile && profile.id ? await put(`/api/superprofile`, payload) : await post("/api/superprofile", payload);
      const p = (d && d.profile) || { id: 1, ...payload };
      setProfile(p);
      showSuccess("Super Profile saved.");
    } catch (err) {
      showError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Seo title="Super Profile | vone_dm Dashboard" noIndex />
      <div>
        <h1 className="text-xl sm:text-2xl font-black">Super Profile (Link in Bio)</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Create a public link-in-bio page with branded buttons, icons, and ordered links for your Instagram account.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <form onSubmit={save} className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
          <h2 className="font-black mb-4 flex items-center gap-2">
            <Link2 className="w-4 h-4 text-ig-purple" /> Page Settings
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                placeholder="Tell visitors what you do..."
                className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple resize-y"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold">Links</label>
                <button
                  type="button"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      links: [...(f.links || []), { title: "", url: "", icon: "Link2" }],
                    }))
                  }
                  className="text-xs font-bold text-ig-purple hover:underline"
                >
                  + Add link
                </button>
              </div>
              <div className="space-y-2">
                {(form.links || []).map((l, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <input
                      value={l.title || ""}
                      onChange={(e) => {
                        const next = [...form.links];
                        next[i] = { ...next[i], title: e.target.value };
                        setForm((f) => ({ ...f, links: next }));
                      }}
                      placeholder="Title"
                      className="flex-1 min-w-[120px] text-xs rounded-lg border border-gray-300 dark:border-neutral-700 px-2.5 py-2 bg-white dark:bg-neutral-950"
                    />
                    <input
                      value={l.url || ""}
                      onChange={(e) => {
                        const next = [...form.links];
                        next[i] = { ...next[i], url: e.target.value };
                        setForm((f) => ({ ...f, links: next }));
                      }}
                      placeholder="https://..."
                      className="flex-1 min-w-[160px] text-xs rounded-lg border border-gray-300 dark:border-neutral-700 px-2.5 py-2 bg-white dark:bg-neutral-950"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = form.links.filter((_, j) => j !== i);
                        setForm((f) => ({ ...f, links: next }));
                      }}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(!form.links || form.links.length === 0) && (
                  <p className="text-xs text-gray-400 italic">No links. Click “+ Add link”.</p>
                )}
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={busy || loading}
            className="mt-5 px-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
          </button>
        </form>

        <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
          <h2 className="font-black mb-4">Preview</h2>
          <div className="mx-auto w-full max-w-xs rounded-[28px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0d0d0f] p-5 text-center shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#405DE6] to-[#833AB4] mb-3 flex items-center justify-center text-white text-xl font-black">
              {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
            </div>
            <p className="font-black text-sm">@{profile?.slug || user?.name?.toLowerCase().replace(/\s+/g, "") || "your-profile"}</p>
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{form.bio || "Your bio appears here"}</p>
            <div className="mt-4 space-y-2">
              {(() => {
                let links = Array.isArray(form.links) ? form.links : [];
                try { if (typeof form.links === "string") links = JSON.parse(form.links || "[]"); } catch {}
                if (!Array.isArray(links) || links.length === 0) {
                  return <p className="text-[11px] text-gray-400 py-3">Add links to see them here</p>;
                }
                return links.slice(0, 6).map((l, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 py-2.5 text-xs font-bold shadow-sm"
                  >
                    {l.title || l.label || "Link"}
                  </div>
                ));
              })()}
            </div>
            <p className="mt-4 text-[10px] text-gray-400 flex items-center justify-center gap-1">
              <ExternalLink className="w-3 h-3" /> Powered by vone_dm
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
