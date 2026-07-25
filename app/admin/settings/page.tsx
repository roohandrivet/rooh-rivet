"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  RefreshCw,
  Save,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const AVAILABLE_CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
] as const;

type CurrencyCode =
  (typeof AVAILABLE_CURRENCIES)[number];

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
  base_currency: CurrencyCode;
  supported_currencies: CurrencyCode[];
  auto_update_exchange_rates: boolean;
  india_shipping_cost: number;
  india_free_shipping_threshold: number;
  international_shipping_per_item: number;
  international_discount_threshold: number;
  international_shipping_discount_percent: number;
};

type EditableSettings = Omit<
  SettingsRow,
  "id"
>;

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
  india_shipping_cost:
    | number
    | string
    | null;
  india_free_shipping_threshold:
    | number
    | string
    | null;
  international_shipping_per_item:
    | number
    | string
    | null;
  international_discount_threshold:
    | number
    | string
    | null;
  international_shipping_discount_percent:
    | number
    | string
    | null;
};

type ExchangeRates = Partial<
  Record<CurrencyCode, number>
>;

type ExchangeRatesResponse = {
  success: boolean;
  base?: string;
  rates?: ExchangeRates;
  updatedAt?: string | null;
  source?: string;
  message?: string;
};

type Message = {
  type: "success" | "error";
  text: string;
};

const DEFAULT_SETTINGS: EditableSettings = {
  store_name: "Rooh & Rivet",
  tagline:
    "Timeless Elegance, Crafted for You",
  whatsapp: "",
  instagram: "",
  email: "",
  hero_title:
    "Timeless Elegance, Crafted for You",
  hero_subtitle:
    "Discover handcrafted jewellery inspired by heritage and designed for modern elegance.",
  announcement_bar:
    "Free shipping across India on orders of ₹999 or more.",
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
    "AUD",
    "CAD",
  ],
  auto_update_exchange_rates: true,
  india_shipping_cost: 100,
  india_free_shipping_threshold: 999,
  international_shipping_per_item: 1000,
  international_discount_threshold: 10000,
  international_shipping_discount_percent: 50,
};

const CURRENCY_LABELS: Record<
  CurrencyCode,
  string
> = {
  INR: "Indian Rupee",
  USD: "US Dollar",
  EUR: "Euro",
  GBP: "British Pound",
  AUD: "Australian Dollar",
  CAD: "Canadian Dollar",
};

function isCurrencyCode(
  value: string
): value is CurrencyCode {
  return AVAILABLE_CURRENCIES.includes(
    value as CurrencyCode
  );
}

function toNumber(
  value: number | string | null,
  fallback: number
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function toSupportedCurrencies(
  value: unknown
): CurrencyCode[] {
  if (!Array.isArray(value)) {
    return [
      ...DEFAULT_SETTINGS.supported_currencies,
    ];
  }

  const validCurrencies =
    value.filter(
      (item): item is CurrencyCode =>
        typeof item === "string" &&
        isCurrencyCode(item)
    );

  return Array.from(
    new Set<CurrencyCode>([
      "INR",
      ...validCurrencies,
    ])
  );
}

function mapSettingsRow(
  data: SettingsDatabaseRow
): SettingsRow {
  return {
    id: data.id,
    store_name:
      data.store_name ??
      DEFAULT_SETTINGS.store_name,
    tagline:
      data.tagline ??
      DEFAULT_SETTINGS.tagline,
    whatsapp:
      data.whatsapp ??
      DEFAULT_SETTINGS.whatsapp,
    instagram:
      data.instagram ??
      DEFAULT_SETTINGS.instagram,
    email:
      data.email ??
      DEFAULT_SETTINGS.email,
    hero_title:
      data.hero_title ??
      DEFAULT_SETTINGS.hero_title,
    hero_subtitle:
      data.hero_subtitle ??
      DEFAULT_SETTINGS.hero_subtitle,
    announcement_bar:
      data.announcement_bar ??
      DEFAULT_SETTINGS.announcement_bar,
    shipping_message:
      data.shipping_message ??
      DEFAULT_SETTINGS.shipping_message,
    footer_text:
      data.footer_text ??
      DEFAULT_SETTINGS.footer_text,
    logo_url:
      data.logo_url ??
      DEFAULT_SETTINGS.logo_url,
    base_currency: "INR",
    supported_currencies:
      toSupportedCurrencies(
        data.supported_currencies
      ),
    auto_update_exchange_rates: true,
    india_shipping_cost:
      toNumber(
        data.india_shipping_cost,
        DEFAULT_SETTINGS.india_shipping_cost
      ),
    india_free_shipping_threshold:
      toNumber(
        data.india_free_shipping_threshold,
        DEFAULT_SETTINGS.india_free_shipping_threshold
      ),
    international_shipping_per_item:
      toNumber(
        data.international_shipping_per_item,
        DEFAULT_SETTINGS.international_shipping_per_item
      ),
    international_discount_threshold:
      toNumber(
        data.international_discount_threshold,
        DEFAULT_SETTINGS.international_discount_threshold
      ),
    international_shipping_discount_percent:
      toNumber(
        data.international_shipping_discount_percent,
        DEFAULT_SETTINGS.international_shipping_discount_percent
      ),
  };
}

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (
    error instanceof Error
  ) {
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

function isValidRate(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value > 0
  );
}

function formatRate(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-GB",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
    }
  ).format(value);
}

