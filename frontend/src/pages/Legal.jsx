import { Link } from "react-router-dom";
import LegalLayout from "../components/LegalLayout.jsx";

export function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy | vone_dm"
      description="Privacy Policy of vone_dm regarding data privacy and Meta Platform compliance."
      keywords="privacy policy dm panda, instagram data privacy, meta platform compliance, data deletion policy"
      updated="September 30, 2026"
    >
      <p>
        By connecting your Instagram professional account or using the Service, you agree to the collection and use of
        information in accordance with this Privacy Policy. We only collect and process data strictly necessary to
        provide the automation features you configure.
      </p>

      <h2>1. Information Collection and Categories of Data</h2>
      <h3>A. User Account Information</h3>
      <ul>
        <li>
          <strong>Personal Identifiers:</strong> name, email address, and login credentials you provide during
          registration.
        </li>
        <li>
          <strong>Authentication Credentials:</strong> a salted password hash used to secure your account.
        </li>
        <li>
          <strong>Billing Data:</strong> plan selection, payment identifiers, and transaction status required to
          activate your subscription.
        </li>
        <li>
          <strong>Contact Form:</strong> message content you voluntarily submit through our support channels.
        </li>
      </ul>

      <h3>B. Meta / Instagram Platform Data</h3>
      <ul>
        <li>
          <strong>Account Profile Data:</strong> username, profile picture, and account type of connected Instagram
          professional accounts.
        </li>
        <li>
          <strong>Access Tokens:</strong> short-lived and long-lived tokens issued by Meta to perform the actions you
          configure.
        </li>
        <li>
          <strong>Media Identifiers:</strong> identifiers of posts, Reels, and Stories referenced by your automations.
        </li>
        <li>
          <strong>Webhook Event Data:</strong> comments, Story mentions, reactions, and inbound messages used to
          trigger your automations.
        </li>
        <li>
          <strong>Performance Analytics:</strong> post, reel, and account analytics displayed in your dashboard.
        </li>
      </ul>

      <h2>2. How We Use Meta Platform Data &amp; Purpose Specification</h2>
      <ul>
        <li>Read comments on your posts/reels to trigger instant automated DM replies or automated public comment responses.</li>
        <li>Receive incoming direct message webhooks and send automated responses requested by the account owner.</li>
        <li>Publish or schedule media, reels, and stories on your connected Instagram account as requested by you.</li>
        <li>Read post, reel, and account analytics to display performance insights and reports in your vone_dm dashboard.</li>
        <li>Execute Comment Auto-Responses &amp; Moderation and Story Mention Workflows configured by you.</li>
      </ul>

      <p className="font-semibold">
        We do not sell data, we do not run advertising or retargeting, and we do not perform surveillance or
        profiling.
      </p>

      <h2>4. Meta Graph API Permissions Requested</h2>
      <p>
        vone_dm requests only the specific, granular permissions necessary to fulfill your automation settings. In
        strict compliance with Section 3.a of Meta's Platform Terms and Meta's Developer Data Use Policy, each
        permission maps to a documented Why It Is Needed explanation inside your dashboard's Connected Accounts
        screen.
      </p>

      <h2>5. Data Retention &amp; Storage Security</h2>
      <ul>
        <li>
          <strong>Encryption in Transit:</strong> all traffic is encrypted with TLS 1.2+.
        </li>
        <li>
          <strong>Encryption at Rest:</strong> stored tokens and credentials are encrypted at rest.
        </li>
        <li>
          <strong>Ephemeral Processing:</strong> webhook payloads are processed transiently and not retained beyond
          what is needed for delivery and reporting.
        </li>
        <li>
          <strong>Retention Period:</strong> data is retained while your account is active and purged after account
          deletion or token revocation.
        </li>
        <li>
          <strong>NO Permanent Message Archiving:</strong> message bodies are not permanently archived by vone_dm.
        </li>
      </ul>

      <h2>7. Children's Privacy</h2>
      <p>
        The Service is not directed to individuals under 13 (or the minimum age in your jurisdiction), and we do not
        knowingly collect personal information from children.
      </p>

      <h2>Data Deletion Request</h2>
      <p>
        In accordance with Meta Platform Terms, GDPR, and CCPA, you have the right to request the complete deletion of
        your data at any time. We provide three simple ways to delete your data:
      </p>
      <ol>
        <li>
          <strong>Option A: Self-Service Deletion via vone_dm Dashboard</strong> — Log in to your dashboard, open
          Account Settings, scroll to the bottom of the page, and click Delete Account. Enter your password to confirm.
        </li>
        <li>
          <strong>Option B: Automatic Meta Deauthorization &amp; Data Deletion Request</strong> — Navigate to your
          Instagram or Facebook profile → Apps and Websites → remove vone_dm. Meta will immediately send an automated
          Data Deletion Request Callback to our servers.
        </li>
        <li>
          <strong>Option C: Direct Email Request</strong> — Email us directly with the subject "Data Deletion Request"
          and we will dispatch a Confirmation Code to verify completion.
        </li>
      </ol>
      <p>
        If you remove the vone_dm application from your Facebook or Instagram account settings, our server
        automatically purges your stored Instagram tokens, active automations, and associated records.
      </p>

      <h2>8. Changes To This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy periodically. Material changes will be announced on this page with an
        updated revision date, and continued use of the Service after changes constitutes acceptance.
      </p>

      <h2>9. Contact &amp; Data Protection Inquiries</h2>
      <p>
        If you have any questions, feedback, or concerns regarding this Privacy Policy, your data rights, or our
        compliance with Meta Platform Terms, please contact us at{" "}
        <Link to="/contact" className="text-ig-purple font-semibold">
          our support page
        </Link>{" "}
        or email saichanduvlk@gmail.com.
      </p>
    </LegalLayout>
  );
}

