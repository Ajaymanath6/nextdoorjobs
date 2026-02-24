"use client";

import { ArrowLeft } from "@carbon/icons-react";
import Link from "next/link";
import themeClasses from "../theme-utility-classes.json";

const brand = themeClasses.brand;

export default function PrivacyPolicyPage() {
  return (
    <div
      className="h-screen min-h-screen flex flex-col overflow-hidden bg-brand-bg-fill"
      style={{ fontFamily: "Open Sans, sans-serif" }}
    >
      {/* Header - fixed at top */}
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
            Privacy Policy
          </h1>
          <p className={`text-sm md:text-base mt-2 ${brand.text.weak}`}>
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Main Content - scrollable area (body has overflow hidden in layout) */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="bg-brand-bg-white rounded-lg border border-brand-stroke-border shadow-lg p-6 md:p-10 mb-20">
          
          {/* Scope */}
          <section className="mb-8">
            <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
              Scope
            </h2>
            <p className={`text-base leading-relaxed ${brand.text.strong} mb-4`}>
              Your privacy is important to NextDoorJobs (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) and we go to great lengths to protect it. This Online Privacy Policy (&quot;Privacy Policy&quot;) applies to the online collection of information via websites and mobile applications operated by NextDoorJobs, including mapmyGig.
            </p>
            <p className={`text-base leading-relaxed ${brand.text.strong} mb-4`}>
              By using our websites, applications, or services (including payment features), you agree to be bound by this Privacy Policy and you consent to our collection, use, processing, and sharing of your information as described herein. If you do not agree, please do not use our services.
            </p>
            <p className={`text-base leading-relaxed ${brand.text.strong}`}>
              Our websites may contain links to sites maintained by others. This Privacy Policy does not reflect the privacy practices of those sites.
            </p>
          </section>

          {/* Highlights */}
          <section className="mb-8">
            <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
              Highlights
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className={`text-lg font-semibold ${brand.text.strong} mb-2`}>
                  What information do we collect and how is it used?
                </h3>
                <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                  We collect information about our users in three ways:
                </p>
                <ul className={`list-disc list-inside mt-2 space-y-1 ml-4 ${brand.text.strong}`}>
                  <li>Directly from the user (for example, when registering an account, posting a job, or creating a gig worker profile)</li>
                  <li>From our web server logs</li>
                  <li>Through cookies and tracking technologies</li>
                </ul>
                <p className={`text-base leading-relaxed mt-3 ${brand.text.strong}`}>
                  We use the information primarily to provide you with a personalized Internet or mobile application experience that delivers the information, resources, and services that are most relevant and helpful to you. We do not share with others any of the information you provide, unless we say so in this Privacy Policy, or when we believe in good faith that the law requires it.
                </p>
              </div>

              <div>
                <h3 className={`text-lg font-semibold ${brand.text.strong} mb-2`}>
                  How do we protect your information?
                </h3>
                <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                  We have implemented certain appropriate security measures to help protect your information from accidental loss and from unauthorized access, use, or disclosure. We store the information about you in data centers with restricted access and appropriate monitoring. We use intrusion detection and virus protection software. Despite these measures, we cannot guarantee that unauthorized persons will always be unable to defeat our security measures.
                </p>
              </div>

              <div>
                <h3 className={`text-lg font-semibold ${brand.text.strong} mb-2`}>
                  Who has access to your information?
                </h3>
                <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                  We do not sell, rent, or lease mailing lists or other customer data to others, and we do not make customer data available to any unaffiliated parties, except our approved agents and contractors, or as otherwise described in this Privacy Policy. We may rely on some of our affiliates for support of the services and products we offer; our affiliates are all required to preserve the confidentiality of any customer data they may have access to. We do not disclose any customer data about your usage of our websites or mobile applications to unaffiliated third parties, except as necessary to service the account, to enforce the terms of use, to meet our obligations to content and technology providers, or as required by law.
                </p>
                <h4 className={`text-base font-semibold ${brand.text.strong} mt-4 mb-2`}>
                  Payment Processing
                </h4>
                <p className={`text-base leading-relaxed ${brand.text.strong} mb-2`}>
                  We use Razorpay Software Private Limited (&quot;Razorpay&quot;) as our payment processor to bill you for subscription plans and other paid goods and services. When you choose to make a payment, the following information may be shared with Razorpay as necessary to complete the transaction: your name, email address, mobile number, billing address, and payment method details (such as credit card, debit card, UPI, or bank account information). We do not store your full card or financial details on our servers. By using our payment features, you explicitly consent to the sharing of this information with Razorpay and, where required by law, with financial institutions, the Reserve Bank of India (RBI), or other regulatory agencies. We comply with applicable data protection and KYC (Know Your Customer) regulations. Razorpay handles your payment data in accordance with their privacy policy; we encourage you to read it at{" "}
                  <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-brand underline">https://razorpay.com/privacy/</a>.
                </p>
              </div>

              <div>
                <h3 className={`text-lg font-semibold ${brand.text.strong} mb-2`}>
                  How may your information be corrected, amended or deleted, or your preferences updated?
                </h3>
                <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                  You may cancel your registration or update your preferences at any time. If you do not want to receive information about our services and products, please update your account preferences (where available), check the appropriate box when registering and/or utilize the &quot;unsubscribe&quot; mechanism within the communications that you receive from us.
                </p>
              </div>
            </div>
          </section>

          {/* Full Privacy Policy */}
          <section className="mb-8">
            <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
              Full Privacy Policy
            </h2>

            {/* What information do we collect */}
            <div className="mb-6">
              <h3 className={`text-xl font-semibold ${brand.text.strong} mb-3`}>
                What information do we collect and how is it used?
              </h3>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-4`}>
                We collect information about our users in three ways: directly from the user (for example, when registering an account, posting a job, or creating a gig worker profile), from our web server logs, and through cookies. We use the information primarily to provide you with a personalized Internet or mobile application experience that delivers the information, resources, and services that are most relevant and helpful to you. We do not share with others any of the information you provide, unless we say so in this Privacy Policy, or when we believe in good faith that the law requires it.
              </p>

              <h4 className={`text-lg font-semibold ${brand.text.strong} mb-2 mt-4`}>
                User Supplied Information
              </h4>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                When you register for our services or use our platform, we ask you to provide some information, for example:
              </p>
              <ul className={`list-disc list-inside space-y-1 ml-4 mb-4 ${brand.text.strong}`}>
                <li><strong>Account Information:</strong> Your name, email address, phone number (optional), and password (which is securely hashed)</li>
                <li><strong>Company Information:</strong> Company name, logo, website URL, location (state, district, pincode, coordinates), and funding series (if applicable)</li>
                <li><strong>Job Postings:</strong> Job title, description, salary range, requirements, location, and other job-related details</li>
                <li><strong>Gig Worker Profiles:</strong> Service type, experience, expected salary, location, customer count, and other profile information</li>
                <li><strong>Location Data:</strong> Home location (latitude/longitude), company locations, job/gig locations for matching purposes</li>
                <li><strong>Authentication Data:</strong> OAuth provider information (when using Google or other social login), Clerk ID, and avatar URL</li>
              </ul>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                We keep this information in our database for future reference, as needed. We may use certain information you provide to offer you services and products that we believe may be of interest to you, such as matching job seekers with relevant job postings or connecting companies with qualified gig workers.
              </p>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                If you contact us for customer support, we may ask you to provide information about your computer or about the issues you are trying to resolve. This information is necessary to help us answer your questions. We may record your requests and our responses for quality control purposes.
              </p>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                We may also use the information we collect from you to provide, maintain, protect and improve the services and products we provide. We may also use this information to develop new and/or additional services and products to enhance the overall quality of our services and products for the user.
              </p>

              <h4 className={`text-lg font-semibold ${brand.text.strong} mb-2 mt-4`}>
                Web Server Logs
              </h4>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                When you visit our websites, we may track information about your visit and store that information in web server logs, which are records of the activities on our sites. Our servers automatically capture and save the information electronically. Examples of the information we may collect include:
              </p>
              <ul className={`list-disc list-inside space-y-1 ml-4 mb-4 ${brand.text.strong}`}>
                <li>Your unique Internet protocol (IP) address</li>
                <li>The name of your unique Internet service provider (ISP)</li>
                <li>The city, state, and country from which you access our sites</li>
                <li>The kind of browser or computer you use</li>
                <li>The number of links you select within our sites</li>
                <li>The date and time of your visit</li>
                <li>The web page from which you arrived to our sites</li>
                <li>The pages you viewed on our sites</li>
                <li>Certain searches/queries that you conducted via our sites</li>
              </ul>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                The information we collect in web server logs helps us administer our websites, analyze their usage, protect the sites and their content from inappropriate use, and improve the user&apos;s experience.
              </p>

              <h4 className={`text-lg font-semibold ${brand.text.strong} mb-2 mt-4`}>
                Cookies
              </h4>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                In order to offer and provide a customized and personal service, we may use cookies to store and help track information about you. Cookies are simply small pieces of data that are sent to your browser from a web server and stored on your computer&apos;s hard drive. We use cookies to help remind us who you are and to help you navigate our sites during your visits. Cookies allow us to save passwords and preferences for you so you will not have to reenter them each time you visit.
              </p>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                The use of cookies is relatively standard. Most browsers are initially set up to accept cookies. However, if you prefer, you can set your browser to either notify you when you receive a cookie or to refuse to accept cookies. You should understand that some features of our sites may not function properly if you do not accept cookies.
              </p>

              <h4 className={`text-lg font-semibold ${brand.text.strong} mb-2 mt-4`}>
                Third Party Services
              </h4>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                We may use services hosted by third parties such as Google Analytics, Clerk (for authentication), and mapping services to assist in providing our services and products and to help us understand our customers&apos; use of our services and products. These services may collect information sent by your browser as part of a web page request, including your IP address or cookies. If these third party services collect information, they do so anonymously and in the aggregate to provide information helpful to us such as website trends, without identifying individual visitors. Please see &quot;Cookies&quot; in the section above for information on how you can control the use of cookies on your computer.
              </p>
            </div>

            {/* How do we protect your information */}
            <div className="mb-6">
              <h3 className={`text-xl font-semibold ${brand.text.strong} mb-3`}>
                How do we protect your information?
              </h3>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                We have implemented certain appropriate security measures to help protect your information from accidental loss and from unauthorized access, use or disclosure. Furthermore, we store the information about you in data centers with restricted access and appropriate monitoring, and we use a variety of technical security measures to secure your data, such as intrusion detection and virus protection software. However, despite these measures, we cannot guarantee that unauthorized persons will always be unable to defeat our security measures.
              </p>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                We may store and process your information in systems located outside of your home country. However, regardless of where storage and processing may occur, we take appropriate steps to ensure that your information is protected, consistent with the principles set forth under this Privacy Policy.
              </p>
            </div>

            {/* Who has access to your information */}
            <div className="mb-6">
              <h3 className={`text-xl font-semibold ${brand.text.strong} mb-3`}>
                Who has access to your information?
              </h3>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                We do not sell, rent, or lease mailing lists or other customer data to others, and we do not make your information available to any unaffiliated parties, except as follows:
              </p>
              <ul className={`list-disc list-inside space-y-1 ml-4 mb-4 ${brand.text.strong}`}>
                <li>To our approved agents and/or contractors who may use it on our behalf or in connection with their relationship with us (for example, we may use third parties to help us with promotional campaigns)</li>
                <li>As required by law, in a matter of public safety or policy, as needed in connection with the transfer of our business assets (for example, if we are acquired by another company), or if we believe in good faith that sharing the data is necessary to protect our rights or property</li>
              </ul>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                We may rely on some of our affiliates for support of the services and products we offer. Our affiliates are all required to preserve the confidentiality of any information they may have access to.
              </p>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                We do not disclose any information about your usage of our websites or mobile applications to unaffiliated third parties, except as necessary to service the account, to enforce the terms of use, to meet our obligations to content and technology providers, or as required by law.
              </p>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                We may use statistics regarding usage for product development purposes, but we only use those statistics in the aggregate and they do not include any personally identifiable information about individual users.
              </p>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                Your access to some of our services and products may be password protected. We recommend that you refrain from disclosing your usernames and passwords to anyone. We also recommend that you sign out of your account or service at the end of each session. You may also wish to close your browser window when you have finished your work, especially if you share a computer with someone else or if you are using a computer in a public place like a library or Internet cafe.
              </p>
              <h4 className={`text-lg font-semibold ${brand.text.strong} mb-2 mt-4`}>
                Payment Processing
              </h4>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                We use Razorpay Software Private Limited (&quot;Razorpay&quot;) as our payment processor to bill you for subscription plans and other paid goods and services. When you choose to make a payment through our platform, the following information may be shared with Razorpay as necessary to complete the transaction: your name, email address, mobile number, billing address, and payment method details (such as credit card, debit card, UPI, or bank account information). We do not store your full card or financial details on our servers.
              </p>
              <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
                By using our payment features, you explicitly consent to the sharing of this information with Razorpay. We may also share information with financial institutions, the Reserve Bank of India (RBI), or other regulatory agencies as required by law. We comply with applicable data protection and KYC (Know Your Customer) regulations as may be required.
              </p>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                Your payment data is handled by Razorpay in accordance with their privacy policy. We encourage you to review Razorpay&apos;s privacy policy at{" "}
                <a href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-brand underline">https://razorpay.com/privacy/</a> to understand how they collect, use, and protect your information.
              </p>
            </div>

            {/* How may your information be corrected */}
            <div className="mb-6">
              <h3 className={`text-xl font-semibold ${brand.text.strong} mb-3`}>
                How may your information be corrected, amended or deleted, or your preferences updated?
              </h3>
              <p className={`text-base leading-relaxed ${brand.text.strong}`}>
                You may cancel your registration or update your preferences at any time. If you do not want to receive information about our services and products, please update your account preferences (where available), check the appropriate box when registering and/or utilize the &quot;unsubscribe&quot; mechanism within the communications that you receive from us.
              </p>
            </div>
          </section>

          {/* Questions */}
          <section className="mb-8">
            <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
              Questions?
            </h2>
            <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
              If you have any additional questions or concerns related to this statement and/or our practices, please contact us at your convenience.
            </p>
            <p className={`text-base leading-relaxed ${brand.text.strong}`}>
              You can reach us through the contact information provided in your account settings or by using the support features available on our platform.
            </p>
          </section>

          {/* Complaints and Grievance Redressal */}
          <section className="mb-8">
            <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
              Complaints and Grievance Redressal
            </h2>
            <p className={`text-base leading-relaxed ${brand.text.strong} mb-3`}>
              If you have any complaints or concerns regarding your personal information, the content of this Privacy Policy, or any dispute relating to your use of our services, please contact us in writing or through the support features on our platform. We will record the information you provide so that we can respond effectively and resolve your concern.
            </p>
          </section>

          {/* Applicable Law */}
          <section className="mb-8">
            <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
              Applicable Law
            </h2>
            <p className={`text-base leading-relaxed ${brand.text.strong}`}>
              Your use of this website and our services will be governed by and construed in accordance with the laws of India. Any legal action or proceedings arising out of your use may be brought in the competent courts or tribunals in India having jurisdiction, and you irrevocably submit to the jurisdiction of such courts or tribunals.
            </p>
          </section>

          {/* Privacy Policy Changes */}
          <section className="mb-8">
            <h2 className={`text-2xl font-semibold ${brand.text.strong} mb-4`}>
              Privacy Policy Changes
            </h2>
            <p className={`text-base leading-relaxed ${brand.text.strong}`}>
              This Privacy Policy may be revised without notice. If our information practices change in a significant way, we will post the changes here and update the &quot;Last updated&quot; date at the top of this page. We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.
            </p>
          </section>

          </div>
        </div>
      </div>
    </div>
  );
}
