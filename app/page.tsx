import Image from "next/image";
import Link from "next/link";

import FeaturedProducts from "@/components/FeaturedProducts";
import FeaturedReviews from "@/components/FeaturedReviews";
import InstagramGallery from "@/components/InstagramGallery";

export default function HomePage() {
  return (
    <main className="bg-[#F8F4EF]">
      {/* ================= HERO ================= */}

      <section className="mx-auto max-w-7xl px-8 py-24">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          <div>
            <p className="text-sm uppercase tracking-[8px] text-[#8B6B5B]">
              Luxury Handcrafted Jewellery
            </p>

            <h1 className="mt-8 font-serif text-6xl leading-tight text-[#4B2E2E] lg:text-7xl">
              Jewellery
              <br />
              That Tells
              <br />
              Your Story.
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-9 text-[#7A6464]">
              Discover timeless handcrafted jewellery designed
              with elegance, passion and craftsmanship. Every
              Rooh & Rivet piece is created to celebrate life's
              most meaningful moments.
            </p>

            <div className="mt-12 flex flex-wrap gap-5">
              <Link
                href="/shop"
                className="rounded-full bg-[#5A2D2D] px-10 py-5 text-white transition duration-300 hover:bg-[#3E1F1F]"
              >
                Shop Collection
              </Link>

              <Link
                href="/about"
                className="rounded-full border border-[#5A2D2D] px-10 py-5 text-[#5A2D2D] transition duration-300 hover:bg-[#5A2D2D] hover:text-white"
              >
                Our Story
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8">
              <div>
                <h3 className="text-4xl font-bold text-[#4B2E2E]">
                  5K+
                </h3>

                <p className="mt-2 text-sm text-[#8B6B5B]">
                  Happy Customers
                </p>
              </div>

              <div>
                <h3 className="text-4xl font-bold text-[#4B2E2E]">
                  100%
                </h3>

                <p className="mt-2 text-sm text-[#8B6B5B]">
                  Handmade
                </p>
              </div>

              <div>
                <h3 className="text-4xl font-bold text-[#4B2E2E]">
                  ★4.9
                </h3>

                <p className="mt-2 text-sm text-[#8B6B5B]">
                  Customer Rating
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <Image
              src="/hero.jpg"
              alt="Luxury Jewellery"
              width={900}
              height={1000}
              priority
              className="rounded-[42px] object-cover shadow-2xl"
            />

            <div className="absolute -bottom-10 -left-10 rounded-3xl bg-white p-8 shadow-2xl">
              <h3 className="font-serif text-2xl text-[#4B2E2E]">
                100%
              </h3>

              <p className="mt-2 text-[#8B6B5B]">
                Handcrafted
              </p>
            </div>

            <div className="absolute -right-10 top-10 rounded-3xl bg-white p-8 shadow-2xl">
              <h3 className="font-serif text-2xl text-[#4B2E2E]">
                Premium
              </h3>

              <p className="mt-2 text-[#8B6B5B]">
                Quality Materials
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURED PRODUCTS ================= */}

      <FeaturedProducts />

      {/* ================= BRAND STORY ================= */}

      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-20 px-8 lg:grid-cols-2">
          <div className="relative">
            <Image
              src="/brand-story.jpg"
              alt="Rooh & Rivet Story"
              width={800}
              height={900}
              className="rounded-[40px] object-cover shadow-xl"
            />
          </div>

          <div>
            <p className="text-sm uppercase tracking-[8px] text-[#8B6B5B]">
              Our Story
            </p>

            <h2 className="mt-6 font-serif text-5xl text-[#4B2E2E]">
              Crafted to Celebrate Every Moment
            </h2>

            <p className="mt-8 leading-9 text-[#7A6464]">
              At Rooh & Rivet, every piece begins with a story.
              Inspired by heritage craftsmanship and refined for
              modern elegance, our jewellery is created to become
              part of your life's most cherished memories.
            </p>

            <p className="mt-6 leading-9 text-[#7A6464]">
              Every necklace, ring and bracelet is thoughtfully
              handcrafted using premium materials, timeless
              designs and exceptional attention to detail,
              ensuring beauty that lasts for generations.
            </p>

            <Link
              href="/about"
              className="mt-10 inline-flex rounded-full bg-[#5A2D2D] px-10 py-5 text-white transition hover:bg-[#472323]"
            >
              Discover Our Story
            </Link>
          </div>
        </div>
      </section>
            {/* ================= WHY CHOOSE US ================= */}

            <section className="py-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[8px] text-[#8B6B5B]">
              Why Choose Us
            </p>

            <h2 className="mt-6 font-serif text-5xl text-[#4B2E2E]">
              Crafted With Passion
            </h2>

            <p className="mx-auto mt-6 max-w-3xl leading-8 text-[#7A6464]">
              Every Rooh & Rivet piece is thoughtfully
              handcrafted using premium materials, timeless
              designs and exceptional attention to detail.
            </p>
          </div>

          <div className="mt-20 grid gap-10 md:grid-cols-3">
            <div className="rounded-[32px] bg-white p-10 text-center shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mb-8 text-5xl">💎</div>

              <h3 className="font-serif text-3xl text-[#4B2E2E]">
                Premium Quality
              </h3>

              <p className="mt-6 leading-8 text-[#7A6464]">
                Carefully selected premium materials ensure
                exceptional quality, durability and timeless
                elegance in every handcrafted jewellery piece.
              </p>
            </div>

            <div className="rounded-[32px] bg-white p-10 text-center shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mb-8 text-5xl">🤍</div>

              <h3 className="font-serif text-3xl text-[#4B2E2E]">
                Handmade
              </h3>

              <p className="mt-6 leading-8 text-[#7A6464]">
                Every design is individually handcrafted by
                skilled artisans with remarkable attention to
                detail and generations of craftsmanship.
              </p>
            </div>

            <div className="rounded-[32px] bg-white p-10 text-center shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mb-8 text-5xl">🎁</div>

              <h3 className="font-serif text-3xl text-[#4B2E2E]">
                Luxury Packaging
              </h3>

              <p className="mt-6 leading-8 text-[#7A6464]">
                Beautifully presented in premium gift boxes,
                making every Rooh & Rivet piece perfect for
                celebrating life's special moments.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURED REVIEWS ================= */}

      <FeaturedReviews />

      {/* ================= INSTAGRAM GALLERY ================= */}

      <InstagramGallery />

      {/* ================= NEWSLETTER ================= */}

      <section className="py-24">
        <div className="mx-auto max-w-5xl px-8">
          <div className="rounded-[40px] bg-[#5A2D2D] p-16 text-center text-white">
            <p className="text-sm uppercase tracking-[8px]">
              Stay Connected
            </p>

            <h2 className="mt-6 font-serif text-5xl">
              Join Our Newsletter
            </h2>

            <p className="mx-auto mt-6 max-w-2xl leading-8 text-[#F5E7E0]">
              Be the first to discover new collections,
              exclusive launches and special offers crafted
              exclusively for our community.
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
            {/* ================= CALL TO ACTION ================= */}

            <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-8">
          <div className="overflow-hidden rounded-[40px] bg-gradient-to-r from-[#4B2E2E] to-[#6B4138]">
            <div className="grid items-center gap-12 px-12 py-16 lg:grid-cols-2 lg:px-20">
              <div>
                <p className="text-sm uppercase tracking-[8px] text-[#E5CDBD]">
                  Rooh & Rivet
                </p>

                <h2 className="mt-6 font-serif text-5xl leading-tight text-white">
                  Discover Jewellery
                  <br />
                  That Lasts Forever
                </h2>

                <p className="mt-8 max-w-xl leading-8 text-[#F3E6DF]">
                  Whether you're celebrating a milestone,
                  gifting someone special or adding timeless
                  elegance to your collection, find handcrafted
                  jewellery designed to be treasured for years
                  to come.
                </p>

                <div className="mt-10 flex flex-wrap gap-5">
                  <Link
                    href="/shop"
                    className="rounded-full bg-white px-10 py-5 font-medium text-[#4B2E2E] transition hover:scale-105"
                  >
                    Shop Collection
                  </Link>

                  <Link
                    href="/contact"
                    className="rounded-full border border-white px-10 py-5 font-medium text-white transition hover:bg-white hover:text-[#4B2E2E]"
                  >
                    Contact Us
                  </Link>
                </div>
              </div>

              <div className="relative">
                <Image
                  src="/cta.jpg"
                  alt="Luxury Jewellery"
                  width={700}
                  height={700}
                  className="rounded-[32px] object-cover shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}