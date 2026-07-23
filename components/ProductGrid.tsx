"use client";

import Image from "next/image";
import Link from "next/link";

import WishlistButton from "@/components/WishlistButton";

type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
};

type ProductGridProps = {
  products: Product[];
};

export default function ProductGrid({
  products,
}: ProductGridProps) {
  if (!products || products.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
        <h2 className="font-serif text-3xl text-[#4B2E2E]">
          No Products Found
        </h2>

        <p className="mt-3 text-[#7A6464]">
          We are adding new handcrafted pieces soon.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <div
          key={product.id}
          className="group relative overflow-hidden rounded-3xl bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
        >
          <div className="absolute right-5 top-5 z-10">
            <WishlistButton
              productId={product.id}
            />
          </div>

          <Link href={`/shop/${product.slug}`}>
            <div className="overflow-hidden bg-[#F8F4EF]">
              <Image
                src={
                  product.image ||
                  "/placeholder.jpg"
                }
                alt={product.name}
                width={500}
                height={500}
                className="h-[350px] w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>

            <div className="p-6">
              <h3 className="font-serif text-2xl text-[#4B2E2E]">
                {product.name}
              </h3>

              <p className="mt-3 text-xl font-semibold text-[#8B6B5B]">
                ₹
                {product.price.toLocaleString(
                  "en-IN"
                )}
              </p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}