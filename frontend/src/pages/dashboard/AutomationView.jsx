import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, X, Power, Search, Loader2, Inbox, Lock, ArrowUpRight, Send } from "lucide-react";
import Seo from "../../components/Seo.jsx";
import { get, post, put, del } from "../../lib/api.js";
import { uploadFile } from "../../lib/api.js";
import { useToast } from "../../lib/ToastContext.jsx";
import { usePlan, SECTION_FEATURES } from "../../lib/PlanContext.jsx";

const FIELD_PRESETS = {
  "dm-automation": {
    title: "DM Automation",
    subtitle: "Build keyword-based DM automations with template replies, follow-gates, and Suggest More follow-ups.",
    type: "dm",
    fields: [
      { name: "keyword", label: "Trigger Keyword", placeholder: "PRICE" },
      { name: "reply_text", label: "Reply Message", type: "textarea", placeholder: "Here's the pricing you asked for..." },
      { name: "media_url", label: "Media URL (optional)", placeholder: "https://..." },
    ],
    options: [
      { name: "followers_only", label: "Followers-only auto-DM", feature: "followers_only" },
      { name: "once_per_user_24h", label: "Once per user / 24h", feature: "once_per_user_24h" },
      { name: "seen_typing", label: "Seen & Typing reaction", feature: "seen_typing" },
    ],
  },
  "post-automation": {
    title: "Post Comment Automation",
    subtitle: "Trigger private DM replies from post comments using keywords or all-comments mode on your selected post.",
    type: "post",
    fields: [
      { name: "keyword", label: "Trigger Keyword", placeholder: "LINK (or leave blank for all comments)" },
      { name: "public_reply", label: "Public Comment Reply", type: "textarea", placeholder: "Check your DMs!" },
      { name: "reply_text", label: "Private DM Message", type: "textarea", placeholder: "Here's what you asked for..." },
    ],
    options: [{ name: "share_to_admin", label: "Share Post To Admin", feature: "share_post_to_admin" }],
  },
  "reel-automation": {
    title: "Reel Comment Automation",
    subtitle: "Turn Reel comments into private DM conversations with keyword or all-comments triggers.",
    type: "reel",
    fields: [
      { name: "keyword", label: "Trigger Keyword", placeholder: "SEND" },
      { name: "public_reply", label: "Public Comment Reply", type: "textarea", placeholder: "Sent to your DMs!" },
      { name: "reply_text", label: "Private DM Message", type: "textarea", placeholder: "Enjoy this resource..." },
    ],
    options: [{ name: "share_to_admin", label: "Share Reel To Admin", feature: "share_reel_to_admin" }],
  },
  "story-automation": {
    title: "Story Automation",
    subtitle: "Send a template-based DM when someone mentions your account or replies to your active Stories.",
    type: "story",
    fields: [
      { name: "trigger", label: "Trigger", type: "select", options: ["story_mention", "story_reply"] },
      { name: "reply_text", label: "Reply Message", type: "textarea", placeholder: "Thanks for the shoutout!" },
      { name: "media_url", label: "Media URL (optional)", placeholder: "https://..." },
    ],
    options: [{ name: "no_watermark", label: "No vone_dm watermark", feature: "no_watermark" }],
  },
  "live-automation": {
    title: "Instagram Live Automation",
    subtitle: "Prepare live comment automations in advance with one all-comments rule, up to five keywords, and optional public replies.",
    type: "live",
    fields: [
      { name: "keyword", label: "Trigger Keywords (comma separated)", placeholder: "LINK, PRICE, BUY" },
      { name: "reply_text", label: "DM Message", type: "textarea", placeholder: "Here's the checkout link!" },
    ],
  },
  mentions: {
    title: "Mentions",
    subtitle: "Automatically thank followers whenever they @mention your account in their Stories.",
    type: "mention",
    fields: [
      { name: "reply_text", label: "Thank You Message", type: "textarea", placeholder: "Thanks for mentioning us!" },
    ],
  },
  "global-triggers": {
    title: "Global Keyword Triggers",
    subtitle: "Use one account-wide keyword to trigger the same response flow across comments, stories, DMs, and live.",
    type: "global",
    fields: [
      { name: "keyword", label: "Account-wide Keyword", placeholder: "INFO" },
      { name: "reply_text", label: "Response Flow Message", type: "textarea", placeholder: "Everything you need is below..." },
    ],
  },
  "comment-moderation": {
    title: "Comment Moderation",
    subtitle: "Manage separate hide and delete keyword lists for comments, with moderation words kept exclusive from automations.",
    type: "moderation",
    fields: [
      { name: "keyword", label: "Moderation Word(s) (comma separated)", placeholder: "spam, scam, fake" },
      { name: "action", label: "Action", type: "select", options: ["hide", "delete"] },
    ],
  },
  "reply-templates": {
    title: "Reply Templates",
    subtitle: "Reusable message templates with buttons, quick replies, carousels, and media for every automation.",
    type: "template",
    fields: [
      { name: "name", label: "Template Name", placeholder: "Pricing Card" },
      { name: "template_type", label: "Template Type", type: "select", options: ["text", "button", "quick_replies", "carousel", "media", "share"] },
      { name: "reply_text", label: "Message Body", type: "textarea", placeholder: "Hi! Here's what you asked for..." },
      { name: "buttons", label: "Buttons (optional)", type: "buttons" },
    ],
  },
  "inbox-menu": {
    title: "Inbox Menu",
    subtitle: "Manage your Instagram persistent menu, sync it with Instagram, and link menu items to URLs or automation actions.",
    type: "inbox_menu",
    fields: [
      { name: "name", label: "Menu Item Title", placeholder: "Pricing" },
      { name: "reply_text", label: "Destination URL or Reply", placeholder: "https://..." },
    ],
  },
  "convo-starter": {
    title: "Conversation Starters",
    subtitle: "Publish up to four conversation starters in Instagram DMs and attach template-based replies to each one.",
    type: "convo_starter",
    fields: [
      { name: "name", label: "Starter Question", placeholder: "How much does it cost?" },
      { name: "reply_text", label: "Canned Reply", type: "textarea", placeholder: "Our plans start free..." },
    ],
  },
  "suggest-more": {
    title: "Suggest More",
    subtitle: "Send a dedicated Suggest More template after supported replies to offer additional options, products, or next steps.",
    type: "suggest_more",
    fields: [
      { name: "name", label: "Suggestion Title", placeholder: "You may also like" },
      { name: "reply_text", label: "Suggestion Message", type: "textarea", placeholder: "Check out these related products..." },
    ],
  },
  "welcome-message": {
    title: "Welcome Message",
    subtitle: "Set a fallback welcome reply that runs when no other automation or global trigger matches first.",
    type: "welcome",
    fields: [
      { name: "reply_text", label: "Welcome Message", type: "textarea", placeholder: "Welcome! Tap a button below to get started." },
      { name: "media_url", label: "Media URL (optional)", placeholder: "https://..." },
    ],
  },
};

