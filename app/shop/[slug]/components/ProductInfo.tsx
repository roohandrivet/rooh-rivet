"use client";

import {
  useMemo,
  useState,
} from "react";
import {
  Check,
  Clock3,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";
import {
  useRouter,
} from "next/navigation";

import {
  useCart,
} from "@/context/CartContext";
import {
  useCurrency,
} from "@/context/CurrencyContext";
import {
  supabase,
} from "@/lib/supabase";
import WishlistButton from "@/components/WishlistButton";

interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  image_1: string | null;
  image_2: string | null;
  image_3: string | null;
  category: string | null;
  stock: number | null;
  featured: boolean | null;
  active: boolean;
  bestseller: boolean | null;
  reservation_enabled?:
    | boolean
    | null;
}

interface ProductInfoProps {
  product: Product;
}

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

export default function ProductInfo({
  product,
}: ProductInfoProps) {
  const router =
    useRouter();

  const {
    addToCart,
    getQuantity,
    increaseQuantity,
    decreaseQuantity,
    getReservationRemainingSeconds,
    reservationError,
    clearReservationError,
  } = useCart();

  const {
    formatPrice,
  } = useCurrency();

  const stock =
    Math.max(
      0,
      product.stock ?? 0
    );

  const reservationEnabled =
    product.reservation_enabled ===
    true;

  const inStock =
    product.active &&
    stock > 0;

  const quantityInCart =
    getQuantity(
      product.id
    );

  const reservationRemainingSeconds =
    getReservationRemainingSeconds(
      product.id
    );

  const hasActiveReservation =
    reservationEnabled &&
    quantityInCart > 0 &&
    reservationRemainingSeconds >
      0;

  const reachedStockLimit =
    reservationEnabled
      ? quantityInCart >= 1
      : quantityInCart >= stock;

  const [
    adding,
    setAdding,
  ] = useState(false);

  const [
    added,
    setAdded,
  ] = useState(false);

  const [
    localError,
    setLocalError,
  ] = useState("");

  const availabilityText =
    useMemo(() => {
      if (!product.active) {
        return "Unavailable";
      }

      if (!inStock) {
        return "Out of Stock";
      }

      if (
        reservationEnabled
      ) {
        return "One of a Kind";
      }

      if (stock <= 3) {
        return `Only ${stock} ${
          stock === 1
            ? "piece"
            : "pieces"
        } left`;
      }

      return "Ready to Ship";
    }, [
      inStock,
      product.active,
      reservationEnabled,
      stock,
    ]);

  async function handleAddToCart() {
    if (
      adding ||
      !inStock ||
      reachedStockLimit
    ) {
      return;
    }

    setAdding(true);
    setAdded(false);
    setLocalError("");
    clearReservationError();

    try {
      if (
        reservationEnabled
      ) {
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
            `/auth/login?redirect=${encodeURIComponent(
              `/shop/${product.slug}`
            )}`
          );

          return;
        }
      }

      const success =
        await addToCart({
          id: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          image:
            product.image ??
            "",
          quantity: 1,
          stock,
          reservationEnabled,
          reservedUntil:
            null,
        });

      if (!success) {
        return;
      }

      setAdded(true);

      window.setTimeout(
        () => {
          setAdded(false);
        },
        1800
      );
    } catch (
      addError
    ) {
      console.error(
        "Failed to add product:",
        addError
      );

      setLocalError(
        addError instanceof
          Error
          ? addError.message
          : "Unable to add this piece to your cart."
      );
    } finally {
      setAdding(false);
    }
  }

  function handleIncreaseQuantity() {
    setLocalError("");
    clearReservationError();

    increaseQuantity(
      product.id
    );
  }

  function handleDecreaseQuantity() {
    setLocalError("");
    clearReservationError();

    decreaseQuantity(
      product.id
    );
  }

  const displayedError =
    localError ||
    reservationError;

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="space-y-8">
        <div className="space-y-4">
          {product.category ? (
            <span className="inline-flex rounded-full bg-[#F8F4EF] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8B6B5B]">
              {product.category}
            </span>
          ) : null}

          <h1 className="font-serif text-4xl font-semibold text-[#4B2E2E]">
            {product.name}
          </h1>

          <p className="text-3xl font-bold text-[#5A2D2D]">
            {formatPrice(
              product.price
            )}
          </p>

          <div className="flex flex-wrap gap-3">
            {product.featured ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Featured
              </span>
            ) : null}

            {product.bestseller ? (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                Bestseller
              </span>
            ) : null}

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                inStock
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {availabilityText}
            </span>
          </div>
        </div>

        {reservationEnabled &&
        inStock ? (
          <div className="rounded-2xl border border-[#D9C8BC] bg-[#F8F4EF] p-5">
            <div className="flex items-start gap-3">
              <Clock3
                size={21}
                className="mt-0.5 shrink-0 text-[#5A2D2D]"
              />

              <div>
                <p className="font-semibold text-[#4B2E2E]">
                  One-of-a-kind piece
                </p>

                <p className="mt-2 text-sm leading-6 text-[#7A6464]">
                  Adding this piece to
                  your cart reserves it
                  exclusively for 30
                  minutes while you
                  complete checkout.
                </p>

                <p className="mt-3 text-sm font-medium leading-6 text-[#5A2D2D]">
                  Still browsing? Add
                  this piece to your
                  wishlist instead and
                  reserve it only when
                  you are ready to
                  complete checkout.
                </p>

                {hasActiveReservation ? (
                  <p className="mt-3 font-semibold text-[#5A2D2D]">
                    Reserved in your
                    cart ·{" "}
                    {formatRemainingTime(
                      reservationRemainingSeconds
                    )}{" "}
                    remaining
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-stone-200 bg-[#F8F4EF] p-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-stone-500">
                Stock Available
              </p>

              <p className="mt-2 text-lg font-semibold text-[#4B2E2E]">
                {stock}{" "}
                {stock === 1
                  ? "Piece"
                  : "Pieces"}
              </p>
            </div>

            <div>
              <p className="text-sm text-stone-500">
                In Your Cart
              </p>

              <p className="mt-2 text-lg font-semibold text-[#4B2E2E]">
                {quantityInCart}
              </p>
            </div>
          </div>
        </div>

        {product.description ? (
          <div>
            <h2 className="mb-3 font-serif text-xl text-[#4B2E2E]">
              Description
            </h2>

            <p className="leading-8 text-[#7A6464]">
              {
                product.description
              }
            </p>
          </div>
        ) : null}

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={
                handleDecreaseQuantity
              }
              disabled={
                quantityInCart === 0
              }
              className="rounded-xl border border-stone-300 p-3 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus size={18} />
            </button>

            <span className="min-w-10 text-center text-xl font-semibold text-[#4B2E2E]">
              {quantityInCart}
            </span>

            <button
              type="button"
              aria-label="Increase quantity"
              onClick={
                handleIncreaseQuantity
              }
              disabled={
                !inStock ||
                reachedStockLimit ||
                reservationEnabled
              }
              className="rounded-xl border border-stone-300 p-3 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() =>
                void handleAddToCart()
              }
              disabled={
                adding ||
                !inStock ||
                reachedStockLimit
              }
              className={`flex flex-1 items-center justify-center gap-3 rounded-2xl px-6 py-4 font-semibold transition ${
                adding ||
                !inStock ||
                reachedStockLimit
                  ? "cursor-not-allowed bg-stone-300 text-stone-600"
                  : "bg-[#5A2D2D] text-white hover:bg-[#4B2E2E]"
              }`}
            >
              {adding ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />

                  {reservationEnabled
                    ? "Reserving..."
                    : "Adding..."}
                </>
              ) : added ? (
                <>
                  <Check size={20} />

                  {reservationEnabled
                    ? "Piece Reserved"
                    : "Added to Cart"}
                </>
              ) : (
                <>
                  <ShoppingBag
                    size={20}
                  />

                  {reservationEnabled
                    ? "Reserve & Add to Cart"
                    : "Add to Cart"}
                </>
              )}
            </button>

            <WishlistButton
              productId={
                product.id
              }
              className="h-14 w-14 rounded-2xl border border-[#5A2D2D] bg-white shadow-none"
            />
          </div>
        </div>

        {displayedError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-medium text-red-700">
              {displayedError}
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-200 p-5">
            <h3 className="font-serif text-xl font-semibold text-[#4B2E2E]">
              Shipping
            </h3>

            <p className="mt-3 leading-7 text-stone-600">
              Shipping within India is
              ₹100, with complimentary
              shipping on orders of
              ₹999 or more.
              International shipping is
              ₹1,000 per piece, with
              50% off shipping on
              orders of ₹10,000 or
              more.
            </p>
          </div>

          <div className="p-5">
            <h3 className="font-serif text-xl font-semibold text-[#4B2E2E]">
              Returns
            </h3>

            <p className="mt-3 leading-7 text-stone-600">
              Eligible products can be
              returned within our
              return period provided
              they remain unworn and
              in their original
              packaging.
            </p>
          </div>
        </div>

        {reachedStockLimit &&
        inStock ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-medium text-amber-800">
              {reservationEnabled
                ? "This one-of-a-kind piece is already reserved in your cart."
                : "You already have the maximum available quantity of this product in your cart."}
            </p>
          </div>
        ) : null}

        {!inStock ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-medium text-red-700">
              This item is currently
              unavailable and cannot be
              added to your cart.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}