"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

type ColourVariant = {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  color_name: string | null;
  color_hex: string | null;
  stock: number | string | null;
};

type ProductColourVariantsProps = {
  currentSlug: string;
  variantGroup: string | null | undefined;
  currentColour?: string | null;
};

function isHexColour(value: string | null): value is string {
  return !!value && /^#[0-9a-fA-F]{6}$/.test(value);
}

export default function ProductColourVariants({
  currentSlug,
  variantGroup,
  currentColour,
}: ProductColourVariantsProps) {
  const [variants, setVariants] = useState<ColourVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const group = variantGroup?.trim();
    if (!group) {
      setVariants([]);
      setLoading(false);
      setError(null);
      return;
    }

    async function loadVariants() {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("id, slug, name, image, color_name, color_hex, stock")
        .eq("variant_group", group)
        .eq("active", true)
        .order("color_name", { ascending: true });

      if (cancelled) return;
      if (fetchError) {
        setError("Colour options are temporarily unavailable.");
        setVariants([]);
      } else {
        setVariants((data ?? []) as ColourVariant[]);
      }
      setLoading(false);
    }

    void loadVariants();
    return () => {
      cancelled = true;
    };
  }, [variantGroup]);

  if (!variantGroup?.trim()) return null;
  if (loading) {
    return <p className="mt-6 text-sm text-[#8B6B5B]">Loading colours...</p>;
  }
  if (error) {
    return <p role="status" className="mt-6 text-sm text-[#8B6B5B]">{error}</p>;
  }
  if (variants.length < 2) return null;

  return (
    <section aria-label="Available colours" className="mt-7 border-t border-[#E8DDD3] pt-6">
      <p className="mb-4 text-sm font-medium text-[#4B2E2E]">
        Available Colours
        {currentColour ? <span className="font-normal text-[#8B6B5B]"> · {currentColour}</span> : null}
      </p>
      <div className="flex flex-wrap gap-4">
        {variants.map((variant) => {
          const selected = variant.slug === currentSlug;
          const colourLabel = variant.color_name?.trim() || variant.name;
          const soldOut = Number(variant.stock ?? 0) <= 0;
          return (
            <Link
              key={variant.id}
              href={`/shop/${encodeURIComponent(variant.slug)}`}
              aria-current={selected ? "page" : undefined}
              aria-label={`${colourLabel}${selected ? ", selected" : ""}${soldOut ? ", sold out" : ""}`}
              title={`${colourLabel}${soldOut ? " — Sold out" : ""}`}
              className="group flex w-[76px] flex-col items-center gap-2 text-center"
            >
              <span className={`relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 bg-[#F8F4EF] p-1 transition ${selected ? "border-[#5A2D2D]" : "border-[#E8DDD3] group-hover:border-[#8B6B5B]"}`}>
                {variant.image ? (
                  <Image src={variant.image} alt="" fill sizes="56px" className={`object-cover ${soldOut ? "opacity-60" : ""}`} />
                ) : (
                  <span className="h-full w-full rounded-full" style={{ backgroundColor: isHexColour(variant.color_hex) ? variant.color_hex : "#D8C3B0" }} />
                )}
              </span>
              <span className={`text-xs ${selected ? "font-semibold text-[#4B2E2E]" : "text-[#8B6B5B]"}`}>
                {colourLabel}
              </span>
              {soldOut ? <span className="text-[10px] text-[#9B6B6B]">Sold out</span> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
