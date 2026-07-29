import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import FeaturedProducts from "@/components/FeaturedProducts";
import FeaturedReviews from "@/components/FeaturedReviews";
import InstagramGallery from "@/components/InstagramGallery";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type SiteContentRow = {
  page: string | null;

  hero_title?: string | null;
  hero_subtitle?: string | null;
  hero_button_text?: string | null;
  hero_button_link?: string | null;
  featured_heading?: string | null;
  featured_description?: string | null;

  heading?: string | null;
  story?: string | null;
  mission?: string | null;
  vision?: string | null;
  brand_image_url?: string | null;

  address?: string | null;
  phone?: string | null;
  email?: string | null;
  business_hours?: string | null;
  whatsapp_url?: string | null;
};

type HomeContent = {
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  hero_button_link: string;
  featured_heading: string;
  featured_description: string;
};

type AboutContent = {
  heading: string;
  story: string;
  mission: string;
  vision: string;
  brand_image_url: string;
};

type ContactContent = {
  address: string;
  phone: string;
  email: string;
  business_hours: string;
  whatsapp_url: string;
};

const DEFAULT_HOME_CONTENT: HomeContent = {
  hero_title: "Jewellery\nThat Tells\nYour Story.",
  hero_subtitle:
    "Discover timeless handcrafted jewellery designed with elegance, passion and craftsmanship. Every Rooh & Rivet piece is created to celebrate life's most meaningful moments.",
  hero_button_text: "Shop Collection",
  hero_button_link: "/shop",
  featured_heading: "Featured Jewellery",
  featured_description:
    "Discover our most loved handcrafted jewellery, thoughtfully designed for timeless elegance and everyday luxury.",
};

const DEFAULT_ABOUT_CONTENT: AboutContent = {
  heading: "Crafted to Celebrate Every Moment",
  story:
    "At Rooh & Rivet, every piece begins with a story. Inspired by heritage craftsmanship and refined for modern elegance, our jewellery is created to become part of your life's most cherished memories.",
  mission:
    "To offer distinctive jewellery that combines considered design, enduring quality and effortless elegance.",
  vision:
    "To build a trusted jewellery house known for meaningful design, exceptional service and pieces that become part of your story.",
  brand_image_url: "",
};

const DEFAULT_CONTACT_CONTENT: ContactContent = {
  address: "",
  phone: "",
  email: "hello@roohandrivet.com",
  business_hours: "Monday–Saturday, 10:00 AM–6:00 PM",
  whatsapp_url: "",
};

function clean(
  value: string | null | undefined,
  fallback: string
): string {
  const trimmed = value?.trim();

  return trimmed || fallback;
}

function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}

