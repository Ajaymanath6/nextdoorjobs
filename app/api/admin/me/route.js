import { NextResponse } from "next/server";
import { getAdminSessionOrClerkOwner } from "../../../../lib/adminAuth";

export async function GET() {
  const session = await getAdminSessionOrClerkOwner();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
