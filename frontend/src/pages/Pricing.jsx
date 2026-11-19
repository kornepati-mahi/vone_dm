import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, ChevronDown, ChevronUp, ShieldCheck, Zap, HelpCircle } from "lucide-react";
import Seo from "../components/Seo.jsx";
import RevealSection from "../components/RevealSection.jsx";
import { get } from "../lib/api.js";
import { useAuth } from "../lib/AuthContext.jsx";
import { useContent } from "../lib/content.jsx";
import CheckoutModal from "../components/CheckoutModal.jsx";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

function Faq({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-white">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 shrink-0 text-ig-purple" />
        ) : (
          <ChevronDown className="w-4 h-4 shrink-0 text-gray-400" />
        )}
      </button>
      {open && (
        <p className="px-5 sm:px-6 pb-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

// Curated highlights so each plan card reads differently at a glance.
const HIGHLIGHTS = {
  free: [
    "unlimited_contacts", "post_comment_dm_reply", "post_comment_reply_automation",
    "reel_comment_dm_reply", "reel_comment_reply_automation",
  ],
  basic: [
    "followers_only", "once_per_user_24h", "comment_moderation",
    "seen_typing", "welcome_message", "super_profile",
  ],
  pro: [
    "dm_automation", "story_automation", "global_trigger", "mentions",
    "instagram_live_automation", "priority_support", "no_watermark",
  ],
};

function PlanCard({ plan, yearly, onChoose }) {
  const { isAuthenticated } = useAuth();
  const price = yearly ? plan.price_yearly_monthly_inr : plan.price_monthly_inr;
  const yearlyTotal = plan.price_yearly_inr;
  const allItems = plan.feature_items || [];
  const enabled = allItems.filter((f) => f.enabled);
  const keys = HIGHLIGHTS[plan.plan_code];
  const preview = keys
    ? keys.map((k) => allItems.find((f) => f.key === k)).filter(Boolean)
    : enabled.slice(0, 7);
  const extra = Math.max(0, enabled.length - preview.length);
  const [showAll, setShowAll] = useState(false);
  const isFree = plan.plan_code === "free";
  const isPro = plan.plan_code === "pro";
  const isPopular = plan.is_popular;
  const fmt = (n) => (isFree ? "Free" : inr(n));

  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl p-4 sm:p-7 transition-all duration-300 hover:translate-y-[-2px] ${
        isPopular
          ? "z-10 border-2 border-purple-500 bg-gradient-to-b from-purple-50/70 via-white to-white shadow-2xl shadow-purple-500/15 ring-2 ring-purple-500/20 dark:border-purple-500/50 dark:bg-gradient-to-b dark:from-purple-950/40 dark:via-neutral-900 dark:to-neutral-950 dark:ring-purple-500/30"
          : isPro
          ? "border-2 border-purple-500/40 bg-gradient-to-b from-purple-50/50 via-white to-white shadow-xl hover:border-purple-500/60 dark:border-purple-500/40 dark:from-purple-950/25 dark:via-neutral-900/60 dark:to-neutral-950"
          : "border border-gray-200 bg-white hover:border-gray-300 hover:shadow-xl dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/[0.14]"
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 max-w-[calc(100%-1.5rem)] truncate rounded-full bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 px-4 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg shadow-purple-500/25">
          Most Popular
        </div>
      )}
      {isPro && !isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-md whitespace-nowrap">
          Includes {yearly ? "₹14,107" : "₹1,297"} Free Tools
        </div>
      )}

      <div>
        <div className="mb-6 pt-2">
          <h3 className="text-xl font-black">{plan.name}</h3>
          <div className="mt-3 flex items-baseline gap-1.5 flex-wrap">
            <span className="text-3xl font-black sm:text-4xl">{fmt(price)}</span>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">/month per account</span>
          </div>
          {isFree ? (
            <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              Free forever for testing and basic automations
            </p>
          ) : (
            <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
              {yearly && yearlyTotal > 0
                ? `Billed annually at ${inr(yearlyTotal)}/year`
                : "Billed monthly, cancel anytime"}
            </p>
          )}
          {plan.yearly_bonus && yearly && (
            <p className="mt-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{plan.yearly_bonus}</p>
          )}
        </div>

        <div className="space-y-2.5 mb-6">
          {(showAll ? allItems : preview).map((f) => (
            <div key={f.key || f.label} className="flex items-start gap-2.5 text-sm">
              {f.enabled ? (
                <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
              ) : (
                <X className="w-4 h-4 mt-0.5 shrink-0 text-gray-300 dark:text-gray-600" />
              )}
              <span className={`whitespace-pre-line ${f.enabled ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-500 line-through"}`}>
                {f.label}
              </span>
            </div>
          ))}
          {!showAll && extra > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="flex items-center gap-1 text-xs font-bold text-ig-purple hover:underline pt-1"
            >
              <ChevronDown className="w-3.5 h-3.5" /> View all features ({extra} more)
            </button>
          )}
          {showAll && extra > 0 && (
            <button
              onClick={() => setShowAll(false)}
              className="flex items-center gap-1 text-xs font-bold text-ig-purple hover:underline pt-1"
            >
              <ChevronUp className="w-3.5 h-3.5" /> Show fewer features
            </button>
          )}
        </div>

        <div className="rounded-xl bg-gray-50 dark:bg-white/[0.04] p-3.5 text-xs space-y-1.5 mb-6 border border-gray-100 dark:border-white/[0.06]">
          <p className="font-bold text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Account Limits
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Hour:{" "}
            <strong>
              {isPro ? "Meta rate limits" : plan.actions_per_hour_limit ?? "—"}
            </strong>
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Day: <strong>{isPro ? "Unlimited" : plan.actions_per_day_limit ?? "—"}</strong>
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            Month: <strong>{isPro ? "Unlimited" : plan.actions_per_month_limit ?? "—"}</strong>
          </p>
        </div>
      </div>

      <div>
        <button
          onClick={() => {
            if (isAuthenticated) onChoose(plan, yearly);
            else window.location.href = "/login?mode=register";
          }}
          className={`block w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
            isPopular || isPro
              ? "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 hover:opacity-95"
              : "bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90"
          }`}
        >
          {isFree ? (isAuthenticated ? "Current Plan Options" : plan.button_text || "Choose Plan") : isAuthenticated ? "Upgrade to Plan" : plan.button_text || "Choose Plan"}
        </button>
        <p className="mt-3 text-[11px] text-center text-gray-500 dark:text-gray-400">
          {isFree ? "No credit card required" : "1 Instagram account · Cancel anytime"}
        </p>
      </div>
    </div>
  );
}

