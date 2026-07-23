"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";

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
};

export default function FeaturedProducts() {
  const { addToCart } = useCart();
  const { formatCurrency } = useCurrency();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [hoveredProduct, setHoveredProduct] =
    useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select(`
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
        stock
      `)
      .eq("active", true)
      .eq("featured", true)
      .order("created_at", {
        ascending: false,
      });

    if (!error && data) {
      setProducts(data as Product[]);
    }

    setLoading(false);
  }

  function handleAddToCart(
    product: Product
  ) {
    addToCart({
      id: product.id,
      slug: product.slug,
      name: product.name,
      image: product.image ?? "",
      price: product.price,
      quantity: 1,
    });
  }
  return (
    <section className="bg-[#F8F4EF] py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="uppercase tracking-[0.35em] text-sm text-[#8B6B5B]">
              Handpicked Collection
            </p>

            <h2 className="mt-4 font-serif text-5xl text-[#4B2E2E]">
              Featured Jewellery
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#7A6464]">
              Discover our most loved handcrafted
              jewellery, thoughtfully designed for timeless
              elegance and everyday luxury.
            </p>
          </div>

          <Link
            href="/shop"
            className="inline-flex rounded-full bg-[#5A2D2D] px-8 py-4 font-medium text-white transition hover:bg-[#472323]"
          >
            View All Collection
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-[520px] animate-pulse rounded-[32px] bg-white"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-[32px] border border-[#E8DDD3] bg-white p-16 text-center">
            <h3 className="font-serif text-3xl text-[#4B2E2E]">
              No Featured Products
            </h3>

            <p className="mt-4 text-[#7A6464]">
              Featured jewellery will appear here once
              products are added.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => {
              const displayImage =
                hoveredProduct === product.id &&
                product.image_1
                  ? product.image_1
                  : product.image;

              return (
                <article
                  key={product.id}
                  className="group overflow-hidden rounded-[32px] bg-white shadow-sm transition duration-300 hover:-translate-y-2 hover:shadow-xl"
                  onMouseEnter={() =>
                    setHoveredProduct(product.id)
                  }
                  onMouseLeave={() =>
                    setHoveredProduct(null)
                  }
                >
                  <Link href={`/shop/${product.slug}`}>
                    <div className="relative aspect-square overflow-hidden bg-[#F8F4EF]">
                      {displayImage ? (
                        <Image
                          src={displayImage}
                          alt={product.name}
                          fill
                          sizes="(max-width:768px) 100vw, 25vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#8B6B5B]">
                          No Image
                        </div>
                      )}

                      {product.bestseller && (
                        <span className="absolute left-4 top-4 rounded-full bg-[#5A2D2D] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
                          Bestseller
                        </span>
                      )}

                      <button
                        type="button"
                        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 backdrop-blur transition hover:bg-white"
                      >
                        <Heart size={20} />
                      </button>
                    </div>
                  </Link>

                  <div className="p-7">
                    <p className="text-sm uppercase tracking-[0.2em] text-[#8B6B5B]">
                      {product.category ?? "Jewellery"}
                    </p>

                    <Link href={`/shop/${product.slug}`}>
                      <h3 className="mt-3 font-serif text-3xl text-[#4B2E2E] transition group-hover:text-[#5A2D2D]">
                        {product.name}
                      </h3>
                    </Link>

                    <p className="mt-4 text-2xl font-semibold text-[#4B2E2E]">
                      {formatCurrency(product.price)}
                    </p>
                    {product.description && (
                      <p className="mt-4 line-clamp-2 leading-7 text-[#7A6464]">
                        {product.description}
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        handleAddToCart(product)
                      }
                      disabled={product.stock <= 0}
                      className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-[#5A2D2D] px-6 py-4 font-medium text-white transition hover:bg-[#472323] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShoppingBag size={20} />

                      {product.stock > 0
                        ? "Add to Cart"
                        : "Out of Stock"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}