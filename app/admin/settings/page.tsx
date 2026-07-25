"use client";

import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type SettingsRow = {
  id: string;
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
  india_shipping_cost: number;
  india_free_shipping_threshold: number;
  international_shipping_per_item: number;
  international_discount_threshold: number;
  international_shipping_discount_percent: number;
};

type EditableSettings = Omit<SettingsRow, "id">;

type SettingsDatabaseRow = {
  id: string;
  store_name: string | null;
  tagline: string | null;
  whatsapp: string | null;
  instagram: string | null;
  email: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  announcement_bar: string | null;
  shipping_message: string | null;
  footer_text: string | null;
  logo_url: string | null;
  base_currency: string | null;
  supported_currencies: unknown;
  auto_update_exchange_rates: boolean | null;
  india_shipping_cost: number | string | null;
  india_free_shipping_threshold: number | string | null;
  international_shipping_per_item: number | string | null;
  international_discount_threshold: number | string | null;
  international_shipping_discount_percent: number | string | null;
};

const DEFAULT_SETTINGS: EditableSettings = {
  store_name: "Rooh & Rivet",
  tagline: "Timeless Elegance, Crafted for You",
  whatsapp: "",
  instagram: "",
  email: "",
  hero_title: "Timeless Elegance, Crafted for You",
  hero_subtitle:
    "Discover handcrafted jewellery inspired by heritage and designed for modern elegance.",
  announcement_bar:
    "Free shipping across India on orders of ₹999 or more.",
  shipping_message:
    "Orders are processed within 1–3 business days.",
  footer_text: "© Rooh & Rivet. All Rights Reserved.",
  logo_url: "",
  base_currency: "INR",
  supported_currencies: ["INR"],
  auto_update_exchange_rates: true,
  india_shipping_cost: 100,
  india_free_shipping_threshold: 999,
  international_shipping_per_item: 1000,
  international_discount_threshold: 10000,
  international_shipping_discount_percent: 50,
};

const AVAILABLE_CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;

function toNumber(value: number | string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toSupportedCurrencies(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_SETTINGS.supported_currencies];
  }

  const currencies = value.filter(
    (item): item is string => typeof item === "string"
  );

  return currencies.length > 0
    ? currencies
    : [...DEFAULT_SETTINGS.supported_currencies];
}

