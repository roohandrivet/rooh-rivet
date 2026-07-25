import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Package,
  ReceiptText,
  Sparkles,
  Tag,
  Truck,
  User,
} from "lucide-react";
import {
  redirect,
} from "next/navigation";

import {
  createClient,
} from "@/lib/supabase/server";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

type OrderSuccessPageProps = {
  searchParams: Promise<{
    id?:
      | string
      | string[];
  }>;
};

type OrderRow = {
  id: string;
  user_id:
    | string
    | null;
  customer_name:
    | string
    | null;
  email:
    | string
    | null;
  subtotal:
    | number
    | string
    | null;
  shipping:
    | number
    | string
    | null;
  coupon_code:
    | string
    | null;
  discount_amount:
    | number
    | string
    | null;
  total:
    | number
    | string
    | null;
  payment_method:
    | string
    | null;
  payment_status:
    | string
    | null;
  status:
    | string
    | null;
  created_at:
    | string
    | null;
};

type TimelineStep = {
  title: string;
  description: string;
};

const TIMELINE_STEPS:
  TimelineStep[] = [
    {
      title:
        "Order Confirmed",
      description:
        "Your order has been successfully received.",
    },
    {
      title:
        "Packaging",
      description:
        "Your jewellery will be carefully quality checked and packaged before dispatch.",
    },
    {
      title:
        "Shipped",
      description:
        "You will receive shipping confirmation and tracking details.",
    },
    {
      title:
        "Delivered",
      description:
        "Your Rooh & Rivet jewellery will arrive at your delivery address.",
    },
  ];

function toNumber(
  value:
    | number
    | string
    | null
    | undefined
): number {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function toSafeAmount(
  value:
    | number
    | string
    | null
    | undefined
): number {
  return Math.max(
    0,
    toNumber(value)
  );
}

function formatCurrency(
  amount: number
): string {
  const safeAmount =
    Math.max(
      0,
      Number.isFinite(amount)
        ? amount
        : 0
    );

  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits:
        Number.isInteger(
          safeAmount
        )
          ? 0
          : 2,
      maximumFractionDigits: 2,
    }
  )
    .format(
      safeAmount
    )
    .replace(
      /\u00a0/g,
      " "
    );
}

function formatOrderDate(
  value:
    | string
    | null
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  );
}

function getStatusClasses(
  status: string
): string {
  const normalizedStatus =
    status
      .trim()
      .toLowerCase();

  if (
    normalizedStatus ===
      "confirmed" ||
    normalizedStatus ===
      "paid" ||
    normalizedStatus ===
      "completed"
  ) {
    return "bg-emerald-100 text-emerald-700";
  }

  if (
    normalizedStatus ===
      "cancelled" ||
    normalizedStatus ===
      "failed" ||
    normalizedStatus ===
      "refunded"
  ) {
    return "bg-red-100 text-red-700";
  }

  if (
    normalizedStatus ===
      "shipped" ||
    normalizedStatus ===
      "delivered"
  ) {
    return "bg-blue-100 text-blue-700";
  }

  return "bg-amber-100 text-amber-700";
}

