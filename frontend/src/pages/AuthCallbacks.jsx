import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Instagram } from "lucide-react";
import { post } from "../lib/api.js";
import { useAuth } from "../lib/AuthContext.jsx";
import { useToast } from "../lib/ToastContext.jsx";

function CallbackScreen({ exchangeToken = false }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refresh } = useAuth();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    // StrictMode runs effects twice in dev — only start once, but never cancel
    // the navigation: cancelling it is what left users stuck on this screen.
    if (started.current) return;
    started.current = true;

    const timer = setTimeout(() => {
      setError("Sign-in is taking too long. Please go back to login and try again.");
    }, 15000);

    (async () => {
      try {
        if (exchangeToken) {
          const token = params.get("login_token");
          if (token) {
            try {
              await post("/api/auth/google/exchange", { token });
            } catch (e) {
              // Already-consumed token (refresh / second login) — if a session
              // exists, continue instead of failing.
              const existing = await refresh();
              if (existing) {
                clearTimeout(timer);
                navigate("/dashboard", { replace: true });
                return;
              }
              throw e;
            }
          }
        }

        const me = await refresh();
        clearTimeout(timer);
        if (me) navigate("/dashboard", { replace: true });
        else setError("Your session could not be verified. Please sign in again.");
      } catch (err) {
        clearTimeout(timer);
        setError(err.message || "Sign-in could not be completed.");
      }
    })();
  }, []); // run once

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4">
      <img src="/images/vone-logo.svg" alt="vone_dm" className="h-14 w-auto mb-6 animate-pulse" />
      {error ? (
        <>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <a href="/login" className="px-5 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm">
            Back to Login
          </a>
        </>
      ) : (
        <>
          <Loader2 className="w-8 h-8 animate-spin text-ig-purple" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Finishing sign-in…</p>
          <a href="/login" className="mt-4 text-xs text-blue-600 dark:text-blue-400 hover:underline">
            Taking too long? Back to login
          </a>
        </>
      )}
    </div>
  );
}

export function GoogleCallback() {
  return <CallbackScreen exchangeToken />;
}

/** Handles the return trip from Meta after a real Instagram OAuth connect. */
export function InstagramCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { refresh } = useAuth();
  const { showSuccess } = useToast();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const metaError = params.get("error");
    if (metaError) {
      setError(decodeURIComponent(metaError));
      return;
    }

    const linkToken = params.get("link_token");
    const timer = setTimeout(() => {
      setError("Connecting Instagram is taking too long. Please try again.");
    }, 20000);

    (async () => {
      try {
        if (linkToken) {
          await post("/api/instagram/link", { token: linkToken });
        }
        const me = await refresh();
        clearTimeout(timer);
        if (me) {
          showSuccess("Instagram account connected successfully!");
          navigate("/dashboard", { replace: true });
        } else {
          setError("Your session could not be verified. Please sign in again.");
        }
      } catch (err) {
        clearTimeout(timer);
        setError(err.message || "Instagram connection could not be completed.");
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-neutral-950 px-4">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#405DE6] via-[#833AB4] to-[#FD1D1D] text-white flex items-center justify-center mb-6">
        <Instagram className="w-7 h-7" />
      </div>
      {error ? (
        <>
          <p className="text-sm text-red-500 text-center max-w-md mb-4">{error}</p>
          <a href="/dashboard" className="px-5 py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm">
            Back to Dashboard
          </a>
        </>
      ) : (
        <>
          <Loader2 className="w-8 h-8 animate-spin text-ig-purple" />
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Connecting your Instagram account…</p>
        </>
      )}
    </div>
  );
}
