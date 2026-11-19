import { Link } from "react-router-dom";
import Seo from "../components/Seo.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";

export default function LegalLayout({ title, description, keywords, updated, children }) {
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
      <Seo title={title} description={description} keywords={keywords} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 sm:pb-24 max-w-4xl">
        <Breadcrumb current={title.replace(" | vone_dm", "")} />
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">
            {title.replace(" | vone_dm", "")}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          {updated && <p className="text-xs text-gray-400 mt-2">Last updated: {updated}</p>}
        </div>

        <div className="prose prose-lg mx-auto text-gray-700 dark:text-gray-300 space-y-6 sm:space-y-8 text-sm sm:text-base leading-relaxed">
          {children}
        </div>

        <div className="mt-14 rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-7 text-center">
          <h3 className="font-bold text-lg mb-2">Related Legal Information &amp; Policies</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
            Read our other official guidelines and policies to learn more about how vone_dm operates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/privacy" className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-white/15 font-semibold text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-white/15 font-semibold text-sm">
              Terms &amp; Conditions
            </Link>
            <Link to="/refund-policy" className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-white/15 font-semibold text-sm">
              Refund Policy
            </Link>
            <Link to="/contact" className="px-5 py-2.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold text-sm">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