export function Terms() {
  return (
    <LegalLayout
      title="Terms & Conditions | vone_dm"
      description="Terms and Conditions outlining rules and regulations for using vone_dm."
      keywords="terms and conditions dm panda, user terms dm panda, instagram automation legal terms"
      updated="November 06, 2025"
    >
      <p>
        Welcome to vone_dm! These terms and conditions outline the rules and regulations for the use of vone_dm's
        Website, located at https://vone-dm.com.
      </p>
      <p>
        By accessing this website we assume you accept these terms and conditions. Do not continue to use vone_dm if
        you do not agree to take all of the terms and conditions stated on this page.
      </p>

      <h2>User Account</h2>
      <p>
        You are responsible for maintaining the confidentiality of your login credentials and for all activity that
        occurs under your account. You must provide accurate registration information and promptly notify us of any
        unauthorized use.
      </p>

      <h2>Service Usage</h2>
      <p>You must not:</p>
      <ul>
        <li>Republish material from vone_dm</li>
        <li>Sell, rent or sub-license material from vone_dm</li>
        <li>Reproduce, duplicate or copy material from vone_dm</li>
        <li>Redistribute content from vone_dm</li>
        <li>Violate Instagram's Terms of Service or Community Guidelines</li>
        <li>
          Attempt, in any manner, to obtain the password, account, or other security information from any other user
        </li>
        <li>Interfere with or disrupt the integrity or performance of the Service</li>
        <li>Jeopardizes the security of your vone_dm account or anyone else's</li>
        <li>Violate any applicable national or international law or regulation</li>
        <li>Is harmful, fraudulent, deceptive, threatening, harassing, defamatory, obscene, or otherwise objectionable</li>
        <li>Infringes upon or violates our intellectual property rights or the intellectual property rights of others</li>
        <li>Violates the security of any computer network, or cracks any passwords or security encryption codes</li>
      </ul>

      <h2>Subscriptions, Duration, and Expiry</h2>
      <p>
        Paid vone_dm plans are sold on fixed validity windows. Monthly plans run for 30 days and yearly plans run for
        364 days from the verified payment time. Plan expiry, downgrade behavior, feature availability, and
        account-access enforcement follow the effective runtime plan applied to your account.
      </p>
      <p>
        If your plan no longer supports all previously linked Instagram accounts, those extra accounts may remain
        linked for management purposes, but vone_dm can block dashboard access and automation processing for them
        until your effective plan allows them again or they are manually removed.
      </p>

      <h2>Promotional Offers, Coupons &amp; Partner Perks</h2>
      <ul>
        <li>
          <strong>Coupon Usage Ineligibility:</strong> promotional bonus perks are strictly not valid if any discount
          coupon or promo code is applied at checkout.
        </li>
        <li>
          <strong>Third-Party Fulfillment &amp; Liability:</strong> partner perks are fulfilled by official
          third-party partners and are subject to stock availability.
        </li>
      </ul>

      <h2>Acceptable Use</h2>
      <p>
        We may terminate or suspend your access to our Service immediately, without prior notice or liability, for any
        reason whatsoever, including without limitation if you breach the Terms.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        In no event shall vone_dm, nor its directors, employees, partners, agents, suppliers, or affiliates, be
        liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to
        or use of, or inability to access or use, the Service.
      </p>

      <h2>Governing Law</h2>
      <p>
        These Terms shall be governed and construed in accordance with the laws of India, without regard to its
        conflict of law provisions.
      </p>

      <p>
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is
        material we will try to provide at least 30 days' notice prior to any new terms taking effect.
      </p>
    </LegalLayout>
  );
}

