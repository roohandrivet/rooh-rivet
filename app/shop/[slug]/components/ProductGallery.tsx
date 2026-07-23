"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type ProductGalleryProps = {
  product: {
    name: string;
    image: string | null;
    image_1: string | null;
    image_2: string | null;
    image_3: string | null;
  };
};

export default function ProductGallery({
  product,
}: ProductGalleryProps) {
  const images = useMemo(
    () =>
      [
        product.image,
        product.image_1,
        product.image_2,
        product.image_3,
      ].filter(Boolean) as string[],
    [product]
  );

  const gallery =
    images.length > 0
      ? images
      : ["/placeholder.png"];

  const [selectedImage, setSelectedImage] =
    useState(gallery[0]);

  return (
    <div className="space-y-6">
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-sm">
        <Image
          src={selectedImage}
          alt={product.name}
          fill
          priority
          className="object-cover"
        />
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {gallery.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() =>
                setSelectedImage(image)
              }
              className={`relative aspect-square overflow-hidden rounded-2xl border-2 transition ${
                selectedImage === image
                  ? "border-[#5A2D2D]"
                  : "border-transparent hover:border-[#D9C5B2]"
              }`}
            >
              <Image
                src={image}
                alt={`${product.name} ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
          </div>
  );
}