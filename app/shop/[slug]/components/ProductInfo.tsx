"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Minus,
  Plus,
  ShoppingBag,
} from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
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
}

interface ProductInfoProps {
  product: Product;
}

export default function ProductInfo({
  product,
}: ProductInfoProps) {
  const {
    addToCart,
    getQuantity,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();

  const { formatPrice } =
    useCurrency();

  const stock =
    product.stock ?? 0;

  const inStock =
    stock > 0;

  const quantityInCart =
    getQuantity(product.id);

  const reachedStockLimit =
    quantityInCart >= stock;

  const [added, setAdded] =
    useState(false);

  const availabilityText =
    useMemo(() => {
      if (!inStock) {
        return "Out of Stock";
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
      stock,
    ]);

  function handleAddToCart() {
    addToCart({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image:
        product.image ?? "",
      quantity: 1,
    });

    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 1800);
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="space-y-8">
        <div className="space-y-4">
          {product.category && (
            <span className="inline-flex rounded-full bg-[#F8F4EF] px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#8B6B5B]">
              {product.category}
            </span>
          )}

          <h1 className="font-serif text-4xl font-semibold text-[#4B2E2E]">
            {product.name}
          </h1>

          <p className="text-3xl font-bold text-[#5A2D2D]">
            {formatPrice(
              product.price
            )}
          </p>

          <div className="flex flex-wrap gap-3">
            {product.featured && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                Featured
              </span>
            )}

            {product.bestseller && (
              <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                Bestseller
              </span>
            )}

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

        {product.description && (
          <div>
            <h2 className="mb-3 font-serif text-xl text-[#4B2E2E]">
              Description
            </h2>

            <p className="leading-8 text-[#7A6464]">
              {product.description}
            </p>
          </div>
        )}

        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                decreaseQuantity(
                  product.id
                )
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
              onClick={() =>
                increaseQuantity(
                  product.id
                )
              }
              disabled={
                !inStock ||
                reachedStockLimit
              }
              className="rounded-xl border border-stone-300 p-3 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={
                handleAddToCart
              }
              disabled={
                !inStock ||
                reachedStockLimit
              }
              className={`flex flex-1 items-center justify-center gap-3 rounded-2xl px-6 py-4 font-semibold transition ${
                !inStock ||
                reachedStockLimit
                  ? "cursor-not-allowed bg-stone-300 text-stone-600"
                  : "bg-[#5A2D2D] text-white hover:bg-[#4B2E2E]"
              }`}
            >
              {added ? (
                <>
                  <Check size={20} />
                  Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag size={20} />
                  Add to Cart
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
        <div className="rounded-2xl border border-stone-200 bg-white">
          <div className="border-b border-stone-200 p-5">
            <h3 className="font-serif text-xl font-semibold text-[#4B2E2E]">
              Shipping
            </h3>

            <p className="mt-3 leading-7 text-stone-600">
              Complimentary insured worldwide
              shipping. Every order is packed
              in premium Rooh &amp; Rivet
              packaging and dispatched with
              secure tracking.
            </p>
          </div>

          <div className="p-5">
            <h3 className="font-serif text-xl font-semibold text-[#4B2E2E]">
              Returns
            </h3>

            <p className="mt-3 leading-7 text-stone-600">
              Eligible products can be
              returned within our return
              period provided they remain
              unworn and in their original
              packaging.
            </p>
          </div>
        </div>

        {reachedStockLimit &&
          inStock && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-medium text-amber-800">
                You already have the maximum
                available quantity of this
                product in your cart.
              </p>
            </div>
          )}

        {!inStock && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-medium text-red-700">
              This item is currently out of
              stock and cannot be added to
              your cart.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}