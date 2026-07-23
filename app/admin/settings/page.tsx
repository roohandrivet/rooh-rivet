"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type SettingsRow = {
  id: number;
  store_name: string;
  tagline: string;
  whatsapp: string;
  instagram: string;
  email: string;
  hero_title: string;
  hero_subtitle: string;
  announcement_bar: string;
  shipping_message: string;
  footer_text: string;
  logo_url: string;
  base_currency: string;
  supported_currencies: string[];
  auto_update_exchange_rates: boolean;

  reviews_enabled: boolean;
  reviews_require_approval: boolean;
  show_review_count: boolean;
  show_rating_summary: boolean;
};

const DEFAULT_SETTINGS: Omit<SettingsRow, "id"> = {
  store_name: "Rooh & Rivet",
  tagline: "Luxury Handcrafted Jewellery",
  whatsapp: "",
  instagram: "",
  email: "",
  hero_title: "Timeless Elegance, Crafted for You",
  hero_subtitle:
    "Discover handcrafted jewellery inspired by heritage and designed for modern elegance.",
  announcement_bar: "Free Shipping Across India",
  shipping_message:
    "Orders are processed within 1–3 business days.",
  footer_text:
    "© Rooh & Rivet. All Rights Reserved.",
  logo_url: "",
  base_currency: "INR",
  supported_currencies: [
    "INR",
    "USD",
    "EUR",
    "GBP",
  ],
  auto_update_exchange_rates: true,

  reviews_enabled: true,
  reviews_require_approval: true,
  show_review_count: true,
  show_rating_summary: true,
};

const AVAILABLE_CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
];

export default function AdminSettingsPage() {
  const [settings, setSettings] =
    useState<SettingsRow>({
      id: 1,
      ...DEFAULT_SETTINGS,
    });

  const [initialSettings, setInitialSettings] =
    useState<SettingsRow>({
      id: 1,
      ...DEFAULT_SETTINGS,
    });

  const [pageLoading, setPageLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setPageLoading(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        const row: SettingsRow = {
          id: data.id,

          store_name:
            data.store_name ?? "",
          tagline:
            data.tagline ?? "",
          whatsapp:
            data.whatsapp ?? "",
          instagram:
            data.instagram ?? "",
          email:
            data.email ?? "",

          hero_title:
            data.hero_title ?? "",
          hero_subtitle:
            data.hero_subtitle ?? "",

          announcement_bar:
            data.announcement_bar ?? "",

          shipping_message:
            data.shipping_message ?? "",

          footer_text:
            data.footer_text ?? "",

          logo_url:
            data.logo_url ?? "",

          base_currency:
            data.base_currency ?? "INR",

          supported_currencies:
            Array.isArray(
              data.supported_currencies
            )
              ? data.supported_currencies
              : DEFAULT_SETTINGS.supported_currencies,

          auto_update_exchange_rates:
            data.auto_update_exchange_rates ??
            true,

          reviews_enabled:
            data.reviews_enabled ?? true,

          reviews_require_approval:
            data.reviews_require_approval ?? true,

          show_review_count:
            data.show_review_count ?? true,

          show_rating_summary:
            data.show_rating_summary ?? true,
        };

        setSettings(row);
        setInitialSettings(row);
      } else {
        const { data: inserted, error: insertError } =
          await supabase
            .from("settings")
            .insert(DEFAULT_SETTINGS)
            .select()
            .single();

        if (insertError) {
          throw insertError;
        }

        const row: SettingsRow = {
          id: inserted.id,
          ...DEFAULT_SETTINGS,
        };

        setSettings(row);
        setInitialSettings(row);
      }
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to load settings.",
      });
    } finally {
      setPageLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        store_name: settings.store_name,
        tagline: settings.tagline,
        whatsapp: settings.whatsapp,
        instagram: settings.instagram,
        email: settings.email,

        hero_title: settings.hero_title,
        hero_subtitle:
          settings.hero_subtitle,

        announcement_bar:
          settings.announcement_bar,

        shipping_message:
          settings.shipping_message,

        footer_text:
          settings.footer_text,

        logo_url:
          settings.logo_url,

        base_currency:
          settings.base_currency,

        supported_currencies:
          settings.supported_currencies,

        auto_update_exchange_rates:
          settings.auto_update_exchange_rates,

        reviews_enabled:
          settings.reviews_enabled,

        reviews_require_approval:
          settings.reviews_require_approval,

        show_review_count:
          settings.show_review_count,

        show_rating_summary:
          settings.show_rating_summary,
      };
      const { data, error } =
      await supabase
        .from("settings")
        .update(payload)
        .eq("id", settings.id)
        .select()
        .single();

    if (error) {
      throw error;
    }

    const updated: SettingsRow = {
      id: data.id,

      store_name:
        data.store_name ?? "",
      tagline:
        data.tagline ?? "",
      whatsapp:
        data.whatsapp ?? "",
      instagram:
        data.instagram ?? "",
      email:
        data.email ?? "",

      hero_title:
        data.hero_title ?? "",
      hero_subtitle:
        data.hero_subtitle ?? "",

      announcement_bar:
        data.announcement_bar ?? "",

      shipping_message:
        data.shipping_message ?? "",

      footer_text:
        data.footer_text ?? "",

      logo_url:
        data.logo_url ?? "",

      base_currency:
        data.base_currency ?? "INR",

      supported_currencies:
        Array.isArray(
          data.supported_currencies
        )
          ? data.supported_currencies
          : DEFAULT_SETTINGS.supported_currencies,

      auto_update_exchange_rates:
        data.auto_update_exchange_rates ??
        true,

      reviews_enabled:
        data.reviews_enabled ?? true,

      reviews_require_approval:
        data.reviews_require_approval ?? true,

      show_review_count:
        data.show_review_count ?? true,

      show_rating_summary:
        data.show_rating_summary ?? true,
    };

    setSettings(updated);
    setInitialSettings(updated);

    setMessage({
      type: "success",
      text: "Settings saved successfully.",
    });

  } catch (error: unknown) {
    setMessage({
      type: "error",
      text:
        error instanceof Error
          ? error.message
          : "Failed to save settings.",
    });
  } finally {
    setSaving(false);
  }
}

