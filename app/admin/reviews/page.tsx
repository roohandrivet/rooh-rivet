"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Star,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  product_id: string;
  name: string;
  rating: number;
  review: string;
  approved: boolean;
  created_at: string;
};

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReviews() {
    setLoading(true);

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setReviews(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadReviews();
  }, []);

  async function approveReview(id: string) {
    await supabase
      .from("reviews")
      .update({
        approved: true,
      })
      .eq("id", id);

    loadReviews();
  }

  async function rejectReview(id: string) {
    await supabase
      .from("reviews")
      .update({
        approved: false,
      })
      .eq("id", id);

    loadReviews();
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete this review?")) return;

    await supabase
      .from("reviews")
      .delete()
      .eq("id", id);

    loadReviews();
  }

  if (loading) {
    return (
      <div className="p-10 text-[#5A2D2D]">
        Loading reviews...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-5xl text-[#5A2D2D]">
          Reviews
        </h1>

        <p className="mt-2 text-[#8B6B5B]">
          Approve and manage customer reviews.
        </p>
      </div>

      <div className="space-y-6"></div>
      {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-3xl border border-[#E8DDD3] bg-white p-8 shadow-sm"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="font-serif text-2xl text-[#5A2D2D]">
                    {review.name}
                  </h2>

                  <span
                    className={`rounded-full px-4 py-2 text-sm font-medium ${
                      review.approved
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {review.approved
                      ? "Approved"
                      : "Pending"}
                  </span>
                </div>

                <p className="mt-2 text-sm text-[#8B6B5B]">
                  {new Date(
                    review.created_at
                  ).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>

                <div className="mt-5 flex gap-1">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      size={18}
                      fill={
                        index < review.rating
                          ? "#C89B3C"
                          : "transparent"
                      }
                      className={
                        index < review.rating
                          ? "text-[#C89B3C]"
                          : "text-gray-300"
                      }
                    />
                  ))}
                </div>

                <p className="mt-6 whitespace-pre-line leading-7 text-[#6F5A5A]">
                  {review.review}
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:w-52">
                <button
                  onClick={() =>
                    approveReview(review.id)
                  }
                  className="flex items-center justify-center gap-2 rounded-full bg-green-600 px-6 py-3 text-white transition hover:bg-green-700"
                >
                  <CheckCircle2 size={18} />
                  Approve
                </button>

                <button
                  onClick={() =>
                    rejectReview(review.id)
                  }
                  className="flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-white transition hover:bg-amber-600"
                >
                  <XCircle size={18} />
                  Reject
                </button>
                <button
                  onClick={() =>
                    deleteReview(review.id)
                  }
                  className="flex items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3 text-white transition hover:bg-red-700"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {reviews.length === 0 && (
          <div className="rounded-3xl border border-dashed border-[#E8DDD3] bg-white p-16 text-center">
            <h2 className="font-serif text-2xl text-[#5A2D2D]">
              No Reviews Yet
            </h2>

            <p className="mt-3 text-[#8B6B5B]">
              Customer reviews will appear here once
              they are submitted.
            </p>
          </div>
        )}
      </div>
  );
}