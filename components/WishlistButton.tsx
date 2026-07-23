"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "@/lib/supabase";
import { useWishlist } from "@/context/WishlistContext";

type WishlistButtonProps = {
  productId: string;
  className?: string;
};

export default function WishlistButton({
  productId,
  className = "",
}: WishlistButtonProps) {
  const router = useRouter();

  const {
    isWishlisted,
    toggleWishlist,
  } = useWishlist();

  const [loading, setLoading] =
    useState(false);

  const active =
    isWishlisted(productId);

  async function handleClick(
    event: React.MouseEvent<HTMLButtonElement>
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (loading) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      await toggleWishlist(
        productId
      );

    } catch (error) {
      console.error(
        "Wishlist error:",
        error
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label="Add to wishlist"
      className={`flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <Heart
        size={22}
        className={
          active
            ? "fill-[#5A2D2D] text-[#5A2D2D]"
            : "text-[#5A2D2D]"
        }
      />
    </button>
  );
}