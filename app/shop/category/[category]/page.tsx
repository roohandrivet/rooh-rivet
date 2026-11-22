import Link from "next/link";
import {
  ArrowLeft,
  Search,
} from "lucide-react";

import ProductGrid from "@/components/ProductGrid";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

// These aliases retain support for existing category links (including singular
// category names entered through Admin). New categories do not require code changes.
const CATEGORY_ALIASES: Record<string, string> = {
  necklace: "necklaces",
  necklaces: "necklaces",
  earring: "earrings",
  earrings: "earrings",
  bracelet: "bracelets",
  bracelets: "bracelets",
  ring: "rings",
  rings: "rings",
  bangle: "bangles",
  bangles: "bangles",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  necklaces:
    "Discover elegant handcrafted necklaces designed to bring timeless beauty to every occasion.",
  earrings:
    "Explore handcrafted earrings created with elegance, detail and effortless sophistication.",
  bracelets:
    "Discover refined bracelets designed to add a graceful finishing touch to every look.",
  rings:
    "Explore timeless handcrafted rings created to celebrate meaningful moments.",
  bangles:
    "Explore beautifully crafted bangles designed to complete every special look.",
};

type CategoryPageProps = {
  params: Promise<{ category: string }>;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price: number | string | null;
  image: string | null;
  image_1: string | null;
  image_2: string | null;
  image_3: string | null;
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
  image_1: string;
  image_2: string;
  image_3: string;
  featured: boolean;
  bestseller: boolean;
  category: string;
  stock: number;
  reservation_enabled: boolean;
  reserved_until: string | null;
  currently_reserved: boolean;
};

type CategoryNavigationItem = {
  name: string;
  slug: string;
};

function categoryKey(value: string | null): string {
  const key = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return CATEGORY_ALIASES[key] ?? key;
}

function displayCategory(value: string): string {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function toNumber(value: number | string | null): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isCurrentlyReserved(
  reservedUntil: string | null,
  currentTime: number
): boolean {
  if (!reservedUntil) return false;
  const expiresAt = new Date(reservedUntil).getTime();
  return !Number.isNaN(expiresAt) && expiresAt > currentTime;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { category: routeCategory } = await params;
  const categorySlug = categoryKey(routeCategory);
  const supabase = await createClient();

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
      image_2,
      image_3,
      featured,
      bestseller,
      category,
      stock,
      reservation_enabled,
      reserved_until
    `)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(`Failed to load category ${categorySlug}:`, error);
  }

  const currentTime = Date.now();
  const allProducts: Product[] = ((data ?? []) as ProductRow[]).map(
    (product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      description: product.description ?? "",
      price: Math.max(0, toNumber(product.price)),
      image: product.image ?? "",
      image_1: product.image_1 ?? "",
      image_2: product.image_2 ?? "",
      image_3: product.image_3 ?? "",
      featured: product.featured === true,
      bestseller: product.bestseller === true,
      category: product.category ?? "",
      stock: Math.max(0, Math.floor(toNumber(product.stock))),
      reservation_enabled: product.reservation_enabled === true,
      reserved_until: product.reserved_until,
      currently_reserved:
        product.reservation_enabled === true &&
        isCurrentlyReserved(product.reserved_until, currentTime),
    })
  );

  // Only show links for categories with at least one active, in-stock item.
  // This means Rings and Bracelets automatically disappear when empty, and
  // Bangles (or any future Admin category) appears without another code edit.
  const availableCategories = new Map<string, string>();
  for (const product of allProducts) {
    if (product.stock <= 0) continue;
    const slug = categoryKey(product.category);
    if (!slug || availableCategories.has(slug)) continue;
    availableCategories.set(slug, displayCategory(slug));
  }

  const categories: CategoryNavigationItem[] = Array.from(
    availableCategories,
    ([slug, name]) => ({ slug, name })
  ).sort((a, b) => a.name.localeCompare(b.name));

  const categoryTitle =
    availableCategories.get(categorySlug) ?? displayCategory(categorySlug);
  const categoryDescription =
    CATEGORY_DESCRIPTIONS[categorySlug] ??
    `Explore our ${categoryTitle.toLowerCase()} collection of thoughtfully selected jewellery.`;

  const products = allProducts.filter(
    (product) =>
      product.stock > 0 && categoryKey(product.category) === categorySlug
  );

  return (
    <main className="min-h-screen bg-[#F8F4EF]">
      <section className="px-6 py-16 text-center sm:px-8 sm:py-24">
        <Link
          href="/shop"
          className="mx-auto inline-flex items-center gap-2 text-sm font-medium text-[#8B6B5B] transition hover:text-[#5A2D2D]"
        >
          <ArrowLeft className="h-4 w-4" />
          View all jewellery
        </Link>

        <p className="mt-10 text-sm uppercase tracking-[8px] text-[#8B6B5B]">
          Rooh &amp; Rivet
        </p>

        <h1 className="mt-6 font-serif text-5xl text-[#4B2E2E] sm:text-6xl">
          {categoryTitle}
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#7A6464]">
          {categoryDescription}
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 sm:px-8">
        <form
          action="/search"
          method="get"
          className="flex items-center gap-4 rounded-full bg-white px-6 py-5 shadow-lg sm:px-8"
        >
          <Search className="shrink-0 text-[#8B6B5B]" size={22} />

          <input
            type="search"
            name="q"
            placeholder={`Search ${categoryTitle.toLowerCase()}...`}
            aria-label={`Search ${categoryTitle}`}
            className="w-full bg-transparent text-[#4B2E2E] outline-none placeholder:text-[#A79084]"
          />
        </form>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-6 sm:px-8">
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/shop"
            className="rounded-full bg-white px-8 py-3 text-[#9A7048] transition hover:bg-[#5A2D2D] hover:text-[#F1DECA]"
          >
            All
          </Link>

          {categories.map((item) => {
            const active = item.slug === categorySlug;
            return (
              <Link
                key={item.slug}
                href={`/shop/category/${encodeURIComponent(item.slug)}`}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-8 py-3 transition ${
                  active
                    ? "bg-[#5A2D2D] text-[#F1DECA]"
                    : "bg-white text-[#9A7048] hover:bg-[#5A2D2D] hover:text-[#F1DECA]"
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center text-red-700">
            Products could not be loaded. Please refresh the page.
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-[#E8DDD3] bg-white px-6 py-14 text-center shadow-sm">
            <h2 className="font-serif text-3xl text-[#4B2E2E]">
              No {categoryTitle.toLowerCase()} available
            </h2>
            <p className="mx-auto mt-4 max-w-xl leading-7 text-[#7A6464]">
              New handcrafted pieces will appear here as soon as they become available.
            </p>
            <Link
              href="/shop"
              className="mt-8 inline-flex rounded-full bg-[#5A2D2D] px-8 py-3 font-semibold text-white transition hover:bg-[#4B2525]"
            >
              Explore all jewellery
            </Link>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </section>
    </main>
  );
}
