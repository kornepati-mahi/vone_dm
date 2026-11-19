import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Link2, Share2, Clock } from "lucide-react";
import Seo from "../components/Seo.jsx";
import { get } from "../lib/api.js";
import { useToast } from "../lib/ToastContext.jsx";

export default function BlogPost() {
  const { slug } = useParams();
  const { showSuccess } = useToast();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    (async () => {
      try {
        const data = await get(`/api/blog/${slug}`);
        if (alive) {
          setPost(data.post || data);
          try {
            const all = await get("/api/blog");
            const list = Array.isArray(all) ? all : all.posts || [];
            if (alive)
              setRelated(
                list
                  .filter((p) => p.slug !== slug)
                  .slice(0, 3)
              );
          } catch {}
        }
      } catch {
        if (alive) setNotFound(true);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showSuccess("Link copied to clipboard");
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 pt-28 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="h-8 w-40 rounded-lg bg-gray-100 dark:bg-white/[0.05] animate-pulse mb-8" />
          <div className="h-10 w-3/4 rounded-xl bg-gray-100 dark:bg-white/[0.05] animate-pulse mb-4" />
          <div className="h-64 rounded-3xl bg-gray-100 dark:bg-white/[0.05] animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 pt-32 pb-24 text-center">
        <h1 className="text-2xl font-bold mb-4">Article not found</h1>
        <Link to="/blog" className="text-ig-purple font-semibold">
          ← Back to playbooks
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
      <Seo title={`${post.title} | vone_dm`} description={post.excerpt} ogType="article" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-24">
        <div className="flex items-center justify-between gap-4 mb-7">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to playbooks
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            >
              <Link2 className="w-3.5 h-3.5" /> Copy link
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: post.title, url: window.location.href }).catch(() => {});
                } else copy();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.05]"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>

        <span className="text-[11px] font-black uppercase tracking-wider text-ig-purple">{post.category}</span>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold leading-tight mt-2 mb-4">{post.title}</h1>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-7">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {post.published_at
              ? new Date(post.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : ""}
          </span>
          <span>vone_dm Team</span>
        </div>

        {post.cover_image && (
          <img
            src={post.cover_image}
            alt={post.title}
            className="w-full h-auto rounded-3xl mb-8 border border-gray-100 dark:border-white/[0.07]"
          />
        )}

        <div
          className="prose prose-lg dark:prose-invert max-w-none text-sm sm:text-base leading-relaxed text-gray-700 dark:text-gray-300 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-gray-900 dark:[&_h2]:text-white [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1.5 [&_a]:text-ig-purple [&_a]:underline [&_strong]:text-gray-900 dark:[&_strong]:text-white [&_blockquote]:border-l-4 [&_blockquote]:border-ig-purple [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-5"
          dangerouslySetInnerHTML={{ __html: post.content || `<p>${post.excerpt || ""}</p>` }}
        />

        <div className="my-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#405DE6]/5 via-[#833AB4]/5 to-[#FCAF45]/5 border border-[#833AB4]/10 dark:border-[#833AB4]/20">
          <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            The vone_dm team builds Instagram automation tools used by creators, agencies, and e-commerce brands to
            save time, engage followers, and grow revenue. We share practical, platform-compliant strategies based on
            real customer workflows.
          </p>
        </div>

        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-100 dark:border-white/[0.06]">
            <h2 className="text-xl font-bold mb-5">Related articles</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  to={`/blog/${r.slug}`}
                  className="rounded-2xl border border-gray-100 dark:border-white/[0.07] p-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-ig-purple">{r.category}</span>
                  <h3 className="font-bold text-sm mt-1.5 line-clamp-3">{r.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
