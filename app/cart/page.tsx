"use client";

import {
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  useRouter,
} from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import {
  useCart,
} from "@/context/CartContext";
import {
  useCurrency,
} from "@/context/CurrencyContext";
import {
  supabase,
} from "@/lib/supabase";

function formatRemainingTime(
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

export default function CartPage() {
  const router =
    useRouter();

  const {
    cart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    subtotal,
    hydrated,
    reservationError,
    clearReservationError,
    getReservationRemainingSeconds,
    isReservationExpired,
  } = useCart();

  const {
    currency,
    formatPrice,
    ratesLoading,
    ratesError,
    refreshRates,
  } = useCurrency();

  const [
    checkoutError,
    setCheckoutError,
  ] = useState("");

  const [
    checkingOut,
    setCheckingOut,
  ] = useState(false);

  function clearErrors(): void {
    setCheckoutError("");
    clearReservationError();
  }

  function handleRemoveItem(
    id: string
  ): void {
    clearErrors();
    removeFromCart(id);
  }

  function handleIncreaseQuantity(
    id: string
  ): void {
    clearErrors();
    increaseQuantity(id);
  }

  function handleDecreaseQuantity(
    id: string
  ): void {
    clearErrors();
    decreaseQuantity(id);
  }

  function handleClearCart(): void {
    clearErrors();
    clearCart();
  }

  async function handleCheckout():
    Promise<void> {
    if (checkingOut) {
      return;
    }

    setCheckingOut(true);
    clearErrors();

    try {
      const invalidReservation =
        cart.find(
          (item) =>
            item.reservationEnabled ===
              true &&
            (
              !item.reservedUntil ||
              isReservationExpired(
                item.id
              ) ||
              getReservationRemainingSeconds(
                item.id
              ) <= 0
            )
        );

      if (
        invalidReservation
      ) {
        setCheckoutError(
          `${invalidReservation.name} is no longer reserved. Please remove it and reserve it again before checkout.`
        );

        return;
      }

      const {
        data: {
          user,
        },
        error:
          userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        router.push(
          "/auth/login?redirect=/checkout"
        );

        return;
      }

      router.push(
        "/checkout"
      );
    } catch (
      error: unknown
    ) {
      console.error(
        "Checkout navigation error:",
        error
      );

      setCheckoutError(
        "Unable to continue to checkout. Please try again."
      );
    } finally {
      setCheckingOut(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF] px-6">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#E8DDD3] border-t-[#5A2D2D]" />

          <p className="mt-5 text-[#7A6464]">
            Loading your cart...
          </p>
        </div>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-[#F8F4EF] px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          {reservationError ? (
            <div className="mx-auto mb-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left text-amber-800">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <p>
                {
                  reservationError
                }
              </p>
            </div>
          ) : null}

          <h1 className="font-serif text-5xl text-[#4B2E2E]">
            Your Cart is Empty
          </h1>

          <p className="mt-5 text-[#7A6464]">
            Discover our handcrafted
            luxury jewellery
            collection.
          </p>

          <Link
            href="/shop"
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-[#5A2D2D] px-8 py-3 text-white transition hover:bg-[#4B2E2E]"
          >
            <ArrowLeft
              size={18}
            />

            Continue Shopping
          </Link>
        </div>
      </main>
    );
  }

  const displayedError =
    checkoutError ||
    reservationError;

  return (
    <main className="min-h-screen bg-[#F8F4EF] px-5 py-16 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B6B5B]">
              Your Selection
            </p>

            <h1 className="mt-3 font-serif text-4xl text-[#4B2E2E] sm:text-5xl">
              Shopping Cart
            </h1>
          </div>

          <button
            type="button"
            onClick={
              handleClearCart
            }
            className="w-fit text-sm font-medium text-[#8B6B5B] transition hover:text-[#5A2D2D]"
          >
            Clear Cart
          </button>
        </div>

        {displayedError ? (
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p>
              {displayedError}
            </p>
          </div>
        ) : null}

        {ratesError ? (
          <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div>
                <p className="font-semibold">
                  Live currency rates are temporarily unavailable.
                </p>

                <p className="mt-1 text-sm leading-6">
                  Prices are still calculated from their original INR
                  values. Retry to restore the latest {currency} display
                  conversion.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void refreshRates()
              }
              disabled={ratesLoading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-amber-400 bg-white px-5 py-2.5 font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {ratesLoading ? (
                <Loader2
                  size={17}
                  className="animate-spin"
                />
              ) : (
                <RefreshCw
                  size={17}
                />
              )}

              Retry Rates
            </button>
          </div>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {cart.map(
              (item) => {
                const isReserved =
                  item.reservationEnabled ===
                  true;

                const remainingSeconds =
                  isReserved
                    ? getReservationRemainingSeconds(
                        item.id
                      )
                    : 0;

                const expired =
                  isReserved &&
                  isReservationExpired(
                    item.id
                  );

                const reachedStockLimit =
                  typeof item.stock ===
                    "number" &&
                  item.quantity >=
                    item.stock;

                const safePrice =
                  Number(
                    item.price
                  ) || 0;

                const safeQuantity =
                  Number(
                    item.quantity
                  ) || 0;

                const lineTotal =
                  safePrice *
                  safeQuantity;

                return (
                  <article
                    key={
                      item.id
                    }
                    className="rounded-3xl border border-[#E8DDD3] bg-white p-5 shadow-sm sm:p-6"
                  >
                    <div className="flex flex-col gap-6 sm:flex-row">
                      <Link
                        href={`/shop/${item.slug}`}
                        className="relative h-40 w-full shrink-0 overflow-hidden rounded-2xl bg-[#F8F4EF] sm:h-32 sm:w-32"
                      >
                        {item.image ? (
                          <Image
                            src={
                              item.image
                            }
                            alt={
                              item.name
                            }
                            fill
                            sizes="(max-width: 640px) 100vw, 128px"
                            className="object-cover transition duration-300 hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-[#8B6B5B]">
                            No Image
                          </div>
                        )}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col justify-between gap-6">
                        <div>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <Link
                                href={`/shop/${item.slug}`}
                                className="font-serif text-2xl text-[#4B2E2E] transition hover:text-[#5A2D2D]"
                              >
                                {item.name}
                              </Link>

                              <p className="mt-2 font-medium text-[#8B6B5B]">
                                {formatPrice(
                                  safePrice
                                )}{" "}
                                each
                              </p>
                            </div>

                            <p className="shrink-0 font-semibold text-[#4B2E2E]">
                              {formatPrice(
                                lineTotal
                              )}
                            </p>
                          </div>

                          {isReserved ? (
                            <div
                              className={`mt-4 flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                                expired
                                  ? "bg-red-50 text-red-700"
                                  : "bg-[#F6ECE5] text-[#5A2D2D]"
                              }`}
                            >
                              <Clock3
                                size={16}
                              />

                              {expired
                                ? "Reservation expired"
                                : `Reserved · ${formatRemainingTime(
                                    remainingSeconds
                                  )} remaining`}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between gap-5">
                          <div className="flex items-center gap-3 rounded-full border border-[#D8C3B0] px-3 py-2">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${item.name}`}
                              onClick={() =>
                                handleDecreaseQuantity(
                                  item.id
                                )
                              }
                              disabled={
                                isReserved
                              }
                              className="text-[#5A2D2D] transition hover:text-[#4B2E2E] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Minus
                                size={16}
                              />
                            </button>

                            <span className="min-w-6 text-center text-[#4B2E2E]">
                              {safeQuantity}
                            </span>

                            <button
                              type="button"
                              aria-label={`Increase quantity of ${item.name}`}
                              onClick={() =>
                                handleIncreaseQuantity(
                                  item.id
                                )
                              }
                              disabled={
                                isReserved ||
                                reachedStockLimit
                              }
                              className="text-[#5A2D2D] transition hover:text-[#4B2E2E] disabled:cursor-not-allowed disabled:opacity-30"
                            >
                              <Plus
                                size={16}
                              />
                            </button>
                          </div>

                          <button
                            type="button"
                            aria-label={`Remove ${item.name} from cart`}
                            onClick={() =>
                              handleRemoveItem(
                                item.id
                              )
                            }
                            className="rounded-full p-2 text-[#8B6B5B] transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2
                              size={20}
                            />
                          </button>
                        </div>

                        {isReserved ? (
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm font-semibold leading-6 text-amber-900">
                              This one-of-a-kind piece is held exclusively
                              for you while the timer is active.
                            </p>

                            <p className="mt-2 text-sm leading-6 text-amber-800">
                              Still browsing? Remove this piece from your
                              cart and save it to your wishlist instead,
                              so it is not held unnecessarily.
                            </p>

                            <Link
                              href={`/shop/${item.slug}`}
                              className="mt-3 inline-flex text-sm font-semibold text-[#5A2D2D] underline underline-offset-4 transition hover:text-[#4B2E2E]"
                            >
                              View product and add to wishlist
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-[#E8DDD3] bg-white p-7 shadow-sm lg:sticky lg:top-28 lg:p-8">
            <h2 className="font-serif text-3xl text-[#4B2E2E]">
              Order Summary
            </h2>

            <div className="mt-8 flex justify-between gap-5 text-[#7A6464]">
              <span>
                Subtotal
              </span>

              <span>
                {ratesLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2
                      size={15}
                      className="animate-spin"
                    />

                    Updating
                  </span>
                ) : (
                  formatPrice(
                    subtotal
                  )
                )}
              </span>
            </div>

            <div className="mt-4 flex justify-between gap-5 text-[#7A6464]">
              <span>
                Shipping
              </span>

              <span className="text-right">
                Calculated at
                checkout
              </span>
            </div>

            <div className="my-6 border-t border-[#E8D8C8]" />

            <div className="flex justify-between gap-5 text-xl font-semibold text-[#4B2E2E]">
              <span>
                Estimated Total
              </span>

              <span>
                {ratesLoading ? (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  formatPrice(
                    subtotal
                  )
                )}
              </span>
            </div>

            <div className="mt-4 rounded-2xl bg-[#F8F4EF] px-4 py-3 text-sm leading-6 text-[#8B6B5B]">
              Display currency:{" "}
              <span className="font-semibold text-[#5A2D2D]">
                {currency}
              </span>
              . Final payment and stored order totals remain based on
              INR values.
            </div>

            <p className="mt-4 text-sm leading-6 text-[#8B6B5B]">
              Shipping is based on your delivery country and final
              order value.
            </p>

            <button
              type="button"
              onClick={() =>
                void handleCheckout()
              }
              disabled={
                checkingOut ||
                ratesLoading
              }
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-[#5A2D2D] py-4 text-center font-semibold text-white transition hover:bg-[#4B2E2E] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkingOut ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />

                  Checking...
                </>
              ) : ratesLoading ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />

                  Updating Prices...
                </>
              ) : (
                <>
                  <ShieldCheck
                    size={19}
                  />

                  Proceed to Checkout
                </>
              )}
            </button>

            <Link
              href="/shop"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-[#5A2D2D] py-4 font-semibold text-[#5A2D2D] transition hover:bg-[#F8F4EF]"
            >
              <ArrowLeft
                size={18}
              />

              Continue Shopping
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}