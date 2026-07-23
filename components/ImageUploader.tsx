"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ImageUploaderProps = {
  value: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
};

export default function ImageUploader({
  value,
  onChange,
  maxImages = 4,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;

    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedImages = [...value];

      for (const file of Array.from(files)) {
        if (uploadedImages.length >= maxImages) break;

        const extension = file.name.split(".").pop();

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${extension}`;

        const filePath = `products/${fileName}`;

        const { error } = await supabase.storage
          .from("products")
          .upload(filePath, file);

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage
          .from("products")
          .getPublicUrl(filePath);

        uploadedImages.push(publicUrl);
      }

      onChange(uploadedImages);
    } catch (error) {
      console.error(error);
      alert("Failed to upload image.");
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };
    const removeImage = (index: number) => {
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  return (
    <div className="space-y-6">

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleUpload}
      />

      <button
        type="button"
        disabled={uploading || value.length >= maxImages}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[#D9C9BC] bg-[#FCFAF8] px-6 py-10 transition hover:border-[#5A2D2D] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-[#5A2D2D]" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-[#5A2D2D]" />
            Upload Images
          </>
        )}
      </button>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {value.map((image, index) => (
            <div
              key={image}
              className="relative overflow-hidden rounded-2xl border border-[#E8DED2] bg-white"
            >
              <Image
                src={image}
                alt={`Product ${index + 1}`}
                width={400}
                height={400}
                className="h-44 w-full object-cover"
              />

              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white shadow-lg transition hover:bg-red-700"
              >
                <X size={16} />
              </button>

              <div className="border-t border-[#F2ECE4] bg-white px-3 py-2 text-center text-sm font-medium text-[#4B2E2E]">
                Image {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
          </div>
  );
}