function resetForm() {
  setSettings(initialSettings);
  setMessage(null);
}

function updateField<K extends keyof SettingsRow>(
  key: K,
  value: SettingsRow[K]
) {
  setSettings((previous) => ({
    ...previous,
    [key]: value,
  }));
}

function toggleCurrency(currency: string) {
  setSettings((previous) => {
    const exists =
      previous.supported_currencies.includes(currency);

    return {
      ...previous,
      supported_currencies: exists
        ? previous.supported_currencies.filter(
            (item) => item !== currency
          )
        : [
            ...previous.supported_currencies,
            currency,
          ],
    };
  });
}

const hasLogo = useMemo(
  () =>
    settings.logo_url.trim().length > 0,
  [settings.logo_url]
);

if (pageLoading) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F4EF] p-8">
      <div className="flex flex-col items-center gap-5">
        <div className="h-14 w-14 animate-spin rounded-full border-4 border-[#E8D8CF] border-t-[#5A2D2D]" />

        <p className="text-lg text-[#8B6B5B]">
          Loading store settings...
        </p>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-[#F8F4EF] px-6 py-10 md:px-10">
    <div className="mx-auto max-w-7xl space-y-8">

      <div>
        <h1 className="text-4xl font-bold text-[#4B2E2E]">
          Store Settings
        </h1>

        <p className="mt-2 text-[#8B6B5B]">
          Manage Rooh &amp; Rivet store settings,
          content, currency and customer experience.
        </p>
      </div>


      {message && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm font-medium shadow-md ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}


      <section className="rounded-3xl bg-white p-8 shadow-xl">

        <h2 className="mb-6 text-2xl font-semibold text-[#4B2E2E]">
          Currency Settings
        </h2>


        <div className="grid gap-6 md:grid-cols-2">

          <div>
            <label className="mb-3 block text-sm font-semibold text-[#4B2E2E]">
              Base Currency
            </label>

            <select
              value={settings.base_currency}
              onChange={(event) =>
                updateField(
                  "base_currency",
                  event.target.value
                )
              }
              className="w-full rounded-2xl border border-[#E3D3CA] px-4 py-3 text-[#4B2E2E]"
            >
              {AVAILABLE_CURRENCIES.map(
                (currency) => (
                  <option
                    key={currency}
                    value={currency}
                  >
                    {currency}
                  </option>
                )
              )}
            </select>
          </div>


          <div>
            <label className="mb-3 block text-sm font-semibold text-[#4B2E2E]">
              Auto Update Exchange Rates
            </label>

            <button
              type="button"
              onClick={() =>
                updateField(
                  "auto_update_exchange_rates",
                  !settings.auto_update_exchange_rates
                )
              }
              className={`flex w-full justify-between rounded-2xl border px-5 py-3 ${
                settings.auto_update_exchange_rates
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-[#E3D3CA] text-[#8B6B5B]"
              }`}
            >
              <span>
                Exchange Rates
              </span>

              <span>
                {settings.auto_update_exchange_rates
                  ? "Enabled"
                  : "Disabled"}
              </span>
            </button>
          </div>


          <div className="md:col-span-2">

            <label className="mb-3 block text-sm font-semibold text-[#4B2E2E]">
              Supported Currencies
            </label>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">

              {AVAILABLE_CURRENCIES.map(
                (currency) => {
                  const selected =
                    settings.supported_currencies.includes(
                      currency
                    );

                  return (
                    <button
                      key={currency}
                      type="button"
                      onClick={() =>
                        toggleCurrency(currency)
                      }
                      className={`rounded-2xl border px-5 py-3 font-semibold ${
                        selected
                          ? "border-[#5A2D2D] bg-[#5A2D2D] text-white"
                          : "border-[#E3D3CA] text-[#5A2D2D]"
                      }`}
                    >
                      {currency}
                    </button>
                  );
                }
              )}

            </div>

          </div>

        </div>

      </section>


      <section className="rounded-3xl bg-white p-8 shadow-xl">

        <h2 className="mb-6 text-2xl font-semibold text-[#4B2E2E]">
          Store Information
        </h2>


        <div className="grid gap-6 md:grid-cols-2">

          <Field
            label="Store Name"
            value={settings.store_name}
            onChange={(value) =>
              updateField("store_name", value)
            }
          />

          <Field
            label="Tagline"
            value={settings.tagline}
            onChange={(value) =>
              updateField("tagline", value)
            }
          />

          <div className="md:col-span-2">

            <Field
              label="Logo URL"
              value={settings.logo_url}
              onChange={(value) =>
                updateField("logo_url", value)
              }
            />

          </div>

        </div>

      </section>
              <section className="rounded-3xl bg-white p-8 shadow-xl">

          <h2 className="mb-6 text-2xl font-semibold text-[#4B2E2E]">
            Contact Information
          </h2>

          <div className="grid gap-6 md:grid-cols-3">

            <Field
              label="WhatsApp Number"
              value={settings.whatsapp}
              onChange={(value) =>
                updateField("whatsapp", value)
              }
            />

            <Field
              label="Instagram Handle"
              value={settings.instagram}
              onChange={(value) =>
                updateField("instagram", value)
              }
            />

            <Field
              label="Email Address"
              type="email"
              value={settings.email}
              onChange={(value) =>
                updateField("email", value)
              }
            />

          </div>

        </section>


        <section className="rounded-3xl bg-white p-8 shadow-xl">

          <h2 className="mb-6 text-2xl font-semibold text-[#4B2E2E]">
            Homepage Content
          </h2>


          <div className="grid gap-6">

            <Field
              label="Hero Title"
              value={settings.hero_title}
              onChange={(value) =>
                updateField("hero_title", value)
              }
            />


            <TextArea
              label="Hero Subtitle"
              value={settings.hero_subtitle}
              onChange={(value) =>
                updateField(
                  "hero_subtitle",
                  value
                )
              }
            />


            <Field
              label="Announcement Bar"
              value={settings.announcement_bar}
              onChange={(value) =>
                updateField(
                  "announcement_bar",
                  value
                )
              }
            />

          </div>

        </section>


        <section className="rounded-3xl bg-white p-8 shadow-xl">

          <h2 className="mb-6 text-2xl font-semibold text-[#4B2E2E]">
            Shipping Information
          </h2>


          <TextArea
            label="Shipping Message"
            value={settings.shipping_message}
            onChange={(value) =>
              updateField(
                "shipping_message",
                value
              )
            }
          />

        </section>


        <section className="rounded-3xl bg-white p-8 shadow-xl">

          <h2 className="mb-6 text-2xl font-semibold text-[#4B2E2E]">
            Review Settings
          </h2>


          <div className="space-y-4">

            <Toggle
              label="Enable Product Reviews"
              value={settings.reviews_enabled}
              onChange={() =>
                updateField(
                  "reviews_enabled",
                  !settings.reviews_enabled
                )
              }
            />


            <Toggle
              label="Require Approval Before Publishing"
              value={
                settings.reviews_require_approval
              }
              onChange={() =>
                updateField(
                  "reviews_require_approval",
                  !settings.reviews_require_approval
                )
              }
            />


            <Toggle
              label="Show Review Count"
              value={
                settings.show_review_count
              }
              onChange={() =>
                updateField(
                  "show_review_count",
                  !settings.show_review_count
                )
              }
            />


            <Toggle
              label="Show Rating Summary"
              value={
                settings.show_rating_summary
              }
              onChange={() =>
                updateField(
                  "show_rating_summary",
                  !settings.show_rating_summary
                )
              }
            />

          </div>

        </section>


        <section className="rounded-3xl bg-white p-8 shadow-xl">

          <h2 className="mb-6 text-2xl font-semibold text-[#4B2E2E]">
            Footer Content
          </h2>


          <TextArea
            label="Footer Text"
            value={settings.footer_text}
            onChange={(value) =>
              updateField(
                "footer_text",
                value
              )
            }
          />

        </section>


        <div className="flex flex-col gap-4 sm:flex-row">

          <button
            type="button"
            onClick={saveSettings}
            disabled={saving}
            className="rounded-2xl bg-[#5A2D2D] px-8 py-4 font-semibold text-white disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>


          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="rounded-2xl border border-[#D9C6BC] bg-white px-8 py-4 font-semibold text-[#5A2D2D]"
          >
            Reset
          </button>

        </div>


      </div>
    </div>
  );
}


type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
};


function Field({
  label,
  value,
  onChange,
  type = "text",
}: FieldProps) {

  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-[#4B2E2E]">
        {label}
      </label>


      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-[#E3D3CA] px-4 py-3 text-[#4B2E2E]"
      />

    </div>
  );
}


type TextAreaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};


function TextArea({
  label,
  value,
  onChange,
}: TextAreaProps) {

  return (
    <div>

      <label className="mb-2 block text-sm font-semibold text-[#4B2E2E]">
        {label}
      </label>


      <textarea
        rows={4}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-2xl border border-[#E3D3CA] px-4 py-3 text-[#4B2E2E]"
      />

    </div>
  );
}


type ToggleProps = {
  label: string;
  value: boolean;
  onChange: () => void;
};


function Toggle({
  label,
  value,
  onChange,
}: ToggleProps) {

  return (
    <button
      type="button"
      onClick={onChange}
      className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 ${
        value
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-[#E3D3CA] bg-white text-[#8B6B5B]"
      }`}
    >

      <span className="font-medium">
        {label}
      </span>


      <span className="font-semibold">
        {value
          ? "Enabled"
          : "Disabled"}
      </span>

    </button>
  );
}