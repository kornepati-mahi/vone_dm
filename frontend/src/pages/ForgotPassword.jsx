import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import Seo from "../components/Seo.jsx";
import { post } from "../lib/api.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      const data = await post("/api/forgot-password", { email: email.trim().toLowerCase() });
      setMessage(data?.message || "Password reset link sent! Check your email.");
      if (data?.reset_url) setResetUrl(data.reset_url);
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4 py-12 transition-colors duration-500">
      <Seo title="Forgot Password | vone_dm" noIndex />
      <div className="w-full max-w-md">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <div className="rounded-2xl border border-gray-200 dark:border-white/[0.07] bg-white dark:bg-white/[0.03] p-7 shadow-sm">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#405DE6] to-[#833AB4] text-white flex items-center justify-center mb-4">
              {message ? <CheckCircle2 className="w-6 h-6" /> : <Mail className="w-6 h-6" />}
            </div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">Forgot your password?</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Enter your email and we'll send you a link to reset it.
            </p>
          </div>

          {message ? (
            <div className="text-center space-y-4">
              <p className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm p-4">{message}</p>
              {resetUrl && (
                <a href={resetUrl} className="block text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline break-all">
                  Open your password reset link →
                </a>
              )}
              <Link to="/login" className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#FD1D1D] text-white font-bold text-sm">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5 text-gray-800 dark:text-gray-200">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  className="w-full h-11 px-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
                />
                {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#FD1D1D] text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Reset Link
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
