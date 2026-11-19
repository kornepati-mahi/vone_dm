import { useState } from "react";
import { Link } from "react-router-dom";
import { LifeBuoy, Mail, MessageSquareWarning, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import Seo from "../components/Seo.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import RevealSection from "../components/RevealSection.jsx";
import { Input, Textarea, Button } from "../components/ui.jsx";
import { post } from "../lib/api.js";
import { useToast } from "../lib/ToastContext.jsx";
import { useContent } from "../lib/content.jsx";

const FALLBACK_INCLUDES = [
  "Your vone_dm login email and the Instagram username or linked account.",
  "The dashboard section you used, such as Account Settings, My Plan, Transactions, or a specific automation editor.",
  "Your payment ID and selected plan if the problem is billing-related.",
  "The exact issue, expected result, and any error text you saw.",
];

const FALLBACK_REASONS = [
  "Payment succeeded but your plan did not refresh.",
  "Instagram linking or relinking did not complete.",
  "An automation saved but is not firing as expected.",
  "A reply template, keyword, or collect-email route is not behaving correctly.",
];

export default function Contact() {
  const { showSuccess, showError } = useToast();
  const { value: contactContent } = useContent("contact");
  const INCLUDES = contactContent?.includes?.length ? contactContent.includes : FALLBACK_INCLUDES;
  const REASONS = contactContent?.reasons?.length ? contactContent.reasons : FALLBACK_REASONS;
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Please enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Please enter a valid email address.";
    if (form.message.trim().length < 10) errs.message = "Please describe your issue in at least 10 characters.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    try {
      await post("/api/contact", form);
      showSuccess("Message sent! Our team will reply to your email shortly.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      showError(err.message || "An error occurred. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 flex flex-col justify-between">
      <Seo
        title="Contact Support | vone_dm"
        description="Get in touch with the vone_dm support team. Contact us for account configuration, billing queries, Instagram connection troubleshooting, or developer assistance."
        keywords="contact dm panda, support dm panda, instagram automation help, contact email dm panda"
        schema={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Support | vone_dm",
          mainEntity: { "@type": "ContactPoint", email: "support@dmpanda.com", contactType: "customer support" },
        }}
      />

      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
        <Breadcrumb current="Contact Us" />

        <div className="text-center mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-3 border border-purple-500/20">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Dedicated Support</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3">Get in Touch</h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Get in touch with the vone_dm support team. Contact us for account configuration, billing queries,
            Instagram connection troubleshooting, or developer assistance.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr,0.95fr] gap-6 mb-12 sm:mb-16">
          <RevealSection>
            <div className="h-full bg-gray-50 dark:bg-white/[0.04] p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-white/[0.06]">
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em]">
                <Mail className="w-3.5 h-3.5" /> Official Support Email
              </div>
              <h3 className="mt-5 text-2xl font-bold">support@dmpanda.com</h3>
              <p className="mt-4 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                Email the support team with your vone_dm login email, the Instagram account involved, and a short
                description of what you expected versus what happened.
              </p>
              <a
                href="mailto:support@dmpanda.com?subject=DM%20Panda%20Support"
                className="mt-6 inline-flex items-center justify-center w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3.5 sm:py-4 rounded-xl font-bold text-base hover:bg-gray-800 dark:hover:bg-gray-200 transition-all shadow-lg active:scale-[0.98]"
              >
                Email Support
              </a>
            </div>
          </RevealSection>

          <RevealSection delay={80}>
            <div className="h-full bg-gray-50 dark:bg-white/[0.04] p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-white/[0.06]">
              <h4 className="text-lg font-bold">What to include in your email</h4>
              <ul className="mt-5 space-y-4 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {INCLUDES.map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <CheckCircle2 className="w-4 h-4 mt-1 shrink-0 text-emerald-500" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 rounded-2xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] p-5">
                <h5 className="text-sm font-bold flex items-center gap-2">
                  <MessageSquareWarning className="w-4 h-4 text-ig-purple" /> Common reasons to contact support
                </h5>
                <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {REASONS.map((r) => (
                    <p key={r}>{r}</p>
                  ))}
                </div>
              </div>
            </div>
          </RevealSection>
        </div>

        {/* Contact form */}
        <RevealSection>
          <form onSubmit={submit} className="rounded-3xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.03] p-6 sm:p-8 mb-12">
            <h2 className="text-xl font-bold mb-1">Send us a message</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Fill in the form and our support team will get back to you by email.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Your Name" placeholder="Jane Doe" value={form.name} onChange={set("name")} error={errors.name} required />
              <Input label="Email Address" type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} error={errors.email} required />
            </div>
            <div className="mt-4">
              <Input label="Subject" placeholder="Billing question" value={form.subject} onChange={set("subject")} />
            </div>
            <div className="mt-4">
              <Textarea label="Message" placeholder="Describe the issue, expected result, and any error text you saw..." value={form.message} onChange={set("message")} error={errors.message} required />
            </div>
            <div className="mt-5 flex justify-end">
              <Button type="submit" loading={sending} className="px-8 py-3.5">
                {sending ? "Sending..." : "Send Message"}
                {!sending && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </RevealSection>

        <RevealSection>
          <div className="text-center rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] p-7">
            <h3 className="font-bold text-lg mb-2">Explore More of vone_dm</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
              While you await our response, discover features, check subscription pricing, or read step-by-step
              guides.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/features" className="px-6 py-3 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold text-sm">
                Explore Features
              </Link>
              <Link to="/pricing" className="px-6 py-3 rounded-xl border border-gray-300 dark:border-white/15 font-bold text-sm">
                Pricing Plans
              </Link>
              <Link to="/blog" className="px-6 py-3 rounded-xl border border-gray-300 dark:border-white/15 font-bold text-sm">
                Read Playbooks
              </Link>
            </div>
          </div>
        </RevealSection>
      </div>
    </div>
  );
}
