"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
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
  image_1?: string | null;
  image_2?: string | null;
  image_3?: string | null;
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

type ProductCardProps = {
  product: Product;
  currentTime: number | null;
  formatPrice: (
    amount: number
  ) => string;
};

const SWIPE_DISTANCE = 45;

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
    product.reservation_enabled !== true
  ) {
    return false;
  }

  if (currentTime === null) {
    return (
      product.currently_reserved === true
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

function getProductImages(
  product: Product
): string[] {
  const images = [
    product.image,
    product.image_1,
    product.image_2,
    product.image_3,
  ]
    .filter(
      (
        image
      ): image is string =>
        typeof image === "string" &&
        image.trim() !== ""
    )
    .map((image) => image.trim());

  const uniqueImages = Array.from(
    new Set(images)
  );

  return uniqueImages.length > 0
    ? uniqueImages
    : ["/placeholder.jpg"];
}

function ProductCard({
  product,
  currentTime,
  formatPrice,
}: ProductCardProps) {
  const images = useMemo(
    () =>
      getProductImages(product),
    [product]
  );

  const [
    activeImageIndex,
    setActiveImageIndex,
  ] = useState(0);

  const touchStartX =
    useRef<number | null>(null);

  const touchCurrentX =
    useRef<number | null>(null);

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

  const hasMultipleImages =
    images.length > 1;

  function showPreviousImage() {
    setActiveImageIndex(
      (currentIndex) =>
        currentIndex === 0
          ? images.length - 1
          : currentIndex - 1
    );
  }

  function showNextImage() {
    setActiveImageIndex(
      (currentIndex) =>
        currentIndex ===
        images.length - 1
          ? 0
          : currentIndex + 1
    );
  }

  function handleTouchStart(
    event: TouchEvent<HTMLDivElement>
  ) {
    touchStartX.current =
      event.touches[0]?.clientX ??
      null;

    touchCurrentX.current =
      touchStartX.current;
  }

  function handleTouchMove(
    event: TouchEvent<HTMLDivElement>
  ) {
    touchCurrentX.current =
      event.touches[0]?.clientX ??
      null;
  }

  function handleTouchEnd() {
    if (
      touchStartX.current === null ||
      touchCurrentX.current === null
    ) {
      return;
    }

    const distance =
      touchStartX.current -
      touchCurrentX.current;

    if (
      Math.abs(distance) >=
      SWIPE_DISTANCE
    ) {
      if (distance > 0) {
        showNextImage();
      } else {
        showPreviousImage();
      }
    }

    touchStartX.current = null;
    touchCurrentX.current = null;
  }

  useEffect(() => {
    if (
      activeImageIndex >=
      images.length
    ) {
      setActiveImageIndex(0);
    }
  }, [
    activeImageIndex,
    images.length,
  ]);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-[#E8DDD3] bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute right-5 top-5 z-30">
        <WishlistButton
          productId={product.id}
        />
      </div>

      <div className="absolute left-5 top-5 z-30 flex max-w-[calc(100%-6rem)] flex-wrap gap-2">
        {oneOfAKind ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#5A2D2D] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow-sm">
            <Sparkles size={13} />
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

      <div
        className="relative select-none overflow-hidden bg-[#F8F4EF] touch-pan-y"
        onTouchStart={
          handleTouchStart
        }
        onTouchMove={
          handleTouchMove
        }
        onTouchEnd={
          handleTouchEnd
        }
      >
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{
            transform:
              `translateX(-${activeImageIndex * 100}%)`,
          }}
        >
          {images.map(
            (
              image,
              imageIndex
            ) => (
              <div
                key={`${product.id}-${image}-${imageIndex}`}
                className="relative min-w-full"
              >
                <Image
                  src={image}
                  alt={`${product.name} image ${imageIndex + 1}`}
                  width={600}
                  height={600}
                  draggable={false}
                  priority={
                    imageIndex === 0
                  }
                  className={`h-[350px] w-full object-cover transition duration-500 group-hover:scale-[1.02] ${
                    reserved ||
                    outOfStock
                      ? "opacity-65"
                      : ""
                  }`}
                />
              </div>
            )
          )}
        </div>

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={
                showPreviousImage
              }
              aria-label={`Show previous image of ${product.name}`}
              className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#5A2D2D] shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft
                size={21}
              />
            </button>

            <button
              type="button"
              onClick={
                showNextImage
              }
              aria-label={`Show next image of ${product.name}`}
              className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#5A2D2D] shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight
                size={21}
              />
            </button>

            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/20 px-3 py-2 backdrop-blur-sm">
              {images.map(
                (
                  _image,
                  imageIndex
                ) => (
                  <button
                    key={`${product.id}-dot-${imageIndex}`}
                    type="button"
                    onClick={() =>
                      setActiveImageIndex(
                        imageIndex
                      )
                    }
                    aria-label={`Show image ${imageIndex + 1} of ${product.name}`}
                    aria-current={
                      activeImageIndex ===
                      imageIndex
                        ? "true"
                        : undefined
                    }
                    className={`h-2 rounded-full transition-all ${
                      activeImageIndex ===
                      imageIndex
                        ? "w-6 bg-white"
                        : "w-2 bg-white/65 hover:bg-white"
                    }`}
                  />
                )
              )}
            </div>

            <div className="absolute bottom-4 right-4 z-20 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#5A2D2D] shadow-sm backdrop-blur">
              {activeImageIndex + 1}
              {" / "}
              {images.length}
            </div>
          </>
        ) : null}

        {reserved ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#3E2626]/30 p-6">
            <div className="rounded-2xl border border-white/50 bg-white/95 px-6 py-5 text-center shadow-xl">
              <Clock3
                size={27}
                className="mx-auto text-[#5A2D2D]"
              />

              <p className="mt-3 font-serif text-xl text-[#4B2E2E]">
                Currently Reserved
              </p>

              {remainingSeconds > 0 ? (
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
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-[#3E2626]/30 p-6">
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

      <Link
        href={`/shop/${product.slug}`}
        aria-label={`View ${product.name}`}
        className="block p-6"
      >
        {product.category ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#A08070]">
            {product.category}
          </p>
        ) : null}

        <h3 className="font-serif text-2xl text-[#4B2E2E] transition group-hover:text-[#5A2D2D]">
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
      </Link>
    </article>
  );
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
        (product) => (
          <ProductCard
            key={product.id}
            product={product}
            currentTime={
              currentTime
            }
            formatPrice={
              formatPrice
            }
          />
        )
      )}
    </div>
  );
}