export default function Pricing() {
  const [yearly, setYearly] = useState(false);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showComparison, setShowComparison] = useState(true);
  const { value: pricingContent } = useContent("pricing");
  const FAQS = pricingContent?.faqs || [];
  const COMPARISON = pricingContent?.comparison || [];
  const [checkout, setCheckout] = useState(null); // { plan, cycle }

  const choosePlan = (plan, isYearly) => {
    if (plan.plan_code === "free") {
      window.location.href = "/dashboard/my-plan";
      return;
    }
    setCheckout({ plan, cycle: isYearly ? "yearly" : "monthly" });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await get("/api/pricing");
        if (alive) {
          const list = Array.isArray(data) ? data : data.plans || [];
          setPlans(list);
        }
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

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
      <Seo
        title="Pricing Plans | vone_dm - Flexible Instagram Automation"
        description="Find the best pricing plan for automating your Instagram DMs. Start free, upgrade as you grow. Safe, certified, and compliant pricing."
        keywords="dm panda pricing, instagram dm bot pricing, cheap instagram dm automations, instagram auto reply cost"
        schema={[
          { "@context": "https://schema.org", "@type": "WebPage", name: "Pricing Plans | vone_dm", url: "https://vone-dm.com/pricing" },
        ]}
      />

      <section className="pt-28 sm:pt-32 pb-10 sm:pb-14 bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-950/20 dark:to-neutral-950 border-b border-gray-100 dark:border-white/[0.05]">
        <div className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#405DE6]/10 via-[#833AB4]/10 to-[#FCAF45]/10 border border-purple-500/20 text-[#833AB4] dark:text-purple-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-5">
            <Zap className="w-3.5 h-3.5" /> Simple, Transparent Pricing
          </div>
          <h1 className="mb-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Flexible Plans for Every Creator
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400 sm:text-lg lg:text-xl leading-relaxed max-w-3xl mx-auto">
            Choose the plan that fits your growth. Start completely free and upgrade per account as your audience
            expands.
          </p>

          <div className="mt-8 flex justify-center">
            <div className="relative inline-flex items-center rounded-2xl bg-gray-100 p-1.5 shadow-inner dark:bg-white/[0.06] border border-gray-200/60 dark:border-white/[0.08]">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={`relative z-10 rounded-xl px-4 py-2 sm:px-8 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-300 ${
                  !yearly
                    ? "bg-white text-gray-900 shadow-md dark:bg-white/[0.12] dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={`relative z-10 flex items-center gap-1.5 sm:gap-2 rounded-xl px-4 py-2 sm:px-8 sm:py-3 text-xs sm:text-sm font-bold transition-all duration-300 ${
                  yearly
                    ? "bg-white text-gray-900 shadow-md dark:bg-white/[0.12] dark:text-white"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                <span>Yearly</span>
                <span className="shrink-0 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Save 20%+
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-10 sm:py-14">
        {loading ? (
          <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8 items-stretch justify-center mx-auto max-w-6xl min-h-[580px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-3xl border border-gray-200/80 bg-gray-50/50 p-8 dark:border-white/[0.08] dark:bg-white/[0.02] animate-pulse min-h-[580px]" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500 font-semibold mb-4">Could not load pricing plans.</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl bg-gray-900 text-white font-bold text-sm"
            >
              Retry
            </button>
          </div>
        ) : (
          <div
            className={`mb-16 grid grid-cols-1 gap-6 sm:mb-24 sm:grid-cols-2 lg:gap-8 items-stretch justify-center mx-auto min-h-[580px] ${
              plans.length <= 3 ? "lg:grid-cols-3 max-w-6xl" : "lg:grid-cols-4 max-w-7xl"
            }`}
          >
            {plans.map((p) => (
              <PlanCard key={p.id || p.plan_code} plan={p} yearly={yearly} onChoose={choosePlan} />
            ))}
          </div>
        )}

        {/* Comparison */}
        <div className="max-w-5xl mx-auto">
          <RevealSection>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-black mb-2">Compare All Features Side by Side</h2>
              <button
                onClick={() => setShowComparison((v) => !v)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-ig-purple hover:underline"
              >
                {showComparison ? "Hide comparison" : "View all features"}
                {showComparison ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </RevealSection>

          {showComparison && (
            <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-white/[0.08]">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-neutral-900">
                    <th className="sticky left-0 bg-gray-50 p-4 sm:p-5 text-sm font-black text-gray-900 dark:bg-neutral-900 dark:text-white text-left">
                      Feature
                    </th>
                    <th className="p-4 text-center font-black">Free</th>
                    <th className="p-4 text-center font-black">Basic</th>
                    <th className="p-4 text-center font-black text-ig-purple">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row) => (
                    <tr key={row.feature} className="border-t border-gray-100 dark:border-white/[0.06]">
                      <td className="sticky left-0 bg-white p-4 text-sm font-semibold text-gray-900 dark:bg-neutral-950 dark:text-gray-200">
                        {row.feature}
                      </td>
                      {[row.free, row.basic, row.pro].map((ok, i) => (
                        <td key={i} className="p-4 text-center">
                          {ok ? (
                            <Check className="w-5 h-5 mx-auto text-emerald-500" />
                          ) : (
                            <X className="w-5 h-5 mx-auto text-gray-300 dark:text-gray-600" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Perks banner */}
      <section className="py-14 sm:py-16 bg-gray-50 dark:bg-white/[0.015] border-y border-gray-100 dark:border-white/[0.05]">
        <div className="container mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-5">
            <ShieldCheck className="w-4 h-4" /> Exclusive Partner Benefit
          </div>
          <h2 className="text-2xl sm:text-3xl font-black mb-3">100% Free Partner Perks</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-3xl mx-auto text-sm sm:text-base leading-relaxed">
            Upgrade to vone_dm Pro and receive complimentary bonus subscriptions to industry-leading AI, video
            editing, 4K streaming, and music tools, fulfilled officially by VV Deals. Sony LIV, ZEE5, Adobe Express,
            OpenArt, Prime, Spotify, YouTube, CapCut &amp; Netflix.
          </p>
          <div className="mt-8 grid grid-cols-3 sm:grid-cols-5 gap-3 max-w-3xl mx-auto">
            {["adobe-express", "sonyliv", "zee5", "openart", "amazon-prime", "spotify", "youtube", "capcut", "netflix"].map(
              (n) => (
                <div
                  key={n}
                  className="rounded-xl bg-white dark:bg-white/[0.04] border border-gray-200/70 dark:border-white/[0.07] p-3 flex items-center justify-center h-16"
                >
                  <img
                    src={`/images/offers/${n}.png`}
                    alt={n}
                    className="max-h-9 w-auto object-contain"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )
            )}
          </div>
          <a
            href="https://vvdeals.cloud"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-7 text-sm font-bold text-ig-purple hover:underline"
          >
            Powered by vvdeals.cloud →
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 bg-white dark:bg-neutral-950">
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <RevealSection>
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
                <HelpCircle className="w-4 h-4" /> Frequently Asked Questions
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-3">Got Questions? We've Got Answers</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                Everything you need to know about vone_dm pricing, plan limits, Meta compliance, and billing.
              </p>
            </div>
          </RevealSection>
          <div className="space-y-3">
            {FAQS.map((f) => (
              <Faq key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
          <div className="mt-10 text-center rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-7">
            <h3 className="font-bold text-lg mb-2">Still have questions about our plans?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              Our automation experts are here to help you select the ideal tier for your growth goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/contact"
                className="px-6 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold text-sm"
              >
                Contact Support
              </Link>
              <Link
                to="/features"
                className="px-6 py-3 rounded-xl border border-gray-300 dark:border-white/15 font-bold text-sm"
              >
                Explore All Features
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CheckoutModal
        open={!!checkout}
        plan={checkout?.plan}
        cycle={checkout?.cycle}
        onClose={() => setCheckout(null)}
      />
    </div>
  );
}
