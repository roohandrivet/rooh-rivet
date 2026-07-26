"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  ImageIcon,
  Link2,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  Newspaper,
  Phone,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Store,
  Trash2,
  Truck,
  Upload,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

const SETTINGS_KEY = "store";
const STORAGE_BUCKET = "site-content";
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;

const AVAILABLE_CURRENCIES = [
  "INR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
] as const;

const IMAGE_FIELDS = [
  "logo_url",
  "favicon_url",
  "seo_image_url",
] as const;

type CurrencyCode =
  (typeof AVAILABLE_CURRENCIES)[number];

type ImageField =
  (typeof IMAGE_FIELDS)[number];

type SettingsRow = {
  id: string;
  setting_key: string;
  store_name: string;
  tagline: string;
  whatsapp: string;
  instagram: string;
  email: string;
  phone: string;
  address: string;
  facebook_url: string;
  x_url: string;
  youtube_url: string;
  linkedin_url: string;
  pinterest_url: string;
  announcement_bar: string;
  shipping_message: string;
  footer_text: string;
  newsletter_heading: string;
  newsletter_description: string;
  newsletter_button_text: string;
  newsletter_disclaimer: string;
  logo_url: string;
  favicon_url: string;
  seo_title: string;
  seo_description: string;
  seo_image_url: string;
  privacy_url: string;
  terms_url: string;
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
  setting_key: string | null;
  store_name: string | null;
  tagline: string | null;
  whatsapp: string | null;
  instagram: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  facebook_url: string | null;
  x_url: string | null;
  youtube_url: string | null;
  linkedin_url: string | null;
  pinterest_url: string | null;
  announcement_bar: string | null;
  shipping_message: string | null;
  footer_text: string | null;
  newsletter_heading: string | null;
  newsletter_description: string | null;
  newsletter_button_text: string | null;
  newsletter_disclaimer: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_image_url: string | null;
  privacy_url: string | null;
  terms_url: string | null;
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

type SelectedFiles =
  Partial<
    Record<ImageField, File>
  >;

type PreviewUrls =
  Partial<
    Record<ImageField, string>
  >;

type RemovedImages =
  Record<ImageField, boolean>;

const DEFAULT_SETTINGS:
  EditableSettings = {
  setting_key: SETTINGS_KEY,
  store_name: "Rooh & Rivet",
  tagline:
    "Timeless Elegance, Crafted for You",
  whatsapp: "",
  instagram: "",
  email: "",
  phone: "",
  address: "",
  facebook_url: "",
  x_url: "",
  youtube_url: "",
  linkedin_url: "",
  pinterest_url: "",
  announcement_bar:
    "Free shipping across India on orders of ₹999 or more.",
  shipping_message:
    "Orders are processed within 1–3 business days.",
  footer_text:
    "Timeless handcrafted jewellery inspired by elegance, craftsmanship and the stories that deserve to be remembered.",
  newsletter_heading:
    "Join the Rooh & Rivet Journal",
  newsletter_description:
    "Receive new collection launches, styling inspiration and private offers.",
  newsletter_button_text:
    "Subscribe",
  newsletter_disclaimer:
    "By subscribing, you agree to receive Rooh & Rivet updates. You may unsubscribe at any time.",
  logo_url: "",
  favicon_url: "",
  seo_title:
    "Rooh & Rivet | Luxury Handcrafted Jewellery",
  seo_description:
    "Luxury handcrafted jewellery designed for timeless elegance.",
  seo_image_url: "",
  privacy_url: "/privacy",
  terms_url: "/terms",
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

const EMPTY_REMOVED_IMAGES:
  RemovedImages = {
  logo_url: false,
  favicon_url: false,
  seo_image_url: false,
};

const IMAGE_LABELS: Record<
  ImageField,
  {
    label: string;
    description: string;
    recommended: string;
  }
> = {
  logo_url: {
    label: "Store Logo",
    description:
      "Used in the navbar, footer and branded areas.",
    recommended:
      "PNG, WebP or SVG with a transparent background.",
  },
  favicon_url: {
    label: "Browser Favicon",
    description:
      "Shown in browser tabs and saved bookmarks.",
    recommended:
      "Square PNG, WebP or SVG.",
  },
  seo_image_url: {
    label: "SEO Sharing Image",
    description:
      "Used when the website is shared on social platforms.",
    recommended:
      "JPG, PNG or WebP around 1200 × 630 pixels.",
  },
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
  const baseCurrency =
    data.base_currency &&
    isCurrencyCode(
      data.base_currency
    )
      ? data.base_currency
      : DEFAULT_SETTINGS.base_currency;

  return {
    id: data.id,
    setting_key:
      data.setting_key ??
      SETTINGS_KEY,
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
    phone:
      data.phone ??
      DEFAULT_SETTINGS.phone,
    address:
      data.address ??
      DEFAULT_SETTINGS.address,
    facebook_url:
      data.facebook_url ??
      DEFAULT_SETTINGS.facebook_url,
    x_url:
      data.x_url ??
      DEFAULT_SETTINGS.x_url,
    youtube_url:
      data.youtube_url ??
      DEFAULT_SETTINGS.youtube_url,
    linkedin_url:
      data.linkedin_url ??
      DEFAULT_SETTINGS.linkedin_url,
    pinterest_url:
      data.pinterest_url ??
      DEFAULT_SETTINGS.pinterest_url,
    announcement_bar:
      data.announcement_bar ??
      DEFAULT_SETTINGS.announcement_bar,
    shipping_message:
      data.shipping_message ??
      DEFAULT_SETTINGS.shipping_message,
    footer_text:
      data.footer_text ??
      DEFAULT_SETTINGS.footer_text,
    newsletter_heading:
      data.newsletter_heading ??
      DEFAULT_SETTINGS.newsletter_heading,
    newsletter_description:
      data.newsletter_description ??
      DEFAULT_SETTINGS.newsletter_description,
    newsletter_button_text:
      data.newsletter_button_text ??
      DEFAULT_SETTINGS.newsletter_button_text,
    newsletter_disclaimer:
      data.newsletter_disclaimer ??
      DEFAULT_SETTINGS.newsletter_disclaimer,
    logo_url:
      data.logo_url ??
      DEFAULT_SETTINGS.logo_url,
    favicon_url:
      data.favicon_url ??
      DEFAULT_SETTINGS.favicon_url,
    seo_title:
      data.seo_title ??
      DEFAULT_SETTINGS.seo_title,
    seo_description:
      data.seo_description ??
      DEFAULT_SETTINGS.seo_description,
    seo_image_url:
      data.seo_image_url ??
      DEFAULT_SETTINGS.seo_image_url,
    privacy_url:
      data.privacy_url ??
      DEFAULT_SETTINGS.privacy_url,
    terms_url:
      data.terms_url ??
      DEFAULT_SETTINGS.terms_url,
    base_currency:
      baseCurrency,
    supported_currencies:
      toSupportedCurrencies(
        data.supported_currencies
      ),
    auto_update_exchange_rates:
      data.auto_update_exchange_rates ??
      DEFAULT_SETTINGS.auto_update_exchange_rates,
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

function createSafeFileName(
  file: File
): string {
  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() ||
    "png";

  const baseName =
    file.name
      .replace(/\.[^/.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) ||
    "settings-image";

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

  const objectPath =
    publicUrl.slice(
      markerIndex +
        marker.length
    );

  return objectPath
    ? decodeURIComponent(
        objectPath
      )
    : null;
}

function createEmptySettings():
  SettingsRow {
  return {
    id: "",
    ...DEFAULT_SETTINGS,
  };
}

export default function AdminSettingsPage() {
  const [
    settings,
    setSettings,
  ] = useState<SettingsRow>(
    createEmptySettings
  );

  const [
    initialSettings,
    setInitialSettings,
  ] = useState<SettingsRow>(
    createEmptySettings
  );

  const [
    selectedFiles,
    setSelectedFiles,
  ] = useState<SelectedFiles>({});

  const [
    previewUrls,
    setPreviewUrls,
  ] = useState<PreviewUrls>({});

  const [
    removedImages,
    setRemovedImages,
  ] = useState<RemovedImages>(
    EMPTY_REMOVED_IMAGES
  );

  const objectUrlsRef =
    useRef<Set<string>>(
      new Set()
    );

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
  ] = useState(
    "Live provider"
  );

  const hasPendingImageChanges =
    IMAGE_FIELDS.some(
      (field) =>
        Boolean(
          selectedFiles[field]
        ) ||
        removedImages[field]
    );

  const isDirty =
    useMemo(
      () =>
        JSON.stringify(
          settings
        ) !==
          JSON.stringify(
            initialSettings
          ) ||
        hasPendingImageChanges,
      [
        hasPendingImageChanges,
        initialSettings,
        settings,
      ]
    );

  const clearLocalPreviews =
    useCallback(() => {
      objectUrlsRef.current.forEach(
        (url) => {
          URL.revokeObjectURL(
            url
          );
        }
      );

      objectUrlsRef.current.clear();
      setPreviewUrls({});
      setSelectedFiles({});
    }, []);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(
        (url) => {
          URL.revokeObjectURL(
            url
          );
        }
      );

      objectUrlsRef.current.clear();
    };
  }, []);

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
            .eq(
              "setting_key",
              SETTINGS_KEY
            )
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
            setInitialSettings(
              row
            );
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
          setInitialSettings(
            row
          );
        } catch (
          error: unknown
        ) {
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
        } catch (
          error: unknown
        ) {
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

    setMessage(null);
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

    setMessage(null);
  }

  function getVisibleImageUrl(
    field: ImageField
  ): string {
    if (
      removedImages[field]
    ) {
      return "";
    }

    return (
      previewUrls[field] ??
      settings[field]
    );
  }

  function handleImageSelect(
    field: ImageField,
    event:
      ChangeEvent<HTMLInputElement>
  ): void {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const allowedTypes =
      new Set([
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/svg+xml",
      ]);

    if (
      !allowedTypes.has(
        file.type
      )
    ) {
      setMessage({
        type: "error",
        text: "Choose a JPG, PNG, WebP or SVG image.",
      });
      return;
    }

    if (
      file.size >
      MAX_IMAGE_SIZE
    ) {
      setMessage({
        type: "error",
        text: "Images must be 8 MB or smaller.",
      });
      return;
    }

    const existingPreview =
      previewUrls[field];

    if (
      existingPreview
    ) {
      URL.revokeObjectURL(
        existingPreview
      );

      objectUrlsRef.current.delete(
        existingPreview
      );
    }

    const objectUrl =
      URL.createObjectURL(
        file
      );

    objectUrlsRef.current.add(
      objectUrl
    );

    setSelectedFiles(
      (previous) => ({
        ...previous,
        [field]: file,
      })
    );

    setPreviewUrls(
      (previous) => ({
        ...previous,
        [field]: objectUrl,
      })
    );

    setRemovedImages(
      (previous) => ({
        ...previous,
        [field]: false,
      })
    );

    setMessage(null);
  }

  function handleRemoveImage(
    field: ImageField
  ): void {
    const existingPreview =
      previewUrls[field];

    if (
      existingPreview
    ) {
      URL.revokeObjectURL(
        existingPreview
      );

      objectUrlsRef.current.delete(
        existingPreview
      );
    }

    setSelectedFiles(
      (previous) => {
        const next = {
          ...previous,
        };

        delete next[field];

        return next;
      }
    );

    setPreviewUrls(
      (previous) => {
        const next = {
          ...previous,
        };

        delete next[field];

        return next;
      }
    );

    setRemovedImages(
      (previous) => ({
        ...previous,
        [field]: true,
      })
    );

    setMessage(null);
  }

  async function uploadImage(
    field: ImageField,
    file: File
  ): Promise<string> {
    const filePath =
      `settings/${field}/${createSafeFileName(
        file
      )}`;

    const {
      error: uploadError,
    } = await supabase.storage
      .from(
        STORAGE_BUCKET
      )
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

    if (
      uploadError
    ) {
      throw uploadError;
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from(
        STORAGE_BUCKET
      )
      .getPublicUrl(
        filePath
      );

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

    if (
      !objectPath
    ) {
      return;
    }

    const {
      error,
    } = await supabase.storage
      .from(
        STORAGE_BUCKET
      )
      .remove([
        objectPath,
      ]);

    if (
      error
    ) {
      console.error(
        "Unable to delete previous settings image:",
        error
      );
    }
  }

  async function saveSettings():
    Promise<void> {
    if (
      !settings.id ||
      saving
    ) {
      return;
    }

    const storeName =
      settings.store_name.trim();

    if (
      !storeName
    ) {
      setMessage({
        type: "error",
        text: "Store name is required.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    const uploadedUrls:
      Partial<
        Record<
          ImageField,
          string
        >
      > = {};

    try {
      const nextImageUrls:
        Record<
          ImageField,
          string
        > = {
        logo_url:
          removedImages.logo_url
            ? ""
            : settings.logo_url.trim(),
        favicon_url:
          removedImages.favicon_url
            ? ""
            : settings.favicon_url.trim(),
        seo_image_url:
          removedImages.seo_image_url
            ? ""
            : settings.seo_image_url.trim(),
      };

      for (
        const field of
        IMAGE_FIELDS
      ) {
        const file =
          selectedFiles[
            field
          ];

        if (
          file
        ) {
          const publicUrl =
            await uploadImage(
              field,
              file
            );

          uploadedUrls[
            field
          ] = publicUrl;

          nextImageUrls[
            field
          ] = publicUrl;
        }
      }

      const supportedCurrencies =
        Array.from(
          new Set<CurrencyCode>([
            "INR",
            ...settings.supported_currencies,
          ])
        );

      const payload:
        EditableSettings = {
        setting_key:
          SETTINGS_KEY,
        store_name:
          storeName,
        tagline:
          settings.tagline.trim(),
        whatsapp:
          settings.whatsapp.trim(),
        instagram:
          settings.instagram.trim(),
        email:
          settings.email.trim(),
        phone:
          settings.phone.trim(),
        address:
          settings.address.trim(),
        facebook_url:
          settings.facebook_url.trim(),
        x_url:
          settings.x_url.trim(),
        youtube_url:
          settings.youtube_url.trim(),
        linkedin_url:
          settings.linkedin_url.trim(),
        pinterest_url:
          settings.pinterest_url.trim(),
        announcement_bar:
          settings.announcement_bar.trim(),
        shipping_message:
          settings.shipping_message.trim(),
        footer_text:
          settings.footer_text.trim(),
        newsletter_heading:
          settings.newsletter_heading.trim(),
        newsletter_description:
          settings.newsletter_description.trim(),
        newsletter_button_text:
          settings.newsletter_button_text.trim() ||
          "Subscribe",
        newsletter_disclaimer:
          settings.newsletter_disclaimer.trim(),
        logo_url:
          nextImageUrls.logo_url,
        favicon_url:
          nextImageUrls.favicon_url,
        seo_title:
          settings.seo_title.trim() ||
          storeName,
        seo_description:
          settings.seo_description.trim(),
        seo_image_url:
          nextImageUrls.seo_image_url,
        privacy_url:
          settings.privacy_url.trim() ||
          "/privacy",
        terms_url:
          settings.terms_url.trim() ||
          "/terms",
        base_currency:
          settings.base_currency,
        supported_currencies:
          supportedCurrencies,
        auto_update_exchange_rates:
          settings.auto_update_exchange_rates,
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
        .update(
          payload
        )
        .eq(
          "id",
          settings.id
        )
        .eq(
          "setting_key",
          SETTINGS_KEY
        )
        .select("*")
        .single();

      if (
        error
      ) {
        throw error;
      }

      const updated =
        mapSettingsRow(
          data as SettingsDatabaseRow
        );

      for (
        const field of
        IMAGE_FIELDS
      ) {
        const previousUrl =
          initialSettings[
            field
          ];

        const nextUrl =
          updated[field];

        if (
          previousUrl &&
          previousUrl !==
            nextUrl
        ) {
          await deleteStoredImage(
            previousUrl
          );
        }
      }

      clearLocalPreviews();
      setRemovedImages(
        EMPTY_REMOVED_IMAGES
      );
      setSettings(updated);
      setInitialSettings(
        updated
      );

      setMessage({
        type: "success",
        text: "Global store settings saved successfully.",
      });
    } catch (
      error: unknown
    ) {
      for (
        const publicUrl of
        Object.values(
          uploadedUrls
        )
      ) {
        if (
          publicUrl
        ) {
          await deleteStoredImage(
            publicUrl
          );
        }
      }

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

  function resetForm():
    void {
    clearLocalPreviews();
    setRemovedImages(
      EMPTY_REMOVED_IMAGES
    );
    setSettings(
      initialSettings
    );
    setMessage(null);
  }

  if (
    pageLoading
  ) {
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
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8B6B5B]">
              Administration
            </p>

            <h1 className="mt-3 font-serif text-4xl font-semibold text-[#4B2E2E]">
              Global Store Settings
            </h1>

            <p className="mt-3 max-w-3xl leading-7 text-[#8B6B5B]">
              Manage global branding, contact details, footer, newsletter, SEO, currencies and shipping rules. Homepage, About and Contact page content remains under Content Management.
            </p>
          </div>

          <div
            className={`w-fit rounded-full px-4 py-2 text-sm font-semibold ${
              isDirty
                ? "bg-amber-100 text-amber-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {isDirty
              ? "Unsaved changes"
              : "All changes saved"}
          </div>
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
          icon={
            <Store size={22} />
          }
          title="Store Identity"
          description="Global brand information shown throughout the website."
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
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {IMAGE_FIELDS.map(
              (field) => (
                <ImageUploadCard
                  key={field}
                  field={field}
                  visibleUrl={
                    getVisibleImageUrl(
                      field
                    )
                  }
                  selectedFile={
                    selectedFiles[
                      field
                    ]
                  }
                  removed={
                    removedImages[
                      field
                    ]
                  }
                  onSelect={(
                    event
                  ) =>
                    handleImageSelect(
                      field,
                      event
                    )
                  }
                  onRemove={() =>
                    handleRemoveImage(
                      field
                    )
                  }
                  disabled={saving}
                />
              )
            )}
          </div>
        </SettingsSection>

        <SettingsSection
          icon={
            <MessageCircle
              size={22}
            />
          }
          title="Contact & Social Details"
          description="Global customer-service details and social profiles used by the navbar, footer and customer touchpoints."
        >
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Field
              id="email"
              label="Customer Service Email"
              type="email"
              icon={
                <Mail size={17} />
              }
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

            <Field
              id="phone"
              label="Phone Number"
              type="tel"
              icon={
                <Phone size={17} />
              }
              value={
                settings.phone
              }
              onChange={(value) =>
                updateField(
                  "phone",
                  value
                )
              }
            />

            <Field
              id="whatsapp"
              label="WhatsApp Number"
              type="tel"
              icon={
                <MessageCircle
                  size={17}
                />
              }
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

            <div className="md:col-span-2 lg:col-span-3">
              <TextArea
                id="address"
                label="Business Address"
                icon={
                  <MapPin size={17} />
                }
                rows={3}
                value={
                  settings.address
                }
                onChange={(value) =>
                  updateField(
                    "address",
                    value
                  )
                }
              />
            </div>

            <Field
              id="instagram"
              label="Instagram URL or Username"
              icon={
                <Link2 size={17} />
              }
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
              id="facebook-url"
              label="Facebook URL"
              type="url"
              icon={
                <Link2 size={17} />
              }
              value={
                settings.facebook_url
              }
              onChange={(value) =>
                updateField(
                  "facebook_url",
                  value
                )
              }
            />

            <Field
              id="x-url"
              label="X URL"
              type="url"
              icon={
                <Link2 size={17} />
              }
              value={
                settings.x_url
              }
              onChange={(value) =>
                updateField(
                  "x_url",
                  value
                )
              }
            />

            <Field
              id="youtube-url"
              label="YouTube URL"
              type="url"
              icon={
                <Link2 size={17} />
              }
              value={
                settings.youtube_url
              }
              onChange={(value) =>
                updateField(
                  "youtube_url",
                  value
                )
              }
            />

            <Field
              id="linkedin-url"
              label="LinkedIn URL"
              type="url"
              icon={
                <Link2 size={17} />
              }
              value={
                settings.linkedin_url
              }
              onChange={(value) =>
                updateField(
                  "linkedin_url",
                  value
                )
              }
            />

            <Field
              id="pinterest-url"
              label="Pinterest URL"
              type="url"
              icon={
                <Link2 size={17} />
              }
              value={
                settings.pinterest_url
              }
              onChange={(value) =>
                updateField(
                  "pinterest_url",
                  value
                )
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon={
            <Megaphone
              size={22}
            />
          }
          title="Global Customer Messages"
          description="Messages that can appear across the storefront."
        >
          <div className="grid gap-6">
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
        </SettingsSection>

        <SettingsSection
          icon={
            <Newspaper
              size={22}
            />
          }
          title="Footer & Newsletter"
          description="Global footer description, newsletter copy and legal destinations."
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <TextArea
                id="footer-text"
                label="Footer Brand Description"
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
            </div>

            <Field
              id="newsletter-heading"
              label="Newsletter Heading"
              value={
                settings.newsletter_heading
              }
              onChange={(value) =>
                updateField(
                  "newsletter_heading",
                  value
                )
              }
            />

            <Field
              id="newsletter-button-text"
              label="Newsletter Button Text"
              value={
                settings.newsletter_button_text
              }
              onChange={(value) =>
                updateField(
                  "newsletter_button_text",
                  value
                )
              }
            />

            <div className="md:col-span-2">
              <TextArea
                id="newsletter-description"
                label="Newsletter Description"
                value={
                  settings.newsletter_description
                }
                onChange={(value) =>
                  updateField(
                    "newsletter_description",
                    value
                  )
                }
              />
            </div>

            <div className="md:col-span-2">
              <TextArea
                id="newsletter-disclaimer"
                label="Newsletter Disclaimer"
                rows={3}
                value={
                  settings.newsletter_disclaimer
                }
                onChange={(value) =>
                  updateField(
                    "newsletter_disclaimer",
                    value
                  )
                }
              />
            </div>

            <Field
              id="privacy-url"
              label="Privacy Policy Link"
              value={
                settings.privacy_url
              }
              onChange={(value) =>
                updateField(
                  "privacy_url",
                  value
                )
              }
            />

            <Field
              id="terms-url"
              label="Terms & Conditions Link"
              value={
                settings.terms_url
              }
              onChange={(value) =>
                updateField(
                  "terms_url",
                  value
                )
              }
            />
          </div>
        </SettingsSection>

        <SettingsSection
          icon={
            <Search size={22} />
          }
          title="Search & Social Metadata"
          description="Default metadata used by search engines and social-sharing previews."
        >
          <div className="grid gap-6">
            <Field
              id="seo-title"
              label="Default SEO Title"
              value={
                settings.seo_title
              }
              onChange={(value) =>
                updateField(
                  "seo_title",
                  value
                )
              }
            />

            <TextArea
              id="seo-description"
              label="Default SEO Description"
              rows={4}
              value={
                settings.seo_description
              }
              onChange={(value) =>
                updateField(
                  "seo_description",
                  value
                )
              }
            />

            <div className="rounded-2xl border border-[#E3D3CA] bg-[#FBF8F5] p-5 text-sm leading-7 text-[#6F5146]">
              SEO title length:{" "}
              <strong>
                {
                  settings.seo_title.length
                }
              </strong>
              . SEO description length:{" "}
              <strong>
                {
                  settings.seo_description.length
                }
              </strong>
              .
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          icon={
            <CircleDollarSign
              size={22}
            />
          }
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
                Catalogue prices, shipping rules and order totals remain stored in INR.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  size={22}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />

                <div className="flex-1">
                  <p className="font-semibold text-emerald-800">
                    Automatic Exchange Rates
                  </p>

                  <p className="mt-2 text-sm leading-6 text-emerald-700">
                    Enable live reference-rate conversion for supported display currencies.
                  </p>

                  <label className="mt-4 inline-flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={
                        settings.auto_update_exchange_rates
                      }
                      onChange={(event) =>
                        updateField(
                          "auto_update_exchange_rates",
                          event.target.checked
                        )
                      }
                      className="h-5 w-5 accent-[#5A2D2D]"
                    />

                    <span className="text-sm font-semibold text-emerald-800">
                      Enabled
                    </span>
                  </label>
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
                    Source:{" "}
                    {ratesSource}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    void loadLiveRates(
                      true
                    )
                  }
                  disabled={
                    ratesLoading
                  }
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
                    <div>
                      <p className="font-semibold text-[#4B2E2E]">
                        Current INR Reference Rates
                      </p>

                      <p className="mt-1 text-sm text-[#8B6B5B]">
                        1 INR equals the values shown below.
                      </p>
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
          icon={
            <Truck size={22} />
          }
          title="Shipping Rules"
          description="Shipping values used during checkout and in customer-facing shipping messages."
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

        <div className="sticky bottom-4 z-20 rounded-3xl border border-[#E8DDD3] bg-white/95 p-4 shadow-xl backdrop-blur">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#8B6B5B]">
              {isDirty
                ? "You have unsaved settings changes."
                : "Your global settings are up to date."}
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={
                  resetForm
                }
                disabled={
                  saving ||
                  !isDirty
                }
                className="rounded-2xl border border-[#D9C6BC] bg-white px-7 py-3 font-semibold text-[#5A2D2D] transition hover:bg-[#FBF7F4] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() =>
                  void saveSettings()
                }
                disabled={
                  saving ||
                  !isDirty
                }
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5A2D2D] px-8 py-3 font-semibold text-white transition hover:bg-[#472323] disabled:cursor-not-allowed disabled:opacity-60"
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
          </div>
        </div>
      </div>
    </main>
  );
}

type SettingsSectionProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
};

function SettingsSection({
  icon,
  title,
  description,
  children,
}: SettingsSectionProps) {
  return (
    <section className="rounded-3xl border border-[#E8DDD3] bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5E7E0] text-[#5A2D2D]">
          {icon}
        </div>

        <div>
          <h2 className="font-serif text-2xl font-semibold text-[#4B2E2E]">
            {title}
          </h2>

          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#8B6B5B]">
              {description}
            </p>
          ) : null}
        </div>
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
  icon?: ReactNode;
};

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  icon,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-[#4B2E2E]"
      >
        {label}
      </label>

      <div className="relative">
        {icon ? (
          <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9A7B70]">
            {icon}
          </div>
        ) : null}

        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className={`w-full rounded-2xl border border-[#E3D3CA] px-4 py-3 text-[#4B2E2E] outline-none transition placeholder:text-[#B59A8E] focus:border-[#5A2D2D] focus:ring-2 focus:ring-[#5A2D2D]/10 ${
            icon
              ? "pl-11"
              : ""
          }`}
        />
      </div>
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
  rows?: number;
  icon?: ReactNode;
};

function TextArea({
  id,
  label,
  value,
  onChange,
  rows = 4,
  icon,
}: TextAreaProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#4B2E2E]"
      >
        {icon}
        {label}
      </label>

      <textarea
        id={id}
        rows={rows}
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

type ImageUploadCardProps = {
  field: ImageField;
  visibleUrl: string;
  selectedFile:
    | File
    | undefined;
  removed: boolean;
  onSelect: (
    event:
      ChangeEvent<HTMLInputElement>
  ) => void;
  onRemove: () => void;
  disabled: boolean;
};

function ImageUploadCard({
  field,
  visibleUrl,
  selectedFile,
  removed,
  onSelect,
  onRemove,
  disabled,
}: ImageUploadCardProps) {
  const details =
    IMAGE_LABELS[field];

  return (
    <article className="overflow-hidden rounded-2xl border border-[#E3D3CA] bg-[#FBF8F5]">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#5A2D2D]">
            <ImageIcon
              size={20}
            />
          </div>

          <div>
            <h3 className="font-semibold text-[#4B2E2E]">
              {details.label}
            </h3>

            <p className="mt-1 text-sm leading-6 text-[#8B6B5B]">
              {details.description}
            </p>
          </div>
        </div>

        <div className="mt-5 flex min-h-40 items-center justify-center overflow-hidden rounded-xl border border-[#E3D3CA] bg-white p-4">
          {visibleUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={visibleUrl}
              alt={`${details.label} preview`}
              className="max-h-36 max-w-full object-contain"
            />
          ) : (
            <div className="text-center text-[#9A7B70]">
              <ImageIcon
                size={34}
                className="mx-auto"
              />

              <p className="mt-3 text-sm">
                {removed
                  ? "Image will be removed when saved"
                  : "No image uploaded"}
              </p>
            </div>
          )}
        </div>

        <p className="mt-3 text-xs leading-5 text-[#8B6B5B]">
          {details.recommended}
        </p>

        {selectedFile ? (
          <p className="mt-2 truncate text-xs font-medium text-[#5A2D2D]">
            Selected:{" "}
            {selectedFile.name}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-[#E3D3CA] bg-white p-4">
        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#5A2D2D] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#472323]">
          <Upload size={17} />

          {visibleUrl
            ? "Replace Image"
            : "Upload Image"}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            disabled={disabled}
            onChange={
              onSelect
            }
            className="sr-only"
          />
        </label>

        {visibleUrl ? (
          <button
            type="button"
            onClick={
              onRemove
            }
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2
              size={17}
            />
            Remove
          </button>
        ) : null}
      </div>
    </article>
  );
}