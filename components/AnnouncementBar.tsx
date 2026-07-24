"use client";

import {
  useEffect,
  useState,
} from "react";
import {
  Check,
  Copy,
  Sparkles,
} from "lucide-react";

type BannerCoupon = {
  code: string;
  message: string;
};

type BannerResponse = {
  success: boolean;
  coupon: BannerCoupon | null;
};

export default function AnnouncementBar() {
  const [
    coupon,
    setCoupon,
  ] =
    useState<BannerCoupon | null>(
      null
    );

  const [
    copied,
    setCopied,
  ] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadCoupon() {
      try {
        const response =
          await fetch(
            "/api/coupons/banner",
            {
              cache: "no-store",
            }
          );

        const result =
          (await response.json()) as
            BannerResponse;

        if (
          mounted &&
          response.ok &&
          result.success
        ) {
          setCoupon(
            result.coupon
          );
        }
      } catch (error) {
        console.error(
          "Unable to load coupon banner:",
          error
        );
      }
    }

    void loadCoupon();

    return () => {
      mounted = false;
    };
  }, []);

  async function copyCouponCode() {
    if (!coupon) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        coupon.code
      );

      setCopied(true);

      window.setTimeout(
        () => {
          setCopied(false);
        },
        1800
      );
    } catch (error) {
      console.error(
        "Unable to copy coupon code:",
        error
      );

      setCopied(false);
    }
  }

  if (!coupon) {
    return null;
  }

  return (
    <div className="relative z-[55] bg-[#5A2D2D] px-4 py-2.5 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-3">
        <Sparkles
          size={15}
          className="shrink-0 text-[#E7C8A3]"
        />

        <p className="text-xs font-medium tracking-wide sm:text-sm">
          {coupon.message}
        </p>

        <span className="hidden text-[#D9B38C] sm:inline">
          •
        </span>

        <span className="text-xs text-white/80 sm:text-sm">
          Use code
        </span>

        <button
          type="button"
          onClick={() =>
            void copyCouponCode()
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition hover:bg-white/20"
          aria-label={`Copy coupon code ${coupon.code}`}
        >
          {copied ? (
            <Check size={13} />
          ) : (
            <Copy size={13} />
          )}

          {copied
            ? "Copied"
            : coupon.code}
        </button>
      </div>
    </div>
  );
}