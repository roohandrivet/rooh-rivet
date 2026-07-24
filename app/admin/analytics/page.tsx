"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  IndianRupee,
  Package,
  RefreshCw,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type OrderRow = {
  id: string;
  customer_name: string | null;
  email: string | null;
  total: number | string | null;
  status: string | null;
  created_at: string | null;
  items: unknown;
};

type OrderItem = {
  id: string;
  slug: string;
  name: string;
  quantity: number;
  price: number;
  image: string;
};

type MonthlyRevenue = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};

type BestSeller = {
  key: string;
  name: string;
  quantity: number;
  revenue: number;
};

type StatusSummary = {
  name: string;
  count: number;
  percentage: number;
};

type StatCard = {
  title: string;
  value: string;
  description: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;
  trend?: number;
};

function toNumber(
  value: number | string | null | undefined
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatCurrency(
  value: number
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCompactCurrency(
  value: number
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function getValidDate(
  value: string | null
): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getMonthKey(
  date: Date
): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}

function createMonthlyBuckets(): MonthlyRevenue[] {
  const now = new Date();
  const months: MonthlyRevenue[] = [];

  for (
    let monthOffset = 5;
    monthOffset >= 0;
    monthOffset -= 1
  ) {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - monthOffset,
      1
    );

    months.push({
      key: getMonthKey(date),
      label: date.toLocaleDateString(
        "en-IN",
        {
          month: "short",
        }
      ),
      revenue: 0,
      orders: 0,
    });
  }

  return months;
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

function parseOrderItems(
  value: unknown
): OrderItem[] {
  let parsedValue: unknown = value;

  if (typeof value === "string") {
    try {
      parsedValue =
        JSON.parse(value) as unknown;
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsedValue)) {
    return [];
  }

  return parsedValue
    .filter(isRecord)
    .map((item) => {
      return {
        id:
          typeof item.id === "string"
            ? item.id
            : "",
        slug:
          typeof item.slug === "string"
            ? item.slug
            : "",
        name:
          typeof item.name === "string" &&
          item.name.trim()
            ? item.name.trim()
            : "Unnamed Product",
        quantity: Math.max(
          0,
          toNumber(
            typeof item.quantity === "number" ||
              typeof item.quantity === "string"
              ? item.quantity
              : 0
          )
        ),
        price: Math.max(
          0,
          toNumber(
            typeof item.price === "number" ||
              typeof item.price === "string"
              ? item.price
              : 0
          )
        ),
        image:
          typeof item.image === "string"
            ? item.image
            : "",
      };
    });
}

function formatStatus(
  status: string
): string {
  return status
    .replace(/_/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      return (
        word.charAt(0).toUpperCase() +
        word.slice(1).toLowerCase()
      );
    })
    .join(" ");
}

function getStatusClasses(
  status: string
): string {
  const normalized =
    status.toLowerCase();

  if (
    normalized.includes("delivered") ||
    normalized.includes("completed")
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    normalized.includes("cancel") ||
    normalized.includes("refund")
  ) {
    return "bg-red-100 text-red-700";
  }

  if (normalized.includes("ship")) {
    return "bg-blue-100 text-blue-700";
  }

  if (
    normalized.includes("pack") ||
    normalized.includes("process") ||
    normalized.includes("craft")
  ) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-[#F3EAE4] text-[#6A4036]";
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (isRecord(error)) {
    const message = error.message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Unable to load analytics.";
}

function formatOrderDate(
  value: string | null
): string {
  const date = getValidDate(value);

  if (!date) {
    return "Unknown date";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

export default function AnalyticsPage() {
  const [orders, setOrders] =
    useState<OrderRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadAnalytics = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const {
          data,
          error: ordersError,
        } = await supabase
          .from("orders")
          .select(
            `
              id,
              customer_name,
              email,
              total,
              status,
              created_at,
              items
            `
          )
          .order("created_at", {
            ascending: false,
          });

        if (ordersError) {
          throw ordersError;
        }

        setOrders(
          (data ?? []) as OrderRow[]
        );
      } catch (loadError) {
        setOrders([]);
        setError(
          getErrorMessage(loadError)
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const totalRevenue = useMemo(() => {
    return orders.reduce(
      (total, order) => {
        return (
          total + toNumber(order.total)
        );
      },
      0
    );
  }, [orders]);

  const customerCount = useMemo(() => {
    const customers =
      new Set<string>();

    orders.forEach((order) => {
      const email = order.email
        ?.trim()
        .toLowerCase();

      if (email) {
        customers.add(email);
      }
    });

    return customers.size;
  }, [orders]);

  const allOrderItems = useMemo(() => {
    return orders.flatMap((order) =>
      parseOrderItems(order.items)
    );
  }, [orders]);

  const totalItemsSold = useMemo(() => {
    return allOrderItems.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );
  }, [allOrderItems]);

  const averageOrderValue =
    orders.length > 0
      ? totalRevenue / orders.length
      : 0;

  const revenueGrowth = useMemo(() => {
    const now = new Date();

    const currentPeriodStart =
      new Date(now);

    currentPeriodStart.setDate(
      now.getDate() - 30
    );

    const previousPeriodStart =
      new Date(now);

    previousPeriodStart.setDate(
      now.getDate() - 60
    );

    let currentRevenue = 0;
    let previousRevenue = 0;

    orders.forEach((order) => {
      const orderDate = getValidDate(
        order.created_at
      );

      if (!orderDate) {
        return;
      }

      const orderTotal = toNumber(
        order.total
      );

      if (
        orderDate >=
          currentPeriodStart &&
        orderDate <= now
      ) {
        currentRevenue += orderTotal;
        return;
      }

      if (
        orderDate >=
          previousPeriodStart &&
        orderDate <
          currentPeriodStart
      ) {
        previousRevenue += orderTotal;
      }
    });

    if (previousRevenue === 0) {
      return currentRevenue > 0
        ? 100
        : 0;
    }

    return (
      ((currentRevenue -
        previousRevenue) /
        previousRevenue) *
      100
    );
  }, [orders]);

  const monthlyRevenue = useMemo(() => {
    const months =
      createMonthlyBuckets();

    const monthsByKey = new Map(
      months.map((month) => [
        month.key,
        month,
      ])
    );

    orders.forEach((order) => {
      const orderDate = getValidDate(
        order.created_at
      );

      if (!orderDate) {
        return;
      }

      const month = monthsByKey.get(
        getMonthKey(orderDate)
      );

      if (!month) {
        return;
      }

      month.revenue += toNumber(
        order.total
      );

      month.orders += 1;
    });

    return months;
  }, [orders]);

  const highestMonthlyRevenue =
    useMemo(() => {
      return Math.max(
        ...monthlyRevenue.map(
          (month) => month.revenue
        ),
        1
      );
    }, [monthlyRevenue]);

  const bestSellers = useMemo(() => {
    const products = new Map<
      string,
      BestSeller
    >();

    allOrderItems.forEach((item) => {
      const productKey =
        item.id ||
        item.slug ||
        item.name.toLowerCase();

      const existing =
        products.get(productKey);

      if (existing) {
        existing.quantity +=
          item.quantity;

        existing.revenue +=
          item.quantity * item.price;

        return;
      }

      products.set(productKey, {
        key: productKey,
        name: item.name,
        quantity: item.quantity,
        revenue:
          item.quantity * item.price,
      });
    });

    return Array.from(
      products.values()
    )
      .sort((first, second) => {
        if (
          second.quantity !==
          first.quantity
        ) {
          return (
            second.quantity -
            first.quantity
          );
        }

        return (
          second.revenue -
          first.revenue
        );
      })
      .slice(0, 5);
  }, [allOrderItems]);

  const highestProductQuantity =
    useMemo(() => {
      return Math.max(
        ...bestSellers.map(
          (product) =>
            product.quantity
        ),
        1
      );
    }, [bestSellers]);

  const statusSummary = useMemo(() => {
    const statuses = new Map<
      string,
      number
    >();

    orders.forEach((order) => {
      const status = formatStatus(
        order.status?.trim() ||
          "Pending"
      );

      statuses.set(
        status,
        (statuses.get(status) ?? 0) +
          1
      );
    });

    return Array.from(
      statuses.entries()
    )
      .map<StatusSummary>(
        ([name, count]) => ({
          name,
          count,
          percentage:
            orders.length > 0
              ? (count /
                  orders.length) *
                100
              : 0,
        })
      )
      .sort(
        (first, second) =>
          second.count - first.count
      );
  }, [orders]);

  const recentOrders = useMemo(() => {
    return orders.slice(0, 5);
  }, [orders]);

  const stats = useMemo<StatCard[]>(
    () => [
      {
        title: "Total Revenue",
        value:
          formatCurrency(
            totalRevenue
          ),
        description:
          "Revenue from all recorded orders",
        icon: IndianRupee,
      },
      {
        title: "Orders",
        value:
          orders.length.toLocaleString(
            "en-IN"
          ),
        description:
          "Total orders placed",
        icon: ShoppingBag,
      },
      {
        title: "Customers",
        value:
          customerCount.toLocaleString(
            "en-IN"
          ),
        description:
          "Unique customer email addresses",
        icon: Users,
      },
      {
        title: "Revenue Growth",
        value: `${
          revenueGrowth > 0 ? "+" : ""
        }${revenueGrowth.toFixed(1)}%`,
        description:
          "Last 30 days vs previous 30 days",
        icon: TrendingUp,
        trend: revenueGrowth,
      },
    ],
    [
      customerCount,
      orders.length,
      revenueGrowth,
      totalRevenue,
    ]
  );

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-12 w-64 animate-pulse rounded-xl bg-[#E8DDD3]" />

          <div className="mt-3 h-5 w-80 animate-pulse rounded-lg bg-[#EFE6DF]" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({
            length: 4,
          }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-3xl border border-[#E8DDD3] bg-white"
            />
          ))}
        </div>

        <div className="h-96 animate-pulse rounded-3xl border border-[#E8DDD3] bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9A7765]">
            Rooh &amp; Rivet Admin
          </p>

          <h1 className="mt-3 font-serif text-4xl text-[#5A2D2D] sm:text-5xl">
            Analytics
          </h1>

          <p className="mt-2 text-[#8B6B5B]">
            Live store performance from
            your Supabase orders.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadAnalytics(true)
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#DCCEC4] bg-white px-5 py-3 text-sm font-semibold text-[#5A2D2D] transition hover:bg-[#F8F4EF] disabled:cursor-not-allowed disabled:opacity-60"
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
            : "Refresh Data"}
        </button>
      </div>

      {error ? (
        <div className="flex items-start gap-3 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Unable to load analytics
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          const isNegative =
            typeof stat.trend ===
              "number" &&
            stat.trend < 0;

          return (
            <div
              key={stat.title}
              className="rounded-3xl border border-[#E8DDD3] bg-white p-7 shadow-[0_15px_45px_rgba(75,46,46,0.05)]"
            >
              <div className="flex items-start justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-sm text-[#8B6B5B]">
                    {stat.title}
                  </p>

                  <h2 className="mt-3 break-words font-serif text-3xl text-[#5A2D2D]">
                    {stat.value}
                  </h2>
                </div>

                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F8F4EF]">
                  <Icon
                    size={26}
                    className="text-[#5A2D2D]"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2">
                {typeof stat.trend ===
                "number" ? (
                  isNegative ? (
                    <ArrowDownRight
                      size={16}
                      className="text-red-600"
                    />
                  ) : (
                    <ArrowUpRight
                      size={16}
                      className="text-green-600"
                    />
                  )
                ) : null}

                <p className="text-xs leading-5 text-[#92796D]">
                  {stat.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-[0_15px_45px_rgba(75,46,46,0.05)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-3xl text-[#5A2D2D]">
                Revenue Overview
              </h2>

              <p className="mt-2 text-sm text-[#8B6B5B]">
                Revenue generated during
                the last six months.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-2xl bg-[#F8F4EF] px-4 py-2 text-sm font-semibold text-[#5A2D2D]">
              <BarChart3 size={17} />
              Six months
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="mt-8 flex h-72 items-center justify-center rounded-2xl border border-dashed border-[#DCCEC4] bg-[#FCFAF8]">
              <div className="text-center">
                <ShoppingBag
                  size={32}
                  className="mx-auto text-[#B0988C]"
                />

                <p className="mt-3 text-sm text-[#8B6B5B]">
                  No order data available
                  yet.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-10">
              <div className="flex h-64 items-end gap-3 border-b border-[#E8DDD3] px-2 sm:gap-5">
                {monthlyRevenue.map(
                  (month) => {
                    const percentage =
                      month.revenue > 0
                        ? Math.max(
                            5,
                            (month.revenue /
                              highestMonthlyRevenue) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={month.key}
                        className="flex h-full min-w-0 flex-1 flex-col justify-end"
                      >
                        <div className="mb-3 hidden text-center text-xs font-semibold text-[#5A2D2D] sm:block">
                          {month.revenue > 0
                            ? formatCompactCurrency(
                                month.revenue
                              )
                            : "₹0"}
                        </div>

                        <div className="flex h-48 items-end justify-center">
                          <div
                            title={`${month.label}: ${formatCurrency(
                              month.revenue
                            )}`}
                            style={{
                              height: `${percentage}%`,
                            }}
                            className="w-full max-w-14 rounded-t-xl bg-[#5A2D2D] transition-all duration-500 hover:bg-[#74453D]"
                          />
                        </div>

                        <div className="mt-3 text-center">
                          <p className="text-xs font-semibold text-[#5A2D2D] sm:text-sm">
                            {month.label}
                          </p>

                          <p className="mt-1 text-[10px] text-[#9A8378] sm:text-xs">
                            {month.orders}{" "}
                            {month.orders === 1
                              ? "order"
                              : "orders"}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F8F4EF] p-5">
                  <p className="text-sm text-[#8B6B5B]">
                    Average order value
                  </p>

                  <p className="mt-2 font-serif text-2xl text-[#5A2D2D]">
                    {formatCurrency(
                      averageOrderValue
                    )}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#F8F4EF] p-5">
                  <p className="text-sm text-[#8B6B5B]">
                    Total items sold
                  </p>

                  <p className="mt-2 font-serif text-2xl text-[#5A2D2D]">
                    {totalItemsSold.toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-[0_15px_45px_rgba(75,46,46,0.05)] sm:p-8">
          <div>
            <h2 className="font-serif text-3xl text-[#5A2D2D]">
              Order Status
            </h2>

            <p className="mt-2 text-sm text-[#8B6B5B]">
              Current distribution of all
              orders.
            </p>
          </div>

          {statusSummary.length === 0 ? (
            <div className="mt-8 flex h-64 items-center justify-center rounded-2xl border border-dashed border-[#DCCEC4] bg-[#FCFAF8]">
              <p className="text-sm text-[#8B6B5B]">
                No orders available.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {statusSummary.map(
                (status) => (
                  <div key={status.name}>
                    <div className="mb-2 flex items-center justify-between gap-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          status.name
                        )}`}
                      >
                        {status.name}
                      </span>

                      <span className="text-sm font-semibold text-[#5A2D2D]">
                        {status.count}
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-[#F0E7E1]">
                      <div
                        style={{
                          width: `${status.percentage}%`,
                        }}
                        className="h-full rounded-full bg-[#5A2D2D]"
                      />
                    </div>

                    <p className="mt-2 text-right text-xs text-[#9A8378]">
                      {status.percentage.toFixed(
                        1
                      )}
                      % of orders
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>

      <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-[0_15px_45px_rgba(75,46,46,0.05)] sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl text-[#5A2D2D]">
              Best Selling Products
            </h2>

            <p className="mt-2 text-sm text-[#8B6B5B]">
              Ranked using product
              quantities stored inside
              orders.items.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-[#F8F4EF] px-4 py-2 text-sm font-semibold text-[#5A2D2D]">
            <Package size={17} />
            Top {bestSellers.length}
          </div>
        </div>

        {bestSellers.length === 0 ? (
          <div className="mt-8 flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-[#DCCEC4] bg-[#FCFAF8]">
            <div className="text-center">
              <Package
                size={34}
                className="mx-auto text-[#B0988C]"
              />

              <p className="mt-3 text-sm text-[#8B6B5B]">
                Best sellers will appear
                after orders contain product
                items.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {bestSellers.map(
              (product, index) => {
                const percentage =
                  (product.quantity /
                    highestProductQuantity) *
                  100;

                return (
                  <div
                    key={product.key}
                    className="rounded-2xl border border-[#EFE5DE] p-5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#5A2D2D] font-serif text-lg text-white">
                        {index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="font-semibold text-[#5A2D2D]">
                              {product.name}
                            </h3>

                            <p className="mt-1 text-xs text-[#92796D]">
                              {formatCurrency(
                                product.revenue
                              )}{" "}
                              recorded revenue
                            </p>
                          </div>

                          <p className="shrink-0 font-serif text-xl text-[#5A2D2D]">
                            {product.quantity.toLocaleString(
                              "en-IN"
                            )}{" "}
                            sold
                          </p>
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#F0E7E1]">
                          <div
                            style={{
                              width: `${percentage}%`,
                            }}
                            className="h-full rounded-full bg-[#8B5D50]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-[0_15px_45px_rgba(75,46,46,0.05)] sm:p-8">
        <div>
          <h2 className="font-serif text-3xl text-[#5A2D2D]">
            Recent Orders
          </h2>

          <p className="mt-2 text-sm text-[#8B6B5B]">
            The five most recent orders
            recorded in Supabase.
          </p>
        </div>

        {recentOrders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-[#DCCEC4] bg-[#FCFAF8] px-6 py-14 text-center text-sm text-[#8B6B5B]">
            No recent orders available.
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-2xl border border-[#EFE5DE]">
            <table className="min-w-full">
              <thead className="bg-[#F8F4EF]">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8B6B5B]">
                  <th className="px-5 py-4">
                    Order
                  </th>

                  <th className="px-5 py-4">
                    Customer
                  </th>

                  <th className="px-5 py-4">
                    Date
                  </th>

                  <th className="px-5 py-4">
                    Status
                  </th>

                  <th className="px-5 py-4 text-right">
                    Total
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentOrders.map(
                  (order) => {
                    const status =
                      formatStatus(
                        order.status?.trim() ||
                          "Pending"
                      );

                    return (
                      <tr
                        key={order.id}
                        className="border-t border-[#EFE5DE]"
                      >
                        <td className="px-5 py-4 font-mono text-xs text-[#5A2D2D]">
                          #
                          {order.id
                            .slice(0, 8)
                            .toUpperCase()}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-medium text-[#5A2D2D]">
                            {order.customer_name ||
                              "Customer"}
                          </p>

                          <p className="mt-1 text-xs text-[#92796D]">
                            {order.email ||
                              "No email"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-sm text-[#6F5B52]">
                          {formatOrderDate(
                            order.created_at
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-[#5A2D2D]">
                          {formatCurrency(
                            toNumber(
                              order.total
                            )
                          )}
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}