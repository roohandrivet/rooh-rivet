"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";

import { supabase } from "@/lib/supabase";

type FooterSettings = {
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
  footer_text: string;
  newsletter_heading: string;
  newsletter_description: string;
  newsletter_button_text: string;
  newsletter_disclaimer: string;
  logo_url: string;
  privacy_url: string;
  terms_url: string;
};

type FooterSettingsDatabaseRow = {
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
  footer_text: string | null;
  newsletter_heading: string | null;
  newsletter_description: string | null;
  newsletter_button_text: string | null;
  newsletter_disclaimer: string | null;
  logo_url: string | null;
  privacy_url: string | null;
  terms_url: string | null;
};

type NewsletterResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

const DEFAULT_SETTINGS: FooterSettings = {
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
  privacy_url: "/privacy",
  terms_url: "/terms",
};

function normaliseExternalUrl(
  value: string
): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function normaliseInstagramUrl(
  value: string
): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }

  if (
    trimmed.startsWith("@")
  ) {
    const username =
      trimmed.slice(1).trim();

    return username
      ? `https://www.instagram.com/${username}/`
      : "";
  }

  if (
    trimmed.includes(
      "instagram.com"
    )
  ) {
    return `https://${trimmed}`;
  }

  return `https://www.instagram.com/${trimmed.replace(
    /^\/+|\/+$/g,
    ""
  )}/`;
}

function normaliseWhatsAppUrl(
  value: string
): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  if (
    trimmed.startsWith("https://") ||
    trimmed.startsWith("http://")
  ) {
    return trimmed;
  }

  const digits =
    trimmed.replace(
      /\D/g,
      ""
    );

  return digits
    ? `https://wa.me/${digits}`
    : "";
}

function normalisePhoneLink(
  value: string
): string {
  return value.replace(
    /[^\d+]/g,
    ""
  );
}

function mapSettings(
  row:
    | FooterSettingsDatabaseRow
    | null
): FooterSettings {
  return {
    store_name:
      row?.store_name?.trim() ||
      DEFAULT_SETTINGS.store_name,
    tagline:
      row?.tagline?.trim() ||
      DEFAULT_SETTINGS.tagline,
    whatsapp:
      row?.whatsapp?.trim() ||
      DEFAULT_SETTINGS.whatsapp,
    instagram:
      row?.instagram?.trim() ||
      DEFAULT_SETTINGS.instagram,
    email:
      row?.email?.trim() ||
      DEFAULT_SETTINGS.email,
    phone:
      row?.phone?.trim() ||
      DEFAULT_SETTINGS.phone,
    address:
      row?.address?.trim() ||
      DEFAULT_SETTINGS.address,
    facebook_url:
      row?.facebook_url?.trim() ||
      DEFAULT_SETTINGS.facebook_url,
    x_url:
      row?.x_url?.trim() ||
      DEFAULT_SETTINGS.x_url,
    youtube_url:
      row?.youtube_url?.trim() ||
      DEFAULT_SETTINGS.youtube_url,
    linkedin_url:
      row?.linkedin_url?.trim() ||
      DEFAULT_SETTINGS.linkedin_url,
    pinterest_url:
      row?.pinterest_url?.trim() ||
      DEFAULT_SETTINGS.pinterest_url,
    footer_text:
      row?.footer_text?.trim() ||
      DEFAULT_SETTINGS.footer_text,
    newsletter_heading:
      row?.newsletter_heading?.trim() ||
      DEFAULT_SETTINGS.newsletter_heading,
    newsletter_description:
      row?.newsletter_description?.trim() ||
      DEFAULT_SETTINGS.newsletter_description,
    newsletter_button_text:
      row?.newsletter_button_text?.trim() ||
      DEFAULT_SETTINGS.newsletter_button_text,
    newsletter_disclaimer:
      row?.newsletter_disclaimer?.trim() ||
      DEFAULT_SETTINGS.newsletter_disclaimer,
    logo_url:
      row?.logo_url?.trim() ||
      DEFAULT_SETTINGS.logo_url,
    privacy_url:
      row?.privacy_url?.trim() ||
      DEFAULT_SETTINGS.privacy_url,
    terms_url:
      row?.terms_url?.trim() ||
      DEFAULT_SETTINGS.terms_url,
  };
}

