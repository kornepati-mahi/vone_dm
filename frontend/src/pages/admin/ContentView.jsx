import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Save, Loader2, Code2, Layout } from "lucide-react";
import Seo from "../../components/Seo.jsx";
import { get, put } from "../../lib/api.js";
import { useToast } from "../../lib/ToastContext.jsx";

const ICON_OPTIONS = [
  "Bot", "Users", "BarChart3", "Link2", "MessageCircle", "ImageIcon", "Layers", "Zap",
  "Shield", "Send", "Share2", "Radio", "Eye", "MousePointerClick", "Rocket", "Settings",
  "Sparkles", "TrendingUp", "ShieldCheck", "CreditCard", "LifeBuoy", "Home", "Type",
];

function strListEditor(list, setList, placeholder) {
  return (
    <div className="space-y-2">
      {(list || []).map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={v}
            onChange={(e) => {
              const next = [...list];
              next[i] = e.target.value;
              setList(next);
            }}
            placeholder={placeholder}
            className="flex-1 text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-2.5 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
          />
          <button
            type="button"
            onClick={() => setList(list.filter((_, j) => j !== i))}
            className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setList([...(list || []), ""])}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-ig-purple hover:underline"
      >
        <Plus className="w-3.5 h-3.5" /> Add item
      </button>
    </div>
  );
}

