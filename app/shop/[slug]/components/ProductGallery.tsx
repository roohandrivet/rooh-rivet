"use client";

import Image from "next/image";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type TouchEvent,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
} from "lucide-react";

type ProductGalleryProduct = {
  name: string;
  image: string | null;
  image_1: string | null;
  image_2: string | null;
  image_3: string | null;
};

type ProductGalleryProps = {
  product: ProductGalleryProduct;
};

const SWIPE_THRESHOLD = 45;

export default function ProductGallery({
  product,
}: ProductGalleryProps) {
  const images = useMemo(() => {
    const productImages = [
      product.image,
      product.image_1,
      product.image_2,
      product.image_3,
    ]
      .map((image) => image?.trim() ?? "")
      .filter((image) => image.length > 0);

    return Array.from(
      new Set(productImages)
    );
  }, [
    product.image,
    product.image_1,
    product.image_2,
    product.image_3,
  ]);

  const [selectedIndex, setSelectedIndex] =
    useState(0);

  const touchStartXRef =
    useRef<number | null>(null);

  const touchEndXRef =
    useRef<number | null>(null);

  const hasMultipleImages =
    images.length > 1;

  const selectedImage =
    images[selectedIndex] ?? null;

  useEffect(() => {
    setSelectedIndex(0);
  }, [images]);

  function showPreviousImage() {
    if (!hasMultipleImages) {
      return;
    }

    setSelectedIndex((currentIndex) =>
      currentIndex === 0
        ? images.length - 1
        : currentIndex - 1
    );
  }

  function showNextImage() {
    if (!hasMultipleImages) {
      return;
    }

    setSelectedIndex((currentIndex) =>
      currentIndex === images.length - 1
        ? 0
        : currentIndex + 1
    );
  }

  function handleTouchStart(
    event: TouchEvent<HTMLDivElement>
  ) {
    touchEndXRef.current = null;
    touchStartXRef.current =
      event.touches[0]?.clientX ?? null;
  }

  function handleTouchMove(
    event: TouchEvent<HTMLDivElement>
  ) {
    touchEndXRef.current =
      event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd() {
    const startX =
      touchStartXRef.current;

    const endX =
      touchEndXRef.current;

    touchStartXRef.current = null;
    touchEndXRef.current = null;

    if (
      startX === null ||
      endX === null
    ) {
      return;
    }

    const swipeDistance =
      startX - endX;

    if (
      Math.abs(swipeDistance) <
      SWIPE_THRESHOLD
    ) {
      return;
    }

    if (swipeDistance > 0) {
      showNextImage();
      return;
    }

    showPreviousImage();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLDivElement>
  ) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPreviousImage();
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNextImage();
    }
  }

  return (
    <section
      aria-label={`${product.name} image gallery`}
      className="w-full"
    >
      <div
        role="region"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="group relative aspect-square w-full touch-pan-y overflow-hidden rounded-[32px] border border-[#E8DDD3] bg-white shadow-sm outline-none focus:ring-2 focus:ring-[#5A2D2D]/30"
      >
        {selectedImage ? (
          <Image
            key={selectedImage}
            src={selectedImage}
            alt={`${product.name} — image ${selectedIndex + 1}`}
            fill
            priority={selectedIndex === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="select-none object-cover transition duration-500"
            draggable={false}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-[#F4EEE8] px-6 text-center text-[#8B6B5B]">
            <ImageIcon
              className="h-12 w-12"
              strokeWidth={1.4}
            />

            <p className="text-sm">
              Product image unavailable
            </p>
          </div>
        )}

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              aria-label="Show previous product image"
              className="absolute left-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#4B2E2E] shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A2D2D]/30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={showNextImage}
              aria-label="Show next product image"
              className="absolute right-4 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-white/90 text-[#4B2E2E] shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A2D2D]/30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#2D1818]/55 px-4 py-2 backdrop-blur">
              {images.map((image, index) => {
                const active =
                  index === selectedIndex;

                return (
                  <button
                    key={image}
                    type="button"
                    onClick={() =>
                      setSelectedIndex(index)
                    }
                    aria-label={`Show product image ${index + 1}`}
                    aria-current={
                      active
                        ? "true"
                        : undefined
                    }
                    className={`rounded-full transition-all ${
                      active
                        ? "h-2.5 w-6 bg-white"
                        : "h-2.5 w-2.5 bg-white/55 hover:bg-white/80"
                    }`}
                  />
                );
              })}
            </div>

            <div className="absolute right-4 top-4 z-10 rounded-full bg-[#2D1818]/55 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              {selectedIndex + 1} /{" "}
              {images.length}
            </div>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="mt-5 grid grid-cols-4 gap-3">
          {images.map((image, index) => {
            const active =
              index === selectedIndex;

            return (
              <button
                key={image}
                type="button"
                onClick={() =>
                  setSelectedIndex(index)
                }
                aria-label={`Select product image ${index + 1}`}
                aria-current={
                  active
                    ? "true"
                    : undefined
                }
                className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-white transition ${
                  active
                    ? "border-[#5A2D2D] shadow-md"
                    : "border-transparent opacity-75 hover:border-[#CDB7A7] hover:opacity-100"
                }`}
              >
                <Image
                  src={image}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 25vw, 140px"
                  className="object-cover"
                  draggable={false}
                  unoptimized
                />
              </button>
            );
          })}
        </div>
      )}

      {hasMultipleImages && (
        <p className="mt-4 text-center text-xs text-[#8B6B5B] sm:hidden">
          Swipe left or right to view more
          images
        </p>
      )}
    </section>
  );
}