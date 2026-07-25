"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Package,
  RefreshCw,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type NumericValue =
  | number
  | string
  | null;

type OrderStatus =
  | "Pending"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Failed"
  | "Refunded";

type Order = {
  id: string;
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
  items: unknown;
  created_at: string | null;
};

const ORDER_STATUSES:
  OrderStatus[] = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
    "Cancelled",
  ];

const PAYMENT_STATUSES:
  PaymentStatus[] = [
    "Pending",
    "Paid",
    "Failed",
    "Refunded",
  ];

function toNumber(
  value:
    | NumericValue
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

function formatCurrency(
  value:
    | NumericValue
    | undefined
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
      month: "short",
      year: "numeric",
    }
  );
}

function formatTime(
  value: string | null
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

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function getItemCount(
  items: unknown
): number {
  if (!Array.isArray(items)) {
    return 0;
  }

  return items.reduce<number>(
    (
      total,
      item
    ) => {
      if (
        typeof item !==
          "object" ||
        item === null
      ) {
        return total;
      }

      if (
        !(
          "quantity" in item
        )
      ) {
        return total;
      }

      const quantity =
        Number(
          item.quantity
        );

      if (
        !Number.isFinite(
          quantity
        )
      ) {
        return total;
      }

      return (
        total +
        Math.max(
          0,
          Math.floor(
            quantity
          )
        )
      );
    },
    0
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

function isOrderStatus(
  value: string
): value is OrderStatus {
  return ORDER_STATUSES.some(
    (status) =>
      status === value
  );
}

function isPaymentStatus(
  value: string
): value is PaymentStatus {
  return PAYMENT_STATUSES.some(
    (status) =>
      status === value
  );
}

export default function AdminOrdersPage() {
  const [
    orders,
    setOrders,
  ] =
    useState<Order[]>([]);

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
    search,
    setSearch,
  ] =
    useState("");

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState("");

  const [
    updatingOrderId,
    setUpdatingOrderId,
  ] =
    useState<
      string | null
    >(null);

  const [
    deletingOrderId,
    setDeletingOrderId,
  ] =
    useState<
      string | null
    >(null);

  const fetchOrders =
    useCallback(
      async (
        showRefreshState =
          false
      ) => {
        if (
          showRefreshState
        ) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        try {
          const {
            data,
            error:
              fetchError,
          } = await supabase
            .from("orders")
            .select(
              `
                id,
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
                items,
                created_at
              `
            )
            .order(
              "created_at",
              {
                ascending:
                  false,
              }
            );

          if (fetchError) {
            throw fetchError;
          }

          setOrders(
            (data ??
              []) as Order[]
          );
        } catch (
          fetchError
        ) {
          console.error(
            "Failed to fetch orders:",
            fetchError
          );

          setOrders([]);

          setError(
            fetchError instanceof
              Error
              ? fetchError.message
              : "Unable to load orders."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      []
    );

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  const filteredOrders =
    useMemo(() => {
      const term =
        search
          .trim()
          .toLowerCase();

      if (!term) {
        return orders;
      }

      return orders.filter(
        (order) => {
          const searchableText =
            [
              order.id,
              order.customer_name,
              order.email,
              order.phone,
              order.status,
              order.payment_status,
              order.payment_method,
              order.coupon_code,
              order.address,
              order.city,
              order.state,
              order.postal_code,
              order.country,
            ]
              .filter(
                (
                  value
                ): value is string =>
                  typeof value ===
                  "string"
              )
              .join(" ")
              .toLowerCase();

          return searchableText.includes(
            term
          );
        }
      );
    }, [
      orders,
      search,
    ]);

  const statistics =
    useMemo(() => {
      const totalRevenue =
        orders.reduce(
          (
            total,
            order
          ) =>
            total +
            Math.max(
              0,
              toNumber(
                order.total
              )
            ),
          0
        );

      const totalShipping =
        orders.reduce(
          (
            total,
            order
          ) =>
            total +
            Math.max(
              0,
              toNumber(
                order.shipping
              )
            ),
          0
        );

      const totalDiscount =
        orders.reduce(
          (
            total,
            order
          ) =>
            total +
            Math.max(
              0,
              toNumber(
                order.discount_amount
              )
            ),
          0
        );

      const pendingOrders =
        orders.filter(
          (order) =>
            order.status
              ?.trim()
              .toLowerCase() ===
            "pending"
        ).length;

      const deliveredOrders =
        orders.filter(
          (order) =>
            order.status
              ?.trim()
              .toLowerCase() ===
            "delivered"
        ).length;

      return {
        totalRevenue,
        totalShipping,
        totalDiscount,
        pendingOrders,
        deliveredOrders,
      };
    }, [orders]);

  async function updateOrderStatus(
    id: string,
    status: OrderStatus
  ) {
    setUpdatingOrderId(id);
    setError("");
    setSuccess("");

    try {
      const {
        error:
          updateError,
      } = await supabase
        .from("orders")
        .update({
          status,
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      setOrders(
        (previous) =>
          previous.map(
            (order) =>
              order.id === id
                ? {
                    ...order,
                    status,
                  }
                : order
          )
      );

      setSuccess(
        "Order status updated."
      );
    } catch (
      updateError
    ) {
      console.error(
        "Failed to update order status:",
        updateError
      );

      setError(
        updateError instanceof
          Error
          ? updateError.message
          : "Unable to update the order status."
      );
    } finally {
      setUpdatingOrderId(
        null
      );
    }
  }

  async function updatePaymentStatus(
    id: string,
    paymentStatus:
      PaymentStatus
  ) {
    setUpdatingOrderId(id);
    setError("");
    setSuccess("");

    try {
      const {
        error:
          updateError,
      } = await supabase
        .from("orders")
        .update({
          payment_status:
            paymentStatus,
        })
        .eq("id", id);

      if (updateError) {
        throw updateError;
      }

      setOrders(
        (previous) =>
          previous.map(
            (order) =>
              order.id === id
                ? {
                    ...order,
                    payment_status:
                      paymentStatus,
                  }
                : order
          )
      );

      setSuccess(
        "Payment status updated."
      );
    } catch (
      updateError
    ) {
      console.error(
        "Failed to update payment status:",
        updateError
      );

      setError(
        updateError instanceof
          Error
          ? updateError.message
          : "Unable to update the payment status."
      );
    } finally {
      setUpdatingOrderId(
        null
      );
    }
  }

  async function deleteOrder(
    id: string
  ) {
    const confirmed =
      window.confirm(
        "Delete this order permanently? This action cannot be undone."
      );

    if (!confirmed) {
      return;
    }

    setDeletingOrderId(id);
    setError("");
    setSuccess("");

    try {
      const {
        error:
          deleteError,
      } = await supabase
        .from("orders")
        .delete()
        .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      setOrders(
        (previous) =>
          previous.filter(
            (order) =>
              order.id !== id
          )
      );

      setSuccess(
        "Order deleted."
      );
    } catch (
      deleteError
    ) {
      console.error(
        "Failed to delete order:",
        deleteError
      );

      setError(
        deleteError instanceof
          Error
          ? deleteError.message
          : "Unable to delete the order."
      );
    } finally {
      setDeletingOrderId(
        null
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] p-5 sm:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B6B5B]">
              Store Management
            </p>

            <h1 className="mt-3 font-serif text-4xl text-[#4B2E2E] sm:text-5xl">
              Orders
            </h1>

            <p className="mt-3 text-[#8B6B5B]">
              Manage orders,
              payments, shipping,
              coupons and fulfilment.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void fetchOrders(
                true
              )
            }
            disabled={refreshing}
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
              : "Refresh Orders"}
          </button>
        </div>

        <section className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F6ECE5]">
              <ShoppingBag
                size={21}
                className="text-[#5A2D2D]"
              />
            </div>

            <p className="mt-5 text-sm text-[#8B6B5B]">
              Total Orders
            </p>

            <p className="mt-2 font-serif text-3xl text-[#4B2E2E]">
              {orders.length}
            </p>
          </div>

          <div className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50">
              <Package
                size={21}
                className="text-amber-700"
              />
            </div>

            <p className="mt-5 text-sm text-[#8B6B5B]">
              Pending Orders
            </p>

            <p className="mt-2 font-serif text-3xl text-[#4B2E2E]">
              {
                statistics.pendingOrders
              }
            </p>
          </div>

          <div className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
              <Truck
                size={21}
                className="text-emerald-700"
              />
            </div>

            <p className="mt-5 text-sm text-[#8B6B5B]">
              Delivered
            </p>

            <p className="mt-2 font-serif text-3xl text-[#4B2E2E]">
              {
                statistics.deliveredOrders
              }
            </p>
          </div>

          <div className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50">
              <CreditCard
                size={21}
                className="text-emerald-700"
              />
            </div>

            <p className="mt-5 text-sm text-[#8B6B5B]">
              Order Revenue
            </p>

            <p className="mt-2 font-serif text-3xl text-[#4B2E2E]">
              {formatCurrency(
                statistics.totalRevenue
              )}
            </p>

            <p className="mt-2 text-xs leading-5 text-[#8B6B5B]">
              Shipping:{" "}
              {formatCurrency(
                statistics.totalShipping
              )}
            </p>

            {statistics.totalDiscount >
            0 ? (
              <p className="text-xs leading-5 text-[#8B6B5B]">
                Discounts:{" "}
                {formatCurrency(
                  statistics.totalDiscount
                )}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#E8DDD3] bg-white p-5 shadow-sm">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B6B5B]"
            />

            <input
              type="search"
              placeholder="Search order number, customer, email, phone, address, coupon or status..."
              value={search}
              onChange={(
                event
              ) =>
                setSearch(
                  event.target
                    .value
                )
              }
              className="w-full rounded-2xl border border-[#DED3CB] bg-[#FCFAF8] py-4 pl-12 pr-4 text-[#4B2E2E] outline-none transition placeholder:text-[#A79084] focus:border-[#5A2D2D]"
            />
          </div>
        </section>

        {error ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>{success}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-8 rounded-3xl border border-[#E8DDD3] bg-white p-14 text-center shadow-sm">
            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-[#5A2D2D]"
            />

            <p className="mt-4 text-[#8B6B5B]">
              Loading orders...
            </p>
          </div>
        ) : filteredOrders.length ===
          0 ? (
          <div className="mt-8 rounded-3xl border border-[#E8DDD3] bg-white p-14 text-center shadow-sm">
            <ShoppingBag
              size={42}
              className="mx-auto text-[#CDB8AA]"
            />

            <h2 className="mt-5 font-serif text-2xl text-[#4B2E2E]">
              No Orders Found
            </h2>

            <p className="mt-2 text-[#8B6B5B]">
              No orders match the
              current search.
            </p>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-3xl border border-[#E8DDD3] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1500px]">
                <thead className="bg-[#F8F4EF]">
                  <tr className="text-left text-xs uppercase tracking-[0.12em] text-[#6B4A42]">
                    <th className="px-5 py-4">
                      Order
                    </th>

                    <th className="px-5 py-4">
                      Customer
                    </th>

                    <th className="px-5 py-4">
                      Delivery Address
                    </th>

                    <th className="px-5 py-4">
                      Items
                    </th>

                    <th className="px-5 py-4">
                      Pricing
                    </th>

                    <th className="px-5 py-4">
                      Payment
                    </th>

                    <th className="px-5 py-4">
                      Order Status
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>

                    <th className="px-5 py-4">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredOrders.map(
                    (order) => {
                      const shipping =
                        Math.max(
                          0,
                          toNumber(
                            order.shipping
                          )
                        );

                      const discount =
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
                        order.subtotal ===
                        null
                          ? Math.max(
                              0,
                              total +
                                discount -
                                shipping
                            )
                          : Math.max(
                              0,
                              toNumber(
                                order.subtotal
                              )
                            );

                      const itemCount =
                        getItemCount(
                          order.items
                        );

                      const isUpdating =
                        updatingOrderId ===
                        order.id;

                      const isDeleting =
                        deletingOrderId ===
                        order.id;

                      const currentOrderStatus =
                        order.status ??
                        "Pending";

                      const currentPaymentStatus =
                        order.payment_status ??
                        "Pending";

                      return (
                        <tr
                          key={
                            order.id
                          }
                          className="border-t border-[#EEE5DE] align-top transition hover:bg-[#FCFAF8]"
                        >
                          <td className="px-5 py-5">
                            <p className="font-semibold text-[#4B2E2E]">
                              #
                              {order.id.slice(
                                0,
                                8
                              )}
                            </p>

                            <p className="mt-2 max-w-[150px] break-all text-xs text-[#9A8174]">
                              {order.id}
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <p className="font-semibold text-[#4B2E2E]">
                              {order.customer_name ??
                                "Unknown customer"}
                            </p>

                            <p className="mt-2 max-w-[220px] break-all text-sm text-[#7A6464]">
                              {order.email ??
                                "No email"}
                            </p>

                            <p className="mt-1 text-sm text-[#8B6B5B]">
                              {order.phone ??
                                "No phone"}
                            </p>
                          </td>

                          <td className="px-5 py-5 text-sm leading-6 text-[#6F5952]">
                            <p>
                              {order.address ??
                                "No address"}
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
                                {
                                  order.country
                                }
                              </p>
                            ) : null}
                          </td>

                          <td className="px-5 py-5">
                            <div className="inline-flex items-center gap-2 rounded-full bg-[#F6ECE5] px-3 py-2 text-sm font-semibold text-[#5A2D2D]">
                              <Package
                                size={15}
                              />

                              {itemCount}{" "}
                              {itemCount ===
                              1
                                ? "item"
                                : "items"}
                            </div>
                          </td>

                          <td className="px-5 py-5">
                            <div className="space-y-2 text-sm">
                              <div className="flex min-w-[210px] justify-between gap-4 text-[#7A6464]">
                                <span>
                                  Subtotal
                                </span>

                                <span>
                                  {formatCurrency(
                                    subtotal
                                  )}
                                </span>
                              </div>

                              <div className="flex min-w-[210px] justify-between gap-4 text-[#7A6464]">
                                <span className="inline-flex items-center gap-1">
                                  <Truck
                                    size={13}
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

                              {order.coupon_code &&
                              discount >
                                0 ? (
                                <div className="flex min-w-[210px] justify-between gap-4 text-emerald-700">
                                  <span className="inline-flex items-center gap-1">
                                    <Tag
                                      size={13}
                                    />

                                    {
                                      order.coupon_code
                                    }
                                  </span>

                                  <span>
                                    -
                                    {formatCurrency(
                                      discount
                                    )}
                                  </span>
                                </div>
                              ) : null}

                              <div className="flex min-w-[210px] justify-between gap-4 border-t border-[#EEE5DE] pt-2 font-semibold text-[#4B2E2E]">
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
                          </td>

                          <td className="px-5 py-5">
                            <p className="mb-3 text-sm text-[#6F5952]">
                              {order.payment_method ??
                                "Not specified"}
                            </p>

                            <select
                              value={
                                currentPaymentStatus
                              }
                              disabled={
                                isUpdating
                              }
                              onChange={(
                                event
                              ) => {
                                const value =
                                  event
                                    .target
                                    .value;

                                if (
                                  isPaymentStatus(
                                    value
                                  )
                                ) {
                                  void updatePaymentStatus(
                                    order.id,
                                    value
                                  );
                                }
                              }}
                              className={`rounded-xl border px-3 py-2 text-sm font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60 ${getPaymentStatusClasses(
                                order.payment_status
                              )}`}
                            >
                              {PAYMENT_STATUSES.map(
                                (
                                  status
                                ) => (
                                  <option
                                    key={
                                      status
                                    }
                                    value={
                                      status
                                    }
                                  >
                                    {
                                      status
                                    }
                                  </option>
                                )
                              )}
                            </select>
                          </td>

                          <td className="px-5 py-5">
                            <select
                              value={
                                currentOrderStatus
                              }
                              disabled={
                                isUpdating
                              }
                              onChange={(
                                event
                              ) => {
                                const value =
                                  event
                                    .target
                                    .value;

                                if (
                                  isOrderStatus(
                                    value
                                  )
                                ) {
                                  void updateOrderStatus(
                                    order.id,
                                    value
                                  );
                                }
                              }}
                              className={`rounded-xl border px-3 py-2 text-sm font-medium outline-none disabled:cursor-not-allowed disabled:opacity-60 ${getOrderStatusClasses(
                                order.status
                              )}`}
                            >
                              {ORDER_STATUSES.map(
                                (
                                  status
                                ) => (
                                  <option
                                    key={
                                      status
                                    }
                                    value={
                                      status
                                    }
                                  >
                                    {
                                      status
                                    }
                                  </option>
                                )
                              )}
                            </select>

                            {isUpdating ? (
                              <p className="mt-2 text-xs text-[#8B6B5B]">
                                Updating...
                              </p>
                            ) : null}
                          </td>

                          <td className="px-5 py-5 text-sm text-[#7A6464]">
                            <p>
                              {formatDate(
                                order.created_at
                              )}
                            </p>

                            <p className="mt-1">
                              {formatTime(
                                order.created_at
                              )}
                            </p>
                          </td>

                          <td className="px-5 py-5">
                            <button
                              type="button"
                              disabled={
                                isDeleting
                              }
                              onClick={() =>
                                void deleteOrder(
                                  order.id
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Trash2
                                size={15}
                              />

                              {isDeleting
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}