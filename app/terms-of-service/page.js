"use client";

import { ArrowLeft } from "@carbon/icons-react";
import Link from "next/link";
import themeClasses from "../theme-utility-classes.json";

const brand = themeClasses.brand;

export default function TermsOfServicePage() {
  return (
    <div
      className="h-screen min-h-screen flex flex-col overflow-hidden bg-brand-bg-fill"
      style={{ fontFamily: "Open Sans, sans-serif" }}
    >
      <div className="shrink-0 bg-brand-bg-white border-b border-brand-stroke-border">
        <div className="max-w-4xl mx-auto px-4 py-4 md:py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-brand-text-weak hover:text-brand-text-strong transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span className="text-sm">Back to Home</span>
          </Link>
          <h1 className={`text-3xl md:text-4xl font-bold ${brand.text.strong}`}>
            Terms of Service
          </h1>
          <p className={`text-sm md:text-base mt-2 ${brand.text.weak}`}>
            Last updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className={`text-sm mt-3 ${brand.text.weak}`}>
            These Terms work together with our{" "}
            <Link href="/privacy-policy" className="text-brand underline hover:opacity-90">
              Privacy Policy
            </Link>
            , which describes how we collect and use your information.
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="bg-brand-bg-white rounded-lg border border-brand-stroke-border shadow-lg p-6 md:p-10 mb-20">
            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Agreement
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-4`}>
                These Terms of Service (&quot;Terms&quot;) govern your access to and use of the websites and
                applications operated by NextDoorJobs (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;),
                including mapmyGig (&quot;Service&quot;). By creating an account, signing in, or using the
                Service, you agree to these Terms. If you do not agree, do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Description of the Service
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-4`}>
                mapmyGig provides tools to discover jobs and gig opportunities, post roles or gigs, manage
                profiles, and connect users on a map-based experience. Features may change over time. We do
                not guarantee any particular outcome from use of the Service (for example, hiring or
                employment).
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Accounts
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-4`}>
                You are responsible for maintaining the confidentiality of your credentials and for activity
                under your account. You agree to provide accurate information and to update it as needed. We
                may suspend or terminate accounts that violate these Terms or that pose security or legal
                risk.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Subscriptions and payments
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-4`}>
                Paid plans or one-time purchases, when offered, are billed through Razorpay Software Private
                Limited (&quot;Razorpay&quot;), our payment processor. By completing a payment, you authorize
                us and Razorpay to charge your selected payment method for the amounts and currency shown at
                checkout. You are responsible for any taxes applicable to your purchase.
              </p>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-4`}>
                We do not store your full card or bank credentials on our servers; payment data is handled by
                Razorpay in accordance with their policies. Please review Razorpay&apos;s documentation,
                including their{" "}
                <a
                  href="https://razorpay.com/privacy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand underline"
                >
                  privacy policy
                </a>{" "}
                and{" "}
                <a
                  href="https://razorpay.com/terms/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand underline"
                >
                  terms of use
                </a>
                , for how they process payments.
              </p>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                Subscription renewal, cancellation, and refund rules will be communicated at the point of
                purchase and may be updated from time to time. If you believe a charge is incorrect, contact us
                through support in the app; for payment disputes, Razorpay and your card issuer or bank may
                have additional processes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Acceptable use
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                You agree not to misuse the Service, including by:
              </p>
              <ul className={`list-disc list-inside space-y-1 ml-4 ${brand.text.strong}`}>
                <li>Violating applicable laws or third-party rights</li>
                <li>Posting false, misleading, discriminatory, or illegal content</li>
                <li>Attempting to gain unauthorized access to systems, data, or other users&apos; accounts</li>
                <li>Interfering with or overloading the Service</li>
                <li>Scraping or automated access except as we expressly permit</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Intellectual property
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                The Service, its branding, and our content are owned by us or our licensors. You retain
                ownership of content you submit; by submitting content you grant us a license to host,
                display, and operate the Service using that content as reasonably necessary.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Disclaimers
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of
                any kind, to the fullest extent permitted by law. We do not warrant uninterrupted or
                error-free operation. User-generated content is the responsibility of the person who posted
                it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Limitation of liability
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                To the maximum extent permitted by law, we and our affiliates will not be liable for any
                indirect, incidental, special, consequential, or punitive damages, or for loss of profits,
                data, or goodwill, arising from your use of the Service. Our aggregate liability for claims
                relating to the Service is limited to the greater of the amount you paid us in the twelve (12)
                months before the claim or one hundred Indian rupees (₹100), except where liability cannot be
                limited by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Indemnity
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                You will defend and indemnify us and our affiliates, officers, and employees against any
                claims, damages, losses, and expenses (including reasonable legal fees) arising from your use of
                the Service, your content, or your violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Governing law
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                These Terms are governed by the laws of India. Courts or tribunals in India having
                jurisdiction will have exclusive venue for disputes arising from these Terms or the Service,
                subject to any non-waivable rights you may have under local law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Changes
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                We may modify these Terms at any time. We will post the updated Terms on this page and update
                the &quot;Last updated&quot; date. Continued use of the Service after changes constitutes your
                acceptance of the revised Terms. If you do not agree, you must stop using the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
                Contact
              </h2>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                For questions about these Terms, contact us through the support or account features available
                on the platform.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
