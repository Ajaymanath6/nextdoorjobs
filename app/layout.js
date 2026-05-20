import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { getClerkProxyUrl, getClerkPublishableKey, isClerkConfigured } from '../lib/clerkConfig';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "mapmyGig",
  description: "Find jobs near you on the map",
};

/** Avoid static prerender of routes that use Clerk hooks when Clerk env is incomplete (local setup). */
export const dynamic = "force-dynamic";

export default function RootLayout({ children }) {
  const publishableKey = getClerkPublishableKey();

  // Wrap content - conditionally use ClerkProvider only if keys are valid
  const content = (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ 
          fontFamily: '"Open Sans", sans-serif',
          margin: 0,
          padding: 0,
          height: '100vh',
          width: '100%',
          overflow: 'hidden'
        }}
      >
        {/* Clerk CAPTCHA widget container - required for Smart CAPTCHA bot protection */}
        <div id="clerk-captcha" style={{ display: "none" }} />
        {children}
      </body>
    </html>
  );

  if (!isClerkConfigured() || !publishableKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '⚠️ Clerk keys missing or invalid. Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY from the Clerk dashboard, then rebuild.'
      );
    }
    return content;
  }

  const clerkJSUrl =
    process.env.NEXT_PUBLIC_CLERK_JS_URL ||
    "https://unpkg.com/@clerk/clerk-js@5/dist/clerk.browser.js";

  const proxyUrl = getClerkProxyUrl();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      clerkJSUrl={clerkJSUrl}
      {...(proxyUrl ? { proxyUrl } : {})}
    >
      {content}
    </ClerkProvider>
  );
}
