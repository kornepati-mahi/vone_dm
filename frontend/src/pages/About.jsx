import { Link } from "react-router-dom";
import { Rocket, Target, Layers, ShieldCheck, Users, BarChart3 } from "lucide-react";
import Seo from "../components/Seo.jsx";
import Breadcrumb from "../components/Breadcrumb.jsx";
import RevealSection from "../components/RevealSection.jsx";
import { useContent, resolveIcon } from "../lib/content.jsx";

const FALLBACK_OFFER = [
  { icon: "Layers", title: "Smart Automation", description: "Powerful automated message sequences for Reels, posts, and Stories that work 24/7." },
  { icon: "Users", title: "Audience Engagement", description: "Interactive Carousels, Quick Replies, and follow-gated conversion funnels." },
  { icon: "ShieldCheck", title: "Meta API Compliant", description: "Official Meta Graph API integrations ensuring zero risk and full account safety." },
];

export default function About() {
  const { value: aboutContent } = useContent("about");
  const OFFER = (aboutContent?.offers || FALLBACK_OFFER).map((o) => ({
    ...o,
    icon: resolveIcon(o.icon) || Layers,
  }));
  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100">
      <Seo
        title="About Us | vone_dm - Our Story & Mission"
        description="Learn how vone_dm helps creators, brands, and businesses scale their Instagram engagement with secure, compliant direct message automation."
        keywords="about dm panda, instagram automation company, instagram marketing tool team"
        schema={[
          { "@context": "https://schema.org", "@type": "AboutPage", name: "About Us | vone_dm", url: "https://vone-dm.com/about" },
        ]}
      />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 sm:pb-24 max-w-5xl">
        <Breadcrumb current="About Us" />

        <RevealSection>
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-4 border border-purple-500/20">
              About vone_dm
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Your partner in automating Instagram direct messages efficiently, reliably, and safely.
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Learn how vone_dm helps creators, brands, and businesses scale their Instagram engagement with secure,
              compliant direct message automation.
            </p>
          </div>
        </RevealSection>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6 mb-16">
          {OFFER.map((o, i) => (
            <RevealSection key={o.title} delay={i * 90}>
              <div className="h-full p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="mb-4 text-ig-purple">
                  <o.icon className="w-7 h-7" strokeWidth={1.7} />
                </div>
                <h3 className="font-bold text-lg mb-2">{o.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{o.description}</p>
              </div>
            </RevealSection>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <RevealSection>
            <div className="h-full p-7 rounded-3xl bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] shadow-sm">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ig-purple mb-4">
                <Rocket className="w-4 h-4" /> Our Story
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                vone_dm was founded by a team of social media enthusiasts and software engineers who saw the need for
                a smarter, more intuitive way to manage Instagram DMs at scale. Frustrated by the limitations of
                existing tools, we set out to build a platform that is certified, fast, and remarkably easy to use.
              </p>
            </div>
          </RevealSection>
          <RevealSection delay={100}>
            <div className="h-full p-7 rounded-3xl bg-gradient-to-br from-[#405DE6]/5 via-[#833AB4]/5 to-[#FCAF45]/5 border border-[#833AB4]/10 dark:border-[#833AB4]/20">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-ig-purple mb-4">
                <Target className="w-4 h-4" /> Our Mission
              </div>
              <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                Our mission is to empower businesses, creators, and agencies to streamline their Instagram outreach
                and engagement through intelligent automation. We believe in saving you time so you can focus on what
                matters most – building meaningful connections and growing revenue.
              </p>
            </div>
          </RevealSection>
        </div>

        <RevealSection>
          <div className="rounded-3xl border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.03] p-8 text-center">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
              <BarChart3 className="w-4 h-4" /> What We Offer
            </div>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              From auto-replying to comments and story mentions to follow-gated resources and rich DM templates,
              vone_dm provides a complete toolkit to put your Instagram engagement on autopilot.
            </p>
            <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login?mode=register"
                className="px-7 py-3.5 rounded-xl bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-bold text-sm hover:opacity-90 transition-all"
              >
                Get Started for Free
              </Link>
              <Link
                to="/pricing"
                className="px-7 py-3.5 rounded-xl border border-gray-300 dark:border-white/15 font-bold text-sm hover:bg-white dark:hover:bg-white/[0.05] transition-all"
              >
                View Pricing
              </Link>
              <Link
                to="/blog"
                className="px-7 py-3.5 rounded-xl border border-gray-300 dark:border-white/15 font-bold text-sm hover:bg-white dark:hover:bg-white/[0.05] transition-all"
              >
                Read Our Playbooks
              </Link>
            </div>
          </div>
        </RevealSection>

        <RevealSection>
          <div className="mt-14 text-center rounded-3xl bg-gray-900 dark:bg-white/[0.04] p-8 sm:p-10">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Ready to scale with vone_dm?</h2>
            <p className="text-gray-300 dark:text-gray-400 mb-6 max-w-xl mx-auto text-sm sm:text-base">
              Connect your Instagram account in 60 seconds. Start completely free and turn your comments and mentions
              into direct sales.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/login?mode=register"
                className="px-8 py-4 rounded-2xl bg-white text-gray-900 font-bold hover:bg-gray-100 transition-all"
              >
                Get Started for Free
              </Link>
              <Link
                to="/contact"
                className="px-8 py-4 rounded-2xl border border-white/20 text-white font-bold hover:bg-white/10 transition-all"
              >
                Contact Our Team
              </Link>
            </div>
          </div>
        </RevealSection>
      </div>
    </div>
  );
}
