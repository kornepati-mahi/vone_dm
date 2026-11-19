import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, XCircle } from "lucide-react";
import Seo from "../components/Seo.jsx";
import { get, post } from "../lib/api.js";
import { useAuth } from "../lib/AuthContext.jsx";

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* Password strength meter — same scoring as the live site */
function passwordScore(pw) {
  let s = 0;
  if (pw.length > 7) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z\d]/.test(pw)) s++;
  return s;
}
const strengthLabel = (s) => ["Very Weak", "Weak", "Fair", "Good", "Strong"][s];
const strengthColor = (s) => ["bg-red-500", "bg-red-400", "bg-yellow-500", "bg-blue-500", "bg-green-500"][s];

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = passwordScore(password);
  const color = strengthColor(score);
  return (
    <div className="mt-3 relative z-0">
      <div className="flex justify-between items-center mb-1">
        <span className={`text-xs font-medium ${color.replace("bg-", "text-")}`}>{strengthLabel(score)}</span>
      </div>
      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-300 ease-out`} style={{ width: `${(score + 1) * 20}%` }} />
      </div>
    </div>
  );
}

const PERKS = ["Automated Replies", "Audience Segmentation", "Performance Analytics"];

export default function Login() {
  const [, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { refresh, isAuthenticated, isLoading, user } = useAuth();

  // Mirrors the live site's login/register toggle in one card.
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [verifyUrl, setVerifyUrl] = useState("");
  const [blockedMsg, setBlockedMsg] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Same popup_reason / success / message handling as the live site.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const reason = q.get("popup_reason");
    const success = q.get("success") || q.get("success_reason");
    const raw = q.get("message");
    const text = raw ? decodeURIComponent(raw) : null;

    if (reason) {
      if (reason === "user_banned" || reason === "hard_ban") {
        setBlockedMsg(text || "Your account has been hard banned. Dashboard access has been blocked.");
      } else if (reason === "email_change_failed") {
        setErrorMsg(text || "Failed to verify email change.");
      } else if (text) {
        setErrorMsg(text);
      } else if (reason === "not_logged_in") {
        setErrorMsg("You must be logged in to view this page.");
      } else if (reason === "user_deleted") {
        setErrorMsg("Your account has been deleted.");
      } else if (reason === "invalid_session") {
        setErrorMsg("Your session is invalid. Please log in again.");
      } else if (reason === "oauth_failed") {
        setErrorMsg("Google login failed. Please try again.");
      } else if (reason === "session_creation_failed") {
        setErrorMsg("Failed to create user session after Google login. Please try again.");
      } else if (reason === "auth_error") {
        setErrorMsg("An unexpected authentication error occurred. Please try again.");
      }
    } else if (success && text) {
      setSuccessMsg(text);
    }
  }, []);

  // If the session is already valid, go straight to the dashboard.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(user?.role === "admin" ? "/admin" : "/dashboard", { replace: true });
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setVerifyUrl("");
    setBlockedMsg(null);

    if (!emailOk(form.email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (!isLogin) {
      if (form.password.length < 8) {
        setErrorMsg("Password must be at least 8 characters long.");
        return;
      }
      if (form.password !== form.confirm) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    setBusy(true);
    const path = isLogin ? "/api/login" : "/api/register";
    try {
      const data = await post(path, {
        email: form.email,
        password: form.password,
        name: isLogin ? undefined : form.name,
        isLoginView: isLogin,
      });

      if (isLogin) {
        // Live site: after POST it calls login() -> /api/me, then redirects.
        const me = await refresh();
        if (!me) throw new Error("Login completed, but the dashboard session could not be verified. Please try again.");
        navigate(me.role === "admin" ? "/admin" : "/dashboard", { replace: true });
      } else {
        setSuccessMsg(data?.message || "Registration successful. Please check your email to verify your account.");
        if (data?.verify_url) setVerifyUrl(data.verify_url);
      }
    } catch (err) {
      setErrorMsg(err.message || `Failed to ${isLogin ? "login" : "register"}.`);
    } finally {
      setBusy(false);
    }
  };

  const googleSignIn = async () => {
    setErrorMsg(null);
    setBusy(true);
    try {
      const data = await get(
        "/auth/google?target=frontend&redirect_origin=" + encodeURIComponent(window.location.origin)
      );
      if (!data?.url) throw new Error(data?.error || "Failed to get Google login URL.");
      window.location.href = data.url;
    } catch (err) {
      setErrorMsg(err.message || "Failed to start Google sign-in. Please try again.");
      setBusy(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((v) => !v);
    setErrorMsg(null);
    setSuccessMsg(null);
    setVerifyUrl("");
    setBlockedMsg(null);
    setParams(isLogin ? { mode: "register" } : {});
  };

  return (
    <div className="min-h-screen overflow-y-auto flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-3 py-20 sm:px-4 sm:py-24 transition-colors duration-500">
      <Seo title="Login & Register | vone_dm" description="Access your vone_dm dashboard or register a new account to configure your Instagram DM automations." noIndex />

      <div className="w-full max-w-4xl mx-auto my-4 bg-white dark:bg-neutral-900 shadow-2xl dark:shadow-black/40 rounded-2xl flex overflow-hidden transition-colors duration-500">
        {/* Marketing panel (live site: dark left half) */}
        <div className="hidden md:flex w-1/2 bg-black dark:bg-neutral-800 text-white p-10 lg:p-12 flex-col justify-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Automate Your DMs, Grow Your Brand</h2>
          <p className="text-gray-300 dark:text-gray-400 mb-8">
            Join thousands of creators and businesses who use vone_dm to save time and boost engagement on Instagram.
          </p>
          <ul className="space-y-4">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center">
                <span className="text-green-400 mr-3">✓</span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="w-full md:w-1/2 p-6 sm:p-7 md:p-8 lg:p-10 flex flex-col justify-center overflow-y-auto">
          <div className="text-center w-full">
            <div className="relative isolate inline-flex items-center justify-center mx-auto mb-3">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#405DE6]/30 via-[#833AB4]/30 to-[#FD1D1D]/30 rounded-full blur-xl pointer-events-none -z-10" />
              <img src="/images/vone-logo.svg" alt="vone_dm Logo" className="relative z-10 mx-auto object-contain dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.75)]" style={{ maxHeight: "62px" }} />
            </div>

            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{isLogin ? "Welcome Back!" : "Create Your Account"}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {isLogin ? "Sign in to continue to your dashboard." : "Get started with vone_dm today."}
            </p>

            {blockedMsg && (
              <div className="mb-4 rounded-xl border border-red-300 bg-red-100 px-4 py-3 text-left shadow-sm dark:border-red-500/40 dark:bg-red-950/40">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-700 dark:text-red-300">Account Blocked</p>
                <p className="mt-2 break-words whitespace-pre-wrap text-sm font-medium leading-6 text-red-800 dark:text-red-200">{blockedMsg}</p>
              </div>
            )}
            {errorMsg && (
              <p className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-md mb-4 text-left text-sm">{errorMsg}</p>
            )}
            {successMsg && (
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-3 rounded-md mb-4 text-left text-sm">
                <p>{successMsg}</p>
                {verifyUrl && (
                  <a href={verifyUrl} className="inline-block mt-2 text-blue-600 dark:text-blue-400 underline break-all">
                    Open your verification link →
                  </a>
                )}
              </div>
            )}

            <form onSubmit={submit} method="post" action="#" className="space-y-4 text-left">
              {!isLogin && (
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={set("name")}
                  required
                  autoComplete="name"
                  className="w-full h-11 px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
                />
              )}

              <input
                id="email-input"
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={set("email")}
                required
                autoComplete="username email"
                className="w-full h-11 px-4 py-2.5 text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
              />

              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={set("password")}
                  required
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  className="w-full h-11 px-4 py-2.5 pr-11 text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {!isLogin && (
                <>
                  <PasswordStrength password={form.password} />
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={form.confirm}
                      onChange={set("confirm")}
                      required
                      autoComplete="new-password"
                      className="w-full h-11 px-4 py-2.5 pr-11 text-sm text-gray-900 dark:text-white bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
                    />
                    {form.confirm && (
                      <div className="absolute right-12 top-1/2 -translate-y-1/2">
                        {form.password === form.confirm ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : (
                          <XCircle size={18} className="text-red-500" />
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {isLogin && (
                <div className="text-right -mt-2">
                  <Link to="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#FD1D1D] text-white font-semibold shadow-md hover:shadow-lg hover:shadow-[#833AB4]/25 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center disabled:opacity-50"
              >
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLogin ? "Sign In" : "Sign Up"}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300 dark:border-neutral-700" /></div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-neutral-900 text-gray-500 dark:text-gray-400">OR</span>
              </div>
            </div>

            <button
              type="button"
              onClick={googleSignIn}
              className="w-full group relative flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-black dark:bg-neutral-800 hover:bg-gray-800 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-300 ease-in-out overflow-hidden"
            >
              <span className="absolute left-0 top-0 h-full w-full bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#FD1D1D] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative flex items-center">
                <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.226,44,30.425,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                Sign in with Google
              </span>
            </button>

            <p className="text-sm text-gray-500 dark:text-gray-400 mt-5">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={toggleMode} className="font-medium text-blue-600 dark:text-blue-400 hover:underline ml-1">
                {isLogin ? "Sign Up" : "Sign In"}
              </button>
            </p>

            <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
              By continuing, you agree to our{" "}
              <Link to="/terms" className="text-blue-500 dark:text-blue-400 hover:underline">Terms of Service</Link>{" "}
              and{" "}
              <Link to="/privacy" className="text-blue-500 dark:text-blue-400 hover:underline">Privacy Policy</Link>
              .
            </p>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-white/[0.06] text-center">
              <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
