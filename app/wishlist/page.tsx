"use client";

import {
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Heart,
  Loader2,
  PackageX,
  ShoppingBag,
  Sparkles,
  Trash2,
} from "lucide-react";

import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";

type ProductMetadata = {
  stock: number | null;
  reservationEnabled: boolean;
  reservedUntil: string | null;
};

function toRecord(
  value: unknown
): Record<string, unknown> {
  if (
    typeof value === "object" &&
    value !== null
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function toSafeNumber(
  value: unknown
): number | null {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function getProductMetadata(
  product: unknown
): ProductMetadata {
  const record = toRecord(product);

  const stockValue =
    toSafeNumber(record.stock);

  return {
    stock:
      stockValue === null
        ? null
        : Math.max(
            0,
            Math.floor(stockValue)
          ),
    reservationEnabled:
      record.reservation_enabled === true ||
      record.reservationEnabled === true,
    reservedUntil:
      typeof record.reserved_until === "string"
        ? record.reserved_until
        : typeof record.reservedUntil === "string"
          ? record.reservedUntil
          : null,
  };
}

function getReservationEndTime(
  reservedUntil: string | null
): number | null {
  if (!reservedUntil) {
    return null;
  }

  const endTime =
    new Date(
      reservedUntil
    ).getTime();

  if (
    Number.isNaN(endTime)
  ) {
    return null;
  }

  return endTime;
}

function isReservationActive(
  reservedUntil: string | null,
  currentTime: number | null
): boolean {
  if (
    currentTime === null
  ) {
    return false;
  }

  const endTime =
    getReservationEndTime(
      reservedUntil
    );

  return (
    endTime !== null &&
    endTime > currentTime
  );
}

function getRemainingSeconds(
  reservedUntil: string | null,
  currentTime: number | null
): number {
  if (
    currentTime === null
  ) {
    return 0;
  }

  const endTime =
    getReservationEndTime(
      reservedUntil
    );

  if (
    endTime === null
  ) {
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

export default function WishlistPage() {
  const {
    wishlist,
    removeFromWishlist,
  } = useWishlist();

  const {
    addToCart,
  } = useCart();

  const {
    formatCurrency,
  } = useCurrency();

  const [
    currentTime,
    setCurrentTime,
  ] = useState<number | null>(
    null
  );

  const [
    movingProductId,
    setMovingProductId,
  ] = useState<string | null>(
    null
  );

  const [
    actionError,
    setActionError,
  ] = useState("");

  const [
    actionSuccess,
    setActionSuccess,
  ] = useState("");

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

  async function handleMoveToCart(
    item: (typeof wishlist)[number]
  ) {
    if (!item.product) {
      return;
    }

    const metadata =
      getProductMetadata(
        item.product
      );

    const reserved =
      metadata.reservationEnabled &&
      isReservationActive(
        metadata.reservedUntil,
        Date.now()
      );

    const soldOut =
      metadata.stock !== null &&
      metadata.stock <= 0;

    if (reserved) {
      setActionError(
        `${item.product.name} is currently reserved by another customer.`
      );
      setActionSuccess("");
      return;
    }

    if (soldOut) {
      setActionError(
        `${item.product.name} is currently sold out.`
      );
      setActionSuccess("");
      return;
    }

    setMovingProductId(
      item.product.id
    );
    setActionError("");
    setActionSuccess("");

    try {
      const added =
        await addToCart({
          id: item.product.id,
          slug: item.product.slug,
          name: item.product.name,
          price: item.product.price,
          image:
            item.product.image ??
            undefined,
          quantity: 1,
          stock:
            metadata.stock ??
            undefined,
          reservationEnabled:
            metadata.reservationEnabled,
          reservedUntil:
            metadata.reservedUntil ??
            undefined,
        });

      if (!added) {
        setActionError(
          metadata.reservationEnabled
            ? "This one-of-a-kind piece could not be reserved. It may already be held by another customer."
            : "This product could not be added to your cart."
        );
        return;
      }

      removeFromWishlist(
        item.product_id
      );

      setActionSuccess(
        `${item.product.name} was moved to your cart.`
      );
    } catch (error) {
      console.error(
        "Failed to move wishlist item to cart:",
        error
      );

      setActionError(
        error instanceof Error
          ? error.message
          : "This product could not be added to your cart."
      );
    } finally {
      setMovingProductId(null);
    }
  }

  if (
    wishlist.length === 0
  ) {
    return (
      <main className="min-h-screen bg-[#F8F4EF]">
        <div className="mx-auto flex max-w-7xl flex-col items-center px-6 py-24 text-center">
          <Heart
            size={80}
            className="mb-8 text-[#D4B483]"
          />

          <h1 className="font-serif text-5xl text-[#4B2E2E]">
            Your Wishlist
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[#7A6464]">
            Save your favourite jewellery
            pieces here and come back
            anytime.
          </p>

          <Link
            href="/shop"
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#5A2D2D] px-8 py-4 font-semibold text-white transition hover:bg-[#442020]"
          >
            <ShoppingBag size={20} />
            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] py-16">
      <div className="mx-auto max-w-7xl px-6">
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-2 text-[#5A2D2D] transition hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Shop
        </Link>

        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B6B5B]">
            Saved Pieces
          </p>

          <h1 className="mt-3 font-serif text-5xl text-[#4B2E2E]">
            Wishlist
          </h1>

          <p className="mt-3 text-[#7A6464]">
            {wishlist.length}{" "}
            {wishlist.length === 1
              ? "saved item"
              : "saved items"}
          </p>
        </div>

        {actionError ? (
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>{actionError}</p>
          </div>
        ) : null}

        {actionSuccess ? (
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-700">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>{actionSuccess}</p>
          </div>
        ) : null}

        <div className="space-y-8">
          {wishlist.map(
            (item) => {
              if (
                !item.product
              ) {
                return null;
              }

              const metadata =
                getProductMetadata(
                  item.product
                );

              const reserved =
                metadata.reservationEnabled &&
                isReservationActive(
                  metadata.reservedUntil,
                  currentTime
                );

              const remainingSeconds =
                reserved
                  ? getRemainingSeconds(
                      metadata.reservedUntil,
                      currentTime
                    )
                  : 0;

              const soldOut =
                metadata.stock !== null &&
                metadata.stock <= 0;

              const unavailable =
                reserved ||
                soldOut;

              const moving =
                movingProductId ===
                item.product.id;

              return (
                <article
                  key={item.id}
                  className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-lg sm:p-8"
                >
                  <div className="grid gap-8 md:grid-cols-[220px_1fr_auto] md:items-center">
                    <Link
                      href={`/shop/${item.product.slug}`}
                      className="relative overflow-hidden rounded-2xl bg-[#F8F4EF]"
                    >
                      <Image
                        src={
                          item.product.image &&
                          item.product.image.trim() !==
                            ""
                            ? item.product.image
                            : "/placeholder.jpg"
                        }
                        alt={
                          item.product.name
                        }
                        width={440}
                        height={440}
                        className={`h-56 w-full object-cover transition hover:scale-105 ${
                          unavailable
                            ? "opacity-65"
                            : ""
                        }`}
                      />

                      {reserved ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#3E2626]/30 p-4">
                          <div className="rounded-2xl bg-white/95 px-5 py-4 text-center shadow-xl">
                            <Clock3
                              size={25}
                              className="mx-auto text-[#5A2D2D]"
                            />

                            <p className="mt-2 font-serif text-lg text-[#4B2E2E]">
                              Currently Reserved
                            </p>

                            {remainingSeconds >
                            0 ? (
                              <p className="mt-1 font-mono text-xs font-semibold text-[#8B6B5B]">
                                {formatCountdown(
                                  remainingSeconds
                                )}{" "}
                                remaining
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ) : null}

                      {!reserved &&
                      soldOut ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#3E2626]/30 p-4">
                          <div className="rounded-2xl bg-white/95 px-5 py-4 text-center shadow-xl">
                            <PackageX
                              size={25}
                              className="mx-auto text-[#5A2D2D]"
                            />

                            <p className="mt-2 font-serif text-lg text-[#4B2E2E]">
                              Sold Out
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </Link>

                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-serif text-3xl text-[#4B2E2E]">
                          {item.product.name}
                        </h2>

                        {metadata.reservationEnabled ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F4E9E1] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#5A2D2D]">
                            <Sparkles
                              size={13}
                            />
                            One of a Kind
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-3 text-2xl font-semibold text-[#8B6B5B]">
                        {formatCurrency(
                          item.product.price
                        )}
                      </p>

                      {metadata.reservationEnabled ? (
                        <div
                          className={`mt-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${
                            reserved
                              ? "border-amber-200 bg-amber-50 text-amber-800"
                              : "border-emerald-200 bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {reserved
                            ? "This piece is temporarily held in another customer’s cart."
                            : "Available now. Moving it to your cart reserves it for 30 minutes."}
                        </div>
                      ) : null}

                      <Link
                        href={`/shop/${item.product.slug}`}
                        className="mt-5 inline-block font-medium text-[#5A2D2D] transition hover:underline"
                      >
                        View Product
                      </Link>
                    </div>

                    <div className="flex flex-col gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          void handleMoveToCart(
                            item
                          )
                        }
                        disabled={
                          moving ||
                          unavailable
                        }
                        className="flex min-w-48 items-center justify-center gap-3 rounded-2xl bg-[#5A2D2D] px-8 py-4 font-semibold text-white transition hover:bg-[#442020] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {moving ? (
                          <Loader2
                            size={20}
                            className="animate-spin"
                          />
                        ) : unavailable ? (
                          reserved ? (
                            <Clock3 size={20} />
                          ) : (
                            <PackageX size={20} />
                          )
                        ) : (
                          <ShoppingBag size={20} />
                        )}

                        {moving
                          ? "Moving..."
                          : reserved
                            ? "Currently Reserved"
                            : soldOut
                              ? "Sold Out"
                              : "Move To Cart"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          removeFromWishlist(
                            item.product_id
                          );
                          setActionError("");
                          setActionSuccess("");
                        }}
                        disabled={moving}
                        className="flex items-center justify-center gap-3 rounded-2xl border border-red-200 px-8 py-4 font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={20} />
                        Remove
                      </button>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </div>
      </div>
    </main>
  );
}