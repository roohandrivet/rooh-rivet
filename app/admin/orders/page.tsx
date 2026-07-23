"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  payment_method: string;
  total: number;
  status: string;
  items: unknown[];
  created_at: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      setError(error.message);
      setOrders([]);
    } else {
      setOrders((data as Order[]) ?? []);
    }

    setLoading(false);
  }

  const filteredOrders = useMemo(() => {
    const term = search.toLowerCase();

    return orders.filter((order) => {
      return (
        order.customer_name
          ?.toLowerCase()
          .includes(term) ||
        order.email?.toLowerCase().includes(term) ||
        order.phone?.toLowerCase().includes(term) ||
        order.status?.toLowerCase().includes(term)
      );
    });
  }, [orders, search]);

  async function updateStatus(
    id: string,
    status: string
  ) {
    await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);

    setOrders((prev) =>
      prev.map((order) =>
        order.id === id
          ? { ...order, status }
          : order
      )
    );
  }

  async function deleteOrder(id: string) {
    if (
      !window.confirm(
        "Delete this order permanently?"
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (!error) {
      setOrders((prev) =>
        prev.filter((order) => order.id !== id)
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <h1 className="font-serif text-5xl text-[#4B2E2E]">
            Orders
          </h1>

          <p className="mt-2 text-[#8B6B5B]">
            Manage customer orders.
          </p>
        </div>

        <div className="mb-8 rounded-2xl bg-white p-5 shadow">
          <input
            type="text"
            placeholder="Search customer, email, phone or status..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="w-full rounded-xl border p-4 outline-none"
          />
        </div>
                {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow">
            <p className="text-lg text-[#8B6B5B]">
              Loading orders...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-red-50 p-8 text-center shadow">
            <p className="font-semibold text-red-600">
              {error}
            </p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow">
            <p className="text-lg text-[#8B6B5B]">
              No orders found.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-white shadow">
            <table className="min-w-full">
              <thead className="bg-[#F8F4EF]">
                <tr className="text-left text-sm uppercase tracking-wide text-[#4B2E2E]">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Shipping</th>
                  <th className="px-6 py-4">Payment</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-t border-stone-200 align-top"
                  >
                    <td className="px-6 py-5">
                      <p className="font-semibold text-[#4B2E2E]">
                        {order.customer_name}
                      </p>

                      <p className="mt-1 text-xs text-stone-500">
                        #{order.id.slice(0, 8)}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p>{order.email}</p>
                      <p className="mt-1 text-sm text-stone-500">
                        {order.phone}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm leading-6">
                      <p>{order.address}</p>
                      <p>
                        {order.city}, {order.state}
                      </p>
                      <p>
                        {order.postal_code}
                      </p>
                      <p>{order.country}</p>
                    </td>

                    <td className="px-6 py-5">
                      {order.payment_method}
                    </td>

                    <td className="px-6 py-5 font-semibold text-[#4B2E2E]">
                      ₹{order.total.toLocaleString("en-IN")}
                    </td>
                                        <td className="px-6 py-5">
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateStatus(
                            order.id,
                            e.target.value
                          )
                        }
                        className="rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none"
                      >
                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Processing">
                          Processing
                        </option>

                        <option value="Shipped">
                          Shipped
                        </option>

                        <option value="Delivered">
                          Delivered
                        </option>

                        <option value="Cancelled">
                          Cancelled
                        </option>
                      </select>
                    </td>

                    <td className="px-6 py-5 text-sm text-stone-500">
                      {new Date(
                        order.created_at
                      ).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}

                      <p className="mt-1">
                        {new Date(
                          order.created_at
                        ).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <button
                        type="button"
                        onClick={() =>
                          deleteOrder(order.id)
                        }
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
                  )}

      </div>
    </main>
  );
}