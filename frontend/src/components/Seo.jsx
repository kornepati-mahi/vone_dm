import { useEffect } from "react";

const DEFAULTS = {
  title: "vone_dm | Certified Instagram DM Automation Tool",
  description:
    "Automate Instagram DMs, comments, shares, and stories with vone_dm. Certified Meta Business Partner. Safe, simple, and affordable automation for creators.",
  keywords: "instagram automation, instagram dm automation, comment auto reply, dm panda",
  canonical: typeof window !== "undefined" ? window.location.href : "",
};

function setMeta(attr, name, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function Seo({
  title,
  description,
  keywords,
  canonical,
  ogTitle,
  ogDescription,
  ogImage,
  ogType = "website",
  schema,
  noIndex = false,
}) {
  const t = title || DEFAULTS.title;
  const d = description || DEFAULTS.description;

  useEffect(() => {
    document.title = t;
    setMeta("name", "description", d);
    setMeta("name", "keywords", keywords || DEFAULTS.keywords);
    setMeta("name", "robots", noIndex ? "noindex,nofollow" : "index, follow");

    setMeta("property", "og:title", ogTitle || t);
    setMeta("property", "og:description", ogDescription || d);
    setMeta("property", "og:type", ogType);
    setMeta("property", "og:url", canonical || DEFAULTS.canonical);
    setMeta("property", "og:image", ogImage || "/images/vone-logo.svg");

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", ogTitle || t);
    setMeta("name", "twitter:description", ogDescription || d);

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical || DEFAULTS.canonical;

    let scriptEl = document.getElementById("page-jsonld");
    if (scriptEl) scriptEl.remove();
    if (schema) {
      scriptEl = document.createElement("script");
      scriptEl.type = "application/ld+json";
      scriptEl.id = "page-jsonld";
      scriptEl.textContent = JSON.stringify(schema);
      document.head.appendChild(scriptEl);
    }
  }, [t, d, keywords, canonical, ogTitle, ogDescription, ogImage, ogType, schema, noIndex]);

  return null;
}
