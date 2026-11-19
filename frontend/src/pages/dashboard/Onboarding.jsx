import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Instagram, KeyRound, Loader2, MailCheck } from "lucide-react";
import { post } from "../../lib/api.js";
import { useAuth } from "../../lib/AuthContext.jsx";
import { useToast } from "../../lib/ToastContext.jsx";
import InstagramConnectButton from "../../components/InstagramConnectButton.jsx";

const STEPS = [
  { id: "verify", label: "Verify", icon: MailCheck },
  { id: "instagram", label: "Instagram", icon: Instagram },
  { id: "password", label: "Password", icon: KeyRound },
];

export default function Onboarding({ onSkip }) {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const { showSuccess } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [verifyUrl, setVerifyUrl] = useState("");
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");

  const pending = [];
  if (!user?.emailVerification) pending.push("verify");
  // Google signups already have a verified email, so Instagram is the first
  // thing they are asked to connect when they land on the dashboard.
  if (!user?.hasLinkedInstagram) pending.push("instagram");
  if (!user?.hasPassword) pending.push("password");
  const current = pending[0] || "instagram";

  useEffect(() => {
    if (pending.length === 0) navigate("/dashboard", { replace: true });
  }, [pending.length, navigate]);

  const finish = async () => {
    await refresh();
  };

  const resend = async () => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const data = await post("/api/account/resend-verification", {});
      setNotice(data?.message || "Verification email sent! Check your inbox.");
      if (data?.verify_url) setVerifyUrl(data.verify_url);
    } catch (err) {
      setError(err.message || "Failed to send verification email.");
    } finally {
      setBusy(false);
    }
  };

  const setPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      await post("/api/account/set-password", { password });
      showSuccess("Password set successfully!");
      await refresh();
    } catch (err) {
      setError(err.message || "Failed to set password.");
    } finally {
      setBusy(false);
    }
  };

  const skip = () => {
    if (onSkip) onSkip();
    navigate("/dashboard", { replace: true });
  };

  if (pending.length === 0) return null;

  const stepIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4 py-10 transition-colors duration-500">
      <div className="w-full max-w-xl bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100 dark:border-white/[0.07] shadow-xl p-7 sm:p-10">
        <div className="text-center mb-8">
          <img src="/images/vone-logo.svg" alt="vone_dm" className="h-12 w-auto mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">One last step to get started</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Set up your account in a few quick steps.</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-start justify-center mb-9">
          {STEPS.map((step, i) => {
            const completed = i < stepIndex;
            const active = i === stepIndex;
            const Icon = step.icon;
            return (
              <div key={step.id} className="flex items-start">
                <div className="flex flex-col items-center w-16 sm:w-24">
                  <div
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 ${
                      completed
                        ? "bg-gradient-to-r from-emerald-400 to-green-500 text-white"
                        : active
                          ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg scale-105"
                          : "bg-gray-200 text-gray-500 dark:bg-neutral-700 dark:text-gray-400"
                    }`}
                  >
                    {completed ? <CheckCircle2 size={20} /> : <Icon size={18} />}
                  </div>
                  <span
                    className={`mt-2 text-xs font-semibold text-center ${
                      completed ? "text-emerald-600 dark:text-emerald-400" : active ? "text-gray-900 dark:text-white" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-1 w-8 sm:w-16 mt-5 rounded-full ${completed ? "bg-emerald-400" : "bg-gray-200 dark:bg-neutral-700"}`} />
                )}
              </div>
            );
          })}
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-sm p-3">{error}</p>}
        {notice && <p className="mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-sm p-3">{notice}</p>}

        {current === "verify" && (
          <div className="space-y-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <MailCheck className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Verify your email</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              We sent a verification link to <strong className="text-gray-800 dark:text-gray-200">{user?.email}</strong>. Click it to confirm your address.
            </p>
            <button
              type="button"
              onClick={resend}
              disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#FD1D1D] text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Resend verification email
            </button>
            {verifyUrl && (
              <a href={verifyUrl} className="block text-xs text-blue-600 dark:text-blue-400 hover:underline break-all">
                Open your verification link →
              </a>
            )}
            <button
              type="button"
              onClick={finish}
              className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              I verified my email — continue
            </button>
          </div>
        )}

        {current === "password" && (
          <form onSubmit={setPassword} className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-ig-purple flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mt-3">Create a password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Secure your account with a password of at least 8 characters.</p>
            </div>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPasswordValue(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
              required
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-sm focus:outline-none focus:border-ig-purple focus:ring-2 focus:ring-ig-purple/15"
              required
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#405DE6] via-[#833AB4] to-[#FD1D1D] text-white font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Set Password
            </button>
          </form>
        )}

        {current === "instagram" && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#405DE6] via-[#833AB4] to-[#FD1D1D] text-white flex items-center justify-center">
                <Instagram className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white mt-3">Connect your Instagram</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Securely link your Instagram Business or Creator account with Meta to start creating automations.
              </p>
            </div>
            <InstagramConnectButton onError={setError} />
            <p className="text-center text-[11px] text-gray-400 dark:text-gray-500">
              You'll be redirected to Meta to approve the connection, then brought straight back here.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={skip}
          className="mt-7 block w-full text-center text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Skip for now — go to dashboard
        </button>
      </div>
    </div>
  );
}
