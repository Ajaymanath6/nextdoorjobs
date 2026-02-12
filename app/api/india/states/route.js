import { NextResponse } from "next/server";

const DATA_URL =
  "https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json";
let cachedStates = null;

async function getAllStates() {
  if (cachedStates) return cachedStates;
  const res = await fetch(DATA_URL, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error("Failed to fetch states data");
  const data = await res.json();
  const list = data?.states || [];
  cachedStates = list.map((s) => s.state || "").filter(Boolean);
  return cachedStates;
}

/**
 * GET /api/india/states
 * Returns { states: string[] } - all Indian states and UTs.
 */
export async function GET() {
  try {
    const states = await getAllStates();
    return NextResponse.json({ states });
  } catch (err) {
    console.error("India states API error:", err?.message);
    return NextResponse.json({ states: [] });
  }
}
