import { NextResponse } from "next/server";

/**
 * GET /api/onboarding/fetch-logo?url=https://example.com
 * Fetch company logo from website URL
 * Returns: { success: true, logoUrl: "..." } or { success: false, error: "..." }
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { success: false, error: "URL parameter is required" },
        { status: 400 }
      );
    }

    // Validate and sanitize URL
    let websiteUrl;
    try {
      websiteUrl = new URL(url);
      // Only allow http and https protocols
      if (!["http:", "https:"].includes(websiteUrl.protocol)) {
        return NextResponse.json(
          { success: false, error: "Invalid URL protocol. Only http and https are allowed." },
          { status: 400 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const domain = websiteUrl.origin;

    // Try multiple logo sources
    const logoSources = [
      `${domain}/favicon.ico`,
      `${domain}/logo.png`,
      `${domain}/apple-touch-icon.png`,
      `${domain}/favicon.png`,
    ];

    let logoUrl = null;

    // Try direct logo URLs first
    for (const source of logoSources) {
      try {
        const response = await fetch(source, {
          method: "HEAD",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; LogoFetcher/1.0)",
          },
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });

        if (response.ok) {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.startsWith("image/")) {
            logoUrl = source;
            break;
          }
        }
      } catch (e) {
        // Continue to next source
        continue;
      }
    }

    // If no direct logo found, try parsing HTML
    if (!logoUrl) {
      try {
        const htmlResponse = await fetch(domain, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; LogoFetcher/1.0)",
          },
          signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (htmlResponse.ok) {
          const html = await htmlResponse.text();

          // Try to find icon link in HTML
          const iconMatch = html.match(/<link[^>]*rel=["'](?:icon|shortcut icon)["'][^>]*href=["']([^"']+)["']/i);
          if (iconMatch && iconMatch[1]) {
            const iconUrl = iconMatch[1].startsWith("http")
              ? iconMatch[1]
              : new URL(iconMatch[1], domain).href;
            logoUrl = iconUrl;
          }

          // Try og:image if icon not found
          if (!logoUrl) {
            const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
            if (ogImageMatch && ogImageMatch[1]) {
              const ogImageUrl = ogImageMatch[1].startsWith("http")
                ? ogImageMatch[1]
                : new URL(ogImageMatch[1], domain).href;
              logoUrl = ogImageUrl;
            }
          }
        }
      } catch (e) {
        // HTML parsing failed, continue
      }
    }

    if (logoUrl) {
      // Verify the logo URL is accessible
      try {
        const verifyResponse = await fetch(logoUrl, {
          method: "HEAD",
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; LogoFetcher/1.0)",
          },
          signal: AbortSignal.timeout(5000),
        });

        if (verifyResponse.ok) {
          return NextResponse.json({
            success: true,
            logoUrl,
          });
        }
      } catch (e) {
        // Verification failed
      }
    }

    return NextResponse.json({
      success: false,
      error: "Could not find logo for this website",
    });
  } catch (error) {
    console.error("Error fetching logo:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
