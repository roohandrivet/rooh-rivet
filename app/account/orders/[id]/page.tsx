"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  CreditCard,
  Package,
  ReceiptText,
  Star,
  Tag,
  Truck,
  type LucideIcon,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type NumericValue =
  | number
  | string
  | null;

type OrderItem = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  user_id: string | null;
  customer_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string | null;
  payment_method: string | null;
  payment_status: string | null;
  subtotal: NumericValue;
  shipping: NumericValue;
  coupon_code: string | null;
  discount_amount: NumericValue;
  total: NumericValue;
  status: string | null;
  created_at: string | null;
  items: OrderItem[];
};

type RawOrder = Omit<
  Order,
  "items"
> & {
  items: unknown;
};

type TimelineStep = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const TIMELINE_STEPS:
  TimelineStep[] = [
    {
      title: "Order Placed",
      description:
        "Your order has been received successfully.",
      icon: ReceiptText,
    },
    {
      title: "Processing",
      description:
        "Your jewellery is being carefully prepared and checked.",
      icon: Package,
    },
    {
      title: "Shipped",
      description:
        "Your order has been dispatched and is on its way.",
      icon: Truck,
    },
    {
      title: "Delivered",
      description:
        "Your Rooh & Rivet jewellery has arrived.",
      icon: CheckCircle2,
    },
  ];

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getString(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value
    : "";
}

function toNumber(
  value: unknown
): number {
  const parsed =
    Number(value);

  return Number.isFinite(
    parsed
  )
    ? parsed
    : 0;
}

function parseOrderItems(
  value: unknown
): OrderItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(
      (
        item,
        index
      ): OrderItem | null => {
        if (!isRecord(item)) {
          return null;
        }

        const name =
          getString(
            item.name
          ).trim();

        if (!name) {
          return null;
        }

        const quantity =
          Math.max(
            1,
            Math.floor(
              toNumber(
                item.quantity
              )
            )
          );

        const price =
          Math.max(
            0,
            toNumber(
              item.price
            )
          );

        const id =
          getString(
            item.id
          ).trim() ||
          `item-${index}`;

        const slug =
          getString(
            item.slug
          ).trim();

        const image =
          getString(
            item.image
          ).trim();

        return {
          id,
          slug,
          name,
          quantity,
          price,
          image:
            image || null,
        };
      }
    )
    .filter(
      (
        item
      ): item is OrderItem =>
        item !== null
    );
}

function formatCurrency(
  value: unknown
): string {
  return new Intl.NumberFormat(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }
  ).format(
    toNumber(value)
  );
}

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "Unknown date";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown date";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

