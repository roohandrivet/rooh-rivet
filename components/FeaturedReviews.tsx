import Image from "next/image";
import {
  BadgeCheck,
  Quote,
  Star,
} from "lucide-react";
import {
  createClient,
} from "@supabase/supabase-js";

type ReviewRow = {
  id: string;
  product_id:
    | string
    | null;
  name:
    | string
    | null;
  title:
    | string
    | null;
  rating:
    | number
    | string
    | null;
  review:
    | string
    | null;
  created_at:
    | string
    | null;
};

type ProductRow = {
  id: string;
  name:
    | string
    | null;
  image:
    | string
    | null;
};

type FeaturedReview = {
  id: string;
  customerName: string;
  title: string;
  rating: number;
  review: string;
  productName: string;
  productImage:
    | string
    | null;
  createdAt:
    | string
    | null;
};

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env
      .SUPABASE_SERVICE_ROLE_KEY;

  if (
    !supabaseUrl ||
    !serviceRoleKey
  ) {
    throw new Error(
      "Missing Supabase server environment variables."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function getString(
  value:
    | string
    | null
    | undefined,
  fallback: string
): string {
  const trimmedValue =
    value?.trim();

  return trimmedValue
    ? trimmedValue
    : fallback;
}

function getRating(
  value:
    | number
    | string
    | null
): number {
  const parsedRating =
    Number(value);

  if (
    !Number.isFinite(
      parsedRating
    )
  ) {
    return 5;
  }

  return Math.min(
    5,
    Math.max(
      1,
      Math.round(
        parsedRating
      )
    )
  );
}

function formatReviewDate(
  value:
    | string
    | null
): string {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      month:
        "long",
      year:
        "numeric",
    }
  );
}

export default async function FeaturedReviews() {
  try {
    const supabase =
      getSupabaseAdmin();

    const {
      data:
        reviewData,
      error:
        reviewError,
    } = await supabase
      .from("reviews")
      .select(
        `
          id,
          product_id,
          name,
          title,
          rating,
          review,
          created_at
        `
      )
      .eq(
        "approved",
        true
      )
      .eq(
        "verified_purchase",
        true
      )
      .order(
        "featured",
        {
          ascending:
            false,
        }
      )
      .order(
        "created_at",
        {
          ascending:
            false,
        }
      )
      .limit(6);

    if (reviewError) {
      throw reviewError;
    }

    const reviews =
      (
        reviewData ??
        []
      ) as ReviewRow[];

    if (
      reviews.length ===
      0
    ) {
      return null;
    }

    const productIds =
      Array.from(
        new Set(
          reviews
            .map(
              (review) =>
                review.product_id
            )
            .filter(
              (
                productId
              ): productId is string =>
                Boolean(
                  productId
                )
            )
        )
      );

    let products:
      ProductRow[] = [];

    if (
      productIds.length >
      0
    ) {
      const {
        data:
          productData,
        error:
          productError,
      } = await supabase
        .from("products")
        .select(
          `
            id,
            name,
            image
          `
        )
        .in(
          "id",
          productIds
        );

      if (productError) {
        throw productError;
      }

      products =
        (
          productData ??
          []
        ) as ProductRow[];
    }

    const productsById =
      new Map<
        string,
        ProductRow
      >(
        products.map(
          (product) => [
            product.id,
            product,
          ]
        )
      );

    const featuredReviews:
      FeaturedReview[] =
        reviews.map(
          (review) => {
            const product =
              review.product_id
                ? productsById.get(
                    review.product_id
                  )
                : undefined;

            return {
              id:
                review.id,

              customerName:
                getString(
                  review.name,
                  "Rooh & Rivet Customer"
                ),

              title:
                getString(
                  review.title,
                  "A treasured experience"
                ),

              rating:
                getRating(
                  review.rating
                ),

              review:
                getString(
                  review.review,
                  "A verified Rooh & Rivet customer shared their experience."
                ),

              productName:
                getString(
                  product?.name,
                  "One-of-a-kind Rooh & Rivet jewellery"
                ),

              productImage:
                product?.image ??
                null,

              createdAt:
                review.created_at,
            };
          }
        );

    return (
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#8B6B5B]">
              Verified Experiences
            </p>

            <h2 className="mt-6 font-serif text-4xl text-[#4B2E2E] sm:text-5xl">
              Stories From Our Customers
            </h2>

            <p className="mx-auto mt-6 max-w-2xl leading-8 text-[#7A6464]">
              Genuine reviews from customers who purchased and
              received their one-of-a-kind Rooh &amp; Rivet
              jewellery.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            {featuredReviews.map(
              (
                featuredReview
              ) => {
                const reviewDate =
                  formatReviewDate(
                    featuredReview
                      .createdAt
                  );

                return (
                  <article
                    key={
                      featuredReview.id
                    }
                    className="overflow-hidden rounded-[34px] border border-[#E8DDD3] bg-[#FCFAF8] shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="grid min-h-full sm:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="relative min-h-64 bg-[#F1E8E1] sm:min-h-full">
                        {featuredReview
                          .productImage ? (
                          <Image
                            src={
                              featuredReview
                                .productImage
                            }
                            alt={
                              featuredReview
                                .productName
                            }
                            fill
                            sizes="(max-width: 640px) 100vw, 220px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full min-h-64 items-center justify-center px-8 text-center font-serif text-xl text-[#8B6B5B]">
                            One-of-a-kind
                            jewellery
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col p-7 sm:p-8">
                        <div className="flex items-start justify-between gap-5">
                          <div
                            className="flex gap-1"
                            aria-label={`${featuredReview.rating} out of 5 stars`}
                          >
                            {Array.from({
                              length: 5,
                            }).map(
                              (
                                _,
                                index
                              ) => (
                                <Star
                                  key={
                                    index
                                  }
                                  size={17}
                                  className={
                                    index <
                                    featuredReview
                                      .rating
                                      ? "fill-amber-400 text-amber-400"
                                      : "fill-stone-200 text-stone-200"
                                  }
                                />
                              )
                            )}
                          </div>

                          <Quote
                            size={30}
                            className="shrink-0 text-[#D9C1B2]"
                          />
                        </div>

                        <h3 className="mt-5 font-serif text-2xl text-[#4B2E2E]">
                          {
                            featuredReview.title
                          }
                        </h3>

                        <p className="mt-4 flex-1 leading-8 text-[#6F5952]">
                          “
                          {
                            featuredReview.review
                          }
                          ”
                        </p>

                        <div className="mt-7 border-t border-[#E8DDD3] pt-6">
                          <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-emerald-700">
                            <BadgeCheck
                              size={18}
                            />

                            Verified Purchase
                          </div>

                          <p className="mt-3 font-semibold text-[#4B2E2E]">
                            {
                              featuredReview
                                .customerName
                            }
                          </p>

                          <p className="mt-1 text-sm text-[#8B6B5B]">
                            Purchased:{" "}
                            {
                              featuredReview
                                .productName
                            }
                          </p>

                          {reviewDate ? (
                            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#A08374]">
                              {
                                reviewDate
                              }
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </div>
      </section>
    );
  } catch (
    error: unknown
  ) {
    console.error(
      "Failed to load featured reviews:",
      error
    );

    return null;
  }
}