function mapSettingsRow(data: SettingsDatabaseRow): SettingsRow {
  return {
    id: data.id,
    store_name: data.store_name ?? DEFAULT_SETTINGS.store_name,
    tagline: data.tagline ?? DEFAULT_SETTINGS.tagline,
    whatsapp: data.whatsapp ?? DEFAULT_SETTINGS.whatsapp,
    instagram: data.instagram ?? DEFAULT_SETTINGS.instagram,
    email: data.email ?? DEFAULT_SETTINGS.email,
    hero_title: data.hero_title ?? DEFAULT_SETTINGS.hero_title,
    hero_subtitle: data.hero_subtitle ?? DEFAULT_SETTINGS.hero_subtitle,
    announcement_bar:
      data.announcement_bar ?? DEFAULT_SETTINGS.announcement_bar,
    shipping_message:
      data.shipping_message ?? DEFAULT_SETTINGS.shipping_message,
    footer_text: data.footer_text ?? DEFAULT_SETTINGS.footer_text,
    logo_url: data.logo_url ?? DEFAULT_SETTINGS.logo_url,
    base_currency: data.base_currency ?? DEFAULT_SETTINGS.base_currency,
    supported_currencies: toSupportedCurrencies(data.supported_currencies),
    auto_update_exchange_rates:
      data.auto_update_exchange_rates ??
      DEFAULT_SETTINGS.auto_update_exchange_rates,
    india_shipping_cost: toNumber(
      data.india_shipping_cost,
      DEFAULT_SETTINGS.india_shipping_cost
    ),
    india_free_shipping_threshold: toNumber(
      data.india_free_shipping_threshold,
      DEFAULT_SETTINGS.india_free_shipping_threshold
    ),
    international_shipping_per_item: toNumber(
      data.international_shipping_per_item,
      DEFAULT_SETTINGS.international_shipping_per_item
    ),
    international_discount_threshold: toNumber(
      data.international_discount_threshold,
      DEFAULT_SETTINGS.international_discount_threshold
    ),
    international_shipping_discount_percent: toNumber(
      data.international_shipping_discount_percent,
      DEFAULT_SETTINGS.international_shipping_discount_percent
    ),
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
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

  return fallback;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsRow>({
    id: "",
    ...DEFAULT_SETTINGS,
  });

  const [initialSettings, setInitialSettings] = useState<SettingsRow>({
    id: "",
    ...DEFAULT_SETTINGS,
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    void loadSettings();
  }, []);

  async function loadSettings(): Promise<void> {
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
        const row = mapSettingsRow(data as SettingsDatabaseRow);
        setSettings(row);
        setInitialSettings(row);
        return;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("settings")
        .insert(DEFAULT_SETTINGS)
        .select("*")
        .single();

      if (insertError) {
        throw insertError;
      }

      const row = mapSettingsRow(inserted as SettingsDatabaseRow);
      setSettings(row);
      setInitialSettings(row);
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Unable to load settings."),
      });
    } finally {
      setPageLoading(false);
    }
  }

  async function saveSettings(): Promise<void> {
    if (!settings.id) {
      setMessage({
        type: "error",
        text: "Settings could not be saved because the settings row is missing.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const supportedCurrencies = settings.supported_currencies.includes(
        settings.base_currency
      )
        ? settings.supported_currencies
        : [settings.base_currency, ...settings.supported_currencies];

      const payload: EditableSettings = {
        store_name: settings.store_name.trim(),
        tagline: settings.tagline.trim(),
        whatsapp: settings.whatsapp.trim(),
        instagram: settings.instagram.trim(),
        email: settings.email.trim(),
        hero_title: settings.hero_title.trim(),
        hero_subtitle: settings.hero_subtitle.trim(),
        announcement_bar: settings.announcement_bar.trim(),
        shipping_message: settings.shipping_message.trim(),
        footer_text: settings.footer_text.trim(),
        logo_url: settings.logo_url.trim(),
        base_currency: settings.base_currency,
        supported_currencies: supportedCurrencies,
        auto_update_exchange_rates: settings.auto_update_exchange_rates,
        india_shipping_cost: Math.max(0, settings.india_shipping_cost),
        india_free_shipping_threshold: Math.max(
          0,
          settings.india_free_shipping_threshold
        ),
        international_shipping_per_item: Math.max(
          0,
          settings.international_shipping_per_item
        ),
        international_discount_threshold: Math.max(
          0,
          settings.international_discount_threshold
        ),
        international_shipping_discount_percent: Math.min(
          100,
          Math.max(0, settings.international_shipping_discount_percent)
        ),
      };

      const { data, error } = await supabase
        .from("settings")
        .update(payload)
        .eq("id", settings.id)
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      const updated = mapSettingsRow(data as SettingsDatabaseRow);
      setSettings(updated);
      setInitialSettings(updated);
      setMessage({
        type: "success",
        text: "Settings saved successfully.",
      });
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: getErrorMessage(error, "Failed to save settings."),
      });
    } finally {
      setSaving(false);
    }
  }

  function resetForm(): void {
    setSettings(initialSettings);
    setMessage(null);
  }

  function updateField<K extends keyof SettingsRow>(
    key: K,
    value: SettingsRow[K]
  ): void {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function updateBaseCurrency(currency: string): void {
    setSettings((previous) => ({
      ...previous,
      base_currency: currency,
      supported_currencies: previous.supported_currencies.includes(currency)
        ? previous.supported_currencies
        : [currency, ...previous.supported_currencies],
    }));
  }

  function toggleCurrency(currency: string): void {
    setSettings((previous) => {
      const isSelected = previous.supported_currencies.includes(currency);

      if (isSelected && currency === previous.base_currency) {
        return previous;
      }

      return {
        ...previous,
        supported_currencies: isSelected
          ? previous.supported_currencies.filter((item) => item !== currency)
          : [...previous.supported_currencies, currency],
      };
    });
  }

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
            Manage Rooh &amp; Rivet store information, currency, shipping and
            customer-facing content.
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

        <SettingsSection title="Currency Settings">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="base-currency"
                className="mb-3 block text-sm font-semibold text-[#4B2E2E]"
              >
                Base Currency
              </label>
              <select
                id="base-currency"
                value={settings.base_currency}
                onChange={(event) => updateBaseCurrency(event.target.value)}
                className="w-full rounded-2xl border border-[#E3D3CA] bg-white px-4 py-3 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
              >
                {AVAILABLE_CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>

            <Toggle
              label="Auto Update Exchange Rates"
              value={settings.auto_update_exchange_rates}
              onChange={() =>
                updateField(
                  "auto_update_exchange_rates",
                  !settings.auto_update_exchange_rates
                )
              }
            />

            <div className="md:col-span-2">
              <label className="mb-3 block text-sm font-semibold text-[#4B2E2E]">
                Supported Currencies
              </label>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {AVAILABLE_CURRENCIES.map((currency) => {
                  const selected = settings.supported_currencies.includes(
                    currency
                  );
                  const isBaseCurrency = settings.base_currency === currency;

                  return (
                    <button
                      key={currency}
                      type="button"
                      onClick={() => toggleCurrency(currency)}
                      className={`rounded-2xl border px-5 py-3 font-semibold transition ${
                        selected
                          ? "border-[#5A2D2D] bg-[#5A2D2D] text-white"
                          : "border-[#E3D3CA] bg-white text-[#5A2D2D] hover:bg-[#FBF7F4]"
                      }`}
                    >
                      {currency}
                      {isBaseCurrency ? " · Base" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Store Information">
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              id="store-name"
              label="Store Name"
              value={settings.store_name}
              onChange={(value) => updateField("store_name", value)}
            />
            <Field
              id="tagline"
              label="Tagline"
              value={settings.tagline}
              onChange={(value) => updateField("tagline", value)}
            />
            <div className="md:col-span-2">
              <Field
                id="logo-url"
                label="Logo URL"
                value={settings.logo_url}
                onChange={(value) => updateField("logo_url", value)}
              />
            </div>

            {settings.logo_url.trim() && (
              <div className="md:col-span-2">
                <p className="mb-3 text-sm font-semibold text-[#4B2E2E]">
                  Logo Preview
                </p>
                <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#E3D3CA] bg-[#FBF8F5] p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={settings.logo_url}
                    alt="Rooh & Rivet logo preview"
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </SettingsSection>

        <SettingsSection title="Contact Information">
          <div className="grid gap-6 md:grid-cols-3">
            <Field
              id="whatsapp"
              label="WhatsApp Number"
              value={settings.whatsapp}
              onChange={(value) => updateField("whatsapp", value)}
            />
            <Field
              id="instagram"
              label="Instagram Handle"
              value={settings.instagram}
              onChange={(value) => updateField("instagram", value)}
            />
            <Field
              id="email"
              label="Email Address"
              type="email"
              value={settings.email}
              onChange={(value) => updateField("email", value)}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Homepage Content">
          <div className="grid gap-6">
            <Field
              id="hero-title"
              label="Hero Title"
              value={settings.hero_title}
              onChange={(value) => updateField("hero_title", value)}
            />
            <TextArea
              id="hero-subtitle"
              label="Hero Subtitle"
              value={settings.hero_subtitle}
              onChange={(value) => updateField("hero_subtitle", value)}
            />
            <Field
              id="announcement-bar"
              label="Announcement Bar"
              value={settings.announcement_bar}
              onChange={(value) => updateField("announcement_bar", value)}
            />
          </div>
        </SettingsSection>

        <SettingsSection title="Shipping Settings">
          <div className="grid gap-6 md:grid-cols-2">
            <NumberField
              id="india-shipping-cost"
              label="India Shipping Cost (₹)"
              value={settings.india_shipping_cost}
              onChange={(value) => updateField("india_shipping_cost", value)}
            />
            <NumberField
              id="india-free-shipping-threshold"
              label="Free India Shipping Threshold (₹)"
              value={settings.india_free_shipping_threshold}
              onChange={(value) =>
                updateField("india_free_shipping_threshold", value)
              }
            />
            <NumberField
              id="international-shipping-per-item"
              label="International Shipping Per Item (₹)"
              value={settings.international_shipping_per_item}
              onChange={(value) =>
                updateField("international_shipping_per_item", value)
              }
            />
            <NumberField
              id="international-discount-threshold"
              label="International Discount Threshold (₹)"
              value={settings.international_discount_threshold}
              onChange={(value) =>
                updateField("international_discount_threshold", value)
              }
            />
            <NumberField
              id="international-shipping-discount-percent"
              label="International Shipping Discount (%)"
              value={settings.international_shipping_discount_percent}
              min={0}
              max={100}
              step={1}
              onChange={(value) =>
                updateField("international_shipping_discount_percent", value)
              }
            />
            <div className="md:col-span-2">
              <TextArea
                id="shipping-message"
                label="Shipping Message"
                value={settings.shipping_message}
                onChange={(value) => updateField("shipping_message", value)}
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#E8D8CF] bg-[#FBF8F5] p-5 text-sm leading-7 text-[#6F5146]">
            <p>
              India: ₹{settings.india_shipping_cost.toLocaleString("en-IN")} shipping,
              free from ₹
              {settings.india_free_shipping_threshold.toLocaleString("en-IN")}.
            </p>
            <p>
              International: ₹
              {settings.international_shipping_per_item.toLocaleString("en-IN")} per
              item, with {settings.international_shipping_discount_percent}% off
              shipping when the order reaches ₹
              {settings.international_discount_threshold.toLocaleString("en-IN")}.
            </p>
          </div>
        </SettingsSection>

        <SettingsSection title="Footer Content">
          <TextArea
            id="footer-text"
            label="Footer Text"
            value={settings.footer_text}
            onChange={(value) => updateField("footer_text", value)}
          />
        </SettingsSection>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => void saveSettings()}
            disabled={saving}
            className="rounded-2xl bg-[#5A2D2D] px-8 py-4 font-semibold text-white transition hover:bg-[#472323] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="rounded-2xl border border-[#D9C6BC] bg-white px-8 py-4 font-semibold text-[#5A2D2D] transition hover:bg-[#FBF7F4] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
      <h2 className="mb-6 text-2xl font-semibold text-[#4B2E2E]">
        {title}
      </h2>
      {children}
    </section>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "url" | "tel";
};

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#4B2E2E]"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-[#E3D3CA] px-4 py-3 text-[#4B2E2E] outline-none transition placeholder:text-[#B59A8E] focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
      />
    </div>
  );
}

type NumberFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

function NumberField({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 0.01,
}: NumberFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#4B2E2E]"
      >
        {label}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const nextValue = event.target.valueAsNumber;
          onChange(Number.isFinite(nextValue) ? nextValue : 0);
        }}
        className="w-full rounded-2xl border border-[#E3D3CA] px-4 py-3 text-[#4B2E2E] outline-none transition focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
      />
    </div>
  );
}

type TextAreaProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function TextArea({ id, label, value, onChange }: TextAreaProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#4B2E2E]"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={4}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-2xl border border-[#E3D3CA] px-4 py-3 text-[#4B2E2E] outline-none transition placeholder:text-[#B59A8E] focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
      />
    </div>
  );
}

type ToggleProps = {
  label: string;
  value: boolean;
  onChange: () => void;
};

function Toggle({ label, value, onChange }: ToggleProps) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[#4B2E2E]">{label}</p>
      <button
        type="button"
        onClick={onChange}
        className={`flex w-full items-center justify-between rounded-2xl border px-5 py-3 transition ${
          value
            ? "border-green-200 bg-green-50 text-green-700"
            : "border-[#E3D3CA] bg-white text-[#8B6B5B]"
        }`}
      >
        <span>Exchange Rates</span>
        <span className="font-semibold">{value ? "Enabled" : "Disabled"}</span>
      </button>
    </div>
  );
}