import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
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
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Wrap content - conditionally use ClerkProvider only if key exists
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

  // ClerkProvider requires both keys; secret is validated by middleware (see proxy.ts)
  if (!publishableKey?.trim() || !process.env.CLERK_SECRET_KEY?.trim()) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '⚠️ Clerk keys incomplete (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY). Clerk features disabled.'
      );
    }
    return content;
  }

  // If Clerk Frontend API uses a custom domain (e.g. clerk.mapmygig.com) that doesn't serve the script,
  // load clerk-js from a CDN so auth still works.
  const clerkJSUrl =
    process.env.NEXT_PUBLIC_CLERK_JS_URL ||
    "https://unpkg.com/@clerk/clerk-js@5/dist/clerk.browser.js";

  // Send FAPI requests through our app's /__clerk proxy so custom domain is not required.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const proxyUrl =
    process.env.NEXT_PUBLIC_CLERK_PROXY_URL ||
    (baseUrl ? `${baseUrl.replace(/\/$/, "")}/__clerk` : "");

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      clerkJSUrl={clerkJSUrl}
      proxyUrl={proxyUrl}
    >
      {content}
    </ClerkProvider>
  );
}
