import { Link } from "react-router-dom";

const QUICK_LINKS = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/blog", label: "Blogs" },
  { to: "/about", label: "About Us" },
  { to: "/contact", label: "Contact" },
  { to: "/login", label: "Login" },
];

const LEGAL_LINKS = [
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/disclaimer", label: "Disclaimer" },
  { to: "/refund-policy", label: "Refund Policy" },
  { to: "/delete-account-guide", label: "Delete Account Guide" },
];

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-neutral-950 border-t border-gray-100 dark:border-white/[0.06]">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <img
                src="/images/vone-logo.svg"
                alt="vone_dm Logo"
                width={36}
                height={36}
                className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
              />
              <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">vone_dm</span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm leading-relaxed max-w-sm">
              Certified Meta Partner direct message and comment automation suite designed for creators, brands, and
              businesses.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/[0.05] border border-gray-200/60 dark:border-white/[0.08] text-xs font-semibold text-gray-600 dark:text-gray-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Meta Graph API Approved Partner</span>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors duration-200 block py-0.5"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors duration-200 block py-0.5"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">Contact</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:support@dmpanda.com"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors duration-200 block py-0.5"
                >
                  support@dmpanda.com
                </a>
              </li>
              <li>
                <span className="text-gray-600 dark:text-gray-400 text-sm block py-0.5">
                  Meta Business Partner since 2021
                </span>
              </li>
              <li>
                <span className="text-gray-600 dark:text-gray-400 text-sm block py-0.5">Made in India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-black/30 py-5 border-t border-gray-100 dark:border-white/[0.06]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
            © {new Date().getFullYear()} vone_dm. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Terms &amp; Conditions
            </Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
