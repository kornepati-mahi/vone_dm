import { useState } from "react";
import { Instagram, Loader2 } from "lucide-react";
import { get } from "../lib/api.js";
import { useToast } from "../lib/ToastContext.jsx";

/**
 * Starts the real Meta/Instagram OAuth flow.
 * Same round-trip as Google sign-in: backend URL -> Meta -> backend callback
 * -> frontend callback page -> account linked to the logged-in user.
 */
export async function startInstagramConnect() {
  const data = await get(
    "/auth/instagram?redirect_origin=" + encodeURIComponent(window.location.origin)
  );
  if (!data?.url) throw new Error(data?.error || "Failed to get the Instagram login URL.");
  window.location.href = data.url;
}

/** "Connect with Instagram" button styled like the login page's Google button. */
export default function InstagramConnectButton({
  label = "Connect with Instagram",
  full = true,
  className = "",
  onError,
}) {
  const [busy, setBusy] = useState(false);
  const { showError } = useToast();

  const click = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await startInstagramConnect();
    } catch (err) {
      setBusy(false);
      const message = err.message || "Failed to start Instagram login.";
      if (onError) onError(message);
      else showError(message);
    }
  };

  return (
    <button
      type="button"
      onClick={click}
      disabled={busy}
      className={`group relative flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-lg text-white bg-black dark:bg-neutral-800 hover:bg-gray-800 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ig-purple transition-all duration-300 ease-in-out overflow-hidden disabled:opacity-60 ${
        full ? "w-full" : ""
      } ${className}`}
    >
      <span className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <span className="relative flex items-center justify-center gap-2.5">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Instagram className="w-5 h-5" />}
        <span>{busy ? "Opening Instagram…" : label}</span>
      </span>
    </button>
  );
}
