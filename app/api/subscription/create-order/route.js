import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { authService } from "../../../../../lib/services/auth.service";

// Plan IDs and amounts in paise (₹1 = 100 paise). Must match frontend SUBSCRIPTION_PLANS.
const PLAN_AMOUNTS = {
  starter: 32000,   // ₹320/year
  pro: 80000,       // ₹800/year
};

export async function POST(req) {
  try {
    const user = await authService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay is not configured. Set NEXT_PUBLIC_RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const planId = typeof body.planId === "string" ? body.planId.trim() : null;
    const amountPaise = planId ? PLAN_AMOUNTS[planId] : null;

    if (!planId || amountPaise == null) {
      return NextResponse.json(
        { error: "Invalid or unknown plan. Use planId: 'starter' or 'pro'." },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `sub_${user.id}_${planId}_${Date.now()}`,
      notes: { userId: String(user.id), planId },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: amountPaise,
      currency: "INR",
      keyId,
    });
  } catch (err) {
    console.error("[subscription create-order]", err);
    return NextResponse.json(
      { error: err.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
