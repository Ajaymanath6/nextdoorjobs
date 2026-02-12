import { NextResponse } from "next/server";

const NOMINATIM_USER_AGENT = "NextDoorJobs/1.0 (forward geocoding)";
let lastApiCallTime = 0;
const MIN_API_CALL_INTERVAL_MS = 1100;

const delayForRateLimit = async () => {
  const now = Date.now();
  const elapsed = now - lastApiCallTime;
  if (elapsed < MIN_API_CALL_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, MIN_API_CALL_INTERVAL_MS - elapsed));
  }
  lastApiCallTime = Date.now();
};

/**
 * GET /api/geocode/forward?q=Mumbai India
 * Returns first Nominatim result: { lat, lon, displayName }. For fallback when a suggestion has no coords.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");
  if (!q || typeof q !== "string" || !q.trim()) {
    return NextResponse.json(
      { error: "Missing q query parameter" },
      { status: 400 }
    );
  }

  try {
    await delayForRateLimit();
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q.trim())}&format=json&limit=1&countrycodes=in`;
    const response = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT },
    });

    if (!response.ok) {
      return NextResponse.json(
        { lat: null, lon: null, displayName: null },
        { status: 200 }
      );
    }

    const data = await response.json();
    const first = Array.isArray(data) && data.length ? data[0] : null;
    if (!first || first.lat == null || first.lon == null) {
      return NextResponse.json({
        lat: null,
        lon: null,
        displayName: null,
      });
    }

    return NextResponse.json({
      lat: parseFloat(first.lat),
      lon: parseFloat(first.lon),
      displayName: first.display_name || null,
    });
  } catch (err) {
    console.error("Forward geocode error:", err?.message);
    return NextResponse.json({
      lat: null,
      lon: null,
      displayName: null,
    });
  }
}
