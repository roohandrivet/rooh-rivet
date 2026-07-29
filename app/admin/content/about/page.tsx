"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Save,
  Trash2,
  Upload,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type AboutContent = {
  heading: string;
  story: string;
  mission: string;
  vision: string;
  brand_image_url: string;
};

type AboutContentRow = AboutContent & {
  page: "about";
};

const STORAGE_BUCKET = "site-content";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const DEFAULT_CONTENT: AboutContent = {
  heading: "Our Story",
  story:
    "Rooh & Rivet was created from a love of jewellery that feels personal, meaningful and timeless. Every piece is thoughtfully selected to celebrate individuality and the moments that matter most.",
  mission:
    "To offer distinctive jewellery that combines considered design, enduring quality and effortless elegance.",
  vision:
    "To build a trusted jewellery house known for meaningful design, exceptional service and pieces that become part of your story.",
  brand_image_url: "",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to save the About page.";
}

function getFileExtension(file: File): string {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "png" || extension === "webp") {
    return extension;
  }

  return "jpg";
}

function getStoragePath(publicUrl: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const markerIndex = publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const path = publicUrl.slice(markerIndex + marker.length);
  return path ? decodeURIComponent(path) : null;
}

export default function AboutContentPage() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [originalImageUrl, setOriginalImageUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadContent = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data, error: loadError } = await supabase
        .from("site_content")
        .select("heading, story, mission, vision, brand_image_url")
        .eq("page", "about")
        .maybeSingle();

      if (loadError) {
        throw loadError;
      }

      const loadedContent: AboutContent = {
        heading: data?.heading ?? DEFAULT_CONTENT.heading,
        story: data?.story ?? DEFAULT_CONTENT.story,
        mission: data?.mission ?? DEFAULT_CONTENT.mission,
        vision: data?.vision ?? DEFAULT_CONTENT.vision,
        brand_image_url:
          data?.brand_image_url ?? DEFAULT_CONTENT.brand_image_url,
      };

      setContent(loadedContent);
      setOriginalImageUrl(loadedContent.brand_image_url);
      setSelectedImage(null);
      setPreviewUrl("");
      setRemoveImage(false);
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function updateField(field: keyof AboutContent, value: string): void {
    setContent((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
    setSuccess("");
  }

  function handleImageSelect(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("The image must be 8 MB or smaller.");
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemoveImage(false);
    setError("");
    setSuccess("");
  }

  function handleRemoveImage(): void {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedImage(null);
    setPreviewUrl("");
    setRemoveImage(true);
    setError("");
    setSuccess("");
  }

  async function uploadImage(file: File): Promise<string> {
    const extension = getFileExtension(file);
    const filePath = `about/${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (!data.publicUrl) {
      throw new Error("The image uploaded but no public URL was returned.");
    }

    return data.publicUrl;
  }

  async function deleteImage(publicUrl: string): Promise<void> {
    const path = getStoragePath(publicUrl);

    if (!path) {
      return;
    }

    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (deleteError) {
      console.error("Unable to delete old About image:", deleteError);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    let newlyUploadedUrl = "";

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Your admin session has expired. Sign in again.");
      }

      const heading = content.heading.trim();
      const story = content.story.trim();

      if (!heading) {
        throw new Error("Page heading is required.");
      }

      if (!story) {
        throw new Error("Brand story is required.");
      }

      let brandImageUrl = removeImage
        ? ""
        : content.brand_image_url.trim();

      if (selectedImage) {
        newlyUploadedUrl = await uploadImage(selectedImage);
        brandImageUrl = newlyUploadedUrl;
      }

      const payload: AboutContentRow = {
        page: "about",
        heading,
        story,
        mission: content.mission.trim(),
        vision: content.vision.trim(),
        brand_image_url: brandImageUrl,
      };

      const { data: savedRow, error: saveError } = await supabase
        .from("site_content")
        .upsert(payload, { onConflict: "page" })
        .select("page, heading, story, mission, vision, brand_image_url")
        .single();

      if (saveError) {
        throw saveError;
      }

      if (!savedRow || savedRow.page !== "about") {
        throw new Error("Supabase did not return the saved About row.");
      }

      if (
        originalImageUrl &&
        originalImageUrl !== savedRow.brand_image_url
      ) {
        await deleteImage(originalImageUrl);
      }

      const verifiedContent: AboutContent = {
        heading: savedRow.heading ?? "",
        story: savedRow.story ?? "",
        mission: savedRow.mission ?? "",
        vision: savedRow.vision ?? "",
        brand_image_url: savedRow.brand_image_url ?? "",
      };

      setContent(verifiedContent);
      setOriginalImageUrl(verifiedContent.brand_image_url);
      setSelectedImage(null);
      setPreviewUrl("");
      setRemoveImage(false);
      setSuccess(
        "Saved and verified in Supabase. Refresh the public About page."
      );
    } catch (saveError: unknown) {
      if (newlyUploadedUrl) {
        await deleteImage(newlyUploadedUrl);
      }

      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  const visibleImageUrl = removeImage
    ? ""
    : previewUrl || content.brand_image_url;

  return (
    <main className="min-h-screen bg-[#F8F4EF] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8B6B5B]">
              Content Management
            </p>
            <h1 className="mt-3 font-serif text-4xl text-[#4B2E2E]">
              About Page
            </h1>
            <p className="mt-2 text-[#7A6464]">
              Edit the public About page and upload its main image.
            </p>
          </div>

          <Link
            href="/admin/content"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E8DED2] bg-white px-5 py-3 text-[#4B2E2E]"
          >
            <ArrowLeft size={18} />
            Back
          </Link>
        </div>

        {error ? (
          <div className="mb-6 flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={20} />
            <p>{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
            <p>{success}</p>
          </div>
        ) : null}

        <section className="rounded-3xl border border-[#E8DED2] bg-white p-6 shadow-sm sm:p-8">
          {loading ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-[#7A6464]">
              <Loader2 className="animate-spin text-[#5A2D2D]" size={34} />
              <p className="mt-4">Loading About content...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label
                  htmlFor="heading"
                  className="mb-2 block font-medium text-[#4B2E2E]"
                >
                  Page Heading
                </label>
                <input
                  id="heading"
                  value={content.heading}
                  onChange={(event) =>
                    updateField("heading", event.target.value)
                  }
                  className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none focus:border-[#5A2D2D]"
                />
              </div>

              <div>
                <label
                  htmlFor="story"
                  className="mb-2 block font-medium text-[#4B2E2E]"
                >
                  Brand Story
                </label>
                <textarea
                  id="story"
                  rows={8}
                  value={content.story}
                  onChange={(event) =>
                    updateField("story", event.target.value)
                  }
                  className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 leading-7 outline-none focus:border-[#5A2D2D]"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="mission"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Mission
                  </label>
                  <textarea
                    id="mission"
                    rows={7}
                    value={content.mission}
                    onChange={(event) =>
                      updateField("mission", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 leading-7 outline-none focus:border-[#5A2D2D]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="vision"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Vision
                  </label>
                  <textarea
                    id="vision"
                    rows={7}
                    value={content.vision}
                    onChange={(event) =>
                      updateField("vision", event.target.value)
                    }
                    className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 leading-7 outline-none focus:border-[#5A2D2D]"
                  />
                </div>
              </div>

              <div>
                <p className="mb-2 font-medium text-[#4B2E2E]">
                  Brand Image
                </p>

                <div className="overflow-hidden rounded-3xl border border-[#E8DED2] bg-[#F8F4EF]">
                  {visibleImageUrl ? (
                    <div className="aspect-[16/9] w-full overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={visibleImageUrl}
                        alt="About page preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] flex-col items-center justify-center text-[#8B7770]">
                      <ImageIcon size={46} strokeWidth={1.4} />
                      <p className="mt-4">No image uploaded</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-t border-[#E8DED2] bg-white p-4 sm:flex-row">
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#5A2D2D] px-5 py-3 font-medium text-white">
                      <Upload size={18} />
                      {visibleImageUrl ? "Replace Image" : "Upload Image"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageSelect}
                        disabled={saving}
                        className="sr-only"
                      />
                    </label>

                    {visibleImageUrl ? (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={saving}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 font-medium text-red-700"
                      >
                        <Trash2 size={18} />
                        Remove Image
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => void loadContent()}
                  disabled={saving}
                  className="rounded-xl border border-[#DCCEC4] px-6 py-3 font-medium text-[#5A2D2D]"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5A2D2D] px-6 py-3 font-medium text-white disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}