import { useEffect, useState } from "react";
import { Settings, Loader2, Save, KeyRound, ShieldCheck } from "lucide-react";
import Seo from "../../components/Seo.jsx";
import { get, put } from "../../lib/api.js";
import { useToast } from "../../lib/ToastContext.jsx";

export default function SettingsView() {
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState({ payment_key_id: "", payment_key_secret: "", currency: "INR" });
  const [secretSet, setSecretSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await get("/api/admin/settings");
        if (alive && d.settings) {
          setForm((f) => ({
            ...f,
            payment_key_id: d.settings.payment_key_id || "",
            currency: d.settings.currency || "INR",
          }));
          setSecretSet(!!d.settings.payment_key_secret_set);
        }
      } catch (e) {
        showError(e.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [showError]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...form };
      if (!payload.payment_key_secret) delete payload.payment_key_secret;
      await put("/api/admin/settings", payload);
      if (form.payment_key_secret) setSecretSet(true);
      showSuccess("Settings saved.");
    } catch (err) {
      showError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <Seo title="Settings | Admin" noIndex />
      <div>
        <h1 className="text-xl sm:text-2xl font-black flex items-center gap-2">
          <Settings className="w-5 h-5 text-ig-purple" /> Settings
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Payment gateway keys and platform configuration.
        </p>
      </div>

      <form onSubmit={save} className="w-full rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-6 space-y-5">
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 p-4 flex gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-700 dark:text-emerald-300">
            <p className="font-bold mb-1">Payment mode: LIVE</p>
            <p>
              Checkout uses the real Razorpay gateway. Create an account at{" "}
              <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" className="underline font-semibold">
                dashboard.razorpay.com
              </a>
              , then paste the Key ID and Key Secret from <strong>Settings → API Keys</strong> below. Payments are
              verified with an HMAC signature on the server before a plan is upgraded.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-ig-purple" /> Payment Key ID
          </label>
          <input
            value={form.payment_key_id}
            onChange={(e) => setForm((f) => ({ ...f, payment_key_id: e.target.value }))}
            placeholder="rzp_test_xxxxxxxxxxxx"
            className="w-full text-sm font-mono rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
          />
          <p className="text-[11px] text-gray-400 mt-1">Your Razorpay (or other gateway) public key id.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Payment Key Secret</label>
          <input
            type="password"
            value={form.payment_key_secret}
            onChange={(e) => setForm((f) => ({ ...f, payment_key_secret: e.target.value }))}
            placeholder={secretSet ? "•••••••• (saved — enter to replace)" : "your_key_secret"}
            className="w-full text-sm font-mono rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            {secretSet ? "A secret is saved. Leave blank to keep it." : "Used server-side to verify payment signatures."}
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">Currency</label>
          <input
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950"
          />
        </div>

        <button
          type="submit"
          disabled={busy || loading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold text-sm disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Settings
        </button>
      </form>
    </div>
  );
}