function formatDateTime(
  value: string | null
): string {
  if (!value) {
    return "Unknown date";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown date";
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

function getOrderStatusClasses(
  status: string | null
): string {
  switch (
    status
      ?.trim()
      .toLowerCase()
  ) {
    case "delivered":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "shipped":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "processing":
      return "border-purple-200 bg-purple-50 text-purple-700";

    case "cancelled":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getPaymentStatusClasses(
  status: string | null
): string {
  switch (
    status
      ?.trim()
      .toLowerCase()
  ) {
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "failed":
      return "border-red-200 bg-red-50 text-red-700";

    case "refunded":
      return "border-blue-200 bg-blue-50 text-blue-700";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getTimelineIndex(
  status: string | null
): number {
  switch (
    status
      ?.trim()
      .toLowerCase()
  ) {
    case "delivered":
      return 3;

    case "shipped":
      return 2;

    case "processing":
      return 1;

    default:
      return 0;
  }
}

function OrderItemContent({
  item,
}: {
  item: OrderItem;
}) {
  const itemTotal =
    item.price *
    item.quantity;

  return (
    <>
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-[#F8F4EF]">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-[#8B6B5B]">
            No Image
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-lg font-semibold text-[#4B2E2E] sm:text-xl">
          {item.name}
        </h3>

        <p className="mt-2 text-sm text-[#8B6B5B]">
          Quantity:{" "}
          {item.quantity}
        </p>

        <p className="mt-1 text-sm text-[#8B6B5B]">
          Price per item:{" "}
          {formatCurrency(
            item.price
          )}
        </p>
      </div>

      <div className="text-left sm:text-right">
        <p className="text-xs uppercase tracking-[0.12em] text-[#8B6B5B]">
          Item Total
        </p>

        <p className="mt-2 text-lg font-semibold text-[#4B2E2E]">
          {formatCurrency(
            itemTotal
          )}
        </p>
      </div>
    </>
  );
}

export default function OrderDetailsPage() {
  const params =
    useParams<{
      id:
        | string
        | string[];
    }>();

  const router =
    useRouter();

  const orderId =
    typeof params.id ===
    "string"
      ? params.id
      : Array.isArray(
            params.id
          )
        ? params.id[0]
        : "";

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    order,
    setOrder,
  ] =
    useState<Order | null>(
      null
    );

  const [
    error,
    setError,
  ] = useState("");

  const [
    alreadyReviewed,
    setAlreadyReviewed,
  ] = useState(false);

  const loadOrder =
    useCallback(
      async () => {
        if (!orderId) {
          setError(
            "Invalid order reference."
          );

          setLoading(
            false
          );

          return;
        }

        setLoading(true);
        setError("");

        try {
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
            router.replace(
              `/auth/login?redirect=${encodeURIComponent(
                `/account/orders/${orderId}`
              )}`
            );

            return;
          }

          const {
            data:
              orderData,
            error:
              orderError,
          } = await supabase
            .from("orders")
            .select(
              `
                id,
                user_id,
                customer_name,
                email,
                phone,
                address,
                city,
                state,
                postal_code,
                country,
                payment_method,
                payment_status,
                subtotal,
                shipping,
                coupon_code,
                discount_amount,
                total,
                status,
                created_at,
                items
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

          if (orderError) {
            throw orderError;
          }

          if (!orderData) {
            setOrder(null);

            setError(
              "This order could not be found or does not belong to your account."
            );

            return;
          }

          const rawOrder =
            orderData as RawOrder;

          setOrder({
            ...rawOrder,
            items:
              parseOrderItems(
                rawOrder.items
              ),
          });

          const {
            data:
              reviewData,
            error:
              reviewError,
          } = await supabase
            .from("reviews")
            .select("id")
            .eq(
              "order_id",
              rawOrder.id
            )
            .limit(1);

          setAlreadyReviewed(
            !reviewError &&
              Boolean(
                reviewData &&
                  reviewData.length >
                    0
              )
          );
        } catch (
          loadError
        ) {
          console.error(
            "Failed to load order:",
            loadError
          );

          setOrder(null);

          setError(
            loadError instanceof
              Error
              ? loadError.message
              : "Unable to load this order."
          );
        } finally {
          setLoading(false);
        }
      },
      [
        orderId,
        router,
      ]
    );

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF] px-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#E8DDD3] border-t-[#5A2D2D]" />

          <p className="mt-5 text-lg text-[#8B6B5B]">
            Loading order...
          </p>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF] px-6 py-20">
        <div className="w-full max-w-xl rounded-3xl border border-[#E8DDD3] bg-white p-10 text-center shadow-sm">
          <ReceiptText
            size={48}
            className="mx-auto text-[#C8B1A2]"
          />

          <h1 className="mt-6 font-serif text-3xl text-[#4B2E2E]">
            Order Not Found
          </h1>

          <p className="mt-4 leading-7 text-[#8B6B5B]">
            {error ||
              "We could not find this order."}
          </p>

          <Link
            href="/account/orders"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#5A2D2D] px-7 py-3.5 text-white transition hover:bg-[#472323]"
          >
            <ArrowLeft
              size={18}
            />

            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  const status =
    order.status?.trim() ||
    "Pending";

  const paymentStatus =
    order.payment_status?.trim() ||
    "Pending";

  const paymentMethod =
    order.payment_method?.trim() ||
    "Not specified";

  const shipping =
    Math.max(
      0,
      toNumber(
        order.shipping
      )
    );

  const discountAmount =
    Math.max(
      0,
      toNumber(
        order.discount_amount
      )
    );

  const total =
    Math.max(
      0,
      toNumber(
        order.total
      )
    );

  const subtotal =
    order.subtotal === null
      ? Math.max(
          0,
          total +
            discountAmount -
            shipping
        )
      : Math.max(
          0,
          toNumber(
            order.subtotal
          )
        );

  const timelineIndex =
    getTimelineIndex(
      status
    );

  const normalizedStatus =
    status.toLowerCase();

  const isCancelled =
    normalizedStatus ===
    "cancelled";

  const isDelivered =
    normalizedStatus ===
    "delivered";

  const hasCoupon =
    Boolean(
      order.coupon_code?.trim()
    ) &&
    discountAmount > 0;

  return (
    <main className="min-h-screen bg-[#F8F4EF] py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6">
        <Link
          href="/account/orders"
          className="mb-9 inline-flex items-center gap-2 text-[#5A2D2D] transition hover:underline"
        >
          <ArrowLeft
            size={18}
          />

          Back to Orders
        </Link>

        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B6B5B]">
              Purchase Details
            </p>

            <h1 className="mt-3 font-serif text-4xl text-[#4B2E2E] sm:text-5xl">
              Order Details
            </h1>

            <p className="mt-3 break-all text-sm text-[#8B6B5B]">
              Order #{order.id}
            </p>
          </div>

          <span
            className={`w-fit rounded-full border px-5 py-2.5 text-sm font-semibold ${getOrderStatusClasses(
              status
            )}`}
          >
            {status}
          </span>
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="space-y-8">
            <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-serif text-3xl text-[#4B2E2E]">
                Order Summary
              </h2>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#FCFAF8] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B6B5B]">
                    Order Date
                  </p>

                  <p className="mt-3 font-medium text-[#4B2E2E]">
                    {formatDate(
                      order.created_at
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FCFAF8] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B6B5B]">
                    Order Status
                  </p>

                  <span
                    className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${getOrderStatusClasses(
                      status
                    )}`}
                  >
                    {status}
                  </span>
                </div>

                <div className="rounded-2xl bg-[#FCFAF8] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B6B5B]">
                    Payment Method
                  </p>

                  <p className="mt-3 font-medium text-[#4B2E2E]">
                    {paymentMethod}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#FCFAF8] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8B6B5B]">
                    Payment Status
                  </p>

                  <span
                    className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${getPaymentStatusClasses(
                      paymentStatus
                    )}`}
                  >
                    {paymentStatus}
                  </span>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-serif text-3xl text-[#4B2E2E]">
                    Items Purchased
                  </h2>

                  <p className="mt-2 text-sm text-[#8B6B5B]">
                    {order.items.length}{" "}
                    {order.items.length ===
                    1
                      ? "product"
                      : "products"}
                  </p>
                </div>

                <Package
                  size={28}
                  className="text-[#5A2D2D]"
                />
              </div>

              {order.items.length ===
              0 ? (
                <p className="mt-8 rounded-2xl bg-[#F8F4EF] p-6 text-[#8B6B5B]">
                  No products were
                  found in this order.
                </p>
              ) : (
                <div className="mt-8 divide-y divide-[#E8DDD3]">
                  {order.items.map(
                    (
                      item,
                      index
                    ) =>
                      item.slug ? (
                        <Link
                          key={`${item.id}-${index}`}
                          href={`/shop/${item.slug}`}
                          className="flex flex-col gap-5 py-6 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                        >
                          <OrderItemContent
                            item={item}
                          />
                        </Link>
                      ) : (
                        <div
                          key={`${item.id}-${index}`}
                          className="flex flex-col gap-5 py-6 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
                        >
                          <OrderItemContent
                            item={item}
                          />
                        </div>
                      )
                  )}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">
            <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <CreditCard
                  size={24}
                  className="text-[#5A2D2D]"
                />

                <h2 className="font-serif text-3xl text-[#4B2E2E]">
                  Payment Summary
                </h2>
              </div>

              <div className="mt-7 space-y-4">
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
                      {order.coupon_code}
                    </span>

                    <span>
                      -
                      {formatCurrency(
                        discountAmount
                      )}
                    </span>
                  </div>
                ) : null}

                <div className="flex items-center justify-between gap-4 border-t border-[#E8DDD3] pt-5 text-xl font-semibold text-[#4B2E2E]">
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
            </section>

            <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-serif text-3xl text-[#4B2E2E]">
                Shipping Address
              </h2>

              <div className="mt-7 space-y-2 leading-7 text-[#5F4B45]">
                <p className="font-semibold text-[#4B2E2E]">
                  {order.customer_name ??
                    "Customer"}
                </p>

                <p>
                  {order.address ??
                    "Address unavailable"}
                </p>

                <p>
                  {[
                    order.city,
                    order.state,
                  ]
                    .filter(
                      Boolean
                    )
                    .join(
                      ", "
                    )}
                </p>

                {order.postal_code ? (
                  <p>
                    {
                      order.postal_code
                    }
                  </p>
                ) : null}

                {order.country ? (
                  <p>
                    {order.country}
                  </p>
                ) : null}

                <div className="border-t border-[#E8DDD3] pt-4">
                  <p>
                    {order.phone ??
                      "Phone unavailable"}
                  </p>

                  <p className="break-all">
                    {order.email ??
                      "Email unavailable"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
              <h2 className="font-serif text-3xl text-[#4B2E2E]">
                Order Timeline
              </h2>

              <p className="mt-2 text-sm text-[#8B6B5B]">
                Placed{" "}
                {formatDateTime(
                  order.created_at
                )}
              </p>

              <div className="mt-8 space-y-7">
                {TIMELINE_STEPS.map(
                  (
                    step,
                    index
                  ) => {
                    const Icon =
                      step.icon;

                    const completed =
                      !isCancelled &&
                      index <=
                        timelineIndex;

                    return (
                      <div
                        key={
                          step.title
                        }
                        className="flex items-start gap-4"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            completed
                              ? "bg-[#5A2D2D] text-white"
                              : "bg-stone-100 text-stone-400"
                          }`}
                        >
                          {completed ? (
                            <Icon
                              size={17}
                            />
                          ) : (
                            <Circle
                              size={15}
                            />
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-[#4B2E2E]">
                            {
                              step.title
                            }
                          </p>

                          <p className="mt-1 text-sm leading-6 text-[#8B6B5B]">
                            {
                              step.description
                            }
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}

                {isCancelled ? (
                  <div className="flex items-start gap-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <div className="mt-1 h-3 w-3 shrink-0 rounded-full bg-red-500" />

                    <div>
                      <p className="font-semibold text-red-700">
                        Order Cancelled
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-600">
                        This order has
                        been cancelled.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-start gap-3">
                <Star
                  size={27}
                  className="shrink-0 fill-amber-400 text-amber-400"
                />

                <div>
                  <h2 className="font-serif text-2xl text-[#4B2E2E]">
                    Verified Purchase
                    Review
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[#8B6B5B]">
                    Share your
                    experience after
                    receiving your
                    jewellery.
                  </p>
                </div>
              </div>

              {isDelivered ? (
                alreadyReviewed ? (
                  <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="font-semibold text-emerald-700">
                      Thank you for your
                      review.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-emerald-700">
                      Your verified
                      purchase review
                      has already been
                      submitted.
                    </p>
                  </div>
                ) : (
                  <Link
                    href={`/account/orders/${order.id}/review`}
                    className="mt-7 inline-flex rounded-full bg-[#5A2D2D] px-7 py-3.5 font-medium text-white transition hover:bg-[#472323]"
                  >
                    Leave a Review
                  </Link>
                )
              ) : (
                <div className="mt-7 rounded-2xl border border-[#E8DDD3] bg-[#F8F4EF] p-5">
                  <p className="text-sm leading-6 text-[#7A6464]">
                    Reviews become
                    available once your
                    order has been
                    delivered.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}