import Link from "next/link";
import {
  Clock3,
  Gift,
  Search,
  Sparkles,
  Truck,
} from "lucide-react";

import ProductGrid from "@/components/ProductGrid";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | string | null;
  image: string | null;
  featured: boolean | null;
  bestseller: boolean | null;
  category: string | null;
  stock: number | string | null;
  reservation_enabled: boolean | null;
  reserved_until: string | null;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  featured: boolean;
  bestseller: boolean;
  category: string;
  stock: number;
  reservation_enabled: boolean;
  reserved_until: string | null;
  currently_reserved: boolean;
};

type ShopCategory = {
  name: string;
  slug: string;
};

const categories: ShopCategory[] = [
  {
    name: "Necklaces",
    slug: "necklaces",
  },
  {
    name: "Earrings",
    slug: "earrings",
  },
  {
    name: "Bracelets",
    slug: "bracelets",
  },
  {
    name: "Rings",
    slug: "rings",
  },
];

function toNumber(
  value: number | string | null
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function isCurrentlyReserved(
  reservedUntil: string | null,
  currentTime: number
): boolean {
  if (!reservedUntil) {
    return false;
  }

  const expiresAt = new Date(
    reservedUntil
  ).getTime();

  return (
    !Number.isNaN(expiresAt) &&
    expiresAt > currentTime
  );
}

export default async function ShopPage() {
  const supabase = await createClient();

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
        featured,
        bestseller,
        category,
        stock,
        reservation_enabled,
        reserved_until
      `
    )
    .eq("active", true)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(
      "Failed to load shop products:",
      error
    );
  }

  const currentTime = Date.now();

  const products: Product[] = (
    (data ?? []) as ProductRow[]
  ).map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    description:
      product.description ?? "",
    price: Math.max(
      0,
      toNumber(product.price)
    ),
    image: product.image ?? "",
    featured:
      product.featured === true,
    bestseller:
      product.bestseller === true,
    category:
      product.category ?? "",
    stock: Math.max(
      0,
      Math.floor(
        toNumber(product.stock)
      )
    ),
    reservation_enabled:
      product.reservation_enabled ===
      true,
    reserved_until:
      product.reserved_until,
    currently_reserved:
      product.reservation_enabled ===
        true &&
      isCurrentlyReserved(
        product.reserved_until,
        currentTime
      ),
  }));

  return (
    <main className="min-h-screen bg-[#F8F4EF]">
      <section className="px-6 py-20 text-center sm:px-8 sm:py-24">
        <p className="text-sm uppercase tracking-[8px] text-[#8B6B5B]">
          Rooh &amp; Rivet
        </p>

        <h1 className="mt-6 font-serif text-5xl text-[#4B2E2E] sm:text-6xl">
          Our Collection
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#7A6464]">
          Discover handcrafted jewellery
          designed with elegance,
          sophistication and timeless
          beauty.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 sm:px-8">
        <form
          action="/search"
          method="get"
          className="flex items-center gap-4 rounded-full bg-white px-6 py-5 shadow-lg sm:px-8"
        >
          <Search
            className="shrink-0 text-[#8B6B5B]"
            size={22}
          />

          <input
            type="search"
            name="q"
            placeholder="Search jewellery..."
            aria-label="Search jewellery"
            className="w-full bg-transparent text-[#4B2E2E] outline-none placeholder:text-[#A79084]"
          />
        </form>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-6 sm:px-8">
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/shop"
            className="rounded-full bg-[#5A2D2D] px-8 py-3 text-[#F1DECA]"
          >
            All
          </Link>

          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/shop/category/${category.slug}`}
              className="rounded-full bg-white px-8 py-3 text-[#9A7048] transition hover:bg-[#5A2D2D] hover:text-[#F1DECA]"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700">
            Products could not be loaded.
            Please refresh the page.
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-[#E8DDD3] bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="font-serif text-3xl text-[#4B2E2E]">
              The collection is being
              prepared
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-[#7A6464]">
              New handcrafted pieces will
              appear here as soon as they
              become available.
            </p>
          </div>
        ) : (
          <ProductGrid
            products={products}
          />
        )}
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[8px] text-[#8B6B5B]">
              Why Shop With Us
            </p>

            <h2 className="mt-6 font-serif text-4xl text-[#4B2E2E] sm:text-5xl">
              Luxury In Every Detail
            </h2>

            <p className="mx-auto mt-6 max-w-3xl leading-8 text-[#7A6464]">
              We believe every piece of
              jewellery should feel timeless,
              elegant and unforgettable.
            </p>
          </div>

          <div className="mt-20 grid gap-10 md:grid-cols-3">
            <div className="rounded-3xl bg-[#F8F4EF] p-10 text-center shadow-lg">
              <Sparkles
                size={46}
                className="mx-auto text-[#5A2D2D]"
              />

              <h3 className="mt-6 font-serif text-3xl text-[#4B2E2E]">
                Premium Craftsmanship
              </h3>

              <p className="mt-6 leading-8 text-[#7A6464]">
                Every design is handcrafted
                with precision and care by
                skilled artisans.
              </p>
            </div>

            <div className="rounded-3xl bg-[#F8F4EF] p-10 text-center shadow-lg">
              <Truck
                size={46}
                className="mx-auto text-[#5A2D2D]"
              />

              <h3 className="mt-6 font-serif text-3xl text-[#4B2E2E]">
                Insured Shipping
              </h3>

              <p className="mt-6 leading-8 text-[#7A6464]">
                Every order is securely
                packaged and tracked, with
                complimentary shipping
                across India on orders of
                ₹999 or more.
              </p>
            </div>

            <div className="rounded-3xl bg-[#F8F4EF] p-10 text-center shadow-lg">
              <Gift
                size={46}
                className="mx-auto text-[#5A2D2D]"
              />

              <h3 className="mt-6 font-serif text-3xl text-[#4B2E2E]">
                Perfect Gifts
              </h3>

              <p className="mt-6 leading-8 text-[#7A6464]">
                Beautiful jewellery
                presented in premium gift
                boxes for every celebration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <div className="rounded-[40px] bg-[#5A2D2D] p-10 text-center text-white sm:p-16">
            <Clock3
              size={42}
              className="mx-auto text-[#E4C8AA]"
            />

            <p className="mt-6 text-sm uppercase tracking-[8px]">
              One Of A Kind
            </p>

            <h2 className="mt-6 font-serif text-4xl sm:text-5xl">
              Reserved Exclusively For You
            </h2>

            <p className="mx-auto mt-6 max-w-2xl leading-8 text-[#F5E7E0]">
              Selected one-of-a-kind pieces
              are held for 30 minutes after
              they are added to a signed-in
              customer&apos;s cart.
            </p>

            <Link
              href="/account"
              className="mt-10 inline-flex rounded-full bg-[#D9B38C] px-10 py-4 font-semibold text-[#4B2E2E] transition hover:bg-[#C79B73]"
            >
              Visit Your Account
            </Link>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="rounded-[40px] bg-gradient-to-r from-[#5A2D2D] to-[#7B4B4B] p-10 text-center text-white shadow-2xl sm:p-20">
            <h2 className="font-serif text-4xl sm:text-5xl">
              Discover Jewellery That
              Lasts Forever
            </h2>

            <p className="mx-auto mt-8 max-w-3xl text-lg leading-8 text-[#F5E7E0]">
              Explore handcrafted luxury
              jewellery designed to
              celebrate life&apos;s most
              meaningful moments.
            </p>

            <Link
              href="/contact"
              className="mt-12 inline-block rounded-full bg-white px-12 py-5 font-semibold text-[#5A2D2D] transition hover:bg-[#F8F4EF]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}