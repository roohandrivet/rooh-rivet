"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";

type CheckoutForm = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentMethod: string;
};

type CheckoutItem = {
  id: string;
  slug: string;
  name: string;
  quantity: number;
  price: number;
};

type CheckoutRequest = {
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
  items: CheckoutItem[];
};

const INITIAL_FORM: CheckoutForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  paymentMethod: "Credit / Debit Card",
};

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    subtotal,
    clearCart,
  } = useCart();

  const {
    formatPrice,
  } = useCurrency();

  const [loading, setLoading] =
    useState(false);

  const [form, setForm] =
    useState<CheckoutForm>(
      INITIAL_FORM
    );

  const shipping = 0;

  const total = useMemo(
    () => subtotal + shipping,
    [subtotal]
  );

  useEffect(() => {
    void loadCustomer();
  }, []);

  async function loadCustomer() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setForm((previous) => ({
      ...previous,
      fullName:
        user.user_metadata?.full_name ?? "",
      email:
        user.email ?? "",
      phone:
        user.user_metadata?.phone ?? "",
      address:
        user.user_metadata?.address ?? "",
      city:
        user.user_metadata?.city ?? "",
      state:
        user.user_metadata?.state ?? "",
      postalCode:
        user.user_metadata?.postal_code ?? "",
      country:
        user.user_metadata?.country ?? "",
    }));
  }

  function updateField(
    field: keyof CheckoutForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleCheckout(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.auth.updateUser({
          data: {
            full_name: form.fullName,
            phone: form.phone,
            address: form.address,
            city: form.city,
            state: form.state,
            postal_code: form.postalCode,
            country: form.country,
          },
        });
      }
      const payload: CheckoutRequest = {
        customer_name: form.fullName,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        postal_code: form.postalCode,
        country: form.country,
        payment_method: form.paymentMethod,
        total,
        items: cart.map((item) => ({
          id: item.id,
          slug: item.slug,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image,
        })),
      };

      const response = await fetch(
        "/api/checkout",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result =
        await response.json();

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.message ??
            "Failed to place your order."
        );
      }

      clearCart();

      router.push(
        `/order-success?id=${result.order.id}`
      );
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert(
          "Something went wrong while placing your order."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <Link
          href="/cart"
          className="mb-8 inline-flex items-center gap-2 text-[#5A2D2D] transition hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Cart
        </Link>

        <h1 className="mb-10 font-serif text-5xl text-[#4B2E2E]">
          Checkout
        </h1>

        <form
          onSubmit={handleCheckout}
          className="grid gap-10 lg:grid-cols-[2fr_1fr]"
        >
          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-8 font-serif text-3xl text-[#4B2E2E]">
              Shipping Information
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <input
                required
                placeholder="Full Name"
                value={form.fullName}
                onChange={(e) =>
                  updateField(
                    "fullName",
                    e.target.value
                  )
                }
                className="rounded-xl border p-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
              />

              <input
                required
                type="email"
                placeholder="Email Address"
                value={form.email}
                onChange={(e) =>
                  updateField(
                    "email",
                    e.target.value
                  )
                }
                className="rounded-xl border p-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
              />

              <input
                required
                type="tel"
                placeholder="Phone Number"
                value={form.phone}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value
                  )
                }
                className="rounded-xl border p-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] md:col-span-2"
              />

              <input
                required
                placeholder="Street Address"
                value={form.address}
                onChange={(e) =>
                  updateField(
                    "address",
                    e.target.value
                  )
                }
                className="rounded-xl border p-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] md:col-span-2"
              />

              <input
                required
                placeholder="City"
                value={form.city}
                onChange={(e) =>
                  updateField(
                    "city",
                    e.target.value
                  )
                }
                className="rounded-xl border p-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
              />

              <input
                required
                placeholder="State / Province"
                value={form.state}
                onChange={(e) =>
                  updateField(
                    "state",
                    e.target.value
                  )
                }
                className="rounded-xl border p-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
              />

              <input
                required
                placeholder="Postal / ZIP Code"
                value={form.postalCode}
                onChange={(e) =>
                  updateField(
                    "postalCode",
                    e.target.value
                  )
                }
                className="rounded-xl border p-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
              />

              <input
                required
                placeholder="Country"
                value={form.country}
                onChange={(e) =>
                  updateField(
                    "country",
                    e.target.value
                  )
                }
                className="rounded-xl border p-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
              />
            </div>
            <div className="mt-10">
              <h3 className="mb-5 font-serif text-2xl text-[#4B2E2E]">
                Payment Method
              </h3>

              <div className="space-y-4">
                <label className="flex cursor-pointer items-center gap-4 rounded-xl border p-5 transition hover:border-[#5A2D2D]">
                  <input
                    type="radio"
                    name="payment"
                    value="Credit / Debit Card"
                    checked={
                      form.paymentMethod ===
                      "Credit / Debit Card"
                    }
                    onChange={(e) =>
                      updateField(
                        "paymentMethod",
                        e.target.value
                      )
                    }
                  />

                  <div>
                    <p className="font-semibold text-[#4B2E2E]">
                      Credit / Debit Card
                    </p>

                    <p className="text-sm text-[#8B6B5B]">
                      Secure online payment.
                    </p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-4 rounded-xl border p-5 transition hover:border-[#5A2D2D]">
                  <input
                    type="radio"
                    name="payment"
                    value="Bank Transfer"
                    checked={
                      form.paymentMethod ===
                      "Bank Transfer"
                    }
                    onChange={(e) =>
                      updateField(
                        "paymentMethod",
                        e.target.value
                      )
                    }
                  />

                  <div>
                    <p className="font-semibold text-[#4B2E2E]">
                      Bank Transfer
                    </p>

                    <p className="text-sm text-[#8B6B5B]">
                      Bank instructions will be emailed
                      after ordering.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="mb-6 font-serif text-3xl text-[#4B2E2E]">
              Order Summary
            </h2>

            <div className="space-y-5">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-[#4B2E2E]"
                >
                  <span>
                    {item.name} × {item.quantity}
                  </span>

                  <span>
                    {formatPrice(
                      item.price *
                        item.quantity
                    )}
                  </span>
                </div>
              ))}

              <div className="border-t pt-5">
                <div className="mb-3 flex items-center justify-between text-[#8B6B5B]">
                  <span>
                    Subtotal
                  </span>

                  <span>
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="mb-3 flex items-center justify-between text-[#8B6B5B]">
                  <span>
                    Shipping
                  </span>

                  <span className="font-medium text-emerald-600">
                    Free
                  </span>
                </div>

                <div className="mb-3 flex items-center justify-between text-[#8B6B5B]">
                  <span>
                    Payment
                  </span>

                  <span>
                    {form.paymentMethod}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t pt-4 text-2xl font-bold text-[#4B2E2E]">
                  <span>
                    Total
                  </span>

                  <span>
                    {formatPrice(total)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  cart.length === 0
                }
                className="mt-8 w-full rounded-xl bg-[#5A2D2D] px-6 py-4 text-lg font-semibold text-white transition hover:bg-[#4B2E2E] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? "Placing Order..."
                  : "Place Order"}
              </button>

              <p className="mt-4 text-center text-sm text-[#8B6B5B]">
                By placing your order you agree to our Terms &
                Conditions and Privacy Policy.
              </p>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}