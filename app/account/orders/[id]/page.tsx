"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type OrderItem = {
  id: string;
  order_id: string;
  name: string;
  image: string | null;
  quantity: number;
  price: number;
};

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
  created_at: string;
  items: OrderItem[];
};

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const orderId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [loading, setLoading] =
    useState(true);

  const [order, setOrder] =
    useState<Order | null>(null);

  const [
    alreadyReviewed,
    setAlreadyReviewed,
  ] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const {
        data: orderData,
        error: orderError,
      } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("email", user.email)
        .single();

      if (orderError || !orderData) {
        setOrder(null);
        return;
      }

      const {
        data: itemsData,
      } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderData.id);

      const {
        data: reviewData,
      } = await supabase
        .from("reviews")
        .select("id")
        .eq("order_id", orderData.id)
        .maybeSingle();

      setAlreadyReviewed(
        !!reviewData
      );

      setOrder({
        ...(orderData as Order),
        items:
          (itemsData ??
            []) as OrderItem[],
      });
    } catch (error) {
      console.error(
        "Failed to load order:",
        error
      );

      setOrder(null);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(
    date: string
  ) {
    return new Date(
      date
    ).toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  function formatCurrency(
    value: number
  ) {
    return value.toLocaleString(
      "en-IN"
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF]">
        <p className="text-lg text-[#8B6B5B]">
          Loading order...
        </p>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF]">
        <div className="text-center">
          <p className="text-lg text-[#8B6B5B]">
            Order not found.
          </p>

          <Link
            href="/account/orders"
            className="mt-6 inline-flex items-center gap-2 text-[#5A2D2D] hover:underline"
          >
            <ArrowLeft size={18} />
            Back to Orders
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] py-16">
      <div className="mx-auto max-w-6xl px-6">
        <Link
          href="/account/orders"
          className="mb-10 inline-flex items-center gap-2 text-[#5A2D2D] hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Orders
        </Link>

        <h1 className="font-serif text-5xl text-[#4B2E2E]">
          Order Details
        </h1>

        <p className="mt-3 text-[#8B6B5B]">
          Order #{order.id.slice(0, 8)}
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
          <section className="rounded-3xl bg-white p-8 shadow">
              <h2 className="font-serif text-3xl text-[#4B2E2E]">
                Order Summary
              </h2>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm uppercase tracking-wide text-[#8B6B5B]">
                    Order Date
                  </p>

                  <p className="mt-2 text-lg font-medium text-[#4B2E2E]">
                    {formatDate(order.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wide text-[#8B6B5B]">
                    Payment Method
                  </p>

                  <p className="mt-2 text-lg font-medium capitalize text-[#4B2E2E]">
                    {order.payment_method}
                  </p>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wide text-[#8B6B5B]">
                    Status
                  </p>

                  <span
                    className={`mt-3 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${
                      order.status.toLowerCase() ===
                      "delivered"
                        ? "bg-green-100 text-green-700"
                        : order.status.toLowerCase() ===
                          "processing"
                        ? "bg-yellow-100 text-yellow-700"
                        : order.status.toLowerCase() ===
                          "shipped"
                        ? "bg-blue-100 text-blue-700"
                        : order.status.toLowerCase() ===
                          "cancelled"
                        ? "bg-red-100 text-red-700"
                        : "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </div>

                <div>
                  <p className="text-sm uppercase tracking-wide text-[#8B6B5B]">
                    Total Amount
                  </p>

                  <p className="mt-2 text-2xl font-bold text-[#4B2E2E]">
                    ₹{formatCurrency(order.total)}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-8 shadow">
              <h2 className="font-serif text-3xl text-[#4B2E2E]">
                Items Purchased
              </h2>

              {order.items.length === 0 ? (
                <p className="mt-8 text-[#8B6B5B]">
                  No items found for this order.
                </p>
              ) : (
                <div className="mt-8 space-y-6">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-5 border-b border-stone-200 pb-6 last:border-none last:pb-0 sm:flex-row sm:items-center"
                    >
                      <div className="relative h-24 w-24 overflow-hidden rounded-2xl bg-[#F8F4EF]">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[#8B6B5B]">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[#4B2E2E]">
                          {item.name}
                        </h3>

                        <p className="mt-2 text-[#8B6B5B]">
                          Quantity: {item.quantity}
                        </p>

                        <p className="mt-1 text-sm text-[#8B6B5B]">
                          Price per item: ₹
                          {formatCurrency(item.price)}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <p className="text-sm text-[#8B6B5B]">
                          Subtotal
                        </p>

                        <p className="text-xl font-bold text-[#4B2E2E]">
                          ₹
                          {formatCurrency(
                            item.price *
                              item.quantity
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-8">
          <section className="rounded-3xl bg-white p-8 shadow">
              <h2 className="font-serif text-3xl text-[#4B2E2E]">
                Shipping Address
              </h2>

              <div className="mt-8 space-y-3 text-[#4B2E2E]">
                <p className="font-semibold">
                  {order.customer_name}
                </p>

                <p>{order.address}</p>

                <p>
                  {order.city}, {order.state}
                </p>

                <p>{order.postal_code}</p>

                <p>{order.country}</p>

                <div className="pt-4">
                  <p>{order.phone}</p>
                  <p>{order.email}</p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-8 shadow">
              <h2 className="font-serif text-3xl text-[#4B2E2E]">
                Order Timeline
              </h2>

              <div className="mt-8 space-y-7">
                <div className="flex items-start gap-4">
                  <div className="mt-2 h-3 w-3 rounded-full bg-[#5A2D2D]" />

                  <div>
                    <p className="font-semibold text-[#4B2E2E]">
                      Order Placed
                    </p>

                    <p className="mt-1 text-sm text-[#8B6B5B]">
                      {new Date(
                        order.created_at
                      ).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className={`mt-2 h-3 w-3 rounded-full ${
                      ["Processing", "Shipped", "Delivered"].includes(
                        order.status
                      )
                        ? "bg-[#5A2D2D]"
                        : "bg-stone-300"
                    }`}
                  />

                  <div>
                    <p className="font-semibold text-[#4B2E2E]">
                      Processing
                    </p>

                    <p className="mt-1 text-sm text-[#8B6B5B]">
                      Your jewellery is being carefully prepared.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className={`mt-2 h-3 w-3 rounded-full ${
                      ["Shipped", "Delivered"].includes(order.status)
                        ? "bg-[#5A2D2D]"
                        : "bg-stone-300"
                    }`}
                  />

                  <div>
                    <p className="font-semibold text-[#4B2E2E]">
                      Shipped
                    </p>

                    <p className="mt-1 text-sm text-[#8B6B5B]">
                      Your order is on its way.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div
                    className={`mt-2 h-3 w-3 rounded-full ${
                      order.status === "Delivered"
                        ? "bg-[#5A2D2D]"
                        : "bg-stone-300"
                    }`}
                  />

                  <div>
                    <p className="font-semibold text-[#4B2E2E]">
                      Delivered
                    </p>

                    <p className="mt-1 text-sm text-[#8B6B5B]">
                      Your Rooh & Rivet jewellery has arrived.
                    </p>
                  </div>
                </div>

                {order.status === "Cancelled" && (
                  <div className="flex items-start gap-4">
                    <div className="mt-2 h-3 w-3 rounded-full bg-red-500" />

                    <div>
                      <p className="font-semibold text-red-700">
                        Cancelled
                      </p>

                      <p className="mt-1 text-sm text-[#8B6B5B]">
                        This order has been cancelled.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl bg-white p-8 shadow">
              <div className="flex items-center gap-3">
                <Star
                  size={28}
                  className="fill-yellow-400 text-yellow-400"
                />

                <div>
                  <h2 className="font-serif text-2xl text-[#4B2E2E]">
                    Verified Purchase Review
                  </h2>

                  <p className="mt-1 text-sm text-[#8B6B5B]">
                    Share your experience after receiving your jewellery.
                  </p>
                </div>
              </div>

              {order.status === "Delivered" ? (
                alreadyReviewed ? (
                  <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5">
                    <p className="font-semibold text-green-700">
                      ✓ Thank you for your review.
                    </p>

                    <p className="mt-2 text-sm text-green-700">
                      Your verified purchase review has already been submitted.
                    </p>
                  </div>
                ) : (
                  <Link
                    href={`/account/orders/${order.id}/review`}
                    className="mt-8 inline-flex rounded-full bg-[#5A2D2D] px-8 py-4 font-medium text-white transition hover:bg-[#472323]"
                  >
                    Leave a Review
                  </Link>
                )
              ) : (
                <div className="mt-8 rounded-2xl border border-[#E8DDD3] bg-[#F8F4EF] p-5">
                  <p className="text-[#7A6464]">
                    Reviews become available once your order has been delivered.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}