import { Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  productId: string;
};

type Review = {
  id: string;
  product_id: string;
  name: string;
  rating: number;
  review: string;
  approved: boolean;
  created_at: string;
};

export default async function ProductReviews({
  productId,
}: Props) {
  const { data, error } = await supabase
    .from("reviews")
    .select("id, product_id, name, rating, review, approved, created_at")
    .eq("product_id", productId)
    .eq("approved", true)
    .order("created_at", { ascending: false });

  const reviews: Review[] = error ? [] : ((data ?? []) as Review[]);

  const reviewCount = reviews.length;

  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
      : 0;

  return (
    <section className="mt-16 rounded-3xl bg-[#F8F4EF] p-8 md:p-10">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-serif font-semibold text-[#4B2E2E]">
            Customer Reviews
          </h2>
          <p className="mt-2 text-[#7A6464]">
            Read what our customers have to say about this piece.
          </p>
        </div>

        <div className="rounded-2xl bg-white px-6 py-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={`h-5 w-5 ${
                    index < Math.round(averageRating)
                      ? "fill-[#5A2D2D] text-[#5A2D2D]"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>

            <span className="text-xl font-semibold text-[#4B2E2E]">
              {averageRating.toFixed(1)}
            </span>
          </div>

          <p className="mt-2 text-sm text-[#7A6464]">
            {reviewCount} {reviewCount === 1 ? "Review" : "Reviews"}
          </p>
        </div>
      </div>

      {reviewCount === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
          <p className="text-[#7A6464]">
            No reviews yet. Be the first to review this product.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl bg-white p-6 shadow-lg transition-shadow duration-200 hover:shadow-xl"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#4B2E2E]">
                    {review.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-5 w-5 ${
                          index < review.rating
                            ? "fill-[#5A2D2D] text-[#5A2D2D]"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <time
                  dateTime={review.created_at}
                  className="text-sm text-[#7A6464]"
                >
                  {new Date(review.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </div>

              <p className="mt-5 whitespace-pre-line leading-7 text-[#7A6464]">
                {review.review}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}