function getFirstQueryValue(
  value:
    | string
    | string[]
    | undefined
): string {
  if (
    Array.isArray(value)
  ) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function getSafeDisplayText(
  value:
    | string
    | null
    | undefined,
  fallback: string
): string {
  const trimmedValue =
    value?.trim();

  return trimmedValue
    ? trimmedValue
    : fallback;
}

export default async function OrderSuccessPage({
  searchParams,
}: OrderSuccessPageProps) {
  const params =
    await searchParams;

  const orderId =
    getFirstQueryValue(
      params.id
    );

  if (
    !orderId ||
    orderId.length > 200
  ) {
    redirect(
      "/account/orders"
    );
  }

  const supabase =
    await createClient();

  const {
    data: {
      user,
    },
    error:
      userError,
  } =
    await supabase.auth.getUser();

  if (
    userError ||
    !user
  ) {
    redirect(
      `/auth/login?redirect=${encodeURIComponent(
        `/order-success?id=${orderId}`
      )}`
    );
  }

  const {
    data,
    error,
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
        payment_method,
        payment_status,
        status,
        created_at
      `
    )
    .eq(
      "id",
      orderId
    )
    .eq(
      "user_id",
      user.id
    )
    .maybeSingle();

  if (
    error ||
    !data
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF] px-6 py-20">
        <div className="w-full max-w-2xl rounded-[36px] border border-[#E8DDD3] bg-white p-10 text-center shadow-xl sm:p-14">
          <ReceiptText
            size={56}
            className="mx-auto text-[#5A2D2D]"
          />

          <h1 className="mt-8 font-serif text-4xl text-[#4B2E2E]">
            Order Not Found
          </h1>

          <p className="mt-5 leading-7 text-[#7A6464]">
            We could not load this order. It may not belong to the
            signed-in account, or the order reference may be
            incorrect.
          </p>

          <Link
            href="/account/orders"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#5A2D2D] px-8 py-4 text-white transition hover:bg-[#472323]"
          >
            View My Orders

            <ArrowRight
              size={18}
            />
          </Link>
        </div>
      </main>
    );
  }

  const order =
    data as OrderRow;

  const subtotal =
    toSafeAmount(
      order.subtotal
    );

  const shipping =
    toSafeAmount(
      order.shipping
    );

  const discountAmount =
    toSafeAmount(
      order.discount_amount
    );

  const total =
    toSafeAmount(
      order.total
    );

  const customerName =
    getSafeDisplayText(
      order.customer_name,
      getSafeDisplayText(
        typeof user.user_metadata
          ?.full_name ===
          "string"
          ? user.user_metadata
              .full_name
          : null,
        user.email
          ?.split("@")[0] ??
          "Valued Customer"
      )
    );

  const orderStatus =
    getSafeDisplayText(
      order.status,
      "Pending"
    );

  const paymentStatus =
    getSafeDisplayText(
      order.payment_status,
      "Pending"
    );

  const paymentMethod =
    getSafeDisplayText(
      order.payment_method,
      "Not specified"
    );

  const orderDate =
    formatOrderDate(
      order.created_at
    );

  const confirmationEmail =
    getSafeDisplayText(
      order.email,
      user.email ??
        "Not available"
    );

  const couponCode =
    order.coupon_code
      ?.trim()
      .toUpperCase() ??
    "";

  const hasCoupon =
    Boolean(
      couponCode
    ) &&
    discountAmount > 0;

  return (
    <main className="min-h-screen bg-[#F8F4EF] px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto w-full max-w-5xl rounded-[40px] border border-[#E8DDD3] bg-white p-7 text-center shadow-2xl sm:p-12">
        <div className="flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 sm:h-28 sm:w-28">
            <CheckCircle2
              size={66}
              className="text-emerald-600"
            />
          </div>
        </div>

        <p className="mt-10 text-xs uppercase tracking-[0.55em] text-[#8B6B5B] sm:text-sm">
          Thank You
        </p>

        <h1 className="mt-6 font-serif text-4xl text-[#4B2E2E] sm:text-6xl">
          Order Confirmed
        </h1>

        <p className="mt-5 text-lg text-[#4B2E2E] sm:text-xl">
          {customerName}, your order has been received.
        </p>

        <p className="mx-auto mt-7 max-w-3xl text-base leading-8 text-[#7A6464] sm:text-lg">
          Thank you for choosing Rooh &amp; Rivet. Your jewellery
          will be prepared with exceptional care and attention
          before dispatch.
        </p>

        <section className="mt-10 rounded-3xl border border-[#E8DDD3] bg-[#FCFAF8] p-6 text-left sm:p-8">
          <div className="flex flex-col gap-4 border-b border-[#E8DDD3] pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8B6B5B]">
                Order Reference
              </p>

              <p className="mt-2 break-all font-serif text-xl text-[#4B2E2E] sm:text-2xl">
                #{order.id}
              </p>

              {orderDate ? (
                <p className="mt-2 text-sm text-[#8B6B5B]">
                  Placed on{" "}
                  {orderDate}
                </p>
              ) : null}
            </div>

            <span
              className={`w-fit rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] ${getStatusClasses(
                orderStatus
              )}`}
            >
              {orderStatus}
            </span>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-5">
              <div className="flex items-center gap-3">
                <CreditCard
                  size={20}
                  className="text-[#5A2D2D]"
                />

                <p className="font-semibold text-[#4B2E2E]">
                  Payment
                </p>
              </div>

              <p className="mt-3 text-sm text-[#7A6464]">
                {paymentMethod}
              </p>

              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                  paymentStatus
                )}`}
              >
                {paymentStatus}
              </span>
            </div>

            <div className="rounded-2xl bg-white p-5">
              <div className="flex items-center gap-3">
                <User
                  size={20}
                  className="text-[#5A2D2D]"
                />

                <p className="font-semibold text-[#4B2E2E]">
                  Confirmation Email
                </p>
              </div>

              <p className="mt-3 break-all text-sm text-[#7A6464]">
                {confirmationEmail}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="font-serif text-2xl text-[#4B2E2E]">
                Payment Summary
              </h2>

              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B6B5B]">
                Stored in INR
              </p>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between gap-4 text-[#7A6464]">
                <span>
                  Subtotal
                </span>

                <span>
                  {formatCurrency(
                    subtotal
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 text-[#7A6464]">
                <span className="inline-flex items-center gap-2">
                  <Truck
                    size={16}
                  />

                  Shipping
                </span>

                <span
                  className={
                    shipping === 0
                      ? "font-semibold text-emerald-700"
                      : ""
                  }
                >
                  {shipping === 0
                    ? "Free"
                    : formatCurrency(
                        shipping
                      )}
                </span>
              </div>

              {hasCoupon ? (
                <div className="flex items-center justify-between gap-4 text-emerald-700">
                  <span className="inline-flex items-center gap-2">
                    <Tag
                      size={16}
                    />

                    Coupon{" "}
                    {couponCode}
                  </span>

                  <span>
                    -
                    {formatCurrency(
                      discountAmount
                    )}
                  </span>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-4 border-t border-[#E8DDD3] pt-5 text-xl font-semibold text-[#4B2E2E] sm:text-2xl">
                <span>
                  Total
                </span>

                <span>
                  {formatCurrency(
                    total
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-12 rounded-3xl bg-[#F8F4EF] p-7 sm:p-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#8B6B5B]">
            What&apos;s Next?
          </p>

          <h2 className="mt-4 font-serif text-2xl text-[#4B2E2E] sm:text-3xl">
            We&apos;ll begin preparing your order.
          </h2>

          <p className="mt-5 leading-8 text-[#7A6464]">
            A confirmation email will be sent shortly. You will
            also receive shipping and delivery updates as your
            order progresses.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-[#F8F4EF] p-6">
            <Package className="mx-auto text-[#5A2D2D]" />

            <h3 className="mt-4 font-serif text-2xl text-[#4B2E2E]">
              Order Processing
            </h3>

            <p className="mt-3 leading-7 text-[#7A6464]">
              Your order is being reviewed and prepared.
            </p>
          </div>

          <div className="rounded-3xl bg-[#F8F4EF] p-6">
            <Sparkles className="mx-auto text-[#5A2D2D]" />

            <h3 className="mt-4 font-serif text-2xl text-[#4B2E2E]">
              Luxury Packaging
            </h3>

            <p className="mt-3 leading-7 text-[#7A6464]">
              Premium signature packaging is included with every
              order.
            </p>
          </div>

          <div className="rounded-3xl bg-[#F8F4EF] p-6">
            <User className="mx-auto text-[#5A2D2D]" />

            <h3 className="mt-4 font-serif text-2xl text-[#4B2E2E]">
              Your Account
            </h3>

            <p className="mt-3 leading-7 text-[#7A6464]">
              Track your order from your account at any time.
            </p>
          </div>
        </div>

        <div className="mt-12 rounded-3xl bg-[#F8F4EF] p-7 text-left sm:p-8">
          <h3 className="text-center font-serif text-2xl text-[#4B2E2E]">
            Estimated Timeline
          </h3>

          <div className="mx-auto mt-8 max-w-2xl space-y-7">
            {TIMELINE_STEPS.map(
              (step) => (
                <div
                  key={
                    step.title
                  }
                  className="flex items-start gap-5"
                >
                  <div className="mt-1.5 h-4 w-4 shrink-0 rounded-full bg-[#5A2D2D]" />

                  <div>
                    <h4 className="font-semibold text-[#4B2E2E]">
                      {
                        step.title
                      }
                    </h4>

                    <p className="mt-1 leading-7 text-[#7A6464]">
                      {
                        step.description
                      }
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-center gap-4 md:flex-row">
          <Link
            href="/account/orders"
            className="flex items-center justify-center gap-3 rounded-full bg-[#5A2D2D] px-9 py-4 text-white transition hover:bg-[#472323]"
          >
            View My Orders

            <ArrowRight
              size={20}
            />
          </Link>

          <Link
            href="/shop"
            className="rounded-full border border-[#5A2D2D] px-9 py-4 text-[#5A2D2D] transition hover:bg-[#5A2D2D] hover:text-white"
          >
            Continue Shopping
          </Link>

          <Link
            href="/contact"
            className="rounded-full border border-[#E8DDD3] px-9 py-4 text-[#5A2D2D] transition hover:bg-[#F8F4EF]"
          >
            Contact Support
          </Link>
        </div>

        <p className="mt-10 text-sm leading-7 text-[#8B6B5B]">
          Need help with your order? Our team is always happy to
          assist you through the contact page.
        </p>
      </div>
    </main>
  );
}