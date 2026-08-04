import {
  NextResponse,
} from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Direct checkout is disabled. Please complete payment through Razorpay.",
    },
    {
      status: 410,
    }
  );
}