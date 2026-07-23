"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  created_at: string;
};

export default function AdminRecentOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          customer_name,
          customer_email,
          total,
          status,
          created_at
          `
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(5);

      if (error) {
        throw error;
      }

      setOrders(data ?? []);
    } catch (error) {
      console.error(
        "Failed to load recent orders:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 rounded-3xl border border-[#E8DDD3] bg-white p-8 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl text-[#5A2D2D]">
            Recent Orders
          </h2>

          <p className="mt-2 text-sm text-[#8B6B5B]">
            Latest customer purchases
          </p>
        </div>

        <Link
          href="/admin/orders"
          className="rounded-full bg-[#5A2D2D] px-5 py-2 text-sm text-white transition hover:bg-[#472323]"
        >
          View All
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto">
        {loading ? (
          <p className="text-[#8B6B5B]">
            Loading orders...
          </p>
        ) : orders.length === 0 ? (
          <p className="text-[#8B6B5B]">
            No orders found.
          </p>
        ) : (
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E8DDD3] text-left text-sm text-[#8B6B5B]">
                <th className="pb-4">
                  Customer
                </th>

                <th className="pb-4">
                  Email
                </th>

                <th className="pb-4">
                  Total
                </th>

                <th className="pb-4">
                  Status
                </th>

                <th className="pb-4">
                  Date
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-[#F1E8DF]"
                >
                  <td className="py-5 text-[#5A2D2D]">
                    {order.customer_name}
                  </td>

                  <td className="py-5 text-sm text-[#7A6464]">
                    {order.customer_email}
                  </td>

                  <td className="py-5 text-[#5A2D2D]">
                    ₹
                    {Number(order.total).toLocaleString(
                      "en-IN"
                    )}
                  </td>

                  <td className="py-5">
                    <span className="rounded-full bg-[#F6ECE5] px-4 py-1 text-sm text-[#5A2D2D]">
                      {order.status}
                    </span>
                  </td>

                  <td className="py-5 text-sm text-[#7A6464]">
                    {new Date(
                      order.created_at
                    ).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}