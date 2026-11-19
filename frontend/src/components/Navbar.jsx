import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, Sun, Moon, Loader2 } from "lucide-react";
import { useAuth } from "../lib/AuthContext.jsx";
import { useTheme } from "../lib/ThemeContext.jsx";

const LINKS = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/blog", label: "Blogs" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 10);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const authBtn = (cls) => {
    if (isLoading && !isAuthenticated) {
      return (
        <span className={`${cls} flex items-center justify-center gap-2 opacity-80 cursor-wait min-w-[120px]`}>
          <Loader2 className="w-5 h-5 animate-spin" />
        </span>
      );
    }
    if (isAuthenticated) {
      return (
        <Link to="/dashboard" className={cls}>
          Dashboard
        </Link>
      );
    }
    return (
      <Link to="/login" className={cls}>
        Login
      </Link>
    );
  };

  const pill =
    "px-5 py-2.5 rounded-xl text-sm font-bold bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:opacity-90 transition-all active:scale-[0.98]";

  return (
    <div ref={wrapRef}>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${
          scrolled && !open
            ? "bg-white/85 dark:bg-neutral-950/85 backdrop-blur-md border-b border-neutral-200/60 dark:border-white/[0.08] shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <Link to="/" className="flex items-center gap-2.5 group relative isolate p-1 -ml-1">
              <img
                src="/images/vone-logo.svg"
                alt="vone_dm Logo"
                width={40}
                height={40}
                className="h-9 sm:h-10 w-auto object-contain transition-transform duration-200 group-hover:scale-105 relative z-10 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.75)]"
              />
              <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white hidden xs:inline-block">
                vone_dm
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                      isActive
                        ? "text-gray-900 dark:text-white bg-neutral-100/70 dark:bg-white/[0.07]"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-100/70 dark:hover:bg-white/[0.05]"
                    }`
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2.5">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              {authBtn(pill)}
              {!isAuthenticated && (
                <Link
                  to="/login?mode=register"
                  className="px-5 py-2.5 rounded-xl text-sm font-bold border-2 border-transparent bg-clip-padding relative before:absolute before:inset-0 before:rounded-xl before:p-[2px] before:bg-gradient-to-r before:from-[#405DE6] before:via-[#833AB4] before:to-[#FD1D1D] before:-z-10 before:content-[''] text-gray-900 dark:text-white bg-white dark:bg-neutral-950 hover:bg-gray-50 dark:hover:bg-neutral-900 transition-all"
                >
                  Sign Up
                </Link>
              )}
            </div>

            <div className="flex md:hidden items-center gap-1.5">
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="p-2 rounded-lg text-neutral-500 dark:text-neutral-400"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setOpen((v) => !v)}
                aria-label={open ? "Close navigation menu" : "Open navigation menu"}
                className="p-2 rounded-lg text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/[0.06]"
              >
                {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-md z-40 transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
      />
      <div
        className={`md:hidden fixed top-0 right-0 h-full w-[280px] max-w-[85vw] bg-white dark:bg-[#121214] border-l border-neutral-200/80 dark:border-white/10 shadow-2xl z-50 transition-transform duration-300 ease-out overflow-y-auto overscroll-contain scrollbar-none ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200/80 dark:border-white/10">
          <span className="text-lg font-black text-gray-900 dark:text-white">Menu</span>
          <button onClick={() => setOpen(false)} aria-label="Close navigation menu" className="p-2">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 flex flex-col gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`block text-center py-3 text-base font-semibold rounded-xl transition-all duration-200 ${
                location.pathname === l.to
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-3 flex flex-col gap-2.5">
            {authBtn(
              "block text-center py-3 text-base font-semibold rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900"
            )}
            {!isAuthenticated && (
              <>
                <Link
                  to="/login?mode=register"
                  className="block text-center py-3 text-base font-semibold rounded-xl border border-gray-300 dark:border-white/15 text-gray-800 dark:text-gray-100"
                >
                  Sign Up
                </Link>
              </>
            )}
            {isAuthenticated && (
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                  navigate("/");
                }}
                className="text-center py-2.5 text-sm font-semibold rounded-xl text-red-500 border border-red-200 dark:border-red-900/50"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
