"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  CheckCircle2,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Order = {
  id: string;
  customer_name: string;
  email: string;
  status: string;
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();

  const orderId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [submitted, setSubmitted] =
    useState(false);

  const [order, setOrder] =
    useState<Order | null>(null);

  const [alreadyReviewed, setAlreadyReviewed] =
    useState(false);

  const [rating, setRating] =
    useState(5);

  const [title, setTitle] =
    useState("");

  const [review, setReview] =
    useState("");

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
        .select(`
          id,
          customer_name,
          email,
          status
        `)
        .eq("id", orderId)
        .eq("email", user.email)
        .single();

      if (orderError || !orderData) {
        router.replace("/account/orders");
        return;
      }

      if (
        orderData.status.toLowerCase() !==
        "delivered"
      ) {
        alert(
          "Reviews can only be submitted after your order has been delivered."
        );

        router.replace(
          `/account/orders/${orderId}`
        );

        return;
      }

      setOrder(orderData as Order);

      const {
        data: existingReview,
      } = await supabase
        .from("reviews")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle();

      if (existingReview) {
        setAlreadyReviewed(true);
      }
    } catch (error) {
      console.error(error);

      router.replace("/account/orders");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!order) return;

    if (!title.trim()) {
      alert("Please enter a review title.");
      return;
    }

    if (!review.trim()) {
      alert("Please write your review.");
      return;
    }

    setSaving(true);
    try {
        const {
          error,
        } = await supabase
          .from("reviews")
          .insert({
            order_id: order.id,
            customer_email:
              order.email,
            name: order.customer_name,
            title: title.trim(),
            rating,
            review:
              review.trim(),
            verified_purchase: true,
            approved: false,
            featured: false,
          });
  
        if (error) {
          alert(error.message);
          return;
        }
  
        setSubmitted(true);
      } finally {
        setSaving(false);
      }
    }
  
    if (loading) {
      return (
        <main className="min-h-screen bg-[#F8F4EF]">
          <div className="mx-auto flex max-w-3xl items-center justify-center px-6 py-32">
            <div className="rounded-3xl bg-white px-10 py-12 shadow-sm">
              <p className="text-lg text-[#7A6464]">
                Loading your order...
              </p>
            </div>
          </div>
        </main>
      );
    }
  
    if (alreadyReviewed) {
      return (
        <main className="min-h-screen bg-[#F8F4EF]">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <div className="rounded-[36px] bg-white p-12 text-center shadow-sm">
              <CheckCircle2
                className="mx-auto text-green-600"
                size={70}
              />
  
              <h1 className="mt-6 font-serif text-4xl text-[#4B2E2E]">
                Review Already Submitted
              </h1>
  
              <p className="mt-4 leading-8 text-[#7A6464]">
                Thank you for sharing
                your experience. Our
                team will review it
                before it appears
                publicly.
              </p>
  
              <Link
                href="/account/orders"
                className="mt-8 inline-flex rounded-full bg-[#5A2D2D] px-8 py-4 text-white transition hover:bg-[#472323]"
              >
                Back to Orders
              </Link>
            </div>
          </div>
        </main>
      );
    }
  
    if (submitted) {
      return (
        <main className="min-h-screen bg-[#F8F4EF]">
          <div className="mx-auto max-w-3xl px-6 py-20">
            <div className="rounded-[36px] bg-white p-12 text-center shadow-sm">
              <CheckCircle2
                className="mx-auto text-green-600"
                size={70}
              />
  
              <h1 className="mt-6 font-serif text-4xl text-[#4B2E2E]">
                Thank You
              </h1>
  
              <p className="mt-4 leading-8 text-[#7A6464]">
                Your verified purchase
                review has been
                submitted successfully.
                It will appear after
                approval.
              </p>
  
              <Link
                href="/account/orders"
                className="mt-8 inline-flex rounded-full bg-[#5A2D2D] px-8 py-4 text-white transition hover:bg-[#472323]"
              >
                Return to Orders
              </Link>
            </div>
          </div>
        </main>
      );
    }
  
    return (
      <main className="min-h-screen bg-[#F8F4EF]">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <Link
            href={`/account/orders/${orderId}`}
            className="inline-flex items-center gap-2 text-[#5A2D2D] hover:underline"
          >
            <ArrowLeft size={18} />
            Back to Order
          </Link>
  
          <div className="mt-8 rounded-[36px] bg-white p-10 shadow-sm">
            <p className="text-sm uppercase tracking-[0.35em] text-[#8B6B5B]">
              Verified Purchase
            </p>
  
            <h1 className="mt-4 font-serif text-5xl text-[#4B2E2E]">
              Share Your Experience
            </h1>
  
            <p className="mt-5 max-w-2xl leading-8 text-[#7A6464]">
              We'd love to hear
              about your Rooh &
              Rivet experience.
              Your review helps
              future customers
              shop with confidence.
            </p>
  
            <form
              onSubmit={
                handleSubmit
              }
              className="mt-10 space-y-8"
            >
                            <div>
              <label className="mb-3 block font-medium text-[#4B2E2E]">
                Overall Rating
              </label>

              <div className="flex gap-2">
                {Array.from({
                  length: 5,
                }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      setRating(index + 1)
                    }
                  >
                    <Star
                      size={34}
                      className={
                        index < rating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-3 block font-medium text-[#4B2E2E]">
                Review Title
              </label>

              <input
                type="text"
                required
                value={title}
                onChange={(e) =>
                  setTitle(
                    e.target.value
                  )
                }
                placeholder="Summarise your experience"
                className="w-full rounded-2xl border border-stone-300 px-5 py-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

            <div>
              <label className="mb-3 block font-medium text-[#4B2E2E]">
                Your Review
              </label>

              <textarea
                required
                rows={8}
                value={review}
                onChange={(e) =>
                  setReview(
                    e.target.value
                  )
                }
                placeholder="Tell us about the jewellery, packaging, delivery and your overall experience..."
                className="w-full rounded-2xl border border-stone-300 px-5 py-4 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D]"
              />
            </div>

            <div className="rounded-2xl border border-[#E8DDD3] bg-[#F8F4EF] p-5">
              <h3 className="font-medium text-[#4B2E2E]">
                Before you submit
              </h3>

              <ul className="mt-3 space-y-2 text-sm leading-7 text-[#7A6464]">
                <li>
                  • Reviews are checked before being published.
                </li>

                <li>
                  • Your review will display a Verified Purchase badge.
                </li>

                <li>
                  • Honest feedback helps other customers.
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#5A2D2D] px-10 py-4 font-medium text-white transition hover:bg-[#472323] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Submitting..."
                : "Submit Review"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}