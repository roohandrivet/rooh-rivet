"use client";

import { useEffect, useState } from "react";
import { Star, MessageCircle } from "lucide-react";

import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  review: string;
  created_at: string;
};

type ProductReviewsProps = {
  productId: string;
};

export default function ProductReviews({
  productId,
}: ProductReviewsProps) {
  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [loading, setLoading] =
    useState(true);


  useEffect(() => {
    async function fetchReviews() {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("reviews")
        .select(
          `
          id,
          customer_name,
          rating,
          review,
          created_at
          `
        )
        .eq(
          "product_id",
          productId
        )
        .eq(
          "approved",
          true
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        );


      if (error) {
        console.error(
          "Reviews error:",
          error
        );

        setReviews([]);
      } else {
        setReviews(
          (data ?? []) as Review[]
        );
      }


      setLoading(false);
    }


    fetchReviews();

  }, [
    productId,
  ]);


  return (
    <section className="mt-16">

      <div className="mb-10 flex items-center gap-3">
        <MessageCircle
          size={32}
          className="text-[#5A2D2D]"
        />

        <h2 className="font-serif text-4xl text-[#4B2E2E]">
          Customer Reviews
        </h2>
      </div>



      {loading && (
        <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
          <p className="text-[#7A6464]">
            Loading customer experiences...
          </p>
        </div>
      )}



      {!loading &&
        reviews.length === 0 && (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">

            <h3 className="font-serif text-3xl text-[#4B2E2E]">
              No Reviews Yet
            </h3>

            <p className="mt-3 text-[#7A6464]">
              Be the first customer to share your experience with this piece.
            </p>

          </div>
        )}




      {!loading &&
        reviews.length > 0 && (
          <div className="space-y-6">

            {reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-3xl bg-white p-8 shadow-sm transition hover:shadow-md"
              >

                <div className="flex flex-col justify-between gap-5 md:flex-row">

                  <div>

                    <h3 className="font-serif text-2xl text-[#4B2E2E]">
                      {review.customer_name}
                    </h3>


                    <div className="mt-3 flex gap-1">

                      {Array.from({
                        length: 5,
                      }).map((_, index) => (
                        <Star
                          key={index}
                          size={19}
                          className={
                            index <
                            review.rating
                              ? "fill-[#D4B483] text-[#D4B483]"
                              : "text-gray-300"
                          }
                        />
                      ))}

                    </div>

                  </div>



                  <p className="text-sm text-[#8B6B5B]">
                    {new Date(
                      review.created_at
                    ).toLocaleDateString(
                      "en-IN",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>


                </div>



                <p className="mt-6 leading-8 text-[#5A4A42]">
                  {review.review}
                </p>


              </article>
            ))}

          </div>
        )}

    </section>
  );
}