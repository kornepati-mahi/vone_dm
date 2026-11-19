import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import Seo from "../components/Seo.jsx";
import RevealSection from "../components/RevealSection.jsx";
import { get } from "../lib/api.js";

const DEFAULT_CATEGORIES = ["All Playbooks"];

export default function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("All Playbooks");

  const CATEGORIES = useMemo(() => {
    const cats = new Set();
    posts.forEach((p) => p.category && cats.add(p.category));
    return [...DEFAULT_CATEGORIES, ...Array.from(cats).sort()];
  }, [posts]);

  useEffect(() => {
    if (CATEGORIES.length > 1 && !CATEGORIES.includes(cat)) setCat("All Playbooks");
  }, [CATEGORIES, cat]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await get("/api/blog");
        if (alive) setPosts(Array.isArray(data) ? data : data.posts || []);
      } catch {
        if (alive) setPosts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      const inCat = cat === "All Playbooks" || (p.category || "") === cat;
      const inQ =
        !q ||
        (p.title || "").toLowerCase().includes(q) ||
        (p.excerpt || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q);
      return inCat && inQ;
    });
  }, [posts, query, cat]);

  const featured = filtered.find((p) => p.featured) || filtered[0];
  const rest = filtered.filter((p) => p !== featured);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
      <Seo
        title="vone_dm Automation Playbooks | Instagram Growth Blog"
        description="Field-tested strategies, rich DM templates, and compliance guides to automate your Instagram growth without spamming."
        keywords="instagram automation playbooks, instagram comment automation guide, dm automation tips, instagram marketing blog"
      />

      <section className="relative pt-28 sm:pt-32 pb-10 border-b border-gray-100 dark:border-white/[0.06] overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[280px] bg-gradient-to-b from-[#833AB4]/10 via-[#4F46E5]/10 to-transparent blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[#833AB4] dark:text-purple-300 text-[11px] font-bold uppercase tracking-wider mb-5">
              <BookOpen className="w-3.5 h-3.5" /> vone_dm Knowledge Hub
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Playbooks That Drive <span className="bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#FD1D1D] bg-clip-text text-transparent">Revenue.</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Field-tested playbooks for Instagram comment auto-replies, DM funnels, follow-gated resources, and Meta
              API compliance.
            </p>
            <div className="mt-7 max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search playbooks..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.04] focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15 shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-6 border-b border-gray-100 dark:border-white/[0.06] sticky top-0 z-30 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  cat === c
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400 hover:bg-gray-200/70"
                }`}
              >
                {c}
              </button>
            ))}
            {(query || cat !== "All Playbooks") && (
              <button
                onClick={() => {
                  setQuery("");
                  setCat("All Playbooks");
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 dark:bg-white/[0.04] text-gray-600 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="rounded-3xl border border-gray-100 dark:border-white/[0.06] h-72 animate-pulse bg-gray-50 dark:bg-white/[0.02]" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-lg font-semibold mb-2">No articles match your criteria</p>
              <p className="text-sm text-gray-500">Try clearing your search or browsing across all categories.</p>
            </div>
          ) : (
            <>
              {featured && (
                <RevealSection className="mb-10">
                  <Link
                    to={`/blog/${featured.slug}`}
                    className="group grid lg:grid-cols-2 gap-6 items-center rounded-3xl border border-gray-100 dark:border-white/[0.07] bg-gradient-to-br from-[#405DE6]/5 via-[#833AB4]/5 to-[#FCAF45]/5 overflow-hidden hover:shadow-xl transition-all duration-300"
                  >
                    <div className="h-56 lg:h-72 overflow-hidden">
                      {featured.cover_image ? (
                        <img
                          src={featured.cover_image}
                          alt={featured.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#405DE6] via-[#833AB4] to-[#FD1D1D] flex items-center justify-center text-white text-4xl font-black">
                          DM
                        </div>
                      )}
                    </div>
                    <div className="p-6 sm:p-8">
                      <span className="text-[11px] font-black uppercase tracking-wider text-ig-purple">
                        Featured Playbook
                      </span>
                      <h2 className="text-xl sm:text-2xl font-bold mt-2 mb-3 group-hover:text-ig-purple transition-colors">
                        {featured.title}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{featured.excerpt}</p>
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-ig-purple">
                        Read Complete Playbook <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                </RevealSection>
              )}

              <h2 className="text-xl sm:text-2xl font-bold mb-6">Latest Guides &amp; Strategies</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p, i) => (
                  <RevealSection key={p.slug} delay={(i % 6) * 60}>
                    <Link
                      to={`/blog/${p.slug}`}
                      className="group h-full flex flex-col rounded-3xl border border-gray-100 dark:border-white/[0.07] bg-white dark:bg-white/[0.02] overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="h-40 overflow-hidden bg-gradient-to-br from-[#405DE6]/10 via-[#833AB4]/10 to-[#FCAF45]/10">
                        {p.cover_image && (
                          <img
                            src={p.cover_image}
                            alt={p.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-ig-purple mb-2">
                          {p.category || "Instagram Automation"}
                        </span>
                        <h3 className="font-bold text-base mb-2 group-hover:text-ig-purple transition-colors">
                          {p.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1">{p.excerpt}</p>
                        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between text-xs text-gray-500">
                          <span>{p.published_at ? new Date(p.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}</span>
                          <span className="font-medium ml-4 text-ig-purple">Read Article →</span>
                        </div>
                      </div>
                    </Link>
                  </RevealSection>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="py-16 bg-gray-900 dark:bg-white/[0.04] border-t border-gray-800 dark:border-white/[0.06]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
            Ready to put these automation playbooks into practice?
          </h2>
          <p className="text-gray-300 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Connect your Instagram account and launch your first automated comment DM or follow-gated flow in under 5
            minutes.
          </p>
          <Link
            to="/login?mode=register"
            className="inline-block px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold hover:bg-gray-100 transition-all"
          >
            Get Started for Free
          </Link>
        </div>
      </section>
    </div>
  );
}
