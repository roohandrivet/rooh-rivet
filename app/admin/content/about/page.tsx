"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import Image from "next/image";
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

const STORAGE_BUCKET =
  "site-content";

const MAX_IMAGE_SIZE =
  8 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES =
  new Set([
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

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function createSafeFileName(
  file: File
): string {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() ||
    "jpg";

  const baseName =
    file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) ||
    "brand-image";

  return `${Date.now()}-${baseName}.${extension}`;
}

function getStoredObjectPath(
  publicUrl: string
): string | null {
  if (!publicUrl) {
    return null;
  }

  const marker =
    `/storage/v1/object/public/${STORAGE_BUCKET}/`;

  const markerIndex =
    publicUrl.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const path =
    publicUrl.slice(
      markerIndex +
        marker.length
    );

  return path
    ? decodeURIComponent(path)
    : null;
}

export default function AboutContentPage() {
  const [content, setContent] =
    useState<AboutContent>(
      DEFAULT_CONTENT
    );

  const [
    originalImageUrl,
    setOriginalImageUrl,
  ] = useState("");

  const [
    selectedImage,
    setSelectedImage,
  ] = useState<File | null>(
    null
  );

  const [
    removeImage,
    setRemoveImage,
  ] = useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const localPreviewUrl =
    useMemo(() => {
      if (!selectedImage) {
        return "";
      }

      return URL.createObjectURL(
        selectedImage
      );
    }, [selectedImage]);

  useEffect(() => {
    return () => {
      if (localPreviewUrl) {
        URL.revokeObjectURL(
          localPreviewUrl
        );
      }
    };
  }, [localPreviewUrl]);

  const visibleImageUrl =
    removeImage
      ? ""
      : localPreviewUrl ||
        content.brand_image_url;

  const loadContent =
    useCallback(async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      setSelectedImage(null);
      setRemoveImage(false);

      try {
        const {
          data,
          error: loadError,
        } = await supabase
          .from("site_content")
          .select(
            `
              heading,
              story,
              mission,
              vision,
              brand_image_url
            `
          )
          .eq("page", "about")
          .maybeSingle();

        if (loadError) {
          throw loadError;
        }

        const loadedContent:
          AboutContent = {
          heading:
            data?.heading ??
            DEFAULT_CONTENT.heading,
          story:
            data?.story ??
            DEFAULT_CONTENT.story,
          mission:
            data?.mission ??
            DEFAULT_CONTENT.mission,
          vision:
            data?.vision ??
            DEFAULT_CONTENT.vision,
          brand_image_url:
            data?.brand_image_url ??
            DEFAULT_CONTENT.brand_image_url,
        };

        setContent(
          loadedContent
        );

        setOriginalImageUrl(
          loadedContent.brand_image_url
        );
      } catch (
        loadError: unknown
      ) {
        console.error(
          "Failed to load about content:",
          loadError
        );

        setError(
          getErrorMessage(
            loadError,
            "Unable to load the About page content."
          )
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadContent();
  }, [loadContent]);

  function updateField<
    K extends keyof AboutContent
  >(
    field: K,
    value: AboutContent[K]
  ): void {
    setContent(
      (current) => ({
        ...current,
        [field]: value,
      })
    );

    setError("");
    setSuccess("");
  }

  function handleImageSelect(
    event:
      ChangeEvent<HTMLInputElement>
  ): void {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setError("");
    setSuccess("");

    if (
      !ALLOWED_IMAGE_TYPES.has(
        file.type
      )
    ) {
      setError(
        "Choose a JPG, PNG or WebP image."
      );
      return;
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      setError(
        "The brand image must be 8 MB or smaller."
      );
      return;
    }

    setSelectedImage(file);
    setRemoveImage(false);
  }

  function handleRemoveImage():
    void {
    setSelectedImage(null);
    setRemoveImage(true);
    setError("");
    setSuccess("");
  }

  async function uploadBrandImage(
    file: File
  ): Promise<string> {
    const filePath =
      `about/${createSafeFileName(
        file
      )}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(
        filePath,
        file,
        {
          cacheControl:
            "3600",
          contentType:
            file.type,
          upsert: false,
        }
      );

    if (uploadError) {
      throw uploadError;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    if (
      !publicUrlData.publicUrl
    ) {
      throw new Error(
        "The image uploaded, but its public URL could not be created."
      );
    }

    return publicUrlData.publicUrl;
  }

  async function deleteStoredImage(
    publicUrl: string
  ): Promise<void> {
    const objectPath =
      getStoredObjectPath(
        publicUrl
      );

    if (!objectPath) {
      return;
    }

    const {
      error: deleteError,
    } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([objectPath]);

    if (deleteError) {
      console.error(
        "Unable to remove previous brand image:",
        deleteError
      );
    }
  }

  async function handleSave():
    Promise<void> {
    if (saving) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    let uploadedImageUrl =
      "";

    try {
      const heading =
        content.heading.trim();

      const story =
        content.story.trim();

      if (!heading) {
        throw new Error(
          "About page heading is required."
        );
      }

      if (!story) {
        throw new Error(
          "Brand story is required."
        );
      }

      let nextImageUrl =
        removeImage
          ? ""
          : content.brand_image_url.trim();

      if (selectedImage) {
        uploadedImageUrl =
          await uploadBrandImage(
            selectedImage
          );

        nextImageUrl =
          uploadedImageUrl;
      }

      const payload:
        AboutContentRow = {
        page: "about",
        heading,
        story,
        mission:
          content.mission.trim(),
        vision:
          content.vision.trim(),
        brand_image_url:
          nextImageUrl,
      };

      const {
        error: saveError,
      } = await supabase
        .from("site_content")
        .upsert(
          payload,
          {
            onConflict: "page",
          }
        );

      if (saveError) {
        throw saveError;
      }

      const previousImageUrl =
        originalImageUrl;

      const imageChanged =
        previousImageUrl &&
        previousImageUrl !==
          nextImageUrl;

      if (imageChanged) {
        await deleteStoredImage(
          previousImageUrl
        );
      }

      setContent({
        heading:
          payload.heading,
        story:
          payload.story,
        mission:
          payload.mission,
        vision:
          payload.vision,
        brand_image_url:
          payload.brand_image_url,
      });

      setOriginalImageUrl(
        payload.brand_image_url
      );

      setSelectedImage(null);
      setRemoveImage(false);

      setSuccess(
        "About page content and brand image saved successfully."
      );
    } catch (
      saveError: unknown
    ) {
      if (uploadedImageUrl) {
        await deleteStoredImage(
          uploadedImageUrl
        );
      }

      console.error(
        "Failed to save about content:",
        saveError
      );

      setError(
        getErrorMessage(
          saveError,
          "Unable to save the About page content."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F8F4EF] p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F5E7E0]">
              <ImageIcon className="h-7 w-7 text-[#5A2D2D]" />
            </div>

            <div>
              <h1 className="font-serif text-4xl text-[#4B2E2E]">
                About Page Content
              </h1>

              <p className="mt-2 text-[#7A6464]">
                Manage your story, mission, vision and brand image.
              </p>
            </div>
          </div>

          <Link
            href="/admin/content"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#E8DED2] bg-white px-5 py-3 text-[#4B2E2E] transition hover:border-[#5A2D2D]"
          >
            <ArrowLeft size={18} />
            Back
          </Link>
        </div>

        {error ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />
            <p>{error}</p>
          </div>
        ) : null}

        {success ? (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
            <CheckCircle2
              size={20}
              className="mt-0.5 shrink-0"
            />
            <p>{success}</p>
          </div>
        ) : null}

        <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
          {loading ? (
            <div className="flex min-h-80 flex-col items-center justify-center text-[#7A6464]">
              <Loader2
                size={34}
                className="animate-spin text-[#5A2D2D]"
              />

              <p className="mt-4">
                Loading About page content...
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                <div>
                  <label
                    htmlFor="about-heading"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Page Heading
                  </label>

                  <input
                    id="about-heading"
                    type="text"
                    value={content.heading}
                    onChange={(event) =>
                      updateField(
                        "heading",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="about-story"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Brand Story
                  </label>

                  <textarea
                    id="about-story"
                    rows={8}
                    value={content.story}
                    onChange={(event) =>
                      updateField(
                        "story",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 leading-7 outline-none transition focus:border-[#5A2D2D]"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="about-mission"
                      className="mb-2 block font-medium text-[#4B2E2E]"
                    >
                      Mission
                    </label>

                    <textarea
                      id="about-mission"
                      rows={7}
                      value={content.mission}
                      onChange={(event) =>
                        updateField(
                          "mission",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 leading-7 outline-none transition focus:border-[#5A2D2D]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="about-vision"
                      className="mb-2 block font-medium text-[#4B2E2E]"
                    >
                      Vision
                    </label>

                    <textarea
                      id="about-vision"
                      rows={7}
                      value={content.vision}
                      onChange={(event) =>
                        updateField(
                          "vision",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 leading-7 outline-none transition focus:border-[#5A2D2D]"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-3">
                    <p className="font-medium text-[#4B2E2E]">
                      Brand Image
                    </p>

                    <p className="mt-1 text-sm text-[#8B7770]">
                      Upload a JPG, PNG or WebP image up to 8 MB.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-[#E8DED2] bg-[#F8F4EF]">
                    {visibleImageUrl ? (
                      <div className="relative aspect-[16/9] w-full">
                        <Image
                          src={
                            visibleImageUrl
                          }
                          alt="About page brand preview"
                          fill
                          unoptimized={
                            Boolean(
                              localPreviewUrl
                            )
                          }
                          sizes="(max-width: 1024px) 100vw, 900px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex aspect-[16/9] flex-col items-center justify-center px-6 text-center text-[#8B7770]">
                        <ImageIcon
                          size={44}
                          strokeWidth={1.4}
                        />

                        <p className="mt-4 font-medium">
                          No brand image uploaded
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-[#E8DED2] bg-white p-4 sm:flex-row">
                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#5A2D2D] px-5 py-3 font-medium text-white transition hover:bg-[#432121]">
                        <Upload size={18} />

                        {visibleImageUrl
                          ? "Replace Image"
                          : "Upload Image"}

                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={
                            handleImageSelect
                          }
                          disabled={saving}
                          className="sr-only"
                        />
                      </label>

                      {visibleImageUrl ? (
                        <button
                          type="button"
                          onClick={
                            handleRemoveImage
                          }
                          disabled={saving}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-5 py-3 font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                          Remove Image
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {selectedImage ? (
                    <p className="mt-3 text-sm text-[#6F5B55]">
                      Selected:{" "}
                      <span className="font-medium">
                        {selectedImage.name}
                      </span>
                      . It will upload when you save.
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() =>
                    void loadContent()
                  }
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl border border-[#DCCEC4] bg-white px-6 py-3 font-medium text-[#5A2D2D] transition hover:bg-[#F8F4EF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={() =>
                    void handleSave()
                  }
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#5A2D2D] px-6 py-3 font-medium text-white transition hover:bg-[#432121] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={18} />
                  )}

                  {saving
                    ? selectedImage
                      ? "Uploading & Saving..."
                      : "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}