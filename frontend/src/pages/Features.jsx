import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  LayoutTemplate,
  TrendingUp,
  ShieldCheck,
  Search,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import Seo from "../components/Seo.jsx";
import RevealSection from "../components/RevealSection.jsx";
import { useContent } from "../lib/content.jsx";

const CATEGORIES = [
  { id: "all", label: "All Features", icon: Sparkles },
  { id: "automations", label: "Automations", icon: Sparkles },
  { id: "templates", label: "Templates", icon: LayoutTemplate },
  { id: "growth", label: "Growth", icon: TrendingUp },
  { id: "safety", label: "Safety", icon: ShieldCheck },
];

export default function Features() {
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const { value: featureData } = useContent("features");
  const FEATURES = featureData?.items || [];
  const HERO_STATS = featureData?.hero_stats || [];

  const filtered = useMemo(
    () =>
      FEATURES.filter((f) => {
        const inCat = category === "all" || f.category === category;
        const q = query.trim().toLowerCase();
        const inQuery =
          !q ||
          f.name.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.categoryLabel.toLowerCase().includes(q);
        return inCat && inQuery;
      }),
    [category, query]
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Seo
        title="Features | vone_dm - Smart Instagram Automation Suite"
        description="Explore all 23 powerful features: automated comment DMs, viral Reel auto-replies, interactive carousels, follow gates, and AI spam protection."
        keywords="instagram automation features, comment reply bot, story mention auto reply, follow gate instagram dms, link in bio creator, carousel templates"
        schema={[
          { "@context": "https://schema.org", "@type": "WebPage", name: "Instagram Automation Features | vone_dm", description: "Explore vone_dm's full suite of 23 Instagram automation features.", url: "https://vone-dm.com/features" },
        ]}
      />

      {/* Hero */}
      <section className="relative pt-16 sm:pt-20 md:pt-24 pb-8 sm:pb-12 md:pb-16 border-b border-gray-100 dark:border-white/[0.06] overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-[#833AB4]/10 via-[#4F46E5]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#405DE6]/10 via-[#833AB4]/10 to-[#FCAF45]/10 border border-purple-500/20 text-[#833AB4] dark:text-purple-300 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-4 sm:mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Instagram Automation Suite
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-[1.15] sm:leading-[1.1] mb-4 sm:mb-6">
              Everything you need to turn{" "}
              <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#FD1D1D] bg-clip-text text-transparent">
                Instagram into revenue.
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed mb-6 sm:mb-8 max-w-xl mx-auto px-2">
              Automate DMs, comments, Stories, and Reels without losing personal connection or violating Meta
              guidelines.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 max-w-md mx-auto sm:max-w-none">
              <Link
                to="/login?mode=register"
                className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 min-h-[44px] rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm sm:text-base hover:opacity-95 active:scale-[0.98] transition-all duration-200 shadow-md flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#catalog"
                className="w-full sm:w-auto px-6 sm:px-7 py-3 sm:py-3.5 min-h-[44px] rounded-xl bg-gray-100 dark:bg-white/[0.05] border border-gray-200/80 dark:border-white/[0.08] text-gray-700 dark:text-gray-200 font-semibold text-sm sm:text-base hover:bg-gray-200/60 dark:hover:bg-white/[0.08] active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                Browse All 23 Features
              </a>
            </div>
            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-100 dark:border-white/[0.06] grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
              {HERO_STATS.map((s) => (
                <div key={s.l}>
                  <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">{s.v}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sticky filter bar */}
      <section
        id="catalog"
        className="py-4 sm:py-6 border-b border-gray-100 dark:border-white/[0.06] sticky top-0 z-30 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-md"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full lg:w-auto pb-1 lg:pb-0 scrollbar-none scroll-smooth touch-pan-x">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 min-h-[40px] sm:min-h-[44px] rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 active:scale-[0.98] ${
                    category === c.id
                      ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm"
                      : "bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-gray-200/70 dark:hover:bg-white/[0.08]"
                  }`}
                >
                  <c.icon className="w-3.5 h-3.5" />
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 lg:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search features..."
                  className="w-full pl-9 pr-3 py-2.5 min-h-[42px] rounded-xl text-sm border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
                />
              </div>
              {(query || category !== "all") && (
                <button
                  onClick={() => {
                    setQuery("");
                    setCategory("all");
                  }}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="py-10 sm:py-14 bg-white dark:bg-[#09090b]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">No features found</p>
              <p className="text-sm text-gray-500 mt-2">Try clearing your search or browsing across all categories.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
              {filtered.map((f, i) => (
                <RevealSection key={f.id} delay={(i % 6) * 60}>
                  <article className="relative h-full flex flex-col rounded-3xl border border-gray-100 dark:border-white/[0.07] bg-gray-50/70 dark:bg-white/[0.02] overflow-hidden hover:shadow-xl dark:hover:shadow-purple-500/[0.05] hover:-translate-y-1 transition-all duration-300 group">
                    <div className="relative h-44 bg-gradient-to-br from-[#405DE6]/10 via-[#833AB4]/10 to-[#FCAF45]/10 overflow-hidden">
                      <img
                        src={f.image}
                        alt={f.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      {f.badge && (
                        <span className="absolute top-3 left-3 rounded-full bg-white/95 dark:bg-black/80 border border-purple-500/30 text-[#833AB4] dark:text-purple-300 text-[10px] font-black uppercase tracking-wider px-2.5 py-1">
                          {f.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          {f.categoryLabel}
                        </span>
                        {f.stat && (
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{f.stat}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{f.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">{f.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-auto pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                        {f.benefit}
                      </p>
                    </div>
                  </article>
                </RevealSection>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 bg-gray-900 dark:bg-white/[0.04] border-t border-gray-800 dark:border-white/[0.06]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">Ready to deploy all 23 automations?</h2>
          <p className="text-base sm:text-lg mb-7 text-gray-300 dark:text-gray-400 max-w-2xl mx-auto">
            Connect your Instagram professional account in 60 seconds. No credit card required to start.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login?mode=register"
              className="px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold hover:bg-gray-100 transition-all active:scale-[0.98]"
            >
              Get Started for Free
            </Link>
            <Link
              to="/pricing"
              className="px-8 py-4 rounded-2xl border border-white/20 text-white font-bold hover:bg-white/10 transition-all active:scale-[0.98]"
            >
              Compare Plans &amp; Limits
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
