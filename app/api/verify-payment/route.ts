import {
  NextRequest,
  NextResponse,
} from "next/server";
import {
  createClient as createAdminClient,
} from "@supabase/supabase-js";

import OrderConfirmation from "@/emails/OrderConfirmation";
import {
  EMAIL_FROM,
  resend,
} from "@/lib/resend";
import {
  getRazorpayClient,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import {
  createClient as createServerClient,
} from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type VerifyPaymentRequest = {
  supabase_order_id?: unknown;
  razorpay_payment_id?: unknown;
  razorpay_order_id?: unknown;
  razorpay_signature?: unknown;
};

type PendingOrderRow = {
  id: string;
  user_id: string | null;
  customer_name: string;
  email: string;
  subtotal: number | string;
  shipping: number | string;
  coupon_code: string | null;
  discount_amount: number | string;
  total: number | string;
  status: string;
  payment_status: string | null;
  payment_method: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
};

type NormalizedPayment = {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  captured: boolean;
};

type FinalizeResult = {
  finalized_order_id: string;
  already_processed: boolean;
};

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Missing Supabase server environment variables."
    );
  }

  return createAdminClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getString(
  value: unknown
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function toNumber(
  value: unknown
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

async function readRequest(
  request: NextRequest
): Promise<VerifyPaymentRequest | null> {
  try {
    const value =
      (await request.json()) as unknown;

    return isRecord(value)
      ? value
      : null;
  } catch {
    return null;
  }
}

function normalizePayment(
  value: unknown
): NormalizedPayment | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = getString(value.id);
  const orderId = getString(
    value.order_id
  );
  const amount = toNumber(
    value.amount
  );
  const currency = getString(
    value.currency
  ).toUpperCase();
  const status = getString(
    value.status
  ).toLowerCase();
  const captured =
    value.captured === true ||
    status === "captured";

  if (
    !id ||
    !orderId ||
    amount <= 0 ||
    !currency ||
    !status
  ) {
    return null;
  }

  return {
    id,
    orderId,
    amount,
    currency,
    status,
    captured,
  };
}

function getFinalizeResult(
  value: unknown
): FinalizeResult | null {
  const candidate = Array.isArray(value)
    ? value[0]
    : value;

  if (!isRecord(candidate)) {
    return null;
  }

  const orderId = getString(
    candidate.finalized_order_id
  );

  if (!UUID_PATTERN.test(orderId)) {
    return null;
  }

  return {
    finalized_order_id:
      orderId,
    already_processed:
      candidate.already_processed ===
      true,
  };
}

export async function POST(
  request: NextRequest
) {
  try {
    const authClient =
      await createServerClient();
    const {
      data: {
        user,
      },
      error: userError,
    } =
      await authClient.auth.getUser();

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You must be signed in to verify payment.",
        },
        {
          status: 401,
        }
      );
    }

    const body =
      await readRequest(request);

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The payment verification request was invalid.",
        },
        {
          status: 400,
        }
      );
    }

    const supabaseOrderId =
      getString(
        body.supabase_order_id
      );
    const razorpayPaymentId =
      getString(
        body.razorpay_payment_id
      );
    const callbackOrderId =
      getString(
        body.razorpay_order_id
      );
    const razorpaySignature =
      getString(
        body.razorpay_signature
      );

    if (
      !UUID_PATTERN.test(
        supabaseOrderId
      ) ||
      !razorpayPaymentId ||
      !callbackOrderId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Required Razorpay payment details are missing.",
        },
        {
          status: 400,
        }
      );
    }

    const supabase =
      getSupabaseAdmin();
    const {
      data: orderData,
      error: orderError,
    } = await supabase
      .from("orders")
      .select(
        `
          id,
          user_id,
          customer_name,
          email,
          subtotal,
          shipping,
          coupon_code,
          discount_amount,
          total,
          status,
          payment_status,
          payment_method,
          razorpay_order_id,
          razorpay_payment_id
        `
      )
      .eq("id", supabaseOrderId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (orderError) {
      throw orderError;
    }

    const order =
      orderData as
        | PendingOrderRow
        | null;

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The pending order could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    const storedOrderId =
      order.razorpay_order_id?.trim() ??
      "";

    if (
      !storedOrderId ||
      storedOrderId !==
        callbackOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The Razorpay order does not match this checkout.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      order.payment_status
        ?.trim()
        .toLowerCase() === "paid"
    ) {
      if (
        order.razorpay_payment_id ===
        razorpayPaymentId
      ) {
        return NextResponse.json(
          {
            success: true,
            order: {
              id: order.id,
            },
            already_processed: true,
          },
          {
            status: 200,
          }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message:
            "This order has already been paid using a different payment.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      order.payment_status
        ?.trim()
        .toLowerCase() !==
      "pending"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This order is no longer awaiting payment.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !verifyRazorpaySignature(
        storedOrderId,
        razorpayPaymentId,
        razorpaySignature
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The Razorpay payment signature could not be verified.",
        },
        {
          status: 400,
        }
      );
    }

    const expectedAmount =
      Math.round(
        toNumber(order.total) * 100
      );

    if (expectedAmount < 100) {
      throw new Error(
        "Stored order total is invalid."
      );
    }

    const razorpay =
      getRazorpayClient();
    const fetchedPayment =
      normalizePayment(
        await razorpay.payments.fetch(
          razorpayPaymentId
        )
      );

    if (!fetchedPayment) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Razorpay returned an invalid payment record.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      fetchedPayment.orderId !==
      storedOrderId
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The payment is not linked to the expected Razorpay order.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      fetchedPayment.currency !==
      "INR"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The Razorpay payment currency is invalid.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      fetchedPayment.amount !==
      expectedAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The payment amount does not match the order total.",
        },
        {
          status: 400,
        }
      );
    }

    let confirmedPayment =
      fetchedPayment;

    if (
      !confirmedPayment.captured &&
      confirmedPayment.status ===
        "authorized"
    ) {
      confirmedPayment =
        normalizePayment(
          await razorpay.payments.capture(
            confirmedPayment.id,
            expectedAmount,
            "INR"
          )
        ) ?? confirmedPayment;
    }

    if (
      !confirmedPayment.captured ||
      confirmedPayment.status !==
        "captured"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The payment has not been captured. Please contact support before retrying.",
        },
        {
          status: 409,
        }
      );
    }

    const paidAt =
      new Date().toISOString();
    const {
      data: finalizeData,
      error: finalizeError,
    } = await supabase.rpc(
      "finalize_razorpay_order",
      {
        p_order_id:
          order.id,
        p_user_id:
          user.id,
        p_razorpay_order_id:
          storedOrderId,
        p_razorpay_payment_id:
          razorpayPaymentId,
        p_razorpay_signature:
          razorpaySignature,
        p_paid_at:
          paidAt,
      }
    );

    if (finalizeError) {
      console.error(
        "Paid order finalization error:",
        {
          orderId: order.id,
          paymentId:
            razorpayPaymentId,
          error: finalizeError,
        }
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Your payment was received, but the order needs manual review. Please contact Rooh & Rivet support and do not pay again.",
        },
        {
          status: 409,
        }
      );
    }

    const finalizeResult =
      getFinalizeResult(
        finalizeData
      );

    if (!finalizeResult) {
      throw new Error(
        "The order finalization response was invalid."
      );
    }

    if (
      !finalizeResult
        .already_processed
    ) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: order.email,
          subject:
            `Your Rooh & Rivet Order #${order.id} is Confirmed`,
          react: OrderConfirmation({
            customerName:
              order.customer_name,
            orderId: order.id,
            subtotal:
              toNumber(
                order.subtotal
              ),
            shipping:
              toNumber(
                order.shipping
              ),
            couponCode:
              order.coupon_code,
            discountAmount:
              toNumber(
                order.discount_amount
              ),
            total:
              toNumber(order.total),
            paymentMethod:
              "Razorpay",
            paymentStatus: "Paid",
            orderStatus:
              "Confirmed",
          }),
        });
      } catch (emailError) {
        console.error(
          "Order confirmation email error:",
          {
            orderId: order.id,
            error: emailError,
          }
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        order: {
          id:
            finalizeResult
              .finalized_order_id,
        },
        already_processed:
          finalizeResult
            .already_processed,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Razorpay verify-payment error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Payment verification could not be completed. Please contact support before paying again.",
      },
      {
        status: 500,
      }
    );
  }
}