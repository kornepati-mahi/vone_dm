import { Link } from "react-router-dom";
import {
  Bot,
  Users,
  BarChart3,
  Link2,
  MessageCircle,
  Image as ImageIcon,
  Layers,
  Zap,
  Shield,
  Send,
  Share2,
  Radio,
  Eye,
  Type,
  MousePointerClick,
  Home as HomeIcon,
  Rocket,
  Settings,
} from "lucide-react";
import Seo from "../components/Seo.jsx";
import RevealSection from "../components/RevealSection.jsx";
import RotatingText from "../components/RotatingText.jsx";
import { Button } from "../components/ui.jsx";
import { useContent, resolveIcon } from "../lib/content.jsx";

function SparkIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    </svg>
  );
}

// Local icon registry for content.json entries (icon stored as string).
const LOCAL_ICONS = { SparkIcon };

function iconFor(name) {
  return LOCAL_ICONS[name] || resolveIcon(name) || Bot;
}

export default function Home() {
  const { value: home } = useContent("home");
  const HERO_TEXTS = home?.hero_texts?.length
    ? home.hero_texts
    : ["Automate Your Instagram DM's", "No Facebook page needed", "Cheapest DM service ever"];
  const STATS = home?.stats || [];
  const SUITE = (home?.suite || []).map((s) => ({ ...s, icon: iconFor(s.icon) }));
  const WHY = (home?.why || []).map((s) => ({ ...s, icon: iconFor(s.icon) }));
  const STEPS = (home?.steps || []).map((s) => ({ ...s, icon: iconFor(s.icon) }));
  return (
    <>
      <Seo
        title="vone_dm | #1 Instagram DM Automation & Comment Auto-Reply Tool"
        description="Automate your Instagram DMs, post comments, reels, story mentions, and link-in-bio with vone_dm. Certified Meta Business Partner since 2021. Safe, reliable, and affordable."
        keywords="instagram automation, instagram dm automation tool, comment auto reply, auto send message instagram, story mention auto reply, reel comment automation, link in bio page, dm panda"
        schema={[
          { "@context": "https://schema.org", "@type": "WebSite", name: "vone_dm", url: "https://dmpanda.com/", description: "Instagram DM and Comment Automation Tool for creators and businesses." },
          { "@context": "https://schema.org", "@type": "Organization", name: "vone_dm", url: "https://dmpanda.com/", logo: "/images/vone-logo.svg" },
          { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "vone_dm", operatingSystem: "Web-based", applicationCategory: "BusinessApplication", description: "Certified Meta Partner Instagram automation platform for DMs, comments, reels, stories, and link-in-bio." },
        ]}
      />

      <main
        id="main-content"
        className="homepage relative bg-white dark:bg-neutral-950 text-gray-900 dark:text-gray-100 transition-colors duration-500 overflow-hidden"
      >
        <div
          className="absolute -top-10 left-0 w-[1200px] h-[800px] pointer-events-none z-0 dark:hidden"
          style={{
            background:
              "radial-gradient(ellipse at 10% 10%, rgba(150,47,191,0.12) 0%, rgba(214,41,118,0.09) 20%, rgba(245,96,64,0.06) 40%, rgba(252,175,69,0.04) 55%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute -top-10 left-0 w-[1200px] h-[800px] pointer-events-none z-0 hidden dark:block"
          style={{
            background:
              "radial-gradient(ellipse at 10% 10%, rgba(150,47,191,0.18) 0%, rgba(214,41,118,0.12) 20%, rgba(245,96,64,0.08) 40%, rgba(252,175,69,0.05) 55%, transparent 70%)",
            filter: "blur(70px)",
          }}
        />

        {/* Hero */}
        <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: "calc(100dvh - 5rem)" }}>
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-purple-500/[0.06] dark:bg-purple-500/[0.08] rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/[0.05] dark:bg-blue-500/[0.06] rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl relative z-10 pb-6 pt-24 mt-8 lg:mt-[8vh]">
            <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.4rem] xl:text-6xl font-bold leading-[1.1] mb-5 text-gray-900 dark:text-white">
                  <RotatingText
                    texts={HERO_TEXTS}
                    duration={3000}
                    className="block"
                    highlightWords={{
                      Instagram: "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] bg-clip-text text-transparent",
                      Facebook: "text-facebook",
                      "DM ": "bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] bg-clip-text text-transparent",
                    }}
                  />
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-7 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                  Save time with vone_dm's intelligent automation.
                </p>
                <div>
                  <Link
                    to="/login?mode=register"
                    className="inline-block bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 hover:from-gray-800 hover:to-gray-700 dark:hover:from-gray-100 dark:hover:to-white text-white dark:text-gray-900 font-bold py-3.5 px-8 sm:py-4 sm:px-10 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-black/10 dark:shadow-white/10 text-sm sm:text-base"
                  >
                    Get Started for Free
                  </Link>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-3">No credit card required</p>
                </div>
                <div className="mt-6 flex items-center justify-center lg:justify-start gap-3">
                  <img src="/images/indian_flag_opt.webp" alt="Indian Flag" className="h-5 w-auto" width={20} height={15} />
                  <p className="text-gray-600 dark:text-gray-400 font-medium text-sm">Made in India</p>
                </div>
                <div className="mt-5">
                  <img
                    src="/images/Meta_Business_logo_260.webp"
                    alt="Meta Business Partner"
                    className="h-14 sm:h-16 w-auto aspect-[4/1] mx-auto lg:mx-0 transition-all duration-300 object-contain"
                    width={240}
                    height={60}
                  />
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#405DE6]/20 via-[#833AB4]/20 to-[#FD1D1D]/20 rounded-3xl blur-3xl" />
                  <picture>
                    <source media="(max-width: 640px)" srcSet="/images/vone-dashboard-dark.svg" />
                    <img
                      src="/images/vone-dashboard-dark.svg"
                      alt="vone_dm dashboard preview"
                      width={512}
                      height={340}
                      className="relative w-full h-auto rounded-2xl shadow-2xl border border-white/10 dark:border-white/10 animate-float"
                      loading="eager"
                      fetchPriority="high"
                      onError={(e) => {
                        e.target.src = "/images/vone-dashboard-light.svg";
                      }}
                    />
                  </picture>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-12 sm:py-16 bg-gray-50/80 dark:bg-white/[0.02] border-y border-gray-100 dark:border-white/[0.04]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {STATS.map((s, i) => (
                <RevealSection key={s.label} delay={i * 80}>
                  <div className="text-center p-4 sm:p-6 rounded-2xl bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] hover:shadow-lg dark:hover:shadow-white/[0.02] transition-all duration-300 hover:-translate-y-1">
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{s.label}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* Crafted in India */}
        <section className="py-8 sm:py-10 bg-white dark:bg-neutral-950">
          <RevealSection>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
              <p className="text-base sm:text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
                <img src="/images/indian_flag_opt.webp" alt="Indian Flag" className="h-5 w-auto inline-block mr-2" />
                Crafted with passion in India
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Empowering global businesses with innovative automation solutions, proudly made in India.
              </p>
            </div>
          </RevealSection>
        </section>

        {/* Meta partner */}
        <section className="py-12 sm:py-16 bg-gray-50/60 dark:bg-white/[0.015]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <RevealSection>
              <div className="bg-white dark:bg-white/[0.04] p-6 sm:p-10 rounded-3xl border border-gray-100 dark:border-white/[0.06] shadow-xl dark:shadow-black/20">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                  <div className="text-center lg:text-left">
                    <p className="text-xs font-bold tracking-widest text-gray-500 dark:text-gray-400 uppercase mb-2">
                      Badged Partner
                    </p>
                    <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 dark:text-white">
                      vone_dm is a Meta Business Partner
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                      We've been a certified Meta Business Partner since 2021, offering peace of mind to our 22,000+
                      users by ensuring complete compliance with automation standards across Instagram.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <img
                      src="/images/Meta_Business_logo_260.webp"
                      alt="Meta Business Partner"
                      className="max-h-20 w-auto aspect-[7/2] object-contain"
                      width={280}
                      height={80}
                    />
                  </div>
                </div>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Suite */}
        <section className="py-16 sm:py-24 bg-white dark:bg-neutral-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <RevealSection>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 sm:mb-16 text-gray-900 dark:text-white">
                A Complete Suite of Automation Tools
              </h2>
            </RevealSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {SUITE.map((item, i) => (
                <RevealSection key={item.title} delay={i * 40}>
                  <div className="h-full text-center p-6 sm:p-8 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:shadow-lg dark:hover:shadow-purple-500/[0.04] transition-all duration-300 hover:-translate-y-1 hover:border-gray-200 dark:hover:border-white/[0.1]">
                    <div className="mb-4 text-3xl sm:text-4xl text-gray-800 dark:text-gray-200 flex justify-center">
                      <item.icon className="w-8 h-8" strokeWidth={1.6} />
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl mb-2 text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.description}</p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* Why choose */}
        <section className="py-16 sm:py-24 bg-gray-50/60 dark:bg-white/[0.015]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <RevealSection>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 sm:mb-16 text-gray-900 dark:text-white">
                Why Choose vone_dm?
              </h2>
            </RevealSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {WHY.map((item, i) => (
                <RevealSection key={item.title} delay={i * 100}>
                  <div className="h-full p-6 sm:p-8 rounded-2xl bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] hover:shadow-lg dark:hover:shadow-purple-500/[0.04] transition-all duration-300 hover:-translate-y-1">
                    <div className="mb-5 text-3xl sm:text-4xl text-gray-800 dark:text-gray-200">
                      <item.icon className="w-9 h-9" strokeWidth={1.6} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* 3 steps */}
        <section className="py-16 sm:py-24 bg-white dark:bg-neutral-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <RevealSection>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 sm:mb-16 text-gray-900 dark:text-white">
                Get Started in 3 Simple Steps
              </h2>
            </RevealSection>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              {STEPS.map((item, i) => (
                <RevealSection key={item.title} delay={i * 100}>
                  <div className="h-full p-6 sm:p-8 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] hover:shadow-lg transition-all duration-300 hover:-translate-y-1 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#833AB4] to-[#405DE6] rounded-2xl flex items-center justify-center text-white text-lg font-bold mx-auto mb-5">
                      {i + 1}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold mb-3 text-gray-900 dark:text-white">{item.title}</h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </RevealSection>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile showcase */}
        <section className="py-16 sm:py-24 bg-gray-50/60 dark:bg-white/[0.015]">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <RevealSection className="order-2 lg:order-1">
                <img
                  src="/images/mobile_screen_opt.webp"
                  alt="Responsive Mobile Screen"
                  className="w-full max-w-sm mx-auto lg:mx-0 animate-float"
                  width={384}
                  height={500}
                  loading="lazy"
                />
              </RevealSection>
              <RevealSection delay={100} className="order-1 lg:order-2 text-center lg:text-left">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                  Visualize Your Auto Workflow
                </h2>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  See how vone_dm automates your Instagram interactions seamlessly.
                </p>
                <div className="flex justify-center lg:justify-start">
                  <Link
                    to="/login?mode=register"
                    className="inline-block bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold py-3 px-8 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] text-sm sm:text-base"
                  >
                    Get Started
                  </Link>
                </div>
              </RevealSection>
            </div>
          </div>
        </section>

        {/* Explore power */}
        <section className="py-16 sm:py-24 bg-white dark:bg-neutral-950">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <RevealSection>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-10 sm:mb-12 text-gray-900 dark:text-white">
                Explore the Power of vone_dm
              </h2>
            </RevealSection>
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <RevealSection className="text-center lg:text-left">
                <h3 className="text-xl sm:text-2xl font-bold leading-tight mb-4 text-gray-900 dark:text-white">
                  Full-Suite Instagram Automation
                </h3>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  From auto-replying to comments and story mentions to follow-gated resources and rich DM templates,
                  vone_dm provides a complete toolkit to put your Instagram engagement on autopilot. Discover how our
                  features can save you time and grow your brand.
                </p>
                <Link
                  to="/features"
                  className="inline-block bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold py-3 px-8 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] text-sm sm:text-base"
                >
                  See All Features
                </Link>
              </RevealSection>
              <RevealSection delay={100}>
                <img
                  src="/images/workflow_opt.webp"
                  alt="Automation Workflow"
                  className="w-full h-auto rounded-2xl shadow-lg max-w-lg mx-auto"
                  width={512}
                  height={340}
                  loading="lazy"
                />
              </RevealSection>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 sm:py-20 bg-gray-900 dark:bg-white/[0.04] border-t border-gray-800 dark:border-white/[0.06]">
          <RevealSection>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl text-center">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white dark:text-white">
                Ready to Boost Your Instagram Engagement?
              </h2>
              <p className="text-base sm:text-lg mb-7 text-gray-300 dark:text-gray-400 max-w-2xl mx-auto">
                Join vone_dm today and start automating your DMs like a pro.
              </p>
              <Link
                to="/login?mode=register"
                className="inline-block bg-white dark:bg-gradient-to-r dark:from-[#405DE6] dark:via-[#833AB4] dark:to-[#FD1D1D] text-gray-900 dark:text-white font-bold py-3.5 px-8 sm:py-4 sm:px-10 rounded-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] shadow-lg text-sm sm:text-base"
              >
                Sign Up Now
              </Link>
            </div>
          </RevealSection>
        </section>
      </main>
    </>
  );
}