function formatRateUpdatedAt(
  value: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return date.toLocaleString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

export default function AdminSettingsPage() {
  const [
    settings,
    setSettings,
  ] = useState<SettingsRow>({
    id: "",
    ...DEFAULT_SETTINGS,
  });

  const [
    initialSettings,
    setInitialSettings,
  ] = useState<SettingsRow>({
    id: "",
    ...DEFAULT_SETTINGS,
  });

  const [
    pageLoading,
    setPageLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    message,
    setMessage,
  ] = useState<Message | null>(
    null
  );

  const [
    liveRates,
    setLiveRates,
  ] = useState<ExchangeRates>({
    INR: 1,
  });

  const [
    ratesLoading,
    setRatesLoading,
  ] = useState(true);

  const [
    ratesError,
    setRatesError,
  ] = useState("");

  const [
    ratesUpdatedAt,
    setRatesUpdatedAt,
  ] = useState<string | null>(
    null
  );

  const [
    ratesSource,
    setRatesSource,
  ] = useState("Live provider");

  const loadSettings =
    useCallback(
      async (): Promise<void> => {
        setPageLoading(true);
        setMessage(null);

        try {
          const {
            data,
            error,
          } = await supabase
            .from("settings")
            .select("*")
            .limit(1)
            .maybeSingle();

          if (error) {
            throw error;
          }

          if (data) {
            const row =
              mapSettingsRow(
                data as SettingsDatabaseRow
              );

            setSettings(row);
            setInitialSettings(row);
            return;
          }

          const {
            data: inserted,
            error: insertError,
          } = await supabase
            .from("settings")
            .insert(
              DEFAULT_SETTINGS
            )
            .select("*")
            .single();

          if (insertError) {
            throw insertError;
          }

          const row =
            mapSettingsRow(
              inserted as SettingsDatabaseRow
            );

          setSettings(row);
          setInitialSettings(row);
        } catch (error: unknown) {
          setMessage({
            type: "error",
            text: getErrorMessage(
              error,
              "Unable to load settings."
            ),
          });
        } finally {
          setPageLoading(false);
        }
      },
      []
    );

  const loadLiveRates =
    useCallback(
      async (
        forceRefresh = false
      ): Promise<void> => {
        setRatesLoading(true);
        setRatesError("");

        try {
          const endpoint =
            forceRefresh
              ? `/api/exchange-rates?refresh=${Date.now()}`
              : "/api/exchange-rates";

          const response =
            await fetch(
              endpoint,
              {
                method: "GET",
                cache: "no-store",
                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const result =
            (await response.json()) as
              ExchangeRatesResponse;

          if (
            !response.ok ||
            !result.success ||
            !result.rates
          ) {
            throw new Error(
              result.message ??
                "Unable to load live exchange rates."
            );
          }

          if (
            result.base &&
            result.base.toUpperCase() !==
              "INR"
          ) {
            throw new Error(
              "The exchange-rate API must use INR as its base."
            );
          }

          const validatedRates:
            ExchangeRates = {
              INR: 1,
            };

          AVAILABLE_CURRENCIES.forEach(
            (currency) => {
              if (
                currency === "INR"
              ) {
                return;
              }

              const rate =
                result.rates?.[
                  currency
                ];

              if (
                isValidRate(rate)
              ) {
                validatedRates[
                  currency
                ] = rate;
              }
            }
          );

          setLiveRates(
            validatedRates
          );

          setRatesUpdatedAt(
            typeof result.updatedAt ===
              "string"
              ? result.updatedAt
              : new Date().toISOString()
          );

          setRatesSource(
            result.source ??
              "Live provider"
          );
        } catch (error: unknown) {
          setRatesError(
            getErrorMessage(
              error,
              "Unable to load live exchange rates."
            )
          );
        } finally {
          setRatesLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    void loadSettings();
    void loadLiveRates();
  }, [
    loadLiveRates,
    loadSettings,
  ]);

  async function saveSettings():
    Promise<void> {
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
      const supportedCurrencies =
        Array.from(
          new Set<CurrencyCode>([
            "INR",
            ...settings.supported_currencies,
          ])
        );

      const payload:
        EditableSettings = {
        store_name:
          settings.store_name.trim(),
        tagline:
          settings.tagline.trim(),
        whatsapp:
          settings.whatsapp.trim(),
        instagram:
          settings.instagram.trim(),
        email:
          settings.email.trim(),
        hero_title:
          settings.hero_title.trim(),
        hero_subtitle:
          settings.hero_subtitle.trim(),
        announcement_bar:
          settings.announcement_bar.trim(),
        shipping_message:
          settings.shipping_message.trim(),
        footer_text:
          settings.footer_text.trim(),
        logo_url:
          settings.logo_url.trim(),
        base_currency: "INR",
        supported_currencies:
          supportedCurrencies,
        auto_update_exchange_rates:
          true,
        india_shipping_cost:
          Math.max(
            0,
            settings.india_shipping_cost
          ),
        india_free_shipping_threshold:
          Math.max(
            0,
            settings.india_free_shipping_threshold
          ),
        international_shipping_per_item:
          Math.max(
            0,
            settings.international_shipping_per_item
          ),
        international_discount_threshold:
          Math.max(
            0,
            settings.international_discount_threshold
          ),
        international_shipping_discount_percent:
          Math.min(
            100,
            Math.max(
              0,
              settings.international_shipping_discount_percent
            )
          ),
      };

      const {
        data,
        error,
      } = await supabase
        .from("settings")
        .update(payload)
        .eq(
          "id",
          settings.id
        )
        .select("*")
        .single();

      if (error) {
        throw error;
      }

      const updated =
        mapSettingsRow(
          data as SettingsDatabaseRow
        );

      setSettings(updated);
      setInitialSettings(updated);

      setMessage({
        type: "success",
        text: "Settings saved successfully.",
      });
    } catch (error: unknown) {
      setMessage({
        type: "error",
        text: getErrorMessage(
          error,
          "Failed to save settings."
        ),
      });
    } finally {
      setSaving(false);
    }
  }

  function resetForm(): void {
    setSettings(
      initialSettings
    );
    setMessage(null);
  }

  function updateField<
    K extends keyof SettingsRow,
  >(
    key: K,
    value: SettingsRow[K]
  ): void {
    setSettings(
      (previous) => ({
        ...previous,
        [key]: value,
      })
    );
  }

  function toggleCurrency(
    currency: CurrencyCode
  ): void {
    if (
      currency === "INR"
    ) {
      return;
    }

    setSettings(
      (previous) => {
        const isSelected =
          previous.supported_currencies.includes(
            currency
          );

        return {
          ...previous,
          supported_currencies:
            isSelected
              ? previous.supported_currencies.filter(
                  (item) =>
                    item !==
                    currency
                )
              : [
                  ...previous.supported_currencies,
                  currency,
                ],
        };
      }
    );
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
    <main className="min-h-screen bg-[#F8F4EF] px-5 py-10 sm:px-6 md:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B6B5B]">
            Administration
          </p>

          <h1 className="mt-3 font-serif text-4xl font-semibold text-[#4B2E2E]">
            Store Settings
          </h1>

          <p className="mt-3 max-w-3xl leading-7 text-[#8B6B5B]">
            Manage Rooh &amp; Rivet store information,
            live currency display, shipping and customer-facing
            content.
          </p>
        </div>

        {message ? (
          <div
            className={`rounded-2xl border px-5 py-4 text-sm font-medium shadow-sm ${
              message.type ===
              "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        ) : null}

        <SettingsSection
          title="Currency Settings"
          description="Product prices remain stored in INR. Other currencies are display conversions using the latest available reference rates."
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#E3D3CA] bg-[#FBF8F5] p-5">
              <p className="text-sm font-semibold text-[#4B2E2E]">
                Base Currency
              </p>

              <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-[#DCC9BD] bg-white px-4 py-3">
                <div>
                  <p className="font-semibold text-[#4B2E2E]">
                    INR
                  </p>

                  <p className="mt-1 text-sm text-[#8B6B5B]">
                    Indian Rupee
                  </p>
                </div>

                <span className="rounded-full bg-[#5A2D2D] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                  Locked
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 text-[#8B6B5B]">
                Changing the base currency is disabled because all
                catalogue prices, shipping rules and order totals are
                stored in INR.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={22}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div>
                  <p className="font-semibold text-emerald-800">
                    Automatic Exchange Rates Enabled
                  </p>

                  <p className="mt-2 text-sm leading-6 text-emerald-700">
                    Live reference rates are fetched automatically and
                    cached for performance. Fixed manual conversion
                    rates are not used.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#4B2E2E]">
                    Live Rate Status
                  </p>

                  <p className="mt-1 text-sm text-[#8B6B5B]">
                    Source: {ratesSource}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadLiveRates(
                      true
                    )
                  }
                  disabled={ratesLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#5A2D2D] bg-white px-5 py-3 font-semibold text-[#5A2D2D] transition hover:bg-[#F8F4EF] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {ratesLoading ? (
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <RefreshCw
                      size={18}
                    />
                  )}

                  {ratesLoading
                    ? "Refreshing..."
                    : "Refresh Rates"}
                </button>
              </div>

              {ratesError ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
                  {ratesError}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#E3D3CA] bg-white p-5">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <CircleDollarSign
                        size={22}
                        className="text-[#5A2D2D]"
                      />

                      <div>
                        <p className="font-semibold text-[#4B2E2E]">
                          Current INR Reference Rates
                        </p>

                        <p className="mt-1 text-sm text-[#8B6B5B]">
                          1 INR equals the values shown below.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#8B6B5B]">
                      <Clock3
                        size={16}
                      />

                      Updated{" "}
                      {formatRateUpdatedAt(
                        ratesUpdatedAt
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {AVAILABLE_CURRENCIES.filter(
                      (currency) =>
                        currency !==
                        "INR"
                    ).map(
                      (currency) => {
                        const rate =
                          liveRates[
                            currency
                          ];

                        return (
                          <div
                            key={currency}
                            className="rounded-xl border border-[#EEE3DC] bg-[#FBF8F5] px-4 py-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-[#4B2E2E]">
                                  {currency}
                                </p>

                                <p className="mt-1 text-xs text-[#8B6B5B]">
                                  {
                                    CURRENCY_LABELS[
                                      currency
                                    ]
                                  }
                                </p>
                              </div>

                              <p className="font-mono text-sm font-semibold text-[#5A2D2D]">
                                {isValidRate(
                                  rate
                                )
                                  ? formatRate(
                                      rate
                                    )
                                  : "Unavailable"}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-2">
              <label className="mb-3 block text-sm font-semibold text-[#4B2E2E]">
                Supported Display Currencies
              </label>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {AVAILABLE_CURRENCIES.map(
                  (currency) => {
                    const selected =
                      settings.supported_currencies.includes(
                        currency
                      );

                    const isBaseCurrency =
                      currency ===
                      "INR";

                    return (
                      <button
                        key={currency}
                        type="button"
                        onClick={() =>
                          toggleCurrency(
                            currency
                          )
                        }
                        disabled={
                          isBaseCurrency
                        }
                        className={`rounded-2xl border px-4 py-3 text-left transition ${
                          selected
                            ? "border-[#5A2D2D] bg-[#5A2D2D] text-white"
                            : "border-[#E3D3CA] bg-white text-[#5A2D2D] hover:bg-[#FBF7F4]"
                        } disabled:cursor-not-allowed`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold">
                            {currency}
                          </span>

                          {selected ? (
                            <CheckCircle2
                              size={16}
                            />
                          ) : null}
                        </div>

                        <p
                          className={`mt-1 text-xs ${
                            selected
                              ? "text-white/75"
                              : "text-[#8B6B5B]"
                          }`}
                        >
                          {
                            CURRENCY_LABELS[
                              currency
                            ]
                          }
                        </p>
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Store Information"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <Field
              id="store-name"
              label="Store Name"
              value={
                settings.store_name
              }
              onChange={(value) =>
                updateField(
                  "store_name",
                  value
                )
              }
            />

            <Field
              id="tagline"
              label="Tagline"
              value={
                settings.tagline
              }
              onChange={(value) =>
                updateField(
                  "tagline",
                  value
                )
              }
            />

            <div className="md:col-span-2">
              <Field
                id="logo-url"
                label="Logo URL"
                type="url"
                value={
                  settings.logo_url
                }
                onChange={(value) =>
                  updateField(
                    "logo_url",
                    value
                  )
                }
              />
            </div>

            {settings.logo_url.trim() ? (
              <div className="md:col-span-2">
                <p className="mb-3 text-sm font-semibold text-[#4B2E2E]">
                  Logo Preview
                </p>

                <div className="flex min-h-32 items-center justify-center rounded-2xl border border-[#E3D3CA] bg-[#FBF8F5] p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      settings.logo_url
                    }
                    alt="Rooh & Rivet logo preview"
                    className="max-h-24 max-w-full object-contain"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </SettingsSection>

        <SettingsSection
          title="Contact Information"
        >
          <div className="grid gap-6 md:grid-cols-3">
            <Field
              id="whatsapp"
              label="WhatsApp Number"
              type="tel"
              value={
                settings.whatsapp
              }
              onChange={(value) =>
                updateField(
                  "whatsapp",
                  value
                )
              }
            />

            <Field
              id="instagram"
              label="Instagram Handle"
              value={
                settings.instagram
              }
              onChange={(value) =>
                updateField(
                  "instagram",
                  value
                )
              }
            />

            <Field
              id="email"
              label="Email Address"
              type="email"
              value={
                settings.email
              }
              onChange={(value) =>
                updateField(
                  "email",
                  value
                )
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Homepage Content"
        >
          <div className="grid gap-6">
            <Field
              id="hero-title"
              label="Hero Title"
              value={
                settings.hero_title
              }
              onChange={(value) =>
                updateField(
                  "hero_title",
                  value
                )
              }
            />

            <TextArea
              id="hero-subtitle"
              label="Hero Subtitle"
              value={
                settings.hero_subtitle
              }
              onChange={(value) =>
                updateField(
                  "hero_subtitle",
                  value
                )
              }
            />

            <Field
              id="announcement-bar"
              label="Announcement Bar"
              value={
                settings.announcement_bar
              }
              onChange={(value) =>
                updateField(
                  "announcement_bar",
                  value
                )
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Shipping Settings"
        >
          <div className="grid gap-6 md:grid-cols-2">
            <NumberField
              id="india-shipping-cost"
              label="India Shipping Cost (₹)"
              value={
                settings.india_shipping_cost
              }
              onChange={(value) =>
                updateField(
                  "india_shipping_cost",
                  value
                )
              }
            />

            <NumberField
              id="india-free-shipping-threshold"
              label="Free India Shipping Threshold (₹)"
              value={
                settings.india_free_shipping_threshold
              }
              onChange={(value) =>
                updateField(
                  "india_free_shipping_threshold",
                  value
                )
              }
            />

            <NumberField
              id="international-shipping-per-item"
              label="International Shipping Per Item (₹)"
              value={
                settings.international_shipping_per_item
              }
              onChange={(value) =>
                updateField(
                  "international_shipping_per_item",
                  value
                )
              }
            />

            <NumberField
              id="international-discount-threshold"
              label="International Discount Threshold (₹)"
              value={
                settings.international_discount_threshold
              }
              onChange={(value) =>
                updateField(
                  "international_discount_threshold",
                  value
                )
              }
            />

            <NumberField
              id="international-shipping-discount-percent"
              label="International Shipping Discount (%)"
              value={
                settings.international_shipping_discount_percent
              }
              min={0}
              max={100}
              step={1}
              onChange={(value) =>
                updateField(
                  "international_shipping_discount_percent",
                  value
                )
              }
            />

            <div className="md:col-span-2">
              <TextArea
                id="shipping-message"
                label="Shipping Message"
                value={
                  settings.shipping_message
                }
                onChange={(value) =>
                  updateField(
                    "shipping_message",
                    value
                  )
                }
              />
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#E8D8CF] bg-[#FBF8F5] p-5 text-sm leading-7 text-[#6F5146]">
            <p>
              India: ₹
              {settings.india_shipping_cost.toLocaleString(
                "en-IN"
              )}{" "}
              shipping, free from ₹
              {settings.india_free_shipping_threshold.toLocaleString(
                "en-IN"
              )}
              .
            </p>

            <p>
              International: ₹
              {settings.international_shipping_per_item.toLocaleString(
                "en-IN"
              )}{" "}
              per item, with{" "}
              {
                settings.international_shipping_discount_percent
              }
              % off shipping when the order reaches ₹
              {settings.international_discount_threshold.toLocaleString(
                "en-IN"
              )}
              .
            </p>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Footer Content"
        >
          <TextArea
            id="footer-text"
            label="Footer Text"
            value={
              settings.footer_text
            }
            onChange={(value) =>
              updateField(
                "footer_text",
                value
              )
            }
          />
        </SettingsSection>

        <div className="flex flex-col gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() =>
              void saveSettings()
            }
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5A2D2D] px-8 py-4 font-semibold text-white transition hover:bg-[#472323] disabled:cursor-not-allowed disabled:opacity-60"
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
    </main>
  );
}

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

function SettingsSection({
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6">
        <h2 className="font-serif text-2xl font-semibold text-[#4B2E2E]">
          {title}
        </h2>

        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8B6B5B]">
            {description}
          </p>
        ) : null}
      </div>

      {children}
    </section>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?:
    | "text"
    | "email"
    | "url"
    | "tel";
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
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-[#E3D3CA] px-4 py-3 text-[#4B2E2E] outline-none transition placeholder:text-[#B59A8E] focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
      />
    </div>
  );
}

type NumberFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (
    value: number
  ) => void;
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
          const nextValue =
            event.target.valueAsNumber;

          onChange(
            Number.isFinite(
              nextValue
            )
              ? nextValue
              : 0
          );
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
  onChange: (
    value: string
  ) => void;
};

function TextArea({
  id,
  label,
  value,
  onChange,
}: TextAreaProps) {
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
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full resize-y rounded-2xl border border-[#E3D3CA] px-4 py-3 text-[#4B2E2E] outline-none transition placeholder:text-[#B59A8E] focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10"
      />
    </div>
  );
}