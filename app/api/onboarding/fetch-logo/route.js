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
    const hostname = websiteUrl.hostname;

    // Try multiple logo sources
    const logoSources = [
      `${domain}/favicon.ico`,
      `${domain}/logo.png`,
      `${domain}/apple-touch-icon.png`,
      `${domain}/favicon.png`,
    ];

    const fetchOpts = {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/*,*/*",
      },
      signal: AbortSignal.timeout(5000),
    };

    let logoUrl = null;

    function isImageResponse(response) {
      const ct = response.headers.get("content-type");
      return ct && ct.split(";")[0].trim().toLowerCase().startsWith("image/");
    }

    // Try direct logo URLs: HEAD first, then GET if needed (some servers reject HEAD)
    for (const source of logoSources) {
      try {
        let response = await fetch(source, { ...fetchOpts, method: "HEAD" });
        if (!response.ok && response.status === 405) {
          response = await fetch(source, { ...fetchOpts, method: "GET" });
        }
        if (response.ok && isImageResponse(response)) {
          logoUrl = source;
          break;
        }
      } catch (e) {
        try {
          const getRes = await fetch(source, { ...fetchOpts, method: "GET" });
          if (getRes.ok && isImageResponse(getRes)) {
            logoUrl = source;
            break;
          }
        } catch (_) {}
      }
    }

    // If no direct logo found, try parsing HTML
    if (!logoUrl) {
      try {
        const htmlResponse = await fetch(domain, {
          headers: fetchOpts.headers,
          signal: AbortSignal.timeout(10000),
        });

        if (htmlResponse.ok) {
          const html = await htmlResponse.text();

          // Relaxed icon link patterns: rel="icon", rel="shortcut icon", etc.
          const iconMatch = html.match(/<link[^>]+rel=["']([^"']*icon[^"']*)["'][^>]+href=["']([^"']+)["']/i)
            || html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']([^"']*icon[^"']*)["']/i);
          if (iconMatch) {
            const href = String(iconMatch[1]).toLowerCase().includes("icon") ? iconMatch[2] : iconMatch[1];
            const iconUrl = href.startsWith("http") ? href : new URL(href, domain).href;
            logoUrl = iconUrl;
          }

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
      try {
        let verifyResponse = await fetch(logoUrl, { ...fetchOpts, method: "HEAD" });
        if (!verifyResponse.ok && verifyResponse.status === 405) {
          verifyResponse = await fetch(logoUrl, { ...fetchOpts, method: "GET" });
        }
        if (verifyResponse.ok && isImageResponse(verifyResponse)) {
          return NextResponse.json({ success: true, logoUrl });
        }
      } catch (e) {
        // Verification failed
      }
    }

    // Fallback: Google's favicon service (works for most domains)
    try {
      const googleFavicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
      const gfRes = await fetch(googleFavicon, { ...fetchOpts, method: "GET" });
      if (gfRes.ok) return NextResponse.json({ success: true, logoUrl: googleFavicon });
    } catch (_) {}

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
