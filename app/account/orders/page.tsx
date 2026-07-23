"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  Package,
  Clock3,
  Truck,
  CheckCircle2,
  XCircle,
  ShoppingBag,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useCurrency } from "@/context/CurrencyContext";

type OrderItem = {
  id: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  total: number;
  status: string;
  created_at: string;
  payment_method: string;
  items: OrderItem[];
};

export default function AccountOrdersPage() {
  const router = useRouter();

  const {
    formatPrice,
  } = useCurrency();

  const [loading, setLoading] =
    useState(true);

  const [orders, setOrders] =
    useState<Order[]>([]);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const { data, error } =
      await supabase
        .from("orders")
        .select("*")
        .eq("email", user.email)
        .order("created_at", {
          ascending: false,
        });

    if (!error && data) {
      setOrders(data as Order[]);
    }

    setLoading(false);
  }

  const totalSpent = useMemo(
    () =>
      orders.reduce(
        (sum, order) =>
          sum + Number(order.total),
        0
      ),
    [orders]
  );

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status !== "Delivered" &&
          order.status !== "Cancelled"
      ).length,
    [orders]
  );

  function renderStatus(
    status: string
  ) {
    switch (status) {
      case "Delivered":
        return {
          icon: CheckCircle2,
          className:
            "bg-green-100 text-green-700",
        };

      case "Processing":
        return {
          icon: Clock3,
          className:
            "bg-yellow-100 text-yellow-700",
        };

      case "Shipped":
        return {
          icon: Truck,
          className:
            "bg-blue-100 text-blue-700",
        };

      case "Cancelled":
        return {
          icon: XCircle,
          className:
            "bg-red-100 text-red-700",
        };

      default:
        return {
          icon: Package,
          className:
            "bg-stone-100 text-stone-700",
        };
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF]">
        <p className="text-lg text-[#8B6B5B]">
          Loading your orders...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <Link
          href="/account"
          className="mb-10 inline-flex items-center gap-2 text-[#5A2D2D] transition hover:underline"
        >
          <ArrowLeft size={18} />
          Back to My Account
        </Link>

        <h1 className="font-serif text-5xl text-[#4B2E2E]">
          My Orders
        </h1>

        <p className="mt-3 text-[#8B6B5B]">
          Track your purchases,
          shipping updates and
          complete order history.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <ShoppingBag className="mb-5 text-[#5A2D2D]" />

            <p className="text-sm uppercase tracking-[4px] text-[#8B6B5B]">
              Total Orders
            </p>

            <h2 className="mt-3 font-serif text-4xl text-[#4B2E2E]">
              {orders.length}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <Clock3 className="mb-5 text-[#5A2D2D]" />

            <p className="text-sm uppercase tracking-[4px] text-[#8B6B5B]">
              Active Orders
            </p>

            <h2 className="mt-3 font-serif text-4xl text-[#4B2E2E]">
              {activeOrders}
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-sm">
            <Package className="mb-5 text-[#5A2D2D]" />

            <p className="text-sm uppercase tracking-[4px] text-[#8B6B5B]">
              Total Spent
            </p>

            <h2 className="mt-3 font-serif text-4xl text-[#4B2E2E]">
              {formatPrice(totalSpent)}
            </h2>
          </div>
        </div>
        <div className="mt-12 space-y-6">
          {orders.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
              <Package className="mx-auto mb-6 h-16 w-16 text-[#8B6B5B]" />

              <h2 className="font-serif text-3xl text-[#4B2E2E]">
                No Orders Yet
              </h2>

              <p className="mt-4 text-[#8B6B5B]">
                Your handcrafted jewellery journey begins with your first purchase.
              </p>

              <Link
                href="/shop"
                className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#5A2D2D] px-8 py-4 font-semibold text-white transition hover:bg-[#472323]"
              >
                Explore Collection
                <ChevronRight size={20} />
              </Link>
            </div>
          ) : (
            orders.map((order) => {
              const status = renderStatus(order.status);

              const StatusIcon = status.icon;

              return (
                <Link
                  key={order.id}
                  href={`/account/orders/${order.id}`}
                  className="group block rounded-3xl bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="font-serif text-2xl text-[#4B2E2E]">
                        Order #
                        {order.id
                          .slice(0, 8)
                          .toUpperCase()}
                      </h2>

                      <p className="mt-2 text-[#8B6B5B]">
                        {new Date(
                          order.created_at
                        ).toLocaleDateString(
                          "en-IN",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          }
                        )}
                      </p>

                      <p className="mt-2 text-sm text-[#8B6B5B]">
                        Payment Method: {order.payment_method}
                      </p>
                    </div>

                    <div className="flex flex-col items-start gap-4 lg:items-end">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${status.className}`}
                      >
                        <StatusIcon size={16} />

                        {order.status}
                      </span>

                      <p className="text-3xl font-bold text-[#4B2E2E]">
                        ₹
                        {Number(order.total).toLocaleString(
                          "en-IN"
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 grid gap-6 border-t border-[#ECE3DA] pt-6 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[4px] text-[#8B6B5B]">
                        Items
                      </p>

                      <p className="mt-2 text-lg font-semibold text-[#4B2E2E]">
                        {order.items?.length ?? 0} Item
                        {(order.items?.length ?? 0) !== 1
                          ? "s"
                          : ""}
                      </p>

                      <div className="mt-5 space-y-3">
                        {order.items
                          ?.slice(0, 3)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-xl bg-[#F8F4EF] px-4 py-3"
                            >
                              <div>
                                <p className="font-medium text-[#4B2E2E]">
                                  {item.name}
                                </p>

                                <p className="text-sm text-[#8B6B5B]">
                                  Qty: {item.quantity}
                                </p>
                              </div>

                              <p className="font-semibold text-[#4B2E2E]">
                                ₹
                                {Number(
                                  item.price * item.quantity
                                ).toLocaleString(
                                  "en-IN"
                                )}
                              </p>
                            </div>
                          ))}

                        {(order.items?.length ?? 0) > 3 && (
                          <p className="text-sm text-[#8B6B5B]">
                            +
                            {(order.items?.length ?? 0) - 3} more item
                            {(order.items?.length ?? 0) - 3 > 1
                              ? "s"
                              : ""}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[4px] text-[#8B6B5B]">
                          Order Progress
                        </p>

                        <p className="mt-2 leading-7 text-[#7A6464]">
                          Track the latest status of your handcrafted
                          jewellery from preparation through delivery.
                        </p>
                      </div>

                      <div className="mt-8 flex items-center justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[4px] text-[#8B6B5B]">
                            Total
                          </p>

                          <p className="mt-2 text-3xl font-bold text-[#4B2E2E]">
                            ₹
                            {Number(
                              order.total
                            ).toLocaleString("en-IN")}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 font-medium text-[#5A2D2D] transition-all group-hover:gap-3">
                          View Details

                          <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}