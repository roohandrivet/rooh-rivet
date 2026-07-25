"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Package,
  RefreshCw,
  ShoppingBag,
  Tag,
  Truck,
  XCircle,
} from "lucide-react";

import {
  supabase,
} from "@/lib/supabase";

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
  total: NumericValue;
  subtotal: NumericValue;
  shipping: NumericValue;
  discount_amount: NumericValue;
  coupon_code: string | null;
  status: string | null;
  payment_status: string | null;
  payment_method: string | null;
  created_at: string | null;
  items: OrderItem[];
};

type RawOrder = Omit<
  Order,
  "items"
> & {
  items: unknown;
};

type StatusDetails = {
  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;
  className: string;
};

function isRecord(
  value: unknown
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getString(
  value: unknown
): string {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

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
    Number.isFinite(amount)
      ? Math.max(0, amount)
      : 0;

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

function parseOrderItems(
  value: unknown
): OrderItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(
      (
        rawItem,
        index
      ): OrderItem | null => {
        if (
          !isRecord(rawItem)
        ) {
          return null;
        }

        const name =
          getString(
            rawItem.name
          );

        if (!name) {
          return null;
        }

        const id =
          getString(
            rawItem.id
          ) ||
          `item-${index}`;

        const slug =
          getString(
            rawItem.slug
          );

        const image =
          getString(
            rawItem.image
          );

        const quantity =
          Math.max(
            1,
            Math.floor(
              toNumber(
                rawItem.quantity as
                  | number
                  | string
                  | null
              )
            )
          );

        const price =
          toSafeAmount(
            rawItem.price as
              | number
              | string
              | null
          );

        return {
          id,
          slug,
          name,
          image:
            image || null,
          quantity,
          price,
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

function getItemCount(
  items: OrderItem[]
): number {
  return items.reduce(
    (
      total,
      item
    ) =>
      total +
      item.quantity,
    0
  );
}

function getStatusDetails(
  status: string | null
): StatusDetails {
  switch (
    status
      ?.trim()
      .toLowerCase()
  ) {
    case "delivered":
      return {
        icon:
          CheckCircle2,
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "processing":
    case "packaging":
      return {
        icon:
          Clock3,
        className:
          "border-purple-200 bg-purple-50 text-purple-700",
      };

    case "shipped":
      return {
        icon:
          Truck,
        className:
          "border-blue-200 bg-blue-50 text-blue-700",
      };

    case "cancelled":
      return {
        icon:
          XCircle,
        className:
          "border-red-200 bg-red-50 text-red-700",
      };

    default:
      return {
        icon:
          Package,
        className:
          "border-amber-200 bg-amber-50 text-amber-700",
      };
  }
}

function getPaymentClasses(
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

export default function AccountOrdersPage() {
  const router =
    useRouter();

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>([]);

  const [
    error,
    setError,
  ] =
    useState("");

  const loadOrders =
    useCallback(
      async (
        showRefreshState =
          false
      ): Promise<void> => {
        if (
          showRefreshState
        ) {
          setRefreshing(
            true
          );
        } else {
          setLoading(true);
        }

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
              "/auth/login?redirect=/account/orders"
            );

            return;
          }

          const {
            data,
            error:
              ordersError,
          } = await supabase
            .from("orders")
            .select(
              `
                id,
                user_id,
                total,
                subtotal,
                shipping,
                discount_amount,
                coupon_code,
                status,
                payment_status,
                payment_method,
                created_at,
                items
              `
            )
            .eq(
              "user_id",
              user.id
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

          if (
            ordersError
          ) {
            throw ordersError;
          }

          const parsedOrders =
            (
              (data ??
                []) as RawOrder[]
            ).map(
              (
                order
              ): Order => ({
                ...order,
                items:
                  parseOrderItems(
                    order.items
                  ),
              })
            );

          setOrders(
            parsedOrders
          );
        } catch (
          loadError: unknown
        ) {
          console.error(
            "Failed to load orders:",
            loadError
          );

          setOrders([]);

          setError(
            loadError instanceof
            Error
              ? loadError.message
              : "Unable to load your orders."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [router]
    );

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const statistics =
    useMemo(() => {
      const activeOrders =
        orders.filter(
          (order) => {
            const status =
              order.status
                ?.trim()
                .toLowerCase();

            return (
              status !==
                "delivered" &&
              status !==
                "cancelled"
            );
          }
        ).length;

      const totalValue =
        orders.reduce(
          (
            total,
            order
          ) => {
            const status =
              order.status
                ?.trim()
                .toLowerCase();

            if (
              status ===
              "cancelled"
            ) {
              return total;
            }

            return (
              total +
              toSafeAmount(
                order.total
              )
            );
          },
          0
        );

      const totalSavings =
        orders.reduce(
          (
            total,
            order
          ) =>
            total +
            toSafeAmount(
              order.discount_amount
            ),
          0
        );

      return {
        activeOrders,
        totalValue,
        totalSavings,
      };
    }, [orders]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF] px-6">
        <div className="text-center">
          <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-[#E8DDD3] border-t-[#5A2D2D]" />

          <p className="mt-5 text-lg text-[#8B6B5B]">
            Loading your orders...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link
              href="/account"
              className="mb-8 inline-flex items-center gap-2 text-[#5A2D2D] transition hover:underline"
            >
              <ArrowLeft
                size={18}
              />

              Back to My Account
            </Link>

            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B6B5B]">
              Purchase History
            </p>

            <h1 className="mt-3 font-serif text-4xl text-[#4B2E2E] sm:text-5xl">
              My Orders
            </h1>

            <p className="mt-3 max-w-2xl leading-7 text-[#8B6B5B]">
              Track purchases, payments, shipping updates and
              complete order history. Completed order values are
              shown exactly as stored in INR.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadOrders(
                true
              )
            }
            disabled={
              refreshing
            }
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D9C8BC] bg-white px-5 py-3 text-sm font-semibold text-[#5A2D2D] transition hover:bg-[#FCF8F4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        <section className="mt-10 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-[#E8DDD3] bg-white p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6ECE5]">
              <ShoppingBag
                size={22}
                className="text-[#5A2D2D]"
              />
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.17em] text-[#8B6B5B]">
              Total Orders
            </p>

            <p className="mt-3 font-serif text-4xl text-[#4B2E2E]">
              {orders.length}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E8DDD3] bg-white p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
              <Clock3
                size={22}
                className="text-amber-700"
              />
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.17em] text-[#8B6B5B]">
              Active Orders
            </p>

            <p className="mt-3 font-serif text-4xl text-[#4B2E2E]">
              {
                statistics.activeOrders
              }
            </p>
          </div>

          <div className="rounded-3xl border border-[#E8DDD3] bg-white p-7 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <CreditCard
                size={22}
                className="text-emerald-700"
              />
            </div>

            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.17em] text-[#8B6B5B]">
              Total Order Value
            </p>

            <p className="mt-3 font-serif text-3xl text-[#4B2E2E] sm:text-4xl">
              {formatCurrency(
                statistics.totalValue
              )}
            </p>

            {statistics.totalSavings >
            0 ? (
              <p className="mt-2 text-sm text-emerald-700">
                Saved{" "}
                {formatCurrency(
                  statistics.totalSavings
                )}{" "}
                with coupons
              </p>
            ) : null}
          </div>
        </section>

        {error ? (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>
              {error}
            </p>
          </div>
        ) : null}

        <div className="mt-10 space-y-6">
          {orders.length ===
          0 ? (
            <div className="rounded-3xl border border-[#E8DDD3] bg-white p-10 text-center shadow-sm sm:p-14">
              <Package
                size={58}
                className="mx-auto text-[#C9B5A8]"
              />

              <h2 className="mt-6 font-serif text-3xl text-[#4B2E2E]">
                No Orders Yet
              </h2>

              <p className="mx-auto mt-4 max-w-lg leading-7 text-[#8B6B5B]">
                Your handcrafted jewellery journey begins with your
                first purchase.
              </p>

              <Link
                href="/shop"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#5A2D2D] px-8 py-4 font-semibold text-white transition hover:bg-[#472323]"
              >
                Explore Collection

                <ChevronRight
                  size={20}
                />
              </Link>
            </div>
          ) : (
            orders.map(
              (order) => {
                const status =
                  order.status?.trim() ||
                  "Pending";

                const paymentStatus =
                  order.payment_status?.trim() ||
                  "Pending";

                const paymentMethod =
                  order.payment_method?.trim() ||
                  "Not specified";

                const statusDetails =
                  getStatusDetails(
                    status
                  );

                const StatusIcon =
                  statusDetails.icon;

                const itemCount =
                  getItemCount(
                    order.items
                  );

                const discountAmount =
                  toSafeAmount(
                    order.discount_amount
                  );

                const shipping =
                  toSafeAmount(
                    order.shipping
                  );

                const total =
                  toSafeAmount(
                    order.total
                  );

                const subtotal =
                  order.subtotal ===
                  null
                    ? Math.max(
                        0,
                        total +
                          discountAmount -
                          shipping
                      )
                    : toSafeAmount(
                        order.subtotal
                      );

                const couponCode =
                  order.coupon_code
                    ?.trim()
                    .toUpperCase() ??
                  "";

                return (
                  <Link
                    key={
                      order.id
                    }
                    href={`/account/orders/${encodeURIComponent(
                      order.id
                    )}`}
                    className="group block rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B6B5B]">
                          Order Reference
                        </p>

                        <h2 className="mt-2 font-serif text-2xl text-[#4B2E2E]">
                          #
                          {order.id
                            .slice(
                              0,
                              8
                            )
                            .toUpperCase()}
                        </h2>

                        <p className="mt-3 text-sm text-[#8B6B5B]">
                          {formatDate(
                            order.created_at
                          )}
                        </p>

                        <p className="mt-2 text-sm text-[#8B6B5B]">
                          {paymentMethod}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-3 lg:justify-end">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${statusDetails.className}`}
                        >
                          <StatusIcon
                            size={16}
                          />

                          {status}
                        </span>

                        <span
                          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${getPaymentClasses(
                            paymentStatus
                          )}`}
                        >
                          <CreditCard
                            size={15}
                          />

                          {
                            paymentStatus
                          }
                        </span>
                      </div>
                    </div>

                    <div className="mt-7 grid gap-7 border-t border-[#ECE3DA] pt-7 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
                      <div>
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B6B5B]">
                            Products
                          </p>

                          <span className="rounded-full bg-[#F6ECE5] px-3 py-1.5 text-xs font-semibold text-[#5A2D2D]">
                            {itemCount}{" "}
                            {itemCount ===
                            1
                              ? "item"
                              : "items"}
                          </span>
                        </div>

                        {order.items
                          .length >
                        0 ? (
                          <div className="mt-5 space-y-3">
                            {order.items
                              .slice(
                                0,
                                3
                              )
                              .map(
                                (
                                  item,
                                  index
                                ) => (
                                  <div
                                    key={`${order.id}-${item.id}-${index}`}
                                    className="flex items-center justify-between gap-5 rounded-2xl bg-[#F8F4EF] px-4 py-3.5"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-medium text-[#4B2E2E]">
                                        {
                                          item.name
                                        }
                                      </p>

                                      <p className="mt-1 text-sm text-[#8B6B5B]">
                                        Qty:{" "}
                                        {
                                          item.quantity
                                        }
                                      </p>
                                    </div>

                                    <p className="shrink-0 font-semibold text-[#4B2E2E]">
                                      {formatCurrency(
                                        item.price *
                                          item.quantity
                                      )}
                                    </p>
                                  </div>
                                )
                              )}

                            {order.items
                              .length >
                            3 ? (
                              <p className="text-sm text-[#8B6B5B]">
                                +
                                {order
                                  .items
                                  .length -
                                  3}{" "}
                                more{" "}
                                {order
                                  .items
                                  .length -
                                  3 ===
                                1
                                  ? "product"
                                  : "products"}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="mt-5 text-sm text-[#8B6B5B]">
                            No product details available.
                          </p>
                        )}
                      </div>

                      <div className="rounded-2xl border border-[#E8DDD3] bg-[#FCFAF8] p-5">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8B6B5B]">
                            Payment Summary
                          </p>

                          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#A08374]">
                            INR
                          </span>
                        </div>

                        <div className="mt-5 space-y-3 text-sm">
                          <div className="flex justify-between gap-4 text-[#7A6464]">
                            <span>
                              Subtotal
                            </span>

                            <span>
                              {formatCurrency(
                                subtotal
                              )}
                            </span>
                          </div>

                          <div className="flex justify-between gap-4 text-[#7A6464]">
                            <span className="inline-flex items-center gap-1.5">
                              <Truck
                                size={14}
                              />

                              Shipping
                            </span>

                            <span
                              className={
                                shipping ===
                                0
                                  ? "font-semibold text-emerald-700"
                                  : ""
                              }
                            >
                              {shipping ===
                              0
                                ? "Free"
                                : formatCurrency(
                                    shipping
                                  )}
                            </span>
                          </div>

                          {couponCode &&
                          discountAmount >
                            0 ? (
                            <div className="flex justify-between gap-4 text-emerald-700">
                              <span className="inline-flex items-center gap-1.5">
                                <Tag
                                  size={14}
                                />

                                {
                                  couponCode
                                }
                              </span>

                              <span>
                                -
                                {formatCurrency(
                                  discountAmount
                                )}
                              </span>
                            </div>
                          ) : null}

                          <div className="flex justify-between gap-4 border-t border-[#E8DDD3] pt-4 text-lg font-semibold text-[#4B2E2E]">
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

                        <div className="mt-6 flex items-center justify-end gap-2 font-semibold text-[#5A2D2D] transition-all group-hover:gap-3">
                          View Details

                          <ChevronRight
                            size={20}
                          />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              }
            )
          )}
        </div>
      </div>
    </main>
  );
}