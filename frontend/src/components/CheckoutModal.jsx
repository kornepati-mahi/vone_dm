import { useEffect, useState } from "react";
import { X, ShieldCheck, Loader2, CheckCircle2, CreditCard, Smartphone } from "lucide-react";
import { post } from "../lib/api.js";
import { useToast } from "../lib/ToastContext.jsx";
import { useAuth } from "../lib/AuthContext.jsx";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

/** Loads Razorpay checkout.js on demand (the script is also preloaded in index.html). */
function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(!!window.Razorpay);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/** Real Razorpay checkout: order created server-side, signature verified server-side. */
export default function CheckoutModal({ plan, cycle = "monthly", open, onClose, onSuccess }) {
  const { showSuccess, showError } = useToast();
  const { refresh } = useAuth();
  const [creating, setCreating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const price = cycle === "yearly" ? plan?.price_yearly_inr : plan?.price_monthly_inr;

  useEffect(() => {
    if (!open) {
      setCreating(false);
      setPaying(false);
      setDone(false);
      setError(null);
      return;
    }
  }, [open]);

  if (!open || !plan) return null;

  const startPayment = async () => {
    setCreating(true);
    setError(null);
    try {
      const order = await post("/api/payments/create-order", {
        plan_code: plan.plan_code,
        cycle,
      });
      const ready = await loadRazorpay();
      if (!ready || !order.key_id) {
        throw new Error("Payment gateway is unavailable. Check your connection or the Razorpay key in Admin → Settings.");
      }
      setCreating(false);
      setPaying(true);
      const rzp = new window.Razorpay({
        key: order.key_id,
        amount: order.amount * 100,
        currency: order.currency,
        name: "vone_dm",
        description: `${order.plan_name} (${order.cycle})`,
        order_id: order.order_id,
        theme: { color: "#833AB4" },
        handler: async (resp) => {
          try {
            const v = await post("/api/payments/verify", {
              order_id: order.order_id,
              payment_id: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            });
            finish(v);
          } catch (e) {
            showError(e.message);
            setPaying(false);
          }
        },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch (e) {
      setCreating(false);
      setPaying(false);
      setError(e.message);
      showError(e.message);
    }
  };

  const finish = async (result) => {
    setPaying(false);
    setDone(true);
    showSuccess(result.message || "Payment successful!");
    try {
      await refresh();
    } catch {}
    if (onSuccess) onSuccess(result);
    setTimeout(() => {
      onClose();
    }, 1600);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#141416] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/[0.07]">
          <div className="flex items-center gap-2">
            <img src="/images/vone-logo.svg" alt="" className="h-7 w-auto" />
            <div>
              <p className="font-black text-sm leading-tight">vone_dm Checkout</p>
              <p className="text-[11px] text-gray-500">Secure payment · Razorpay</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {done ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-14 h-14 mx-auto text-emerald-500 mb-4" />
              <h3 className="font-black text-lg mb-1">Payment Successful!</h3>
              <p className="text-sm text-gray-500">Your {plan.name} is now active.</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] p-4 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black">{plan.name}</p>
                    <p className="text-xs text-gray-500 capitalize">{cycle} billing · per Instagram account</p>
                  </div>
                  <p className="text-2xl font-black">{inr(price)}</p>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 mb-4 text-center">{error}</p>
              )}

              <button
                onClick={startPayment}
                disabled={creating || paying}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-500/25 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-70"
              >
                {creating || paying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {creating ? "Preparing order..." : "Processing payment..."}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" /> Pay {inr(price)}
                  </>
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-4 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 256-bit SSL
                </span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5" /> UPI · Cards · Netbanking
                </span>
              </div>

            </>
          )}
        </div>
      </div>
    </div>
  );
}
