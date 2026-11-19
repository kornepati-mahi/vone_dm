import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, CreditCard, Zap, Clock } from "lucide-react";
import Seo from "../../components/Seo.jsx";
import { get } from "../../lib/api.js";
import CheckoutModal from "../../components/CheckoutModal.jsx";
import { useAuth } from "../../lib/AuthContext.jsx";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export function MyPlan() {
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [checkout, setCheckout] = useState(null);
  const { refresh } = useAuth();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const p = await get("/api/my-plan");
        if (alive) setData(p);
      } catch {
        if (alive) setData({});
      }
      try {
        const pl = await get("/api/pricing");
        if (alive) setPlans(Array.isArray(pl) ? pl : pl.plans || []);
      } catch {
        if (alive) setPlans([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const current = data?.plan || null;
  const usage = data?.usage || {};
  const limit = Number(usage.monthly_limit || 0);
  const used = Number(usage.monthly_used || 0);
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;

  return (
    <div className="space-y-6">
      <Seo title="My Plan | vone_dm Dashboard" noIndex />
      <div>
        <h1 className="text-xl sm:text-2xl font-black">My Plan</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Your subscription, action quota, and upgrade options.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6">
          {loading ? (
            <div className="h-40 rounded-xl bg-gray-50 dark:bg-white/[0.03] animate-pulse" />
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-gray-400">Current Plan</p>
                  <h2 className="text-2xl font-black mt-1">{current?.name || "Free Plan"}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {current?.price_monthly_inr > 0
                      ? `${inr(current.price_monthly_inr)}/month per Instagram account`
                      : "Free forever"}
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  {data?.status || "active"}
                </span>
              </div>

              <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-bold flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-ig-purple" /> Monthly actions
                  </span>
                  <span className="text-gray-500">
                    {used.toLocaleString()} / {limit > 0 ? limit.toLocaleString() : "Unlimited"}
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#405DE6] to-[#833AB4] transition-all duration-700"
                    style={{ width: `${limit > 0 ? pct : 4}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3 mt-5 text-center">
                  {[
                    { l: "Per Hour", v: usage.hourly_limit ?? "—" },
                    { l: "Per Day", v: usage.daily_limit ?? "—" },
                    { l: "Expires", v: data?.expires_at ? new Date(data.expires_at).toLocaleDateString() : "—" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] py-3">
                      <p className="text-sm font-black">{s.v}</p>
                      <p className="text-[10px] uppercase tracking-wider text-gray-500 mt-0.5">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#405DE6] to-[#833AB4] text-white p-6 flex flex-col justify-between">
          <div>
            <CreditCard className="w-7 h-7 mb-4 opacity-90" />
            <h3 className="text-lg font-black mb-2">Unlock unlimited actions</h3>
            <p className="text-sm text-white/85 leading-relaxed">
              Pro removes hourly, daily, and monthly caps for unlimited automation.
            </p>
          </div>
          <Link
            to="/pricing"
            className="mt-6 block text-center px-5 py-3 rounded-xl bg-white text-gray-900 font-bold text-sm hover:bg-gray-100 transition-all"
          >
            View Pricing Plans
          </Link>
        </div>
      </div>

      {/* Upgrade options */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-lg">Available Plans</h2>
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/[0.05] text-xs">
            <button
              onClick={() => setYearly(false)}
              className={`px-3 py-1.5 rounded-lg font-bold ${!yearly ? "bg-white shadow dark:bg-white/15" : "text-gray-500"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-3 py-1.5 rounded-lg font-bold ${yearly ? "bg-white shadow dark:bg-white/15" : "text-gray-500"}`}
            >
              Yearly
            </button>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {plans.map((p) => {
            const price = yearly ? p.price_yearly_monthly_inr : p.price_monthly_inr;
            const isCurrent = (current?.plan_code || "free") === p.plan_code;
            return (
              <div
                key={p.plan_code}
                className={`rounded-2xl border p-5 flex flex-col ${
                  p.is_popular
                    ? "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20"
                    : "border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.03]"
                }`}
              >
                {p.is_popular && (
                  <span className="self-start text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2 py-0.5 rounded-full mb-3">
                    Most Popular
                  </span>
                )}
                <h3 className="font-black">{p.name}</h3>
                <p className="text-2xl font-black mt-2">
                  {p.plan_code === "free" ? "Free" : inr(price)}
                  {p.plan_code !== "free" && <span className="text-xs font-semibold text-gray-500">/mo</span>}
                </p>
                <ul className="mt-4 space-y-1.5 flex-1">
                  {(p.feature_items || []).filter((f) => f.enabled).slice(0, 5).map((f) => (
                    <li key={f.key || f.label} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
                      <Check className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
                      {f.label}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    if (isCurrent) return;
                    if (p.plan_code === "free") return;
                    setCheckout({ plan: p, cycle: yearly ? "yearly" : "monthly" });
                  }}
                  className={`mt-4 block w-full text-center py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isCurrent
                      ? "border border-gray-300 dark:border-white/15 text-gray-500"
                      : "bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90"
                  }`}
                >
                  {isCurrent ? "Current Plan" : p.button_text || "Choose Plan"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <CheckoutModal
        open={!!checkout}
        plan={checkout?.plan}
        cycle={checkout?.cycle}
        onClose={() => setCheckout(null)}
        onSuccess={async () => {
          try {
            const p = await get("/api/my-plan");
            setData(p);
          } catch {}
          try {
            await refresh();
          } catch {}
        }}
      />
    </div>
  );
}

export function Transactions() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await get("/api/transactions");
        if (alive) setRows(Array.isArray(d) ? d : d.transactions || []);
      } catch {
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-5">
      <Seo title="Transactions | vone_dm Dashboard" noIndex />
      <div>
        <h1 className="text-xl sm:text-2xl font-black">Transactions</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Payment history for your subscriptions.</p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-gray-50 dark:bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-9 h-9 mx-auto text-gray-300 mb-3" />
            <p className="font-bold text-gray-600 dark:text-gray-300">No transactions yet</p>
            <p className="text-sm text-gray-500 mt-1">Your payments will appear here after checkout.</p>
            <Link to="/pricing" className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-bold">
              View Plans
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/[0.03] text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3 font-black">Date</th>
                  <th className="px-5 py-3 font-black">Plan</th>
                  <th className="px-5 py-3 font-black">Amount</th>
                  <th className="px-5 py-3 font-black">Method</th>
                  <th className="px-5 py-3 font-black">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3.5 font-bold">{r.plan_name || r.plan_code || "—"}</td>
                    <td className="px-5 py-3.5 font-bold">{inr(r.amount)}</td>
                    <td className="px-5 py-3.5 text-gray-500">{r.method || "UPI"}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                          r.status === "success"
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : r.status === "failed"
                            ? "bg-red-500/15 text-red-500"
                            : "bg-gray-100 text-gray-500 dark:bg-white/10"
                        }`}
                      >
                        {r.status || "pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
