"use client";

import { useEffect, useState } from "react";
import {
  Package,
  ShoppingBag,
  Users,
  IndianRupee,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Stat = {
  title: string;
  value: string;
  icon: typeof Package;
  color: string;
};

export default function AdminStats() {
  const [stats, setStats] = useState<Stat[]>([
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
  ]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);

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
            "id, total, customer_email"
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
        ordersResponse.data ?? [];

      const ordersCount =
        orders.length;

      const customersCount =
        new Set(
          orders.map(
            (order) =>
              order.customer_email
          )
        ).size;

      const revenue =
        orders.reduce(
          (
            total,
            order
          ) =>
            total +
            Number(order.total || 0),
          0
        );

      setStats([
        {
          title: "Products",
          value: productsCount.toString(),
          icon: Package,
          color: "bg-[#F6ECE5]",
        },
        {
          title: "Orders",
          value: ordersCount.toString(),
          icon: ShoppingBag,
          color: "bg-[#F7F0EA]",
        },
        {
          title: "Customers",
          value: customersCount.toString(),
          icon: Users,
          color: "bg-[#F6ECE5]",
        },
        {
          title: "Revenue",
          value: `₹${revenue.toLocaleString("en-IN")}`,
          icon: IndianRupee,
          color: "bg-[#F7F0EA]",
        },
      ]);
    } catch (error) {
      console.error(
        "Failed to load admin stats:",
        error
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.title}
            className="rounded-3xl border border-[#E8DDD3] bg-white p-7 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#8B6B5B]">
                  {stat.title}
                </p>

                <h2 className="mt-2 font-serif text-4xl text-[#5A2D2D]">
                  {loading ? "..." : stat.value}
                </h2>
              </div>

              <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl ${stat.color}`}
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
  );
}