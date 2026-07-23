"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ProductForm = {
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  featured: boolean;
  bestseller: boolean;
  active: boolean;
};

export default function NewProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "0",
    featured: false,
    bestseller: false,
    active: true,
  });

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  function updateField<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  function handleImages(e: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);

    if (!selected.length) return;

    setFiles(selected);

    setPreviews(selected.map((file) => URL.createObjectURL(file)));
  }

  function removeImage(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadImages(): Promise<string[]> {
    const uploadedUrls: string[] = [];

    for (const file of files) {
      const extension = file.name.split(".").pop();

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${extension}`;

      const { error } = await supabase.storage
        .from("products")
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);

      uploadedUrls.push(data.publicUrl);
    }

    return uploadedUrls;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Product name is required.");
      return;
    }

    if (!form.price) {
      alert("Product price is required.");
      return;
    }

    if (files.length === 0) {
      alert("Please upload at least one product image.");
      return;
    }

    try {
      setLoading(true);

      const imageUrls = await uploadImages();

      const slug = generateSlug(form.name);
      const { error } = await supabase
      .from("products")
      .insert({
        slug,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        category: form.category,
        stock: Number(form.stock),
        featured: form.featured,
        bestseller: form.bestseller,
        active: form.active,

        image: imageUrls[0] ?? null,
        image_1: imageUrls[1] ?? null,
        image_2: imageUrls[2] ?? null,
        image_3: imageUrls[3] ?? null,
      });

    if (error) throw error;

    alert("Product saved successfully.");

    setForm({
      name: "",
      description: "",
      price: "",
      category: "",
      stock: "0",
      featured: false,
      bestseller: false,
      active: true,
    });

    setFiles([]);
    setPreviews([]);

    router.push("/admin/products");
  } catch (error) {
    console.error(error);

    alert("Failed to save product.");
  } finally {
    setLoading(false);
  }
}

return (
  <div className="mx-auto max-w-6xl p-8">
    <div className="mb-8 flex items-center justify-between">
      <button
        type="button"
        onClick={() => router.back()}
        className="flex items-center gap-2 rounded-xl border px-4 py-2"
      >
        <ArrowLeft size={18} />
        Back
      </button>

      <h1 className="text-3xl font-bold">
        Add New Product
      </h1>
    </div>

    <form
      onSubmit={handleSubmit}
      className="space-y-8"
    >
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-semibold">
          Product Images
        </h2>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 p-12 transition hover:border-[#5A2D2D] hover:bg-[#F8F4EF]">
            <Upload
              size={42}
              className="mb-4 text-[#5A2D2D]"
            />

            <span className="text-lg font-medium">
              Upload Product Images
            </span>

            <span className="mt-2 text-sm text-gray-500">
              JPG, PNG or WEBP • Select multiple images
            </span>

            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImages}
              className="hidden"
            />
          </label>

          {previews.length > 0 && (
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {previews.map((preview, index) => (
                <div
                  key={index}
                  className="relative overflow-hidden rounded-2xl border bg-white"
                >
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    width={500}
                    height={500}
                    className="h-52 w-full object-cover"
                    unoptimized
                  />

                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white"
                  >
                    <X size={16} />
                  </button>

                  {index === 0 && (
                    <div className="absolute bottom-2 left-2 rounded-full bg-[#5A2D2D] px-3 py-1 text-xs text-white">
                      Main Image
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6 rounded-2xl border bg-white p-6 shadow-sm md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium">
              Product Name
            </label>

            <input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              className="w-full rounded-xl border p-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Category
            </label>

            <input
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Price
            </label>

            <input
              type="number"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              className="w-full rounded-xl border p-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Stock
            </label>

            <input
              type="number"
              value={form.stock}
              onChange={(e) => updateField("stock", e.target.value)}
              className="w-full rounded-xl border p-3"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block font-medium">
              Description
            </label>

            <textarea
              rows={6}
              value={form.description}
              onChange={(e) =>
                updateField("description", e.target.value)
              }
              className="w-full rounded-xl border p-3"
            />
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) =>
                updateField("featured", e.target.checked)
              }
            />
            Featured Product
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.bestseller}
              onChange={(e) =>
                updateField("bestseller", e.target.checked)
              }
            />
            Bestseller
          </label>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                updateField("active", e.target.checked)
              }
            />
            Active Product
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-[#5A2D2D] px-8 py-4 font-medium text-white transition hover:bg-[#442020] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Product
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}