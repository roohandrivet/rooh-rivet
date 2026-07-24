"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ExternalLink,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  customer_name: string | null;
  email: string | null;
  total: number | string | null;
  status: string | null;
  created_at: string | null;
};

function toNumber(
  value: number | string | null
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function formatCurrency(
  value: number | string | null
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(toNumber(value));
}

function formatDate(
  value: string | null
): string {
  if (!value) {
    return "Unknown date";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

function formatStatus(
  value: string | null
): string {
  const status =
    value?.trim() || "Pending";

  return status
    .replace(/_/g, " ")
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

  return "bg-[#F6ECE5] text-[#5A2D2D]";
}

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load recent orders.";
}

export default function AdminRecentOrders() {
  const [orders, setOrders] =
    useState<Order[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadOrders = useCallback(
    async () => {
      setLoading(true);
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
              created_at
            `
          )
          .order("created_at", {
            ascending: false,
          })
          .limit(5);

        if (ordersError) {
          throw ordersError;
        }

        setOrders(
          (data ?? []) as Order[]
        );
      } catch (loadError) {
        console.error(
          "Failed to load recent orders:",
          loadError
        );

        setOrders([]);
        setError(
          getErrorMessage(loadError)
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  return (
    <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl text-[#5A2D2D]">
            Recent Orders
          </h2>

          <p className="mt-2 text-sm text-[#8B6B5B]">
            Latest customer purchases from
            Supabase.
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5A2D2D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#472323]"
        >
          View All
          <ExternalLink size={15} />
        </Link>
      </div>

      {error ? (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Unable to load recent orders
            </p>

            <p className="mt-1">
              {error}
            </p>
          </div>
        </div>
      ) : null}

      <div className="mt-8 overflow-x-auto">
        {loading ? (
          <div className="space-y-4">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <div
                key={index}
                className="h-16 animate-pulse rounded-2xl bg-[#F8F4EF]"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DCCEC4] bg-[#FCFAF8] px-6 py-14 text-center">
            <p className="text-[#8B6B5B]">
              No orders found.
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="border-b border-[#E8DDD3] text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8B6B5B]">
                <th className="pb-4 pr-6">
                  Order
                </th>

                <th className="pb-4 pr-6">
                  Customer
                </th>

                <th className="pb-4 pr-6">
                  Email
                </th>

                <th className="pb-4 pr-6">
                  Total
                </th>

                <th className="pb-4 pr-6">
                  Status
                </th>

                <th className="pb-4">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => {
                const status =
                  formatStatus(
                    order.status
                  );

                return (
                  <tr
                    key={order.id}
                    className="border-b border-[#F1E8DF] last:border-b-0"
                  >
                    <td className="py-5 pr-6">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs font-semibold text-[#5A2D2D] transition hover:underline"
                      >
                        #
                        {order.id
                          .slice(0, 8)
                          .toUpperCase()}
                      </Link>
                    </td>

                    <td className="py-5 pr-6 font-medium text-[#5A2D2D]">
                      {order.customer_name ||
                        "Customer"}
                    </td>

                    <td className="py-5 pr-6 text-sm text-[#7A6464]">
                      {order.email ||
                        "No email"}
                    </td>

                    <td className="py-5 pr-6 font-semibold text-[#5A2D2D]">
                      {formatCurrency(
                        order.total
                      )}
                    </td>

                    <td className="py-5 pr-6">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </td>

                    <td className="py-5 text-sm text-[#7A6464]">
                      {formatDate(
                        order.created_at
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}