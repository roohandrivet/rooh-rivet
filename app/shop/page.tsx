import Link from "next/link";
import { Search } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import ProductGrid from "@/components/ProductGrid";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  image: string;
  featured: boolean;
  category: string;
};

export default async function ShopPage() {
  const supabase =
    await createClient();

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
        category
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

  const products =
    (data ?? []) as Product[];

  return (
    <main className="min-h-screen bg-[#F8F4EF]">
      <section className="px-8 py-24 text-center">
        <p className="text-sm uppercase tracking-[8px] text-[#8B6B5B]">
          Rooh &amp; Rivet
        </p>

        <h1 className="mt-6 font-serif text-6xl text-[#4B2E2E]">
          Our Collection
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#7A6464]">
          Discover handcrafted jewellery
          designed with elegance,
          sophistication and timeless
          beauty.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-8">
        <div className="flex items-center gap-4 rounded-full bg-white px-8 py-5 shadow-lg">
          <Search
            className="text-[#8B6B5B]"
            size={22}
          />

          <input
            type="text"
            placeholder="Search jewellery..."
            className="w-full bg-transparent text-[#4B2E2E] outline-none"
          />
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-8">
        <div className="flex flex-wrap justify-center gap-4">
          <button className="rounded-full bg-[#5A2D2D] px-8 py-3 text-[#D8C4A8]">
            All
          </button>

          <button className="rounded-full bg-white px-8 py-3 text-[#D4B483] transition hover:bg-[#5A2D2D] hover:text-[#D8C4A8]">
            Necklaces
          </button>

          <button className="rounded-full bg-white px-8 py-3 text-[#D4B483] transition hover:bg-[#5A2D2D] hover:text-[#D8C4A8]">
            Earrings
          </button>

          <button className="rounded-full bg-white px-8 py-3 text-[#D4B483] transition hover:bg-[#5A2D2D] hover:text-[#D8C4A8]">
            Bracelets
          </button>

          <button className="rounded-full bg-white px-8 py-3 text-[#D4B483] transition hover:bg-[#5A2D2D] hover:text-[#D8C4A8]">
            Rings
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-8 py-20">
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700">
            Products could not be loaded.
            Please refresh the page.
          </div>
        ) : (
          <ProductGrid
            products={products}
          />
        )}
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[8px] text-[#8B6B5B]">
              Why Shop With Us
            </p>

            <h2 className="mt-6 font-serif text-5xl text-[#4B2E2E]">
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
              <div className="mb-6 text-5xl">
                ✨
              </div>

              <h3 className="font-serif text-3xl text-[#4B2E2E]">
                Premium Craftsmanship
              </h3>

              <p className="mt-6 leading-8 text-[#7A6464]">
                Every design is handcrafted
                with precision and care by
                skilled artisans.
              </p>
            </div>

            <div className="rounded-3xl bg-[#F8F4EF] p-10 text-center shadow-lg">
              <div className="mb-6 text-5xl">
                🚚
              </div>

              <h3 className="font-serif text-3xl text-[#4B2E2E]">
                Free Shipping
              </h3>

              <p className="mt-6 leading-8 text-[#7A6464]">
                Complimentary delivery
                across India with secure
                luxury packaging.
              </p>
            </div>

            <div className="rounded-3xl bg-[#F8F4EF] p-10 text-center shadow-lg">
              <div className="mb-6 text-5xl">
                💝
              </div>

              <h3 className="font-serif text-3xl text-[#4B2E2E]">
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
        <div className="mx-auto max-w-5xl px-8">
          <div className="rounded-[40px] bg-[#5A2D2D] p-16 text-center text-white">
            <p className="text-sm uppercase tracking-[8px]">
              Exclusive Access
            </p>

            <h2 className="mt-6 font-serif text-5xl">
              Join Our Community
            </h2>

            <p className="mx-auto mt-6 max-w-2xl leading-8 text-[#F5E7E0]">
              Be the first to discover new
              collections, exclusive
              launches and members-only
              offers.
            </p>

            <div className="mt-12 flex flex-col justify-center gap-4 md:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-full bg-white px-8 py-5 text-[#4B2E2E] outline-none md:w-[420px]"
              />

              <button className="rounded-full bg-[#D9B38C] px-10 py-5 font-semibold text-[#4B2E2E] transition hover:bg-[#C79B73]">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="rounded-[40px] bg-gradient-to-r from-[#5A2D2D] to-[#7B4B4B] p-20 text-center text-white shadow-2xl">
            <h2 className="font-serif text-5xl">
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