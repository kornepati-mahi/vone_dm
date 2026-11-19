import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { KeyRound, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import Seo from "../components/Seo.jsx";
import { post } from "../lib/api.js";
import { useToast } from "../lib/ToastContext.jsx";
import { useAuth } from "../lib/AuthContext.jsx";

export function Recovery() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const token = params.get("token") || "";
  const userId = params.get("userId") || "";
  const secret = params.get("secret") || "";
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => navigate("/login", { replace: true }), 2000);
      return () => clearTimeout(t);
    }
  }, [done, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (form.password.length < 8) errs.password = "Password must be at least 8 characters long.";
    if (form.password !== form.confirm) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      if (userId && secret) {
        await post("/api/auth/recovery", {
          userId,
          secret,
          newPassword: form.password,
          confirmPassword: form.confirm,
        });
      } else {
        await post("/api/auth/reset-password", { token, password: form.password });
      }
      showSuccess("Password Reset Successful!");
      setDone(true);
    } catch (err) {
      showError(err.message || "Failed to reset password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-4">
      <Seo title="Reset Password | vone_dm" noIndex />
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-7">
          <img src="/images/vone-logo.svg" alt="vone_dm Logo" className="h-10 w-auto" />
          <span className="text-2xl font-black tracking-tight">vone_dm</span>
        </Link>

        <div className="rounded-3xl border border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] p-7 shadow-sm">
          {!token && !(userId && secret) && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 p-4 mb-5 text-sm text-red-600 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              Invalid recovery link. Please request a new password reset.
            </div>
          )}

          {done ? (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
              <h1 className="text-xl font-black mb-2">Password Reset Successful!</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Redirecting you to login...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#405DE6] to-[#833AB4] text-white flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black leading-tight">Reset Your Password</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Enter your new password below.</p>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">New Password</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
                    required
                  />
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={form.confirm}
                    onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                    className="w-full text-sm rounded-xl border border-gray-300 dark:border-neutral-700 px-3.5 py-3 bg-white dark:bg-neutral-950 focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
                    required
                  />
                  {errors.confirm && <p className="text-xs text-red-500 mt-1">{errors.confirm}</p>}
                </div>
                <button
                  type="submit"
                  disabled={busy || !(token || (userId && secret))}
                  className="w-full py-3.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />} Reset Password
                </button>
              </form>
            </>
          )}

          <p className="mt-6 text-center text-sm">
            <Link to="/login" className="font-semibold text-ig-purple hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function Verify() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [status, setStatus] = useState("verifying");
  const { refresh } = useAuth();
  const token = params.get("token") || "";
  const email = params.get("email") || "";
  const userId = params.get("userId") || "";
  const secret = params.get("secret") || "";

  useEffect(() => {
    let alive = true;
    if (!token && !(userId && secret)) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        if (userId && secret) {
          await post("/api/auth/verify-callback", { userId, secret });
          await refresh();
          if (alive) setStatus("success");
          setTimeout(() => navigate("/dashboard", { replace: true }), 1600);
        } else {
          await post("/api/auth/verify-email", { token, email });
          if (!alive) return;
          setStatus("success");
          setTimeout(() => navigate("/login?message=" + encodeURIComponent("Email verified! You can sign in now."), { replace: true }), 1800);
        }
      } catch {
        if (alive) setStatus("failed");
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, email, userId, secret, navigate, refresh]);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-4">
      <Seo title="Verify Email | vone_dm" noIndex />
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5 mb-7">
          <img src="/images/vone-logo.svg" alt="vone_dm Logo" className="h-10 w-auto" />
          <span className="text-2xl font-black tracking-tight">vone_dm</span>
        </Link>

        <div className="rounded-3xl border border-gray-100 dark:border-white/[0.07] bg-gray-50 dark:bg-white/[0.03] p-8 shadow-sm">
          {status === "verifying" && (
            <>
              <Loader2 className="w-10 h-10 mx-auto text-ig-purple animate-spin mb-4" />
              <h1 className="text-xl font-black mb-2">Verifying your email...</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Please wait while we confirm your account.</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-4" />
              <h1 className="text-xl font-black mb-2">Verification successful!</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Logging you in...</p>
            </>
          )}
          {status !== "verifying" && status !== "success" && (
            <>
              <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-4" />
              <h1 className="text-xl font-black mb-2">
                {status === "invalid" ? "Invalid verification link. Missing required parameters." : "Verification Failed"}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {status === "invalid" ? "Please request a new verification email." : "Failed to verify email. The link may have expired."}
              </p>
              <div className="flex gap-3 justify-center">
                <Link to="/login" className="px-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold text-sm">
                  Go to Login
                </Link>
                <Link to="/" className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-white/15 font-bold text-sm">
                  Back to Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center px-4">
      <Seo title="Page Not Found | vone_dm" noIndex />
      <div className="text-center max-w-md">
        <img src="/images/vone-logo.svg" alt="Confused Panda" className="w-24 h-24 mx-auto mb-6 opacity-80" />
        <p className="text-7xl font-black text-ig-purple mb-4">404</p>
        <h1 className="text-2xl font-bold mb-2">Oops! Looks like you've taken a wrong turn.</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-2">The requested page could not be found.</p>
        <p className="text-sm text-gray-500 mb-8">Even our panda gets confused sometimes.</p>
        <Link
          to="/"
          className="inline-block px-7 py-3.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm"
        >
          Go back to Home
        </Link>
      </div>
    </div>
  );
}
