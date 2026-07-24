"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ComponentType,
} from "react";
import {
  AlertCircle,
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type OrderRow = {
  id: string;
  total: number | string | null;
  email: string | null;
};

type Stat = {
  title: string;
  value: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
  }>;
  color: string;
};

const INITIAL_STATS: Stat[] = [
  {
    title: "Products",
    value: "0",
    icon: Package,
    color: "bg-[#F6ECE5]",
  },
  {
    title: "Orders",
    value: "0",
    icon: ShoppingBag,
    color: "bg-[#F7F0EA]",
  },
  {
    title: "Customers",
    value: "0",
    icon: Users,
    color: "bg-[#F6ECE5]",
  },
  {
    title: "Revenue",
    value: "₹0",
    icon: IndianRupee,
    color: "bg-[#F7F0EA]",
  },
];

function toNumber(
  value: number | string | null
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

function getErrorMessage(
  error: unknown
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load dashboard statistics.";
}

export default function AdminStats() {
  const [stats, setStats] =
    useState<Stat[]>(INITIAL_STATS);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadStats = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const [
          productsResponse,
          ordersResponse,
        ] = await Promise.all([
          supabase
            .from("products")
            .select("id", {
              count: "exact",
              head: true,
            }),

          supabase
            .from("orders")
            .select(
              `
                id,
                total,
                email
              `
            ),
        ]);

        if (productsResponse.error) {
          throw productsResponse.error;
        }

        if (ordersResponse.error) {
          throw ordersResponse.error;
        }

        const productsCount =
          productsResponse.count ?? 0;

        const orders =
          (ordersResponse.data ??
            []) as OrderRow[];

        const customerEmails =
          new Set<string>();

        let revenue = 0;

        orders.forEach((order) => {
          revenue += toNumber(
            order.total
          );

          const email = order.email
            ?.trim()
            .toLowerCase();

          if (email) {
            customerEmails.add(email);
          }
        });

        setStats([
          {
            title: "Products",
            value:
              productsCount.toLocaleString(
                "en-IN"
              ),
            icon: Package,
            color: "bg-[#F6ECE5]",
          },
          {
            title: "Orders",
            value:
              orders.length.toLocaleString(
                "en-IN"
              ),
            icon: ShoppingBag,
            color: "bg-[#F7F0EA]",
          },
          {
            title: "Customers",
            value:
              customerEmails.size.toLocaleString(
                "en-IN"
              ),
            icon: Users,
            color: "bg-[#F6ECE5]",
          },
          {
            title: "Revenue",
            value:
              formatCurrency(revenue),
            icon: IndianRupee,
            color: "bg-[#F7F0EA]",
          },
        ]);
      } catch (loadError) {
        console.error(
          "Failed to load admin stats:",
          loadError
        );

        setStats(INITIAL_STATS);
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
    void loadStats();
  }, [loadStats]);

  return (
    <div className="space-y-5">
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          <AlertCircle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <div>
            <p className="font-semibold">
              Unable to load dashboard
              statistics
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

          return (
            <div
              key={stat.title}
              className="rounded-3xl border border-[#E8DDD3] bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-5">
                <div className="min-w-0">
                  <p className="text-sm text-[#8B6B5B]">
                    {stat.title}
                  </p>

                  <h2 className="mt-2 break-words font-serif text-4xl text-[#5A2D2D]">
                    {loading
                      ? "..."
                      : stat.value}
                  </h2>
                </div>

                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${stat.color}`}
                >
                  <Icon
                    size={30}
                    className="text-[#5A2D2D]"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}