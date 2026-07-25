"use client";

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  ImagePlus,
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
  reservationEnabled: boolean;
};

type ExistingProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  category: string | null;
  stock: number | string | null;
  featured: boolean | null;
  bestseller: boolean | null;
  active: boolean | null;
  reservation_enabled: boolean | null;
  image: string | null;
  image_1: string | null;
  image_2: string | null;
  image_3: string | null;
};

type UploadedImage = {
  path: string;
  publicUrl: string;
};

const MAX_IMAGES = 4;

const INITIAL_FORM: ProductForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  stock: "0",
  featured: false,
  bestseller: false,
  active: true,
  reservationEnabled: false,
};

function getFileExtension(file: File): string {
  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (extension) {
    return extension;
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function toStockString(
  value: number | string | null
): string {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return "0";
  }

  return Math.floor(parsed).toString();
}

function toPriceString(
  value: number | string | null
): string {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return "";
  }

  return parsed.toString();
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();

  const productId =
    typeof params.id === "string"
      ? params.id
      : "";

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] =
    useState<ProductForm>(INITIAL_FORM);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] =
    useState<string[]>([]);

  const previewsRef = useRef<string[]>([]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, []);

  const loadProduct = useCallback(async () => {
    if (!productId) {
      setError("A valid product ID is required.");
      setPageLoading(false);
      return;
    }

    try {
      setPageLoading(true);
      setError("");

      const {
        data,
        error: productError,
      } = await supabase
        .from("products")
        .select(
          `
            id,
            name,
            description,
            price,
            category,
            stock,
            featured,
            bestseller,
            active,
            reservation_enabled,
            image,
            image_1,
            image_2,
            image_3
          `
        )
        .eq("id", productId)
        .single();

      if (productError) {
        throw productError;
      }

      const product = data as ExistingProduct;

      const reservationEnabled =
        product.reservation_enabled === true;

      setForm({
        name: product.name ?? "",
        description: product.description ?? "",
        price: toPriceString(product.price),
        category: product.category ?? "",
        stock: reservationEnabled
          ? "1"
          : toStockString(product.stock),
        featured: product.featured ?? false,
        bestseller: product.bestseller ?? false,
        active: product.active ?? true,
        reservationEnabled,
      });

      setExistingImages(
        [
          product.image,
          product.image_1,
          product.image_2,
          product.image_3,
        ].filter(
          (image): image is string =>
            typeof image === "string" &&
            image.trim().length > 0
        )
      );
    } catch (loadError) {
      console.error(
        "Failed to load product:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load product."
      );
    } finally {
      setPageLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void loadProduct();
  }, [loadProduct]);

  function updateField<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));

    setError("");
    setSuccess("");
  }

  function handleReservationChange(enabled: boolean) {
    setForm((current) => ({
      ...current,
      reservationEnabled: enabled,
      stock: enabled ? "1" : current.stock,
    }));

    setError("");
    setSuccess("");
  }

  function handleImages(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selectedFiles = Array.from(
      event.target.files ?? []
    ).filter((file) => file.type.startsWith("image/"));

    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const currentImageCount =
      existingImages.length + files.length;

    const remainingSlots =
      MAX_IMAGES - currentImageCount;

    if (remainingSlots <= 0) {
      setError(
        `A product can have a maximum of ${MAX_IMAGES} images.`
      );
      return;
    }

    const acceptedFiles = selectedFiles.slice(
      0,
      remainingSlots
    );

    const newPreviews = acceptedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setFiles((current) => [
      ...current,
      ...acceptedFiles,
    ]);

    setPreviews((current) => [
      ...current,
      ...newPreviews,
    ]);

    if (selectedFiles.length > remainingSlots) {
      setError(
        `Only ${remainingSlots} more ${
          remainingSlots === 1 ? "image was" : "images were"
        } added. A product can have up to ${MAX_IMAGES} images.`
      );
    } else {
      setError("");
    }

    setSuccess("");
  }

  function removeNewImage(index: number) {
    setPreviews((current) => {
      const preview = current[index];

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      return current.filter(
        (_preview, previewIndex) =>
          previewIndex !== index
      );
    });

    setFiles((current) =>
      current.filter(
        (_file, fileIndex) =>
          fileIndex !== index
      )
    );

    setError("");
    setSuccess("");
  }

  function removeExistingImage(index: number) {
    setExistingImages((current) =>
      current.filter(
        (_image, imageIndex) =>
          imageIndex !== index
      )
    );

    setError("");
    setSuccess("");
  }

  async function uploadImages(): Promise<UploadedImage[]> {
    const uploadedImages: UploadedImage[] = [];

    for (const file of files) {
      const extension = getFileExtension(file);
      const filePath =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const {
        error: uploadError,
      } = await supabase.storage
        .from("products")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      uploadedImages.push({
        path: filePath,
        publicUrl: publicUrlData.publicUrl,
      });
    }

    return uploadedImages;
  }

  async function removeUploadedImages(
    uploadedImages: UploadedImage[]
  ): Promise<void> {
    if (uploadedImages.length === 0) {
      return;
    }

    const {
      error: removeError,
    } = await supabase.storage
      .from("products")
      .remove(
        uploadedImages.map((image) => image.path)
      );

    if (removeError) {
      console.error(
        "Failed to clean up uploaded images:",
        removeError
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const description = form.description.trim();
    const category = form.category.trim();
    const price = Number(form.price);
    const rawStock = Number(form.stock);

    const stock = form.reservationEnabled
      ? 1
      : Math.max(0, Math.floor(rawStock));

    if (!productId) {
      setError("A valid product ID is required.");
      return;
    }

    if (!name) {
      setError("Product name is required.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError(
        "Enter a valid product price greater than zero."
      );
      return;
    }

    if (
      !form.reservationEnabled &&
      (!Number.isFinite(rawStock) || rawStock < 0)
    ) {
      setError("Enter a valid stock quantity.");
      return;
    }

    if (
      existingImages.length + files.length ===
      0
    ) {
      setError(
        "Please keep or upload at least one product image."
      );
      return;
    }

    if (
      existingImages.length + files.length >
      MAX_IMAGES
    ) {
      setError(
        `A product can have a maximum of ${MAX_IMAGES} images.`
      );
      return;
    }

    let uploadedImages: UploadedImage[] = [];

    try {
      setLoading(true);

      uploadedImages = await uploadImages();

      const finalImages = [
        ...existingImages,
        ...uploadedImages.map(
          (image) => image.publicUrl
        ),
      ].slice(0, MAX_IMAGES);

      const updatePayload = {
        name,
        description: description || null,
        price,
        category: category || null,
        stock,
        featured: form.featured,
        bestseller: form.bestseller,
        active: form.active,
        reservation_enabled:
          form.reservationEnabled,
        ...(form.reservationEnabled
          ? {}
          : {
              reserved_by: null,
              reserved_until: null,
            }),
        image: finalImages[0] ?? null,
        image_1: finalImages[1] ?? null,
        image_2: finalImages[2] ?? null,
        image_3: finalImages[3] ?? null,
      };

      const {
        error: updateError,
      } = await supabase
        .from("products")
        .update(updatePayload)
        .eq("id", productId);

      if (updateError) {
        throw updateError;
      }

      previews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });

      setFiles([]);
      setPreviews([]);
      setExistingImages(finalImages);
      setSuccess("Product updated successfully.");

      router.push("/admin/products");
      router.refresh();
    } catch (updateError) {
      console.error(
        "Failed to update product:",
        updateError
      );

      await removeUploadedImages(uploadedImages);

      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update product."
      );
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8F4EF]">
        <div className="text-center">
          <Loader2
            className="mx-auto animate-spin text-[#5A2D2D]"
            size={38}
          />

          <p className="mt-4 text-[#7A6464]">
            Loading product...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] px-5 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex w-fit items-center gap-2 rounded-xl border border-[#D8C3B0] bg-white px-4 py-2.5 font-medium text-[#5A2D2D] transition hover:bg-[#F4ECE5]"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B6B5B]">
              Product Catalogue
            </p>

            <h1 className="mt-2 font-serif text-3xl font-semibold text-[#4B2E2E] sm:text-4xl">
              Edit Product
            </h1>
          </div>
        </div>

        {error ? (
          <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mb-7 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            {success}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-semibold text-[#4B2E2E]">
                  Product Images
                </h2>

                <p className="mt-2 text-sm leading-6 text-[#7A6464]">
                  Keep, remove or add images. The first image is used
                  as the main product image.
                </p>
              </div>

              <ImagePlus
                size={26}
                className="shrink-0 text-[#8B6B5B]"
              />
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8C3B0] bg-[#FCFAF7] p-10 text-center transition hover:border-[#5A2D2D] hover:bg-[#F8F4EF]">
              <Upload
                size={42}
                className="mb-4 text-[#5A2D2D]"
              />

              <span className="text-lg font-semibold text-[#4B2E2E]">
                Upload New Images
              </span>

              <span className="mt-2 text-sm text-[#8B6B5B]">
                JPG, PNG or WEBP ·{" "}
                {existingImages.length + files.length}/
                {MAX_IMAGES} images
              </span>

              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImages}
                disabled={
                  loading ||
                  existingImages.length + files.length >=
                    MAX_IMAGES
                }
                className="hidden"
              />
            </label>

            {existingImages.length > 0 ? (
              <div className="mt-8">
                <h3 className="mb-4 font-semibold text-[#4B2E2E]">
                  Current Images
                </h3>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {existingImages.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative overflow-hidden rounded-2xl border border-[#E8DDD3] bg-white"
                    >
                      <Image
                        src={image}
                        alt={`Product image ${index + 1}`}
                        width={500}
                        height={500}
                        className="h-52 w-full object-cover"
                      />

                      <button
                        type="button"
                        aria-label={`Remove product image ${index + 1}`}
                        onClick={() =>
                          removeExistingImage(index)
                        }
                        disabled={loading}
                        className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <X size={16} />
                      </button>

                      {index === 0 ? (
                        <div className="absolute bottom-2 left-2 rounded-full bg-[#5A2D2D] px-3 py-1 text-xs font-medium text-white">
                          Main Image
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {previews.length > 0 ? (
              <div className="mt-8">
                <h3 className="mb-4 font-semibold text-[#4B2E2E]">
                  New Uploads
                </h3>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {previews.map((preview, index) => (
                    <div
                      key={preview}
                      className="relative overflow-hidden rounded-2xl border border-[#E8DDD3] bg-white"
                    >
                      <Image
                        src={preview}
                        alt={`New product preview ${index + 1}`}
                        width={500}
                        height={500}
                        className="h-52 w-full object-cover"
                        unoptimized
                      />

                      <button
                        type="button"
                        aria-label={`Remove new image ${index + 1}`}
                        onClick={() => removeNewImage(index)}
                        disabled={loading}
                        className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <X size={16} />
                      </button>

                      {existingImages.length === 0 && index === 0 ? (
                        <div className="absolute bottom-2 left-2 rounded-full bg-[#5A2D2D] px-3 py-1 text-xs font-medium text-white">
                          Main Image
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <h2 className="font-serif text-2xl font-semibold text-[#4B2E2E]">
                Product Details
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#7A6464]">
                Update the product information shown to customers.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label
                  htmlFor="product-name"
                  className="mb-2 block font-medium text-[#4B2E2E]"
                >
                  Product Name
                </label>

                <input
                  id="product-name"
                  value={form.name}
                  onChange={(event) =>
                    updateField("name", event.target.value)
                  }
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-[#D8C3B0] bg-white p-3.5 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="product-category"
                  className="mb-2 block font-medium text-[#4B2E2E]"
                >
                  Category
                </label>

                <input
                  id="product-category"
                  value={form.category}
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D8C3B0] bg-white p-3.5 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="product-price"
                  className="mb-2 block font-medium text-[#4B2E2E]"
                >
                  Price
                </label>

                <input
                  id="product-price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.price}
                  onChange={(event) =>
                    updateField("price", event.target.value)
                  }
                  disabled={loading}
                  required
                  className="w-full rounded-xl border border-[#D8C3B0] bg-white p-3.5 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div>
                <label
                  htmlFor="product-stock"
                  className="mb-2 block font-medium text-[#4B2E2E]"
                >
                  Stock
                </label>

                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) =>
                    updateField("stock", event.target.value)
                  }
                  disabled={
                    loading || form.reservationEnabled
                  }
                  className="w-full rounded-xl border border-[#D8C3B0] bg-white p-3.5 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:opacity-70"
                />

                {form.reservationEnabled ? (
                  <p className="mt-2 text-sm text-[#8B6B5B]">
                    Stock is fixed at one for a reservation-enabled
                    product.
                  </p>
                ) : null}
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="product-description"
                  className="mb-2 block font-medium text-[#4B2E2E]"
                >
                  Description
                </label>

                <textarea
                  id="product-description"
                  rows={7}
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value
                    )
                  }
                  disabled={loading}
                  className="w-full resize-y rounded-xl border border-[#D8C3B0] bg-white p-3.5 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <h2 className="font-serif text-2xl font-semibold text-[#4B2E2E]">
                Product Settings
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#7A6464]">
                Control visibility, merchandising and timed
                reservations.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-[#E8DDD3] p-5 transition hover:bg-[#FCFAF7]">
                <div>
                  <p className="font-semibold text-[#4B2E2E]">
                    Featured Product
                  </p>

                  <p className="mt-1 text-sm text-[#8B6B5B]">
                    Highlight this product in featured sections.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(event) =>
                    updateField(
                      "featured",
                      event.target.checked
                    )
                  }
                  disabled={loading}
                  className="h-5 w-5 accent-[#5A2D2D]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-[#E8DDD3] p-5 transition hover:bg-[#FCFAF7]">
                <div>
                  <p className="font-semibold text-[#4B2E2E]">
                    Bestseller
                  </p>

                  <p className="mt-1 text-sm text-[#8B6B5B]">
                    Display the bestseller badge on this product.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.bestseller}
                  onChange={(event) =>
                    updateField(
                      "bestseller",
                      event.target.checked
                    )
                  }
                  disabled={loading}
                  className="h-5 w-5 accent-[#5A2D2D]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-[#E8DDD3] p-5 transition hover:bg-[#FCFAF7]">
                <div>
                  <p className="font-semibold text-[#4B2E2E]">
                    Active Product
                  </p>

                  <p className="mt-1 text-sm text-[#8B6B5B]">
                    Make this product visible and available to buy.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    updateField(
                      "active",
                      event.target.checked
                    )
                  }
                  disabled={loading}
                  className="h-5 w-5 accent-[#5A2D2D]"
                />
              </label>

              <label className="flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-[#D9C8BC] bg-[#F8F4EF] p-5 transition hover:border-[#5A2D2D]">
                <div className="flex min-w-0 items-start gap-3">
                  <Clock3
                    size={22}
                    className="mt-0.5 shrink-0 text-[#5A2D2D]"
                  />

                  <div>
                    <p className="font-semibold text-[#4B2E2E]">
                      30-Minute Reservation
                    </p>

                    <p className="mt-1 text-sm leading-6 text-[#8B6B5B]">
                      Use for a one-of-a-kind piece. Adding it to the
                      cart reserves it for the signed-in customer for
                      30 minutes.
                    </p>
                  </div>
                </div>

                <input
                  type="checkbox"
                  checked={form.reservationEnabled}
                  onChange={(event) =>
                    handleReservationChange(
                      event.target.checked
                    )
                  }
                  disabled={loading}
                  className="h-5 w-5 shrink-0 accent-[#5A2D2D]"
                />
              </label>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex min-w-48 items-center justify-center gap-2 rounded-xl bg-[#5A2D2D] px-8 py-4 font-semibold text-white transition hover:bg-[#442020] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                  Updating...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Update Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}