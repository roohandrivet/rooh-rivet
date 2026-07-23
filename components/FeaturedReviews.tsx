"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";

import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Star,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type Review = {
  id: string;
  product_id: string;
  name: string;
  title: string | null;
  review: string;
  rating: number;
  verified_purchase: boolean;
  created_at: string;
  products: {
    slug: string;
    name: string;
    image: string | null;
  } | null;
};

export default function FeaturedReviews() {
  const scrollRef =
    useRef<HTMLDivElement>(null);

  const [loading, setLoading] =
    useState(true);

  const [reviews, setReviews] =
    useState<Review[]>([]);

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    setLoading(true);

    const { data, error } =
      await supabase
        .from("reviews")
        .select(`
          id,
          product_id,
          name,
          title,
          review,
          rating,
          verified_purchase,
          created_at,
          products (
            slug,
            name,
            image
          )
        `)
        .eq("approved", true)
        .eq(
          "verified_purchase",
          true
        )
        .order("created_at", {
          ascending: false,
        })
        .limit(12);

    if (!error && data) {
      setReviews(
        data as unknown as Review[]
      );
    }

    setLoading(false);
  }

  const averageRating =
    useMemo(() => {
      if (!reviews.length) return 0;

      const total =
        reviews.reduce(
          (sum, review) =>
            sum + review.rating,
          0
        );

      return (
        Math.round(
          (total / reviews.length) *
            10
        ) / 10
      );
    }, [reviews]);

  function scrollLeft() {
    scrollRef.current?.scrollBy({
      left: -420,
      behavior: "smooth",
    });
  }

  function scrollRight() {
    scrollRef.current?.scrollBy({
      left: 420,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    if (
      !scrollRef.current ||
      reviews.length === 0
    ) {
      return;
    }

    const container =
      scrollRef.current;

    const interval =
      window.setInterval(() => {
        if (
          container.scrollLeft +
            container.clientWidth >=
          container.scrollWidth - 20
        ) {
          container.scrollTo({
            left: 0,
            behavior: "smooth",
          });
        } else {
          container.scrollBy({
            left: 360,
            behavior: "smooth",
          });
        }
      }, 5000);

    return () =>
      window.clearInterval(
        interval
      );
  }, [reviews]);

  const totalReviews =
    reviews.length;
    return (
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="uppercase tracking-[0.35em] text-sm text-[#8B6B5B]">
                  Verified Customer Stories
                </p>
    
                <h2 className="mt-4 font-serif text-5xl text-[#4B2E2E]">
                  Loved by Our Customers
                </h2>
    
                <p className="mt-5 max-w-2xl text-lg leading-8 text-[#7A6464]">
                  Every review comes from a verified purchase,
                  sharing genuine experiences with Rooh & Rivet
                  jewellery.
                </p>
              </div>
    
              <div className="flex flex-wrap items-center gap-8">
                <div>
                  <p className="text-4xl font-bold text-[#4B2E2E]">
                    {averageRating.toFixed(1)}
                  </p>
    
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={18}
                        className={
                          index < Math.round(averageRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }
                      />
                    ))}
                  </div>
                </div>
    
                <div className="h-14 w-px bg-[#E8DDD3]" />
    
                <div>
                  <p className="text-4xl font-bold text-[#4B2E2E]">
                    {totalReviews}
                  </p>
    
                  <p className="mt-2 text-[#7A6464]">
                    Verified Reviews
                  </p>
                </div>
    
                <div className="flex gap-3">
                  <button
                    onClick={scrollLeft}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E8DDD3] transition hover:bg-[#5A2D2D] hover:text-white"
                  >
                    <ChevronLeft size={22} />
                  </button>
    
                  <button
                    onClick={scrollRight}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-[#E8DDD3] transition hover:bg-[#5A2D2D] hover:text-white"
                  >
                    <ChevronRight size={22} />
                  </button>
                </div>
              </div>
            </div>
    
            {loading ? (
              <div className="mt-16 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[360px] animate-pulse rounded-[32px] bg-[#F8F4EF]"
                  />
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="mt-16 rounded-[32px] border border-[#E8DDD3] bg-[#F8F4EF] p-16 text-center">
                <h3 className="font-serif text-3xl text-[#4B2E2E]">
                  No Reviews Yet
                </h3>
    
                <p className="mt-4 text-[#7A6464]">
                  Verified customer reviews will appear here
                  once the first orders are completed.
                </p>
              </div>
            ) : (
              <div
                ref={scrollRef}
                className="mt-16 flex gap-8 overflow-x-auto scroll-smooth pb-4"
              >
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="flex w-[360px] flex-shrink-0 flex-col rounded-[32px] border border-[#EFE5DB] bg-[#FDFBF8] p-7 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            size={18}
                            className={
                              index < review.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                            }
                          />
                        ))}
                      </div>
    
                      {review.verified_purchase && (
                        <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          <ShieldCheck size={14} />
                          Verified
                        </div>
                      )}
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-[#F3ECE5]">
                    {review.products?.image ? (
                      <Image
                        src={review.products.image}
                        alt={review.products.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#8B6B5B]">
                        No Image
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="font-semibold text-[#4B2E2E]">
                      {review.products?.name ??
                        "Product"}
                    </p>

                    <p className="mt-1 text-sm text-[#8B6B5B]">
                      by {review.name}
                    </p>
                  </div>
                </div>

                {review.title && (
                  <h3 className="mt-6 font-serif text-2xl text-[#4B2E2E]">
                    {review.title}
                  </h3>
                )}

                <p className="mt-4 flex-1 leading-8 text-[#6D5C52]">
                  "{review.review}"
                </p>

                <div className="mt-8 flex items-center justify-between border-t border-[#EFE5DB] pt-6">
                  <p className="text-sm text-[#8B6B5B]">
                    {new Date(
                      review.created_at
                    ).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  {review.products && (
                    <Link
                      href={`/shop/${review.products.slug}`}
                      className="font-medium text-[#5A2D2D] transition hover:underline"
                    >
                      View Product
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}