export default function AutomationView({ section }) {
  const preset = FIELD_PRESETS[section] || FIELD_PRESETS["dm-automation"];
  const { showSuccess, showError } = useToast();
  const { hasFeature, plan, loading: planLoading } = usePlan();
  const featureKey = SECTION_FEATURES[section];
  const locked = featureKey ? !hasFeature(featureKey) : false;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null); // null | {} | item
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [uploadingField, setUploadingField] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [testItem, setTestItem] = useState(null);
  const [testRecipient, setTestRecipient] = useState("");
  const [testBusy, setTestBusy] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactErrors, setContactErrors] = useState([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const load = useCallback(async () => {
    if (locked) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await get(`/api/automations?type=${encodeURIComponent(preset.type)}`);
      setItems(Array.isArray(data) ? data : data.automations || []);
    } catch (e) {
      showError(e.message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [preset.type, showError, locked]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [i.name, i.keyword, i.reply_text, i.status].some((v) => String(v || "").toLowerCase().includes(q))
    );
  }, [items, query]);

  const openCreate = () => {
    const seed = { options: {} };
    preset.fields.forEach((f) => (seed[f.name] = f.type === "select" ? f.options[0] : ""));
    (preset.options || []).forEach((o) => (seed.options[o.name] = false));
    setForm(seed);
    setErrors({});
    setModal({});
  };

  const openEdit = (item) => {
    const seed = { ...item, options: { ...(item.options || {}) } };
    preset.fields.forEach((f) => {
      if (seed[f.name] == null) seed[f.name] = f.type === "select" ? f.options[0] : "";
    });
    (preset.options || []).forEach((o) => {
      if (seed.options[o.name] == null) seed.options[o.name] = false;
    });
    setForm(seed);
    setErrors({});
    setModal(item);
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    preset.fields.forEach((f) => {
      if (f.name !== "media_url" && f.name !== "public_reply" && f.name !== "buttons" && !String(form[f.name] || "").trim()) {
        errs[f.name] = `${f.label} is required.`;
      }
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      const payload = { ...form, type: preset.type, section };
      let res;
      if (modal && modal.id) {
        res = await put(`/api/automations/${modal.id}`, payload);
        showSuccess("Automation updated.");
      } else {
        res = await post("/api/automations", payload);
        showSuccess("Automation created.");
      }
      setModal(null);
      if (res && res.automation) {
        setItems((list) => {
          const exists = list.some((i) => i.id === res.automation.id);
          return exists
            ? list.map((i) => (i.id === res.automation.id ? res.automation : i))
            : [res.automation, ...list];
        });
      } else {
        load();
      }
    } catch (err) {
      showError(err.message || "Failed to save automation.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item) => {
    try {
      const res = await put(`/api/automations/${item.id}`, {
        ...item,
        status: item.status === "active" ? "inactive" : "active",
      });
      const updated = (res && res.automation) || { ...item, status: item.status === "active" ? "inactive" : "active" };
      setItems((list) => list.map((i) => (i.id === item.id ? updated : i)));
      showSuccess(`Automation ${updated.status === "active" ? "activated" : "paused"}.`);
    } catch (err) {
      showError(err.message);
    }
  };

  const remove = async (item) => {
    setDeleting(item.id);
    try {
      await del(`/api/automations/${item.id}`);
      setItems((list) => list.filter((i) => i.id !== item.id));
      showSuccess("Automation deleted.");
    } catch (err) {
      showError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const d = await get("/api/instagram/contacts");
      setContacts(Array.isArray(d?.contacts) ? d.contacts : []);
      setContactErrors(Array.isArray(d?.errors) ? d.errors : []);
      setContactsLoaded(true);
    } catch (err) {
      showError(err.message || "Could not load commenters.");
    } finally {
      setLoadingContacts(false);
    }
  };

  const sendTest = async (e) => {
    e.preventDefault();
    if (!testRecipient.trim()) return showError("Enter the recipient Instagram user ID.");
    setTestBusy(true);
    try {
      const res = await post("/api/automations/test-send", {
        id: testItem.id,
        recipient_id: testRecipient.trim(),
      });
      showSuccess(res.message || "Test message sent.");
      setTestItem(null);
      setTestRecipient("");
    } catch (err) {
      showError(err.message || "Test send failed.");
    } finally {
      setTestBusy(false);
    }
  };

  if (locked && !planLoading) {
    return (
      <div className="space-y-5">
        <Seo title={`${preset.title} | vone_dm Dashboard`} noIndex />
        <div>
          <h1 className="text-xl sm:text-2xl font-black">{preset.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mt-1">{preset.subtitle}</p>
        </div>
        <div className="rounded-3xl border border-purple-200 dark:border-purple-500/30 bg-gradient-to-br from-purple-50/70 via-white to-white dark:from-purple-950/40 dark:via-neutral-900 dark:to-neutral-950 p-8 sm:p-12 text-center">
          <span className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#405DE6] to-[#833AB4] text-white flex items-center justify-center mb-5 shadow-lg shadow-purple-500/25">
            <Lock className="w-6 h-6" />
          </span>
          <h2 className="text-xl sm:text-2xl font-black mb-2">Upgrade to unlock {preset.title}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
            This feature is not included in your current <strong>{plan?.name || "plan"}</strong>. Upgrade your
            subscription to start using it right away.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold text-sm shadow-lg shadow-purple-500/25 hover:opacity-95 active:scale-[0.98] transition-all"
            >
              View Plans <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard/my-plan"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-gray-300 dark:border-white/15 font-bold text-sm hover:bg-white dark:hover:bg-white/[0.05]"
            >
              My Plan
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Seo title={`${preset.title} | vone_dm Dashboard`} noIndex />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black">{preset.title}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mt-1">{preset.subtitle}</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-[#405DE6] to-[#833AB4] text-white font-bold text-sm shadow-md shadow-purple-500/20 hover:opacity-95 active:scale-[0.98] transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> New {preset.title.replace(/s$/, "")}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.03] focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
          />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{filtered.length} item(s)</span>
      </div>

      <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-gray-50 dark:bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 px-6">
            <Inbox className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="font-bold text-gray-700 dark:text-gray-200">No {preset.title.toLowerCase()} yet</p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Create your first one and it will fire automatically through the official Meta Graph API.
            </p>
            <button
              onClick={openCreate}
              className="mt-5 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Create one
            </button>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {filtered.map((item) => (
              <li key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm truncate">
                    {item.name || item.keyword || `#${item.id}`}
                    {item.keyword && item.name && <span className="ml-2 text-[10px] font-black uppercase bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded">{item.keyword}</span>}
                  </p>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {String(item.reply_text || item.public_reply || "").slice(0, 90) || "No message configured"}
                  </p>
                </div>
                <span
                  className={`hidden sm:inline text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${
                    item.status === "active"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400"
                  }`}
                >
                  {item.status || "inactive"}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggle(item)}
                    title={item.status === "active" ? "Pause" : "Activate"}
                    className="p-2 rounded-lg text-gray-400 hover:text-ig-purple hover:bg-purple-50 dark:hover:bg-purple-950/30 transition-colors"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setTestItem(item); setTestRecipient(""); }}
                    title="Send a real test DM"
                    className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    title="Edit"
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => remove(item)}
                    title="Delete"
                    disabled={deleting === item.id}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                  >
                    {deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#141416] border border-gray-200 dark:border-white/10 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.07] sticky top-0 bg-white dark:bg-[#141416] z-10">
              <h3 className="font-black">{modal.id ? "Edit" : "Create"} {preset.title.replace(/s$/, "")}</h3>
              <button onClick={() => setModal(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={submit} className="p-6 space-y-4">
              {preset.fields.map((f) => (
                <div key={f.name}>
                  <label className="block text-sm font-semibold mb-1.5">{f.label}</label>
                  {f.type === "buttons" ? (
                    <div className="space-y-2">
                      {(() => {
                        let list = [];
                        try {
                          const raw = form.buttons;
                          const parsed = typeof raw === "string" ? JSON.parse(raw || "[]") : raw;
                          if (Array.isArray(parsed)) list = parsed;
                        } catch { /* ignore malformed legacy value */ }
                        const setList = (next) => setForm((v) => ({ ...v, buttons: JSON.stringify(next) }));
                        return (
                          <>
                            {list.map((b, i) => (
                              <div key={i} className="grid grid-cols-2 gap-2">
                                <input
                                  value={b.title || ""}
                                  onChange={(e) => {
                                    const next = [...list];
                                    next[i] = { ...next[i], title: e.target.value };
                                    setList(next);
                                  }}
                                  placeholder="Button title"
                                  className="text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
                                />
                                <div className="flex gap-1.5">
                                  <input
                                    value={b.url || ""}
                                    onChange={(e) => {
                                      const next = [...list];
                                      next[i] = { ...next[i], url: e.target.value };
                                      setList(next);
                                    }}
                                    placeholder="https://example.com"
                                    className="flex-1 min-w-0 text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setList(list.filter((_, j) => j !== i))}
                                    className="shrink-0 px-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    aria-label="Remove button"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => setList([...list, { title: "", url: "" }])}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-ig-purple hover:underline"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add button
                            </button>
                          </>
                        );
                      })()}
                      <p className="text-[11px] text-gray-400">Add as many buttons as you need — no JSON required.</p>
                    </div>
                  ) : f.type === "textarea" ? (
                    <textarea
                      value={form[f.name] || ""}
                      onChange={(e) => setForm((v) => ({ ...v, [f.name]: e.target.value }))}
                      placeholder={f.placeholder}
                      rows={3}
                      className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15 resize-y"
                    />
                  ) : f.type === "select" ? (
                    <select
                      value={form[f.name] || ""}
                      onChange={(e) => setForm((v) => ({ ...v, [f.name]: e.target.value }))}
                      className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
                    >
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                   ) : (
                     <div className="flex items-center gap-2">
                       <input
                         value={form[f.name] || ""}
                         onChange={(e) => setForm((v) => ({ ...v, [f.name]: e.target.value }))}
                         placeholder={f.placeholder}
                         className="flex-1 text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
                       />
                       {f.name === "media_url" && (
                         <label className="shrink-0 inline-flex items-center gap-1.5 px-3 py-3 rounded-xl border border-gray-300 dark:border-neutral-700 text-xs font-bold cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.05]">
                           {uploadingField === f.name ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                           <input
                             type="file"
                             accept="image/*"
                             className="hidden"
                             disabled={uploadingField === f.name}
                             onChange={async (e) => {
                               const file = e.target.files && e.target.files[0];
                               if (!file) return;
                               setUploadingField(f.name);
                               try {
                                 const d = await uploadFile(file);
                                 setForm((v) => ({ ...v, [f.name]: d.url }));
                                 showSuccess("Image uploaded.");
                               } catch (err) {
                                 showError(err.message);
                               } finally {
                                 setUploadingField(null);
                                 e.target.value = "";
                               }
                             }}
                           />
                         </label>
                       )}
                     </div>
                   )}
                  {errors[f.name] && <p className="text-xs text-red-500 mt-1">{errors[f.name]}</p>}
                </div>
              ))}

              {(preset.options || []).length > 0 && (
                <div className="rounded-xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] p-4 space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Plan options</p>
                  {preset.options.map((o) => {
                    const allowed = hasFeature(o.feature);
                    return (
                      <label
                        key={o.name}
                        className={`flex items-center gap-2.5 text-sm font-semibold ${
                          allowed ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <input
                          type="checkbox"
                          disabled={!allowed}
                          checked={!!(form.options && form.options[o.name])}
                          onChange={(e) =>
                            setForm((v) => ({
                              ...v,
                              options: { ...(v.options || {}), [o.name]: e.target.checked },
                            }))
                          }
                          className="rounded accent-purple-600 disabled:opacity-40"
                        />
                        <span>{o.label}</span>
                        {!allowed && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                            <Lock className="w-2.5 h-2.5" /> Plan
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="checkbox"
                    checked={(form.status || "active") === "active"}
                    onChange={(e) => setForm((v) => ({ ...v, status: e.target.checked ? "active" : "inactive" }))}
                    className="rounded accent-purple-600"
                  />
                  Active (firing now)
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-white/15 font-bold text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {modal.id ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Real test-send modal */}
      {testItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={sendTest} className="w-full max-w-md rounded-3xl bg-white dark:bg-[#141416] border border-gray-200 dark:border-white/10 p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-br from-[#405DE6] via-[#833AB4] to-[#FD1D1D] text-white flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg leading-tight">Send test DM</h3>
                <p className="text-[11px] text-gray-500">Using "{testItem.name}"</p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-sm font-bold">Choose a person</label>
                <button
                  type="button"
                  onClick={loadContacts}
                  disabled={loadingContacts}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-ig-purple hover:underline disabled:opacity-60"
                >
                  {loadingContacts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  Refresh list
                </button>
              </div>
              <select
                value={contacts.some((c) => c.id === testRecipient) ? testRecipient : ""}
                onChange={(e) => setTestRecipient(e.target.value)}
                className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
              >
                <option value="">— Select a person —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    @{c.username || "instagram"} · ID {c.id}
                  </option>
                ))}
              </select>
              {contactsLoaded && contacts.length === 0 && (
                <p className="text-[11px] text-gray-400">
                  Nobody found yet — ask someone to comment on your post or DM your account, then click Refresh list.
                </p>
              )}
              {contactErrors.map((err, i) => (
                <p key={i} className="text-[11px] text-red-500 break-all">{err}</p>
              ))}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-gray-500">Or enter Instagram user ID manually</label>
                <input
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  placeholder="17841400000000000"
                  inputMode="numeric"
                  className="w-full text-sm font-mono rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
                />
              </div>
              {testRecipient && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold break-all">
                  Selected recipient ID: {testRecipient}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 dark:border-white/[0.06] p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5">Message to send</p>
              <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap break-words">
                {String(testItem.reply_text || "").slice(0, 200) || "(no reply text)"}
              </p>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setTestItem(null)} className="flex-1 py-3 rounded-xl border border-gray-300 dark:border-white/15 font-bold text-sm">
                Cancel
              </button>
              <button type="submit" disabled={testBusy || !testRecipient} className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {testBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
