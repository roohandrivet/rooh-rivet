import { NextResponse } from "next/server";
import { resend, EMAIL_FROM } from "@/lib/resend";
import OrderConfirmation from "@/emails/OrderConfirmation";

type RequestBody = {
  customerName: string;
  customerEmail: string;
  orderId: string;
  total: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    const {
      customerName,
      customerEmail,
      orderId,
      total,
    } = body;

    if (
      !customerName ||
      !customerEmail ||
      !orderId ||
      typeof total !== "number"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields.",
        },
        {
          status: 400,
        }
      );
    }

    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: customerEmail,
      subject: `Your Rooh & Rivet Order #${orderId} is Confirmed`,
      react: OrderConfirmation({
        customerName,
        orderId,
        total,
      }),
    });

    if (error) {
      console.error(error);

      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to send email.",
      },
      {
        status: 500,
      }
    );
  }
}