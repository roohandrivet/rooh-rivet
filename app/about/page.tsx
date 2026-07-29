import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Gem,
  Heart,
  Sparkles,
} from "lucide-react";

import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "About Us | Rooh & Rivet",
  description:
    "Discover the story, mission and vision behind Rooh & Rivet.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type AboutContent = {
  heading: string;
  story: string;
  mission: string;
  vision: string;
  brand_image_url: string;
};

const DEFAULT_CONTENT: AboutContent = {
  heading: "Our Story",
  story:
    "Rooh & Rivet was created from a love of jewellery that feels personal, meaningful and timeless. Every piece is thoughtfully selected to celebrate individuality and the moments that matter most.",
  mission:
    "To offer distinctive jewellery that combines considered design, enduring quality and effortless elegance.",
  vision:
    "To build a trusted jewellery house known for meaningful design, exceptional service and pieces that become part of your story.",
  brand_image_url: "",
};

export default async function AboutPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("site_content")
    .select("heading, story, mission, vision, brand_image_url")
    .eq("page", "about")
    .maybeSingle();

  if (error) {
    console.error("Failed to load About page content:", error);
  }

  const content: AboutContent = {
    heading: data?.heading?.trim() || DEFAULT_CONTENT.heading,
    story: data?.story?.trim() || DEFAULT_CONTENT.story,
    mission: data?.mission?.trim() || DEFAULT_CONTENT.mission,
    vision: data?.vision?.trim() || DEFAULT_CONTENT.vision,
    brand_image_url:
      data?.brand_image_url?.trim() || DEFAULT_CONTENT.brand_image_url,
  };

  return (
    <main className="bg-[#F8F4EF] text-[#4B2E2E]">
      <section className="relative overflow-hidden border-b border-[#E8DED2]">
        <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#E8D7CB]/50 blur-3xl" />
        <div className="absolute -right-16 bottom-0 h-80 w-80 rounded-full bg-[#F0DED5]/60 blur-3xl" />

        <div className="relative mx-auto grid min-h-[620px] max-w-7xl items-center gap-14 px-6 py-24 lg:grid-cols-2 lg:px-10">
          <div>
            <p className="text-sm uppercase tracking-[0.36em] text-[#8B6B5B]">
              The House of Rooh &amp; Rivet
            </p>

            <h1 className="mt-7 font-serif text-6xl leading-tight md:text-7xl">
              {content.heading}
            </h1>

            <div className="mt-8 max-w-2xl whitespace-pre-line text-lg leading-9 text-[#725D59]">
              {content.story}
            </div>

            <Link
              href="/shop"
              className="mt-10 inline-flex items-center gap-3 rounded-full bg-[#5A2D2D] px-8 py-4 font-medium text-white transition hover:bg-[#432121]"
            >
              Explore the Collection
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="relative">
            <div className="absolute -inset-5 rounded-[44px] border border-[#DCCDC3]" />

            <div className="relative aspect-[4/5] overflow-hidden rounded-[36px] bg-[#EEE3DA] shadow-xl">
              {content.brand_image_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={content.brand_image_url}
                    alt="Rooh & Rivet brand story"
                    className="h-full w-full object-cover"
                  />
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-8 text-center">
                  <Gem
                    size={64}
                    strokeWidth={1.2}
                    className="text-[#8B6B5B]"
                  />
                  <p className="mt-6 font-serif text-3xl">
                    Meaningful jewellery, thoughtfully chosen.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-2">
          <article className="rounded-[32px] border border-[#E7DBD1] bg-white p-9 shadow-sm md:p-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4E8E1]">
              <Heart className="text-[#5A2D2D]" />
            </div>
            <p className="mt-8 text-sm uppercase tracking-[0.3em] text-[#8B6B5B]">
              Our Mission
            </p>
            <p className="mt-5 whitespace-pre-line font-serif text-3xl leading-relaxed text-[#4B2E2E]">
              {content.mission}
            </p>
          </article>

          <article className="rounded-[32px] border border-[#E7DBD1] bg-[#5A2D2D] p-9 text-white shadow-sm md:p-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
              <Sparkles />
            </div>
            <p className="mt-8 text-sm uppercase tracking-[0.3em] text-[#E6CAC0]">
              Our Vision
            </p>
            <p className="mt-5 whitespace-pre-line font-serif text-3xl leading-relaxed">
              {content.vision}
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-[#E8DED2] bg-white">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-[#8B6B5B]">
            Made for Your Story
          </p>
          <h2 className="mt-5 font-serif text-5xl leading-tight">
            Find the piece that feels like you.
          </h2>
          <Link
            href="/shop"
            className="mt-9 inline-flex items-center gap-3 rounded-full bg-[#5A2D2D] px-9 py-4 font-medium text-white transition hover:bg-[#432121]"
          >
            Shop Rooh &amp; Rivet
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}