export default function Footer() {
  const [
    settings,
    setSettings,
  ] = useState<FooterSettings>(
    DEFAULT_SETTINGS
  );

  const [email, setEmail] =
    useState("");

  const [
    subscribing,
    setSubscribing,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings():
      Promise<void> {
      const {
        data,
        error:
          settingsError,
      } = await supabase
        .from("settings")
        .select(
          `
            store_name,
            tagline,
            whatsapp,
            instagram,
            email,
            phone,
            address,
            facebook_url,
            x_url,
            youtube_url,
            linkedin_url,
            pinterest_url,
            footer_text,
            newsletter_heading,
            newsletter_description,
            newsletter_button_text,
            newsletter_disclaimer,
            logo_url,
            privacy_url,
            terms_url
          `
        )
        .eq(
          "setting_key",
          "store"
        )
        .maybeSingle();

      if (
        settingsError
      ) {
        console.error(
          "Failed to load footer settings:",
          settingsError
        );
        return;
      }

      if (
        active
      ) {
        setSettings(
          mapSettings(
            data as
              | FooterSettingsDatabaseRow
              | null
          )
        );
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const whatsappUrl =
    useMemo(
      () =>
        normaliseWhatsAppUrl(
          settings.whatsapp
        ),
      [settings.whatsapp]
    );

  const socialLinks =
    useMemo(
      () =>
        [
          {
            label: "Instagram",
            href:
              normaliseInstagramUrl(
                settings.instagram
              ),
            icon:
              FaInstagram,
          },
          {
            label: "Facebook",
            href:
              normaliseExternalUrl(
                settings.facebook_url
              ),
            icon:
              FaFacebookF,
          },
          {
            label: "X",
            href:
              normaliseExternalUrl(
                settings.x_url
              ),
            icon:
              FaXTwitter,
          },
          {
            label: "YouTube",
            href:
              normaliseExternalUrl(
                settings.youtube_url
              ),
            icon:
              FaYoutube,
          },
          {
            label: "LinkedIn",
            href:
              normaliseExternalUrl(
                settings.linkedin_url
              ),
            icon:
              FaLinkedinIn,
          },
          {
            label: "Pinterest",
            href:
              normaliseExternalUrl(
                settings.pinterest_url
              ),
            icon:
              FaPinterestP,
          },
        ].filter(
          (item) =>
            item.href.length >
            0
        ),
      [
        settings.facebook_url,
        settings.instagram,
        settings.linkedin_url,
        settings.pinterest_url,
        settings.x_url,
        settings.youtube_url,
      ]
    );

  async function handleSubscribe(
    event:
      FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    if (
      subscribing
    ) {
      return;
    }

    const normalisedEmail =
      email
        .trim()
        .toLowerCase();

    if (
      !normalisedEmail
    ) {
      setError(
        "Enter your email address."
      );
      setSuccess("");
      return;
    }

    setSubscribing(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          "/api/newsletter",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                email:
                  normalisedEmail,
                source:
                  "footer",
              }),
          }
        );

      const result =
        (await response.json()) as NewsletterResponse;

      if (
        !response.ok
      ) {
        throw new Error(
          result.error ||
            "Unable to subscribe right now."
        );
      }

      setEmail("");
      setSuccess(
        result.message ||
          "Thank you for subscribing."
      );
    } catch (
      subscribeError:
        unknown
    ) {
      console.error(
        "Newsletter subscription failed:",
        subscribeError
      );

      setError(
        subscribeError instanceof
          Error
          ? subscribeError.message
          : "Unable to subscribe right now."
      );
    } finally {
      setSubscribing(false);
    }
  }

  return (
    <footer className="mt-20 bg-[#5A2D2D] text-[#F8F4EF]">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="text-center">
          {settings.logo_url ? (
            <div className="mx-auto mb-7 flex max-w-xs justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={
                  settings.logo_url
                }
                alt={`${settings.store_name} logo`}
                className="max-h-24 max-w-full object-contain"
              />
            </div>
          ) : null}

          <h2 className="font-serif text-5xl">
            {settings.store_name}
          </h2>

          {settings.tagline ? (
            <p className="mt-3 text-sm uppercase tracking-[6px] text-[#D8C2B6]">
              {settings.tagline}
            </p>
          ) : null}

          {settings.footer_text ? (
            <p className="mx-auto mt-8 max-w-2xl whitespace-pre-line leading-8 text-[#E8DDD3]">
              {settings.footer_text}
            </p>
          ) : null}
        </div>

        <section className="mx-auto mt-12 max-w-3xl rounded-[28px] border border-white/15 bg-white/5 p-6 text-center backdrop-blur sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Mail size={24} />
          </div>

          <h3 className="mt-5 font-serif text-3xl">
            {
              settings.newsletter_heading
            }
          </h3>

          {settings.newsletter_description ? (
            <p className="mx-auto mt-3 max-w-xl whitespace-pre-line leading-7 text-[#E8DDD3]">
              {
                settings.newsletter_description
              }
            </p>
          ) : null}

          <form
            onSubmit={
              handleSubscribe
            }
            className="mx-auto mt-7 flex max-w-2xl flex-col gap-3 sm:flex-row"
          >
            <label
              htmlFor="newsletter-email"
              className="sr-only"
            >
              Email address
            </label>

            <input
              id="newsletter-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(
                event
              ) => {
                setEmail(
                  event.target.value
                );
                setError("");
                setSuccess("");
              }}
              placeholder="Enter your email address"
              disabled={
                subscribing
              }
              className="min-w-0 flex-1 rounded-full border border-white/20 bg-white px-6 py-4 text-[#4B2E2E] outline-none transition placeholder:text-[#9B8580] focus:border-[#E6CAC0] disabled:cursor-not-allowed disabled:opacity-70"
            />

            <button
              type="submit"
              disabled={
                subscribing
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F8F4EF] px-7 py-4 font-semibold text-[#5A2D2D] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {subscribing ? (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Mail size={18} />
              )}

              {subscribing
                ? "Subscribing..."
                : settings.newsletter_button_text}
            </button>
          </form>

          {error ? (
            <p className="mt-4 text-sm text-[#FFD6D6]">
              {error}
            </p>
          ) : null}

          {success ? (
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#D8F3DE]">
              <CheckCircle2
                size={17}
              />

              <span>
                {success}
              </span>
            </div>
          ) : null}

          {settings.newsletter_disclaimer ? (
            <p className="mt-4 whitespace-pre-line text-xs leading-5 text-[#D8C2B6]">
              {
                settings.newsletter_disclaimer
              }
            </p>
          ) : null}
        </section>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_auto_1fr]">
          <div className="text-center lg:text-left">
            <h3 className="font-serif text-2xl">
              Explore
            </h3>

            <div className="mt-5 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm uppercase tracking-[2px] lg:justify-start">
              <Link
                href="/"
                className="transition hover:text-white"
              >
                Home
              </Link>

              <Link
                href="/shop"
                className="transition hover:text-white"
              >
                Shop
              </Link>

              <Link
                href="/about"
                className="transition hover:text-white"
              >
                About
              </Link>

              <Link
                href="/contact"
                className="transition hover:text-white"
              >
                Contact
              </Link>
            </div>
          </div>

          <div className="hidden w-px bg-white/15 lg:block" />

          <div className="text-center lg:text-right">
            <h3 className="font-serif text-2xl">
              Contact
            </h3>

            <div className="mt-5 space-y-3 text-sm text-[#E8DDD3]">
              {settings.email ? (
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center justify-center gap-2 transition hover:text-white lg:justify-end"
                >
                  <Mail
                    size={16}
                  />
                  {
                    settings.email
                  }
                </a>
              ) : null}

              {settings.phone ? (
                <a
                  href={`tel:${normalisePhoneLink(
                    settings.phone
                  )}`}
                  className="flex items-center justify-center gap-2 transition hover:text-white lg:justify-end"
                >
                  <Phone
                    size={16}
                  />
                  {
                    settings.phone
                  }
                </a>
              ) : null}

              {settings.address ? (
                <p className="flex items-start justify-center gap-2 whitespace-pre-line leading-6 lg:justify-end">
                  <MapPin
                    size={16}
                    className="mt-1 shrink-0"
                  />
                  <span>
                    {
                      settings.address
                    }
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {whatsappUrl ||
        socialLinks.length >
          0 ? (
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            {whatsappUrl ? (
              <a
                href={
                  whatsappUrl
                }
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-[#D8C2B6] px-6 py-3 font-medium transition hover:bg-[#6B3737]"
              >
                <FaWhatsapp
                  size={19}
                />
                Chat on WhatsApp
              </a>
            ) : null}

            {socialLinks.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <a
                    key={
                      item.label
                    }
                    href={
                      item.href
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={
                      item.label
                    }
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 transition hover:bg-white hover:text-[#5A2D2D]"
                  >
                    <Icon
                      size={18}
                    />
                  </a>
                );
              }
            )}
          </div>
        ) : null}

        <div className="my-12 border-t border-[#7A4A4A]" />

        <div className="flex flex-col items-center justify-between gap-5 text-center md:flex-row">
          <p className="text-sm text-[#D8C2B6]">
            ©{" "}
            {new Date().getFullYear()}{" "}
            {settings.store_name}. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              href={
                settings.privacy_url
              }
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              Privacy Policy
              {settings.privacy_url.startsWith(
                "http"
              ) ? (
                <ExternalLink
                  size={14}
                />
              ) : null}
            </Link>

            <Link
              href={
                settings.terms_url
              }
              className="inline-flex items-center gap-1.5 transition hover:text-white"
            >
              Terms & Conditions
              {settings.terms_url.startsWith(
                "http"
              ) ? (
                <ExternalLink
                  size={14}
                />
              ) : null}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}