"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  Trash2,
} from "lucide-react";

import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";

export default function WishlistPage() {
  const {
    wishlist,
    removeFromWishlist,
  } = useWishlist();

  const { addToCart } =
    useCart();

  const { formatCurrency } =
    useCurrency();

  function handleMoveToCart(
    item: (typeof wishlist)[number]
  ) {
    if (!item.product) {
      return;
    }

    addToCart({
      id: item.product.id,
      slug: item.product.slug,
      name: item.product.name,
      price: item.product.price,
      image:
        item.product.image ??
        undefined,
      quantity: 1,
    });

    removeFromWishlist(
      item.product_id
    );
  }

  if (wishlist.length === 0) {
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
            className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#5A2D2D] px-8 py-4 font-semibold text-white"
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
          className="mb-8 inline-flex items-center gap-2 text-[#5A2D2D]"
        >
          <ArrowLeft size={18} />
          Back to Shop
        </Link>

        <div className="mb-12">
          <h1 className="font-serif text-5xl text-[#4B2E2E]">
            Wishlist
          </h1>

          <p className="mt-3 text-[#7A6464]">
            {wishlist.length} saved items
          </p>
        </div>


        <div className="space-y-8">
          {wishlist.map((item) => {

            if (!item.product) {
              return null;
            }

            return (
              <div
                key={item.id}
                className="rounded-3xl bg-white p-8 shadow-lg"
              >
                <div className="grid gap-8 md:grid-cols-[220px_1fr_auto] md:items-center">

                  <div className="overflow-hidden rounded-2xl bg-[#F8F4EF]">
                    <Image
                      src={
                        item.product.image ??
                        "/placeholder.jpg"
                      }
                      alt={item.product.name}
                      width={220}
                      height={220}
                      className="h-56 w-full object-cover"
                    />
                  </div>


                  <div>
                    <h2 className="font-serif text-3xl text-[#4B2E2E]">
                      {item.product.name}
                    </h2>

                    <p className="mt-3 text-2xl font-semibold text-[#8B6B5B]">
                      {formatCurrency(
                        item.product.price
                      )}
                    </p>

                    <Link
                      href={`/shop/${item.product.slug}`}
                      className="mt-5 inline-block text-[#5A2D2D] hover:underline"
                    >
                      View Product
                    </Link>
                  </div>


                  <div className="flex flex-col gap-4">

                    <button
                      type="button"
                      onClick={() =>
                        handleMoveToCart(item)
                      }
                      className="flex items-center justify-center gap-3 rounded-2xl bg-[#5A2D2D] px-8 py-4 font-semibold text-white"
                    >
                      <ShoppingBag size={20} />
                      Move To Cart
                    </button>


                    <button
                      type="button"
                      onClick={() =>
                        removeFromWishlist(
                          item.product_id
                        )
                      }
                      className="flex items-center justify-center gap-3 rounded-2xl border border-red-200 px-8 py-4 font-semibold text-red-600"
                    >
                      <Trash2 size={20} />
                      Remove
                    </button>

                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </main>
  );
}