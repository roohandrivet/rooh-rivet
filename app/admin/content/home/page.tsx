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
  Home,
  Loader2,
  Save,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type HomeContent = {
  hero_title: string;
  hero_subtitle: string;
  hero_button_text: string;
  hero_button_link: string;
  featured_heading: string;
  featured_description: string;
};

type HomeContentRow = HomeContent & {
  page: string;
};

const DEFAULT_CONTENT: HomeContent = {
  hero_title: "Jewellery That Tells Your Story.",
  hero_subtitle:
    "Discover timeless handcrafted jewellery designed with elegance, passion and craftsmanship. Every Rooh & Rivet piece is created to celebrate life's most meaningful moments.",
  hero_button_text: "Shop Collection",
  hero_button_link: "/shop",
  featured_heading: "Featured Collection",
  featured_description:
    "Discover a curated selection of one-of-a-kind handcrafted jewellery.",
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

export default function HomeContentPage() {
  const [content, setContent] =
    useState<HomeContent>(
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
              page,
              hero_title,
              hero_subtitle,
              hero_button_text,
              hero_button_link,
              featured_heading,
              featured_description
            `
          )
          .eq("page", "home")
          .maybeSingle();

        if (loadError) {
          throw loadError;
        }

        if (!data) {
          setContent(
            DEFAULT_CONTENT
          );
          return;
        }

        const row =
          data as HomeContentRow;

        setContent({
          hero_title:
            row.hero_title ??
            DEFAULT_CONTENT.hero_title,
          hero_subtitle:
            row.hero_subtitle ??
            DEFAULT_CONTENT.hero_subtitle,
          hero_button_text:
            row.hero_button_text ??
            DEFAULT_CONTENT.hero_button_text,
          hero_button_link:
            row.hero_button_link ??
            DEFAULT_CONTENT.hero_button_link,
          featured_heading:
            row.featured_heading ??
            DEFAULT_CONTENT.featured_heading,
          featured_description:
            row.featured_description ??
            DEFAULT_CONTENT.featured_description,
        });
      } catch (
        loadError: unknown
      ) {
        console.error(
          "Failed to load homepage content:",
          loadError
        );

        setError(
          getErrorMessage(
            loadError,
            "Unable to load homepage content."
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
    K extends keyof HomeContent
  >(
    field: K,
    value: HomeContent[K]
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
        HomeContentRow = {
        page: "home",
        hero_title:
          content.hero_title.trim(),
        hero_subtitle:
          content.hero_subtitle.trim(),
        hero_button_text:
          content.hero_button_text.trim(),
        hero_button_link:
          content.hero_button_link.trim(),
        featured_heading:
          content.featured_heading.trim(),
        featured_description:
          content.featured_description.trim(),
      };

      if (!payload.hero_title) {
        throw new Error(
          "Hero title is required."
        );
      }

      if (
        !payload.hero_button_text
      ) {
        throw new Error(
          "Hero button text is required."
        );
      }

      if (
        !payload.hero_button_link
      ) {
        throw new Error(
          "Hero button link is required."
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
        hero_title:
          payload.hero_title,
        hero_subtitle:
          payload.hero_subtitle,
        hero_button_text:
          payload.hero_button_text,
        hero_button_link:
          payload.hero_button_link,
        featured_heading:
          payload.featured_heading,
        featured_description:
          payload.featured_description,
      });

      setSuccess(
        "Homepage content saved successfully."
      );
    } catch (
      saveError: unknown
    ) {
      console.error(
        "Failed to save homepage content:",
        saveError
      );

      setError(
        getErrorMessage(
          saveError,
          "Unable to save homepage content."
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
              <Home className="h-7 w-7 text-[#5A2D2D]" />
            </div>

            <div>
              <h1 className="font-serif text-4xl text-[#4B2E2E]">
                Homepage Content
              </h1>

              <p className="mt-2 text-[#7A6464]">
                Update the homepage without touching any code.
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
                Loading homepage content...
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                <div>
                  <label
                    htmlFor="hero-title"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Hero Title
                  </label>

                  <input
                    id="hero-title"
                    type="text"
                    value={
                      content.hero_title
                    }
                    onChange={(event) =>
                      updateField(
                        "hero_title",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="hero-subtitle"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Hero Subtitle
                  </label>

                  <textarea
                    id="hero-subtitle"
                    rows={4}
                    value={
                      content.hero_subtitle
                    }
                    onChange={(event) =>
                      updateField(
                        "hero_subtitle",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="hero-button-text"
                      className="mb-2 block font-medium text-[#4B2E2E]"
                    >
                      Hero Button Text
                    </label>

                    <input
                      id="hero-button-text"
                      type="text"
                      value={
                        content.hero_button_text
                      }
                      onChange={(event) =>
                        updateField(
                          "hero_button_text",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="hero-button-link"
                      className="mb-2 block font-medium text-[#4B2E2E]"
                    >
                      Hero Button Link
                    </label>

                    <input
                      id="hero-button-link"
                      type="text"
                      value={
                        content.hero_button_link
                      }
                      onChange={(event) =>
                        updateField(
                          "hero_button_link",
                          event.target.value
                        )
                      }
                      placeholder="/shop"
                      className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="featured-heading"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Featured Collection Heading
                  </label>

                  <input
                    id="featured-heading"
                    type="text"
                    value={
                      content.featured_heading
                    }
                    onChange={(event) =>
                      updateField(
                        "featured_heading",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="featured-description"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Featured Collection Description
                  </label>

                  <textarea
                    id="featured-description"
                    rows={5}
                    value={
                      content.featured_description
                    }
                    onChange={(event) =>
                      updateField(
                        "featured_description",
                        event.target.value
                      )
                    }
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