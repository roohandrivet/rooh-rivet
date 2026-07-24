import {
  notFound,
} from "next/navigation";
import type {
  Metadata,
} from "next";
import Link from "next/link";

import {
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";

import {
  createClient,
} from "@/lib/supabase/server";

import ProductSchema from "@/components/ProductSchema";
import ProductAnalytics from "@/components/ProductAnalytics";
import ProductRecommendations from "@/components/ProductRecommendations";

import ProductGallery from "./components/ProductGallery";
import ProductInfo from "./components/ProductInfo";
import ProductReviews from "./components/ProductReviews";

export const dynamic =
  "force-dynamic";

export const revalidate = 0;

export const fetchCache =
  "force-no-store";

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

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const {
    slug,
  } = await params;

  const supabase =
    await createClient();

  const {
    data: product,
  } = await supabase
    .from("products")
    .select(
      `
        name,
        description,
        image,
        active
      `
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!product) {
    return {
      title:
        "Product | Rooh & Rivet",
      description:
        "Luxury handcrafted jewellery by Rooh & Rivet.",
    };
  }

  const description =
    product.description ??
    "Luxury handcrafted jewellery by Rooh & Rivet.";

  return {
    title: `${product.name} | Rooh & Rivet`,
    description,

    openGraph: {
      title: `${product.name} | Rooh & Rivet`,
      description,
      images: product.image
        ? [
            {
              url: product.image,
              alt: product.name,
            },
          ]
        : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: PageProps) {
  const {
    slug,
  } = await params;

  const supabase =
    await createClient();

  const {
    data: product,
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
        image_1,
        image_2,
        image_3,
        category,
        stock,
        featured,
        active,
        bestseller
      `
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (
    error ||
    !product
  ) {
    if (error) {
      console.error(
        "Failed to load product:",
        error
      );
    }

    notFound();
  }

  const productData =
    product as Product;

  return (
    <main className="min-h-screen bg-[#F8F4EF]">
      <ProductSchema
        name={productData.name}
        description={
          productData.description
        }
        image={productData.image}
        price={productData.price}
        slug={productData.slug}
        category={
          productData.category
        }
        stock={productData.stock}
      />

      <ProductAnalytics
        id={productData.id}
        name={productData.name}
        price={productData.price}
      />

      <div className="mx-auto max-w-7xl px-6 py-12">
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-2 text-[#5A2D2D] hover:underline"
        >
          <ArrowLeft size={18} />
          Back to Shop
        </Link>

        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <ProductGallery
            product={productData}
          />

          <ProductInfo
            product={productData}
          />
        </div>

        <section className="mt-16">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <Truck
                className="mb-4 text-[#5A2D2D]"
                size={34}
              />

              <h3 className="font-serif text-2xl text-[#4B2E2E]">
                Free Shipping
              </h3>

              <p className="mt-3 leading-7 text-stone-600">
                Complimentary insured
                shipping across India with
                premium Rooh &amp; Rivet
                packaging.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <ShieldCheck
                className="mb-4 text-[#5A2D2D]"
                size={34}
              />

              <h3 className="font-serif text-2xl text-[#4B2E2E]">
                Authentic Quality
              </h3>

              <p className="mt-3 leading-7 text-stone-600">
                Every jewellery piece is
                carefully inspected before
                dispatch to ensure
                exceptional craftsmanship.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <RotateCcw
                className="mb-4 text-[#5A2D2D]"
                size={34}
              />

              <h3 className="font-serif text-2xl text-[#4B2E2E]">
                Easy Returns
              </h3>

              <p className="mt-3 leading-7 text-stone-600">
                Eligible products can be
                returned or exchanged
                within the applicable
                return window.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <ProductReviews
            productId={
              productData.id
            }
          />
        </section>

        <section className="mt-20 rounded-[40px] bg-white p-10 shadow-sm">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#8B6B5B]">
              Rooh &amp; Rivet Promise
            </p>

            <h2 className="mt-4 font-serif text-4xl text-[#4B2E2E]">
              Crafted to be treasured for
              years.
            </h2>

            <p className="mt-6 leading-8 text-stone-600">
              Every Rooh &amp; Rivet
              creation is thoughtfully
              designed using premium
              materials and handcrafted by
              skilled artisans. From
              elegant everyday essentials
              to statement jewellery, each
              piece is made to celebrate
              timeless beauty and become
              part of your story.
            </p>
          </div>
        </section>

        <section className="mt-20">
          <ProductRecommendations
            productId={
              productData.id
            }
            category={
              productData.category
            }
          />
        </section>
      </div>
    </main>
  );
}