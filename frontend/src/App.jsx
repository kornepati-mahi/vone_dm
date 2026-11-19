import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Home from "./pages/Home.jsx";
import Features from "./pages/Features.jsx";
import Login from "./pages/Login.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import { Recovery, Verify, NotFound } from "./pages/Auth.jsx";
import { GoogleCallback, InstagramCallback } from "./pages/AuthCallbacks.jsx";
import DashboardLayout from "./pages/dashboard/DashboardLayout.jsx";
import DashboardOverview from "./pages/dashboard/Overview.jsx";
import AutomationView from "./pages/dashboard/AutomationView.jsx";
import { MyPlan, Transactions } from "./pages/dashboard/PlanViews.jsx";
import { Analytics, AccountSettings, Support, SuperProfileView } from "./pages/dashboard/MoreViews.jsx";
import AdminLayout from "./pages/admin/AdminLayout.jsx";
import AdminOverview from "./pages/admin/AdminOverview.jsx";
import UsersView from "./pages/admin/UsersView.jsx";
import PlansView from "./pages/admin/PlansView.jsx";
import BlogAdminView from "./pages/admin/BlogAdminView.jsx";
import ContentView from "./pages/admin/ContentView.jsx";
import SettingsView from "./pages/admin/SettingsView.jsx";
import { TransactionsAdmin, TicketsAdmin, ContactAdmin, AutomationsAdmin } from "./pages/admin/ListsViews.jsx";

const Pricing = lazy(() => import("./pages/Pricing.jsx"));
const About = lazy(() => import("./pages/About.jsx"));
const Contact = lazy(() => import("./pages/Contact.jsx"));
const Blog = lazy(() => import("./pages/Blog.jsx"));
const BlogPost = lazy(() => import("./pages/BlogPost.jsx"));

const lazyNamed = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })));
const legalLoader = () => import("./pages/Legal.jsx");
const Legal = {
  Privacy: lazyNamed(legalLoader, "Privacy"),
  Terms: lazyNamed(legalLoader, "Terms"),
  Disclaimer: lazyNamed(legalLoader, "Disclaimer"),
  RefundPolicy: lazyNamed(legalLoader, "RefundPolicy"),
  DeleteAccountGuide: lazyNamed(legalLoader, "DeleteAccountGuide"),
};

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-950">
      <div className="w-8 h-8 border-2 border-gray-200 dark:border-gray-700 border-t-[#833AB4] rounded-full animate-spin" />
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function MarketingLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route
            path="/"
            element={
              <MarketingLayout>
                <Home />
              </MarketingLayout>
            }
          />
          <Route
            path="/features"
            element={
              <MarketingLayout>
                <Features />
              </MarketingLayout>
            }
          />
          <Route
            path="/pricing"
            element={
              <MarketingLayout>
                <Pricing />
              </MarketingLayout>
            }
          />
          <Route
            path="/about"
            element={
              <MarketingLayout>
                <About />
              </MarketingLayout>
            }
          />
          <Route
            path="/contact"
            element={
              <MarketingLayout>
                <Contact />
              </MarketingLayout>
            }
          />
          <Route
            path="/blog"
            element={
              <MarketingLayout>
                <Blog />
              </MarketingLayout>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <MarketingLayout>
                <BlogPost />
              </MarketingLayout>
            }
          />
          <Route
            path="/privacy"
            element={
              <MarketingLayout>
                <Legal.Privacy />
              </MarketingLayout>
            }
          />
          <Route
            path="/terms"
            element={
              <MarketingLayout>
                <Legal.Terms />
              </MarketingLayout>
            }
          />
          <Route
            path="/disclaimer"
            element={
              <MarketingLayout>
                <Legal.Disclaimer />
              </MarketingLayout>
            }
          />
          <Route
            path="/refund-policy"
            element={
              <MarketingLayout>
                <Legal.RefundPolicy />
              </MarketingLayout>
            }
          />
          <Route
            path="/delete-account-guide"
            element={
              <MarketingLayout>
                <Legal.DeleteAccountGuide />
              </MarketingLayout>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/recovery" element={<Recovery />} />
          <Route path="/auth/verify" element={<Verify />} />
          <Route path="/google-callback" element={<GoogleCallback />} />
          <Route path="/instagram-callback" element={<InstagramCallback />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<UsersView />} />
            <Route path="plans" element={<PlansView />} />
            <Route path="blog" element={<BlogAdminView />} />
            <Route path="automations" element={<AutomationsAdmin />} />
            <Route path="transactions" element={<TransactionsAdmin />} />
            <Route path="tickets" element={<TicketsAdmin />} />
            <Route path="contact" element={<ContactAdmin />} />
            <Route path="content" element={<ContentView />} />
            <Route path="settings" element={<SettingsView />} />
          </Route>

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="dm-automation" element={<AutomationView section="dm-automation" />} />
            <Route path="post-automation" element={<AutomationView section="post-automation" />} />
            <Route path="reel-automation" element={<AutomationView section="reel-automation" />} />
            <Route path="story-automation" element={<AutomationView section="story-automation" />} />
            <Route path="live-automation" element={<AutomationView section="live-automation" />} />
            <Route path="mentions" element={<AutomationView section="mentions" />} />
            <Route path="global-triggers" element={<AutomationView section="global-triggers" />} />
            <Route path="comment-moderation" element={<AutomationView section="comment-moderation" />} />
            <Route path="reply-templates" element={<AutomationView section="reply-templates" />} />
            <Route path="inbox-menu" element={<AutomationView section="inbox-menu" />} />
            <Route path="convo-starter" element={<AutomationView section="convo-starter" />} />
            <Route path="suggest-more" element={<AutomationView section="suggest-more" />} />
            <Route path="welcome-message" element={<AutomationView section="welcome-message" />} />
            <Route path="super-profile" element={<SuperProfileView />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="my-plan" element={<MyPlan />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="account-settings" element={<AccountSettings />} />
            <Route path="support" element={<Support />} />
          <Route path="contact" element={<Support />} />
          </Route>

          <Route
            path="*"
            element={
              <MarketingLayout>
                <NotFound />
              </MarketingLayout>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
}
