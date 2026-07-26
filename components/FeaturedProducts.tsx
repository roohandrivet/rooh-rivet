"use client";

import {
  useEffect,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  Heart,
  Loader2,
  ShoppingBag,
} from "lucide-react";

import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  image_1: string | null;
  category: string | null;
  bestseller: boolean;
  featured: boolean;
  active: boolean;
  stock: number;
  reservation_enabled: boolean | null;
};

type FeaturedProductsProps = {
  heading: string;
  description: string;
};

export default function FeaturedProducts({
  heading,
  description,
}: FeaturedProductsProps) {
  const {
    addToCart,
    reservationError,
    clearReservationError,
  } = useCart();

  const {
    formatCurrency,
  } = useCurrency();

  const [
    products,
    setProducts,
  ] = useState<Product[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadError,
    setLoadError,
  ] = useState("");

  const [
    addingId,
    setAddingId,
  ] = useState<string | null>(
    null
  );

  const [
    hoveredProduct,
    setHoveredProduct,
  ] = useState<string | null>(
    null
  );

  useEffect(() => {
    void loadProducts();
  }, []);

  async function loadProducts():
    Promise<void> {
    setLoading(true);
    setLoadError("");

    try {
      const {
        data,
        error,
      } = await supabase
        .from("products")
        .select(
          `
            id,
            slug,
            name,
            description,
            price,
            image,
            image_1,
            category,
            bestseller,
            featured,
            active,
            stock,
            reservation_enabled
          `
        )
        .eq("active", true)
        .eq("featured", true)
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        throw error;
      }

      setProducts(
        (data ?? []) as Product[]
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Failed to load featured products:",
        error
      );

      setProducts([]);

      setLoadError(
        error instanceof Error
          ? error.message
          : "Unable to load featured products."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToCart(
    product: Product
  ): Promise<void> {
    if (
      addingId ||
      product.stock <= 0
    ) {
      return;
    }

    setAddingId(product.id);
    clearReservationError();

    try {
      const reservationEnabled =
        product.reservation_enabled ===
        true;

      if (reservationEnabled) {
        const {
          data: {
            user,
          },
        } =
          await supabase.auth.getUser();

        if (!user) {
          window.location.href =
            `/auth/login?redirect=${encodeURIComponent(
              "/"
            )}`;

          return;
        }
      }

      await addToCart({
        id: product.id,
        slug: product.slug,
        name: product.name,
        image:
          product.image ??
          "",
        price: product.price,
        quantity: 1,
        stock: product.stock,
        reservationEnabled,
        reservedUntil: null,
      });
    } finally {
      setAddingId(null);
    }
  }

  return (
    <section className="bg-[#F8F4EF] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[#8B6B5B]">
              Handpicked Collection
            </p>

            <h2 className="mt-4 font-serif text-5xl text-[#4B2E2E]">
              {heading}
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#7A6464]">
              {description}
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex rounded-full bg-[#5A2D2D] px-8 py-4 font-medium text-white transition hover:bg-[#472323]"
          >
            View All Collection
          </Link>
        </div>

        {loadError ? (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>{loadError}</p>
          </div>
        ) : null}

        {reservationError ? (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>{reservationError}</p>
          </div>
        ) : null}

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({
              length: 4,
            }).map(
              (
                _,
                index
              ) => (
                <div
                  key={index}
                  className="h-[520px] animate-pulse rounded-[32px] bg-white"
                />
              )
            )}
          </div>
        ) : products.length ===
          0 ? (
          <div className="rounded-[32px] border border-[#E8DDD3] bg-white p-16 text-center">
            <h3 className="font-serif text-3xl text-[#4B2E2E]">
              No Featured Products
            </h3>

            <p className="mt-4 text-[#7A6464]">
              Featured jewellery will
              appear here once products
              are added.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map(
              (product) => {
                const displayImage =
                  hoveredProduct ===
                    product.id &&
                  product.image_1
                    ? product.image_1
                    : product.image;

                const isAdding =
                  addingId ===
                  product.id;

                const reservationEnabled =
                  product
                    .reservation_enabled ===
                  true;

                return (
                  <article
                    key={
                      product.id
                    }
                    className="group overflow-hidden rounded-[32px] bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                    onMouseEnter={() =>
                      setHoveredProduct(
                        product.id
                      )
                    }
                    onMouseLeave={() =>
                      setHoveredProduct(
                        null
                      )
                    }
                  >
                    <div className="relative aspect-square overflow-hidden bg-[#F8F4EF]">
                      <Link
                        href={`/shop/${product.slug}`}
                        className="block h-full"
                      >
                        {displayImage ? (
                          <Image
                            src={
                              displayImage
                            }
                            alt={
                              product.name
                            }
                            fill
                            sizes="(max-width:768px) 100vw, 25vw"
                            className="object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-[#8B6B5B]">
                            No Image
                          </div>
                        )}
                      </Link>

                      {product.bestseller ? (
                        <span className="absolute left-4 top-4 rounded-full bg-[#5A2D2D] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                          Bestseller
                        </span>
                      ) : null}

                      <Link
                        href={`/shop/${product.slug}`}
                        aria-label={`View ${product.name} and add it to your wishlist`}
                        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 backdrop-blur transition hover:bg-white"
                      >
                        <Heart size={20} />
                      </Link>
                    </div>

                    <div className="p-7">
                      <p className="text-sm uppercase tracking-[0.2em] text-[#8B6B5B]">
                        {product.category ??
                          "Jewellery"}
                      </p>

                      <Link
                        href={`/shop/${product.slug}`}
                      >
                        <h3 className="mt-3 font-serif text-3xl text-[#4B2E2E] transition group-hover:text-[#5A2D2D]">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="mt-4 text-2xl font-semibold text-[#4B2E2E]">
                        {formatCurrency(
                          product.price
                        )}
                      </p>

                      {product.description ? (
                        <p className="mt-4 line-clamp-2 leading-7 text-[#7A6464]">
                          {
                            product.description
                          }
                        </p>
                      ) : null}

                      {reservationEnabled ? (
                        <p className="mt-4 text-sm font-medium text-[#5A2D2D]">
                          One-of-a-kind piece ·
                          reserved for 30 minutes
                          when added
                        </p>
                      ) : null}

                      <button
                        type="button"
                        onClick={() =>
                          void handleAddToCart(
                            product
                          )
                        }
                        disabled={
                          product.stock <=
                            0 ||
                          isAdding
                        }
                        className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-[#5A2D2D] px-6 py-4 font-medium text-white transition hover:bg-[#472323] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAdding ? (
                          <Loader2
                            size={20}
                            className="animate-spin"
                          />
                        ) : (
                          <ShoppingBag
                            size={20}
                          />
                        )}

                        {product.stock <=
                        0
                          ? "Out of Stock"
                          : isAdding
                            ? reservationEnabled
                              ? "Reserving..."
                              : "Adding..."
                            : reservationEnabled
                              ? "Reserve & Add to Cart"
                              : "Add to Cart"}
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </div>
    </section>
  );
}