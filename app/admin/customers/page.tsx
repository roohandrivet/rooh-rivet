"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type OrderRow = {
  id: string | number;
  created_at: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string |null;
  total: number | string | null;
};

type Customer = {
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  latestOrderDate: string | null;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError("");

      try {
        const { data, error } = await supabase
          .from("orders")
          .select(
            "id, created_at, customer_name, customer_email, customer_phone, total"
          )
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        const grouped = new Map<string, Customer>();

        (data as OrderRow[]).forEach((order) => {
          const email = (order.customer_email ?? "").trim();

          if (!email) return;

          const existing = grouped.get(email);

          const amount =
            typeof order.total === "number"
              ? order.total
              : Number(order.total ?? 0);

          if (!existing) {
            grouped.set(email, {
              name: order.customer_name ?? "Unknown",
              email,
              phone: order.customer_phone ?? "",
              totalOrders: 1,
              totalSpent: isNaN(amount) ? 0 : amount,
              latestOrderDate: order.created_at,
            });
          } else {
            existing.totalOrders += 1;
            existing.totalSpent += isNaN(amount) ? 0 : amount;

            if (
              order.created_at &&
              (!existing.latestOrderDate ||
                new Date(order.created_at) >
                  new Date(existing.latestOrderDate))
            ) {
              existing.latestOrderDate = order.created_at;
            }

            if (!existing.phone && order.customer_phone) {
              existing.phone = order.customer_phone;
            }

            if (
              existing.name === "Unknown" &&
              order.customer_name &&
              order.customer_name.trim() !== ""
            ) {
              existing.name = order.customer_name;
            }
          }
        });

        setCustomers(
          Array.from(grouped.values()).sort(
            (a, b) => b.totalSpent - a.totalSpent
          )
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load customers.";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase();

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query)
      );
    });
  }, [customers, search]);

  return (
    <div className="min-h-screen bg-[#F8F4EF] p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#4B2E2E]">
              Customers
            </h1>
            <p className="mt-1 text-[#7A6464]">
              View customer activity and spending.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[#E8DED2] bg-white px-4 py-3 outline-none transition focus:border-[#5A2D2D] md:w-80"
          />
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-[#7A6464]">Loading customers...</p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600">
              {error}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg font-medium text-[#4B2E2E]">
                No customers found.
              </p>
              <p className="mt-2 text-[#7A6464]">
                Customer records will appear after orders are placed.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-[#EFE7DD] text-left">
                    <th className="px-4 py-4 text-sm font-semibold text-[#4B2E2E]">
                      Customer
                    </th>
                    <th className="px-4 py-4 text-sm font-semibold text-[#4B2E2E]">
                      Email
                    </th>
                    <th className="px-4 py-4 text-sm font-semibold text-[#4B2E2E]">
                      Phone
                    </th>
                    <th className="px-4 py-4 text-sm font-semibold text-[#4B2E2E]">
                      Orders
                    </th>
                    <th className="px-4 py-4 text-sm font-semibold text-[#4B2E2E]">
                      Total Spent
                    </th>
                    <th className="px-4 py-4 text-sm font-semibold text-[#4B2E2E]">
                      Latest Order
                    </th>
                    <th className="px-4 py-4 text-sm font-semibold text-[#4B2E2E]">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr
                      key={customer.email}
                      className="border-b border-[#F2ECE4] hover:bg-[#FCFAF8]"
                    >
                      <td className="px-4 py-5 font-medium text-[#4B2E2E]">
                        {customer.name}
                      </td>

                      <td className="px-4 py-5 text-[#7A6464]">
                        {customer.email}
                      </td>

                      <td className="px-4 py-5 text-[#7A6464]">
                        {customer.phone || "-"}
                      </td>

                      <td className="px-4 py-5 text-[#4B2E2E]">
                        {customer.totalOrders}
                      </td>

                      <td className="px-4 py-5 font-semibold text-[#4B2E2E]">
                        ₹{customer.totalSpent.toFixed(2)}
                      </td>

                      <td className="px-4 py-5 text-[#7A6464]">
                        {customer.latestOrderDate
                          ? new Date(
                              customer.latestOrderDate
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="px-4 py-5">
                        <button className="rounded-xl bg-[#5A2D2D] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}