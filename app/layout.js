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
  title: "JobsonMap",
  description: "Find jobs near you on the map",
};

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
        {children}
      </body>
    </html>
  );

  // Only wrap with ClerkProvider if key is available (prevents build errors)
  if (!publishableKey) {
    // During build, if key is missing, render without ClerkProvider
    // This allows the build to complete even if env vars aren't set
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Clerk features will not work.');
    }
    return content;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      {content}
    </ClerkProvider>
  );
}