export function Disclaimer() {
  return (
    <LegalLayout
      title="Disclaimer | vone_dm"
      description="Legal disclaimer regarding using vone_dm and third-party platform integrations."
      keywords="disclaimer dm panda, legal disclaimer dm panda, instagram automation liability"
      updated="November 06, 2025"
    >
      <p>
        The information on vone_dm's website is provided on an "as is" basis. To the fullest extent permitted by law,
        vone_dm excludes all representations, warranties, conditions, and terms relating to our website and the use
        of this website.
      </p>

      <h2>Third-Party Platforms</h2>
      <p>
        We are not affiliated, associated, authorized, endorsed by, or in any way officially connected with Instagram,
        Meta Platforms, Inc., or any of its subsidiaries or affiliates. The official Instagram website can be found at{" "}
        <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" className="text-ig-purple underline">
          https://www.instagram.com
        </a>
        .
      </p>

      <h2>API Compliance</h2>
      <p>
        vone_dm operates exclusively through Meta's official Graph API and Messenger API for Instagram. Automation
        behavior is subject to Meta's platform rate limits, Community Guidelines, and Terms of Service, which may
        change from time to time.
      </p>

      <h2>No Guarantees</h2>
      <p>
        Results vary by account, niche, and content quality. We do not guarantee any specific follower growth,
        engagement rate, revenue, or other outcome from using the Service.
      </p>

      <h2>Limitation of Liability</h2>
      <p>
        Your use of the Service is at your sole risk. vone_dm shall not be held responsible for any loss or damage
        arising from the use of third-party platform features, suspended accounts, or changes made by platform
        providers.
      </p>
    </LegalLayout>
  );
}

export function RefundPolicy() {
  return (
    <LegalLayout
      title="Refund Policy | vone_dm"
      description="Refund Policy of vone_dm regarding subscriptions and transaction issues."
      keywords="refund policy dm panda, dm panda refund, instagram automation subscription refund"
      updated="November 06, 2025"
    >
      <p>
        At vone_dm, we are committed to providing a reliable and effective service. Our refund policy is designed to
        be transparent and fair to all our users. Please read the following terms carefully.
      </p>

      <h2>General Policy</h2>
      <p>
        Generally, we do not offer refunds for our services once a payment has been made. All sales are considered
        final. This is because our services are delivered instantly and involve significant operational costs.
      </p>

      <h2>Exceptions for Refunds</h2>
      <p>Refunds will only be considered under the following specific circumstances:</p>

      <h3>Service-Side Issues:</h3>
      <p>
        If a verified technical fault on our side permanently prevented the purchased feature from functioning and our
        team could not resolve it within a reasonable period, a pro-rated refund or account credit may be issued.
      </p>

      <h3>Erroneous or Wrongful Payments:</h3>
      <p>
        Duplicate charges, incorrect plan charges, or payments processed due to a billing system error are eligible
        for a full refund after verification.
      </p>

      <h3>Process for Wrongful Payment Claims</h3>
      <ol>
        <li>Contact our support team through the Contact Support page within 7 days of the transaction.</li>
        <li>Include your payment ID, registered email, and a description of the erroneous charge.</li>
        <li>Our billing team verifies the claim against payment gateway records.</li>
        <li>Approved refunds are returned to the original payment method.</li>
      </ol>

      <h2>How to Request a Refund</h2>
      <p>
        To request a refund, please contact our support team through the{" "}
        <Link to="/contact" className="text-ig-purple font-semibold">
          Contact Support
        </Link>{" "}
        page and include your payment ID and the Instagram account associated with the plan.
      </p>

      <h2>Refund Timeline</h2>
      <p>
        If a refund is approved, the processing time can vary. The refund may take anywhere from{" "}
        <strong>7 to 30 business days</strong> to reflect in your account, depending on your bank or payment provider.
      </p>

      <h2>Changes to this Policy</h2>
      <p>
        We reserve the right to modify this refund policy at any time. Any changes will be posted on this page, and it
        is your responsibility to review it periodically.
      </p>
    </LegalLayout>
  );
}

export function DeleteAccountGuide() {
  return (
    <LegalLayout
      title="Delete Account Guide | vone_dm"
      description="Guide explaining the steps to permanently delete your vone_dm account."
      keywords="delete account dm panda, dm panda account deletion, remove instagram bot account"
    >
      <p>
        We're sorry to see you go. If you're sure you want to delete your account, please follow the steps below.
        Deleting your account will permanently remove all your data, campaigns, and settings. This action cannot be
        undone.
      </p>

      <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 not-prose">
        <p className="font-bold text-red-600 dark:text-red-400 text-sm mb-1">⚠ Warning: Irreversible Action</p>
        <p className="text-sm text-red-600/90 dark:text-red-300/90">
          Account deletion is permanent and deletes all your Instagram campaigns and settings. This cannot be undone.
        </p>
      </div>

      <h2>How to delete:</h2>
      <ol>
        <li>
          Log in and go to <strong>Account Settings</strong> in your dashboard.
        </li>
        <li>Scroll to the bottom of the page.</li>
        <li>
          Click the <strong>Delete Account</strong> button.
        </li>
        <li>Enter your password to confirm.</li>
        <li>Confirm the deletion prompt.</li>
      </ol>

      <h2>What gets removed</h2>
      <ul>
        <li>Your profile, connected Instagram accounts, and stored access tokens</li>
        <li>All automations, reply templates, and conversation starters</li>
        <li>Your Super Profile page and analytics history</li>
        <li>Transaction history and plan entitlements</li>
      </ul>

      <p>
        Need help instead?{" "}
        <Link to="/contact" className="text-ig-purple font-semibold">
          Contact Support
        </Link>{" "}
        before deleting and our team will assist you.
      </p>
    </LegalLayout>
  );
}