export default function ContentView() {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(null);
  const [text, setText] = useState("");
  const [value, setValue] = useState(null);
  const [mode, setMode] = useState("visual"); // visual | json
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [valid, setValid] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await get("/api/admin/content");
      const list = d.content || [];
      setItems(list);
      if (list.length && !active) {
        setActive(list[0].key);
        const v = list[0].value;
        setValue(v);
        setText(JSON.stringify(v, null, 2));
      }
    } catch (e) {
      showError(e.message);
    } finally {
      setLoading(false);
    }
  }, [showError, active]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select = (item) => {
    setActive(item.key);
    setValue(item.value);
    setText(JSON.stringify(item.value, null, 2));
    setValid(true);
  };

  const updateValue = (next) => {
    setValue(next);
    setText(JSON.stringify(next, null, 2));
  };

  const save = async () => {
    let toSave = value;
    if (mode === "json") {
      try {
        toSave = JSON.parse(text);
        setValid(true);
      } catch {
        showError("Invalid JSON — fix the syntax before saving.");
        setValid(false);
        return;
      }
    }
    setBusy(true);
    try {
      await put("/api/admin/content", { key: active, value: toSave });
      setItems((list) => list.map((x) => (x.key === active ? { ...x, value: toSave } : x)));
      setValue(toSave);
      setText(JSON.stringify(toSave, null, 2));
      showSuccess(`Saved "${active}". Changes are live immediately.`);
    } catch (e) {
      showError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const current = items.find((x) => x.key === active);

  const renderVisual = () => {
    if (!value || typeof value !== "object") {
      return <p className="text-sm text-gray-500 italic">No visual editor available for this content.</p>;
    }

    // offers / perks: array of {icon,title,description}
    const cardArrayKeys = ["offers", "perks"];
    const cardKey = cardArrayKeys.find((k) => Array.isArray(value[k]));
    if (cardKey) {
      const list = value[cardKey];
      return (
        <div className="space-y-4">
          {list.map((c, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/10 p-4 space-y-3 bg-gray-50 dark:bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase text-gray-400">Card {i + 1}</p>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...value, [cardKey]: list.filter((_, j) => j !== i) };
                    updateValue(next);
                  }}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Icon</label>
                  <select
                    value={c.icon || ""}
                    onChange={(e) => {
                      const next = { ...value, [cardKey]: list.map((x, j) => (j === i ? { ...x, icon: e.target.value } : x)) };
                      updateValue(next);
                    }}
                    className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                  >
                    {ICON_OPTIONS.map((ic) => (
                      <option key={ic} value={ic}>{ic}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Title</label>
                  <input
                    value={c.title || ""}
                    onChange={(e) => {
                      const next = { ...value, [cardKey]: list.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) };
                      updateValue(next);
                    }}
                    className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Description</label>
                <textarea
                  value={c.description || ""}
                  onChange={(e) => {
                    const next = { ...value, [cardKey]: list.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)) };
                    updateValue(next);
                  }}
                  rows={2}
                  className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950 resize-y"
                />
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => {
              const next = { ...value, [cardKey]: [...list, { icon: ICON_OPTIONS[0], title: "", description: "" }] };
              updateValue(next);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ig-purple hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Add card
          </button>
        </div>
      );
    }

    // contact: includes & reasons (string arrays)
    if (Array.isArray(value.includes) || Array.isArray(value.reasons)) {
      return (
        <div className="space-y-6">
          {Array.isArray(value.includes) && (
            <div>
              <label className="block text-sm font-semibold mb-2">Includes (support checklist)</label>
              {strListEditor(value.includes, (next) => updateValue({ ...value, includes: next }), "Include item")}
            </div>
          )}
          {Array.isArray(value.reasons) && (
            <div>
              <label className="block text-sm font-semibold mb-2">Reasons (support topics)</label>
              {strListEditor(value.reasons, (next) => updateValue({ ...value, reasons: next }), "Reason")}
            </div>
          )}
        </div>
      );
    }

    // home: hero_texts, stats, suite, why, steps
    if (Array.isArray(value.hero_texts)) {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">Hero Texts (rotating)</label>
            {strListEditor(value.hero_texts, (next) => updateValue({ ...value, hero_texts: next }), "Hero text")}
          </div>
          {Array.isArray(value.stats) && (
            <div>
              <label className="block text-sm font-semibold mb-2">Stats</label>
              <div className="space-y-2">
                {value.stats.map((s, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={s.value || ""}
                      onChange={(e) => {
                        const next = value.stats.map((x, j) => (j === i ? { ...x, value: e.target.value } : x));
                        updateValue({ ...value, stats: next });
                      }}
                      placeholder="Value"
                      className="w-28 text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                    />
                    <input
                      value={s.label || ""}
                      onChange={(e) => {
                        const next = value.stats.map((x, j) => (j === i ? { ...x, label: e.target.value } : x));
                        updateValue({ ...value, stats: next });
                      }}
                      placeholder="Label"
                      className="flex-1 text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                    />
                    <button
                      type="button"
                      onClick={() => updateValue({ ...value, stats: value.stats.filter((_, j) => j !== i) })}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateValue({ ...value, stats: [...value.stats, { value: "", label: "" }] })}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-ig-purple hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add stat
                </button>
              </div>
            </div>
          )}
          {["suite", "why", "steps"].map((key) =>
            Array.isArray(value[key]) ? (
              <div key={key}>
                <label className="block text-sm font-semibold mb-2 capitalize">{key}</label>
                <div className="space-y-3">
                  {value[key].map((c, i) => (
                    <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/10 p-3 space-y-2 bg-gray-50 dark:bg-white/[0.02]">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black uppercase text-gray-400">{key} {i + 1}</p>
                        <button
                          type="button"
                          onClick={() => updateValue({ ...value, [key]: value[key].filter((_, j) => j !== i) })}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Icon</label>
                          <select
                            value={c.icon || ""}
                            onChange={(e) => {
                              const next = value[key].map((x, j) => (j === i ? { ...x, icon: e.target.value } : x));
                              updateValue({ ...value, [key]: next });
                            }}
                            className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                          >
                            {ICON_OPTIONS.map((ic) => (
                              <option key={ic} value={ic}>{ic}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold mb-1">Title</label>
                          <input
                            value={c.title || ""}
                            onChange={(e) => {
                              const next = value[key].map((x, j) => (j === i ? { ...x, title: e.target.value } : x));
                              updateValue({ ...value, [key]: next });
                            }}
                            className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold mb-1">Description</label>
                        <textarea
                          value={c.description || ""}
                          onChange={(e) => {
                            const next = value[key].map((x, j) => (j === i ? { ...x, description: e.target.value } : x));
                            updateValue({ ...value, [key]: next });
                          }}
                          rows={2}
                          className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950 resize-y"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateValue({ ...value, [key]: [...value[key], { icon: ICON_OPTIONS[0], title: "", description: "" }] })}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-ig-purple hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add {key}
                  </button>
                </div>
              </div>
            ) : null
          )}
        </div>
      );
    }

    // pricing: faqs + comparison
    if (Array.isArray(value.faqs) || Array.isArray(value.comparison)) {
      return (
        <div className="space-y-6">
          {Array.isArray(value.faqs) && (
            <div>
              <label className="block text-sm font-semibold mb-2">FAQs</label>
              <div className="space-y-3">
                {value.faqs.map((f, i) => (
                  <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/10 p-3 space-y-2 bg-gray-50 dark:bg-white/[0.02]">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black uppercase text-gray-400">FAQ {i + 1}</p>
                      <button
                        type="button"
                        onClick={() => updateValue({ ...value, faqs: value.faqs.filter((_, j) => j !== i) })}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      value={f.q || ""}
                      onChange={(e) => {
                        const next = value.faqs.map((x, j) => (j === i ? { ...x, q: e.target.value } : x));
                        updateValue({ ...value, faqs: next });
                      }}
                      placeholder="Question"
                      className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                    />
                    <textarea
                      value={f.a || ""}
                      onChange={(e) => {
                        const next = value.faqs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x));
                        updateValue({ ...value, faqs: next });
                      }}
                      placeholder="Answer"
                      rows={3}
                      className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950 resize-y"
                    />
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateValue({ ...value, faqs: [...value.faqs, { q: "", a: "" }] })}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-ig-purple hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add FAQ
                </button>
              </div>
            </div>
          )}
          {Array.isArray(value.comparison) && (
            <div>
              <label className="block text-sm font-semibold mb-2">Comparison Rows</label>
              <div className="space-y-2">
                {value.comparison.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 flex-wrap">
                    <input
                      value={c.feature || ""}
                      onChange={(e) => {
                        const next = value.comparison.map((x, j) => (j === i ? { ...x, feature: e.target.value } : x));
                        updateValue({ ...value, comparison: next });
                      }}
                      placeholder="Feature"
                      className="flex-1 min-w-[160px] text-xs rounded-lg border border-gray-300 dark:border-neutral-700 px-2.5 py-2 bg-white dark:bg-neutral-950"
                    />
                    {["free", "basic", "pro"].map((tier) => (
                      <label key={tier} className="flex items-center gap-1 text-[11px] font-semibold capitalize">
                        <input
                          type="checkbox"
                          checked={!!c[tier]}
                          onChange={(e) => {
                            const next = value.comparison.map((x, j) => (j === i ? { ...x, [tier]: e.target.checked } : x));
                            updateValue({ ...value, comparison: next });
                          }}
                          className="rounded accent-purple-600"
                        />
                        {tier}
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => updateValue({ ...value, comparison: value.comparison.filter((_, j) => j !== i) })}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateValue({ ...value, comparison: [...value.comparison, { feature: "", free: false, basic: false, pro: false }] })}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-ig-purple hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add row
                </button>
              </div>
            </div>
          )}
        </div>
      );
    }

    // features: hero_stats only (items edited in Advanced mode)
    if (Array.isArray(value.hero_stats)) {
      return (
        <div className="space-y-4">
          <label className="block text-sm font-semibold mb-2">Hero Stats</label>
          <div className="space-y-2">
            {value.hero_stats.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={s.v || ""}
                  onChange={(e) => {
                    const next = value.hero_stats.map((x, j) => (j === i ? { ...x, v: e.target.value } : x));
                    updateValue({ ...value, hero_stats: next });
                  }}
                  placeholder="Value"
                  className="w-28 text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                />
                <input
                  value={s.l || ""}
                  onChange={(e) => {
                    const next = value.hero_stats.map((x, j) => (j === i ? { ...x, l: e.target.value } : x));
                    updateValue({ ...value, hero_stats: next });
                  }}
                  placeholder="Label"
                  className="flex-1 text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                />
                <button
                  type="button"
                  onClick={() => updateValue({ ...value, hero_stats: value.hero_stats.filter((_, j) => j !== i) })}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => updateValue({ ...value, hero_stats: [...value.hero_stats, { v: "", l: "" }] })}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-ig-purple hover:underline"
            >
              <Plus className="w-3.5 h-3.5" /> Add stat
            </button>
          </div>
          <p className="text-[11px] text-gray-400">Feature items (the catalog) are managed separately.</p>
          {Array.isArray(value.items) && (
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-semibold">Feature Items</label>
              {value.items.map((it, i) => (
                <div key={i} className="rounded-2xl border border-gray-200 dark:border-white/10 p-3 space-y-2 bg-gray-50 dark:bg-white/[0.02]">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase text-gray-400">Item {i + 1}</p>
                    <button
                      type="button"
                      onClick={() => updateValue({ ...value, items: value.items.filter((_, j) => j !== i) })}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      value={it.name || ""}
                      onChange={(e) => {
                        const next = value.items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x));
                        updateValue({ ...value, items: next });
                      }}
                      placeholder="Name"
                      className="text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                    />
                    <input
                      value={it.category || ""}
                      onChange={(e) => {
                        const next = value.items.map((x, j) => (j === i ? { ...x, category: e.target.value } : x));
                        updateValue({ ...value, items: next });
                      }}
                      placeholder="Category"
                      className="text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950"
                    />
                  </div>
                  <textarea
                    value={it.description || ""}
                    onChange={(e) => {
                      const next = value.items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x));
                      updateValue({ ...value, items: next });
                    }}
                    placeholder="Description"
                    rows={2}
                    className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-950 resize-y"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => updateValue({ ...value, items: [...value.items, { id: "", name: "", category: "", description: "", image: "", featured: false }] })}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-ig-purple hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add item
              </button>
            </div>
          )}
        </div>
      );
    }

    return <p className="text-sm text-gray-500 italic">No visual editor available for this content.</p>;
  };

  return (
    <div className="space-y-5">
      <Seo title="Site Content | Admin" noIndex />
      <div>
        <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
          <Layout className="w-5 h-5 text-ig-purple" /> Site Content
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Edit the marketing copy shown across the site. Saved content is served live from the API.
        </p>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl bg-gray-50 dark:bg-white/[0.03] animate-pulse" />
      ) : (
        <div className="grid lg:grid-cols-[240px,1fr] gap-5">
          <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-3 h-fit">
            {items.map((item) => (
              <button
                key={item.key}
                onClick={() => select(item)}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-semibold transition-all mb-1 ${
                  active === item.key
                    ? "bg-gradient-to-r from-[#405DE6] to-[#833AB4] text-white shadow-md shadow-purple-500/20"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                }`}
              >
                <span className="block capitalize">{item.key}</span>
                <span className={`block text-[10px] mt-0.5 ${active === item.key ? "text-white/70" : "text-gray-400"}`}>
                  {({ home: "Home Page", features: "Features Page", pricing: "Pricing Page", about: "About Page", contact: "Contact Page", login: "Login Page" })[item.key] || ""}
                </span>
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-black capitalize">{active}</h2>
                <p className="text-xs text-gray-500">
                  {({ home: "Home Page", features: "Features Page", pricing: "Pricing Page", about: "About Page", contact: "Contact Page", login: "Login Page" })[active] || ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex rounded-xl border border-gray-200 dark:border-white/10 p-0.5">
                  <button
                    type="button"
                    onClick={() => setMode("visual")}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                      mode === "visual" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Layout className="w-3.5 h-3.5" /> Visual
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("json")}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                      mode === "json" ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" /> JSON
                  </button>
                </div>
                <button
                  onClick={save}
                  disabled={busy || !active}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 text-sm font-bold disabled:opacity-60"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </div>
            </div>

            {mode === "json" ? (
              <div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={20}
                  spellCheck={false}
                  className={`w-full text-xs font-mono rounded-xl border px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple ${
                    valid ? "border-gray-300 dark:border-neutral-700" : "border-red-500"
                  }`}
                />
                {!valid && <p className="mt-2 text-xs text-red-500">Invalid JSON — fix the syntax before saving.</p>}
              </div>
            ) : (
              renderVisual()
            )}
          </div>
        </div>
      )}
    </div>
  );
}
