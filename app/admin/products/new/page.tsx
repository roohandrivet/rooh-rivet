"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock3,
  ImagePlus,
  Loader2,
  Save,
  Upload,
  Video,
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
  variantGroup: string;
  colorName: string;
  colorHex: string;
};

type UploadedImage = {
  path: string;
  publicUrl: string;
};

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
  variantGroup: "",
  colorName: "",
  colorHex: "#752638",
};

const MAX_IMAGES = 4;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-quicktime",
]);

function getVideoFormat(file: File): "mp4" | "webm" | "mov" | null {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "mp4" || extension === "webm" || extension === "mov") {
    return extension;
  }

  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/quicktime" || file.type === "video/x-quicktime") {
    return "mov";
  }

  return null;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

export default function NewProductPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<ProductForm>(INITIAL_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [variantGroups, setVariantGroups] = useState<string[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const previewsRef = useRef<string[]>([]);
  const videoPreviewRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadGroups() {
      const { data, error: groupsError } = await supabase
        .from("products")
        .select("variant_group")
        .not("variant_group", "is", null);
      if (groupsError) {
        console.error("Failed to load variant groups", groupsError);
        return;
      }
      if (!cancelled) {
        setVariantGroups(Array.from(new Set((data ?? [])
          .map((item) => item.variant_group as string | null)
          .filter((group): group is string => Boolean(group?.trim())))).sort());
      }
    }
    void loadGroups();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    videoPreviewRef.current = videoPreview;
  }, [videoPreview]);

  useEffect(() => {
    return () => {
      if (videoPreviewRef.current) {
        URL.revokeObjectURL(videoPreviewRef.current);
      }
      previewsRef.current.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });
    };
  }, []);

  function updateField<K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleReservationChange(enabled: boolean) {
    setForm((current) => ({
      ...current,
      reservationEnabled: enabled,
      stock: enabled ? "1" : current.stock,
    }));
  }

  function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(
      event.target.files ?? []
    ).filter((file) => file.type.startsWith("image/"));

    event.target.value = "";

    if (selectedFiles.length === 0) {
      return;
    }

    const remainingSlots = MAX_IMAGES - files.length;

    if (remainingSlots <= 0) {
      setError(
        `You can upload a maximum of ${MAX_IMAGES} images.`
      );
      return;
    }

    const acceptedFiles = selectedFiles.slice(0, remainingSlots);
    const newPreviews = acceptedFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setFiles((current) => [...current, ...acceptedFiles]);
    setPreviews((current) => [...current, ...newPreviews]);

    if (selectedFiles.length > remainingSlots) {
      setError(
        `Only ${remainingSlots} more ${
          remainingSlots === 1 ? "image was" : "images were"
        } added. A product can have up to ${MAX_IMAGES} images.`
      );
    } else {
      setError("");
    }
  }

  function removeImage(index: number) {
    setPreviews((current) => {
      const preview = current[index];

      if (preview) {
        URL.revokeObjectURL(preview);
      }

      return current.filter(
        (_preview, previewIndex) => previewIndex !== index
      );
    });

    setFiles((current) =>
      current.filter((_file, fileIndex) => fileIndex !== index)
    );
  }

  function handleVideo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!getVideoFormat(file) || (file.type && !VIDEO_TYPES.has(file.type))) {
      setError("Please choose an MP4, WEBM or iPhone MOV video.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setError("Product videos must be 50 MB or smaller.");
      return;
    }
    const newPreview = URL.createObjectURL(file);
    setVideoPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return newPreview;
    });
    setVideoFile(file);
    setError("");
  }

  function removeVideo() {
    setVideoFile(null);
    setVideoPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
  }

  async function uploadVideo(file: File): Promise<UploadedImage> {
    const extension = getVideoFormat(file);
    if (!extension) throw new Error("Unsupported video format.");
    const contentType =
      extension === "mov"
        ? "video/quicktime"
        : extension === "webm"
          ? "video/webm"
          : "video/mp4";
    const path = `videos/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("products")
      .upload(path, file, {
        cacheControl: "3600",
        contentType,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("products").getPublicUrl(path);
    return { path, publicUrl: data.publicUrl };
  }

  async function uploadImages(uploadedImages: UploadedImage[]): Promise<void> {
    for (const file of files) {
      const extension = getFileExtension(file);
      const filePath = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicUrlData } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      uploadedImages.push({
        path: filePath,
        publicUrl: publicUrlData.publicUrl,
      });
    }
  }

  async function removeUploadedImages(
    uploadedImages: UploadedImage[]
  ): Promise<void> {
    if (uploadedImages.length === 0) {
      return;
    }

    const { error: removeError } = await supabase.storage
      .from("products")
      .remove(uploadedImages.map((image) => image.path));

    if (removeError) {
      console.error(
        "Failed to clean up uploaded product images:",
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

    const name = form.name.trim();
    const description = form.description.trim();
    const category = form.category.trim();
    const price = Number(form.price);
    const rawStock = Number(form.stock);
    const stock = form.reservationEnabled
      ? 1
      : Math.max(0, Math.floor(rawStock));
    const slug = generateSlug(name);
    const variantGroup = form.variantGroup.trim().toLowerCase();
    const colorName = form.colorName.trim();
    const colorHex = form.colorHex.trim();
    if (Boolean(variantGroup) !== Boolean(colorName)) {
      setError("Provide both a variant group and a colour name, or leave both blank.");
      return;
    }
    if (variantGroup && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(variantGroup)) {
      setError("Variant group must use lowercase letters, numbers and hyphens (e.g. zaria-earrings).");
      return;
    }
    if (variantGroup && !/^#[0-9a-fA-F]{6}$/.test(colorHex)) {
      setError("Choose a valid six-digit colour (e.g. #752638).");
      return;
    }


    if (!name) {
      setError("Product name is required.");
      return;
    }

    if (!slug) {
      setError("Please enter a valid product name.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid product price greater than zero.");
      return;
    }

    if (
      !form.reservationEnabled &&
      (!Number.isFinite(rawStock) || rawStock < 0)
    ) {
      setError("Enter a valid stock quantity.");
      return;
    }

    if (files.length === 0) {
      setError("Please upload at least one product image.");
      return;
    }

    const uploadedImages: UploadedImage[] = [];
    let uploadedVideo: UploadedImage | null = null;

    try {
      setLoading(true);

      const {
        data: existingProduct,
        error: slugCheckError,
      } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugCheckError) {
        throw slugCheckError;
      }

      if (existingProduct) {
        setError(
          "A product with this name already exists. Please use a different product name."
        );
        return;
      }

      await uploadImages(uploadedImages);
      if (videoFile) {
        uploadedVideo = await uploadVideo(videoFile);
      }

      const imageUrls = uploadedImages.map(
        (image) => image.publicUrl
      );

      const { error: insertError } = await supabase
        .from("products")
        .insert({
          slug,
          name,
          variant_group: variantGroup || null,
          color_name: colorName || null,
          color_hex: variantGroup ? colorHex : null,
          description: description || null,
          price,
          category: category || null,
          stock,
          featured: form.featured,
          bestseller: form.bestseller,
          active: form.active,
          reservation_enabled: form.reservationEnabled,
          reserved_by: null,
          reserved_until: null,
          image: imageUrls[0] ?? null,
          image_1: imageUrls[1] ?? null,
          image_2: imageUrls[2] ?? null,
          image_3: imageUrls[3] ?? null,
          video_url: uploadedVideo?.publicUrl ?? null,
        });

      if (insertError) {
        throw insertError;
      }

      previews.forEach((preview) => {
        URL.revokeObjectURL(preview);
      });

      setForm(INITIAL_FORM);
      setFiles([]);
      setPreviews([]);
      removeVideo();

      router.push("/admin/products");
      router.refresh();
    } catch (submitError) {
      console.error("Failed to save product:", submitError);

      await removeUploadedImages([
        ...uploadedImages,
        ...(uploadedVideo ? [uploadedVideo] : []),
      ]);

      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to save product."
      );
    } finally {
      setLoading(false);
    }
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
              Add New Product
            </h1>
          </div>
        </div>

        {error ? (
          <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {error}
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
                  Upload up to four images. The first image will be
                  used as the main product image.
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
                Upload Product Images
              </span>

              <span className="mt-2 text-sm text-[#8B6B5B]">
                JPG, PNG or WEBP · {files.length}/{MAX_IMAGES} uploaded
              </span>

              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImages}
                disabled={loading || files.length >= MAX_IMAGES}
                className="hidden"
              />
            </label>

            {previews.length > 0 ? (
              <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                {previews.map((preview, index) => (
                  <div
                    key={preview}
                    className="relative overflow-hidden rounded-2xl border border-[#E8DDD3] bg-white"
                  >
                    <Image
                      src={preview}
                      alt={`Product preview ${index + 1}`}
                      width={500}
                      height={500}
                      className="h-52 w-full object-cover"
                      unoptimized
                    />

                    <button
                      type="button"
                      aria-label={`Remove image ${index + 1}`}
                      onClick={() => removeImage(index)}
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
            ) : null}
            <div className="mt-10 border-t border-[#E8DDD3] pt-8">
              <div className="mb-5 flex items-center gap-3">
                <Video size={26} className="text-[#8B6B5B]" />
                <div>
                  <h2 className="font-serif text-2xl font-semibold text-[#4B2E2E]">
                    Product Video (Optional)
                  </h2>
                  <p className="mt-1 text-sm text-[#7A6464]">
                    Upload one MP4, WEBM or iPhone MOV video, up to 50 MB.
                  </p>
                </div>
              </div>

              {!videoPreview ? (
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8C3B0] bg-[#FCFAF7] p-8 text-center transition hover:border-[#5A2D2D] hover:bg-[#F8F4EF]">
                  <Video size={38} className="mb-3 text-[#5A2D2D]" />
                  <span className="font-semibold text-[#4B2E2E]">Upload Product Video</span>
                  <span className="mt-2 text-sm text-[#8B6B5B]">MP4, WEBM or MOV · Maximum 50 MB</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mov"
                    onChange={handleVideo}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="relative max-w-md overflow-hidden rounded-2xl border border-[#E8DDD3] bg-stone-950">
                  <video
                    src={videoPreview}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full object-contain"
                    aria-label="Product video preview"
                  />
                  <button
                    type="button"
                    onClick={removeVideo}
                    disabled={loading}
                    aria-label="Remove product video"
                    className="absolute right-2 top-2 rounded-full bg-red-600 p-2 text-white transition hover:bg-red-700 disabled:opacity-60"
                  >
                    <X size={16} />
                  </button>
                  <p className="px-3 py-2 text-xs text-white/80">{videoFile?.name}</p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-7">
              <h2 className="font-serif text-2xl font-semibold text-[#4B2E2E]">
                Product Details
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#7A6464]">
                Add the product information shown to customers.
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
                  disabled={loading || form.reservationEnabled}
                  className="w-full rounded-xl border border-[#D8C3B0] bg-white p-3.5 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:opacity-70"
                />

                {form.reservationEnabled ? (
                  <p className="mt-2 text-sm text-[#8B6B5B]">
                    Stock is fixed at one for reservation-enabled
                    products.
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
                    updateField("description", event.target.value)
                  }
                  disabled={loading}
                  className="w-full resize-y rounded-xl border border-[#D8C3B0] bg-white p-3.5 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
            <h2 className="font-serif text-2xl font-semibold text-[#4B2E2E]">Colour Variants</h2>
            <p className="mt-2 mb-6 text-sm text-[#7A6464]">
              Keep this colour as its own listing and product page. Use the same variant group
              on all colours of a design to link them together. Leave blank for standalone products.
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="variant-group" className="mb-2 block font-medium text-[#4B2E2E]">Variant Group</label>
                <input id="variant-group" list="variant-groups" value={form.variantGroup}
                  onChange={(event) => updateField("variantGroup", event.target.value)}
                  placeholder="zaria-earrings" disabled={loading}
                  className="w-full rounded-xl border border-[#D8C3B0] p-3.5" />
                <datalist id="variant-groups">{variantGroups.map(group => <option key={group} value={group} />)}</datalist>
                <p className="mt-2 text-xs text-[#8B6B5B]">Select an existing group or type a new group ID.</p>
              </div>
              <div>
                <label htmlFor="colour-name" className="mb-2 block font-medium text-[#4B2E2E]">Colour Name</label>
                <input id="colour-name" value={form.colorName}
                  onChange={(event) => updateField("colorName", event.target.value)}
                  placeholder="Maroon" disabled={loading}
                  className="w-full rounded-xl border border-[#D8C3B0] p-3.5" />
              </div>
              <div>
                <label htmlFor="colour-hex" className="mb-2 block font-medium text-[#4B2E2E]">Colour Swatch</label>
                <div className="flex items-center gap-3">
                  <input id="colour-hex" type="color" value={form.colorHex}
                    onChange={(event) => updateField("colorHex", event.target.value)}
                    disabled={loading || !form.variantGroup.trim()}
                    className="h-12 w-16 cursor-pointer rounded-lg border border-[#D8C3B0] p-1" />
                  <span className="text-sm text-[#8B6B5B]">{form.colorHex}</span>
                </div>
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
                    updateField("featured", event.target.checked)
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
                    updateField("bestseller", event.target.checked)
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
                    updateField("active", event.target.checked)
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
                    handleReservationChange(event.target.checked)
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
                  <Loader2 size={18} className="animate-spin" />
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
    </main>
  );
}