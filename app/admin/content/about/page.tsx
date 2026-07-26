"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Save,
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

export default function AboutContentPage() {
  const [content, setContent] =
    useState<AboutContent>(
      DEFAULT_CONTENT
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadContent =
    useCallback(async () => {
      setLoading(true);
      setError("");
      setSuccess("");

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

        setContent({
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
        });
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

  async function handleSave():
    Promise<void> {
    if (saving) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload:
        AboutContentRow = {
        page: "about",
        heading:
          content.heading.trim(),
        story:
          content.story.trim(),
        mission:
          content.mission.trim(),
        vision:
          content.vision.trim(),
        brand_image_url:
          content.brand_image_url.trim(),
      };

      if (!payload.heading) {
        throw new Error(
          "About page heading is required."
        );
      }

      if (!payload.story) {
        throw new Error(
          "Brand story is required."
        );
      }

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

      setSuccess(
        "About page content saved successfully."
      );
    } catch (
      saveError: unknown
    ) {
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
                  <label
                    htmlFor="about-image"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Brand Image URL
                  </label>

                  <input
                    id="about-image"
                    type="url"
                    value={
                      content.brand_image_url
                    }
                    onChange={(event) =>
                      updateField(
                        "brand_image_url",
                        event.target.value
                      )
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                  />
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
                    ? "Saving..."
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