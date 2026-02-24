import { NextResponse } from "next/server";
import crypto from "crypto";
import { authService } from "../../../../lib/services/auth.service";

/**
 * Verify Razorpay payment signature and optionally record the subscription.
 * POST body: { orderId, paymentId, razorpaySignature }
 */
export async function POST(req) {
  try {
    const user = await authService.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Razorpay is not configured." },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const orderId = body.orderId ?? body.razorpay_order_id;
    const paymentId = body.paymentId ?? body.razorpay_payment_id;
    const signature = body.razorpaySignature ?? body.razorpay_signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: "Missing orderId, paymentId, or razorpaySignature." },
        { status: 400 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: "Invalid payment signature." },
        { status: 400 }
      );
    }

    // Payment verified. Here you can store the subscription in your DB (e.g. link orderId/paymentId to user and plan).
    // For now we return success; add a Subscription or Payment table and save when ready.
    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      paymentId,
      orderId,
    });
  } catch (err) {
    console.error("[subscription verify-payment]", err);
    return NextResponse.json(
      { error: err.message || "Verification failed" },
      { status: 500 }
    );
  }
}
