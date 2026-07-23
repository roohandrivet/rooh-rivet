"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type ReviewFormProps = {
  productId: string;
};

export default function ReviewForm({ productId }: ReviewFormProps) {
  const [name, setName] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      name,
      rating,
      review,
      approved: false,
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage(
        "Thank you! Your review has been submitted for approval."
      );
      setName("");
      setReview("");
      setRating(5);
    }

    setLoading(false);
  }

  return (
    <div className="mt-10 rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="mb-5 font-serif text-2xl text-[#4B2E2E]">
        Write a Review
      </h3>

      <form onSubmit={submitReview} className="space-y-4">

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          required
          className="w-full rounded-lg border p-3"
        />

        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="w-full rounded-lg border p-3"
        >
          <option value={5}>★★★★★</option>
          <option value={4}>★★★★</option>
          <option value={3}>★★★</option>
          <option value={2}>★★</option>
          <option value={1}>★</option>
        </select>

        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Share your experience"
          required
          rows={5}
          className="w-full rounded-lg border p-3"
        />

        <button
          disabled={loading}
          className="rounded-full bg-[#5A2D2D] px-6 py-3 text-white"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>

        {message && (
          <p className="text-sm text-[#8B6B5B]">
            {message}
          </p>
        )}

      </form>
    </div>
  );
}