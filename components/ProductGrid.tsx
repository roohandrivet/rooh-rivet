"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock3,
  Eye,
  PackageX,
  Sparkles,
} from "lucide-react";

import WishlistButton from "@/components/WishlistButton";
import { useCurrency } from "@/context/CurrencyContext";

type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  price: number;
  image: string | null;
  featured?: boolean;
  bestseller?: boolean;
  category?: string;
  stock?: number;
  reservation_enabled?: boolean;
  reserved_until?: string | null;
  currently_reserved?: boolean;
};

type ProductGridProps = {
  products: Product[];
};

function getReservationEndTime(
  reservedUntil: string | null | undefined
): number | null {
  if (!reservedUntil) {
    return null;
  }

  const endTime = new Date(
    reservedUntil
  ).getTime();

  if (Number.isNaN(endTime)) {
    return null;
  }

  return endTime;
}

function isReservationActive(
  product: Product,
  currentTime: number | null
): boolean {
  if (
    product.reservation_enabled !==
    true
  ) {
    return false;
  }

  if (currentTime === null) {
    return (
      product.currently_reserved ===
      true
    );
  }

  const endTime =
    getReservationEndTime(
      product.reserved_until
    );

  if (endTime === null) {
    return false;
  }

  return endTime > currentTime;
}

function getRemainingSeconds(
  product: Product,
  currentTime: number | null
): number {
  if (currentTime === null) {
    return 0;
  }

  const endTime =
    getReservationEndTime(
      product.reserved_until
    );

  if (endTime === null) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(
      (
        endTime -
        currentTime
      ) / 1000
    )
  );
}

function formatCountdown(
  totalSeconds: number
): string {
  const safeSeconds =
    Math.max(
      0,
      Math.floor(
        totalSeconds
      )
    );

  const minutes =
    Math.floor(
      safeSeconds / 60
    );

  const seconds =
    safeSeconds % 60;

  return `${minutes}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export default function ProductGrid({
  products,
}: ProductGridProps) {
  const {
    formatPrice,
  } = useCurrency();

  const [
    currentTime,
    setCurrentTime,
  ] = useState<number | null>(
    null
  );

  useEffect(() => {
    setCurrentTime(
      Date.now()
    );

    const interval =
      window.setInterval(
        () => {
          setCurrentTime(
            Date.now()
          );
        },
        1000
      );

    return () => {
      window.clearInterval(
        interval
      );
    };
  }, []);

  const hasActiveReservation =
    useMemo(
      () =>
        products.some(
          (product) =>
            isReservationActive(
              product,
              currentTime
            )
        ),
      [
        products,
        currentTime,
      ]
    );

  useEffect(() => {
    if (
      currentTime === null ||
      hasActiveReservation
    ) {
      return;
    }

    const hasServerReservedProduct =
      products.some(
        (product) =>
          product.currently_reserved ===
          true
      );

    if (
      hasServerReservedProduct
    ) {
      setCurrentTime(
        Date.now()
      );
    }
  }, [
    currentTime,
    hasActiveReservation,
    products,
  ]);

  if (
    !products ||
    products.length === 0
  ) {
    return (
      <div className="rounded-3xl border border-[#E8DDD3] bg-white p-10 text-center shadow-sm">
        <h2 className="font-serif text-3xl text-[#4B2E2E]">
          No Products Found
        </h2>

        <p className="mt-3 text-[#7A6464]">
          We are adding new handcrafted
          pieces soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {products.map(
        (product) => {
          const reserved =
            isReservationActive(
              product,
              currentTime
            );

          const remainingSeconds =
            getRemainingSeconds(
              product,
              currentTime
            );

          const oneOfAKind =
            product.reservation_enabled ===
            true;

          const stock =
            typeof product.stock ===
              "number" &&
            Number.isFinite(
              product.stock
            )
              ? Math.max(
                  0,
                  Math.floor(
                    product.stock
                  )
                )
              : null;

          const outOfStock =
            stock !== null &&
            stock <= 0;

          return (
            <article
              key={product.id}
              className="group relative overflow-hidden rounded-3xl border border-[#E8DDD3] bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="absolute right-5 top-5 z-20">
                <WishlistButton
                  productId={
                    product.id
                  }
                />
              </div>

              <div className="absolute left-5 top-5 z-20 flex max-w-[calc(100%-6rem)] flex-wrap gap-2">
                {oneOfAKind ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5A2D2D] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
                    <Sparkles
                      size={13}
                    />
                    One of a Kind
                  </span>
                ) : null}

                {product.featured ? (
                  <span className="rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#5A2D2D] shadow-sm">
                    Featured
                  </span>
                ) : null}

                {product.bestseller ? (
                  <span className="rounded-full bg-[#D9B38C] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#4B2E2E] shadow-sm">
                    Bestseller
                  </span>
                ) : null}
              </div>

              <Link
                href={`/shop/${product.slug}`}
                aria-label={`View ${product.name}`}
                className="block"
              >
                <div className="relative overflow-hidden bg-[#F8F4EF]">
                  <Image
                    src={
                      product.image &&
                      product.image.trim() !==
                        ""
                        ? product.image
                        : "/placeholder.jpg"
                    }
                    alt={
                      product.name
                    }
                    width={600}
                    height={600}
                    className={`h-[350px] w-full object-cover transition duration-500 group-hover:scale-105 ${
                      reserved ||
                      outOfStock
                        ? "opacity-65"
                        : ""
                    }`}
                  />

                  {reserved ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#3E2626]/30 p-6">
                      <div className="rounded-2xl border border-white/50 bg-white/95 px-6 py-5 text-center shadow-xl">
                        <Clock3
                          size={27}
                          className="mx-auto text-[#5A2D2D]"
                        />

                        <p className="mt-3 font-serif text-xl text-[#4B2E2E]">
                          Currently Reserved
                        </p>

                        {remainingSeconds >
                        0 ? (
                          <p className="mt-2 font-mono text-sm font-semibold text-[#8B6B5B]">
                            Available in{" "}
                            {formatCountdown(
                              remainingSeconds
                            )}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {!reserved &&
                  outOfStock ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#3E2626]/30 p-6">
                      <div className="rounded-2xl border border-white/50 bg-white/95 px-6 py-5 text-center shadow-xl">
                        <PackageX
                          size={27}
                          className="mx-auto text-[#5A2D2D]"
                        />

                        <p className="mt-3 font-serif text-xl text-[#4B2E2E]">
                          Sold Out
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="p-6">
                  {product.category ? (
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#A08070]">
                      {product.category}
                    </p>
                  ) : null}

                  <h3 className="font-serif text-2xl text-[#4B2E2E]">
                    {product.name}
                  </h3>

                  <div className="mt-4 flex items-end justify-between gap-4">
                    <p className="text-xl font-semibold text-[#8B6B5B]">
                      {formatPrice(
                        product.price
                      )}
                    </p>

                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#5A2D2D]">
                      <Eye size={16} />
                      View
                    </span>
                  </div>

                  {oneOfAKind ? (
                    <div
                      className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                        reserved
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-emerald-200 bg-emerald-50 text-emerald-800"
                      }`}
                    >
                      {reserved
                        ? "This piece is temporarily held in another customer’s cart."
                        : "Available now. Adding this piece to your cart reserves it for 30 minutes."}
                    </div>
                  ) : null}
                </div>
              </Link>
            </article>
          );
        }
      )}
    </div>
  );
}