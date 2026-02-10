import { NextResponse } from "next/server";

const NOMINATIM_USER_AGENT = "NextDoorJobs/1.0 (company-from-url)";
let lastNominatimCall = 0;
const MIN_NOMINATIM_INTERVAL_MS = 1100;

const delayForNominatim = async () => {
  const now = Date.now();
  const elapsed = now - lastNominatimCall;
  if (elapsed < MIN_NOMINATIM_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_NOMINATIM_INTERVAL_MS - elapsed));
  }
  lastNominatimCall = Date.now();
};

/**
 * Extract address or place name from HTML for geocoding.
 * Looks for JSON-LD schema.org LocalBusiness/Place and meta tags.
 */
function extractAddressFromHtml(html, fallbackDomain) {
  if (!html || typeof html !== "string") return null;

  // JSON-LD: LocalBusiness or Place with address
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1].trim());
      const obj = Array.isArray(json) ? json[0] : json;
      const type = obj?.["@type"];
      const isPlace = type === "LocalBusiness" || type === "Organization" || type === "Place";
      if (isPlace && obj?.address) {
        const addr = typeof obj.address === "string" ? obj.address : obj.address;
        if (typeof addr === "object") {
          const parts = [
            addr.streetAddress,
            addr.addressLocality,
            addr.addressRegion,
            addr.addressCountry,
          ].filter(Boolean);
          if (parts.length) return parts.join(", ");
        }
        if (typeof addr === "string" && addr.trim()) return addr.trim();
      }
    } catch (_) {
      // ignore parse errors
    }
  }

  // Meta geo or address
  const metaRegex = /<meta[^>]+(?:name|property)=["'](?:og:locale|geo\.(?:region|placename)|address)[^"']*["'][^>]+content=["']([^"']+)["']/gi;
  const metaParts = [];
  while ((match = metaRegex.exec(html)) !== null) {
    metaParts.push(match[1].trim());
  }
  if (metaParts.length) return metaParts.join(", ");

  return fallbackDomain ? `${fallbackDomain} India` : null;
}

/**
 * GET /api/onboarding/company-from-url?url=https://example.com
 * Tries to resolve company location from the website (schema.org, meta) then geocode via Nominatim.
 * Returns { state, district, latitude, longitude, pincode? } when found; otherwise { state: null, ... }.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const urlParam = searchParams.get("url");
  if (!urlParam || !urlParam.trim()) {
    return NextResponse.json(
      { state: null, district: null, latitude: null, longitude: null, pincode: null },
      { status: 200 }
    );
  }

  let urlString = urlParam.trim();
  if (!urlString.startsWith("http://") && !urlString.startsWith("https://")) {
    urlString = `https://${urlString}`;
  }
  let parsedUrl;
  try {
    parsedUrl = new URL(urlString);
  } catch (_) {
    return NextResponse.json(
      { state: null, district: null, latitude: null, longitude: null, pincode: null },
      { status: 200 }
    );
  }

  const domain = parsedUrl.hostname.replace(/^www\./, "");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const response = await fetch(urlString, {
      signal: controller.signal,
      headers: { "User-Agent": "NextDoorJobs/1.0 (company lookup)" },
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const html = await response.text();
    const searchQuery = extractAddressFromHtml(html, domain);
    if (!searchQuery) {
      return NextResponse.json({
        state: null,
        district: null,
        latitude: null,
        longitude: null,
        pincode: null,
      });
    }

    // Prefer India for Indian companies
    const q = searchQuery.includes("India") ? searchQuery : `${searchQuery}, India`;
    await delayForNominatim();
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=1`;
    const nomRes = await fetch(nominatimUrl, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });
    if (!nomRes.ok) {
      return NextResponse.json({
        state: null,
        district: null,
        latitude: null,
        longitude: null,
        pincode: null,
      });
    }
    const results = await nomRes.json();
    const first = Array.isArray(results) && results.length ? results[0] : null;
    if (!first || first.lat == null || first.lon == null) {
      return NextResponse.json({
        state: null,
        district: null,
        latitude: null,
        longitude: null,
        pincode: null,
      });
    }

    const addr = first.address || {};
    const state = addr.state || addr.region || null;
    const district =
      addr.county || addr.state_district || addr.district || addr.municipality || null;
    const pincode = addr.postcode ? String(addr.postcode).trim() : null;

    return NextResponse.json({
      state,
      district,
      latitude: parseFloat(first.lat),
      longitude: parseFloat(first.lon),
      pincode,
    });
  } catch (err) {
    console.error("Company-from-URL error:", err?.message);
    return NextResponse.json({
      state: null,
      district: null,
      latitude: null,
      longitude: null,
      pincode: null,
    });
  }
}
