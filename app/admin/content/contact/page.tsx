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
  Contact,
  Loader2,
  Save,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type ContactContent = {
  address: string;
  phone: string;
  email: string;
  google_maps_url: string;
  business_hours: string;
  facebook_url: string;
  instagram_url: string;
  x_url: string;
  youtube_url: string;
  linkedin_url: string;
  pinterest_url: string;
  whatsapp_url: string;
};

type ContactContentRow = ContactContent & {
  page: "contact";
};

const DEFAULT_CONTENT: ContactContent = {
  address: "",
  phone: "",
  email: "hello@roohandrivet.com",
  google_maps_url: "",
  business_hours:
    "Monday–Saturday, 10:00 AM–6:00 PM",
  facebook_url: "",
  instagram_url: "",
  x_url: "",
  youtube_url: "",
  linkedin_url: "",
  pinterest_url: "",
  whatsapp_url: "",
};

const SOCIAL_FIELDS: Array<{
  key:
    | "facebook_url"
    | "instagram_url"
    | "x_url"
    | "youtube_url"
    | "linkedin_url"
    | "pinterest_url"
    | "whatsapp_url";
  label: string;
  placeholder: string;
}> = [
  {
    key: "facebook_url",
    label: "Facebook URL",
    placeholder: "https://facebook.com/...",
  },
  {
    key: "instagram_url",
    label: "Instagram URL",
    placeholder: "https://instagram.com/...",
  },
  {
    key: "x_url",
    label: "X URL",
    placeholder: "https://x.com/...",
  },
  {
    key: "youtube_url",
    label: "YouTube URL",
    placeholder: "https://youtube.com/...",
  },
  {
    key: "linkedin_url",
    label: "LinkedIn URL",
    placeholder: "https://linkedin.com/...",
  },
  {
    key: "pinterest_url",
    label: "Pinterest URL",
    placeholder: "https://pinterest.com/...",
  },
  {
    key: "whatsapp_url",
    label: "WhatsApp URL",
    placeholder: "https://wa.me/...",
  },
];

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export default function ContactContentPage() {
  const [content, setContent] =
    useState<ContactContent>(
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
              address,
              phone,
              email,
              google_maps_url,
              business_hours,
              facebook_url,
              instagram_url,
              x_url,
              youtube_url,
              linkedin_url,
              pinterest_url,
              whatsapp_url
            `
          )
          .eq("page", "contact")
          .maybeSingle();

        if (loadError) {
          throw loadError;
        }

        setContent({
          address:
            data?.address ??
            DEFAULT_CONTENT.address,
          phone:
            data?.phone ??
            DEFAULT_CONTENT.phone,
          email:
            data?.email ??
            DEFAULT_CONTENT.email,
          google_maps_url:
            data?.google_maps_url ??
            DEFAULT_CONTENT.google_maps_url,
          business_hours:
            data?.business_hours ??
            DEFAULT_CONTENT.business_hours,
          facebook_url:
            data?.facebook_url ??
            DEFAULT_CONTENT.facebook_url,
          instagram_url:
            data?.instagram_url ??
            DEFAULT_CONTENT.instagram_url,
          x_url:
            data?.x_url ??
            DEFAULT_CONTENT.x_url,
          youtube_url:
            data?.youtube_url ??
            DEFAULT_CONTENT.youtube_url,
          linkedin_url:
            data?.linkedin_url ??
            DEFAULT_CONTENT.linkedin_url,
          pinterest_url:
            data?.pinterest_url ??
            DEFAULT_CONTENT.pinterest_url,
          whatsapp_url:
            data?.whatsapp_url ??
            DEFAULT_CONTENT.whatsapp_url,
        });
      } catch (
        loadError: unknown
      ) {
        console.error(
          "Failed to load contact content:",
          loadError
        );

        setError(
          getErrorMessage(
            loadError,
            "Unable to load the Contact page content."
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
    K extends keyof ContactContent
  >(
    field: K,
    value: ContactContent[K]
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
        ContactContentRow = {
        page: "contact",
        address:
          content.address.trim(),
        phone:
          content.phone.trim(),
        email:
          content.email.trim(),
        google_maps_url:
          content.google_maps_url.trim(),
        business_hours:
          content.business_hours.trim(),
        facebook_url:
          content.facebook_url.trim(),
        instagram_url:
          content.instagram_url.trim(),
        x_url:
          content.x_url.trim(),
        youtube_url:
          content.youtube_url.trim(),
        linkedin_url:
          content.linkedin_url.trim(),
        pinterest_url:
          content.pinterest_url.trim(),
        whatsapp_url:
          content.whatsapp_url.trim(),
      };

      if (!payload.email) {
        throw new Error(
          "Contact email is required."
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
        address: payload.address,
        phone: payload.phone,
        email: payload.email,
        google_maps_url:
          payload.google_maps_url,
        business_hours:
          payload.business_hours,
        facebook_url:
          payload.facebook_url,
        instagram_url:
          payload.instagram_url,
        x_url: payload.x_url,
        youtube_url:
          payload.youtube_url,
        linkedin_url:
          payload.linkedin_url,
        pinterest_url:
          payload.pinterest_url,
        whatsapp_url:
          payload.whatsapp_url,
      });

      setSuccess(
        "Contact page content saved successfully."
      );
    } catch (
      saveError: unknown
    ) {
      console.error(
        "Failed to save contact content:",
        saveError
      );

      setError(
        getErrorMessage(
          saveError,
          "Unable to save the Contact page content."
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
              <Contact className="h-7 w-7 text-[#5A2D2D]" />
            </div>

            <div>
              <h1 className="font-serif text-4xl text-[#4B2E2E]">
                Contact Page Content
              </h1>

              <p className="mt-2 text-[#7A6464]">
                Manage contact details, hours, map and social links.
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
                Loading Contact page content...
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-6">
                <div>
                  <label
                    htmlFor="contact-address"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Address
                  </label>

                  <textarea
                    id="contact-address"
                    rows={4}
                    value={content.address}
                    onChange={(event) =>
                      updateField(
                        "address",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 leading-7 outline-none transition focus:border-[#5A2D2D]"
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="mb-2 block font-medium text-[#4B2E2E]"
                    >
                      Phone
                    </label>

                    <input
                      id="contact-phone"
                      type="tel"
                      value={content.phone}
                      onChange={(event) =>
                        updateField(
                          "phone",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block font-medium text-[#4B2E2E]"
                    >
                      Email
                    </label>

                    <input
                      id="contact-email"
                      type="email"
                      value={content.email}
                      onChange={(event) =>
                        updateField(
                          "email",
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-hours"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Business Hours
                  </label>

                  <textarea
                    id="contact-hours"
                    rows={4}
                    value={
                      content.business_hours
                    }
                    onChange={(event) =>
                      updateField(
                        "business_hours",
                        event.target.value
                      )
                    }
                    className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 leading-7 outline-none transition focus:border-[#5A2D2D]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-map"
                    className="mb-2 block font-medium text-[#4B2E2E]"
                  >
                    Google Maps Embed URL
                  </label>

                  <input
                    id="contact-map"
                    type="url"
                    value={
                      content.google_maps_url
                    }
                    onChange={(event) =>
                      updateField(
                        "google_maps_url",
                        event.target.value
                      )
                    }
                    placeholder="https://www.google.com/maps/embed?..."
                    className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                  />

                  <p className="mt-2 text-sm text-[#8B7770]">
                    Use the URL from Google Maps → Share → Embed a map.
                  </p>
                </div>

                <div>
                  <h2 className="font-serif text-2xl text-[#4B2E2E]">
                    Social Links
                  </h2>

                  <div className="mt-5 grid gap-5 md:grid-cols-2">
                    {SOCIAL_FIELDS.map(
                      (field) => (
                        <div key={field.key}>
                          <label
                            htmlFor={field.key}
                            className="mb-2 block font-medium text-[#4B2E2E]"
                          >
                            {field.label}
                          </label>

                          <input
                            id={field.key}
                            type="url"
                            value={
                              content[field.key]
                            }
                            onChange={(event) =>
                              updateField(
                                field.key,
                                event.target.value
                              )
                            }
                            placeholder={
                              field.placeholder
                            }
                            className="w-full rounded-xl border border-[#E8DED2] px-4 py-3 outline-none transition focus:border-[#5A2D2D]"
                          />
                        </div>
                      )
                    )}
                  </div>
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