export default async function HomePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .in("page", ["home", "about", "contact"]);

  if (error) {
    console.error(
      "Failed to load homepage, About and Contact content:",
      error
    );
  }

  const rows = (data ?? []) as SiteContentRow[];

  const homeRow = rows.find(
    (row) => row.page === "home"
  );

  const aboutRow = rows.find(
    (row) => row.page === "about"
  );

  const contactRow = rows.find(
    (row) => row.page === "contact"
  );

  const homeContent: HomeContent = {
    hero_title: clean(
      homeRow?.hero_title,
      DEFAULT_HOME_CONTENT.hero_title
    ),
    hero_subtitle: clean(
      homeRow?.hero_subtitle,
      DEFAULT_HOME_CONTENT.hero_subtitle
    ),
    hero_button_text: clean(
      homeRow?.hero_button_text,
      DEFAULT_HOME_CONTENT.hero_button_text
    ),
    hero_button_link: clean(
      homeRow?.hero_button_link,
      DEFAULT_HOME_CONTENT.hero_button_link
    ),
    featured_heading: clean(
      homeRow?.featured_heading,
      DEFAULT_HOME_CONTENT.featured_heading
    ),
    featured_description: clean(
      homeRow?.featured_description,
      DEFAULT_HOME_CONTENT.featured_description
    ),
  };

  const aboutContent: AboutContent = {
    heading: clean(
      aboutRow?.heading,
      DEFAULT_ABOUT_CONTENT.heading
    ),
    story: clean(
      aboutRow?.story,
      DEFAULT_ABOUT_CONTENT.story
    ),
    mission: clean(
      aboutRow?.mission,
      DEFAULT_ABOUT_CONTENT.mission
    ),
    vision: clean(
      aboutRow?.vision,
      DEFAULT_ABOUT_CONTENT.vision
    ),
    brand_image_url: clean(
      aboutRow?.brand_image_url,
      DEFAULT_ABOUT_CONTENT.brand_image_url
    ),
  };

  const contactContent: ContactContent = {
    address: clean(
      contactRow?.address,
      DEFAULT_CONTACT_CONTENT.address
    ),
    phone: clean(
      contactRow?.phone,
      DEFAULT_CONTACT_CONTENT.phone
    ),
    email: clean(
      contactRow?.email,
      DEFAULT_CONTACT_CONTENT.email
    ),
    business_hours: clean(
      contactRow?.business_hours,
      DEFAULT_CONTACT_CONTENT.business_hours
    ),
    whatsapp_url: clean(
      contactRow?.whatsapp_url,
      DEFAULT_CONTACT_CONTENT.whatsapp_url
    ),
  };

  const hasContactDetails =
    Boolean(contactContent.email) ||
    Boolean(contactContent.phone) ||
    Boolean(contactContent.address);

  return (
    <main className="bg-[#F8F4EF]">
      {/* ================= HERO ================= */}

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:py-24">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <div>
            <p className="text-sm uppercase tracking-[0.42em] text-[#8B6B5B]">
              Luxury Handcrafted Jewellery
            </p>

            <h1 className="mt-8 whitespace-pre-line font-serif text-5xl leading-tight text-[#4B2E2E] sm:text-6xl lg:text-7xl">
              {homeContent.hero_title}
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-9 text-[#7A6464]">
              {homeContent.hero_subtitle}
            </p>

            <div className="mt-12 flex flex-wrap gap-5">
              <Link
                href={homeContent.hero_button_link}
                className="rounded-full bg-[#5A2D2D] px-10 py-5 text-white transition duration-300 hover:bg-[#3E1F1F]"
              >
                {homeContent.hero_button_text}
              </Link>

              <Link
                href="/about"
                className="rounded-full border border-[#5A2D2D] px-10 py-5 text-[#5A2D2D] transition duration-300 hover:bg-[#5A2D2D] hover:text-white"
              >
                Our Story
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-5 sm:gap-8">
              <div>
                <h3 className="text-3xl font-bold text-[#4B2E2E] sm:text-4xl">
                  5K+
                </h3>

                <p className="mt-2 text-sm text-[#8B6B5B]">
                  Happy Customers
                </p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-[#4B2E2E] sm:text-4xl">
                  100%
                </h3>

                <p className="mt-2 text-sm text-[#8B6B5B]">
                  Handmade
                </p>
              </div>

              <div>
                <h3 className="text-3xl font-bold text-[#4B2E2E] sm:text-4xl">
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
              alt="Luxury jewellery"
              width={900}
              height={1000}
              priority
              className="w-full rounded-[42px] object-cover shadow-2xl"
            />

            <div className="absolute -bottom-8 left-4 rounded-3xl bg-white p-6 shadow-2xl sm:-left-8 sm:p-8">
              <h3 className="font-serif text-2xl text-[#4B2E2E]">
                100%
              </h3>

              <p className="mt-2 text-[#8B6B5B]">
                Handcrafted
              </p>
            </div>

            <div className="absolute right-4 top-8 rounded-3xl bg-white p-6 shadow-2xl sm:-right-8 sm:p-8">
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

      <FeaturedProducts
        heading={homeContent.featured_heading}
        description={homeContent.featured_description}
      />

      {/* ================= ABOUT — FROM ADMIN ================= */}

      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 sm:px-8 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="absolute -inset-4 rounded-[44px] border border-[#E3D5CB]" />

            <div className="relative aspect-[4/5] overflow-hidden rounded-[40px] bg-[#EEE3DA] shadow-xl">
              {aboutContent.brand_image_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={aboutContent.brand_image_url}
                    alt="Rooh & Rivet jewellery craftsmanship"
                    className="h-full w-full object-cover"
                  />
                </>
              ) : (
                <Image
                  src="/brand-story.jpg"
                  alt="Rooh & Rivet story"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.42em] text-[#8B6B5B]">
              Our Story
            </p>

            <h2 className="mt-6 font-serif text-5xl leading-tight text-[#4B2E2E]">
              {aboutContent.heading}
            </h2>

            <div className="mt-8 whitespace-pre-line text-lg leading-9 text-[#7A6464]">
              {aboutContent.story}
            </div>

            <Link
              href="/about"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#5A2D2D] px-10 py-5 text-white transition hover:bg-[#472323]"
            >
              Discover Our Story
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= MISSION & VISION — FROM ADMIN ================= */}

      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="text-center">
            <p className="text-sm uppercase tracking-[0.42em] text-[#8B6B5B]">
              Why Choose Us
            </p>

            <h2 className="mt-6 font-serif text-5xl text-[#4B2E2E]">
              Crafted With Purpose
            </h2>

            <p className="mx-auto mt-6 max-w-3xl leading-8 text-[#7A6464]">
              Every Rooh & Rivet piece is thoughtfully selected
              with timeless design, meaningful detail and lasting
              quality in mind.
            </p>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            <article className="rounded-[32px] bg-white p-9 shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mb-7 text-5xl">
                💎
              </div>

              <h3 className="font-serif text-3xl text-[#4B2E2E]">
                Premium Quality
              </h3>

              <p className="mt-6 leading-8 text-[#7A6464]">
                Carefully selected materials and thoughtful
                finishing create jewellery designed for enduring
                elegance.
              </p>
            </article>

            <article className="rounded-[32px] bg-white p-9 shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mb-7 text-5xl">
                🤍
              </div>

              <h3 className="font-serif text-3xl text-[#4B2E2E]">
                Our Mission
              </h3>

              <p className="mt-6 whitespace-pre-line leading-8 text-[#7A6464]">
                {aboutContent.mission}
              </p>
            </article>

            <article className="rounded-[32px] bg-[#5A2D2D] p-9 text-white shadow-lg transition duration-300 hover:-translate-y-2 hover:shadow-2xl">
              <div className="mb-7 text-5xl">
                ✨
              </div>

              <h3 className="font-serif text-3xl">
                Our Vision
              </h3>

              <p className="mt-6 whitespace-pre-line leading-8 text-[#F3E6DF]">
                {aboutContent.vision}
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ================= FEATURED REVIEWS ================= */}

      <FeaturedReviews />

      {/* ================= INSTAGRAM GALLERY ================= */}

      <InstagramGallery />

      {/* ================= NEWSLETTER ================= */}

      <section className="py-24">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <div className="rounded-[40px] bg-[#5A2D2D] p-10 text-center text-white sm:p-16">
            <p className="text-sm uppercase tracking-[0.42em]">
              Stay Connected
            </p>

            <h2 className="mt-6 font-serif text-5xl">
              Join Our Newsletter
            </h2>

            <p className="mx-auto mt-6 max-w-2xl leading-8 text-[#F5E7E0]">
              Be the first to discover new collections, exclusive
              launches and special offers crafted exclusively for
              our community.
            </p>

            <div className="mt-12 flex flex-col justify-center gap-4 md:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email address"
                className="w-full rounded-full bg-white px-8 py-5 text-[#4B2E2E] outline-none md:w-[420px]"
              />

              <button
                type="button"
                className="rounded-full bg-[#D9B38C] px-10 py-5 font-semibold text-[#4B2E2E] transition hover:bg-[#C79B73]"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CONTACT — FROM ADMIN ================= */}

      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="overflow-hidden rounded-[40px] bg-gradient-to-r from-[#4B2E2E] to-[#6B4138]">
            <div className="grid items-center gap-12 px-8 py-14 sm:px-12 lg:grid-cols-2 lg:px-20 lg:py-16">
              <div>
                <p className="text-sm uppercase tracking-[0.42em] text-[#E5CDBD]">
                  Contact Rooh & Rivet
                </p>

                <h2 className="mt-6 font-serif text-5xl leading-tight text-white">
                  We Would Love
                  <br />
                  to Hear From You
                </h2>

                <p className="mt-8 max-w-xl leading-8 text-[#F3E6DF]">
                  Speak with us about a piece, an order or anything
                  else you need. Our team will be happy to help.
                </p>

                <div className="mt-9 space-y-4 text-[#F8ECE7]">
                  {contactContent.email ? (
                    <a
                      href={`mailto:${contactContent.email}`}
                      className="flex items-start gap-3 transition hover:text-white"
                    >
                      <Mail
                        size={20}
                        className="mt-1 shrink-0 text-[#E5CDBD]"
                      />
                      <span className="break-all">
                        {contactContent.email}
                      </span>
                    </a>
                  ) : null}

                  {contactContent.phone ? (
                    <a
                      href={phoneHref(contactContent.phone)}
                      className="flex items-start gap-3 transition hover:text-white"
                    >
                      <Phone
                        size={20}
                        className="mt-1 shrink-0 text-[#E5CDBD]"
                      />
                      <span>{contactContent.phone}</span>
                    </a>
                  ) : null}

                  {contactContent.address ? (
                    <div className="flex items-start gap-3">
                      <MapPin
                        size={20}
                        className="mt-1 shrink-0 text-[#E5CDBD]"
                      />
                      <span className="whitespace-pre-line">
                        {contactContent.address}
                      </span>
                    </div>
                  ) : null}

                  {contactContent.business_hours ? (
                    <div className="flex items-start gap-3">
                      <Clock3
                        size={20}
                        className="mt-1 shrink-0 text-[#E5CDBD]"
                      />
                      <span className="whitespace-pre-line">
                        {contactContent.business_hours}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mt-10 flex flex-wrap gap-5">
                  <Link
                    href="/contact"
                    className="rounded-full bg-white px-10 py-5 font-medium text-[#4B2E2E] transition hover:scale-105"
                  >
                    Contact Us
                  </Link>

                  {contactContent.whatsapp_url ? (
                    <a
                      href={contactContent.whatsapp_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white px-9 py-5 font-medium text-white transition hover:bg-white hover:text-[#4B2E2E]"
                    >
                      <MessageCircle size={19} />
                      WhatsApp
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="relative">
                <div className="aspect-square overflow-hidden rounded-[32px] bg-[#EEE3DA] shadow-2xl">
                  {aboutContent.brand_image_url ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={aboutContent.brand_image_url}
                        alt="Rooh & Rivet jewellery"
                        className="h-full w-full object-cover"
                      />
                    </>
                  ) : (
                    <Image
                      src="/hero.jpg"
                      alt="Luxury jewellery"
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  )}
                </div>

                {hasContactDetails ? (
                  <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-5 text-[#4B2E2E] shadow-xl backdrop-blur">
                    <p className="font-serif text-xl">
                      Personal assistance, whenever you need it.
                    </p>

                    <p className="mt-2 text-sm leading-6 text-[#7A6464]">
                      Visit the Contact page for every available
                      way to reach Rooh & Rivet.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}