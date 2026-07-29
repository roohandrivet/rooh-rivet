"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  ImageIcon,
  Loader2,
} from "lucide-react";
import { FaInstagram } from "react-icons/fa6";

import { supabase } from "@/lib/supabase";

type ContactSocialRow = {
  instagram_url: string | null;
};

type ProductGalleryRow = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
};

const DEFAULT_INSTAGRAM_URL =
  "https://www.instagram.com/roohandrivet/";

function normaliseInstagramUrl(
  value: string | null | undefined
): string {
  const trimmed = value?.trim();

  if (!trimmed) {
    return DEFAULT_INSTAGRAM_URL;
  }

  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }

  if (trimmed.startsWith("@")) {
    const username = trimmed
      .slice(1)
      .trim()
      .replace(/^\/+|\/+$/g, "");

    return username
      ? `https://www.instagram.com/${username}/`
      : DEFAULT_INSTAGRAM_URL;
  }

  if (
    trimmed
      .toLowerCase()
      .includes("instagram.com")
  ) {
    return `https://${trimmed}`;
  }

  const username = trimmed.replace(
    /^\/+|\/+$/g,
    ""
  );

  return username
    ? `https://www.instagram.com/${username}/`
    : DEFAULT_INSTAGRAM_URL;
}

function getInstagramHandle(
  instagramUrl: string
): string {
  try {
    const url = new URL(instagramUrl);

    const username = url.pathname
      .split("/")
      .filter(Boolean)[0];

    return username
      ? `@${username}`
      : "@roohandrivet";
  } catch {
    return "@roohandrivet";
  }
}

export default function InstagramGallery() {
  const [
    instagramUrl,
    setInstagramUrl,
  ] = useState(
    DEFAULT_INSTAGRAM_URL
  );

  const [
    products,
    setProducts,
  ] = useState<ProductGalleryRow[]>(
    []
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadGallery():
      Promise<void> {
      setLoading(true);
      setError("");

      try {
        const [
          contactResult,
          productsResult,
        ] = await Promise.all([
          supabase
            .from("site_content")
            .select("instagram_url")
            .eq("page", "contact")
            .maybeSingle(),

          supabase
            .from("products")
            .select(
              `
                id,
                slug,
                name,
                image
              `
            )
            .eq("active", true)
            .not("image", "is", null)
            .order("created_at", {
              ascending: false,
            })
            .limit(6),
        ]);

        if (
          contactResult.error
        ) {
          console.error(
            "Failed to load Instagram URL:",
            contactResult.error
          );
        }

        if (
          productsResult.error
        ) {
          throw productsResult.error;
        }

        if (!active) {
          return;
        }

        const contactRow =
          contactResult.data as
            | ContactSocialRow
            | null;

        setInstagramUrl(
          normaliseInstagramUrl(
            contactRow?.instagram_url
          )
        );

        const loadedProducts =
          (
            productsResult.data ??
            []
          ) as ProductGalleryRow[];

        setProducts(
          loadedProducts.filter(
            (
              product
            ): product is ProductGalleryRow & {
              image: string;
            } =>
              Boolean(
                product.image?.trim()
              )
          )
        );
      } catch (
        loadError: unknown
      ) {
        console.error(
          "Failed to load Instagram gallery:",
          loadError
        );

        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load the gallery."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadGallery();

    return () => {
      active = false;
    };
  }, []);

  const instagramHandle =
    useMemo(
      () =>
        getInstagramHandle(
          instagramUrl
        ),
      [instagramUrl]
    );

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm uppercase tracking-[0.42em] text-[#8B6B5B]">
            Follow Our Journey
          </p>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Visit ${instagramHandle} on Instagram`}
            className="mt-6 inline-block font-serif text-5xl text-[#4B2E2E] transition hover:text-[#5A2D2D]"
          >
            {instagramHandle}
          </a>

          <p className="mt-6 leading-8 text-[#7A6464]">
            A glimpse into the world of Rooh &amp;
            Rivet—timeless craftsmanship, elegant
            styling and moments that inspire every
            handcrafted piece.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2
              size={34}
              className="animate-spin text-[#5A2D2D]"
            />
          </div>
        ) : null}

        {!loading &&
        products.length > 0 ? (
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(
              (product) => (
                <Link
                  key={product.id}
                  href={`/shop/${encodeURIComponent(
                    product.slug
                  )}`}
                  aria-label={`View ${product.name}`}
                  className="group relative overflow-hidden rounded-[32px] bg-[#F8F4EF]"
                >
                  <div className="relative aspect-square overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        product.image ??
                        ""
                      }
                      alt={
                        product.name
                      }
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-[#4B2E2E]/0 transition duration-500 group-hover:bg-[#4B2E2E]/45" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition duration-500 group-hover:opacity-100">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-xl">
                        <FaInstagram
                          className="text-[#4B2E2E]"
                          size={34}
                        />
                      </div>
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-6 pt-16">
                      <p className="font-serif text-xl text-white">
                        {
                          product.name
                        }
                      </p>

                      <p className="mt-2 text-sm text-white/80">
                        View jewellery
                      </p>
                    </div>
                  </div>
                </Link>
              )
            )}
          </div>
        ) : null}

        {!loading &&
        products.length === 0 ? (
          <div className="mx-auto mt-16 flex min-h-72 max-w-3xl flex-col items-center justify-center rounded-[32px] border border-[#E7DBD1] bg-[#F8F4EF] px-8 text-center">
            <ImageIcon
              size={48}
              strokeWidth={1.4}
              className="text-[#8B6B5B]"
            />

            <h3 className="mt-5 font-serif text-2xl text-[#4B2E2E]">
              Gallery images will appear here
            </h3>

            <p className="mt-3 max-w-xl leading-7 text-[#7A6464]">
              Add active products with images in
              the admin catalogue to populate this
              section automatically.
            </p>
          </div>
        ) : null}

        {error ? (
          <p className="mx-auto mt-6 max-w-2xl text-center text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-16 text-center">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow ${instagramHandle} on Instagram`}
            className="inline-flex items-center gap-3 rounded-full bg-[#5A2D2D] px-10 py-5 font-medium text-white transition duration-300 hover:scale-105 hover:bg-[#472323]"
          >
            <FaInstagram size={22} />
            Follow {instagramHandle}
          </a>

          <p className="mx-auto mt-6 max-w-2xl text-[#8B6B5B]">
            Follow us for new jewellery launches,
            styling inspiration and moments from
            the Rooh &amp; Rivet journey.
          </p>
        </div>
      </div>
    </section>
  );
}